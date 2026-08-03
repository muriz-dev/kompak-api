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
        description: "Record attendance for an event.",
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
        description: "Retrieve attendance history for the currently logged-in user.",
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
        description: "Retrieve all attendances for a specific event (Admin only).",
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
