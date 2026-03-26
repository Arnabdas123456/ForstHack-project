import { and, eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { db } from "@/config/db"
import { libraryItems } from "@/db/schema"
import { getCurrentSession } from "@/lib/auth/session"

export const runtime = "nodejs"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  try {
    const session = await getCurrentSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { itemId } = await params

    const existing = await db
      .select({ id: libraryItems.id })
      .from(libraryItems)
      .where(
        and(
          eq(libraryItems.id, itemId),
          eq(libraryItems.userId, session.userId),
        ),
      )
      .limit(1)

    if (!existing[0]) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    await db
      .delete(libraryItems)
      .where(
        and(
          eq(libraryItems.id, itemId),
          eq(libraryItems.userId, session.userId),
        ),
      )

    return NextResponse.json({ message: "Deleted" })
  } catch {
    return NextResponse.json({ error: "Unable to delete library item" }, { status: 500 })
  }
}
