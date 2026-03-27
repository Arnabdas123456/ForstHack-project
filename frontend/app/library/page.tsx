"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Search } from "lucide-react"
import { toast } from "sonner"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { LibraryVideoCard } from "@/components/library/library-video-card"
import { Input } from "@/components/ui/input"
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

      setItems(Array.isArray(data.items) ? data.items : [])
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
    const shouldDelete = window.confirm("Delete this video from your library?")
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
      toast.success("Video deleted")
    } catch (deleteError) {
      setItems(previousItems)
      const message = deleteError instanceof Error ? deleteError.message : "Unable to delete library item"
      toast.error(message)
    } finally {
      setDeletingItemId(null)
    }
  }

  const handleDownload = async (item: LibraryItem) => {
    setDownloadingItemId(item.id)

    try {
      const response = await fetch(item.videoUrl)

      if (!response.ok) {
        throw new Error("Unable to download video")
      }

      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      const pathname = new URL(item.videoUrl, window.location.origin).pathname
      const pathFilename = pathname.split("/").pop() || "video.mp4"
      const extension = pathFilename.includes(".") ? "" : ".mp4"
      const sanitizedTitle = item.title.trim().replace(/[^a-zA-Z0-9-_]+/g, "-")
      const suggestedFileName = `${sanitizedTitle || "lofi-video"}${extension || ""}`

      anchor.href = objectUrl
      anchor.download = pathFilename || suggestedFileName
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(objectUrl)
    } catch (downloadError) {
      const message = downloadError instanceof Error ? downloadError.message : "Unable to download video"
      toast.error(message)
    } finally {
      setDownloadingItemId(null)
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">My Library</h1>
          <p className="mt-1 text-muted-foreground">Browse and manage all your generated LoFi videos.</p>
        </div>

        <div className="mb-8">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="py-10 text-sm text-muted-foreground">Loading your library...</div>
        ) : error ? (
          <div className="flex flex-col gap-4 py-10">
            <p className="text-sm text-red-500">{error}</p>
            <button
              type="button"
              onClick={loadLibrary}
              className="w-fit rounded-md border px-3 py-1.5 text-sm"
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
                videoUrl={video.videoUrl}
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
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No videos found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {items.length === 0 ? "Publish videos from Generate to build your library." : "Try adjusting your search."}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
