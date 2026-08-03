import type { Context } from "hono";
import rewardRedemptionService from "./reward-redemption.service";

export const getAllRedemptions = async (c: Context) => {
    const data = await rewardRedemptionService.getAllRedemptions(c);
    return c.json({
        success: true,
        message: "Reward redemptions retrieved successfully",
        data
    });
};

export const getRedemptionById = async (c: Context) => {
    const { redemptionId } = c.req.valid("param" as never) as any;
    const data = await rewardRedemptionService.getRedemptionById(c, redemptionId);
    return c.json({
        success: true,
        message: "Reward redemption retrieved successfully",
        data
    });
};

export const getMyRedemptions = async (c: Context) => {
    const data = await rewardRedemptionService.getMyRedemptions(c);
    return c.json({
        success: true,
        message: "User redemptions retrieved successfully",
        data
    });
};

export const getProviderRedemptions = async (c: Context) => {
    const { providerId } = c.req.valid("param" as never) as any;
    const data = await rewardRedemptionService.getProviderRedemptions(c, providerId);
    return c.json({
        success: true,
        message: "Provider redemptions retrieved successfully",
        data
    });
};

export const createRedemption = async (c: Context) => {
    try {
        const payload = c.req.valid("json" as never) as any;
        const data = await rewardRedemptionService.createRedemption(c, payload);
        return c.json({
            success: true,
            message: "Reward redemption created successfully",
            data
        }, 201);
    } catch (error) {
        console.error("CREATE REDEMPTION ERROR:", error);
        throw error;
    }
};

export const updateRedemptionStatus = async (c: Context) => {
    const { redemptionId } = c.req.valid("param" as never) as any;
    const payload = c.req.valid("json" as never) as any;
    
    const data = await rewardRedemptionService.updateRedemptionStatus(c, redemptionId, payload);
    return c.json({
        success: true,
        message: "Reward redemption status updated successfully",
        data
    });
};
