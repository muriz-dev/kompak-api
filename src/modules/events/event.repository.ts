import type { Context } from "hono";
import { eq, and, asc, desc, gt, gte, inArray, lte } from "drizzle-orm";
import { getDb } from "../../db/connection";
import { events } from "../../db/schema";
import type { CreateEventSchema, FullUpdateEventSchema, PartialUpdateEventSchema } from "../events/event.schema";

/**
 * @name getAll
 * @description Get all events
 * @param {Context} c
 * @returns {Promise<Event[]>}
 */
export const getAll = async (c: Context, timeframe?: "upcoming" | "ongoing") => {
    const db = getDb(c.env.DB);
    const now = new Date();

    const whereClause = timeframe === "upcoming"
        ? and(
            eq(events.status, "PUBLISHED"),
            gt(events.attendanceStartTime, now)
        )
        : timeframe === "ongoing"
        ? and(
            eq(events.status, "PUBLISHED"),
            lte(events.attendanceStartTime, now),
            gte(events.attendanceEndTime, now)
        )
        : eq(events.status, "PUBLISHED");

    const orderBy = timeframe === "upcoming"
        ? [asc(events.attendanceStartTime)]
        : timeframe === "ongoing"
        ? [asc(events.attendanceEndTime)]
        : [desc(events.eventDate)];

    const eventsData = await db.query.events.findMany({
        where: whereClause,
        orderBy,
    });

    return eventsData;
}

/**
 * @name getAllAdmin
 * @description Get every event for the admin management surface
 */
export const getAllAdmin = async (
    c: Context,
    status?: "DRAFT" | "PUBLISHED" | "CLOSED" | "CANCELLED"
) => {
    const db = getDb(c.env.DB);

    return db.query.events.findMany({
        where: status ? eq(events.status, status) : undefined,
        orderBy: [desc(events.createdAt)],
    });
};

/**
 * @name getById
 * @description Get event by ID
 * @param {Context} c
 * @param {string} eventId
 * @returns {Promise<Event>}
 */
export const getById = async (c: Context, eventId: string) => {
    const db = getDb(c.env.DB);

    const event = await db.query.events.findFirst({
        where: eq(events.id, eventId),
    });

    return event;
}

/**
 * @name getPublicById
 * @description Get a resident-visible event without exposing drafts or cancellations
 */
export const getPublicById = async (c: Context, eventId: string) => {
    const db = getDb(c.env.DB);

    return db.query.events.findFirst({
        where: and(
            eq(events.id, eventId),
            inArray(events.status, ["PUBLISHED", "CLOSED"]),
        ),
    });
}

/**
 * @name create
 * @description Create event
 * @param {Context} c
 * @param {CreateEventSchema} eventData
 * @returns {Promise<Event>}
 */
export const create = async (c: Context, eventData: CreateEventSchema) => {
    const db = getDb(c.env.DB);
    const jwtPayload = c.get("jwtPayload") as any;

    const [createdEvent] = await db.insert(events).values({
        ...eventData,
        createdBy: jwtPayload.id,
    }).returning();

    return createdEvent;
}

/**
 * @name fullUpdate
 * @description Full update event
 * @param {Context} c
 * @param {string} eventId
 * @param {FullUpdateEventSchema} eventData
 * @returns {Promise<Event>}
 */
export const fullUpdate = async (c: Context, eventId: string, eventData: FullUpdateEventSchema) => {
    const db = getDb(c.env.DB);

    const [updatedEvent] = await db.update(events).set(eventData).where(eq(events.id, eventId)).returning();

    return updatedEvent;
}

/**
 * @name partialUpdate
 * @description Partial update event
 * @param {Context} c
 * @param {string} eventId
 * @param {PartialUpdateEventSchema} eventData
 * @returns {Promise<Event>}
 */
export const partialUpdate = async (c: Context, eventId: string, eventData: PartialUpdateEventSchema) => {
    const db = getDb(c.env.DB);

    const [updatedEvent] = await db.update(events).set(eventData).where(eq(events.id, eventId)).returning();

    return updatedEvent;
}

/**
 * @name remove
 * @description Remove event
 * @param {Context} c
 * @param {string} eventId
 * @returns {Promise<Event>}
 */
export const remove = async (c: Context, eventId: string) => {
    const db = getDb(c.env.DB);

    const [deletedEvent] = await db.delete(events).where(eq(events.id, eventId)).returning();

    return deletedEvent;
}

export default {
    getAll,
    getAllAdmin,
    getById,
    getPublicById,
    create,
    fullUpdate,
    partialUpdate,
    remove
}
