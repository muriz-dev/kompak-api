import { Hono } from "hono";
import { describeRoute, validator } from "hono-openapi";
import * as controller from "./event.controller";
import { adminQuerySchema, paramSchema, querySchema, createEventSchema, fullUpdateEventSchema, partialUpdateEventSchema } from "./event.schema";
import { requireAuth, requireRole } from "../../middlewares/auth";

const eventRouter = new Hono();

eventRouter.get(
    "/",
    describeRoute({
        summary: "Get All Events",
        description: "Retrieves a list of community events. The frontend should heavily use the query parameter `?timeframe=upcoming` or `?timeframe=ongoing` to fetch relevant events for the user's home feed. Events returned are strictly those with a 'PUBLISHED' status.",
        tags: ["Events"],
        responses: {
            200: {
                description: "Events retrieved successfully",
            },
        },
    }),
    validator("query", querySchema),
    controller.getAllEvents,
);

eventRouter.get(
    "/admin",
    describeRoute({
        summary: "Get Events for Admin Management",
        description: "Admin ONLY. Retrieves events in every lifecycle status. Optionally filter with `?status=DRAFT|PUBLISHED|CLOSED|CANCELLED`.",
        tags: ["Events"],
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: "Admin events retrieved successfully",
            },
            401: {
                description: "Authentication required",
            },
            403: {
                description: "Admin role required",
            },
        },
    }),
    requireAuth,
    requireRole(['ADMIN']),
    validator("query", adminQuerySchema),
    controller.getAllAdminEvents,
);

eventRouter.get(
    "/:eventId",
    describeRoute({
        summary: "Get Event by ID",
        description: "Retrieves the full details of a specific event. Use this to populate the Event Detail page. Contains location coordinates, radius, and schedule required for check-in validation.",
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
        description: "Admin ONLY. Creates a new community event. The status defaults to 'DRAFT' when omitted; send 'PUBLISHED' to create and publish it immediately. An optional bannerUrl may reference an image uploaded through the storage API.",
        tags: ["Events"],
        security: [{ bearerAuth: [] }],
        responses: {
            201: {
                description: "Event created successfully",
            },
            400: {
                description: "Invalid event data, schedule, or location",
            },
        },
    }),
    requireAuth,
    requireRole(['ADMIN']),
    validator("json", createEventSchema),
    controller.createEvent,
);

eventRouter.put(
    "/:eventId",
    describeRoute({
        summary: "Full Update Event",
        description: "Admin ONLY. Replaces the entire event record. Useful when editing all fields of an event in the CMS.",
        tags: ["Events"],
        security: [{ bearerAuth: [] }],
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
    requireRole(['ADMIN']),
    validator("param", paramSchema),
    validator("json", fullUpdateEventSchema),
    controller.fullUpdateEvent,
);

eventRouter.patch(
    "/:eventId",
    describeRoute({
        summary: "Partial Update Event",
        description: "Admin ONLY. Updates specific fields of an event. Commonly used to publish an event by sending `{\"status\": \"PUBLISHED\"}`.",
        tags: ["Events"],
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: "Event updated successfully",
            },
            400: {
                description: "Invalid request body or event status transition",
            },
            404: {
                description: "Event not found",
            },
        },
    }),
    requireAuth,
    requireRole(['ADMIN']),
    validator("param", paramSchema),
    validator("json", partialUpdateEventSchema),
    controller.partialUpdateEvent,
);

eventRouter.delete(
    "/:eventId",
    describeRoute({
        summary: "Remove Event",
        description: "Admin ONLY. Permanently deletes an event from the database. Use with caution as this may impact historical attendance records.",
        tags: ["Events"],
        security: [{ bearerAuth: [] }],
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
    requireRole(['ADMIN']),
    validator("param", paramSchema),
    controller.removeEvent,
);

export default eventRouter;
