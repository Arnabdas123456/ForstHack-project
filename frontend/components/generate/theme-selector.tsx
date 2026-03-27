"use client"

import { cn } from "@/lib/utils"
import { Leaf, CloudRain, Moon, Cpu, Home, Mountain } from "lucide-react"

interface ThemeSelectorProps {
  selectedTheme: string | null
  onSelectTheme: (theme: string) => void
}

const themes = [
  { id: "anime-nature", name: "Anime Nature", mood: "Calm", icon: Leaf },
  { id: "rainy-city", name: "Rainy City", mood: "Chill", icon: CloudRain },
  { id: "night-sky", name: "Night Sky", mood: "Dreamy", icon: Moon },
  { id: "cyberpunk-skyline", name: "Cyberpunk Skyline", mood: "Energetic", icon: Cpu },
  { id: "lofi-bedroom", name: "LoFi Bedroom", mood: "Focus", icon: Home },
  { id: "mountain-sunset", name: "Mountain Sunset", mood: "Peaceful", icon: Mountain },
]

export function ThemeSelector({ selectedTheme, onSelectTheme }: ThemeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
      {themes.map((theme) => {
        const isSelected = selectedTheme === theme.id
        return (
          <button
            key={theme.id}
            onClick={() => onSelectTheme(theme.id)}
            className={cn(
              "elevate-hover group relative rounded-2xl border p-4 text-left transition-all",
              isSelected
                ? "border-sky-300/45 bg-sky-300/10 shadow-[0_18px_35px_rgba(14,165,233,0.2)]"
                : "border-sky-200/20 bg-slate-900/50 hover:border-sky-300/35",
            )}
          >
            {isSelected ? (
              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_14%_0%,rgba(103,232,249,0.16),transparent_46%)]" />
            ) : null}

            <div className="relative">
              <div
                className={cn(
                  "mb-3 flex h-10 w-10 items-center justify-center rounded-lg border",
                  isSelected ? "border-sky-200/35 bg-sky-300/15" : "border-white/10 bg-slate-800/65",
                )}
              >
                <theme.icon className={cn("h-5 w-5", isSelected ? "text-sky-100" : "text-slate-400")} />
              </div>
              <h3 className="text-sm font-semibold text-slate-100">{theme.name}</h3>
              <p className="mt-1 text-xs uppercase tracking-[0.1em] text-slate-400">{theme.mood}</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
