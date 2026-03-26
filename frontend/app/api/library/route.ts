import { randomUUID } from "node:crypto"
import { desc, eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { db } from "@/config/db"
import { libraryItems } from "@/db/schema"
import { getCurrentSession } from "@/lib/auth/session"
import { createLibraryItemSchema } from "@/lib/validations/library"

export const runtime = "nodejs"

export async function GET() {
  try {
    const session = await getCurrentSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const items = await db
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

    return NextResponse.json({ items })
  } catch {
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

    await db.insert(libraryItems).values({
      id: libraryItemId,
      userId: session.userId,
      title: parsed.data.title,
      theme: parsed.data.theme || null,
      mood: parsed.data.mood || null,
      songName: parsed.data.songName || null,
      thumbnailUrl: parsed.data.thumbnailUrl || null,
      videoUrl: parsed.data.videoUrl,
      rating: parsed.data.rating ?? 0,
    })

    const createdAt = new Date()

    return NextResponse.json(
      {
        item: {
          id: libraryItemId,
          userId: session.userId,
          title: parsed.data.title,
          theme: parsed.data.theme || null,
          mood: parsed.data.mood || null,
          songName: parsed.data.songName || null,
          thumbnailUrl: parsed.data.thumbnailUrl || null,
          videoUrl: parsed.data.videoUrl,
          rating: parsed.data.rating ?? 0,
          createdAt,
        },
      },
      { status: 201 },
    )
  } catch {
    return NextResponse.json({ error: "Unable to publish to library" }, { status: 500 })
  }
}
