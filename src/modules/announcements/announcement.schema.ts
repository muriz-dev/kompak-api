import { z } from "zod";

export const createAnnouncementSchema = z.object({
    title: z.string().min(5).max(255),
    description: z.string().min(10),
});

export const updateAnnouncementSchema = createAnnouncementSchema
    .partial()
    .refine(
        (data) => data.title !== undefined || data.description !== undefined,
        { message: "At least one announcement field is required" },
    );

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;
