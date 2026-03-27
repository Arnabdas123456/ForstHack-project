"use client"

import { Download, Play, Star, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { normalizeMediaType } from "@/lib/media"

interface LibraryVideoCardProps {
  title: string
  theme: string
  rating: number
  mediaUrl?: string
  videoUrl?: string
  mediaType?: "video" | "audio" | null
  thumbnail?: string | null
  createdAt?: string
  songName?: string | null
  description?: string | null
  onDelete?: () => void
  onDownload?: () => void
  isDeleting?: boolean
  isDownloading?: boolean
}

export function LibraryVideoCard({
  title,
  theme,
  rating,
  mediaUrl,
  videoUrl,
  mediaType,
  thumbnail,
  createdAt,
  songName,
  description,
  onDelete,
  onDownload,
  isDeleting,
  isDownloading,
}: LibraryVideoCardProps) {
  const resolvedMediaUrl = mediaUrl || videoUrl || ""
  const resolvedMediaType = normalizeMediaType(mediaType || null, resolvedMediaUrl)

  return (
    <Card className="elevate-hover group overflow-hidden rounded-2xl border-sky-200/20 py-0">
      <div className="relative aspect-video bg-slate-950/60">
        {resolvedMediaType === "audio" ? (
          <div className="flex h-full items-center justify-center p-4">
            <audio src={resolvedMediaUrl} controls className="w-full" />
          </div>
        ) : (
          <>
            <video
              src={resolvedMediaUrl}
              controls
              className="h-full w-full object-cover"
              poster={thumbnail || undefined}
            />
            {!thumbnail ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-slate-950/75 backdrop-blur-sm">
                  <Play className="ml-0.5 h-4 w-4 text-sky-100" />
                </div>
              </div>
            ) : null}
          </>
        )}

        <div className="absolute left-3 top-3 rounded-full border border-white/25 bg-slate-950/65 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-slate-200">
          {resolvedMediaType === "audio" ? "Audio" : "Video"}
        </div>
      </div>

      <CardContent className="space-y-2 p-3">
        <h3 className="truncate text-sm font-semibold text-slate-100">{title}</h3>
        {description ? <p className="line-clamp-2 text-xs text-slate-400">{description}</p> : null}

        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary" className="h-6 rounded-full border border-sky-200/20 bg-sky-300/10 text-[11px] text-sky-100">
            {theme}
          </Badge>
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${i < rating ? "fill-amber-300 text-amber-300" : "fill-slate-700 text-slate-700"}`}
              />
            ))}
          </div>
        </div>

        {songName ? <p className="truncate text-xs text-slate-400">Song: {songName}</p> : null}
        {createdAt ? (
          <p className="text-xs text-slate-500">Created {new Date(createdAt).toLocaleString()}</p>
        ) : null}

        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            className="h-8 rounded-lg text-xs"
            onClick={onDownload}
            disabled={isDownloading || !resolvedMediaUrl}
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            {isDownloading ? "Downloading..." : "Download"}
          </Button>
          <Button
            variant="destructive"
            className="h-8 rounded-lg text-xs"
            onClick={onDelete}
            disabled={isDeleting}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
