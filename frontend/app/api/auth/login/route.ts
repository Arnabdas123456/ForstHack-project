import { NextResponse } from "next/server"
import { AuthError, loginUser } from "@/lib/auth/service"
import { setSessionCookie } from "@/lib/auth/session"
import { loginSchema } from "@/lib/validations/auth"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = loginSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      )
    }

    const xForwardedFor = request.headers.get("x-forwarded-for")
    const ip = xForwardedFor?.split(",")[0]?.trim() || request.headers.get("x-real-ip")
    const userAgent = request.headers.get("user-agent")

    const { sessionId, expireAt } = await loginUser(parsed.data, { ip, userAgent })

    await setSessionCookie(sessionId, expireAt)

    return NextResponse.json({ message: "Login successful", redirectTo: "/" })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json({ error: "Unable to log in" }, { status: 500 })
  }
}
