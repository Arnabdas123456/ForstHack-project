"use client"

import { useRef, useState, type ChangeEvent } from "react"
import { Upload, Image } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

type UploadZoneProps = {
  onFileSelect?: (file: File | null) => void
}

const ALLOWED_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/jpg", "image/png"])
const ALLOWED_IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png"])

export function UploadZone({ onFileSelect }: UploadZoneProps) {
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    const extension = file.name.split(".").pop()?.toLowerCase()
    const isAllowedExtension = extension ? ALLOWED_IMAGE_EXTENSIONS.has(extension) : false
    const isAllowedMime = ALLOWED_IMAGE_MIME_TYPES.has(file.type)

    if (!isAllowedExtension || (!isAllowedMime && file.type !== "")) {
      setError("Only JPG, JPEG, and PNG files are allowed.")
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
      className="elevate-hover cursor-pointer overflow-hidden rounded-2xl border border-dashed border-sky-200/30 bg-slate-900/50 py-0"
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
      <CardContent className="p-7">
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,image/jpeg,image/png"
          className="hidden"
          onChange={handleFileChange}
        />
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-sky-200/25 bg-slate-900/70">
            <Upload className="h-7 w-7 text-sky-100" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-100">Drop your image here</h3>
          <p className="mt-1 text-sm text-slate-400">or click to browse</p>
          <div className="mt-4 flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-slate-500">
            <Image className="h-4 w-4" />
            <span>JPG · JPEG · PNG</span>
          </div>
          {fileName ? <p className="mt-2 text-xs text-emerald-300">{fileName}</p> : null}
          {error ? <p className="mt-2 text-xs text-red-300">{error}</p> : null}
        </div>
      </CardContent>
    </Card>
  )
}
