import { z } from "zod";

export const uploadUrlSchema = z.object({
    folder: z.enum(["profiles", "events", "rewards", "attendances", "providers", "badges"], {
        error: (err) => `Select one of the following folders: profiles, events, rewards, attendances, providers, badges. Received: ${err.input}`,
    }),
    contentType: z.string().nonempty("Content type is required"),
    contentLength: z.number().positive("Content length must be positive").optional(),
});
