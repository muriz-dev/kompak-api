import { relations, sql } from "drizzle-orm";
import {
    integer,
    real,
    sqliteTable,
    text,
    uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { uuidv7 } from "uuidv7";

// ENUMS

export const USER_ROLE = ["ADMIN", "CITIZEN"] as const;
export type UserRole = (typeof USER_ROLE)[number];

export const USER_STATUS = [
    "PENDING",
    "ACTIVE",
    "REJECTED",
    "INACTIVE",
] as const;
export type UserStatus = (typeof USER_STATUS)[number];

export const EVENT_STATUS = [
    "DRAFT",
    "PUBLISHED",
    "CLOSED",
    "CANCELLED",
] as const;
export type EventStatus = (typeof EVENT_STATUS)[number];

export const ATTENDANCE_STATUS = [
    "PRESENT",
    "REJECTED",
] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUS)[number];

export const PROVIDER_STATUS = [
    "PENDING",
    "VERIFIED",
    "REJECTED",
    "INACTIVE",
] as const;
export type ProviderStatus = (typeof PROVIDER_STATUS)[number];

export const REWARD_STATUS = [
    "ACTIVE",
    "INACTIVE",
] as const;
export type RewardStatus = (typeof REWARD_STATUS)[number];

export const REWARD_TYPE = [
    "VOUCHER",
    "PRODUCT",
    "SERVICE",
    "OTHER",
] as const;
export type RewardType = (typeof REWARD_TYPE)[number];

export const REWARD_SOURCE = [
    "POINT_SHOP",
    "LEADERBOARD",
] as const;
export type RewardSource = (typeof REWARD_SOURCE)[number];

export const REDEMPTION_STATUS = [
    "PENDING",
    "REJECTED",
    "COMPLETED",
    "CANCELLED",
] as const;
export type RedemptionStatus = (typeof REDEMPTION_STATUS)[number];

export const BADGE_CATEGORY = [
    "LEADERBOARD",
    "MILESTONE",
    "SPECIAL",
] as const;
export type BadgeCategory = (typeof BADGE_CATEGORY)[number];

export const NOTIFICATION_TYPE = [
    "ACCOUNT_APPROVED",
    "ACCOUNT_REJECTED",

    "PROVIDER_APPROVED",
    "PROVIDER_REJECTED",

    "EVENT_PUBLISHED",
    "EVENT_REMINDER",

    "REWARD_COMPLETED",

    "ANNOUNCEMENT",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPE)[number];

// TABLES

export const users = sqliteTable("users", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => uuidv7()),

    name: text("name").notNull(),

    phoneNumber: text("phone_number").notNull(),

    birthDate: text("birth_date").notNull(),

    email: text("email")
        .notNull()
        .unique(),

    password: text("password").notNull(),

    faceEmbeddingId: text("face_embedding_id").notNull(),

    balance: integer("balance")
        .notNull()
        .default(0),

    leaderboardPoints: integer("leaderboard_points")
        .notNull()
        .default(0),

    status: text("status", {
        enum: USER_STATUS,
    })
        .notNull()
        .default("PENDING"),

    role: text("role", {
        enum: USER_ROLE,
    }).notNull(),

    createdAt: integer("created_at", {
        mode: "timestamp_ms",
    }).default(sql`(unixepoch() * 1000)`),

    updatedAt: integer("updated_at", {
        mode: "timestamp_ms",
    })
        .default(sql`(unixepoch() * 1000)`)
        .$onUpdate(() => new Date()),
});

export const providers = sqliteTable("providers", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => uuidv7()),

    ownerId: text("owner_id").references(
        () => users.id,
        {
            onDelete: "set null",
        }
    ),

    name: text("name").notNull(),

    address: text("address").notNull(),

    latitude: real("latitude").notNull(),

    longitude: real("longitude").notNull(),

    status: text("status", {
        enum: PROVIDER_STATUS,
    })
        .notNull()
        .default("PENDING"),

    logoUrl: text("logo_url"),

    storePhotoUrl: text("store_photo_url"),

    createdAt: integer("created_at", {
        mode: "timestamp_ms",
    }).default(sql`(unixepoch() * 1000)`),

    updatedAt: integer("updated_at", {
        mode: "timestamp_ms",
    })
        .default(sql`(unixepoch() * 1000)`)
        .$onUpdate(() => new Date()),
});

export const rewards = sqliteTable("rewards", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => uuidv7()),

    providerId: text("provider_id")
        .references(() => providers.id, {
            onDelete: "cascade",
        })
        .notNull(),

    name: text("name").notNull(),

    description: text("description")
        .notNull()
        .default(""),

    pointsRequired: integer("points_required")
        .notNull()
        .default(0),

    stock: integer("stock")
        .notNull()
        .default(0),

    isFeatured: integer("is_featured", {
        mode: "boolean",
    })
        .notNull()
        .default(false),

    validityDays: integer("validity_days")
        .notNull()
        .default(7),

    type: text("type", {
        enum: REWARD_TYPE,
    }).notNull(),

    source: text("source", {
        enum: REWARD_SOURCE,
    }).notNull(),

    leaderboardPosition: integer("leaderboard_position"),

    status: text("status", {
        enum: REWARD_STATUS,
    })
        .notNull()
        .default("ACTIVE"),

    imageUrl: text("image_url"),

    createdAt: integer("created_at", {
        mode: "timestamp_ms",
    }).default(sql`(unixepoch() * 1000)`),

    updatedAt: integer("updated_at", {
        mode: "timestamp_ms",
    })
        .default(sql`(unixepoch() * 1000)`)
        .$onUpdate(() => new Date()),
});

export const events = sqliteTable("events", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => uuidv7()),

    createdBy: text("created_by")
        .references(() => users.id)
        .notNull(),

    title: text("title").notNull(),

    description: text("description").notNull(),

    eventDate: integer("event_date", {
        mode: "timestamp_ms",
    }).notNull(),

    rewardPoints: integer("reward_points").notNull(),

    attendanceStartTime: integer("attendance_start_time", {
        mode: "timestamp_ms",
    }).notNull(),

    attendanceEndTime: integer("attendance_end_time", {
        mode: "timestamp_ms",
    }).notNull(),

    latitude: real("latitude").notNull(),

    longitude: real("longitude").notNull(),

    radiusMeters: integer("radius_meters")
        .notNull()
        .default(50),

    status: text("status", {
        enum: EVENT_STATUS,
    })
        .notNull()
        .default("DRAFT"),

    bannerUrl: text("banner_url"),

    createdAt: integer("created_at", {
        mode: "timestamp_ms",
    }).default(sql`(unixepoch() * 1000)`),

    updatedAt: integer("updated_at", {
        mode: "timestamp_ms",
    })
        .default(sql`(unixepoch() * 1000)`)
        .$onUpdate(() => new Date()),
});

export const attendances = sqliteTable(
    "attendances",
    {
        id: text("id")
            .primaryKey()
            .$defaultFn(() => uuidv7()),

        userId: text("user_id")
            .references(() => users.id, {
                onDelete: "cascade",
            })
            .notNull(),

        eventId: text("event_id")
            .references(() => events.id, {
                onDelete: "cascade",
            })
            .notNull(),

        activityDescription: text("activity_description"),

        activityPhotoUrl: text("activity_photo_url"),

        status: text("status", {
            enum: ATTENDANCE_STATUS,
        }).notNull(),

        verifiedAt: integer("verified_at", {
            mode: "timestamp_ms",
        }).notNull(),

        createdAt: integer("created_at", {
            mode: "timestamp_ms",
        }).default(sql`(unixepoch() * 1000)`),

        updatedAt: integer("updated_at", {
            mode: "timestamp_ms",
        })
            .default(sql`(unixepoch() * 1000)`)
            .$onUpdate(() => new Date()),
    },
    (table) => [
        uniqueIndex("attendance_user_event_unique").on(
            table.userId,
            table.eventId
        ),
    ]
);

export const eventTransactions = sqliteTable(
    "event_transactions",
    {
        id: text("id")
            .primaryKey()
            .$defaultFn(() => uuidv7()),

        userId: text("user_id")
            .references(() => users.id)
            .notNull(),

        attendanceId: text("attendance_id")
            .references(() => attendances.id)
            .notNull()
            .unique(),

        eventId: text("event_id")
            .references(() => events.id)
            .notNull(),

        points: integer("points").notNull(),

        createdAt: integer("created_at", {
            mode: "timestamp_ms",
        }).default(sql`(unixepoch() * 1000)`),
    }
);

export const rewardRedemptions = sqliteTable(
    "reward_redemptions",
    {
        id: text("id")
            .primaryKey()
            .$defaultFn(() => uuidv7()),

        userId: text("user_id")
            .references(() => users.id)
            .notNull(),

        rewardId: text("reward_id")
            .references(() => rewards.id)
            .notNull(),

        providerId: text("provider_id")
            .references(() => providers.id)
            .notNull(),

        pointsSpent: integer("points_spent").notNull(),

        idempotencyKey: text("idempotency_key").notNull(),

        status: text("status", {
            enum: REDEMPTION_STATUS,
        })
            .notNull()
            .default("PENDING"),

        completedAt: integer("completed_at", {
            mode: "timestamp_ms",
        }),

        expiresAt: integer("expires_at", {
            mode: "timestamp_ms",
        }).notNull(),

        createdAt: integer("created_at", {
            mode: "timestamp_ms",
        }).default(sql`(unixepoch() * 1000)`),

        updatedAt: integer("updated_at", {
            mode: "timestamp_ms",
        })
            .default(sql`(unixepoch() * 1000)`)
            .$onUpdate(() => new Date()),
    },
    (table) => [
        uniqueIndex("reward_redemption_user_idempotency_unique").on(
            table.userId,
            table.idempotencyKey,
        ),
    ]
);

export const badgeDefinitions = sqliteTable("badge_definitions", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => uuidv7()),

    name: text("name").notNull(),

    description: text("description"),

    iconUrl: text("icon"),

    category: text("category", {
        enum: BADGE_CATEGORY,
    }).notNull(),

    criteria: text("criteria").notNull(),

    createdAt: integer("created_at", {
        mode: "timestamp_ms",
    }).default(sql`(unixepoch() * 1000)`),

    updatedAt: integer("updated_at", {
        mode: "timestamp_ms",
    })
        .default(sql`(unixepoch() * 1000)`)
        .$onUpdate(() => new Date()),
});

export const badgeAwards = sqliteTable("badge_awards", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => uuidv7()),

    userId: text("user_id")
        .references(() => users.id, {
            onDelete: "cascade",
        })
        .notNull(),

    badgeDefinitionId: text("badge_definition_id")
        .references(() => badgeDefinitions.id)
        .notNull(),

    leaderboardYear: integer("leaderboard_year"),

    leaderboardPeriod: text("leaderboard_period"),

    reason: text("reason"),

    awardedBy: text("awarded_by").references(() => users.id),

    awardedAt: integer("awarded_at", {
        mode: "timestamp_ms",
    }).default(sql`(unixepoch() * 1000)`),
});

export const leaderboardDistributions = sqliteTable("leaderboard_distributions", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => uuidv7()),

    period: text("period").notNull().unique(),

    distributedBy: text("distributed_by")
        .references(() => users.id)
        .notNull(),

    distributedAt: integer("distributed_at", {
        mode: "timestamp_ms",
    }).default(sql`(unixepoch() * 1000)`),
});

export const announcements = sqliteTable("announcements", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => uuidv7()),

    createdBy: text("created_by")
        .references(() => users.id)
        .notNull(),

    title: text("title").notNull(),

    description: text("description").notNull(),

    createdAt: integer("created_at", {
        mode: "timestamp_ms",
    }).default(sql`(unixepoch() * 1000)`),

    updatedAt: integer("updated_at", {
        mode: "timestamp_ms",
    })
        .default(sql`(unixepoch() * 1000)`)
        .$onUpdate(() => new Date()),
});

export const notifications = sqliteTable("notifications", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => uuidv7()),

    userId: text("user_id")
        .references(() => users.id, {
            onDelete: "cascade",
        })
        .notNull(),

    title: text("title").notNull(),

    message: text("message").notNull(),

    type: text("type", {
        enum: NOTIFICATION_TYPE,
    }).notNull(),

    isRead: integer("is_read", {
        mode: "boolean",
    })
        .notNull()
        .default(false),

    readAt: integer("read_at", {
        mode: "timestamp_ms",
    }),

    createdAt: integer("created_at", {
        mode: "timestamp_ms",
    }).default(sql`(unixepoch() * 1000)`),

    updatedAt: integer("updated_at", {
        mode: "timestamp_ms",
    })
        .default(sql`(unixepoch() * 1000)`)
        .$onUpdate(() => new Date()),
});

// RELATIONS

export const usersRelations = relations(users, ({ many }) => ({
    providers: many(providers),
    attendances: many(attendances),
    eventTransactions: many(eventTransactions),
    rewardRedemptions: many(rewardRedemptions),
    createdEvents: many(events),
    badgeAwards: many(badgeAwards, { relationName: "user_badges" }),
    awardedBadges: many(badgeAwards, { relationName: "badge_awarded_by" }),
    announcements: many(announcements),
    notifications: many(notifications),
}));

export const providersRelations = relations(
    providers,
    ({ one, many }) => ({
        owner: one(users, {
            fields: [providers.ownerId],
            references: [users.id],
        }),

        rewards: many(rewards),

        rewardRedemptions: many(rewardRedemptions),
    })
);

export const rewardsRelations = relations(
    rewards,
    ({ one, many }) => ({
        provider: one(providers, {
            fields: [rewards.providerId],
            references: [providers.id],
        }),

        rewardRedemptions: many(rewardRedemptions),
    })
);

export const eventsRelations = relations(
    events,
    ({ one, many }) => ({
        creator: one(users, {
            fields: [events.createdBy],
            references: [users.id],
        }),

        attendances: many(attendances),

        eventTransactions: many(eventTransactions),
    })
);

export const attendancesRelations = relations(
    attendances,
    ({ one }) => ({
        user: one(users, {
            fields: [attendances.userId],
            references: [users.id],
        }),

        event: one(events, {
            fields: [attendances.eventId],
            references: [events.id],
        }),

        eventTransaction: one(eventTransactions, {
            fields: [attendances.id],
            references: [eventTransactions.attendanceId],
        }),
    })
);

export const eventTransactionsRelations = relations(
    eventTransactions,
    ({ one }) => ({
        user: one(users, {
            fields: [eventTransactions.userId],
            references: [users.id],
        }),

        attendance: one(attendances, {
            fields: [eventTransactions.attendanceId],
            references: [attendances.id],
        }),

        event: one(events, {
            fields: [eventTransactions.eventId],
            references: [events.id],
        }),
    })
);

export const rewardRedemptionsRelations = relations(
    rewardRedemptions,
    ({ one }) => ({
        user: one(users, {
            fields: [rewardRedemptions.userId],
            references: [users.id],
        }),

        reward: one(rewards, {
            fields: [rewardRedemptions.rewardId],
            references: [rewards.id],
        }),

        provider: one(providers, {
            fields: [rewardRedemptions.providerId],
            references: [providers.id],
        }),
    })
);

export const badgeDefinitionsRelations = relations(
    badgeDefinitions,
    ({ many }) => ({
        badgeAwards: many(badgeAwards),
    })
);

export const badgeAwardsRelations = relations(
    badgeAwards,
    ({ one }) => ({
        user: one(users, {
            fields: [badgeAwards.userId],
            references: [users.id],
            relationName: "user_badges",
        }),

        badgeDefinition: one(badgeDefinitions, {
            fields: [badgeAwards.badgeDefinitionId],
            references: [badgeDefinitions.id],
        }),

        awardedBy: one(users, {
            fields: [badgeAwards.awardedBy],
            references: [users.id],
            relationName: "badge_awarded_by",
        }),
    })
);

export const announcementsRelations = relations(
    announcements,
    ({ one }) => ({
        creator: one(users, {
            fields: [announcements.createdBy],
            references: [users.id],
        }),
    })
);

export const notificationsRelations = relations(
    notifications,
    ({ one }) => ({
        user: one(users, {
            fields: [notifications.userId],
            references: [users.id],
        }),
    })
);
