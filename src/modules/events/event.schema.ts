import { z, exactOptional } from "zod";

export const paramSchema = z.object({
    eventId: z.uuid("Invalid event ID"),
});

export const createEventSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    eventDate: z.coerce.date({
        error: "Invalid event date",
    }),
    rewardPoints: z.number().min(1, "Reward points is required"),
});

export const fullUpdateEventSchema = createEventSchema.clone();

export const partialUpdateEventSchema = exactOptional(createEventSchema.partial());

export type ParamSchema = z.infer<typeof paramSchema>;
export type CreateEventSchema = z.infer<typeof createEventSchema>;
export type FullUpdateEventSchema = z.infer<typeof fullUpdateEventSchema>;
export type PartialUpdateEventSchema = z.infer<typeof partialUpdateEventSchema>;