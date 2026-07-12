import type { Context } from "hono";
import eventRepository from "./event.repository";
import type { CreateEventSchema, FullUpdateEventSchema, PartialUpdateEventSchema } from "./event.schema";
import { ApiError } from "../../utils/api-error";

export const getAllEvents = async (c: Context) => {
    return eventRepository.getAll(c);
}

export const getEventById = async (c: Context, eventId: string) => {
    const event = await eventRepository.getById(c, eventId);

    if (!event) throw ApiError.notFound(`Event with ID ${eventId} not found`);

    return event;
}

export const createEvent = async (c: Context, eventData: CreateEventSchema) => {
    return eventRepository.create(c, eventData);
}

export const fullUpdateEvent = async (c: Context, eventId: string, eventData: FullUpdateEventSchema) => {
    await getEventById(c, eventId);

    return eventRepository.fullUpdate(c, eventId, eventData);
}

export const partialUpdateEvent = async (c: Context, eventId: string, eventData: PartialUpdateEventSchema) => {
    await getEventById(c, eventId);

    return eventRepository.partialUpdate(c, eventId, eventData);
}

export const removeEvent = async (c: Context, eventId: string) => {
    await getEventById(c, eventId);

    return eventRepository.remove(c, eventId);
}

export default {
    getAllEvents,
    getEventById,
    createEvent,
    fullUpdateEvent,
    partialUpdateEvent,
    removeEvent
}
