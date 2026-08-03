import { eq, and, desc } from "drizzle-orm";
import type { Context } from "hono";
import { getDb } from "../../db/connection";
import { rewardRedemptions, users, rewards } from "../../db/schema";
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
            user: true,
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

export const getByProviderId = async (c: Context, providerId: string) => {
    const db = getDb(c.env.DB);
    return db.query.rewardRedemptions.findMany({
        where: eq(rewardRedemptions.providerId, providerId),
        orderBy: [desc(rewardRedemptions.createdAt)],
        with: {
            user: true,
            reward: true
        }
    });
};

export const createWithTransaction = async (
    c: Context, 
    data: { userId: string; rewardId: string; providerId: string; pointsSpent: number },
    currentStock: number,
    currentBalance: number
) => {
    const db = getDb(c.env.DB);
    
    const redemptionId = uuidv7();
    
    const insertRedemption = db.insert(rewardRedemptions).values({
        id: redemptionId,
        userId: data.userId,
        rewardId: data.rewardId,
        providerId: data.providerId,
        pointsSpent: data.pointsSpent,
        status: "PENDING"
    }).returning();
    
    const updateUser = db.update(users).set({
        balance: currentBalance - data.pointsSpent,
        updatedAt: new Date()
    }).where(eq(users.id, data.userId));
    
    const updateReward = db.update(rewards).set({
        stock: currentStock - 1,
        updatedAt: new Date()
    }).where(eq(rewards.id, data.rewardId));
    
    const results = await db.batch([insertRedemption, updateUser, updateReward]);
    return results[0][0]; // Return the created redemption
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
        .where(eq(rewardRedemptions.id, id))
        .returning();
        
    return results[0];
};

export const refundTransaction = async (
    c: Context, 
    redemptionId: string, 
    userId: string, 
    pointsToRefund: number,
    rewardId: string,
    currentBalance: number,
    currentStock: number
) => {
    const db = getDb(c.env.DB);
    
    const updateUser = db.update(users).set({
        balance: currentBalance + pointsToRefund,
        updatedAt: new Date()
    }).where(eq(users.id, userId));
    
    const updateReward = db.update(rewards).set({
        stock: currentStock + 1,
        updatedAt: new Date()
    }).where(eq(rewards.id, rewardId));
    
    await db.batch([updateUser, updateReward]);
};

export default {
    getAll,
    getById,
    getByUserId,
    getByProviderId,
    createWithTransaction,
    updateStatus,
    refundTransaction
};
