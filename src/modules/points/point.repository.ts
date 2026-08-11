import { desc, eq } from "drizzle-orm";
import type { Context } from "hono";
import { getDb } from "../../db/connection";
import { eventTransactions, events, rewardRedemptions, rewards, users } from "../../db/schema";

export const getBalance = async (c: Context, userId: string) => {
    const db = getDb(c.env.DB);
    return db.select({ balance: users.balance })
        .from(users)
        .where(eq(users.id, userId))
        .get();
};

export const getEventEntries = async (c: Context, userId: string) => {
    const db = getDb(c.env.DB);
    return db.select({
        id: eventTransactions.id,
        eventId: eventTransactions.eventId,
        title: events.title,
        points: eventTransactions.points,
        occurredAt: eventTransactions.createdAt,
    })
        .from(eventTransactions)
        .innerJoin(events, eq(eventTransactions.eventId, events.id))
        .where(eq(eventTransactions.userId, userId))
        .orderBy(desc(eventTransactions.createdAt));
};

export const getRedemptionEntries = async (c: Context, userId: string) => {
    const db = getDb(c.env.DB);
    return db.select({
        id: rewardRedemptions.id,
        rewardId: rewardRedemptions.rewardId,
        title: rewards.name,
        points: rewardRedemptions.pointsSpent,
        status: rewardRedemptions.status,
        occurredAt: rewardRedemptions.createdAt,
        updatedAt: rewardRedemptions.updatedAt,
    })
        .from(rewardRedemptions)
        .innerJoin(rewards, eq(rewardRedemptions.rewardId, rewards.id))
        .where(eq(rewardRedemptions.userId, userId))
        .orderBy(desc(rewardRedemptions.createdAt));
};

export default {
    getBalance,
    getEventEntries,
    getRedemptionEntries,
};
