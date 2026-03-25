import { Star, Play } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface VideoCardProps {
  title: string
  theme: string
  rating: number
  thumbnail?: string
}

export function VideoCard({ title, theme, rating, thumbnail }: VideoCardProps) {
  return (
    <Card className="group overflow-hidden rounded-2xl border-border/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 hover:scale-105">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gradient-to-br from-purple-500/20 via-indigo-500/20 to-blue-500/20">
        {thumbnail ? (
          <img src={thumbnail} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
              <Play className="h-8 w-8 text-purple-600 dark:text-purple-400 ml-1" />
            </div>
          </div>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>

      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold truncate">{title}</h3>
            <Badge
              variant="secondary"
              className="mt-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
            >
              {theme}
            </Badge>
          </div>
        </div>

        {/* Rating */}
        <div className="mt-3 flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${
                i < rating
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-muted text-muted"
              }`}
            />
          ))}
          <span className="ml-1 text-sm text-muted-foreground">{rating}.0</span>
        </div>

        {/* View Button */}
        <Button
          className="mt-4 w-full bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 text-white hover:opacity-90 transition-all duration-300"
        >
          View
        </Button>
      </CardContent>
    </Card>
  )
}
