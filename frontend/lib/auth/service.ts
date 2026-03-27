import { randomBytes, randomUUID } from "node:crypto"
import { and, eq, isNull } from "drizzle-orm"
import { db } from "@/config/db"
import { authAccounts, sessions, users } from "@/db/schema"
import { hashPassword, verifyPassword } from "@/lib/auth/password"
import {
  createSessionToken,
  getSessionExpiryDate,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/session"
import type { LoginInput, RegisterInput } from "@/lib/validations/auth"
import type { UpdatePasswordInput, UpdateProfileInput } from "@/lib/validations/settings"

export class AuthError extends Error {
  status: number

  constructor(message: string, status = 400) {
    super(message)
    this.name = "AuthError"
    this.status = status
  }
}

export async function registerUser(
  input: RegisterInput,
  metadata: { userAgent?: string | null; ip?: string | null },
) {
  const email = input.email.trim().toLowerCase()

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.email, email), isNull(users.deletedAt)))
    .limit(1)

  if (existing.length > 0) {
    throw new AuthError("An account with this email already exists", 409)
  }

  const userId = randomUUID()
  const passwordHash = hashPassword(input.password)

  await db.insert(users).values({
    id: userId,
    name: input.name.trim(),
    email,
    password: passwordHash,
  })

  const sessionId = createSessionToken()
  const expireAt = getSessionExpiryDate(false)

  await db.insert(sessions).values({
    id: sessionId,
    userId,
    userAgent: metadata.userAgent?.slice(0, 512),
    ip: metadata.ip?.slice(0, 64),
    expireAt,
  })

  return { sessionId, expireAt }
}

export async function loginUser(
  input: LoginInput,
  metadata: { userAgent?: string | null; ip?: string | null },
) {
  const email = input.email.trim().toLowerCase()

  const existing = await db
    .select({
      id: users.id,
      password: users.password,
      deletedAt: users.deletedAt,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  const user = existing[0]

  if (!user || user.deletedAt) {
    throw new AuthError("Invalid email or password", 401)
  }

  const isValidPassword = verifyPassword(input.password, user.password)

  if (!isValidPassword) {
    throw new AuthError("Invalid email or password", 401)
  }

  const sessionId = createSessionToken()
  const expireAt = getSessionExpiryDate(Boolean(input.remember))

  await db.insert(sessions).values({
    id: sessionId,
    userId: user.id,
    userAgent: metadata.userAgent?.slice(0, 512),
    ip: metadata.ip?.slice(0, 64),
    expireAt,
  })

  return { sessionId, expireAt }
}

export async function loginOrRegisterGoogleUser(
  input: {
    email: string
    providerAccountId: string
    name?: string | null
    avatarUrl?: string | null
  },
  metadata: { userAgent?: string | null; ip?: string | null },
) {
  const email = input.email.trim().toLowerCase()
  const provider = "google"
  const providerAccountId = input.providerAccountId.trim()

  if (!email || !providerAccountId) {
    throw new AuthError("Google account details are missing", 400)
  }

  const linked = await db
    .select({
      id: users.id,
      deletedAt: users.deletedAt,
    })
    .from(authAccounts)
    .innerJoin(users, eq(authAccounts.userId, users.id))
    .where(
      and(
        eq(authAccounts.provider, provider),
        eq(authAccounts.providerAccountId, providerAccountId),
      ),
    )
    .limit(1)

  if (linked[0]?.deletedAt) {
    throw new AuthError("This account is not available", 403)
  }

  let userId = linked[0]?.id

  if (!userId) {
    const existing = await db
      .select({
        id: users.id,
        deletedAt: users.deletedAt,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (existing[0]?.deletedAt) {
      throw new AuthError("This account is not available", 403)
    }

    userId = existing[0]?.id
  }

  if (!userId) {
    userId = randomUUID()
    const generatedPassword = randomBytes(32).toString("hex")

    await db.insert(users).values({
      id: userId,
      name: (input.name?.trim() || email.split("@")[0] || "Google User").slice(0, 120),
      email,
      password: hashPassword(generatedPassword),
      avatarUrl: input.avatarUrl?.slice(0, 512),
    })
  }

  const existingProviderLink = await db
    .select({ id: authAccounts.id })
    .from(authAccounts)
    .where(
      and(
        eq(authAccounts.provider, provider),
        eq(authAccounts.providerAccountId, providerAccountId),
      ),
    )
    .limit(1)

  if (!existingProviderLink[0]) {
    await db.insert(authAccounts).values({
      id: randomUUID(),
      userId,
      provider,
      providerAccountId,
    })
  }

  const sessionId = createSessionToken()
  const expireAt = getSessionExpiryDate(true)

  await db.insert(sessions).values({
    id: sessionId,
    userId,
    userAgent: metadata.userAgent?.slice(0, 512),
    ip: metadata.ip?.slice(0, 64),
    expireAt,
  })

  return { sessionId, expireAt }
}

export async function logoutBySessionId(sessionId: string | undefined) {
  if (!sessionId) {
    return
  }

  await db.delete(sessions).where(eq(sessions.id, sessionId))
}

export function getSessionIdFromCookieHeader(cookieHeader: string | null) {
  if (!cookieHeader) {
    return undefined
  }

  const cookies = cookieHeader.split(";")

  for (const cookie of cookies) {
    const [key, value] = cookie.trim().split("=")

    if (key === SESSION_COOKIE_NAME) {
      return value
    }
  }

  return undefined
}

export async function updateUserProfile(userId: string, input: UpdateProfileInput) {
  const email = input.email.trim().toLowerCase()
  const name = input.name.trim()

  const conflict = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.email, email), isNull(users.deletedAt)))
    .limit(1)

  if (conflict[0] && conflict[0].id !== userId) {
    throw new AuthError("Email is already in use", 409)
  }

  await db
    .update(users)
    .set({
      name,
      email,
    })
    .where(eq(users.id, userId))
}

export async function updateUserPassword(userId: string, input: UpdatePasswordInput) {
  const existing = await db
    .select({
      password: users.password,
      deletedAt: users.deletedAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  const user = existing[0]

  if (!user || user.deletedAt) {
    throw new AuthError("User not found", 404)
  }

  const isValidPassword = verifyPassword(input.currentPassword, user.password)

  if (!isValidPassword) {
    throw new AuthError("Current password is incorrect", 401)
  }

  await db
    .update(users)
    .set({
      password: hashPassword(input.newPassword),
    })
    .where(eq(users.id, userId))
}
