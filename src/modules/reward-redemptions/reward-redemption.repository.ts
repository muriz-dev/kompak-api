import { and, desc, eq } from "drizzle-orm";
import type { Context } from "hono";
import { getDb } from "../../db/connection";
import { rewardRedemptions } from "../../db/schema";
import { uuidv7 } from "uuidv7";

export const getAll = async (c: Context) => {
    const db = getDb(c.env.DB);
    return db.query.rewardRedemptions.findMany({
        orderBy: [desc(rewardRedemptions.createdAt)],
    });
};

export const getById = async (c: Context, id: string) => {
    const db = getDb(c.env.DB);
    return db.query.rewardRedemptions.findFirst({
        where: eq(rewardRedemptions.id, id),
        with: {
            user: {
                columns: {
                    password: false
                }
            },
            reward: true,
            provider: true
        }
    });
};

export const getByUserId = async (c: Context, userId: string) => {
    const db = getDb(c.env.DB);
    return db.query.rewardRedemptions.findMany({
        where: eq(rewardRedemptions.userId, userId),
        orderBy: [desc(rewardRedemptions.createdAt)],
        with: {
            reward: true,
            provider: true
        }
    });
};

export const getByUserAndIdempotencyKey = async (
    c: Context,
    userId: string,
    idempotencyKey: string,
) => {
    const db = getDb(c.env.DB);
    return db.query.rewardRedemptions.findFirst({
        where: and(
            eq(rewardRedemptions.userId, userId),
            eq(rewardRedemptions.idempotencyKey, idempotencyKey),
        ),
        with: {
            reward: true,
            provider: true,
        },
    });
};

export const getByProviderId = async (c: Context, providerId: string) => {
    const db = getDb(c.env.DB);
    return db.query.rewardRedemptions.findMany({
        where: eq(rewardRedemptions.providerId, providerId),
        orderBy: [desc(rewardRedemptions.createdAt)],
        with: {
            user: {
                columns: {
                    password: false
                }
            },
            reward: true
        }
    });
};

export const createWithTransaction = async (
    c: Context,
    data: {
        userId: string;
        rewardId: string;
        providerId: string;
        pointsSpent: number;
        idempotencyKey: string;
        expiresAt: Date;
    },
) => {
    const db = getDb(c.env.DB);

    const [redemption] = await db.insert(rewardRedemptions).values({
        id: uuidv7(),
        userId: data.userId,
        rewardId: data.rewardId,
        providerId: data.providerId,
        pointsSpent: data.pointsSpent,
        idempotencyKey: data.idempotencyKey,
        status: "PENDING",
        expiresAt: data.expiresAt,
    }).returning();

    return redemption;
};

export const updateStatus = async (
    c: Context, 
    id: string, 
    status: "PENDING" | "REJECTED" | "COMPLETED" | "CANCELLED",
    completedAt?: Date
) => {
    const db = getDb(c.env.DB);
    const updateData: any = { status, updatedAt: new Date() };
    if (completedAt) {
        updateData.completedAt = completedAt;
    }
    
    const results = await db.update(rewardRedemptions)
        .set(updateData)
        .where(and(
            eq(rewardRedemptions.id, id),
            eq(rewardRedemptions.status, "PENDING"),
        ))
        .returning();
        
    return results[0];
};

export default {
    getAll,
    getById,
    getByUserId,
    getByUserAndIdempotencyKey,
    getByProviderId,
    createWithTransaction,
    updateStatus,
};
