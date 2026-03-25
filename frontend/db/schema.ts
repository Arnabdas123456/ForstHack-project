import { relations } from "drizzle-orm"
import {
  index,
  mysqlTable,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core"

export const users = mysqlTable(
  "users",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    password: varchar("password", { length: 255 }).notNull(),
    avatarUrl: varchar("avatar_url", { length: 512 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    usersEmailUniqueIdx: uniqueIndex("users_email_unique_idx").on(table.email),
    usersDeletedAtIdx: index("users_deleted_at_idx").on(table.deletedAt),
  }),
)

export const sessions = mysqlTable(
  "sessions",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    userAgent: varchar("user_agent", { length: 512 }),
    ip: varchar("ip", { length: 64 }),
    expireAt: timestamp("expire_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    sessionsUserIdIdx: index("sessions_user_id_idx").on(table.userId),
    sessionsExpireAtIdx: index("sessions_expire_at_idx").on(table.expireAt),
  }),
)

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}))
