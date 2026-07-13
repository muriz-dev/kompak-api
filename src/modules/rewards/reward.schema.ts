import { z, exactOptional } from "zod";

export const paramSchema = z.object({
    rewardId: z.uuid("Invalid reward ID"),
});

export const createRewardSchema = z.object({
    name: z.string().min(1, "Reward name is required"),
    pointsRequired: z.number().min(0, "Points required cannot be negative"),
    stock: z.number().min(0, "Stock cannot be negative").optional(),
    category: z.string().optional(),
});

export const fullUpdateRewardSchema = createRewardSchema.clone();

export const partialUpdateRewardSchema = exactOptional(createRewardSchema.partial());

export type ParamSchema = z.infer<typeof paramSchema>;
export type CreateRewardSchema = z.infer<typeof createRewardSchema>;
export type FullUpdateRewardSchema = z.infer<typeof fullUpdateRewardSchema>;
export type PartialUpdateRewardSchema = z.infer<typeof partialUpdateRewardSchema>;