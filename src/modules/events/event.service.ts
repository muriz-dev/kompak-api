import type { Context } from "hono";
import eventRepository from "./event.repository";
import type { CreateEventSchema, FullUpdateEventSchema, PartialUpdateEventSchema } from "./event.schema";
import type { EventStatus } from "../../db/schema";
import { ApiError } from "../../utils/api-error";

export const getAllEvents = async (c: Context, timeframe?: "upcoming" | "ongoing") => {
    return eventRepository.getAll(c, timeframe);
}

export const getAllAdminEvents = async (
    c: Context,
    status?: "DRAFT" | "PUBLISHED" | "CLOSED" | "CANCELLED"
) => {
    return eventRepository.getAllAdmin(c, status);
}

export const getEventById = async (c: Context, eventId: string) => {
    const event = await eventRepository.getPublicById(c, eventId);

    if (!event) throw ApiError.notFound(`Event with ID ${eventId} not found`);

    return event;
}

const getManagedEventById = async (c: Context, eventId: string) => {
    const event = await eventRepository.getById(c, eventId);

    if (!event) throw ApiError.notFound(`Event with ID ${eventId} not found`);

    return event;
}

export const createEvent = async (c: Context, eventData: CreateEventSchema) => {
    return eventRepository.create(c, eventData);
}

export const fullUpdateEvent = async (c: Context, eventId: string, eventData: FullUpdateEventSchema) => {
    await getManagedEventById(c, eventId);

    return eventRepository.fullUpdate(c, eventId, eventData);
}

export const partialUpdateEvent = async (c: Context, eventId: string, eventData: PartialUpdateEventSchema) => {
    const event = await getManagedEventById(c, eventId);

    if (eventData.status && eventData.status !== event.status) {
        const allowedTransitions: Record<EventStatus, readonly EventStatus[]> = {
            DRAFT: ["PUBLISHED"],
            PUBLISHED: ["CLOSED", "CANCELLED"],
            CLOSED: [],
            CANCELLED: [],
        };

        if (!allowedTransitions[event.status].includes(eventData.status)) {
            throw ApiError.badRequest(
                `Cannot update event status from ${event.status} to ${eventData.status}`
            );
        }
    }

    return eventRepository.partialUpdate(c, eventId, eventData);
}

export const removeEvent = async (c: Context, eventId: string) => {
    await getManagedEventById(c, eventId);

    return eventRepository.remove(c, eventId);
}

export default {
    getAllEvents,
    getAllAdminEvents,
    getEventById,
    createEvent,
    fullUpdateEvent,
    partialUpdateEvent,
    removeEvent
}
