import type { Context, Env, ValidationTargets } from "hono";
import eventService from "./event.service";
import type { AdminQuerySchema, ParamSchema, QuerySchema, CreateEventSchema, FullUpdateEventSchema, PartialUpdateEventSchema } from "./event.schema";
import { ApiResponse } from "../../utils/api-response";

type EventContext = Context<Env, any, {
    in: Pick<ValidationTargets, 'param' | 'json' | 'query'> & {
        param: ParamSchema,
        json: CreateEventSchema | FullUpdateEventSchema | PartialUpdateEventSchema,
        query: QuerySchema & AdminQuerySchema,
    };
    out: Pick<ValidationTargets, 'param' | 'json' | 'query'> & {
        param: ParamSchema,
        json: CreateEventSchema | FullUpdateEventSchema | PartialUpdateEventSchema,
        query: QuerySchema & AdminQuerySchema,
    };
}>;

export const getAllEvents = async (ctx: EventContext) => {
    const { timeframe } = ctx.req.valid("query") || {};

    const events = await eventService.getAllEvents(ctx, timeframe);

    return ApiResponse.ok(ctx, "Events retrieved successfully", events);
}

export const getAllAdminEvents = async (ctx: EventContext) => {
    const { status } = ctx.req.valid("query") || {};

    const events = await eventService.getAllAdminEvents(ctx, status);

    return ApiResponse.ok(ctx, "Admin events retrieved successfully", events);
}

export const getEventById = async (ctx: EventContext) => {
    const { eventId } = ctx.req.valid("param");

    const event = await eventService.getEventById(ctx, eventId);

    return ApiResponse.ok(ctx, "Event retrieved successfully", event);
}

export const getManagedEventById = async (ctx: EventContext) => {
    const { eventId } = ctx.req.valid("param");

    const event = await eventService.getManagedEventById(ctx, eventId);

    return ApiResponse.ok(ctx, "Admin event retrieved successfully", event);
}

export const createEvent = async (ctx: EventContext) => {
    const eventData = ctx.req.valid("json");

    const event = await eventService.createEvent(ctx, eventData);

    return ApiResponse.created(ctx, "Event created successfully", event);
}

export const fullUpdateEvent = async (ctx: EventContext) => {
    const { eventId } = ctx.req.valid("param");
    const eventData = ctx.req.valid("json");

    const event = await eventService.fullUpdateEvent(ctx, eventId, eventData);

    return ApiResponse.ok(ctx, "Event updated successfully", event);
}

export const partialUpdateEvent = async (ctx: EventContext) => {
    const { eventId } = ctx.req.valid("param");
    const eventData = ctx.req.valid("json");

    const event = await eventService.partialUpdateEvent(ctx, eventId, eventData);

    return ApiResponse.ok(ctx, "Event updated successfully", event);
}

export const removeEvent = async (ctx: EventContext) => {
    const { eventId } = ctx.req.valid("param");

    await eventService.removeEvent(ctx, eventId);

    return ApiResponse.ok(ctx, "Event deleted successfully");
}

export default {
    getAllEvents,
    getAllAdminEvents,
    getEventById,
    getManagedEventById,
    createEvent,
    fullUpdateEvent,
    partialUpdateEvent,
    removeEvent
};
