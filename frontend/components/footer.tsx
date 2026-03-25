import Link from "next/link"
import { Music, Twitter, Github, Youtube } from "lucide-react"

const socialLinks = [
  { href: "#", icon: Twitter, label: "Twitter" },
  { href: "#", icon: Github, label: "GitHub" },
  { href: "#", icon: Youtube, label: "YouTube" },
]

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500">
              <Music className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
              AI LoFi
            </span>
          </Link>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            {socialLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-all duration-300 hover:bg-primary hover:text-primary-foreground hover:scale-105"
                aria-label={link.label}
              >
                <link.icon className="h-5 w-5" />
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-8 border-t border-border/40 pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} AI LoFi. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
