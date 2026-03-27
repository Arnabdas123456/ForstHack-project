"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Download, Disc3, Film, Library, Sparkles } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { normalizeMediaType } from "@/lib/media"
import { LIBRARY_CHANGED_EVENT } from "@/lib/library/client"

type DashboardMedia = {
  id: string
  title: string
  description: string | null
  tags: string | null
  mood: string | null
  mediaUrl?: string | null
  mediaType?: string | null
  videoUrl: string
  isInLibrary: number
  createdAt: string
}

export default function DashboardPage() {
  const [items, setItems] = useState<DashboardMedia[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadVideos = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/videos", { cache: "no-store" })
      const data = (await response
        .json()
        .catch(() => ({}))) as { error?: string; items?: DashboardMedia[] }

      if (!response.ok) {
        throw new Error(data.error || "Unable to load videos")
      }

      const normalizedItems = (Array.isArray(data.items) ? data.items : []).map((item) => {
        const mediaUrl = item.mediaUrl || item.videoUrl
        const mediaType = normalizeMediaType(item.mediaType, mediaUrl)
        return {
          ...item,
          mediaUrl,
          mediaType,
        }
      })

      setItems(normalizedItems)
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

  const stats = useMemo(() => {
    const songs = items.filter((item) => item.mediaType === "audio").length
    const videos = items.filter((item) => item.mediaType !== "audio").length
    const inLibrary = items.filter((item) => item.isInLibrary === 1).length
    return { songs, videos, inLibrary, total: items.length }
  }, [items])

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <section className="spotlight rounded-3xl border border-sky-200/20 bg-slate-900/55 p-6 shadow-[0_24px_45px_rgba(2,6,23,0.45)] backdrop-blur-xl sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-sky-200/80">Overview</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-100 sm:text-4xl">Creator Dashboard</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300/85 sm:text-base">
                Track all generated songs and videos, jump into previews quickly, and keep your best work ready for publishing.
              </p>
            </div>
            <div className="rounded-2xl border border-sky-200/20 bg-slate-900/55 px-4 py-3 text-right">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Status</p>
              <p className="mt-1 inline-flex items-center gap-2 text-sm text-slate-200">
                <span className="status-dot" />
                Workspace Synced
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Total Media", value: stats.total, icon: Sparkles },
              { label: "AI Songs", value: stats.songs, icon: Disc3 },
              { label: "AI Videos", value: stats.videos, icon: Film },
              { label: "In Library", value: stats.inLibrary, icon: Library },
            ].map((stat) => (
              <div key={stat.label} className="glass-panel elevate-hover rounded-2xl px-4 py-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{stat.label}</p>
                  <stat.icon className="h-4 w-4 text-sky-200" />
                </div>
                <p className="mt-2 text-2xl font-semibold text-slate-100">{stat.value}</p>
              </div>
            ))}
          </div>
        </section>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, idx) => (
              <div key={idx} className="glass-panel animate-pulse rounded-2xl p-3">
                <div className="aspect-video rounded-xl bg-slate-800/65" />
                <div className="mt-3 h-3 w-2/3 rounded bg-slate-700/70" />
                <div className="mt-2 h-3 w-1/2 rounded bg-slate-800/70" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="glass-panel rounded-2xl p-5 text-sm text-red-300">{error}</div>
        ) : visibleItems.length === 0 ? (
          <div className="glass-panel rounded-3xl p-10 text-center">
            <h2 className="text-lg font-medium text-slate-100">No media generated yet</h2>
            <p className="mt-2 text-sm text-slate-400">Create your first track or video to populate this dashboard.</p>
          </div>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {visibleItems.map((item) => (
              <Card key={item.id} className="elevate-hover overflow-hidden rounded-2xl border-sky-200/20 py-0">
                <div className="relative aspect-video bg-black/60">
                  {item.mediaType === "audio" ? (
                    <div className="flex h-full items-center justify-center p-4">
                      <audio src={item.mediaUrl || item.videoUrl} controls className="w-full" />
                    </div>
                  ) : (
                    <video src={item.mediaUrl || item.videoUrl} controls className="h-full w-full object-cover" />
                  )}
                </div>
                <CardContent className="space-y-2 p-3">
                  <p className="truncate text-sm font-semibold text-slate-100">{item.title}</p>
                  <p className="line-clamp-2 text-xs text-slate-400">
                    {item.description || (item.mediaType === "audio" ? "AI song" : "AI video")}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="truncate text-[11px] uppercase tracking-[0.14em] text-slate-500">{item.mood || "Chill"}</span>
                    <Button asChild size="sm" variant="outline" className="h-7 px-2 text-xs">
                      <a href={item.mediaUrl || item.videoUrl} download>
                        <Download className="mr-1 h-3.5 w-3.5" />
                        Download
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>
        )}
      </div>
    </DashboardLayout>
  )
}
