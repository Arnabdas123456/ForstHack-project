"use client"

import { Download, Play, Star, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface LibraryVideoCardProps {
  title: string
  theme: string
  rating: number
  videoUrl: string
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
  videoUrl,
  thumbnail,
  createdAt,
  songName,
  description,
  onDelete,
  onDownload,
  isDeleting,
  isDownloading,
}: LibraryVideoCardProps) {
  return (
    <Card className="group overflow-hidden rounded-xl border-border/50">
      <div className="relative aspect-video bg-gradient-to-br from-purple-500/20 via-indigo-500/20 to-blue-500/20">
        <video
          src={videoUrl}
          controls
          className="h-full w-full object-cover"
          poster={thumbnail || undefined}
        />
        {!thumbnail ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background/70 backdrop-blur-sm">
              <Play className="ml-0.5 h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        ) : null}
      </div>

      <CardContent className="space-y-2 p-3">
        <h3 className="truncate text-sm font-semibold">{title}</h3>
        {description ? <p className="line-clamp-2 text-xs text-muted-foreground">{description}</p> : null}

        <div className="flex items-center justify-between">
          <Badge
            variant="secondary"
            className="h-6 border-purple-500/20 bg-purple-500/10 text-[11px] text-purple-600 dark:text-purple-400"
          >
            {theme}
          </Badge>
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${i < rating ? "fill-yellow-400 text-yellow-400" : "fill-muted text-muted"}`}
              />
            ))}
          </div>
        </div>

        {songName ? <p className="truncate text-xs text-muted-foreground">Song: {songName}</p> : null}
        {createdAt ? (
          <p className="text-xs text-muted-foreground">
            Created {new Date(createdAt).toLocaleString()}
          </p>
        ) : null}

        <div className="flex gap-2">
          <Button
            className="h-8 flex-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 text-xs text-white hover:opacity-90"
            onClick={onDownload}
            disabled={isDownloading}
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            {isDownloading ? "Downloading..." : "Download"}
          </Button>
          <Button
            variant="destructive"
            className="h-8 flex-1 text-xs"
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
