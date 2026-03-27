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
    <Card className="elevate-hover group overflow-hidden rounded-2xl border-sky-200/20 py-0">
      <div className="relative aspect-video bg-slate-950/70">
        {thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbnail} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-slate-950/75 backdrop-blur-sm transition-transform duration-300 group-hover:scale-105">
              <Play className="ml-0.5 h-8 w-8 text-sky-200" />
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent" />
      </div>

      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-slate-100">{title}</h3>
            <Badge variant="secondary" className="mt-2 rounded-full border border-sky-200/20 bg-sky-300/10 text-[11px] text-sky-100">
              {theme}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`h-3.5 w-3.5 ${i < rating ? "fill-amber-300 text-amber-300" : "fill-slate-700 text-slate-700"}`} />
          ))}
          <span className="ml-1 text-xs text-slate-400">{rating}.0</span>
        </div>

        <Button className="h-9 w-full rounded-xl text-sm">View</Button>
      </CardContent>
    </Card>
  )
}
