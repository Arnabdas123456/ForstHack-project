"use client"

import { useEffect, useRef, useState } from "react"
import { Sparkles, Download, RefreshCw, Upload } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { ThemeSelector } from "@/components/generate/theme-selector"
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

export default function GeneratePage() {
  const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null)
  const [videoTitle, setVideoTitle] = useState("")
  const [rating, setRating] = useState(0)
  const [isGenerated, setIsGenerated] = useState(false)
  const [songFile, setSongFile] = useState<File | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null)
  const [generatedBannerUrl, setGeneratedBannerUrl] = useState<string | null>(null)
  const [localBannerPreviewUrl, setLocalBannerPreviewUrl] = useState<string | null>(null)
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

      setGeneratedVideoUrl(nextVideoUrl)
      setGeneratedBannerUrl(nextBannerUrl ?? null)
      setIsGenerated(true)
      toast.success("Video generated successfully")

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

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Create Your LoFi Video</h1>
          <p className="mt-1 text-muted-foreground">
            Choose a theme, add your music, and generate stunning visuals.
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left Side - Theme Selection */}
          <div className="space-y-6">
            {/* Upload Section */}
            <Card className="overflow-hidden rounded-2xl border-border/50">
              <CardHeader>
                <CardTitle>Choose Your Anime Theme</CardTitle>
                <CardDescription>
                  Upload your music and banner, or select from our presets
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <MusicUploadZone onFileSelect={setSongFile} />
                <UploadZone onFileSelect={setBannerFile} />
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or choose a preset</span>
                  </div>
                </div>
                <ThemeSelector
                  selectedTheme={selectedTheme}
                  onSelectTheme={setSelectedTheme}
                />
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
                </div>
                <Button
                  onClick={handleGenerate}
                  disabled={!selectedTheme || !songFile || !bannerFile || isGenerating}
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
              selectedTheme={selectedTheme}
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
                  >
                    <Upload className="mr-2 h-5 w-5" />
                    Publish to Library
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
