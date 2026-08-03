import { z } from "zod";
import { REDEMPTION_STATUS } from "../../db/schema";

export const paramSchema = z.object({
    redemptionId: z.uuid("Invalid redemption ID"),
});

export const createRedemptionSchema = z.object({
    rewardId: z.uuid("Invalid reward ID"),
});

export const updateRedemptionStatusSchema = z.object({
    status: z.enum(REDEMPTION_STATUS, "Status is required and must be valid"),
});

export type ParamSchema = z.infer<typeof paramSchema>;
export type CreateRedemptionSchema = z.infer<typeof createRedemptionSchema>;
export type UpdateRedemptionStatusSchema = z.infer<typeof updateRedemptionStatusSchema>;
