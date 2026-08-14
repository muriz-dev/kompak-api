import { z } from "zod";

const MAX_FACE_IMAGE_BYTES = 10 * 1024 * 1024;
const FACE_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const createAttendanceSchema = z.object({
    eventId: z.uuid("Invalid Event ID format"),
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
    faceImage: z.file("Face image is required")
        .max(MAX_FACE_IMAGE_BYTES, "Face image must be no larger than 10 MB")
        .mime(FACE_IMAGE_TYPES, "Face image must be a JPEG, PNG, or WebP file")
        .transform((file) => file as File),
    activityPhotoUrl: z.url("Invalid photo URL").optional(),
    activityDescription: z.string().trim().max(500).optional(),
});

export type CreateAttendanceInput = z.infer<typeof createAttendanceSchema>;
