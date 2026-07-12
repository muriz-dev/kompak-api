import type { Context } from "hono";
import { eq } from "drizzle-orm";
import { getDb } from "../../db/connection";
import { rewards } from "../../db/schema";
import type { CreateRewardSchema, FullUpdateRewardSchema, PartialUpdateRewardSchema } from "./reward.schema";

/**
 * @name getAll
 * @description Get all rewards
 * @param {Context} c
 * @returns {Promise<Reward[]>}
 */
export const getAll = async (c: Context) => {
    const db = getDb(c.env.DB);

    const rewards = await db.query.rewards.findMany();

    return rewards;
}

/**
 * @name getById
 * @description Get reward by ID
 * @param {Context} c
 * @param {string} rewardId
 * @returns {Promise<Reward>}
 */
export const getById = async (c: Context, rewardId: string) => {
    const db = getDb(c.env.DB);

    const reward = await db.query.rewards.findFirst({
        where: eq(rewards.id, rewardId),
    });

    return reward;
}

/**
 * @name create
 * @description Create reward
 * @param {Context} c
 * @param {CreateRewardSchema} rewardData
 * @returns {Promise<Reward>}
 */
export const create = async (c: Context, rewardData: CreateRewardSchema) => {
    const db = getDb(c.env.DB);

    const [createdReward] = await db.insert(rewards).values(rewardData).returning();

    return createdReward;
}

/**
 * @name fullUpdate
 * @description Full update reward
 * @param {Context} c
 * @param {string} rewardId
 * @param {FullUpdateRewardSchema} rewardData
 * @returns {Promise<Reward>}
 */
export const fullUpdate = async (c: Context, rewardId: string, rewardData: FullUpdateRewardSchema) => {
    const db = getDb(c.env.DB);

    const [updatedReward] = await db.update(rewards).set(rewardData).where(eq(rewards.id, rewardId)).returning();

    return updatedReward;
}

/**
 * @name partialUpdate
 * @description Partial update reward
 * @param {Context} c
 * @param {string} rewardId
 * @param {PartialUpdateRewardSchema} rewardData
 * @returns {Promise<Reward>}
 */
export const partialUpdate = async (c: Context, rewardId: string, rewardData: PartialUpdateRewardSchema) => {
    const db = getDb(c.env.DB);

    const [updatedReward] = await db.update(rewards).set(rewardData).where(eq(rewards.id, rewardId)).returning();

    return updatedReward;
}

/**
 * @name remove
 * @description Remove reward
 * @param {Context} c
 * @param {string} rewardId
 * @returns {Promise<Reward>}
 */
export const remove = async (c: Context, rewardId: string) => {
    const db = getDb(c.env.DB);

    const [deletedReward] = await db.delete(rewards).where(eq(rewards.id, rewardId)).returning();

    return deletedReward;
}

export default {
    getAll,
    getById,
    create,
    fullUpdate,
    partialUpdate,
    remove
}