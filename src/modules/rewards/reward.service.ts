import type { Context } from "hono";
import rewardRepository from "./reward.repository";
import type { CreateRewardSchema, FullUpdateRewardSchema, PartialUpdateRewardSchema } from "./reward.schema";
import { ApiError } from "../../utils/api-error";
import providerRepository from "../providers/provider.repository";

export const getAllRewards = async (c: Context, source?: "POINT_SHOP" | "LEADERBOARD") => {
    return rewardRepository.getAll(c, source);
}

export const getPointShopCatalog = async (c: Context) => {
    return rewardRepository.getPointShopCatalog(c);
}

export const getRewardById = async (c: Context, rewardId: string) => {
    const reward = await rewardRepository.getById(c, rewardId);

    if (!reward) throw ApiError.notFound(`Reward with ID ${rewardId} not found`);

    return reward;
}

export const createReward = async (c: Context, rewardData: CreateRewardSchema) => {
    const user = c.get("jwtPayload") as any;

    if (user.role !== "ADMIN") {
        const provider = await providerRepository.getById(c, rewardData.providerId);
        if (!provider || provider.ownerId !== user.id) {
            throw ApiError.forbidden("You do not have permission to manage this provider's rewards");
        }
        if (provider.status !== "VERIFIED") {
            throw ApiError.forbidden("Your provider account must be verified to offer rewards");
        }
    }

    return rewardRepository.create(c, rewardData);
}

export const fullUpdateReward = async (c: Context, rewardId: string, rewardData: FullUpdateRewardSchema) => {
    const reward = await getRewardById(c, rewardId);
    const user = c.get("jwtPayload") as any;

    if (user.role !== "ADMIN") {
        const provider = await providerRepository.getById(c, reward.providerId);
        if (!provider || provider.ownerId !== user.id) {
            throw ApiError.forbidden("You do not have permission to modify this reward");
        }
    }

    return rewardRepository.fullUpdate(c, rewardId, rewardData);
}

export const partialUpdateReward = async (c: Context, rewardId: string, rewardData: PartialUpdateRewardSchema) => {
    const reward = await getRewardById(c, rewardId);
    const user = c.get("jwtPayload") as any;

    if (user.role !== "ADMIN") {
        const provider = await providerRepository.getById(c, reward.providerId);
        if (!provider || provider.ownerId !== user.id) {
            throw ApiError.forbidden("You do not have permission to modify this reward");
        }
    }

    return rewardRepository.partialUpdate(c, rewardId, rewardData);
}

export const removeReward = async (c: Context, rewardId: string) => {
    const reward = await getRewardById(c, rewardId);
    const user = c.get("jwtPayload") as any;

    if (user.role !== "ADMIN") {
        const provider = await providerRepository.getById(c, reward.providerId);
        if (!provider || provider.ownerId !== user.id) {
            throw ApiError.forbidden("You do not have permission to delete this reward");
        }
    }

    return rewardRepository.remove(c, rewardId);
}

export default {
    getAllRewards,
    getPointShopCatalog,
    getRewardById,
    createReward,
    fullUpdateReward,
    partialUpdateReward,
    removeReward
}
