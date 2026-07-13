import { z } from "zod";

export const createAttendanceSchema = z.object({
    userId: z.string().uuid("Invalid User ID format").optional(),
    faceEmbeddingId: z.string().min(1, "Face embedding ID cannot be empty").optional(),
    eventId: z.string().uuid("Invalid Event ID format"),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
}).refine(data => data.userId || data.faceEmbeddingId, {
    message: "Either userId or faceEmbeddingId must be provided",
    path: ["userId"],
});

export type CreateAttendanceInput = z.infer<typeof createAttendanceSchema>;
