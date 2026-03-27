"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Disc3, Download, Sparkles, Wand2 } from "lucide-react"
import { toast } from "sonner"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { normalizeMediaType } from "@/lib/media"
import { LIBRARY_CHANGED_EVENT, notifyLibraryChanged } from "@/lib/library/client"

type SuggestedGenre = "Sad" | "Chill" | "Romantic" | "Relaxing" | "Party" | "Focus"
type SongLanguage = "English" | "Hindi" | "Bengali"
type SongStyle = "Romantic" | "Happy" | "Sad"

const GENRE_OPTIONS: SuggestedGenre[] = ["Sad", "Chill", "Romantic", "Relaxing", "Party", "Focus"]
const LANGUAGE_OPTIONS: SongLanguage[] = ["English", "Hindi", "Bengali"]
const STYLE_OPTIONS: SongStyle[] = ["Romantic", "Happy", "Sad"]

type SongItem = {
  id: string
  title: string
  description: string | null
  mood: string | null
  mediaType: "audio" | "video"
  mediaUrl: string
  thumbnailUrl?: string | null
  previewVideoUrl?: string | null
  language?: SongLanguage
  songStyle?: SongStyle
  lyrics?: string
  createdAt: string
}

type GeneratedSongPayload = {
  item?: {
    id: string
    title: string
    description: string
    genre?: SuggestedGenre
    tags: string[]
    promptEcho?: string
    modelUsed?: string
    mood: "Chill" | "Focus" | "Rain"
    audioUrl: string
    mediaUrl?: string
    imageUrl?: string | null
    previewVideoUrl?: string | null
    language?: SongLanguage
    songStyle?: SongStyle
    lyrics?: string
    mediaType?: "audio" | "video"
    usedLocalFallback?: boolean
    fallbackReason?: string
    isInLibrary: boolean
    createdAt: string
  }
  error?: string
}

type VideosApiResponse = {
  items?: Array<{
    id: string
    title: string
    description: string | null
    tags?: string | null
    mood: string | null
    mediaType?: string | null
    mediaUrl?: string | null
    videoUrl?: string | null
    thumbnailUrl?: string | null
    createdAt: string
  }>
  error?: string
}

function inferGenreFromText(text: string, mood: "Chill" | "Focus" | "Rain"): SuggestedGenre {
  const normalized = text.toLowerCase()
  if (normalized.includes("sad")) return "Sad"
  if (normalized.includes("romantic") || normalized.includes("love")) return "Romantic"
  if (normalized.includes("party") || normalized.includes("dance")) return "Party"
  if (normalized.includes("focus") || mood === "Focus") return "Focus"
  if (normalized.includes("relax") || normalized.includes("calm")) return "Relaxing"
  return "Chill"
}

function inferSongStyleFromTags(tags: string | null | undefined): SongStyle | undefined {
  const normalized = (tags || "").toLowerCase()
  if (normalized.includes("romantic")) return "Romantic"
  if (normalized.includes("happy")) return "Happy"
  if (normalized.includes("sad")) return "Sad"
  return undefined
}

function inferLanguageFromTags(tags: string | null | undefined): SongLanguage | undefined {
  const normalized = (tags || "").toLowerCase()
  if (normalized.includes("hindi")) return "Hindi"
  if (normalized.includes("bengali")) return "Bengali"
  if (normalized.includes("english")) return "English"
  return undefined
}

export default function AiSongGeneratorPage() {
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isUploadingLibrary, setIsUploadingLibrary] = useState(false)
  const [hasUploadedCurrent, setHasUploadedCurrent] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [songs, setSongs] = useState<SongItem[]>([])

  const [settingsTitle, setSettingsTitle] = useState("")
  const [settingsDescription, setSettingsDescription] = useState("")
  const [settingsGenre, setSettingsGenre] = useState<SuggestedGenre>("Chill")
  const [settingsTags, setSettingsTags] = useState<string[]>([])
  const [settingsAudioUrl, setSettingsAudioUrl] = useState<string | null>(null)
  const [settingsImageUrl, setSettingsImageUrl] = useState<string | null>(null)
  const [settingsPreviewVideoUrl, setSettingsPreviewVideoUrl] = useState<string | null>(null)
  const [selectedLanguage, setSelectedLanguage] = useState<SongLanguage>("English")
  const [selectedSongStyle, setSelectedSongStyle] = useState<SongStyle>("Romantic")
  const [settingsLyrics, setSettingsLyrics] = useState<string>("")
  const [settingsPromptEcho, setSettingsPromptEcho] = useState<string>("")
  const [settingsModelUsed, setSettingsModelUsed] = useState<string>("")

  const loadSongs = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/videos", { cache: "no-store" })
      const data = (await response.json()) as VideosApiResponse
      if (!response.ok) {
        throw new Error(data.error || "Unable to load songs")
      }

      const audioItems = (data.items || []).reduce<SongItem[]>((acc, item) => {
        const mediaUrl = item.mediaUrl || item.videoUrl
        if (!mediaUrl) return acc

        const mediaType = normalizeMediaType(item.mediaType, mediaUrl)
        if (mediaType !== "audio") return acc

        acc.push({
          id: item.id,
          title: item.title,
          description: item.description,
          mood: item.mood,
          mediaType: "audio",
          mediaUrl,
          thumbnailUrl: item.thumbnailUrl || null,
          language: inferLanguageFromTags(item.tags),
          songStyle: inferSongStyleFromTags(item.tags),
          createdAt: item.createdAt,
        })
        return acc
      }, [])

      setSongs(audioItems)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load songs"
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSongs()
    window.addEventListener(LIBRARY_CHANGED_EVENT, loadSongs)
    return () => window.removeEventListener(LIBRARY_CHANGED_EVENT, loadSongs)
  }, [loadSongs])

  const handleGenerate = async () => {
    if (prompt.trim().length < 3) {
      toast.error("Please enter at least 3 characters in your prompt.")
      return
    }

    setIsGenerating(true)
    setSettingsAudioUrl(null)
    setSettingsImageUrl(null)
    setSettingsPreviewVideoUrl(null)
    setSettingsLyrics("")
    setSettingsTags([])
    setSettingsPromptEcho("")
    setHasUploadedCurrent(false)

    try {
      const response = await fetch("/api/ai-song", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          mood: "Chill",
          language: selectedLanguage,
          songStyle: selectedSongStyle,
          uploadToLibrary: false,
        }),
      })

      const data = (await response.json()) as GeneratedSongPayload
      if (!response.ok || !data.item) {
        throw new Error(data.error || "Song generation failed")
      }
      const item = data.item
      const audioUrl = item.audioUrl || item.mediaUrl

      if (!audioUrl) {
        throw new Error("Song generation failed: missing audio URL")
      }

      const derivedGenre = item.genre || inferGenreFromText(`${item.tags.join(" ")} ${item.description}`, item.mood)

      setSettingsTitle(item.title)
      setSettingsDescription(item.description)
      setSettingsGenre(derivedGenre)
      setSettingsTags(item.tags)
      setSettingsAudioUrl(audioUrl)
      setSettingsImageUrl(item.imageUrl || null)
      setSettingsPreviewVideoUrl(item.previewVideoUrl || null)
      if (item.songStyle) setSelectedSongStyle(item.songStyle)
      setSettingsLyrics(item.lyrics || "")
      setSettingsPromptEcho(item.promptEcho || "")
      setSettingsModelUsed(item.modelUsed || "")
      if (item.usedLocalFallback) {
        toast.warning(item.fallbackReason || "Remote model unavailable. Using local fallback track.")
      }

      setSongs((current) => [
        {
          id: item.id,
          title: item.title,
          description: item.description,
          mood: item.mood,
          mediaType: "audio",
          mediaUrl: audioUrl,
          thumbnailUrl: item.imageUrl || null,
          previewVideoUrl: item.previewVideoUrl || null,
          language: item.language,
          songStyle: item.songStyle,
          lyrics: item.lyrics,
          createdAt: item.createdAt,
        },
        ...current,
      ])

      toast.success("AI song generated")
      setPrompt("")
    } catch (generateError) {
      const message = generateError instanceof Error ? generateError.message : "Unable to generate song"
      toast.error(message)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleUploadToLibrary = async () => {
    if (!settingsAudioUrl) {
      toast.error("Generate a song first.")
      return
    }

    setIsUploadingLibrary(true)
    try {
      const response = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: settingsTitle.trim() || "AI Song",
          description: settingsDescription.trim() || undefined,
          tags: settingsTags.length ? settingsTags.join(",") : undefined,
          theme: settingsGenre,
          mood: "Chill",
          songName: settingsTitle.trim() || undefined,
          mediaType: "audio",
          mediaUrl: settingsAudioUrl,
          thumbnailUrl: settingsImageUrl || undefined,
          rating: 0,
          isInLibrary: true,
        }),
      })

      const data = (await response.json()) as { error?: string; item?: { id: string } }
      if (!response.ok) throw new Error(data.error || "Unable to upload to library")

      notifyLibraryChanged()
      setHasUploadedCurrent(true)
      toast.success("Uploaded to library")
      loadSongs()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to upload to library"
      toast.error(message)
    } finally {
      setIsUploadingLibrary(false)
    }
  }

  const visibleSongs = useMemo(() => songs.slice(0, 12), [songs])

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <section className="spotlight rounded-3xl border border-sky-200/20 bg-slate-900/55 p-6 shadow-[0_24px_45px_rgba(2,6,23,0.45)] backdrop-blur-xl sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-sky-200/80">AI Music Studio</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-100 sm:text-4xl">AI Song Generator</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-300/85 sm:text-base">
                Create cinematic audio tracks with language and mood control, preview visuals, and publish your best output to the library.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-2xl border border-sky-200/20 bg-slate-900/55 px-4 py-2 text-xs uppercase tracking-[0.15em] text-sky-100">
              <Disc3 className="h-4 w-4" />
              Studio Ready
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
          <Card className="h-fit rounded-3xl border-sky-200/20 py-0">
            <CardHeader className="border-b border-white/10 pb-5 pt-6">
              <CardTitle className="text-lg text-slate-100">Generate Track</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <div className="space-y-2">
                <Label htmlFor="prompt" className="text-slate-200">Prompt</Label>
                <Input
                  id="prompt"
                  placeholder="romantic rain night with soft piano and warm synth"
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200">Language</Label>
                <Select value={selectedLanguage} onValueChange={(value) => setSelectedLanguage(value as SongLanguage)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGE_OPTIONS.map((language) => (
                      <SelectItem key={language} value={language}>
                        {language}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200">Song Style</Label>
                <Select value={selectedSongStyle} onValueChange={(value) => setSelectedSongStyle(value as SongStyle)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STYLE_OPTIONS.map((style) => (
                      <SelectItem key={style} value={style}>
                        {style}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button type="button" onClick={handleGenerate} disabled={isGenerating} className="h-11 w-full rounded-xl text-sm font-semibold">
                <Sparkles className={isGenerating ? "mr-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4"} />
                {isGenerating ? "Generating Song..." : "Generate Song"}
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="rounded-3xl border-sky-200/20 py-0">
              <CardHeader className="border-b border-white/10 pb-5 pt-6">
                <CardTitle className="text-lg text-slate-100">Song Studio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-5">
                <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black/70">
                  {settingsPreviewVideoUrl ? (
                    <video src={settingsPreviewVideoUrl} controls className="h-full w-full object-cover" />
                  ) : settingsImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={settingsImageUrl} alt="Generated song artwork" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-400">
                      {isGenerating ? "Generating visuals..." : "Generated visuals will appear here."}
                    </div>
                  )}

                  <div className="absolute left-3 top-3 rounded-full border border-white/20 bg-slate-950/65 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-slate-200">
                    Preview
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-900/55 p-4">
                  {settingsAudioUrl ? (
                    <audio src={settingsAudioUrl} controls className="w-full" />
                  ) : (
                    <p className="text-sm text-slate-400">
                      {isGenerating ? "Generating audio..." : "Generated audio will appear here."}
                    </p>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="song-title" className="text-slate-200">AI Suggested Title</Label>
                    <Input
                      id="song-title"
                      value={settingsTitle}
                      onChange={(event) => setSettingsTitle(event.target.value)}
                      placeholder="AI suggested title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-200">Song Genre</Label>
                    <Select value={settingsGenre} onValueChange={(value) => setSettingsGenre(value as SuggestedGenre)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GENRE_OPTIONS.map((genre) => (
                          <SelectItem key={genre} value={genre}>
                            {genre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="song-description" className="text-slate-200">AI Suggested Description</Label>
                  <Textarea
                    id="song-description"
                    rows={3}
                    value={settingsDescription}
                    onChange={(event) => setSettingsDescription(event.target.value)}
                    placeholder="AI suggested description"
                  />
                </div>

                {settingsTags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {settingsTags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="rounded-full border border-sky-200/20 bg-sky-300/10 px-2 py-1 text-[11px] text-sky-100">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">Tags will appear after generation.</p>
                )}

                {settingsPromptEcho ? (
                  <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-3 text-xs text-slate-400">
                    <p className="font-medium text-slate-300">Prompt Used</p>
                    <p className="mt-1 line-clamp-2">{settingsPromptEcho}</p>
                    {settingsModelUsed ? <p className="mt-1">Model: {settingsModelUsed}</p> : null}
                  </div>
                ) : null}

                {settingsLyrics ? (
                  <div className="space-y-2">
                    <Label className="text-slate-200">Lyrics</Label>
                    <Textarea value={settingsLyrics} rows={4} readOnly />
                  </div>
                ) : null}

                <Button
                  type="button"
                  onClick={handleUploadToLibrary}
                  disabled={!settingsAudioUrl || isUploadingLibrary || hasUploadedCurrent}
                  className="h-11 w-full rounded-xl"
                >
                  <Wand2 className="mr-2 h-4 w-4" />
                  {hasUploadedCurrent ? "Uploaded to Library" : isUploadingLibrary ? "Uploading..." : "Upload to Library"}
                </Button>
              </CardContent>
            </Card>

            <section>
              {isLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <div key={idx} className="glass-panel animate-pulse rounded-2xl p-3">
                      <div className="aspect-video rounded-xl bg-slate-800/65" />
                      <div className="mt-3 h-3 w-2/3 rounded bg-slate-700/70" />
                      <div className="mt-2 h-3 w-1/2 rounded bg-slate-800/70" />
                    </div>
                  ))}
                </div>
              ) : visibleSongs.length === 0 ? (
                <div className="glass-panel rounded-3xl p-10 text-center">
                  <h2 className="text-lg font-medium text-slate-100">No songs generated yet</h2>
                  <p className="mt-2 text-sm text-slate-400">Generate your first track and it will appear here instantly.</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {visibleSongs.map((song) => (
                    <Card key={song.id} className="elevate-hover overflow-hidden rounded-2xl border-sky-200/20 py-0">
                      <div className="relative aspect-video bg-black/70">
                        {song.previewVideoUrl ? (
                          <video src={song.previewVideoUrl} controls className="h-full w-full object-cover" />
                        ) : song.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={song.thumbnailUrl} alt={song.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-slate-400">No artwork</div>
                        )}
                      </div>

                      <div className="p-3 pt-2">
                        <audio src={song.mediaUrl} controls className="w-full" />
                      </div>

                      <CardContent className="space-y-2 p-3">
                        <p className="truncate text-sm font-semibold text-slate-100">{song.title}</p>
                        <p className="line-clamp-2 text-xs text-slate-400">{song.description || "AI song"}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] uppercase tracking-[0.14em] text-slate-500">
                            {song.language || "English"} · {song.songStyle || "Romantic"} · {song.mood || "Chill"}
                          </span>
                          <Button asChild size="sm" variant="outline" className="h-7 px-2 text-xs">
                            <a href={song.mediaUrl} download>
                              <Download className="mr-1 h-3.5 w-3.5" />
                              Download
                            </a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
