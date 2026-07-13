import { z } from "zod";

export const createAttendanceSchema = z.object({
    userId: z.uuid("Invalid User ID format"),
    eventId: z.uuid("Invalid Event ID format"),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
});

export type CreateAttendanceInput = z.infer<typeof createAttendanceSchema>;
