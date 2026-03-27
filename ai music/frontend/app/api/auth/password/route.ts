import { NextResponse } from "next/server"
import { AuthError, updateUserPassword } from "@/lib/auth/service"
import { getCurrentSession } from "@/lib/auth/session"
import { updatePasswordSchema } from "@/lib/validations/settings"

export const runtime = "nodejs"

export async function PATCH(request: Request) {
  try {
    const session = await getCurrentSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = updatePasswordSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      )
    }

    await updateUserPassword(session.userId, parsed.data)

    return NextResponse.json({ message: "Password updated successfully" })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json({ error: "Unable to update password" }, { status: 500 })
  }
}
