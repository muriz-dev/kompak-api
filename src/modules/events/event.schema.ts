import { z, exactOptional } from "zod";

export const paramSchema = z.object({
    eventId: z.uuid("Invalid event ID"),
});

export const createEventSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string(),
    eventDate: z.coerce.date({
        error: "Invalid event date",
    }),
    attendanceStartTime: z.coerce.date({
        error: "Invalid attendance start time",
    }),
    attendanceEndTime: z.coerce.date({
        error: "Invalid attendance end time",
    }),
    rewardPoints: z.number().min(0, "Reward points must be at least 0"),
    latitude: z.number(),
    longitude: z.number(),
    radiusMeters: z.number().min(1).optional(),
});

export const fullUpdateEventSchema = createEventSchema.clone();

export const partialUpdateEventSchema = exactOptional(createEventSchema.partial());

export type ParamSchema = z.infer<typeof paramSchema>;
export type CreateEventSchema = z.infer<typeof createEventSchema>;
export type FullUpdateEventSchema = z.infer<typeof fullUpdateEventSchema>;
export type PartialUpdateEventSchema = z.infer<typeof partialUpdateEventSchema>;