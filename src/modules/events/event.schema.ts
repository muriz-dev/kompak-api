import { z, exactOptional } from "zod";

export const paramSchema = z.object({
    eventId: z.uuid("Invalid event ID"),
});

export const querySchema = z.object({
    timeframe: z.enum(["upcoming", "ongoing"]).optional(),
});

export const eventStatusSchema = z.enum(["DRAFT", "PUBLISHED", "CLOSED", "CANCELLED"]);

export const adminQuerySchema = z.object({
    status: eventStatusSchema.optional(),
});

const eventFieldsSchema = z.object({
    title: z.string().trim().min(1, "Title is required").max(200, "Title must not exceed 200 characters"),
    description: z.string().trim().min(1, "Description is required").max(5000, "Description must not exceed 5000 characters"),
    eventDate: z.coerce.date({
        error: "Invalid event date",
    }),
    attendanceStartTime: z.coerce.date({
        error: "Invalid attendance start time",
    }),
    attendanceEndTime: z.coerce.date({
        error: "Invalid attendance end time",
    }),
    rewardPoints: z.number().int("Reward points must be a whole number").min(0, "Reward points must be at least 0"),
    latitude: z.number().min(-90, "Latitude must be at least -90").max(90, "Latitude must not exceed 90"),
    longitude: z.number().min(-180, "Longitude must be at least -180").max(180, "Longitude must not exceed 180"),
    radiusMeters: z.number().int("Radius must be a whole number").min(1).max(1000, "Radius must not exceed 1000 meters").optional(),
    bannerUrl: z.url("Invalid banner URL").optional(),
});

const validateSchedule = (
    data: { attendanceStartTime: Date; attendanceEndTime: Date },
    ctx: z.RefinementCtx,
) => {
    if (data.attendanceEndTime <= data.attendanceStartTime) {
        ctx.addIssue({
            code: "custom",
            path: ["attendanceEndTime"],
            message: "Attendance end time must be after start time",
        });
    }
};

export const createEventSchema = eventFieldsSchema
    .extend({
        status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
    })
    .superRefine(validateSchedule);

export const fullUpdateEventSchema = eventFieldsSchema.superRefine(validateSchedule);

export const partialUpdateEventSchema = exactOptional(
    eventFieldsSchema.partial().extend({
        status: eventStatusSchema.optional(),
    })
);

export type ParamSchema = z.infer<typeof paramSchema>;
export type CreateEventSchema = z.infer<typeof createEventSchema>;
export type FullUpdateEventSchema = z.infer<typeof fullUpdateEventSchema>;
export type PartialUpdateEventSchema = z.infer<typeof partialUpdateEventSchema>;
export type QuerySchema = z.infer<typeof querySchema>;
export type AdminQuerySchema = z.infer<typeof adminQuerySchema>;
