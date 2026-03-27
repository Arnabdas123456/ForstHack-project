"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Download } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { LIBRARY_CHANGED_EVENT } from "@/lib/library/client"

type DashboardVideo = {
  id: string
  title: string
  description: string | null
  tags: string | null
  mood: string | null
  videoUrl: string
  isInLibrary: number
  createdAt: string
}

export default function DashboardPage() {
  const [items, setItems] = useState<DashboardVideo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadVideos = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/videos", { cache: "no-store" })
      const data = (await response
        .json()
        .catch(() => ({}))) as { error?: string; items?: DashboardVideo[] }

      if (!response.ok) {
        throw new Error(data.error || "Unable to load videos")
      }

      setItems(Array.isArray(data.items) ? data.items : [])
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Unable to load videos"
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadVideos()
    window.addEventListener(LIBRARY_CHANGED_EVENT, loadVideos)
    return () => window.removeEventListener(LIBRARY_CHANGED_EVENT, loadVideos)
  }, [loadVideos])

  const visibleItems = useMemo(() => items.slice(0, 30), [items])

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6 lg:p-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">All your generated videos in one place.</p>
        </div>

        {isLoading ? (
          <div className="py-8 text-sm text-muted-foreground">Loading generated videos...</div>
        ) : error ? (
          <div className="py-8 text-sm text-red-500">{error}</div>
        ) : visibleItems.length === 0 ? (
          <div className="py-8 text-sm text-muted-foreground">
            No videos yet. Generate one from AI Song Generator.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {visibleItems.map((item) => (
              <Card key={item.id} className="overflow-hidden rounded-xl border-border/50">
                <div className="relative aspect-video bg-black">
                  <video src={item.videoUrl} controls className="h-full w-full object-cover" />
                </div>
                <CardContent className="space-y-2 p-3">
                  <p className="truncate text-sm font-semibold">{item.title}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{item.description || "AI video"}</p>
                  <div className="flex items-center justify-between">
                    <span className="truncate text-[11px] text-muted-foreground">{item.mood || "Chill"}</span>
                    <Button asChild size="sm" variant="outline" className="h-7 px-2 text-xs">
                      <a href={item.videoUrl} download>
                        <Download className="mr-1 h-3.5 w-3.5" />
                        Download
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
