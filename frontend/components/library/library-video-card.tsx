"use client"

import { Star, Play, Download, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface LibraryVideoCardProps {
  title: string
  theme: string
  rating: number
  thumbnail?: string
  onDelete?: () => void
}

export function LibraryVideoCard({ title, theme, rating, thumbnail, onDelete }: LibraryVideoCardProps) {
  return (
    <Card className="group overflow-hidden rounded-2xl border-border/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 hover:scale-[1.02]">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gradient-to-br from-purple-500/20 via-indigo-500/20 to-blue-500/20">
        {thumbnail ? (
          <img src={thumbnail} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
              <Play className="h-7 w-7 text-purple-600 dark:text-purple-400 ml-1" />
            </div>
          </div>
        )}
        {/* Hover overlay with actions */}
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex items-center justify-center gap-3">
          <Button
            size="icon"
            className="bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 text-white hover:opacity-90"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold truncate">{title}</h3>
        
        <div className="mt-3 flex items-center justify-between">
          <Badge
            variant="secondary"
            className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
          >
            {theme}
          </Badge>
          
          {/* Rating */}
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-3.5 w-3.5 ${
                  i < rating
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-muted text-muted"
                }`}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
