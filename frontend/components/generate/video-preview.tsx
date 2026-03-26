"use client"

import { Play } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface VideoPreviewProps {
  videoUrl?: string | null
  bannerUrl?: string | null
  isGenerating?: boolean
}

export function VideoPreview({
  videoUrl,
  bannerUrl,
  isGenerating = false,
}: VideoPreviewProps) {
  const hasVideo = Boolean(videoUrl)

  return (
    <Card className="overflow-hidden rounded-2xl border-border/50">
      <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-purple-500/20 via-indigo-500/20 to-blue-500/20">
        {hasVideo ? (
          <video
            src={videoUrl ?? undefined}
            controls
            className="h-full w-full object-cover"
            poster={bannerUrl ?? undefined}
          />
        ) : (
          <>
            {bannerUrl ? (
              <img
                src={bannerUrl}
                alt="Uploaded banner preview"
                className="h-full w-full object-cover"
              />
            ) : null}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm border border-border/50">
                <Play className="ml-1 h-10 w-10 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </>
        )}
        <div className="absolute bottom-4 right-4">
          <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
            {isGenerating ? "Generating..." : hasVideo ? "Ready" : "Preview"}
          </Badge>
        </div>
      </div>
      <CardContent className="p-4">
        <span className="text-sm text-muted-foreground">Preview</span>
      </CardContent>
    </Card>
  )
}
