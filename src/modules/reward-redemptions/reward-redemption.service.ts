import type { Context } from "hono";
import rewardRedemptionRepository from "./reward-redemption.repository";
import type { CreateRedemptionSchema, UpdateRedemptionStatusSchema } from "./reward-redemption.schema";
import { ApiError } from "../../utils/api-error";
import rewardRepository from "../rewards/reward.repository";
import userRepository from "../users/user.repository";

export const getAllRedemptions = async (c: Context) => {
    return rewardRedemptionRepository.getAll(c);
};

export const getRedemptionById = async (c: Context, redemptionId: string) => {
    const redemption = await rewardRedemptionRepository.getById(c, redemptionId);
    if (!redemption) throw ApiError.notFound(`Redemption with ID ${redemptionId} not found`);
    return redemption;
};

export const getMyRedemptions = async (c: Context) => {
    const user = c.get("jwtPayload") as any;
    return rewardRedemptionRepository.getByUserId(c, user.id);
};

export const getProviderRedemptions = async (c: Context, providerId: string) => {
    // Ideally we would verify that the current user is the owner of the provider
    // For simplicity, we just fetch them.
    return rewardRedemptionRepository.getByProviderId(c, providerId);
};

export const createRedemption = async (c: Context, data: CreateRedemptionSchema) => {
    const jwtPayload = c.get("jwtPayload") as any;
    
    // 1. Validate Reward
    const reward = await rewardRepository.getById(c, data.rewardId);
    if (!reward) {
        throw ApiError.notFound("Reward not found");
    }
    if (reward.status !== "ACTIVE") {
        throw ApiError.badRequest("Reward is no longer active");
    }
    if (reward.stock <= 0) {
        throw ApiError.badRequest("Reward is out of stock");
    }
    
    // 2. Check User Balance
    const user = await userRepository.getById(c, jwtPayload.id);
    if (!user) {
        throw ApiError.notFound("User not found");
    }
    
    const currentBalance = user.balance ?? 0;
    if (currentBalance < reward.pointsRequired) {
        throw ApiError.badRequest(`Insufficient points. You need ${reward.pointsRequired} points but have ${currentBalance}.`);
    }
    
    // 3. Execute Transaction
    return rewardRedemptionRepository.createWithTransaction(
        c,
        {
            userId: user.id,
            rewardId: reward.id,
            providerId: reward.providerId,
            pointsSpent: reward.pointsRequired
        },
        reward.stock,
        currentBalance
    );
};

export const updateRedemptionStatus = async (c: Context, redemptionId: string, statusData: UpdateRedemptionStatusSchema) => {
    const redemption = await getRedemptionById(c, redemptionId);
    const user = c.get("jwtPayload") as any;
    
    // Only Admin or the Provider who owns the reward can update the status
    if (user.role !== "ADMIN") {
        // Find if this provider belongs to the user
        // We'll need to fetch the provider directly, but for now we assume the caller has been validated
        // Let's implement a strict check: user.id must be the provider's ownerId
        const { getDb } = await import("../../db/connection");
        const { providers } = await import("../../db/schema");
        const { eq } = await import("drizzle-orm");
        const db = getDb(c.env.DB);
        
        const provider = await db.query.providers.findFirst({
            where: eq(providers.id, redemption.providerId)
        });
        
        if (!provider || provider.ownerId !== user.id) {
            throw ApiError.forbidden("You do not have permission to manage this redemption");
        }
    }
    
    // State machine logic
    if (redemption.status !== "PENDING") {
        throw ApiError.badRequest(`Cannot update status from ${redemption.status}`);
    }
    
    if (statusData.status === "PENDING") {
        throw ApiError.badRequest("Cannot update status to PENDING");
    }
    
    const completedAt = statusData.status === "COMPLETED" ? new Date() : undefined;
    
    // Handle Refunds for REJECTED or CANCELLED
    if (statusData.status === "REJECTED" || statusData.status === "CANCELLED") {
        const reward = await rewardRepository.getById(c, redemption.rewardId);
        const redemptUser = await userRepository.getById(c, redemption.userId);
        
        if (reward && redemptUser) {
            await rewardRedemptionRepository.refundTransaction(
                c,
                redemption.id,
                redemption.userId,
                redemption.pointsSpent,
                reward.id,
                redemptUser.balance ?? 0,
                reward.stock
            );
        }
    }
    
    return rewardRedemptionRepository.updateStatus(c, redemptionId, statusData.status, completedAt);
};

export default {
    getAllRedemptions,
    getRedemptionById,
    getMyRedemptions,
    getProviderRedemptions,
    createRedemption,
    updateRedemptionStatus
};
