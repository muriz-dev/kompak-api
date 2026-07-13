import { Hono } from "hono";
import { describeRoute, validator } from "hono-openapi";
import * as controller from "./event.controller";
import { paramSchema, createEventSchema, fullUpdateEventSchema, partialUpdateEventSchema } from "./event.schema";
import { requireAuth, requireAdmin } from "../../middlewares/auth";

const eventRouter = new Hono();

eventRouter.get(
    "/",
    describeRoute({
        summary: "Get All Events",
        description: "Retrieve a list of all events in the SGA profile system.",
        tags: ["Events"],
        responses: {
            200: {
                description: "Events retrieved successfully",
            },
        },
    }),
    controller.getAllEvents,
);

eventRouter.get(
    "/:eventId",
    describeRoute({
        summary: "Get Event by ID",
        description: "Retrieve an event by its ID.",
        tags: ["Events"],
        responses: {
            200: {
                description: "Event retrieved successfully",
            },
            404: {
                description: "Event not found",
            },
        },
    }),
    validator("param", paramSchema),
    controller.getEventById,
);

eventRouter.post(
    "/",
    describeRoute({
        summary: "Create Event",
        description: "Create a new event.",
        tags: ["Events"],
        responses: {
            201: {
                description: "Event created successfully",
            },
            400: {
                description: "Invalid request body",
            },
        },
    }),
    requireAuth,
    requireAdmin,
    validator("json", createEventSchema),
    controller.createEvent,
);

eventRouter.put(
    "/:eventId",
    describeRoute({
        summary: "Full Update Event",
        description: "Update an event by its ID (full update).",
        tags: ["Events"],
        responses: {
            200: {
                description: "Event updated successfully",
            },
            400: {
                description: "Invalid request body",
            },
            404: {
                description: "Event not found",
            },
        },
    }),
    requireAuth,
    requireAdmin,
    validator("param", paramSchema),
    validator("json", fullUpdateEventSchema),
    controller.fullUpdateEvent,
);

eventRouter.patch(
    "/:eventId",
    describeRoute({
        summary: "Partial Update Event",
        description: "Update an event by its ID (partial update).",
        tags: ["Events"],
        responses: {
            200: {
                description: "Event updated successfully",
            },
            400: {
                description: "Invalid request body",
            },
            404: {
                description: "Event not found",
            },
        },
    }),
    requireAuth,
    requireAdmin,
    validator("param", paramSchema),
    validator("json", partialUpdateEventSchema),
    controller.partialUpdateEvent,
);

eventRouter.delete(
    "/:eventId",
    describeRoute({
        summary: "Remove Event",
        description: "Remove an event by its ID.",
        tags: ["Events"],
        responses: {
            200: {
                description: "Event deleted successfully",
            },
            404: {
                description: "Event not found",
            },
        },
    }),
    requireAuth,
    requireAdmin,
    validator("param", paramSchema),
    controller.removeEvent,
);

export default eventRouter;