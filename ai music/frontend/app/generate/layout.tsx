import type { ReactNode } from "react"
import { requireAuth } from "@/lib/auth/require-auth"

export default async function GenerateLayout({ children }: { children: ReactNode }) {
  await requireAuth()
  return <>{children}</>
}
