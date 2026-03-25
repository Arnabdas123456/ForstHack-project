import { NextResponse } from "next/server"
import { getCurrentSession } from "@/lib/auth/session"

export const runtime = "nodejs"

export async function GET() {
  try {
    const session = await getCurrentSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json({
      user: {
        id: session.userId,
        name: session.name,
        email: session.email,
        avatarUrl: session.avatarUrl,
      },
    })
  } catch {
    return NextResponse.json({ error: "Unable to fetch profile" }, { status: 500 })
  }
}
