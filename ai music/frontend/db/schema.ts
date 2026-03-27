import { relations } from "drizzle-orm"
import {
  index,
  mysqlTable,
  timestamp,
  uniqueIndex,
  varchar,
  int,
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

export const authAccounts = mysqlTable(
  "auth_accounts",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: varchar("provider", { length: 32 }).notNull(),
    providerAccountId: varchar("provider_account_id", { length: 191 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    authAccountsUserIdIdx: index("auth_accounts_user_id_idx").on(table.userId),
    authAccountsProviderAccountUniqueIdx: uniqueIndex("auth_accounts_provider_account_unique_idx").on(
      table.provider,
      table.providerAccountId,
    ),
  }),
)

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}))

export const authAccountsRelations = relations(authAccounts, ({ one }) => ({
  user: one(users, {
    fields: [authAccounts.userId],
    references: [users.id],
  }),
}))

export const libraryItems = mysqlTable(
  "library_items",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    description: varchar("description", { length: 1024 }),
    tags: varchar("tags", { length: 512 }),
    theme: varchar("theme", { length: 120 }),
    mood: varchar("mood", { length: 80 }),
    songName: varchar("song_name", { length: 255 }),
    thumbnailUrl: varchar("thumbnail_url", { length: 1024 }),
    videoUrl: varchar("video_url", { length: 1024 }).notNull(),
    mediaType: varchar("media_type", { length: 20 }).default("video").notNull(),
    rating: int("rating").default(0).notNull(),
    isInLibrary: int("is_in_library").default(1).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    libraryItemsUserIdIdx: index("library_items_user_id_idx").on(table.userId),
    libraryItemsCreatedAtIdx: index("library_items_created_at_idx").on(table.createdAt),
  }),
)

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  authAccounts: many(authAccounts),
  libraryItems: many(libraryItems),
}))

export const libraryItemsRelations = relations(libraryItems, ({ one }) => ({
  user: one(users, {
    fields: [libraryItems.userId],
    references: [users.id],
  }),
}))
