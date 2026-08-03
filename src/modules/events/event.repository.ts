import type { Context } from "hono";
import { eq } from "drizzle-orm";
import { getDb } from "../../db/connection";
import { events } from "../../db/schema";
import type { CreateEventSchema, FullUpdateEventSchema, PartialUpdateEventSchema } from "../events/event.schema";

/**
 * @name getAll
 * @description Get all events
 * @param {Context} c
 * @returns {Promise<Event[]>}
 */
export const getAll = async (c: Context) => {
    const db = getDb(c.env.DB);

    const events = await db.query.events.findMany();

    return events;
}

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
    getById,
    create,
    fullUpdate,
    partialUpdate,
    remove
}