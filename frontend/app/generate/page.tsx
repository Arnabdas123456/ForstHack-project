"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Sparkles, Download, RefreshCw, Upload, Video } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { UploadZone } from "@/components/generate/upload-zone"
import { MusicUploadZone } from "@/components/generate/music-upload-zone"
import { VideoPreview } from "@/components/generate/video-preview"
import { StarRating } from "@/components/generate/star-rating"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { notifyLibraryChanged } from "@/lib/library/client"

export default function GeneratePage() {
  const router = useRouter()
  const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
  const [videoTitle, setVideoTitle] = useState("")
  const [videoDescription, setVideoDescription] = useState("")
  const [rating, setRating] = useState(0)
  const [isGenerated, setIsGenerated] = useState(false)
  const [songFile, setSongFile] = useState<File | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null)
  const [generatedBannerUrl, setGeneratedBannerUrl] = useState<string | null>(null)
  const [generatedMood, setGeneratedMood] = useState<string | null>(null)
  const [localBannerPreviewUrl, setLocalBannerPreviewUrl] = useState<string | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const previewSectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!bannerFile) {
      setLocalBannerPreviewUrl(null)
      return
    }

    const objectUrl = URL.createObjectURL(bannerFile)
    setLocalBannerPreviewUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [bannerFile])

  const normalizeUrl = (url: string) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url
    }
    return `${backendBaseUrl.replace(/\/$/, "")}/${url.replace(/^\//, "")}`
  }

  const handleGenerate = async () => {
    if (!bannerFile || !songFile) {
      const message = "Please upload both a banner image and an MP3 song."
      setGenerationError(message)
      toast.error(message)
      return
    }

    setGenerationError(null)
    setIsGenerating(true)
    setGeneratedVideoUrl(null)
    setGeneratedMood(null)

    try {
      const formData = new FormData()
      formData.append("banner", bannerFile)
      formData.append("song", songFile)

      const response = await fetch(`${backendBaseUrl.replace(/\/$/, "")}/generate-video`, {
        method: "POST",
        body: formData,
      })

      const payload = (await response.json()) as {
        video_url?: string
        banner_url?: string
        mood?: string
        detail?: string
      }

      if (!response.ok) {
        throw new Error(payload.detail || "Video generation failed. Please try again.")
      }

      if (!payload.video_url) {
        throw new Error("Video URL was not returned by backend.")
      }

      const nextVideoUrl = normalizeUrl(payload.video_url)
      const nextBannerUrl = payload.banner_url
        ? normalizeUrl(payload.banner_url)
        : localBannerPreviewUrl
      const uploadToastId = toast.loading("Saving generated video to Cloud...")

      let storedVideoUrl = nextVideoUrl
      try {
        const uploadResponse = await fetch("/api/uploadthing/video", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            videoUrl: nextVideoUrl,
          }),
        })

        const uploadPayload = (await uploadResponse.json()) as {
          url?: string
          error?: string
        }

        if (!uploadResponse.ok || !uploadPayload.url) {
          throw new Error(uploadPayload.error || "Unable to store video in Cloud")
        }

        storedVideoUrl = uploadPayload.url
      } finally {
        toast.dismiss(uploadToastId)
      }

      setGeneratedVideoUrl(storedVideoUrl)
      setGeneratedBannerUrl(nextBannerUrl ?? null)
      setGeneratedMood(payload.mood ?? null)
      setIsGenerated(true)
      toast.success("Video generated and stored successfully")

      requestAnimationFrame(() => {
        previewSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to generate video."
      setGenerationError(message)
      toast.error(message)
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePublishToLibrary = async () => {
    if (!generatedVideoUrl) {
      toast.error("Generate a video before publishing to your library.")
      return
    }

    setIsPublishing(true)
    try {
      const response = await fetch("/api/library", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: videoTitle.trim(),
          thumbnailUrl: generatedBannerUrl || localBannerPreviewUrl || undefined,
          videoUrl: generatedVideoUrl,
          createdAt: new Date().toISOString(),
          songName: songFile?.name,
          mood: generatedMood || undefined,
          rating,
        }),
      })

      const data = (await response.json()) as {
        error?: string
        fieldErrors?: Record<string, string[]>
      }

      if (!response.ok) {
        const firstFieldError =
          data.fieldErrors &&
          Object.values(data.fieldErrors).find((messages) => messages?.length)?.[0]
        throw new Error(firstFieldError || data.error || "Unable to publish this video")
      }

      notifyLibraryChanged()
      toast.success("Published to My Library")
      router.push("/library")
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to publish this video"
      toast.error(message)
    } finally {
      setIsPublishing(false)
    }
  }

  const isTitleValid = videoTitle.trim().length > 0
  const canGenerate = isTitleValid && !!songFile && !!bannerFile && !isGenerating

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <section className="spotlight rounded-3xl border border-sky-200/20 bg-slate-900/55 p-6 shadow-[0_24px_45px_rgba(2,6,23,0.45)] backdrop-blur-xl sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-sky-200/80">Video Forge</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-100 sm:text-4xl">Create Your LoFi Video</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-300/85 sm:text-base">
                Upload music and banner assets, generate an AI-composed visual loop, then finalize and publish in one seamless flow.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-2xl border border-sky-200/20 bg-slate-900/55 px-4 py-2 text-xs uppercase tracking-[0.15em] text-sky-100">
              <Video className="h-4 w-4" />
              Production Mode
            </div>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <Card className="overflow-hidden rounded-3xl border-sky-200/20 py-0">
              <CardHeader className="border-b border-white/10 pb-5 pt-6">
                <CardTitle className="text-lg text-slate-100">Upload Source Files</CardTitle>
                <CardDescription className="text-slate-400">
                  Provide an MP3 and a banner image to generate your cinematic loop.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-5">
                <MusicUploadZone onFileSelect={setSongFile} />
                <UploadZone onFileSelect={setBannerFile} />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="overflow-hidden rounded-3xl border-sky-200/20 py-0">
              <CardHeader className="border-b border-white/10 pb-5 pt-6">
                <CardTitle className="text-lg text-slate-100">Render Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-5">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-slate-200">Video Title</Label>
                  <Input
                    id="title"
                    placeholder="Late Night Skyline"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                  />
                  {!isTitleValid ? <p className="text-xs text-red-300">Video title is required to generate.</p> : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="video-description" className="text-slate-200">Video Description</Label>
                  <Textarea
                    id="video-description"
                    placeholder="Describe your visual mood and pacing..."
                    rows={3}
                    value={videoDescription}
                    onChange={(e) => setVideoDescription(e.target.value)}
                  />
                </div>
                <Button onClick={handleGenerate} disabled={!canGenerate} className="h-11 w-full rounded-xl text-sm font-semibold" size="lg">
                  <Sparkles className={isGenerating ? "mr-2 h-5 w-5 animate-spin" : "mr-2 h-5 w-5"} />
                  {isGenerating ? "Generating Video..." : "Generate Video"}
                </Button>
                {generationError ? <p className="text-sm text-red-300">{generationError}</p> : null}
              </CardContent>
            </Card>

            <VideoPreview
              videoUrl={generatedVideoUrl}
              bannerUrl={generatedBannerUrl || localBannerPreviewUrl}
              isGenerating={isGenerating}
            />
          </div>
        </div>

        {isGenerated && (
          <section ref={previewSectionRef} className="space-y-6 pt-2">
            <h2 className="text-2xl font-semibold text-slate-100 sm:text-3xl">Finalize And Publish</h2>
            <div className="grid gap-8 lg:grid-cols-2">
              <Card className="overflow-hidden rounded-3xl border-sky-200/20 py-0">
                <div className="relative aspect-video bg-black/70">
                  <video
                    src={generatedVideoUrl ?? undefined}
                    controls
                    className="h-full w-full object-cover"
                    poster={(generatedBannerUrl || localBannerPreviewUrl) ?? undefined}
                  />
                </div>
                <CardContent className="space-y-4 p-5">
                  <Input
                    placeholder="Video title"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    className="text-base font-semibold"
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button asChild className="h-10 rounded-xl">
                      <a href={generatedVideoUrl ?? "#"} download>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </a>
                    </Button>
                    <Button variant="outline" className="h-10 rounded-xl" onClick={handleGenerate} disabled={isGenerating}>
                      <RefreshCw className={isGenerating ? "mr-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4"} />
                      {isGenerating ? "Regenerating..." : "Regenerate"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden rounded-3xl border-sky-200/20 py-0">
                <CardHeader className="border-b border-white/10 pb-5 pt-6">
                  <CardTitle className="text-lg text-slate-100">Video Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-5">
                  <div className="space-y-2">
                    <Label className="text-slate-200">Rating</Label>
                    <StarRating rating={rating} onRatingChange={setRating} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-slate-200">Video Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your video..."
                      rows={3}
                      value={videoDescription}
                      onChange={(e) => setVideoDescription(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="about" className="text-slate-200">About This Song</Label>
                    <Textarea id="about" placeholder="Tell us about the music..." rows={3} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="comment" className="text-slate-200">Comment</Label>
                    <Input id="comment" placeholder="Add a comment..." />
                  </div>

                  <Button className="h-11 w-full rounded-xl" size="lg" onClick={handlePublishToLibrary} disabled={!generatedVideoUrl || isPublishing}>
                    <Upload className="mr-2 h-5 w-5" />
                    {isPublishing ? "Publishing..." : "Publish to Library"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </section>
        )}
      </div>
    </DashboardLayout>
  )
}
