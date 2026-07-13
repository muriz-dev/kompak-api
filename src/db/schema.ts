import { sql, relations } from "drizzle-orm";
import { integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { uuidv7 } from "uuidv7";

// Tables
export const users = sqliteTable("users", {
    id: text("id").primaryKey().$defaultFn(() => uuidv7()),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    password: text("password").notNull(),
    faceEmbeddingId: text("face_embedding_id"),
    balance: integer("balance").default(0),
    leaderboardPoints: integer("leaderboard_points").default(0),
    role: text("role").notNull().default("USER"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`).$onUpdate(() => new Date()),
});

export const events = sqliteTable("events", {
    id: text("id").primaryKey().$defaultFn(() => uuidv7()),
    title: text("title").notNull(),
    description: text("description"),
    eventDate: integer("event_date", { mode: "timestamp_ms" }).notNull(),
    attendanceStartTime: integer("attendance_start_time", { mode: "timestamp_ms" }),
    attendanceEndTime: integer("attendance_end_time", { mode: "timestamp_ms" }),
    rewardPoints: integer("reward_points").notNull(),
    latitude: real("latitude"),
    longitude: real("longitude"),
    radiusMeters: integer("radius_meters").default(50),
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
    pointsRequired: integer("points_required").default(0).notNull(),
    stock: integer("stock").default(0),
    category: text("category"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`).$onUpdate(() => new Date()),
});

export const eventItemRewards = sqliteTable("event_item_rewards", {
    id: text("id").primaryKey().$defaultFn(() => uuidv7()),
    eventId: text("event_id").references(() => events.id, { onDelete: "cascade" }).notNull(),
    rewardId: text("reward_id").references(() => rewards.id, { onDelete: "cascade" }).notNull(),
    quantity: integer("quantity").default(1),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
});

export const redemptions = sqliteTable("redemptions", {
    id: text("id").primaryKey().$defaultFn(() => uuidv7()),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    rewardId: text("reward_id").references(() => rewards.id, { onDelete: "cascade" }).notNull(),
    status: text("status").notNull(),
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
    redemptions: many(redemptions),
}));

export const eventsRelations = relations(events, ({ many }) => ({
    attendances: many(attendances),
    eventItemRewards: many(eventItemRewards),
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

export const rewardsRelations = relations(rewards, ({ many }) => ({
    eventItemRewards: many(eventItemRewards),
    redemptions: many(redemptions),
}));

export const eventItemRewardsRelations = relations(eventItemRewards, ({ one }) => ({
    event: one(events, {
        fields: [eventItemRewards.eventId],
        references: [events.id],
    }),
    reward: one(rewards, {
        fields: [eventItemRewards.rewardId],
        references: [rewards.id],
    }),
}));

export const redemptionsRelations = relations(redemptions, ({ one }) => ({
    user: one(users, {
        fields: [redemptions.userId],
        references: [users.id],
    }),
    reward: one(rewards, {
        fields: [redemptions.rewardId],
        references: [rewards.id],
    }),
}));

export const pointTransactionsRelations = relations(pointTransactions, ({ one }) => ({
    user: one(users, {
        fields: [pointTransactions.userId],
        references: [users.id],
    }),
}));
