import Link from "next/link"
import { Music2, Twitter, Github, Youtube } from "lucide-react"

const socialLinks = [
  { href: "#", icon: Twitter, label: "Twitter" },
  { href: "#", icon: Github, label: "GitHub" },
  { href: "#", icon: Youtube, label: "YouTube" },
]

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-950/55 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="glass-panel panel-glow rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl brand-gradient-bg">
                <Music2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[1.05rem] font-semibold text-slate-100">VibeVerse.ai</p>
                <p className="text-xs uppercase tracking-[0.18em] text-sky-200/70">AI Creative Platform</p>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              {socialLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="elevate-hover flex h-10 w-10 items-center justify-center rounded-xl border border-sky-200/20 bg-slate-900/55 text-slate-300"
                  aria-label={link.label}
                >
                  <link.icon className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-6 border-t border-white/10 pt-5 text-xs text-slate-400 sm:flex sm:items-center sm:justify-between">
            <p>&copy; {new Date().getFullYear()} VibeVerse.ai. All rights reserved.</p>
            <p className="mt-1 sm:mt-0">Built for creators shipping cinematic AI experiences.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
