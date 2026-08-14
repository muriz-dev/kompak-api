import type { Context } from "hono";
import { and, asc, count, desc, eq, like, sql } from "drizzle-orm";
import { getDb } from "../../db/connection";
import { providers, rewardRedemptions, rewards } from "../../db/schema";
import type { AdminProviderListQuerySchema, CreateProviderSchema, FullUpdateProviderSchema, PartialUpdateProviderSchema, UpdateProviderStatusSchema } from "./provider.schema";

export const getAll = async (c: Context) => {
    const db = getDb(c.env.DB);
    return await db.query.providers.findMany({
        with: {
            owner: {
                columns: {
                    password: false,
                    faceEmbeddingId: false,
                }
            }
        }
    });
}

export const getById = async (c: Context, providerId: string) => {
    const db = getDb(c.env.DB);
    return await db.query.providers.findFirst({
        where: eq(providers.id, providerId),
        with: {
            owner: {
                columns: {
                    password: false,
                    faceEmbeddingId: false,
                }
            }
        }
    });
}

export const getByOwnerId = async (c: Context, ownerId: string) => {
    const db = getDb(c.env.DB);
    return await db.query.providers.findFirst({
        where: eq(providers.ownerId, ownerId),
        with: {
            owner: {
                columns: {
                    password: false,
                    faceEmbeddingId: false,
                },
            },
        },
    });
}

export const getAdminPage = async (
    c: Context,
    query: AdminProviderListQuerySchema,
) => {
    const db = getDb(c.env.DB);
    const normalizedQuery = query.query?.trim();
    const whereClause = and(
        query.status ? eq(providers.status, query.status) : undefined,
        normalizedQuery ? like(providers.name, `%${normalizedQuery}%`) : undefined,
    );
    const offset = (query.page - 1) * query.pageSize;

    const [items, totalRow] = await Promise.all([
        db.query.providers.findMany({
            where: whereClause,
            with: {
                owner: {
                    columns: {
                        password: false,
                        faceEmbeddingId: false,
                    },
                },
            },
            orderBy: [desc(providers.createdAt), asc(providers.name)],
            limit: query.pageSize,
            offset,
        }),
        db.select({ value: count() })
            .from(providers)
            .where(whereClause)
            .get(),
    ]);
    const total = totalRow?.value ?? 0;

    return {
        items,
        pagination: {
            page: query.page,
            pageSize: query.pageSize,
            total,
            totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
        },
    };
};

export const getAdminDetail = async (c: Context, providerId: string) => {
    const db = getDb(c.env.DB);
    const provider = await getById(c, providerId);
    if (!provider) return undefined;

    const [products, completedPointsRow] = await Promise.all([
        db.select({
            id: rewards.id,
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
        })
            .from(rewards)
            .where(and(
                eq(rewards.providerId, providerId),
                eq(rewards.source, "POINT_SHOP"),
            ))
            .orderBy(desc(rewards.createdAt), asc(rewards.name))
            .all(),
        db.select({
            value: sql<number>`coalesce(sum(${rewardRedemptions.pointsSpent}), 0)`,
        })
            .from(rewardRedemptions)
            .where(and(
                eq(rewardRedemptions.providerId, providerId),
                eq(rewardRedemptions.status, "COMPLETED"),
            ))
            .get(),
    ]);

    return {
        ...provider,
        stats: {
            completedPoints: Number(completedPointsRow?.value ?? 0),
            activeProducts: products.filter((product) => product.status === "ACTIVE").length,
        },
        products,
    };
};

export const create = async (c: Context, providerData: CreateProviderSchema) => {
    const db = getDb(c.env.DB);
    const [createdProvider] = await db.insert(providers).values(providerData).returning();
    return createdProvider;
}

export const fullUpdate = async (c: Context, providerId: string, providerData: FullUpdateProviderSchema) => {
    const db = getDb(c.env.DB);
    const [updatedProvider] = await db.update(providers).set(providerData).where(eq(providers.id, providerId)).returning();
    return updatedProvider;
}

export const partialUpdate = async (c: Context, providerId: string, providerData: PartialUpdateProviderSchema) => {
    const db = getDb(c.env.DB);
    const [updatedProvider] = await db.update(providers).set(providerData).where(eq(providers.id, providerId)).returning();
    return updatedProvider;
}

export const updateStatus = async (c: Context, providerId: string, statusData: UpdateProviderStatusSchema) => {
    const db = getDb(c.env.DB);
    const [updatedProvider] = await db.update(providers).set(statusData).where(eq(providers.id, providerId)).returning();
    return updatedProvider;
}

export const remove = async (c: Context, providerId: string) => {
    const db = getDb(c.env.DB);
    const [deletedProvider] = await db.delete(providers).where(eq(providers.id, providerId)).returning();
    return deletedProvider;
}

export default {
    getAll,
    getById,
    getByOwnerId,
    getAdminPage,
    getAdminDetail,
    create,
    fullUpdate,
    partialUpdate,
    updateStatus,
    remove
}
