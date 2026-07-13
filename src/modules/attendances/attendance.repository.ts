import { eq, and } from "drizzle-orm";
import type { Context } from "hono";
import { getDb } from "../../db/connection";
import { events, users, attendances, pointTransactions } from "../../db/schema";

export const getEvent = async (c: Context, eventId: string) => {
    const db = getDb(c.env.DB);

    return db.select().from(events).where(eq(events.id, eventId)).get();
};

export const getUser = async (c: Context, userId: string) => {
    const db = getDb(c.env.DB);

    return db.select().from(users).where(eq(users.id, userId)).get();
};

export const getUserByFaceEmbeddingId = async (c: Context, faceEmbeddingId: string) => {
    const db = getDb(c.env.DB);

    return db.select().from(users).where(eq(users.faceEmbeddingId, faceEmbeddingId)).get();
};

export const getExistingAttendance = async (c: Context, userId: string, eventId: string) => {
    const db = getDb(c.env.DB);

    return db.select()
        .from(attendances)
        .where(and(eq(attendances.userId, userId), eq(attendances.eventId, eventId)))
        .get();
};

export const createAttendanceTransaction = async (c: Context, attendanceId: string, user: any, eventId: string, rewardPoints: number, now: Date) => {
    const db = getDb(c.env.DB);

    const insertAttendance = db.insert(attendances).values({
        id: attendanceId,
        userId: user.id,
        eventId: eventId,
        verifiedAt: now,
    });

    if (rewardPoints > 0) {
        const insertPoint = db.insert(pointTransactions).values({
            userId: user.id,
            amount: rewardPoints,
            transactionType: "ATTENDANCE_REWARD",
            referenceId: attendanceId,
        });

        const updateUser = db.update(users)
            .set({
                balance: (user.balance ?? 0) + rewardPoints,
                leaderboardPoints: (user.leaderboardPoints ?? 0) + rewardPoints,
                updatedAt: new Date(),
            })
            .where(eq(users.id, user.id));

        await db.batch([
            insertAttendance,
            insertPoint,
            updateUser
        ]);
    } else {
        await insertAttendance;
    }
};

export default {
    getEvent,
    getUser,
    getUserByFaceEmbeddingId,
    getExistingAttendance,
    createAttendanceTransaction
};
