import { sql, relations } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { uuidv7 } from "uuidv7";

// Tables
export const users = sqliteTable("users", {
    id: text("id").primaryKey().$defaultFn(() => uuidv7()),
    name: text("name").notNull(),
    faceEmbeddingId: text("face_embedding_id"),
    balance: integer("balance").default(0),
    leaderboardPoints: integer("leaderboard_points").default(0),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`).$onUpdate(() => new Date()),
});

export const events = sqliteTable("events", {
    id: text("id").primaryKey().$defaultFn(() => uuidv7()),
    title: text("title").notNull(),
    description: text("description"),
    eventDate: integer("event_date", { mode: "timestamp_ms" }).notNull(),
    rewardPoints: integer("reward_points").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`).$onUpdate(() => new Date()),
});

export const attendances = sqliteTable("attendances", {
    id: text("id").primaryKey().$defaultFn(() => uuidv7()),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    eventId: text("event_id").references(() => events.id, { onDelete: "cascade" }).notNull(),
    verifiedAt: integer("verified_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`).$onUpdate(() => new Date()),
}, (t) => ({
    unq: uniqueIndex("unq_user_event").on(t.userId, t.eventId),
}));

export const rewards = sqliteTable("rewards", {
    id: text("id").primaryKey().$defaultFn(() => uuidv7()),
    name: text("name").notNull(),
    pointsRequired: integer("points_required").notNull(),
    stock: integer("stock").default(0),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`).$onUpdate(() => new Date()),
});

export const pointTransactions = sqliteTable("point_transactions", {
    id: text("id").primaryKey().$defaultFn(() => uuidv7()),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    amount: integer("amount").notNull(),
    transactionType: text("transaction_type").notNull(),
    referenceId: text("reference_id"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`).$onUpdate(() => new Date()),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
    attendances: many(attendances),
    pointTransactions: many(pointTransactions),
}));

export const eventsRelations = relations(events, ({ many }) => ({
    attendances: many(attendances),
}));

export const attendancesRelations = relations(attendances, ({ one }) => ({
    user: one(users, {
        fields: [attendances.userId],
        references: [users.id],
    }),
    event: one(events, {
        fields: [attendances.eventId],
        references: [events.id],
    }),
}));

export const pointTransactionsRelations = relations(pointTransactions, ({ one }) => ({
    user: one(users, {
        fields: [pointTransactions.userId],
        references: [users.id],
    }),
}));
