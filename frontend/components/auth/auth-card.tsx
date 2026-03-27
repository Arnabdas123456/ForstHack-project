import { ReactNode } from "react"
import Link from "next/link"
import { Music2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface AuthCardProps {
  title: string
  description: string
  children: ReactNode
}

export function AuthCard({ title, description, children }: AuthCardProps) {
  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_16%,rgba(56,189,248,0.2),transparent_26%),radial-gradient(circle_at_88%_15%,rgba(14,165,233,0.18),transparent_28%),radial-gradient(circle_at_50%_85%,rgba(249,115,22,0.08),transparent_26%)]" />

      <div className="relative mx-auto flex min-h-[84vh] w-full max-w-lg items-center justify-center">
        <Card className="w-full overflow-hidden rounded-3xl border-sky-200/20 py-0">
          <div className="h-1.5 brand-gradient-bg" />
          <CardHeader className="text-center pb-2 pt-7">
            <Link href="/" className="inline-flex items-center justify-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl brand-gradient-bg">
                <Music2 className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold brand-gradient-text">VibeVerse.ai</span>
            </Link>
            <CardTitle className="pt-4 text-2xl font-semibold text-slate-100">{title}</CardTitle>
            <CardDescription className="text-slate-400">{description}</CardDescription>
          </CardHeader>

          <CardContent className="p-6 pt-4">{children}</CardContent>
        </Card>
      </div>
    </div>
  )
}
