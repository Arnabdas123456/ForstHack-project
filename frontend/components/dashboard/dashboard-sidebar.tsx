"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { LayoutDashboard, Video, Library, Settings, LogOut, Home, Music2, Menu, X, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { logoutUser } from "@/lib/auth/client"

const sidebarLinks = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/ai-song-generator", icon: Sparkles, label: "AI Song Generator" },
  { href: "/generate", icon: Video, label: "Generate Video" },
  { href: "/library", icon: Library, label: "My Library" },
  { href: "/settings", icon: Settings, label: "Settings" },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const activeLabel = useMemo(() => {
    const current = sidebarLinks.find((link) => pathname === link.href)
    return current?.label || "Studio"
  }, [pathname])

  async function handleLogout() {
    setIsLoggingOut(true)
    try {
      await logoutUser()
      toast.success("Logged out successfully")
      router.push("/")
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to log out"
      toast.error(message)
    } finally {
      setIsLoggingOut(false)
      setMobileOpen(false)
    }
  }

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-slate-950/75 backdrop-blur-xl lg:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl brand-gradient-bg">
              <Music2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide text-slate-100">VibeVerse.ai</p>
              <p className="text-[11px] text-slate-400">{activeLabel}</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          />
        ) : null}
      </AnimatePresence>

      <aside
        className={cn(
          "fixed bottom-0 left-0 top-0 z-50 w-[18.5rem] border-r border-white/10 bg-slate-950/70 px-4 pb-4 pt-4 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="glass-panel panel-glow flex h-full flex-col overflow-hidden rounded-3xl p-3">
          <Link
            href="/dashboard"
            className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/65 px-3 py-3"
            onClick={() => setMobileOpen(false)}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl brand-gradient-bg transition-transform duration-300 group-hover:scale-105">
              <Music2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[15px] font-semibold tracking-wide text-slate-100">VibeVerse.ai</p>
              <p className="text-[11px] uppercase tracking-[0.2em] text-sky-200/80">AI Creative Studio</p>
            </div>
          </Link>

          <nav className="mt-4 flex-1 space-y-1.5 px-1">
            {sidebarLinks.map((link, index) => {
              const isActive = pathname === link.href
              return (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 + 0.08, duration: 0.25 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "group relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "surface-border bg-sky-400/10 text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                        : "text-slate-300/90 hover:bg-slate-800/65 hover:text-slate-100",
                    )}
                  >
                    <span className={cn("rounded-lg p-1.5", isActive ? "bg-sky-300/15" : "bg-slate-800/60")}> 
                      <link.icon className={cn("h-4 w-4", isActive ? "text-sky-200" : "text-slate-400 group-hover:text-sky-200")} />
                    </span>
                    <span>{link.label}</span>
                    {isActive ? <span className="status-dot ml-auto" /> : null}
                  </Link>
                </motion.div>
              )
            })}
          </nav>

          <div className="mt-4 space-y-3 border-t border-white/10 px-1 pt-4">
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/55 px-3 py-2">
              <span className="text-xs font-medium uppercase tracking-[0.15em] text-slate-400">Theme</span>
              <ThemeToggle />
            </div>

            <Button asChild variant="outline" className="w-full justify-start gap-2 rounded-xl">
              <Link href="/" onClick={() => setMobileOpen(false)}>
                <Home className="h-4 w-4" />
                Home
              </Link>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start gap-2 rounded-xl"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              <LogOut className="h-4 w-4" />
              {isLoggingOut ? "Logging out..." : "Logout"}
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}
