import type { Context } from "hono";
import { and, asc, count, desc, eq, gt, like, ne } from "drizzle-orm";
import { getDb } from "../../db/connection";
import { providers, rewards } from "../../db/schema";
import type { AdminProviderRewardsQuerySchema, CreateRewardSchema, FullUpdateRewardSchema, PartialUpdateRewardSchema } from "./reward.schema";

/**
 * @name getAll
 * @description Get all rewards
 * @param {Context} c
 * @returns {Promise<Reward[]>}
 */
export const getAll = async (c: Context, source?: "POINT_SHOP" | "LEADERBOARD") => {
    const db = getDb(c.env.DB);
    
    let whereClause = undefined;
    if (source) {
        whereClause = eq(rewards.source, source);
    }

    const rewardsData = await db.query.rewards.findMany({
        where: whereClause,
    });

    return rewardsData;
}

export const getPointShopCatalog = async (c: Context) => {
    const db = getDb(c.env.DB);

    const rows = await db
        .select({
            id: rewards.id,
            providerId: rewards.providerId,
            name: rewards.name,
            description: rewards.description,
            pointsRequired: rewards.pointsRequired,
            stock: rewards.stock,
            type: rewards.type,
            source: rewards.source,
            status: rewards.status,
            imageUrl: rewards.imageUrl,
            isFeatured: rewards.isFeatured,
            validityDays: rewards.validityDays,
            createdAt: rewards.createdAt,
            updatedAt: rewards.updatedAt,
            provider: {
                id: providers.id,
                name: providers.name,
                address: providers.address,
                latitude: providers.latitude,
                longitude: providers.longitude,
                logoUrl: providers.logoUrl,
                storePhotoUrl: providers.storePhotoUrl,
            },
        })
        .from(rewards)
        .innerJoin(providers, eq(rewards.providerId, providers.id))
        .where(and(
            eq(rewards.source, "POINT_SHOP"),
            eq(rewards.status, "ACTIVE"),
            gt(rewards.stock, 0),
            eq(providers.status, "VERIFIED"),
        ))
        .orderBy(desc(rewards.isFeatured), asc(rewards.pointsRequired), asc(rewards.name));

    return rows;
};

export const getAdminProviderPage = async (
    c: Context,
    providerId: string | undefined,
    query: AdminProviderRewardsQuerySchema,
) => {
    const db = getDb(c.env.DB);
    const offset = (query.page - 1) * query.pageSize;
    const normalizedQuery = query.query?.trim();
    const where = and(
        providerId ? eq(rewards.providerId, providerId) : undefined,
        eq(rewards.source, "POINT_SHOP"),
        query.status ? eq(rewards.status, query.status) : undefined,
        query.type ? eq(rewards.type, query.type) : undefined,
        normalizedQuery ? like(rewards.name, `%${normalizedQuery}%`) : undefined,
    );

    const [items, totalRows] = await Promise.all([
        db.query.rewards.findMany({
            where,
            orderBy: [desc(rewards.createdAt), asc(rewards.name)],
            limit: query.pageSize,
            offset,
        }),
        db.select({ total: count() }).from(rewards).where(where),
    ]);
    const total = totalRows[0]?.total ?? 0;

    return {
        items,
        pagination: {
            page: query.page,
            pageSize: query.pageSize,
            total,
            totalPages: total === 0 ? 0 : Math.ceil(total / query.pageSize),
        },
    };
};

export const getAdminLeaderboardRewards = async (c: Context) => {
    const db = getDb(c.env.DB);
    return db
        .select({
            id: rewards.id,
            providerId: rewards.providerId,
            name: rewards.name,
            description: rewards.description,
            pointsRequired: rewards.pointsRequired,
            stock: rewards.stock,
            type: rewards.type,
            source: rewards.source,
            status: rewards.status,
            leaderboardPosition: rewards.leaderboardPosition,
            imageUrl: rewards.imageUrl,
            validityDays: rewards.validityDays,
            createdAt: rewards.createdAt,
            updatedAt: rewards.updatedAt,
            provider: {
                id: providers.id,
                name: providers.name,
                logoUrl: providers.logoUrl,
            },
        })
        .from(rewards)
        .innerJoin(providers, eq(rewards.providerId, providers.id))
        .where(and(
            eq(rewards.source, "LEADERBOARD"),
            eq(rewards.status, "ACTIVE"),
        ))
        .orderBy(asc(rewards.leaderboardPosition), asc(rewards.name));
};

export const getActiveLeaderboardRewardAtPosition = async (
    c: Context,
    position: number,
    excludeRewardId?: string,
) => {
    const db = getDb(c.env.DB);
    return db.query.rewards.findFirst({
        columns: { id: true },
        where: and(
            eq(rewards.source, "LEADERBOARD"),
            eq(rewards.status, "ACTIVE"),
            eq(rewards.leaderboardPosition, position),
            excludeRewardId ? ne(rewards.id, excludeRewardId) : undefined,
        ),
    });
};

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
export const create = async (
    c: Context,
    rewardData: CreateRewardSchema & { status?: "ACTIVE" | "INACTIVE" },
) => {
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
    getPointShopCatalog,
    getAdminProviderPage,
    getAdminLeaderboardRewards,
    getActiveLeaderboardRewardAtPosition,
    getById,
    create,
    fullUpdate,
    partialUpdate,
    remove
}
