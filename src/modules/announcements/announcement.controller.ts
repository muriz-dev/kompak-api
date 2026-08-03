import type { Context } from "hono";
import announcementService from "./announcement.service";
import { ApiResponse } from "../../utils/api-response";

export const getAnnouncements = async (c: Context) => {
    const data = await announcementService.getAnnouncements(c);

    return ApiResponse.ok(c, "Announcements retrieved successfully", data);
};

export const getAnnouncementById = async (c: Context) => {
    const id = c.req.param("id") as string;

    const data = await announcementService.getAnnouncementById(c, id);

    return ApiResponse.ok(c, "Announcement retrieved successfully", data);
};

export const createAnnouncement = async (c: Context) => {
    const payload = c.req.valid("json" as never) as any;

    const data = await announcementService.createAnnouncement(c, payload);

    return ApiResponse.created(c, "Announcement created successfully", data);
};

export const deleteAnnouncement = async (c: Context) => {
    const id = c.req.param("id") as string;

    await announcementService.deleteAnnouncement(c, id);

    return ApiResponse.ok(c, "Announcement deleted successfully");
};

export default {
    getAnnouncements,
    getAnnouncementById,
    createAnnouncement,
    deleteAnnouncement,
};
