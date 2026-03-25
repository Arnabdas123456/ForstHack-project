"use client"

import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarRatingProps {
  rating: number
  onRatingChange: (rating: number) => void
}

export function StarRating({ rating, onRatingChange }: StarRatingProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onRatingChange(i + 1)}
            className="transition-transform duration-200 hover:scale-110"
          >
            <Star
              className={cn(
                "h-6 w-6 transition-colors duration-200",
                i < rating
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-muted text-muted hover:fill-yellow-400/50 hover:text-yellow-400/50"
              )}
            />
          </button>
        ))}
      </div>
      <span className="text-sm text-muted-foreground">
        {rating > 0 ? `${rating} star${rating > 1 ? "s" : ""} selected` : "Select rating"}
      </span>
    </div>
  )
}
