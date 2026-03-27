"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Sparkles, Download, RefreshCw, Upload } from "lucide-react"
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
      const uploadToastId = toast.loading("Saving generated video to UploadThing...")

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
          throw new Error(uploadPayload.error || "Unable to store video in UploadThing")
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
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Create Your LoFi Video</h1>
          <p className="mt-1 text-muted-foreground">
            Add your title, music, and banner, then generate your video.
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left Side - Uploads */}
          <div className="space-y-6">
            {/* Upload Section */}
            <Card className="overflow-hidden rounded-2xl border-border/50">
              <CardHeader>
                <CardTitle>Upload Your Files</CardTitle>
                <CardDescription>
                  Upload your MP3 and banner image to generate the video
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <MusicUploadZone onFileSelect={setSongFile} />
                <UploadZone onFileSelect={setBannerFile} />
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Settings & Preview */}
          <div className="space-y-6">
            {/* Video Settings */}
            <Card className="overflow-hidden rounded-2xl border-border/50">
              <CardHeader>
                <CardTitle>Video Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Video Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter your video title"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                  />
                  {!isTitleValid ? (
                    <p className="text-xs text-red-500">Video title is required to generate.</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="video-description">Video Description</Label>
                  <Textarea
                    id="video-description"
                    placeholder="Describe your video..."
                    rows={3}
                    value={videoDescription}
                    onChange={(e) => setVideoDescription(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  className="w-full bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 text-white hover:opacity-90 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                  size="lg"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  {isGenerating ? "Generating..." : "Generate Video"}
                </Button>
                {generationError ? <p className="text-sm text-red-500">{generationError}</p> : null}
              </CardContent>
            </Card>

            {/* Preview */}
            <VideoPreview
              videoUrl={generatedVideoUrl}
              bannerUrl={generatedBannerUrl || localBannerPreviewUrl}
              isGenerating={isGenerating}
            />
          </div>
        </div>

        {/* Post-Generation Section */}
        {isGenerated && (
          <div ref={previewSectionRef} className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Finalize Your LoFi Video</h2>
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Left - Video Preview */}
              <Card className="overflow-hidden rounded-2xl border-border/50">
                <div className="relative aspect-video bg-gradient-to-br from-purple-500/20 via-indigo-500/20 to-blue-500/20">
                  <video
                    src={generatedVideoUrl ?? undefined}
                    controls
                    className="h-full w-full object-cover"
                    poster={(generatedBannerUrl || localBannerPreviewUrl) ?? undefined}
                  />
                </div>
                <CardContent className="p-6 space-y-4">
                  <Input
                    placeholder="Video title"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    className="text-lg font-semibold"
                  />
                  <div className="flex gap-3">
                    <Button
                      asChild
                      className="flex-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 text-white hover:opacity-90 transition-all duration-300"
                    >
                      <a href={generatedVideoUrl ?? "#"} download>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 transition-all duration-300 hover:scale-105"
                      onClick={handleGenerate}
                      disabled={isGenerating}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      {isGenerating ? "Regenerating..." : "Regenerate"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Right - Details */}
              <Card className="overflow-hidden rounded-2xl border-border/50">
                <CardHeader>
                  <CardTitle>Video Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Rating */}
                  <div className="space-y-2">
                    <Label>Rating</Label>
                    <StarRating rating={rating} onRatingChange={setRating} />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Video Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your video..."
                      rows={3}
                      value={videoDescription}
                      onChange={(e) => setVideoDescription(e.target.value)}
                    />
                  </div>

                  {/* About Song */}
                  <div className="space-y-2">
                    <Label htmlFor="about">About This Song</Label>
                    <Textarea
                      id="about"
                      placeholder="Tell us about the music..."
                      rows={3}
                    />
                  </div>

                  {/* Comment */}
                  <div className="space-y-2">
                    <Label htmlFor="comment">Comment</Label>
                    <Input
                      id="comment"
                      placeholder="Add a comment..."
                    />
                  </div>

                  {/* Publish Button */}
                  <Button
                    className="w-full bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 text-white hover:opacity-90 transition-all duration-300 hover:scale-105"
                    size="lg"
                    onClick={handlePublishToLibrary}
                    disabled={!generatedVideoUrl || isPublishing}
                  >
                    <Upload className="mr-2 h-5 w-5" />
                    {isPublishing ? "Publishing..." : "Publish to Library"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
