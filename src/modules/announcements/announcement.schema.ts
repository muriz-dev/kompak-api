import { z } from "zod";

export const createAnnouncementSchema = z.object({
    title: z.string().min(5).max(255),
    description: z.string().min(10),
});

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
