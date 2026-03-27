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
    <Card className="overflow-hidden rounded-3xl border-sky-200/20 py-0">
      <div className="relative aspect-video overflow-hidden bg-slate-950/60">
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
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={bannerUrl}
                alt="Uploaded banner preview"
                className="h-full w-full object-cover"
              />
            ) : null}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-slate-950/75 backdrop-blur-sm">
                <Play className="ml-1 h-10 w-10 text-sky-100" />
              </div>
            </div>
          </>
        )}
        <div className="absolute bottom-4 right-4">
          <Badge variant="secondary" className="rounded-full border border-white/20 bg-slate-950/70 px-3 py-1 text-xs text-slate-100">
            {isGenerating ? "Generating..." : hasVideo ? "Ready" : "Preview"}
          </Badge>
        </div>
      </div>
      <CardContent className="p-4">
        <span className="text-xs uppercase tracking-[0.14em] text-slate-400">Preview Panel</span>
      </CardContent>
    </Card>
  )
}
