"use client"

import { useState } from "react"
import { Search, Filter, Grid, List } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { LibraryVideoCard } from "@/components/library/library-video-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const libraryVideos = [
  { id: 1, title: "Midnight Study Session", theme: "LoFi Bedroom", rating: 5 },
  { id: 2, title: "Rainy Day Vibes", theme: "Rainy City", rating: 4 },
  { id: 3, title: "Sunset Dreams", theme: "Mountain Sunset", rating: 5 },
  { id: 4, title: "Neon Nights", theme: "Cyberpunk Skyline", rating: 4 },
  { id: 5, title: "Forest Meditation", theme: "Anime Nature", rating: 5 },
  { id: 6, title: "Stargazing Beats", theme: "Night Sky", rating: 4 },
  { id: 7, title: "Morning Coffee", theme: "LoFi Bedroom", rating: 5 },
  { id: 8, title: "City Lights", theme: "Cyberpunk Skyline", rating: 3 },
  { id: 9, title: "Ocean Waves", theme: "Anime Nature", rating: 4 },
]

export default function LibraryPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("newest")

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
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-3">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center rounded-lg border border-border/50 p-1">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Grid className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Video Grid */}
        {filteredVideos.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
              Try adjusting your search or create a new video.
            </p>
          </div>
        )}

        {/* Stats Footer */}
        <div className="mt-12 flex items-center justify-center gap-8 border-t border-border/40 pt-8 text-center">
          <div>
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
              {libraryVideos.length}
            </div>
            <div className="text-sm text-muted-foreground">Total Videos</div>
          </div>
          <div className="h-8 w-px bg-border/40" />
          <div>
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
              6
            </div>
            <div className="text-sm text-muted-foreground">Themes Used</div>
          </div>
          <div className="h-8 w-px bg-border/40" />
          <div>
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
              4.3
            </div>
            <div className="text-sm text-muted-foreground">Avg Rating</div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
