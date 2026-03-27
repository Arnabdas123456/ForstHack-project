export type MediaType = "video" | "audio"

const AUDIO_EXTENSION_PATTERN = /\.(mp3|wav|wave|m4a|aac|ogg|oga|flac|opus)(?:$|[?#])/i
const VIDEO_EXTENSION_PATTERN = /\.(mp4|mov|m4v|avi|mkv|webm|wmv|flv|mpeg|mpg)(?:$|[?#])/i

function getPathnameLike(value: string): string {
  try {
    return new URL(value).pathname
  } catch {
    return value
  }
}

export function isAudioUrl(url: string | null | undefined): boolean {
  if (!url) return false
  return AUDIO_EXTENSION_PATTERN.test(getPathnameLike(url))
}

export function inferMediaTypeFromUrl(url: string | null | undefined): MediaType {
  if (!url) return "video"
  const pathname = getPathnameLike(url)

  if (AUDIO_EXTENSION_PATTERN.test(pathname)) return "audio"
  if (VIDEO_EXTENSION_PATTERN.test(pathname)) return "video"
  return "video"
}

export function normalizeMediaType(value: string | null | undefined, mediaUrl: string | null | undefined): MediaType {
  if (value === "audio" || value === "video") {
    return value
  }
  return inferMediaTypeFromUrl(mediaUrl)
}

export function inferExtensionFromMimeType(mimeType: string | null | undefined): string | null {
  if (!mimeType) return null

  const normalized = mimeType.toLowerCase()
  if (normalized.includes("mpeg")) return "mp3"
  if (normalized.includes("wav")) return "wav"
  if (normalized.includes("x-wav")) return "wav"
  if (normalized.includes("flac")) return "flac"
  if (normalized.includes("ogg")) return "ogg"
  if (normalized.includes("aac")) return "aac"
  if (normalized.includes("mp4")) return "m4a"
  if (normalized.includes("opus")) return "opus"
  return null
}
