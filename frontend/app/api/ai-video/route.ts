import { randomUUID } from "node:crypto"
import { promises as fs } from "node:fs"
import os from "node:os"
import path from "node:path"
import { spawn } from "node:child_process"
import { sql } from "drizzle-orm"
import { NextResponse } from "next/server"
import { UTApi } from "uploadthing/server"
import { db } from "@/config/db"
import { libraryItems } from "@/db/schema"
import { getCurrentSession } from "@/lib/auth/session"
import { createAiVideoSchema } from "@/lib/validations/ai-video"

export const runtime = "nodejs"

// ─── Types ────────────────────────────────────────────────────────────────────

type GeminiVideoMetadata = {
  title: string
  description: string
  genre: SuggestedGenre
  tags: string[]
}

type SuggestedGenre = "Sad" | "Chill" | "Romantic" | "Relaxing" | "Party" | "Focus"

// ─── Constants ────────────────────────────────────────────────────────────────

const utapi = new UTApi()
const VIDEO_DURATION_SECONDS = 26

const GEMINI_METADATA_MODELS = [
  "gemini-2.5-flash-preview-04-17",
  "gemini-2.0-flash",
  "gemini-1.5-pro",
] as const

const GENRE_OPTIONS: SuggestedGenre[] = ["Sad", "Chill", "Romantic", "Relaxing", "Party", "Focus"]
const HUGGINGFACE_MUSIC_MODELS = [
  "facebook/musicgen-small",
  "facebook/musicgen-stereo-small",
  "facebook/musicgen-medium",
] as const

// ─── Utilities ────────────────────────────────────────────────────────────────

function isMissingColumnError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false
  const e = error as { message?: string; code?: string; sqlMessage?: string; cause?: unknown }
  const msg = (e.message || "").toLowerCase()
  const sqlMsg = (e.sqlMessage || "").toLowerCase()
  if ((e.code || "").toUpperCase() === "ER_BAD_FIELD_ERROR") return true
  if (msg.includes("unknown column") || sqlMsg.includes("unknown column")) return true
  if (e.cause && e.cause !== error) return isMissingColumnError(e.cause)
  return false
}

async function runFfmpeg(args: string[]): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn("ffmpeg", args)
    let stderr = ""
    child.stderr.on("data", (chunk: Buffer) => { stderr += chunk.toString() })
    child.on("error", reject)
    child.on("close", (code) => {
      if (code !== 0) { reject(new Error(stderr || "ffmpeg failed")); return }
      resolve()
    })
  })
}

function extractJsonObject(text: string): string {
  const start = text.indexOf("{")
  const end = text.lastIndexOf("}")
  if (start === -1 || end === -1 || end < start) throw new Error("No JSON found in Gemini response")
  return text.slice(start, end + 1)
}

function inferGenreFromMetadata(
  tags: string[],
  mood: "Chill" | "Focus" | "Rain",
  description: string,
): SuggestedGenre {
  const n = `${tags.join(" ")} ${description}`.toLowerCase()
  if (n.includes("sad") || n.includes("melancholy")) return "Sad"
  if (n.includes("romantic") || n.includes("love")) return "Romantic"
  if (n.includes("party") || n.includes("dance") || n.includes("energetic")) return "Party"
  if (n.includes("focus") || mood === "Focus") return "Focus"
  if (n.includes("relax") || n.includes("calm")) return "Relaxing"
  return "Chill"
}

function fallbackMetadata(prompt: string, mood: "Chill" | "Focus" | "Rain"): GeminiVideoMetadata {
  return {
    title: `${mood} Visual - ${prompt.slice(0, 50)}`,
    description: `AI generated ${mood.toLowerCase()} ambient video based on: ${prompt}.`,
    genre: mood === "Focus" ? "Focus" : mood === "Rain" ? "Relaxing" : "Chill",
    tags: [mood.toLowerCase(), "ai-video", "ambient", "lofi"],
  }
}

async function generateAiImage(prompt: string, outputImagePath: string): Promise<"gemini-image" | "fallback-image"> {
  const apiKey = process.env.GEMINI_API_KEY
  const visualStyles = [
    "cinematic night city lights",
    "dreamy neon rain ambience",
    "sunset retro anime landscape",
    "moody cyberpunk skyline",
    "lofi cozy room with window rain",
    "minimal abstract light trails",
  ]
  const randomStyle = visualStyles[Math.floor(Math.random() * visualStyles.length)]

  if (apiKey) {
    const imageModels = ["gemini-2.0-flash-preview-image-generation", "gemini-2.0-flash-exp-image-generation"]

    for (const model of imageModels) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [
                    {
                      text:
                        "Create a cinematic, high-quality 16:9 background image for this music scene. " +
                        `Visual style: ${randomStyle}. ` +
                        "No text, no logos, no watermark. Scene: " +
                        prompt,
                    },
                  ],
                },
              ],
              generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
            }),
          },
        )

        if (!res.ok) continue

        const payload = (await res.json()) as {
          candidates?: Array<{
            content?: {
              parts?: Array<{
                inlineData?: { mimeType?: string; data?: string }
              }>
            }
          }>
        }

        const parts = payload.candidates?.[0]?.content?.parts || []
        const imagePart = parts.find((part) => {
          const mime = part.inlineData?.mimeType || ""
          return mime.startsWith("image/") && !!part.inlineData?.data
        })

        const b64 = imagePart?.inlineData?.data
        if (b64) {
          await fs.writeFile(outputImagePath, Buffer.from(b64, "base64"))
          return "gemini-image"
        }
      } catch {
        continue
      }
    }
  }

  // Free AI image fallback (no API key required) when Gemini image output is unavailable.
  try {
    const pollinationsUrl =
      `https://image.pollinations.ai/prompt/${encodeURIComponent(
        `${randomStyle}, cinematic 16:9 music visual, high quality, no text, no logo: ${prompt}`,
      )}?width=1280&height=720&nologo=true`

    const response = await fetch(pollinationsUrl)
    if (response.ok) {
      const contentType = (response.headers.get("content-type") || "").toLowerCase()
      if (!contentType.startsWith("image/")) throw new Error("Pollinations returned non-image content")
      const bytes = Buffer.from(await response.arrayBuffer())
      if (bytes.length > 0) {
        await fs.writeFile(outputImagePath, bytes)
        return "fallback-image"
      }
    }
  } catch {
    // continue to solid-color fallback below
  }

  // Backup random image source (no key) for environments where the first source is blocked.
  try {
    const picsumSeed = encodeURIComponent(`${Date.now()}-${Math.random()}-${prompt.slice(0, 30)}`)
    const picsumUrl = `https://picsum.photos/seed/${picsumSeed}/1280/720`
    const response = await fetch(picsumUrl, { redirect: "follow" })
    if (response.ok) {
      const contentType = (response.headers.get("content-type") || "").toLowerCase()
      if (!contentType.startsWith("image/")) throw new Error("Picsum returned non-image content")
      const bytes = Buffer.from(await response.arrayBuffer())
      if (bytes.length > 0) {
        await fs.writeFile(outputImagePath, bytes)
        return "fallback-image"
      }
    }
  } catch {
    // continue to local random frame fallback below
  }

  const randomHex = `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0")}`
  await runFfmpeg([
    "-y",
    "-f",
    "lavfi",
    "-i",
    `color=c=${randomHex}:s=1280x720`,
    "-vf",
    "noise=alls=28:allf=t+u,eq=saturation=1.3:contrast=1.05:brightness=0.02",
    "-frames:v",
    "1",
    outputImagePath,
  ])

  return "fallback-image"
}

async function createMp4FromImageAndAudio(imagePath: string, audioPath: string, outputMp4Path: string): Promise<void> {
  await runFfmpeg([
    "-y",
    "-loop",
    "1",
    "-i",
    imagePath,
    "-i",
    audioPath,
    "-c:v",
    "libx264",
    "-tune",
    "stillimage",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-pix_fmt",
    "yuv420p",
    "-shortest",
    outputMp4Path,
  ])
}

async function uploadGeneratedFile(filePath: string, fileName: string, mimeType: string): Promise<string> {
  const fileBuffer = await fs.readFile(filePath)

  try {
    const upload = await utapi.uploadFiles(new File([fileBuffer], fileName, { type: mimeType }))
    const result = Array.isArray(upload) ? upload[0] : upload
    if (result && !result.error && result.data) {
      return result.data.ufsUrl || result.data.url
    }
  } catch {
    // Fallback to local file path in dev/runtime environments where UploadThing is not configured.
  }

  const publicDir = path.join(process.cwd(), "public", "generated")
  await fs.mkdir(publicDir, { recursive: true })
  const safeName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`
  const outPath = path.join(publicDir, safeName)
  await fs.copyFile(filePath, outPath)
  return `/generated/${safeName}`
}

// ─── Metadata generation ──────────────────────────────────────────────────────

async function generateMetadata(
  prompt: string,
  mood: "Chill" | "Focus" | "Rain",
): Promise<{ metadata: GeminiVideoMetadata; modelUsed: string }> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return { metadata: fallbackMetadata(prompt, mood), modelUsed: "fallback-no-key" }

  for (const model of GEMINI_METADATA_MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: `Generate metadata for an ambient AI video.
Return JSON only with this exact shape:
{"title":"string","description":"string","genre":"Sad|Chill|Romantic|Relaxing|Party|Focus","tags":["tag1","tag2","tag3"]}
Prompt: ${prompt}
Mood: ${mood}`,
                  },
                ],
              },
            ],
            generationConfig: { temperature: 0.5, maxOutputTokens: 300, responseMimeType: "application/json" },
          }),
        },
      )

      if (!res.ok) continue

      const payload = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
      }

      const rawText = payload.candidates?.[0]?.content?.parts?.[0]?.text
      if (!rawText) continue

      const parsed = JSON.parse(extractJsonObject(rawText)) as GeminiVideoMetadata
      const title = (parsed.title || "").trim().slice(0, 255)
      const description = (parsed.description || "").trim().slice(0, 1024)
      const parsedGenre = String(parsed.genre || "").trim() as SuggestedGenre
      const tags = Array.isArray(parsed.tags)
        ? parsed.tags.map((t) => String(t).trim()).filter(Boolean).slice(0, 8)
        : []
      const genre = GENRE_OPTIONS.includes(parsedGenre)
        ? parsedGenre
        : inferGenreFromMetadata(tags, mood, description)

      if (!title || !description) continue

      return {
        metadata: {
          title,
          description,
          genre,
          tags: tags.length > 0 ? tags : [mood.toLowerCase(), "ai-video", "ambient", "lofi"],
        },
        modelUsed: model,
      }
    } catch {
      continue
    }
  }

  return { metadata: fallbackMetadata(prompt, mood), modelUsed: "fallback-local" }
}

async function improveMusicPromptWithGemini(originalPrompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return originalPrompt

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text:
                    "Rewrite this into a short, descriptive prompt for AI music generation. " +
                    "Focus on mood, instruments, style, and atmosphere. Return only the improved prompt.\n\n" +
                    `User prompt: ${originalPrompt}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 120,
          },
        }),
      },
    )

    if (!response.ok) return originalPrompt

    const payload = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
    }
    const improved = payload.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    if (!improved) return originalPrompt
    return improved.slice(0, 300)
  } catch {
    return originalPrompt
  }
}

async function generateMusicWithHuggingFace(userPrompt: string): Promise<Buffer> {
  const apiKey = process.env.HUGGINGFACE_API_KEY
  if (!apiKey) {
    throw Object.assign(new Error("Missing HuggingFace API Key"), { status: 400, code: "MISSING_HF_KEY" })
  }

  const endpointUrl = process.env.HUGGINGFACE_ENDPOINT_URL?.trim()
  let lastError = ""
  let lastStatus = 502

  const candidateUrls = endpointUrl
    ? [endpointUrl]
    : HUGGINGFACE_MUSIC_MODELS.map((model) => `https://router.huggingface.co/hf-inference/models/${model}`)

  for (const url of candidateUrls) {

    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "audio/*",
        },
        body: JSON.stringify({ inputs: userPrompt }),
      })

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "")
        lastStatus = response.status || 502
        lastError = errorBody || `Hugging Face request failed (${response.status})`

        // Retry once when model is warming up on provider.
        if (response.status === 503 && attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 2500))
          continue
        }

        break
      }

      const contentType = (response.headers.get("content-type") || "").toLowerCase()
      if (contentType.includes("application/json")) {
        lastStatus = 502
        lastError = await response.text().catch(() => "Hugging Face returned JSON instead of audio")
        break
      }

      const audioBytes = Buffer.from(await response.arrayBuffer())
      if (audioBytes.length) return audioBytes

      lastStatus = 502
      lastError = "Hugging Face returned empty audio"
      break
    }
  }

  throw Object.assign(
    new Error(
      lastStatus === 404
        ? endpointUrl
          ? "Hugging Face endpoint URL was not found. Verify HUGGINGFACE_ENDPOINT_URL."
          : "Hugging Face music model route was not found for your account/provider. Try again later or use a dedicated Inference Endpoint."
        : (lastError || "Hugging Face music generation failed"),
    ),
    { status: lastStatus === 404 ? 502 : lastStatus, code: "HF_GENERATION_FAILED" },
  )
}

function generateLocalFallbackMusic(prompt: string): Buffer {
  const sampleRate = 44_100
  const seconds = 26
  const count = sampleRate * seconds
  const pcm = Buffer.alloc(count * 2)

  let seed = 0
  for (let i = 0; i < prompt.length; i++) seed = (seed * 31 + prompt.charCodeAt(i)) >>> 0
  const roots = [98, 110, 123.47, 130.81, 146.83, 164.81, 174.61]
  const root = roots[seed % roots.length]
  const bpm = 72 + (seed % 8)
  const beat = 60 / bpm
  const bar = beat * 4
  const progression = [1, 0.75, 1.125, 0.84]

  for (let i = 0; i < count; i++) {
    const t = i / sampleRate
    const globalEnv = t < 1.5 ? t / 1.5 : t > seconds - 2.5 ? Math.max(0, (seconds - t) / 2.5) : 1

    const barIdx = Math.floor(t / bar) % progression.length
    const chordRoot = root * progression[barIdx]
    const third = chordRoot * 1.2599
    const fifth = chordRoot * 1.4983

    // soft pad chord
    const pad =
      0.12 * Math.sin(2 * Math.PI * chordRoot * t) +
      0.08 * Math.sin(2 * Math.PI * third * t + 0.3) +
      0.07 * Math.sin(2 * Math.PI * fifth * t + 0.5)

    // mellow bass (sidechained by kick)
    const bassFreq = chordRoot / 2
    const bass = 0.18 * Math.sin(2 * Math.PI * bassFreq * t)

    // kick every beat: short decaying sine sweep
    const beatPhase = t % beat
    const kickEnv = Math.exp(-beatPhase * 24)
    const kickFreq = 90 - 50 * Math.min(1, beatPhase * 8)
    const kick = 0.22 * kickEnv * Math.sin(2 * Math.PI * kickFreq * t)

    // snare on beats 2 and 4
    const barPhase = t % bar
    const snareHit1 = Math.abs(barPhase - beat) < 0.06
    const snareHit2 = Math.abs(barPhase - beat * 3) < 0.06
    const snareGate = snareHit1 || snareHit2 ? 1 : 0
    const noise = ((Math.sin((i + seed) * 12.9898) * 43758.5453) % 1) * 2 - 1
    const snare = 0.08 * snareGate * noise * Math.exp(-((barPhase % beat) * 35))

    // soft hat every half beat
    const halfBeat = beat / 2
    const hatPhase = t % halfBeat
    const hat = 0.03 * Math.exp(-hatPhase * 80) * Math.sign(Math.sin(2 * Math.PI * 6000 * t))

    const sidechain = 1 - Math.min(0.4, kickEnv * 0.5)
    const sig = (pad + bass * sidechain + snare + hat + kick) * globalEnv
    const sample = Math.max(-1, Math.min(1, Math.tanh(sig * 1.4)))
    pcm.writeInt16LE(Math.round(sample * 32767), i * 2)
  }

  const bitsPerSample = 16
  const channels = 1
  const blockAlign = channels * (bitsPerSample / 8)
  const byteRate = sampleRate * blockAlign
  const header = Buffer.alloc(44)
  header.write("RIFF", 0)
  header.writeUInt32LE(36 + pcm.length, 4)
  header.write("WAVE", 8)
  header.write("fmt ", 12)
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20)
  header.writeUInt16LE(channels, 22)
  header.writeUInt32LE(sampleRate, 24)
  header.writeUInt32LE(byteRate, 28)
  header.writeUInt16LE(blockAlign, 32)
  header.writeUInt16LE(bitsPerSample, 34)
  header.write("data", 36)
  header.writeUInt32LE(pcm.length, 40)

  return Buffer.concat([header, pcm])
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession()
    const body = await request.json()
    const parsedInput = createAiVideoSchema.safeParse(body)

    if (!parsedInput.success) {
      return NextResponse.json(
        { error: "Validation failed", fieldErrors: parsedInput.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    if (!process.env.HUGGINGFACE_API_KEY) {
      return NextResponse.json(
        { success: false, error: "Missing HuggingFace API Key" },
        { status: 400 },
      )
    }

    const { prompt, mood, uploadToLibrary } = parsedInput.data
    const improvedPrompt = await improveMusicPromptWithGemini(prompt)
    const { metadata, modelUsed: metadataModel } = await generateMetadata(prompt, mood)
    let audioModelUsed = "hf-musicgen"
    let audioBuffer: Buffer
    try {
      audioBuffer = await generateMusicWithHuggingFace(improvedPrompt)
    } catch {
      audioBuffer = generateLocalFallbackMusic(improvedPrompt)
      audioModelUsed = "local-fallback"
    }

    const itemId = randomUUID()
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "ai-video-"))
    const audioPath = path.join(tempDir, `${itemId}.audio`)
    const imagePath = path.join(tempDir, `${itemId}.png`)
    const mp4Path = path.join(tempDir, `${itemId}.mp4`)

    let imageModelUsed: "gemini-image" | "fallback-image" = "fallback-image"
    let mediaUrl = ""

    try {
      await fs.writeFile(audioPath, audioBuffer)
      imageModelUsed = await generateAiImage(improvedPrompt, imagePath)
      await createMp4FromImageAndAudio(imagePath, audioPath, mp4Path)
      mediaUrl = await uploadGeneratedFile(mp4Path, `ai-video-${itemId}.mp4`, "video/mp4")
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true })
    }

    const createdAt = new Date()
    const shouldSaveToLibrary = Boolean(uploadToLibrary)

    if (shouldSaveToLibrary) {
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      try {
        await db.insert(libraryItems).values({
          id: itemId,
          userId: session.userId,
          title: metadata.title,
          description: metadata.description,
          tags: metadata.tags.join(","),
          theme: "AI",
          mood,
          songName: null,
          thumbnailUrl: null,
          videoUrl: mediaUrl,
          rating: 0,
          isInLibrary: 1,
        })
      } catch (dbError) {
        if (!isMissingColumnError(dbError)) throw dbError

        await db.execute(sql`
          INSERT INTO library_items (
            id,
            user_id,
            title,
            theme,
            mood,
            song_name,
            thumbnail_url,
            video_url,
            rating
          ) VALUES (
            ${itemId},
            ${session.userId},
            ${metadata.title},
            ${"AI"},
            ${mood},
            ${null},
            ${null},
            ${mediaUrl},
            ${0}
          )
        `)
      }
    }

    return NextResponse.json({
      item: {
        id: itemId,
        title: metadata.title,
        description: metadata.description,
        genre: metadata.genre,
        tags: metadata.tags,
        promptEcho: prompt,
        modelUsed: `${audioModelUsed}|${imageModelUsed}|${metadataModel}`,
        mood,
        videoUrl: mediaUrl,
        isInLibrary: shouldSaveToLibrary,
        createdAt: createdAt.toISOString(),
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to process request"
    const status =
      typeof (error as { status?: unknown })?.status === "number"
        ? (error as { status: number }).status
        : 500
    return NextResponse.json({ success: false, error: message }, { status })
  }
}