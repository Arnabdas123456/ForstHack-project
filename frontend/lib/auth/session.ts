import { randomBytes } from "node:crypto"
import { and, eq, gt, isNull } from "drizzle-orm"
import { cookies } from "next/headers"
import { db } from "@/config/db"
import { sessions, users } from "@/db/schema"

export const SESSION_COOKIE_NAME = "lofigen_session"
const DEFAULT_SESSION_DAYS = 7
const REMEMBER_SESSION_DAYS = 30

export function createSessionToken() {
  return randomBytes(32).toString("hex")
}

export function getSessionExpiryDate(remember = false) {
  const days = remember ? REMEMBER_SESSION_DAYS : DEFAULT_SESSION_DAYS
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + days)
  return expiresAt
}

export async function setSessionCookie(sessionId: string, expiresAt: Date) {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  })
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

export async function getCurrentSession() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!sessionId) {
    return null
  }

  const result = await db
    .select({
      sessionId: sessions.id,
      userId: users.id,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
      expireAt: sessions.expireAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(
      and(
        eq(sessions.id, sessionId),
        gt(sessions.expireAt, new Date()),
        isNull(users.deletedAt),
      ),
    )
    .limit(1)

  return result[0] ?? null
}
