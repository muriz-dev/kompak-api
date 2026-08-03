import { z } from "zod";

export const createAttendanceSchema = z.object({
    eventId: z.uuid("Invalid Event ID format"),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    activityPhotoUrl: z.url("Invalid photo URL").optional(),
    activityDescription: z.string().optional(),
});

export type CreateAttendanceInput = z.infer<typeof createAttendanceSchema>;
