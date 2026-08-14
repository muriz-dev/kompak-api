import type { Context } from "hono";
import rewardRedemptionService from "./reward-redemption.service";
import { ApiResponse } from "../../utils/api-response";

export const getAllRedemptions = async (c: Context) => {
    const data = await rewardRedemptionService.getAllRedemptions(c);

    return ApiResponse.ok(c, "Reward redemptions retrieved successfully", data);
};

export const getRedemptionById = async (c: Context) => {
    const { redemptionId } = c.req.valid("param" as never) as any;

    const data = await rewardRedemptionService.getRedemptionById(c, redemptionId);

    return ApiResponse.ok(c, "Reward redemption retrieved successfully", data);
};

export const getMyRedemptions = async (c: Context) => {
    const data = await rewardRedemptionService.getMyRedemptions(c);

    return ApiResponse.ok(c, "My reward redemptions retrieved successfully", data);
};

export const getProviderRedemptions = async (c: Context) => {
    const { providerId } = c.req.valid("param" as never) as any;

    const data = await rewardRedemptionService.getProviderRedemptions(c, providerId);

    return ApiResponse.ok(c, "Provider redemptions retrieved successfully", data);
};

export const createRedemption = async (c: Context) => {
    try {
        const payload = c.req.valid("json" as never) as any;
        const data = await rewardRedemptionService.createRedemption(c, payload);

        return ApiResponse.created(c, "Reward redemption created successfully", data);

    } catch (error) {
        console.error("CREATE REDEMPTION ERROR:", error);
        throw error;
    }
};

export const updateRedemptionStatus = async (c: Context) => {
    const { redemptionId } = c.req.valid("param" as never) as any;
    const payload = c.req.valid("json" as never) as any;

    const data = await rewardRedemptionService.updateRedemptionStatus(c, redemptionId, payload);

    return ApiResponse.ok(c, "Reward redemption status updated successfully", data);
};

export const claimRedemption = async (c: Context) => {
    const payload = c.req.valid("json" as never) as any;
    const data = await rewardRedemptionService.claimRedemption(c, payload);

    return ApiResponse.ok(c, "Reward redemption completed successfully", data);
};
