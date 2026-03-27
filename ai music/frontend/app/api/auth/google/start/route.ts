import { randomBytes } from "node:crypto"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

const GOOGLE_STATE_COOKIE = "google_oauth_state"

function loginErrorRedirect(origin: string, message: string) {
  return NextResponse.redirect(`${origin}/login?authError=${encodeURIComponent(message)}`)
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const origin = url.origin
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  if (!clientId) {
    return loginErrorRedirect(
      origin,
      "Google login is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in frontend/.env and restart server.",
    )
  }

  const state = randomBytes(24).toString("hex")
  const redirectUri = `${origin}/api/auth/google/callback`

  const cookieStore = await cookies()
  cookieStore.set(GOOGLE_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  })

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  })

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`)
}
