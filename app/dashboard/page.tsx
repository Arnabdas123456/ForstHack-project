import { Video, Download, Star } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { StatsCard } from "@/components/dashboard/stats-card"
import { VideoCard } from "@/components/dashboard/video-card"

const stats = [
  { title: "Total Videos", value: "24", icon: Video, description: "+3 this week" },
  { title: "Total Downloads", value: "156", icon: Download, description: "+12 this week" },
  { title: "Average Rating", value: "4.8", icon: Star, description: "Based on 24 videos" },
]

const recentVideos = [
  { title: "Midnight Study Session", theme: "LoFi Bedroom", rating: 5 },
  { title: "Rainy Day Vibes", theme: "Rainy City", rating: 4 },
  { title: "Sunset Dreams", theme: "Mountain Sunset", rating: 5 },
  { title: "Neon Nights", theme: "Cyberpunk Skyline", rating: 4 },
  { title: "Forest Meditation", theme: "Anime Nature", rating: 5 },
  { title: "Stargazing Beats", theme: "Night Sky", rating: 4 },
]

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Welcome back! Here&apos;s an overview of your LoFi videos.
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => (
            <StatsCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* Recent Videos */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-6">Recent Videos</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recentVideos.map((video) => (
              <VideoCard key={video.title} {...video} />
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
