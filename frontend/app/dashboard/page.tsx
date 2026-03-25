import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { LibraryVideoCard } from "@/components/library/library-video-card"

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Welcome back! Here&apos;s your latest LoFi video.
          </p>
        </div>

        {/* Single Video Card (Library Style) */}
        <div className="max-w-sm">
          <LibraryVideoCard
            title="Midnight Study Session"
            theme="LoFi Bedroom"
            rating={5}
          />
          </div>
      </div>
    </DashboardLayout>
  )
}
