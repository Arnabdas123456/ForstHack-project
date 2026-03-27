"use client"

import Link from "next/link"
import { Music2, Menu, X, LogOut } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { AUTH_STATE_CHANGED_EVENT, logoutUser } from "@/lib/auth/client"

const navLinks = [
  { href: "/#features", label: "Features" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/#pricing", label: "Pricing" },
]

export function Navbar() {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userName, setUserName] = useState("")
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const loadCurrentUser = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me", { cache: "no-store" })

      if (!response.ok) {
        setIsAuthenticated(false)
        setUserName("")
        return
      }

      const data = (await response.json()) as { user?: { name?: string } }
      const name = data.user?.name?.trim() ?? ""
      setIsAuthenticated(true)
      setUserName(name)
    } catch {
      setIsAuthenticated(false)
      setUserName("")
    }
  }, [])

  useEffect(() => {
    loadCurrentUser()

    const handleAuthChanged = () => {
      loadCurrentUser()
    }

    window.addEventListener(AUTH_STATE_CHANGED_EVENT, handleAuthChanged)

    return () => {
      window.removeEventListener(AUTH_STATE_CHANGED_EVENT, handleAuthChanged)
    }
  }, [loadCurrentUser])

  async function handleLogout() {
    setIsAuthenticated(false)
    setUserName("")
    setIsLoggingOut(true)

    try {
      await logoutUser()
      router.refresh()
    } catch {
      await loadCurrentUser()
    } finally {
      setIsLoggingOut(false)
      setMobileMenuOpen(false)
    }
  }

  const userInitial = useMemo(() => {
    const firstChar = userName.charAt(0)
    return (firstChar || "U").toUpperCase()
  }, [userName])

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/65 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group flex items-center gap-2"
          aria-label="Go to home page"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl brand-gradient-bg transition-transform duration-300 group-hover:scale-105">
            <Music2 className="h-4 w-4" />
          </div>
          <div>
            <span className="block text-[1.05rem] font-semibold tracking-wide text-slate-100">VibeVerse.ai</span>
            <span className="block text-[10px] uppercase tracking-[0.2em] text-sky-200/70">AI Studio</span>
          </div>
        </Link>

        <div className="hidden md:flex md:items-center md:gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800/60 hover:text-slate-100"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {isAuthenticated ? (
            <div className="hidden items-center gap-2 md:flex">
              <div className="inline-flex items-center gap-2 rounded-xl border border-sky-200/20 bg-slate-900/55 px-2.5 py-1.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full brand-gradient-bg text-xs font-semibold text-slate-100">
                  {userInitial}
                </div>
                {userName ? <span className="max-w-24 truncate text-xs text-slate-200">{userName}</span> : null}
              </div>
              <Button
                variant="outline"
                className="h-8 rounded-xl px-3 text-xs"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                <LogOut className="h-3.5 w-3.5" />
                {isLoggingOut ? "Logging out..." : "Logout"}
              </Button>
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Link href="/login">
                <Button variant="ghost" className="h-8 rounded-xl px-3 text-xs">Login</Button>
              </Link>
              <Link href="/register">
                <Button className="h-8 rounded-xl px-3 text-xs">Get Started</Button>
              </Link>
            </div>
          )}

          <Button
            variant="outline"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileMenuOpen ? (
          <>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm md:hidden"
              aria-label="Close mobile menu"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
              className="relative z-50 border-t border-white/10 bg-slate-950/85 px-4 py-4 backdrop-blur-xl md:hidden"
            >
              <div className="space-y-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block rounded-xl border border-white/10 bg-slate-900/55 px-3 py-2.5 text-sm text-slate-200"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              {isAuthenticated ? (
                <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
                  <div className="flex items-center gap-2 rounded-xl border border-sky-200/20 bg-slate-900/55 px-3 py-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full brand-gradient-bg text-xs font-semibold text-slate-100">
                      {userInitial}
                    </div>
                    <span className="text-sm text-slate-200">{userName || "User"}</span>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full justify-start rounded-xl"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                  >
                    <LogOut className="h-4 w-4" />
                    {isLoggingOut ? "Logging out..." : "Logout"}
                  </Button>
                </div>
              ) : (
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/10 pt-3">
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full rounded-xl">Login</Button>
                  </Link>
                  <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full rounded-xl">Get Started</Button>
                  </Link>
                </div>
              )}
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </header>
  )
}
