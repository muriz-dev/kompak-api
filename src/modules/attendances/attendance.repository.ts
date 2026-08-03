import { eq, and, desc } from "drizzle-orm";
import type { Context } from "hono";
import { getDb } from "../../db/connection";
import { events, users, attendances, eventTransactions } from "../../db/schema";
import { uuidv7 } from "uuidv7";

export const getEvent = async (c: Context, eventId: string) => {
    const db = getDb(c.env.DB);
    return db.select().from(events).where(eq(events.id, eventId)).get();
};

export const getUser = async (c: Context, userId: string) => {
    const db = getDb(c.env.DB);
    return db.select().from(users).where(eq(users.id, userId)).get();
};

export const getExistingAttendance = async (c: Context, userId: string, eventId: string) => {
    const db = getDb(c.env.DB);
    return db.select()
        .from(attendances)
        .where(and(eq(attendances.userId, userId), eq(attendances.eventId, eventId)))
        .get();
};

export const getAttendancesByUserId = async (c: Context, userId: string) => {
    const db = getDb(c.env.DB);
    return db.query.attendances.findMany({
        where: eq(attendances.userId, userId),
        orderBy: [desc(attendances.createdAt)],
        with: {
            event: true
        }
    });
};

export const getAttendancesByEventId = async (c: Context, eventId: string) => {
    const db = getDb(c.env.DB);
    return db.query.attendances.findMany({
        where: eq(attendances.eventId, eventId),
        orderBy: [desc(attendances.createdAt)],
        with: {
            user: true
        }
    });
};

export const createAttendanceTransaction = async (
    c: Context, 
    data: {
        userId: string,
        eventId: string,
        activityPhotoUrl?: string,
        activityDescription?: string,
        rewardPoints: number,
        currentBalance: number,
        currentLeaderboardPoints: number
    }
) => {
    const db = getDb(c.env.DB);
    const attendanceId = uuidv7();

    const insertAttendance = db.insert(attendances).values({
        id: attendanceId,
        userId: data.userId,
        eventId: data.eventId,
        activityPhotoUrl: data.activityPhotoUrl,
        activityDescription: data.activityDescription,
        status: "PRESENT",
        verifiedAt: new Date(),
    });

    if (data.rewardPoints > 0) {
        const insertEventTx = db.insert(eventTransactions).values({
            id: uuidv7(),
            userId: data.userId,
            attendanceId: attendanceId,
            eventId: data.eventId,
            points: data.rewardPoints
        });

        const updateUser = db.update(users)
            .set({
                balance: data.currentBalance + data.rewardPoints,
                leaderboardPoints: data.currentLeaderboardPoints + data.rewardPoints,
                updatedAt: new Date(),
            })
            .where(eq(users.id, data.userId));

        await db.batch([
            insertAttendance,
            insertEventTx,
            updateUser
        ]);
    } else {
        await insertAttendance;
    }
    
    return attendanceId;
};

export default {
    getEvent,
    getUser,
    getExistingAttendance,
    getAttendancesByUserId,
    getAttendancesByEventId,
    createAttendanceTransaction
};
