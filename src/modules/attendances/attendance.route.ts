import { Hono } from "hono";
import { describeRoute, validator } from "hono-openapi";
import attendanceController from "./attendance.controller";
import { createAttendanceSchema } from "./attendance.schema";
import { requireAuth } from "../../middlewares/auth";

const router = new Hono();

router.post(
    "/",
    describeRoute({
        summary: "Record Attendance",
        description: "Record attendance for an event based on facial recognition match.",
        tags: ["Attendances"],
        responses: {
            201: {
                description: "Attendance successfully recorded",
            },
            400: {
                description: "Validation error, geolocation mismatch, or invalid time window",
            },
            404: {
                description: "User or Event not found",
            },
            409: {
                description: "User has already attended this event",
            },
        },
    }),
    requireAuth,
    validator("json", createAttendanceSchema),
    attendanceController.recordAttendance
);

export default router;
