"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Download, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { LIBRARY_CHANGED_EVENT, notifyLibraryChanged } from "@/lib/library/client"

type SuggestedGenre = "Sad" | "Chill" | "Romantic" | "Relaxing" | "Party" | "Focus"

const GENRE_OPTIONS: SuggestedGenre[] = ["Sad", "Chill", "Romantic", "Relaxing", "Party", "Focus"]

type VideoItem = {
  id: string
  title: string
  description: string | null
  mood: string | null
  videoUrl: string
  createdAt: string
}

type GeneratedVideoPayload = {
  item?: {
    id: string
    title: string
    description: string
    genre?: SuggestedGenre
    tags: string[]
    promptEcho?: string
    modelUsed?: string
    mood: "Chill" | "Focus" | "Rain"
    videoUrl: string
    isInLibrary: boolean
    createdAt: string
  }
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

export default function AiSongGeneratorPage() {
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isUploadingLibrary, setIsUploadingLibrary] = useState(false)
  const [hasUploadedCurrent, setHasUploadedCurrent] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [videos, setVideos] = useState<VideoItem[]>([])

  const [settingsTitle, setSettingsTitle] = useState("")
  const [settingsDescription, setSettingsDescription] = useState("")
  const [settingsGenre, setSettingsGenre] = useState<SuggestedGenre>("Chill")
  const [settingsTags, setSettingsTags] = useState<string[]>([])
  const [settingsVideoUrl, setSettingsVideoUrl] = useState<string | null>(null)
  const [settingsPromptEcho, setSettingsPromptEcho] = useState<string>("")
  const [settingsModelUsed, setSettingsModelUsed] = useState<string>("")

  const loadVideos = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/videos", { cache: "no-store" })
      const data = (await response.json()) as { items?: VideoItem[]; error?: string }
      if (!response.ok) {
        throw new Error(data.error || "Unable to load videos")
      }
      setVideos(data.items || [])
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load videos"
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadVideos()
    window.addEventListener(LIBRARY_CHANGED_EVENT, loadVideos)
    return () => window.removeEventListener(LIBRARY_CHANGED_EVENT, loadVideos)
  }, [loadVideos])

  const handleGenerate = async () => {
    if (prompt.trim().length < 3) {
      toast.error("Please enter at least 3 characters in your prompt.")
      return
    }

    setIsGenerating(true)
    setSettingsVideoUrl(null)
    setSettingsTags([])
    setSettingsPromptEcho("")
    setHasUploadedCurrent(false)

    try {
      const response = await fetch("/api/ai-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          mood: "Chill",
          uploadToLibrary: false,
        }),
      })

      const data = (await response.json()) as GeneratedVideoPayload
      if (!response.ok || !data.item) {
        throw new Error(data.error || "Video generation failed")
      }
      const item = data.item

      const derivedGenre = item.genre || inferGenreFromText(`${item.tags.join(" ")} ${item.description}`, item.mood)

      setSettingsTitle(item.title)
      setSettingsDescription(item.description)
      setSettingsGenre(derivedGenre)
      setSettingsTags(item.tags)
      setSettingsVideoUrl(item.videoUrl)
      setSettingsPromptEcho(item.promptEcho || "")
      setSettingsModelUsed(item.modelUsed || "")

      setVideos((current) => [
        {
          id: item.id,
          title: item.title,
          description: item.description,
          mood: item.mood,
          videoUrl: item.videoUrl,
          createdAt: item.createdAt,
        },
        ...current,
      ])

      toast.success("AI video generated")
      setPrompt("")
    } catch (generateError) {
      const message = generateError instanceof Error ? generateError.message : "Unable to generate video"
      toast.error(message)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleUploadToLibrary = async () => {
    if (!settingsVideoUrl) {
      toast.error("Generate a video first.")
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
          videoUrl: settingsVideoUrl,
          rating: 0,
          isInLibrary: true,
        }),
      })

      const data = (await response.json()) as { error?: string; item?: { id: string } }
      if (!response.ok) throw new Error(data.error || "Unable to upload to library")

      notifyLibraryChanged()
      setHasUploadedCurrent(true)
      toast.success("Uploaded to library")
      loadVideos()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to upload to library"
      toast.error(message)
    } finally {
      setIsUploadingLibrary(false)
    }
  }

  const visibleVideos = useMemo(() => videos.slice(0, 12), [videos])
  const isAudioOnlyPreview = Boolean(settingsVideoUrl && /\.(wav|mp3|m4a|ogg)(\?|$)/i.test(settingsVideoUrl))

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6 lg:p-8">
        <div>
          <h1 className="text-3xl font-bold">AI Song Generator</h1>
          <p className="mt-1 text-muted-foreground">Generate and instantly preview videos here.</p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
          <Card className="h-fit rounded-2xl border-border/50">
            <CardHeader>
              <CardTitle>Generate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prompt">Prompt</Label>
                <Input
                  id="prompt"
                  placeholder="chill rain night lofi"
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                />
              </div>
              <Button type="button" onClick={handleGenerate} disabled={isGenerating} className="w-full">
                <Sparkles className="mr-2 h-4 w-4" />
                {isGenerating ? "Generating..." : "Generate Video"}
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="rounded-2xl border-border/50">
              <CardHeader>
                <CardTitle>Video Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
                  {settingsVideoUrl ? (
                    isAudioOnlyPreview ? (
                      <div className="flex h-full items-center justify-center p-6">
                        <audio src={settingsVideoUrl} controls className="w-full max-w-lg" />
                      </div>
                    ) : (
                      <video src={settingsVideoUrl} controls className="h-full w-full object-cover" />
                    )
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      {isGenerating ? "Generating video with audio..." : "Generated video will appear here."}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="video-title">AI Suggested Title</Label>
                  <Input
                    id="video-title"
                    value={settingsTitle}
                    onChange={(event) => setSettingsTitle(event.target.value)}
                    placeholder="AI suggested title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="video-description">AI Suggested Description</Label>
                  <Textarea
                    id="video-description"
                    rows={3}
                    value={settingsDescription}
                    onChange={(event) => setSettingsDescription(event.target.value)}
                    placeholder="AI suggested description"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Song Genre</Label>
                  <Select value={settingsGenre} onValueChange={(value) => setSettingsGenre(value as SuggestedGenre)}>
                    <SelectTrigger className="max-w-xs">
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

                {settingsTags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {settingsTags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Tags will appear after generation.</p>
                )}

                {settingsPromptEcho ? (
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>Prompt Used: {settingsPromptEcho}</p>
                    {settingsModelUsed ? <p>Model: {settingsModelUsed}</p> : null}
                  </div>
                ) : null}

                <Button
                  type="button"
                  onClick={handleUploadToLibrary}
                  disabled={!settingsVideoUrl || isUploadingLibrary || hasUploadedCurrent}
                  className="w-full"
                >
                  {hasUploadedCurrent ? "Uploaded to Library" : isUploadingLibrary ? "Uploading..." : "Upload to Library"}
                </Button>
              </CardContent>
            </Card>

            <div>
              {isLoading ? (
                <div className="py-8 text-sm text-muted-foreground">Loading videos...</div>
              ) : visibleVideos.length === 0 ? (
                <div className="py-8 text-sm text-muted-foreground">No videos yet.</div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {visibleVideos.map((video) => (
                    <Card key={video.id} className="overflow-hidden rounded-xl border-border/50">
                      <div className="relative aspect-video bg-black">
                        <video src={video.videoUrl} controls className="h-full w-full object-cover" />
                      </div>
                      <CardContent className="space-y-2 p-3">
                        <p className="truncate text-sm font-semibold">{video.title}</p>
                        <p className="line-clamp-2 text-xs text-muted-foreground">{video.description || "AI video"}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-muted-foreground">{video.mood || "Chill"}</span>
                          <Button asChild size="sm" variant="outline" className="h-7 px-2 text-xs">
                            <a href={video.videoUrl} download>
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
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
