"use client"

import { Download, Play, Star, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface LibraryVideoCardProps {
  title: string
  theme: string
  rating: number
  thumbnail?: string | null
  createdAt?: string
  songName?: string | null
  onDelete?: () => void
  onDownload?: () => void
  isDeleting?: boolean
  isDownloading?: boolean
}

export function LibraryVideoCard({
  title,
  theme,
  rating,
  thumbnail,
  createdAt,
  songName,
  onDelete,
  onDownload,
  isDeleting,
  isDownloading,
}: LibraryVideoCardProps) {
  return (
    <Card className="group overflow-hidden rounded-2xl border-border/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 hover:scale-[1.02]">
      <div className="relative aspect-video bg-gradient-to-br from-purple-500/20 via-indigo-500/20 to-blue-500/20">
        {thumbnail ? (
          <img src={thumbnail} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
              <Play className="ml-1 h-7 w-7 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center gap-3 bg-background/60 opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
          <Button
            size="icon"
            className="bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 text-white hover:opacity-90"
            onClick={onDownload}
            disabled={isDownloading}
            aria-label="Download video"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="destructive"
            onClick={onDelete}
            disabled={isDeleting}
            aria-label="Delete video"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <CardContent className="space-y-3 p-4">
        <h3 className="truncate font-semibold">{title}</h3>

        <div className="flex items-center justify-between">
          <Badge
            variant="secondary"
            className="border-purple-500/20 bg-purple-500/10 text-purple-600 dark:text-purple-400"
          >
            {theme}
          </Badge>
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-3.5 w-3.5 ${
                  i < rating ? "fill-yellow-400 text-yellow-400" : "fill-muted text-muted"
                }`}
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
            className="flex-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 text-white hover:opacity-90"
            onClick={onDownload}
            disabled={isDownloading}
          >
            <Download className="mr-2 h-4 w-4" />
            {isDownloading ? "Downloading..." : "Download"}
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={onDelete}
            disabled={isDeleting}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
