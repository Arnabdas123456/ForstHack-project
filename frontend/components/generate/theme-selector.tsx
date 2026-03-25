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
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {themes.map((theme) => {
        const isSelected = selectedTheme === theme.id
        return (
          <button
            key={theme.id}
            onClick={() => onSelectTheme(theme.id)}
            className={cn(
              "relative group p-4 rounded-2xl border-2 text-left transition-all duration-300 hover:scale-105",
              isSelected
                ? "border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/20"
                : "border-border/50 bg-card hover:border-purple-500/50 hover:bg-purple-500/5"
            )}
          >
            {/* Glow effect for selected */}
            {isSelected && (
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/20 via-indigo-500/20 to-blue-500/20 blur-sm" />
            )}

            <div className="relative">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg mb-3 transition-colors",
                  isSelected
                    ? "bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500"
                    : "bg-muted"
                )}
              >
                <theme.icon
                  className={cn(
                    "h-5 w-5",
                    isSelected ? "text-white" : "text-muted-foreground"
                  )}
                />
              </div>
              <h3 className="font-semibold text-sm">{theme.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{theme.mood}</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
