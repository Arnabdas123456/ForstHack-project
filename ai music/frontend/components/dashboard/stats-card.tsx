import { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface StatsCardProps {
  title: string
  value: string
  icon: LucideIcon
  description?: string
}

export function StatsCard({ title, value, icon: Icon, description }: StatsCardProps) {
  return (
    <Card className="elevate-hover overflow-hidden rounded-2xl border-sky-200/20 py-0">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-slate-400">{title}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-100">{value}</p>
            {description ? <p className="mt-1 text-xs text-slate-500">{description}</p> : null}
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-sky-200/20 bg-slate-900/60">
            <Icon className="h-5 w-5 text-sky-200" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
