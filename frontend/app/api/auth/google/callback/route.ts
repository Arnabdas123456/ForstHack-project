import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { loginOrRegisterGoogleUser } from "@/lib/auth/service"
import { setSessionCookie } from "@/lib/auth/session"

export const runtime = "nodejs"

const GOOGLE_STATE_COOKIE = "google_oauth_state"

function loginErrorRedirect(origin: string, message: string) {
  return NextResponse.redirect(`${origin}/login?authError=${encodeURIComponent(message)}`)
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const origin = url.origin
  const envRedirectUri = process.env.GOOGLE_REDIRECT_URI?.trim()

  try {
    const code = url.searchParams.get("code")
    const incomingState = url.searchParams.get("state")

    if (!code || !incomingState) {
      return loginErrorRedirect(origin, "Google sign-in failed")
    }

    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      return loginErrorRedirect(
        origin,
        "Google login is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in frontend/.env and restart server.",
      )
    }

    const cookieStore = await cookies()
    const expectedState = cookieStore.get(GOOGLE_STATE_COOKIE)?.value
    cookieStore.delete(GOOGLE_STATE_COOKIE)

    if (!expectedState || expectedState !== incomingState) {
      return loginErrorRedirect(origin, "Invalid OAuth state")
    }

    const redirectUri = envRedirectUri || `${origin}/api/auth/google/callback`

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
      cache: "no-store",
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error("[auth/google] token exchange failed", errorText)
      return loginErrorRedirect(origin, "Google token exchange failed")
    }

    const tokenData = (await tokenResponse.json()) as {
      id_token?: string
      access_token?: string
    }

    const idToken = tokenData.id_token

    if (!idToken) {
      return loginErrorRedirect(origin, "Google id token missing")
    }

    const verifyResponse = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
      { cache: "no-store" },
    )

    if (!verifyResponse.ok) {
      const errorText = await verifyResponse.text()
      console.error("[auth/google] token verify failed", errorText)
      return loginErrorRedirect(origin, "Google token verification failed")
    }

    const profile = (await verifyResponse.json()) as {
      aud?: string
      email?: string
      email_verified?: string
      name?: string
      picture?: string
    }

    if (profile.aud !== clientId) {
      return loginErrorRedirect(origin, "Invalid Google audience")
    }

    if (!profile.email || profile.email_verified !== "true") {
      return loginErrorRedirect(origin, "Google email is not verified")
    }

    const xForwardedFor = request.headers.get("x-forwarded-for")
    const ip = xForwardedFor?.split(",")[0]?.trim() || request.headers.get("x-real-ip")
    const userAgent = request.headers.get("user-agent")

    const { sessionId, expireAt } = await loginOrRegisterGoogleUser(
      {
        email: profile.email,
        name: profile.name,
        avatarUrl: profile.picture,
      },
      { ip, userAgent },
    )

    await setSessionCookie(sessionId, expireAt)

    return NextResponse.redirect(`${origin}/`)
  } catch (error) {
    console.error("[auth/google] callback error", error)
    return loginErrorRedirect(origin, "Google sign-in failed")
  }
}
