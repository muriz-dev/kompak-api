import { z, exactOptional } from "zod";

export const paramSchema = z.object({
    rewardId: z.uuid("Invalid reward ID"),
});

export const querySchema = z.object({
    source: z.enum(["POINT_SHOP", "LEADERBOARD"]).optional(),
});

export const createRewardSchema = z.object({
    name: z.string().trim().min(1, "Reward name is required").max(200),
    description: z.string().trim().max(5000).optional(),
    pointsRequired: z.number().int().min(0, "Points required cannot be negative"),
    stock: z.number().int().min(0, "Stock cannot be negative").optional(),
    isFeatured: z.boolean().optional(),
    validityDays: z.number().int().min(1).max(365).optional(),
    type: z.enum(["VOUCHER", "PRODUCT", "SERVICE", "OTHER"]),
    source: z.enum(["POINT_SHOP", "LEADERBOARD"]),
    providerId: z.uuid("Invalid provider ID"),
    imageUrl: z.url("Invalid reward image URL").optional(),
});

export const fullUpdateRewardSchema = createRewardSchema.clone();

export const partialUpdateRewardSchema = exactOptional(createRewardSchema.partial());

export type ParamSchema = z.infer<typeof paramSchema>;
export type CreateRewardSchema = z.infer<typeof createRewardSchema>;
export type FullUpdateRewardSchema = z.infer<typeof fullUpdateRewardSchema>;
export type PartialUpdateRewardSchema = z.infer<typeof partialUpdateRewardSchema>;
export type QuerySchema = z.infer<typeof querySchema>;
