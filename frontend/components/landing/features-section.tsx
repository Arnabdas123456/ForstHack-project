"use client"

import { motion } from "framer-motion"
import { Sparkles, Video, Music2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const features = [
  {
    icon: Sparkles,
    title: "AI Theme Matching",
    description:
      "The engine analyzes your song mood and style, then recommends polished visual scenes aligned to rhythm and vibe.",
  },
  {
    icon: Video,
    title: "Auto Video Generation",
    description:
      "Upload assets and render cinematic loops with smooth motion and presentation-ready outputs in one production flow.",
  },
  {
    icon: Music2,
    title: "AI Song Studio",
    description:
      "Generate prompt-based tracks, preview with visuals, edit metadata, and publish instantly into your media library.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55 }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-sky-200/80">Capabilities</p>
          <h2 className="mt-2 text-balance text-3xl font-semibold text-slate-100 sm:text-4xl">
            Everything you need to ship
            <span className="brand-gradient-text"> standout AI media</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-300/85 sm:text-lg">
            A unified workflow for songs, visuals, and publishing, designed for speed without sacrificing presentation quality.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
            >
              <Card className="elevate-hover spotlight group h-full rounded-2xl border-sky-200/20 py-0">
                <CardHeader className="border-b border-white/10 pb-4 pt-5">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-sky-200/20 bg-slate-900/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]">
                    <feature.icon className="h-5 w-5 text-sky-200" />
                  </div>
                  <CardTitle className="text-lg text-slate-100">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-5 pt-4">
                  <CardDescription className="text-sm leading-relaxed text-slate-400">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
