import { NextResponse } from "next/server"
import { AuthError, updateUserProfile } from "@/lib/auth/service"
import { getCurrentSession } from "@/lib/auth/session"
import { updateProfileSchema } from "@/lib/validations/settings"

export const runtime = "nodejs"

export async function PATCH(request: Request) {
  try {
    const session = await getCurrentSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = updateProfileSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      )
    }

    await updateUserProfile(session.userId, parsed.data)

    return NextResponse.json({ message: "Profile updated successfully" })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json({ error: "Unable to update profile" }, { status: 500 })
  }
}
