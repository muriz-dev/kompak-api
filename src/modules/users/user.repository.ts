import { eq, desc } from "drizzle-orm";
import type { Context } from "hono";
import { getDb } from "../../db/connection";
import { users } from "../../db/schema";
import type { RegisterUserData, UpdateStatusSchema, UpdateUserSchema } from "./user.schema";
import type { UserStatus } from "../../db/schema";
import { uuidv7 } from "uuidv7";

export const create = async (
    c: Context,
    data: RegisterUserData,
    status: UserStatus = "PENDING",
) => {
    const db = getDb(c.env.DB);
    const id = uuidv7();
    
    const [user] = await db.insert(users).values({
        id,
        ...data,
        status,
        role: "CITIZEN"
    }).returning();
    
    return user;
};

export const getAll = async (c: Context, status?: string) => {
    const db = getDb(c.env.DB);
    return db.query.users.findMany({
        where: status ? eq(users.status, status as any) : undefined,
        orderBy: [desc(users.createdAt)],
    });
};

export const getById = async (c: Context, id: string) => {
    const db = getDb(c.env.DB);
    return db.query.users.findFirst({
        where: eq(users.id, id),
    });
};

export const getByEmail = async (c: Context, email: string) => {
    const db = getDb(c.env.DB);
    return db.query.users.findFirst({
        where: eq(users.email, email),
    });
};

export const updateStatus = async (c: Context, id: string, data: UpdateStatusSchema) => {
    const db = getDb(c.env.DB);
    const [updatedUser] = await db.update(users).set({
        status: data.status,
        updatedAt: new Date(),
    }).where(eq(users.id, id)).returning();
    return updatedUser;
};

export const update = async (c: Context, id: string, data: UpdateUserSchema) => {
    const db = getDb(c.env.DB);
    const [updatedUser] = await db.update(users).set({
        ...data,
        updatedAt: new Date(),
    }).where(eq(users.id, id)).returning();
    return updatedUser;
};

export default {
    create,
    getAll,
    getById,
    getByEmail,
    update,
    updateStatus
};
