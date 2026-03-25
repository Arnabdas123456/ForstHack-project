"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { LibraryVideoCard } from "@/components/library/library-video-card"
import { Input } from "@/components/ui/input"
const libraryVideos = [{ id: 1, title: "Midnight Study Session", theme: "LoFi Bedroom", rating: 5 }]

export default function LibraryPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredVideos = libraryVideos.filter((video) =>
    video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    video.theme.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">My Library</h1>
          <p className="mt-1 text-muted-foreground">
            Browse and manage all your generated LoFi videos.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Single Video Card */}
        {filteredVideos.length > 0 ? (
          <div className="max-w-sm">
            {filteredVideos.map((video) => (
              <LibraryVideoCard
                key={video.id}
                title={video.title}
                theme={video.theme}
                rating={video.rating}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No videos found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Try adjusting your search.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
