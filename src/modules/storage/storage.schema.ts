import { z } from "zod";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export const uploadUrlSchema = z.object({
    folder: z.enum(["profiles", "events", "rewards", "attendances", "providers", "badges"], {
        error: (err) => `Select one of the following folders: profiles, events, rewards, attendances, providers, badges. Received: ${err.input}`,
    }),
    contentType: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"], {
        error: "Only JPEG, PNG, WebP, and GIF images are supported",
    }),
    contentLength: z.number()
        .int("Content length must be a whole number")
        .positive("Content length must be positive")
        .max(MAX_UPLOAD_BYTES, "File size must not exceed 5 MB"),
});

export type UploadUrlSchema = z.infer<typeof uploadUrlSchema>;
