import { eq, desc } from "drizzle-orm";
import type { Context } from "hono";
import { getDb } from "../../db/connection";
import { badgeDefinitions, badgeAwards, users } from "../../db/schema";
import { uuidv7 } from "uuidv7";

export const getBadgeDefinitions = async (c: Context) => {
    const db = getDb(c.env.DB);
    return db.select().from(badgeDefinitions).orderBy(desc(badgeDefinitions.createdAt)).all();
};

export const getBadgeDefinitionById = async (c: Context, id: string) => {
    const db = getDb(c.env.DB);
    return db.select().from(badgeDefinitions).where(eq(badgeDefinitions.id, id)).get();
};

export const createBadgeDefinition = async (c: Context, adminId: string, data: any) => {
    const db = getDb(c.env.DB);
    const badgeId = uuidv7();

    await db.insert(badgeDefinitions).values({
        id: badgeId,
        name: data.name,
        description: data.description,
        iconUrl: data.icon,
        category: data.category,
        criteria: data.criteria,
    });

    return badgeId;
};

export const getUserBadges = async (c: Context, userId: string) => {
    const db = getDb(c.env.DB);
    return db.query.badgeAwards.findMany({
        where: eq(badgeAwards.userId, userId),
        orderBy: [desc(badgeAwards.awardedAt)],
        with: {
            badgeDefinition: true,
        },
    });
};

export const awardBadge = async (c: Context, adminId: string, userId: string, badgeDefinitionId: string, reason?: string) => {
    const db = getDb(c.env.DB);
    const awardId = uuidv7();

    await db.insert(badgeAwards).values({
        id: awardId,
        userId: userId,
        badgeDefinitionId: badgeDefinitionId,
        awardedBy: adminId,
        reason: reason,
    });

    return awardId;
};

export const checkUserExists = async (c: Context, userId: string) => {
    const db = getDb(c.env.DB);
    return db.select().from(users).where(eq(users.id, userId)).get();
};

export default {
    getBadgeDefinitions,
    getBadgeDefinitionById,
    createBadgeDefinition,
    getUserBadges,
    awardBadge,
    checkUserExists
};
