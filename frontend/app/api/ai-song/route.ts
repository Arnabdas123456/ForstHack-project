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
import { inferExtensionFromMimeType } from "@/lib/media"
import { createAiSongSchema } from "@/lib/validations/ai-song"

export const runtime = "nodejs"

type SuggestedGenre = "Sad" | "Chill" | "Romantic" | "Relaxing" | "Party" | "Focus"
type SongLanguage = "English" | "Hindi" | "Bengali"
type SongStyle = "Romantic" | "Happy" | "Sad"

type GeminiSongMetadata = {
  title: string
  description: string
  genre: SuggestedGenre
  tags: string[]
}

type HuggingFaceAudioResult = {
  audioBuffer: Buffer
  mimeType: string
  extension: string
  modelUsed: string
}

const utapi = new UTApi()

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
  "facebook/musicgen-melody",
] as const

const DEFAULT_TTS_MODELS_BY_LANGUAGE: Record<SongLanguage, string[]> = {
  English: ["facebook/mms-tts-eng"],
  Hindi: ["facebook/mms-tts-hin"],
  Bengali: ["facebook/mms-tts-ben"],
}

const SONG_LANGUAGE_CODE: Record<SongLanguage, string> = {
  English: "en",
  Hindi: "hi",
  Bengali: "bn",
}

const STYLE_VISUAL_HINTS: Record<SongStyle, string> = {
  Romantic: "cinematic romantic golden-hour skyline, dreamy bokeh, emotional warm lights",
  Happy: "bright colorful city lights, energetic upbeat, joyful festive atmosphere",
  Sad: "rainy midnight streets, moody blue cinematic atmosphere, emotional melancholic scene",
}

const STYLE_FALLBACK_COLORS: Record<SongStyle, { primary: string; secondary: string }> = {
  Romantic: { primary: "#2a153b", secondary: "#ff6a88" },
  Happy: { primary: "#15315f", secondary: "#ffb347" },
  Sad: { primary: "#0f172e", secondary: "#3a5f9f" },
}

const STYLE_MUSIC_HINTS: Record<SongStyle, string> = {
  Romantic: "warm strings, soft piano, gentle percussion, expressive melody, emotional chorus",
  Happy: "upbeat drums, bright synth hooks, energetic rhythm, catchy chorus, danceable groove",
  Sad: "minor-key piano, atmospheric pads, slow emotional tempo, melancholic melodic progression",
}

const LANGUAGE_MUSIC_HINTS: Record<SongLanguage, string> = {
  English: "modern pop song feel, clear vocal lead aesthetics",
  Hindi: "bollywood-inspired arrangement, tabla accents, expressive melodic phrasing",
  Bengali: "bengali contemporary melody style, lyrical emotional phrasing, soft folk-pop touch",
}

function normalizeSongStyle(style: string | undefined | null): SongStyle {
  if (style === "Romantic" || style === "Happy" || style === "Sad") return style
  return "Romantic"
}

function getHuggingFaceMusicModels(): string[] {
  const configured = process.env.HUGGINGFACE_MUSIC_MODELS
    ?.split(",")
    .map((value) => value.trim())
    .filter(Boolean)

  if (configured && configured.length > 0) {
    return configured
  }

  return [...HUGGINGFACE_MUSIC_MODELS]
}

function getHuggingFaceRouterUrls(model: string): string[] {
  return [`https://router.huggingface.co/hf-inference/models/${model}`]
}

function getHuggingFaceTtsModels(language: SongLanguage): string[] {
  const configured = process.env.HUGGINGFACE_TTS_MODELS
    ?.split(",")
    .map((value) => value.trim())
    .filter(Boolean)

  if (configured && configured.length > 0) {
    return configured
  }

  return DEFAULT_TTS_MODELS_BY_LANGUAGE[language]
}

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
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString()
    })
    child.on("error", reject)
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr || "ffmpeg failed"))
        return
      }
      resolve()
    })
  })
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

async function generateAiImage(
  prompt: string,
  songStyle: SongStyle,
  outputImagePath: string,
): Promise<"gemini-image" | "fallback-image"> {
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
  const styleHint = STYLE_VISUAL_HINTS[songStyle]

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
                        `Mood style: ${styleHint}. ` +
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

  try {
    const pollinationsUrl =
      `https://image.pollinations.ai/prompt/${encodeURIComponent(
        `${randomStyle}, ${styleHint}, cinematic 16:9 music visual, high quality, no text, no logo: ${prompt}`,
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
    // continue to local fallback below
  }

  const palette = STYLE_FALLBACK_COLORS[songStyle]
  await runFfmpeg([
    "-y",
    "-f",
    "lavfi",
    "-i",
    `color=c=${palette.primary}:s=1280x720`,
    "-f",
    "lavfi",
    "-i",
    `color=c=${palette.secondary}:s=1280x720`,
    "-filter_complex",
    "[0:v][1:v]blend=all_mode=overlay:all_opacity=0.38," +
      "gblur=sigma=22,eq=saturation=1.26:contrast=1.06:brightness=0.02," +
      "vignette=PI/5,noise=alls=10:allf=t+u",
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
    "-framerate",
    "30",
    "-i",
    imagePath,
    "-i",
    audioPath,
    "-filter_complex",
    "[0:v]scale=1600:900,zoompan=z='min(zoom+0.00075,1.18)':" +
      "x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1280x720:fps=30," +
      "eq=saturation=1.18:contrast=1.08:brightness=0.02,noise=alls=4:allf=t+u[v]",
    "-map",
    "[v]",
    "-map",
    "1:a",
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-movflags",
    "+faststart",
    "-pix_fmt",
    "yuv420p",
    "-shortest",
    outputMp4Path,
  ])
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

function fallbackMetadataForStyle(
  prompt: string,
  mood: "Chill" | "Focus" | "Rain",
  songStyle: SongStyle,
): GeminiSongMetadata {
  const styleSuffix = songStyle.toLowerCase()
  const genre: SuggestedGenre =
    songStyle === "Romantic"
      ? "Romantic"
      : songStyle === "Sad"
        ? "Sad"
        : mood === "Focus"
          ? "Focus"
          : "Party"

  return {
    title: `${songStyle} ${mood} Song - ${prompt.slice(0, 42)}`,
    description: `AI generated ${styleSuffix} ${mood.toLowerCase()} song based on: ${prompt}.`,
    genre,
    tags: [mood.toLowerCase(), "ai-song", styleSuffix, "cinematic", "vocal"],
  }
}

async function generateMetadataWithStyle(
  prompt: string,
  mood: "Chill" | "Focus" | "Rain",
  songStyle: SongStyle,
): Promise<{ metadata: GeminiSongMetadata; modelUsed: string }> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return { metadata: fallbackMetadataForStyle(prompt, mood, songStyle), modelUsed: "fallback-no-key" }

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
                    text: `Generate metadata for an AI song.
Return JSON only with this exact shape:
{"title":"string","description":"string","genre":"Sad|Chill|Romantic|Relaxing|Party|Focus","tags":["tag1","tag2","tag3"]}
Prompt: ${prompt}
Mood: ${mood}
SongStyle: ${songStyle}`,
                  },
                ],
              },
            ],
            generationConfig: { temperature: 0.6, maxOutputTokens: 300, responseMimeType: "application/json" },
          }),
        },
      )

      if (!res.ok) continue
      const payload = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
      }
      const rawText = payload.candidates?.[0]?.content?.parts?.[0]?.text
      if (!rawText) continue

      const parsed = JSON.parse(extractJsonObject(rawText)) as GeminiSongMetadata
      const title = (parsed.title || "").trim().slice(0, 255)
      const description = (parsed.description || "").trim().slice(0, 1024)
      const parsedGenre = String(parsed.genre || "").trim() as SuggestedGenre
      const tags = Array.isArray(parsed.tags)
        ? parsed.tags.map((t) => String(t).trim()).filter(Boolean).slice(0, 8)
        : []

      const genre = GENRE_OPTIONS.includes(parsedGenre)
        ? parsedGenre
        : songStyle === "Romantic"
          ? "Romantic"
          : songStyle === "Sad"
            ? "Sad"
            : inferGenreFromMetadata(tags, mood, description)

      if (!title || !description) continue
      if (!tags.some((tag) => tag.toLowerCase() === songStyle.toLowerCase())) tags.push(songStyle.toLowerCase())

      return {
        metadata: {
          title,
          description,
          genre,
          tags: tags.length > 0 ? tags : fallbackMetadataForStyle(prompt, mood, songStyle).tags,
        },
        modelUsed: model,
      }
    } catch {
      continue
    }
  }

  return { metadata: fallbackMetadataForStyle(prompt, mood, songStyle), modelUsed: "fallback-local" }
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

function buildStyledMusicPrompt(
  prompt: string,
  language: SongLanguage,
  songStyle: SongStyle,
  mood: "Chill" | "Focus" | "Rain",
): string {
  const styleHint = STYLE_MUSIC_HINTS[songStyle]
  const languageHint = LANGUAGE_MUSIC_HINTS[language]
  return [
    prompt,
    `${songStyle.toLowerCase()} ${language.toLowerCase()} song`,
    styleHint,
    languageHint,
    "melodic chorus, emotional hook, polished studio production",
    `mood ${mood.toLowerCase()}`,
  ].join(", ")
}

function buildVocalLayerPrompt(
  prompt: string,
  lyrics: string,
  language: SongLanguage,
  songStyle: SongStyle,
  mood: "Chill" | "Focus" | "Rain",
): string {
  const compactLyrics = lyrics.replace(/\s+/g, " ").trim().slice(0, 240)
  const styleHint = STYLE_MUSIC_HINTS[songStyle]
  const languageHint = LANGUAGE_MUSIC_HINTS[language]
  return [
    `Lead vocal melody layer for a ${songStyle.toLowerCase()} ${language.toLowerCase()} song`,
    languageHint,
    styleHint,
    `Mood ${mood.toLowerCase()}`,
    `Theme ${prompt}`,
    `Lyrics idea: ${compactLyrics}`,
    "musical vocal textures, no spoken narration, no podcast voiceover",
  ].join(", ")
}

function fallbackLyrics(
  prompt: string,
  language: SongLanguage,
  mood: "Chill" | "Focus" | "Rain",
  songStyle: SongStyle,
): string {
  if (language === "Hindi") {
    const moodLine =
      songStyle === "Sad"
        ? "Tute hue alfaaz mein dard sa behta hai,"
        : songStyle === "Happy"
          ? "Hasi ki roshni mein dil yeh nachta hai,"
          : "Nazdeekiyon ka ehsaas dheere dheere kehta hai,"
    return [
      moodLine,
      "Raat ki hawa mein sapne jagte hain,",
      `Dil ke sur ${prompt.slice(0, 40) || "khamoshi"} mein dhadakte hain.`,
      `${mood === "Rain" ? "Boondon ki dhun" : "Yaadon ki dhun"} mein hum kho jaate hain,`,
      "Is pal ko gaate gaate muskuraate hain.",
    ].join("\n")
  }

  if (language === "Bengali") {
    const moodLine =
      songStyle === "Sad"
        ? "Dukher shure mon aj chupchap kotha bole,"
        : songStyle === "Happy"
          ? "Hashir alo te aj shob shopno urey chole,"
          : "Bhalobashar shure raat ta komol hoye jaye,"
    return [
      moodLine,
      "Nirab rate alo jwole gaaner majhe,",
      `${prompt.slice(0, 40) || "shopno"} niye mon ta bhese jay ajke.`,
      `${mood === "Rain" ? "Brishtir shure" : "Komol shure"} hridoy kotha bole,`,
      "Ektu ektu bhalobasha thake protiti chhonde.",
    ].join("\n")
  }

  const moodLine =
    songStyle === "Sad"
      ? "My heavy heart keeps breaking in the moonlight,"
      : songStyle === "Happy"
        ? "We chase the sun and dance into the skyline,"
        : "Your eyes and mine are burning in the twilight,"

  return [
    moodLine,
    "In the midnight glow we rise and breathe,",
    `Your ${prompt.slice(0, 45) || "secret melody"} keeps me underneath,`,
    `${mood === "Rain" ? "Raindrops" : "Soft lights"} falling in rhythm with the sky,`,
    "We sing this little dream and let the night fly by.",
  ].join("\n")
}

async function generateLyrics(
  prompt: string,
  language: SongLanguage,
  mood: "Chill" | "Focus" | "Rain",
  songStyle: SongStyle,
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return fallbackLyrics(prompt, language, mood, songStyle)

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
                    `Write short song lyrics in ${language}. ` +
                    "Use 4 to 6 lines, catchy and singable, emotional but clean, no markdown. " +
                    `Song style: ${songStyle}. Mood: ${mood}. Theme: ${prompt}.`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 220,
          },
        }),
      },
    )

    if (!response.ok) return fallbackLyrics(prompt, language, mood, songStyle)
    const payload = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
    }
    const text = payload.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    if (!text) return fallbackLyrics(prompt, language, mood, songStyle)
    return text.slice(0, 600)
  } catch {
    return fallbackLyrics(prompt, language, mood, songStyle)
  }
}

function decodeBase64Audio(input: string): { bytes: Buffer; mimeType: string | null } | null {
  if (!input || input.length < 100) return null

  const dataUriMatch = input.match(/^data:(audio\/[a-zA-Z0-9+.-]+);base64,(.+)$/)
  if (dataUriMatch) {
    const bytes = Buffer.from(dataUriMatch[2], "base64")
    if (bytes.length > 1000) {
      return { bytes, mimeType: dataUriMatch[1].toLowerCase() }
    }
    return null
  }

  if (!/^[A-Za-z0-9+/=\r\n]+$/.test(input)) return null

  const compact = input.replace(/\s+/g, "")
  if (compact.length < 100 || compact.length % 4 !== 0) return null

  try {
    const bytes = Buffer.from(compact, "base64")
    if (bytes.length > 1000) {
      return { bytes, mimeType: null }
    }
  } catch {
    return null
  }

  return null
}

function tryExtractAudioFromJson(value: unknown): { bytes: Buffer; mimeType: string | null } | null {
  if (typeof value === "string") {
    return decodeBase64Audio(value)
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = tryExtractAudioFromJson(item)
      if (found) return found
    }
    return null
  }

  if (!value || typeof value !== "object") return null

  const obj = value as Record<string, unknown>
  const candidateKeys = ["audio", "generated_audio", "generatedAudio", "audio_base64", "wav", "mp3", "data"]
  for (const key of candidateKeys) {
    if (!(key in obj)) continue
    const found = tryExtractAudioFromJson(obj[key])
    if (found) return found
  }

  for (const [key, nested] of Object.entries(obj)) {
    if (/audio/i.test(key)) {
      const found = tryExtractAudioFromJson(nested)
      if (found) return found
    }
  }

  for (const nested of Object.values(obj)) {
    const found = tryExtractAudioFromJson(nested)
    if (found) return found
  }

  return null
}

function modelNameFromUrl(url: string): string {
  const marker = "/models/"
  const idx = url.indexOf(marker)
  if (idx === -1) return "custom-endpoint"
  const model = url.slice(idx + marker.length)
  return model || "custom-endpoint"
}

async function generateMusicWithHuggingFace(userPrompt: string): Promise<HuggingFaceAudioResult> {
  const apiKey = process.env.HUGGINGFACE_API_KEY
  if (!apiKey) {
    throw Object.assign(new Error("Missing HuggingFace API Key"), { status: 400, code: "MISSING_HF_KEY" })
  }

  const endpointUrl = process.env.HUGGINGFACE_ENDPOINT_URL?.trim()
  let lastError = ""
  let lastStatus = 502

  const candidateUrls = endpointUrl
    ? [endpointUrl]
    : getHuggingFaceMusicModels().flatMap((model) => getHuggingFaceRouterUrls(model))

  for (const url of candidateUrls) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "audio/*, application/json",
        },
        body: JSON.stringify({ inputs: userPrompt }),
      })

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "")
        lastStatus = response.status || 502
        lastError = errorBody || `Hugging Face request failed (${response.status})`

        if (response.status === 503 && attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 2500))
          continue
        }

        break
      }

      const contentTypeHeader = response.headers.get("content-type") || ""
      const contentType = contentTypeHeader.toLowerCase()

      if (contentType.startsWith("audio/")) {
        const audioBytes = Buffer.from(await response.arrayBuffer())
        if (!audioBytes.length) {
          lastStatus = 502
          lastError = "Hugging Face returned empty audio"
          break
        }

        const extension = inferExtensionFromMimeType(contentType) || "wav"
        const mimeType = contentType.split(";")[0].trim()

        return {
          audioBuffer: audioBytes,
          mimeType,
          extension,
          modelUsed: modelNameFromUrl(url),
        }
      }

      const textPayload = await response.text().catch(() => "")
      if (!textPayload) {
        lastStatus = 502
        lastError = "Hugging Face returned an empty response"
        break
      }

      let parsedPayload: unknown = textPayload
      try {
        parsedPayload = JSON.parse(textPayload)
      } catch {
        // keep as string
      }

      const extracted = tryExtractAudioFromJson(parsedPayload)
      if (extracted) {
        const mimeType = extracted.mimeType || "audio/wav"
        const extension = inferExtensionFromMimeType(mimeType) || "wav"
        return {
          audioBuffer: extracted.bytes,
          mimeType,
          extension,
          modelUsed: modelNameFromUrl(url),
        }
      }

      if (parsedPayload && typeof parsedPayload === "object") {
        const maybeError = (parsedPayload as { error?: unknown }).error
        if (typeof maybeError === "string" && maybeError.trim()) {
          lastError = maybeError
        } else {
          lastError = "Hugging Face returned JSON without audio payload"
        }
      } else {
        lastError = "Hugging Face returned non-audio response"
      }

      lastStatus = 502
      break
    }
  }

  throw Object.assign(
    new Error(
      lastStatus === 404
        ? endpointUrl
          ? "Hugging Face endpoint URL was not found. Verify HUGGINGFACE_ENDPOINT_URL."
          : "Hugging Face music model route was not found for your token/provider. Set HUGGINGFACE_ENDPOINT_URL or HUGGINGFACE_MUSIC_MODELS with accessible model IDs."
        : (lastError || "Hugging Face music generation failed"),
    ),
    { status: lastStatus === 404 ? 502 : lastStatus, code: "HF_GENERATION_FAILED" },
  )
}

async function generateVocalsWithHuggingFace(
  lyrics: string,
  language: SongLanguage,
): Promise<HuggingFaceAudioResult> {
  const apiKey = process.env.HUGGINGFACE_API_KEY
  if (!apiKey) {
    throw Object.assign(new Error("Missing HuggingFace API Key"), { status: 400, code: "MISSING_HF_KEY" })
  }

  const endpointUrl = process.env.HUGGINGFACE_TTS_ENDPOINT_URL?.trim()
  let lastError = ""
  let lastStatus = 502

  const candidateUrls = endpointUrl
    ? [endpointUrl]
    : getHuggingFaceTtsModels(language).flatMap((model) => getHuggingFaceRouterUrls(model))

  for (const url of candidateUrls) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "audio/*, application/json",
        },
        body: JSON.stringify({ inputs: lyrics }),
      })

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "")
        lastStatus = response.status || 502
        lastError = errorBody || `Hugging Face TTS request failed (${response.status})`

        if (response.status === 503 && attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 2000))
          continue
        }

        break
      }

      const contentTypeHeader = response.headers.get("content-type") || ""
      const contentType = contentTypeHeader.toLowerCase()

      if (contentType.startsWith("audio/")) {
        const audioBytes = Buffer.from(await response.arrayBuffer())
        if (audioBytes.length > 0) {
          const mimeType = contentType.split(";")[0].trim()
          const extension = inferExtensionFromMimeType(mimeType) || "wav"
          return {
            audioBuffer: audioBytes,
            mimeType,
            extension,
            modelUsed: `hf-tts:${modelNameFromUrl(url)}`,
          }
        }

        lastStatus = 502
        lastError = "Hugging Face TTS returned empty audio"
        break
      }

      const textPayload = await response.text().catch(() => "")
      if (!textPayload) {
        lastStatus = 502
        lastError = "Hugging Face TTS returned empty response"
        break
      }

      let parsedPayload: unknown = textPayload
      try {
        parsedPayload = JSON.parse(textPayload)
      } catch {
        // keep as raw text
      }

      const extracted = tryExtractAudioFromJson(parsedPayload)
      if (extracted) {
        const mimeType = extracted.mimeType || "audio/wav"
        const extension = inferExtensionFromMimeType(mimeType) || "wav"
        return {
          audioBuffer: extracted.bytes,
          mimeType,
          extension,
          modelUsed: `hf-tts:${modelNameFromUrl(url)}`,
        }
      }

      if (parsedPayload && typeof parsedPayload === "object") {
        const maybeError = (parsedPayload as { error?: unknown }).error
        lastError = typeof maybeError === "string" && maybeError.trim()
          ? maybeError
          : "Hugging Face TTS returned JSON without audio payload"
      } else {
        lastError = "Hugging Face TTS returned non-audio response"
      }

      lastStatus = 502
      break
    }
  }

  throw Object.assign(new Error(lastError || "Hugging Face TTS generation failed"), {
    status: lastStatus,
    code: "HF_TTS_FAILED",
  })
}

async function generateVocalsWithGoogleTts(
  lyrics: string,
  language: SongLanguage,
): Promise<HuggingFaceAudioResult> {
  const normalized = lyrics.replace(/\s+/g, " ").trim().slice(0, 180)
  const languageCode = SONG_LANGUAGE_CODE[language]
  const url =
    "https://translate.google.com/translate_tts" +
    `?ie=UTF-8&client=tw-ob&tl=${languageCode}&q=${encodeURIComponent(normalized)}`

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      Referer: "https://translate.google.com/",
    },
  })

  if (!response.ok) {
    throw Object.assign(new Error(`Google TTS fallback failed (${response.status})`), { status: response.status })
  }

  const audioBytes = Buffer.from(await response.arrayBuffer())
  if (!audioBytes.length) {
    throw new Error("Google TTS fallback returned empty audio")
  }

  return {
    audioBuffer: audioBytes,
    mimeType: "audio/mpeg",
    extension: "mp3",
    modelUsed: "google-tts-fallback",
  }
}

function splitLyricsForSinging(lyrics: string): string[] {
  return lyrics
    .split(/\n+/)
    .map((line) => line.trim().replace(/\s+/g, " "))
    .filter(Boolean)
    .map((line) => line.replace(/[^\p{L}\p{N}\s,.'!?-]/gu, ""))
    .filter((line) => line.length > 2)
    .slice(0, 8)
}

function styleMelodySemitones(songStyle: SongStyle): number[] {
  if (songStyle === "Sad") return [0, -2, -3, -5, -2, -3, 0, -2]
  if (songStyle === "Happy") return [0, 2, 4, 7, 4, 2, 5, 7]
  return [0, 2, 3, 5, 7, 5, 3, 2]
}

async function renderSungVocalSegment(
  inputPath: string,
  outputPath: string,
  semitones: number,
): Promise<void> {
  const ratio = Math.pow(2, semitones / 12)
  const tempo = Math.max(0.5, Math.min(2, 1 / ratio))
  await runFfmpeg([
    "-y",
    "-i",
    inputPath,
    "-filter_complex",
    `asetrate=44100*${ratio.toFixed(5)},aresample=44100,atempo=${tempo.toFixed(5)},` +
      "highpass=f=120,lowpass=f=4200,vibrato=f=5.2:d=0.16," +
      "chorus=0.5:0.9:45|60:0.35|0.25:0.2|0.33:1.8|2.3," +
      "aecho=0.75:0.6:45|70:0.22|0.14",
    "-c:a",
    "pcm_s16le",
    outputPath,
  ])
}

async function generateSingingVocalsTrack(
  tempDir: string,
  lyrics: string,
  language: SongLanguage,
  songStyle: SongStyle,
  allowSpeechFallback: boolean,
): Promise<{ path: string; modelUsed: string }> {
  const lines = splitLyricsForSinging(lyrics)
  if (lines.length === 0) {
    throw new Error("Unable to create vocal lines from lyrics")
  }

  const semitones = styleMelodySemitones(songStyle)
  const renderedSegments: string[] = []
  const modelsUsed: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    let rawTts: HuggingFaceAudioResult
    try {
      rawTts = await generateVocalsWithHuggingFace(line, language)
    } catch (error) {
      if (!allowSpeechFallback) {
        throw error
      }
      rawTts = await generateVocalsWithGoogleTts(line, language)
    }

    modelsUsed.push(rawTts.modelUsed)
    const rawPath = path.join(tempDir, `vocals-line-${i}.${rawTts.extension}`)
    const sungPath = path.join(tempDir, `vocals-line-${i}.wav`)
    await fs.writeFile(rawPath, rawTts.audioBuffer)
    await renderSungVocalSegment(rawPath, sungPath, semitones[i % semitones.length])
    renderedSegments.push(sungPath)
  }

  const listPath = path.join(tempDir, "vocals-lines.txt")
  const concatBody = renderedSegments
    .map((filePath) => `file '${filePath.replace(/'/g, "'\\''")}'`)
    .join("\n")
  await fs.writeFile(listPath, concatBody, "utf8")

  const vocalsOut = path.join(tempDir, "vocals-singing.wav")
  await runFfmpeg([
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    listPath,
    "-c:a",
    "pcm_s16le",
    vocalsOut,
  ])

  const uniqueModels = Array.from(new Set(modelsUsed))
  return { path: vocalsOut, modelUsed: uniqueModels.join("+") }
}

async function mixInstrumentalAndMusicLayer(
  instrumentalPath: string,
  vocalMusicPath: string,
  songStyle: SongStyle,
  outputPath: string,
): Promise<void> {
  const leadVolume = songStyle === "Sad" ? "0.62" : songStyle === "Happy" ? "0.74" : "0.68"
  const bedVolume = songStyle === "Sad" ? "0.96" : songStyle === "Happy" ? "1.0" : "0.98"

  await runFfmpeg([
    "-y",
    "-i",
    instrumentalPath,
    "-stream_loop",
    "-1",
    "-i",
    vocalMusicPath,
    "-filter_complex",
    `[0:a]aformat=channel_layouts=stereo,volume=${bedVolume},acompressor=threshold=-20dB:ratio=2.2:attack=14:release=180[bed];` +
      `[1:a]aformat=channel_layouts=stereo,volume=${leadVolume},highpass=f=160,lowpass=f=6800,` +
      "aecho=0.7:0.5:55|85:0.2|0.12,acompressor=threshold=-18dB:ratio=2.8:attack=8:release=120[voc];" +
      "[bed][voc]amix=inputs=2:duration=first:dropout_transition=2,alimiter=limit=0.95[out]",
    "-map",
    "[out]",
    "-c:a",
    "pcm_s16le",
    outputPath,
  ])
}

async function mixInstrumentalAndVocals(
  instrumentalPath: string,
  vocalsPath: string,
  songStyle: SongStyle,
  outputPath: string,
): Promise<void> {
  const vocalVolume = songStyle === "Sad" ? "1.05" : songStyle === "Happy" ? "1.18" : "1.12"
  const bedVolume = songStyle === "Sad" ? "0.88" : songStyle === "Happy" ? "0.96" : "0.9"
  const compThreshold = songStyle === "Sad" ? "-24dB" : "-20dB"
  await runFfmpeg([
    "-y",
    "-i",
    instrumentalPath,
    "-stream_loop",
    "-1",
    "-i",
    vocalsPath,
    "-filter_complex",
    `[1:a]aformat=channel_layouts=stereo,volume=${vocalVolume},highpass=f=120,lowpass=f=4500,adelay=450|450[v];` +
      `[0:a]volume=${bedVolume},acompressor=threshold=${compThreshold}:ratio=2.2:attack=20:release=180[m];` +
      "[m][v]amix=inputs=2:duration=first:dropout_transition=2,alimiter=limit=0.95[out]",
    "-map",
    "[out]",
    "-c:a",
    "pcm_s16le",
    outputPath,
  ])
}

function generateLocalFallbackMusic(
  prompt: string,
  mood: "Chill" | "Focus" | "Rain",
  songStyle: SongStyle,
  language: SongLanguage,
  variationKey: string,
): HuggingFaceAudioResult {
  const sampleRate = 44_100
  const seconds = 28
  const totalSamples = sampleRate * seconds
  const left = new Float32Array(totalSamples)
  const right = new Float32Array(totalSamples)
  const twoPi = Math.PI * 2

  const seedSource = `${prompt}|${songStyle}|${language}|${mood}|${variationKey}`
  let seed = 2166136261
  for (let i = 0; i < seedSource.length; i++) {
    seed ^= seedSource.charCodeAt(i)
    seed = Math.imul(seed, 16777619) >>> 0
  }
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 0xffffffff
  }

  const roots = [55, 61.74, 65.41, 69.3, 73.42, 82.41, 87.31, 92.5, 98, 110, 123.47]
  const root = roots[Math.floor(random() * roots.length)]
  const bpmBase = songStyle === "Sad" ? 72 : songStyle === "Happy" ? 104 : 88
  const jitter = Math.floor(random() * 9) - 4
  const bpmCandidate = bpmBase + jitter
  const bpm = mood === "Focus" ? Math.max(82, bpmCandidate) : mood === "Rain" ? Math.min(78, bpmCandidate) : bpmCandidate
  const beat = 60 / bpm
  const bar = beat * 4
  const progressionOptions =
    songStyle === "Sad"
      ? [
          [1, 0.75, 0.89, 0.79],
          [1, 0.84, 0.75, 0.67],
          [1, 0.89, 0.75, 0.84],
        ]
      : songStyle === "Happy"
        ? [
            [1, 1.125, 0.84, 1.26],
            [1, 0.84, 1.26, 1.125],
            [1, 1.26, 1.125, 0.84],
          ]
        : [
            [1, 0.75, 1.125, 0.84],
            [1, 0.89, 1.125, 0.75],
            [1, 0.75, 0.84, 1.125],
          ]
  const progression = progressionOptions[Math.floor(random() * progressionOptions.length)]

  const pentatonic =
    language === "Hindi"
      ? songStyle === "Happy"
        ? [0, 2, 4, 7, 9]
        : [0, 3, 5, 7, 10]
      : language === "Bengali"
        ? songStyle === "Happy"
          ? [0, 2, 5, 7, 9]
          : [0, 3, 5, 8, 10]
        : songStyle === "Happy"
          ? [0, 2, 4, 7, 9]
          : [0, 3, 5, 7, 10]

  const attack = 0.012
  const release = 0.22
  const noteDuration = beat * 0.46
  let lastStep = -1
  let cachedLeadFreq = root * 2
  let lpL = 0
  let lpR = 0

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate
    const barIdx = Math.floor(t / bar) % progression.length
    const chordRoot = root * progression[barIdx]
    const third = chordRoot * 1.2599
    const fifth = chordRoot * 1.4983

    const globalEnv =
      t < 1.5
        ? t / 1.5
        : t > seconds - 2.5
          ? Math.max(0, (seconds - t) / 2.5)
          : 1

    const beatPhase = t % beat
    const kickEnv = Math.exp(-beatPhase * 28)
    const kickFreq = 82 - 45 * Math.min(1, beatPhase * 7)
    const kick = 0.24 * kickEnv * Math.sin(twoPi * kickFreq * t)

    const barPhase = t % bar
    const onSnare1 = Math.abs(barPhase - beat) < 0.055
    const onSnare2 = Math.abs(barPhase - beat * 3) < 0.055
    const snareGate = onSnare1 || onSnare2 ? 1 : 0
    const white = ((Math.sin((i + seed) * 12.9898) * 43758.5453) % 1) * 2 - 1
    const snare = 0.08 * snareGate * white * Math.exp(-((barPhase % beat) * 32))

    const hatPhase = t % (beat / 2)
    const hatEnergy = (songStyle === "Happy" ? 0.04 : 0.028) + random() * 0.01
    const hat = hatEnergy * Math.exp(-hatPhase * 90) * Math.sign(Math.sin(twoPi * 6800 * t))

    const bassGate = beatPhase < beat * 0.56 ? 1 : 0
    const bassEnv = bassGate * Math.exp(-beatPhase * 3.8)
    const bass = 0.19 * bassEnv * Math.sin(twoPi * (chordRoot / 2) * t)

    const pad =
      0.13 * Math.sin(twoPi * chordRoot * t + 0.1) +
      0.09 * Math.sin(twoPi * third * t + 0.35) +
      0.07 * Math.sin(twoPi * fifth * t + 0.6)

    const step = Math.floor(t / (beat / 2))
    if (step !== lastStep) {
      lastStep = step
      const note = pentatonic[(step + barIdx) % pentatonic.length]
      cachedLeadFreq = chordRoot * 2 * Math.pow(2, note / 12)
    }

    const stepStart = step * (beat / 2)
    const stepElapsed = t - stepStart
    const leadAttack = Math.min(1, stepElapsed / attack)
    const leadRelease = stepElapsed > noteDuration ? Math.max(0, 1 - (stepElapsed - noteDuration) / release) : 1
    const leadEnv = Math.max(0, Math.min(1, leadAttack * leadRelease))
    const leadGain = songStyle === "Sad" ? 0.09 : songStyle === "Happy" ? 0.13 : 0.11
    const lead =
      leadGain * leadEnv * (
        Math.sin(twoPi * cachedLeadFreq * t) +
        0.3 * Math.sin(twoPi * (cachedLeadFreq * 2) * t + 0.15)
      )

    const sidechain = 1 - Math.min(0.42, kickEnv * 0.56)
    const baseSignal = ((pad + bass * sidechain + lead) * 0.92 + kick + snare + hat + white * 0.009) * globalEnv

    const stereoPadOffset = 0.035 * Math.sin(twoPi * 0.19 * t)
    const stereoLeadOffset = 0.028 * Math.sin(twoPi * cachedLeadFreq * t + Math.PI / 2) * leadEnv
    const targetL = baseSignal + stereoPadOffset + stereoLeadOffset
    const targetR = baseSignal - stereoPadOffset - stereoLeadOffset

    const cutoff = mood === "Rain" ? 0.07 : 0.09
    lpL += cutoff * (targetL - lpL)
    lpR += cutoff * (targetR - lpR)

    left[i] = Math.tanh(lpL * 1.35)
    right[i] = Math.tanh(lpR * 1.35)
  }

  const delaySamples = Math.floor(sampleRate * (0.19 + random() * 0.09))
  for (let i = delaySamples; i < totalSamples; i++) {
    left[i] += left[i - delaySamples] * 0.16
    right[i] += right[i - delaySamples] * 0.13
  }

  let peak = 0
  for (let i = 0; i < totalSamples; i++) {
    peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]))
  }
  const norm = peak > 0 ? 0.93 / peak : 1

  const pcm = Buffer.alloc(totalSamples * 4)
  for (let i = 0; i < totalSamples; i++) {
    const l = Math.max(-1, Math.min(1, left[i] * norm))
    const r = Math.max(-1, Math.min(1, right[i] * norm))
    pcm.writeInt16LE(Math.round(l * 32767), i * 4)
    pcm.writeInt16LE(Math.round(r * 32767), i * 4 + 2)
  }

  const channels = 2
  const bitsPerSample = 16
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

  return {
    audioBuffer: Buffer.concat([header, pcm]),
    mimeType: "audio/wav",
    extension: "wav",
    modelUsed: "local-procedural-fallback-v2",
  }
}

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession()
    const body = await request.json()
    const parsedInput = createAiSongSchema.safeParse(body)

    if (!parsedInput.success) {
      return NextResponse.json(
        { error: "Validation failed", fieldErrors: parsedInput.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const { prompt, mood, language, songStyle, uploadToLibrary } = parsedInput.data
    const normalizedStyle = normalizeSongStyle(songStyle)
    const baseStyledPrompt = buildStyledMusicPrompt(prompt, language, normalizedStyle, mood)
    const improvedPrompt = await improveMusicPromptWithGemini(baseStyledPrompt)
    const { metadata, modelUsed: metadataModel } = await generateMetadataWithStyle(prompt, mood, normalizedStyle)

    if (!metadata.tags.some((tag) => tag.toLowerCase() === language.toLowerCase())) {
      metadata.tags.push(language.toLowerCase())
    }
    if (!metadata.tags.some((tag) => tag.toLowerCase() === normalizedStyle.toLowerCase())) {
      metadata.tags.push(normalizedStyle.toLowerCase())
    }

    let musicBedResult: HuggingFaceAudioResult
    let usedLocalFallback = false
    let fallbackReason = ""
    try {
      musicBedResult = await generateMusicWithHuggingFace(improvedPrompt)
    } catch (error) {
      usedLocalFallback = true
      fallbackReason = error instanceof Error ? error.message : "Remote music generation failed"
      musicBedResult = generateLocalFallbackMusic(
        improvedPrompt,
        mood,
        normalizedStyle,
        language,
        `${Date.now()}-${Math.random()}`,
      )
    }

    const lyrics = await generateLyrics(prompt, language, mood, normalizedStyle)
    const vocalLayerPrompt = buildVocalLayerPrompt(prompt, lyrics, language, normalizedStyle, mood)
    const allowTtsVocals = process.env.AI_SONG_ENABLE_TTS_VOCALS === "true"

    const itemId = randomUUID()
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "ai-song-"))
    const instrumentalPath = path.join(tempDir, `${itemId}.instrumental.${musicBedResult.extension}`)
    const vocalLayerPath = path.join(tempDir, `${itemId}.vocal-layer.wav`)
    const vocalsPath = path.join(tempDir, `${itemId}.vocals.wav`)
    const mixedAudioPath = path.join(tempDir, `${itemId}.wav`)
    const imagePath = path.join(tempDir, `${itemId}.png`)
    const previewVideoPath = path.join(tempDir, `${itemId}.mp4`)

    let mediaUrl = ""
    let imageUrl = ""
    let previewVideoUrl = ""
    let imageModelUsed: "gemini-image" | "fallback-image" = "fallback-image"
    let vocalsModelUsed = "instrumental-only"
    let finalAudioPath = instrumentalPath
    let finalAudioMimeType = musicBedResult.mimeType
    let finalAudioExtension = musicBedResult.extension

    try {
      await fs.writeFile(instrumentalPath, musicBedResult.audioBuffer)
      try {
        const generatedVocalLayer = await generateMusicWithHuggingFace(vocalLayerPrompt)
        await fs.writeFile(vocalLayerPath, generatedVocalLayer.audioBuffer)
        await mixInstrumentalAndMusicLayer(instrumentalPath, vocalLayerPath, normalizedStyle, mixedAudioPath)
        finalAudioPath = mixedAudioPath
        finalAudioMimeType = "audio/wav"
        finalAudioExtension = "wav"
        vocalsModelUsed = `music-layer:${generatedVocalLayer.modelUsed}`
      } catch {
        if (allowTtsVocals) {
          try {
            const singingVocals = await generateSingingVocalsTrack(
              tempDir,
              lyrics,
              language,
              normalizedStyle,
              true,
            )
            vocalsModelUsed = `tts-layer:${singingVocals.modelUsed}`
            await fs.copyFile(singingVocals.path, vocalsPath)
            await mixInstrumentalAndVocals(instrumentalPath, vocalsPath, normalizedStyle, mixedAudioPath)
            finalAudioPath = mixedAudioPath
            finalAudioMimeType = "audio/wav"
            finalAudioExtension = "wav"
          } catch {
            vocalsModelUsed = "instrumental-only"
          }
        }
      }

      mediaUrl = await uploadGeneratedFile(
        finalAudioPath,
        `ai-song-${itemId}.${finalAudioExtension}`,
        finalAudioMimeType,
      )

      imageModelUsed = await generateAiImage(improvedPrompt, normalizedStyle, imagePath)
      imageUrl = await uploadGeneratedFile(imagePath, `ai-song-${itemId}.png`, "image/png")

      await createMp4FromImageAndAudio(imagePath, finalAudioPath, previewVideoPath)
      previewVideoUrl = await uploadGeneratedFile(previewVideoPath, `ai-song-preview-${itemId}.mp4`, "video/mp4")
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
          theme: metadata.genre,
          mood,
          songName: metadata.title,
          thumbnailUrl: imageUrl || null,
          videoUrl: mediaUrl,
          mediaType: "audio",
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
            ${metadata.genre},
            ${mood},
            ${metadata.title},
            ${imageUrl || null},
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
        modelUsed: `${musicBedResult.modelUsed}+${vocalsModelUsed}|${imageModelUsed}|${metadataModel}`,
        mood,
        language,
        songStyle: normalizedStyle,
        lyrics,
        audioUrl: mediaUrl,
        mediaUrl,
        imageUrl: imageUrl || null,
        previewVideoUrl: previewVideoUrl || null,
        mediaType: "audio",
        usedLocalFallback,
        fallbackReason: usedLocalFallback ? fallbackReason : undefined,
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
