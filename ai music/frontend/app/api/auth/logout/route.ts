import { NextResponse } from "next/server"
import {
  getSessionIdFromCookieHeader,
  logoutBySessionId,
} from "@/lib/auth/service"
import { clearSessionCookie } from "@/lib/auth/session"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const sessionId = getSessionIdFromCookieHeader(request.headers.get("cookie"))

    await logoutBySessionId(sessionId)
    await clearSessionCookie()

    return NextResponse.json({ message: "Logged out" })
  } catch {
    return NextResponse.json({ error: "Unable to log out" }, { status: 500 })
  }
}
