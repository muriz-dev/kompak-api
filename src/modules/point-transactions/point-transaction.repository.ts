import { eq } from "drizzle-orm";
import type { Context } from "hono";
import { getDb } from "../../db/connection";
import { pointTransactions, users } from "../../db/schema";
import type { CreatePointTransactionSchema } from "./point-transaction.schema";
import { uuidv7 } from "uuidv7";

export const getAll = async (c: Context) => {
    const db = getDb(c.env.DB);
    return db.query.pointTransactions.findMany();
};

export const getById = async (c: Context, id: string) => {
    const db = getDb(c.env.DB);
    return db.query.pointTransactions.findFirst({
        where: eq(pointTransactions.id, id),
    });
};

export const getByUserId = async (c: Context, userId: string) => {
    const db = getDb(c.env.DB);
    return db.query.pointTransactions.findMany({
        where: eq(pointTransactions.userId, userId),
    });
};

export const create = async (c: Context, data: CreatePointTransactionSchema) => {
    const db = getDb(c.env.DB);

    const id = uuidv7();

    const user = await db.select().from(users).where(eq(users.id, data.userId)).get();
    
    const insertQuery = db.insert(pointTransactions).values({
        id,
        ...data
    }).returning();

    if (user) {
        const updateQuery = db.update(users).set({
            balance: (user.balance ?? 0) + data.amount,
            leaderboardPoints: data.transactionType === "ATTENDANCE_REWARD" && data.amount > 0
                ? (user.leaderboardPoints ?? 0) + data.amount
                : user.leaderboardPoints,
            updatedAt: new Date(),
        }).where(eq(users.id, data.userId));

        const results = await db.batch([insertQuery, updateQuery]);
        return results[0][0];
    } else {
        const results = await insertQuery;
        return results[0];
    }
};

export default {
    getAll,
    getById,
    getByUserId,
    create
};
