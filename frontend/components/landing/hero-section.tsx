"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

const stats = [
  { value: "10K+", label: "Media Generated" },
  { value: "50+", label: "Visual Themes" },
  { value: "99.9%", label: "Workspace Uptime" },
]

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28 lg:py-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_12%,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_86%_18%,rgba(14,165,233,0.16),transparent_34%),radial-gradient(circle_at_50%_88%,rgba(249,115,22,0.1),transparent_28%)]" />
      <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-10 h-80 w-80 rounded-full bg-cyan-300/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-4xl text-center"
        >
          <div className="mx-auto mb-7 inline-flex items-center gap-2 rounded-full border border-sky-200/25 bg-slate-900/55 px-4 py-2 text-xs uppercase tracking-[0.18em] text-sky-200/85 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" />
            Cinematic AI Creation Suite
          </div>

          <h1 className="text-balance text-4xl font-semibold leading-tight text-slate-100 sm:text-5xl lg:text-6xl">
            Turn your music into
            <span className="brand-gradient-text"> premium AI visuals</span>
            , instantly.
          </h1>

          <p className="mx-auto mt-5 max-w-3xl text-pretty text-base leading-relaxed text-slate-300/85 sm:text-lg">
            Generate songs, render music videos, and publish content from one premium studio interface built for hackathon speed and startup polish.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/generate">
              <Button size="lg" className="h-11 rounded-xl px-5 text-sm font-semibold">
                Start Creating
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="h-11 rounded-xl px-5 text-sm">
                Open Dashboard
              </Button>
            </Link>
          </div>

          <div className="mt-12 grid gap-3 rounded-2xl border border-sky-200/20 bg-slate-900/45 p-3 backdrop-blur-xl sm:grid-cols-3 sm:p-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: 0.1 + index * 0.08 }}
                className="glass-panel rounded-xl px-4 py-3"
              >
                <div className="text-2xl font-semibold text-slate-100">{stat.value}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
