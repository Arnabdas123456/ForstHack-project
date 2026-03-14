"use client"

import { Upload, Image } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export function UploadZone() {
  return (
    <Card className="overflow-hidden rounded-2xl border-2 border-dashed border-border/50 bg-card/50 transition-all duration-300 hover:border-purple-500/50 hover:bg-purple-500/5">
      <CardContent className="p-8">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/10 via-indigo-500/10 to-blue-500/10 ring-1 ring-purple-500/20">
            <Upload className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="mt-4 font-semibold">Drop your image here</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            or click to browse
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Image className="h-4 w-4" />
            <span>PNG, JPG, WEBP supported</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
