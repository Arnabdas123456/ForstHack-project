import { randomUUID } from "node:crypto"
import { and, desc, eq } from "drizzle-orm"
import { sql } from "drizzle-orm"
import { NextResponse } from "next/server"
import { db } from "@/config/db"
import { libraryItems } from "@/db/schema"
import { getCurrentSession } from "@/lib/auth/session"
import { createLibraryItemSchema } from "@/lib/validations/library"

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
      rating: number
      isInLibrary: number
      createdAt: Date
      userId: string
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
          rating: libraryItems.rating,
          isInLibrary: libraryItems.isInLibrary,
          createdAt: libraryItems.createdAt,
          userId: libraryItems.userId,
        })
        .from(libraryItems)
        .where(and(eq(libraryItems.userId, session.userId), eq(libraryItems.isInLibrary, 1)))
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
          userId: libraryItems.userId,
        })
        .from(libraryItems)
        .where(eq(libraryItems.userId, session.userId))
        .orderBy(desc(libraryItems.createdAt))

      items = legacyItems.map((item) => ({
        ...item,
        description: null,
        tags: null,
        isInLibrary: 1,
      }))
    }

    return NextResponse.json({ items })
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("GET /api/library failed:", error)
    }
    return NextResponse.json({ error: "Unable to fetch library" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = createLibraryItemSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      )
    }

    const libraryItemId = randomUUID()

    try {
      await db.insert(libraryItems).values({
        id: libraryItemId,
        userId: session.userId,
        title: parsed.data.title,
        description: parsed.data.description || null,
        tags: parsed.data.tags || null,
        theme: parsed.data.theme || null,
        mood: parsed.data.mood || null,
        songName: parsed.data.songName || null,
        thumbnailUrl: parsed.data.thumbnailUrl || null,
        videoUrl: parsed.data.videoUrl,
        rating: parsed.data.rating ?? 0,
        isInLibrary: parsed.data.isInLibrary === false ? 0 : 1,
      })
    } catch (error) {
      if (!isMissingColumnError(error)) {
        throw error
      }

      await db.execute(sql`
        INSERT INTO library_items (
          id,
          user_id,
          title,
          theme,
          mood,
          song_name,
          thumbnail_url,
          video_url,
          rating
        ) VALUES (
          ${libraryItemId},
          ${session.userId},
          ${parsed.data.title},
          ${parsed.data.theme || null},
          ${parsed.data.mood || null},
          ${parsed.data.songName || null},
          ${parsed.data.thumbnailUrl || null},
          ${parsed.data.videoUrl},
          ${parsed.data.rating ?? 0}
        )
      `)
    }

    const createdAt = new Date()

    return NextResponse.json(
      {
        item: {
          id: libraryItemId,
          userId: session.userId,
          title: parsed.data.title,
          description: parsed.data.description || null,
          tags: parsed.data.tags || null,
          theme: parsed.data.theme || null,
          mood: parsed.data.mood || null,
          songName: parsed.data.songName || null,
          thumbnailUrl: parsed.data.thumbnailUrl || null,
          videoUrl: parsed.data.videoUrl,
          rating: parsed.data.rating ?? 0,
          isInLibrary: parsed.data.isInLibrary === false ? 0 : 1,
          createdAt,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("POST /api/library failed:", error)
    }
    return NextResponse.json({ error: "Unable to publish to library" }, { status: 500 })
  }
}
