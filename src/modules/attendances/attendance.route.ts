import { Hono } from "hono";
import { describeRoute, validator } from "hono-openapi";
import attendanceController from "./attendance.controller";
import { createAttendanceSchema } from "./attendance.schema";
import { requireAuth, requireRole } from "../../middlewares/auth";
import { z } from "zod";

const router = new Hono();

router.post(
    "/",
    describeRoute({
        summary: "Record Attendance",
        description: "Submits an attendance check-in. The frontend MUST provide the user's current GPS coordinates (latitude/longitude) and a base64 encoded photo for Face Verification. The system validates if the user is within the event's radius and time window before awarding points.",
        tags: ["Attendances"],
        security: [{ bearerAuth: [] }],
        responses: {
            201: { description: "Attendance successfully recorded" },
            400: { description: "Validation error, geolocation mismatch, or invalid time window" },
            404: { description: "User or Event not found" },
            409: { description: "User has already attended this event" },
        },
    }),
    requireAuth,
    validator("json", createAttendanceSchema),
    attendanceController.recordAttendance
);

router.get(
    "/me",
    describeRoute({
        summary: "Get My Attendances",
        description: "Retrieves the historical attendance records for the currently logged-in citizen. Useful for rendering a 'My Activities' or 'History' tab in the app.",
        tags: ["Attendances"],
        security: [{ bearerAuth: [] }],
        responses: {
            200: { description: "User attendances retrieved successfully" },
        },
    }),
    requireAuth,
    attendanceController.getMyAttendances
);

router.get(
    "/event/:eventId",
    describeRoute({
        summary: "Get Event Attendances",
        description: "Admin ONLY. Retrieves a list of all citizens who successfully attended a specific event. Used for reporting and CMS dashboards.",
        tags: ["Attendances"],
        security: [{ bearerAuth: [] }],
        responses: {
            200: { description: "Event attendances retrieved successfully" },
        },
    }),
    requireAuth,
    requireRole(["ADMIN"]),
    validator("param", z.object({ eventId: z.string().uuid() })),
    attendanceController.getEventAttendances
);

export default router;
