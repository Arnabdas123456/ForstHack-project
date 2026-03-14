"use client"

import { useState } from "react"
import { Sparkles, Download, RefreshCw, Upload } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { ThemeSelector } from "@/components/generate/theme-selector"
import { UploadZone } from "@/components/generate/upload-zone"
import { VideoPreview } from "@/components/generate/video-preview"
import { StarRating } from "@/components/generate/star-rating"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function GeneratePage() {
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null)
  const [videoTitle, setVideoTitle] = useState("")
  const [rating, setRating] = useState(0)
  const [isGenerated, setIsGenerated] = useState(false)

  const handleGenerate = () => {
    setIsGenerated(true)
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
                  Upload a custom banner or select from our presets
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <UploadZone />
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
                  disabled={!selectedTheme}
                  className="w-full bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 text-white hover:opacity-90 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                  size="lg"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate Video
                </Button>
              </CardContent>
            </Card>

            {/* Preview */}
            <VideoPreview selectedTheme={selectedTheme} />
          </div>
        </div>

        {/* Post-Generation Section */}
        {isGenerated && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Finalize Your LoFi Video</h2>
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Left - Video Preview */}
              <Card className="overflow-hidden rounded-2xl border-border/50">
                <div className="relative aspect-video bg-gradient-to-br from-purple-500/20 via-indigo-500/20 to-blue-500/20">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm border border-border/50">
                      <Sparkles className="h-10 w-10 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                </div>
                <CardContent className="p-6 space-y-4">
                  <Input
                    placeholder="Video title"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    className="text-lg font-semibold"
                  />
                  <div className="flex gap-3">
                    <Button className="flex-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 text-white hover:opacity-90 transition-all duration-300">
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                    <Button variant="outline" className="flex-1 transition-all duration-300 hover:scale-105">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Regenerate
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
