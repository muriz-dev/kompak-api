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
        description: "Submits a multipart attendance check-in with the user's current GPS coordinates and a transient face image. The image is verified by the Face Service and is not retained. The system validates account status, event state, time window, radius, face identity, and duplicate attendance before awarding points.",
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
    requireRole(["CITIZEN"]),
    validator("form", createAttendanceSchema),
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
