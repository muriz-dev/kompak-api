import { desc, eq } from "drizzle-orm";
import type { Context } from "hono";
import { getDb } from "../../db/connection";
import { announcements } from "../../db/schema";
import { uuidv7 } from "uuidv7";
import type { UpdateAnnouncementInput } from "./announcement.schema";

export const getAnnouncements = async (c: Context, limit: number = 20) => {
    const db = getDb(c.env.DB);
    return db.query.announcements.findMany({
        orderBy: [desc(announcements.createdAt)],
        limit: limit,
    });
};

export const getAnnouncementById = async (c: Context, id: string) => {
    const db = getDb(c.env.DB);
    return db.query.announcements.findFirst({
        where: eq(announcements.id, id),
    });
};

export const createAnnouncement = async (c: Context, adminId: string, data: any) => {
    const db = getDb(c.env.DB);
    const id = uuidv7();

    await db.insert(announcements).values({
        id,
        createdBy: adminId,
        title: data.title,
        description: data.description,
    });

    return id;
};

export const updateAnnouncement = async (
    c: Context,
    id: string,
    data: UpdateAnnouncementInput,
) => {
    const db = getDb(c.env.DB);
    const [updatedAnnouncement] = await db
        .update(announcements)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(announcements.id, id))
        .returning();

    return updatedAnnouncement;
};

export const deleteAnnouncement = async (c: Context, id: string) => {
    const db = getDb(c.env.DB);
    return db.delete(announcements).where(eq(announcements.id, id));
};

export default {
    getAnnouncements,
    getAnnouncementById,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
};
