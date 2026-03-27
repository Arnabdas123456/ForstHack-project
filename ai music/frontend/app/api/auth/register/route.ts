import { NextResponse } from "next/server"
import { registerUser, AuthError } from "@/lib/auth/service"
import { setSessionCookie } from "@/lib/auth/session"
import { registerSchema } from "@/lib/validations/auth"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = registerSchema.safeParse(body)

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

    const { sessionId, expireAt } = await registerUser(parsed.data, { ip, userAgent })

    await setSessionCookie(sessionId, expireAt)

    return NextResponse.json(
      { message: "Registration successful", redirectTo: "/" },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    const debugInfo =
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : { raw: error }

    console.error("[auth/register] Unexpected error", debugInfo)

    return NextResponse.json(
      {
        error: "Unable to register user",
        details: process.env.NODE_ENV === "development" && error instanceof Error ? error.message : undefined,
      },
      { status: 500 },
    )
  }
}
