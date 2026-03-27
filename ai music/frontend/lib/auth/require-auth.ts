import { redirect } from "next/navigation"
import { getCurrentSession } from "@/lib/auth/session"

export async function requireAuth() {
  const session = await getCurrentSession()

  if (!session) {
    redirect("/login")
  }

  return session
}
