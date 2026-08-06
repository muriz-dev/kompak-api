import type { Context } from "hono";
import { eq } from "drizzle-orm";
import { getDb } from "../../db/connection";
import { providers } from "../../db/schema";
import type { CreateProviderSchema, FullUpdateProviderSchema, PartialUpdateProviderSchema, UpdateProviderStatusSchema } from "./provider.schema";

export const getAll = async (c: Context) => {
    const db = getDb(c.env.DB);
    return await db.query.providers.findMany({
        with: {
            owner: {
                columns: {
                    password: false
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
                    password: false
                }
            }
        }
    });
}

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
    create,
    fullUpdate,
    partialUpdate,
    updateStatus,
    remove
}
