import type { Context } from "hono";
import announcementRepository from "./announcement.repository";
import { ApiError } from "../../utils/api-error";
import type { CreateAnnouncementInput } from "./announcement.schema";

export const getAnnouncements = async (c: Context) => {
    return announcementRepository.getAnnouncements(c);
};

export const getAnnouncementById = async (c: Context, id: string) => {
    const announcement = await announcementRepository.getAnnouncementById(c, id);
    if (!announcement) {
        throw new ApiError(404, "Announcement not found");
    }
    return announcement;
};

export const createAnnouncement = async (c: Context, data: CreateAnnouncementInput) => {
    const jwtPayload = c.get("jwtPayload") as any;
    const announcementId = await announcementRepository.createAnnouncement(c, jwtPayload.id, data);
    return { announcementId };
};

export const deleteAnnouncement = async (c: Context, id: string) => {
    const announcement = await announcementRepository.getAnnouncementById(c, id);
    if (!announcement) {
        throw new ApiError(404, "Announcement not found");
    }
    await announcementRepository.deleteAnnouncement(c, id);
};

export default {
    getAnnouncements,
    getAnnouncementById,
    createAnnouncement,
    deleteAnnouncement,
};
