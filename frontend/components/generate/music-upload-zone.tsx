"use client"

import { useRef, useState, type ChangeEvent } from "react"
import { Music, Upload } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

type MusicUploadZoneProps = {
  onFileSelect?: (file: File | null) => void
}

const ALLOWED_MUSIC_MIME_TYPES = new Set(["audio/mpeg", "audio/mp3"])

export function MusicUploadZone({ onFileSelect }: MusicUploadZoneProps) {
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    const extension = file.name.split(".").pop()?.toLowerCase()
    const isMp3ByExtension = extension === "mp3"
    const isMp3ByMime = ALLOWED_MUSIC_MIME_TYPES.has(file.type)

    if (!isMp3ByExtension || (!isMp3ByMime && file.type !== "")) {
      setError("Only MP3 files are allowed.")
      setFileName(null)
      onFileSelect?.(null)
      event.target.value = ""
      return
    }

    setError(null)
    setFileName(file.name)
    onFileSelect?.(file)
  }

  const handleClick = () => {
    inputRef.current?.click()
  }

  return (
    <Card
      className="cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-border/50 bg-card/50 transition-all duration-300 hover:border-purple-500/50 hover:bg-purple-500/5"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          handleClick()
        }
      }}
    >
      <CardContent className="p-8">
        <input
          ref={inputRef}
          type="file"
          accept=".mp3,audio/mpeg,audio/mp3"
          className="hidden"
          onChange={handleFileChange}
        />
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/10 via-indigo-500/10 to-blue-500/10 ring-1 ring-purple-500/20">
            <Upload className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="mt-4 font-semibold">Drop your music file here</h3>
          <p className="mt-2 text-sm text-muted-foreground">or click to browse</p>
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Music className="h-4 w-4" />
            <span>Only MP3 supported</span>
          </div>
          {fileName ? <p className="mt-2 text-xs text-green-600">{fileName}</p> : null}
          {error ? <p className="mt-2 text-xs text-red-500">{error}</p> : null}
        </div>
      </CardContent>
    </Card>
  )
}
