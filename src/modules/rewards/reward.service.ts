import type { Context } from "hono";
import rewardRepository from "./reward.repository";
import type { CreateRewardSchema, FullUpdateRewardSchema, PartialUpdateRewardSchema } from "./reward.schema";
import { ApiError } from "../../utils/api-error";

export const getAllRewards = async (c: Context, source?: "POINT_SHOP" | "LEADERBOARD") => {
    return rewardRepository.getAll(c, source);
}

export const getRewardById = async (c: Context, rewardId: string) => {
    const reward = await rewardRepository.getById(c, rewardId);

    if (!reward) throw ApiError.notFound(`Reward with ID ${rewardId} not found`);

    return reward;
}

export const createReward = async (c: Context, rewardData: CreateRewardSchema) => {
    return rewardRepository.create(c, rewardData);
}

export const fullUpdateReward = async (c: Context, rewardId: string, rewardData: FullUpdateRewardSchema) => {
    await getRewardById(c, rewardId);

    return rewardRepository.fullUpdate(c, rewardId, rewardData);
}

export const partialUpdateReward = async (c: Context, rewardId: string, rewardData: PartialUpdateRewardSchema) => {
    await getRewardById(c, rewardId);

    return rewardRepository.partialUpdate(c, rewardId, rewardData);
}

export const removeReward = async (c: Context, rewardId: string) => {
    await getRewardById(c, rewardId);

    return rewardRepository.remove(c, rewardId);
}

export default {
    getAllRewards,
    getRewardById,
    createReward,
    fullUpdateReward,
    partialUpdateReward,
    removeReward
}