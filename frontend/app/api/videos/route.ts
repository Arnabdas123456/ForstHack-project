import { desc, eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { db } from "@/config/db"
import { libraryItems } from "@/db/schema"
import { getCurrentSession } from "@/lib/auth/session"
import { normalizeMediaType } from "@/lib/media"

export const runtime = "nodejs"

function isMissingColumnError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false
  }

  const maybeError = error as {
    message?: string
    code?: string
    sqlMessage?: string
    cause?: unknown
  }

  const message = (maybeError.message || "").toLowerCase()
  const sqlMessage = (maybeError.sqlMessage || "").toLowerCase()
  const code = (maybeError.code || "").toUpperCase()

  if (code === "ER_BAD_FIELD_ERROR") {
    return true
  }

  if (message.includes("unknown column") || sqlMessage.includes("unknown column")) {
    return true
  }

  if (maybeError.cause && maybeError.cause !== error) {
    return isMissingColumnError(maybeError.cause)
  }

  return false
}

export async function GET() {
  try {
    const session = await getCurrentSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let items: Array<{
      id: string
      title: string
      description: string | null
      tags: string | null
      theme: string | null
      mood: string | null
      songName: string | null
      thumbnailUrl: string | null
      videoUrl: string
      mediaType: string | null
      rating: number
      isInLibrary: number
      createdAt: Date
    }>

    try {
      items = await db
        .select({
          id: libraryItems.id,
          title: libraryItems.title,
          description: libraryItems.description,
          tags: libraryItems.tags,
          theme: libraryItems.theme,
          mood: libraryItems.mood,
          songName: libraryItems.songName,
          thumbnailUrl: libraryItems.thumbnailUrl,
          videoUrl: libraryItems.videoUrl,
          mediaType: libraryItems.mediaType,
          rating: libraryItems.rating,
          isInLibrary: libraryItems.isInLibrary,
          createdAt: libraryItems.createdAt,
        })
        .from(libraryItems)
        .where(eq(libraryItems.userId, session.userId))
        .orderBy(desc(libraryItems.createdAt))
    } catch (error) {
      if (!isMissingColumnError(error)) {
        throw error
      }

      const legacyItems = await db
        .select({
          id: libraryItems.id,
          title: libraryItems.title,
          theme: libraryItems.theme,
          mood: libraryItems.mood,
          songName: libraryItems.songName,
          thumbnailUrl: libraryItems.thumbnailUrl,
          videoUrl: libraryItems.videoUrl,
          rating: libraryItems.rating,
          createdAt: libraryItems.createdAt,
        })
        .from(libraryItems)
        .where(eq(libraryItems.userId, session.userId))
        .orderBy(desc(libraryItems.createdAt))

      items = legacyItems.map((item) => ({
        ...item,
        description: null,
        tags: null,
        mediaType: null,
        isInLibrary: 1,
      }))
    }

    return NextResponse.json({
      items: items.map((item) => {
        const mediaType = normalizeMediaType(item.mediaType, item.videoUrl)
        return {
          ...item,
          mediaType,
          mediaUrl: item.videoUrl,
        }
      }),
    })
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("GET /api/videos failed:", error)
    }
    return NextResponse.json({ error: "Unable to fetch videos" }, { status: 500 })
  }
}
