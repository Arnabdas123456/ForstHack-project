"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Search, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { LibraryVideoCard } from "@/components/library/library-video-card"
import { Input } from "@/components/ui/input"
import { inferExtensionFromMimeType, normalizeMediaType } from "@/lib/media"
import { LIBRARY_CHANGED_EVENT, notifyLibraryChanged } from "@/lib/library/client"

type LibraryItem = {
  id: string
  title: string
  description: string | null
  tags: string | null
  theme: string | null
  mood: string | null
  songName: string | null
  thumbnailUrl: string | null
  mediaUrl?: string | null
  mediaType?: string | null
  videoUrl: string
  rating: number
  isInLibrary: number
  createdAt: string
  userId: string
}

export default function LibraryPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [items, setItems] = useState<LibraryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)
  const [downloadingItemId, setDownloadingItemId] = useState<string | null>(null)

  const loadLibrary = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/library", { cache: "no-store" })
      const data = (await response
        .json()
        .catch(() => ({}))) as { error?: string; items?: LibraryItem[] }

      if (!response.ok) {
        throw new Error(data.error || "Unable to load library")
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
      const message = loadError instanceof Error ? loadError.message : "Unable to load library"
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadLibrary()

    const handleLibraryChanged = () => {
      loadLibrary()
    }

    window.addEventListener(LIBRARY_CHANGED_EVENT, handleLibraryChanged)

    return () => {
      window.removeEventListener(LIBRARY_CHANGED_EVENT, handleLibraryChanged)
    }
  }, [loadLibrary])

  const filteredVideos = useMemo(
    () =>
      items.filter((video) => {
        const normalizedQuery = searchQuery.toLowerCase()
        return (
          video.title.toLowerCase().includes(normalizedQuery) ||
          (video.description || "").toLowerCase().includes(normalizedQuery) ||
          (video.tags || "").toLowerCase().includes(normalizedQuery) ||
          (video.theme || "").toLowerCase().includes(normalizedQuery) ||
          (video.songName || "").toLowerCase().includes(normalizedQuery) ||
          (video.mood || "").toLowerCase().includes(normalizedQuery)
        )
      }),
    [items, searchQuery],
  )

  const handleDelete = async (itemId: string) => {
    const shouldDelete = window.confirm("Delete this item from your library?")
    if (!shouldDelete) {
      return
    }

    const previousItems = items
    const nextItems = items.filter((item) => item.id !== itemId)
    setItems(nextItems)
    setDeletingItemId(itemId)

    try {
      const response = await fetch(`/api/library/${itemId}`, {
        method: "DELETE",
      })

      const data = (await response.json()) as { error?: string }

      if (!response.ok) {
        throw new Error(data.error || "Unable to delete library item")
      }

      notifyLibraryChanged()
      toast.success("Item deleted")
    } catch (deleteError) {
      setItems(previousItems)
      const message = deleteError instanceof Error ? deleteError.message : "Unable to delete library item"
      toast.error(message)
    } finally {
      setDeletingItemId(null)
    }
  }

  const handleDownload = async (item: LibraryItem) => {
    const mediaUrl = item.mediaUrl || item.videoUrl
    if (!mediaUrl) {
      toast.error("No media file found for this item.")
      return
    }

    setDownloadingItemId(item.id)

    try {
      const response = await fetch(mediaUrl)

      if (!response.ok) {
        throw new Error("Unable to download media")
      }

      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      const pathname = new URL(mediaUrl, window.location.origin).pathname
      const pathFilename = pathname.split("/").pop() || ""
      const hasExtension = /\.[a-z0-9]+$/i.test(pathFilename)
      const fallbackExtension =
        inferExtensionFromMimeType(blob.type) || (item.mediaType === "audio" ? "mp3" : "mp4")
      const sanitizedTitle = item.title.trim().replace(/[^a-zA-Z0-9-_]+/g, "-")
      const suggestedBaseName = sanitizedTitle || (item.mediaType === "audio" ? "ai-song" : "lofi-video")
      const suggestedFileName = `${suggestedBaseName}.${fallbackExtension}`

      anchor.href = objectUrl
      anchor.download = hasExtension ? pathFilename : suggestedFileName
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(objectUrl)
    } catch (downloadError) {
      const message = downloadError instanceof Error ? downloadError.message : "Unable to download media"
      toast.error(message)
    } finally {
      setDownloadingItemId(null)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <section className="spotlight rounded-3xl border border-sky-200/20 bg-slate-900/55 p-6 shadow-[0_24px_45px_rgba(2,6,23,0.45)] backdrop-blur-xl sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-sky-200/80">Collection</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-100 sm:text-4xl">My Library</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-300/85 sm:text-base">
                Browse, preview, download, and manage all generated media from a single polished workspace.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-2xl border border-sky-200/20 bg-slate-900/55 px-4 py-2 text-xs uppercase tracking-[0.15em] text-sky-100">
              <Sparkles className="h-4 w-4" />
              {items.length} Items
            </div>
          </div>
        </section>

        <div className="glass-panel rounded-2xl p-4">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search by title, mood, tags, song name..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="glass-panel animate-pulse rounded-2xl p-3">
                <div className="aspect-video rounded-xl bg-slate-800/65" />
                <div className="mt-3 h-3 w-2/3 rounded bg-slate-700/70" />
                <div className="mt-2 h-3 w-1/2 rounded bg-slate-800/70" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="glass-panel flex flex-col gap-4 rounded-2xl p-6">
            <p className="text-sm text-red-300">{error}</p>
            <button
              type="button"
              onClick={loadLibrary}
              className="w-fit rounded-md border border-sky-200/30 px-3 py-1.5 text-sm text-slate-200"
            >
              Retry
            </button>
          </div>
        ) : filteredVideos.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredVideos.map((video) => (
              <LibraryVideoCard
                key={video.id}
                title={video.title}
                description={video.description}
                theme={video.theme || video.mood || "LoFi"}
                rating={video.rating}
                mediaUrl={video.mediaUrl || video.videoUrl}
                mediaType={video.mediaType === "audio" ? "audio" : "video"}
                thumbnail={video.thumbnailUrl}
                createdAt={video.createdAt}
                songName={video.songName}
                onDelete={() => handleDelete(video.id)}
                onDownload={() => handleDownload(video)}
                isDeleting={deletingItemId === video.id}
                isDownloading={downloadingItemId === video.id}
              />
            ))}
          </div>
        ) : (
          <div className="glass-panel flex flex-col items-center justify-center rounded-3xl py-24 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-sky-200/20 bg-slate-900/70">
              <Search className="h-8 w-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100">No items found</h3>
            <p className="mt-1 text-sm text-slate-400">
              {items.length === 0 ? "Publish tracks or videos to build your library." : "Try adjusting your search."}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
