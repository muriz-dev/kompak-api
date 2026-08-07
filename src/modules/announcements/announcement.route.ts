import { Hono } from "hono";
import { describeRoute, validator } from "hono-openapi";
import announcementController from "./announcement.controller";
import { createAnnouncementSchema } from "./announcement.schema";
import { requireAuth, requireRole } from "../../middlewares/auth";

const router = new Hono();

router.get(
    "/",
    describeRoute({
        summary: "Get Announcements",
        description: "Retrieves a list of general announcements broadcasted by admins. Useful for rendering a 'News' or 'Announcements' banner in the app.",
        tags: ["Announcements"],
        security: [{ bearerAuth: [] }],
        responses: {
            200: { description: "Announcements retrieved successfully" },
        },
    }),
    requireAuth,
    announcementController.getAnnouncements
);

router.post(
    "/",
    describeRoute({
        summary: "Create Announcement",
        description: "Admin ONLY. Publishes a new announcement that will be visible to all citizens.",
        tags: ["Announcements"],
        security: [{ bearerAuth: [] }],
        responses: {
            201: { description: "Announcement created successfully" },
            403: { description: "Forbidden" },
        },
    }),
    requireAuth,
    requireRole(["ADMIN"]),
    validator("json", createAnnouncementSchema),
    announcementController.createAnnouncement
);

router.get(
    "/:id",
    describeRoute({
        summary: "Get Announcement Details",
        description: "Retrieve details of a specific announcement.",
        tags: ["Announcements"],
        security: [{ bearerAuth: [] }],
        responses: {
            200: { description: "Announcement retrieved successfully" },
            404: { description: "Announcement not found" },
        },
    }),
    requireAuth,
    announcementController.getAnnouncementById
);

router.delete(
    "/:id",
    describeRoute({
        summary: "Delete Announcement",
        description: "Delete an announcement (Admin only).",
        tags: ["Announcements"],
        security: [{ bearerAuth: [] }],
        responses: {
            200: { description: "Announcement deleted successfully" },
            403: { description: "Forbidden" },
            404: { description: "Announcement not found" },
        },
    }),
    requireAuth,
    requireRole(["ADMIN"]),
    announcementController.deleteAnnouncement
);

export default router;
