import type { Context, Env, ValidationTargets } from "hono";
import rewardService from "./reward.service";
import type { ParamSchema, QuerySchema, CreateRewardSchema, FullUpdateRewardSchema, PartialUpdateRewardSchema } from "./reward.schema";
import { ApiResponse } from "../../utils/api-response";

type RewardContext = Context<Env, any, {
    in: Pick<ValidationTargets, 'param' | 'json' | 'query'> & {
        param: ParamSchema,
        json: CreateRewardSchema | FullUpdateRewardSchema | PartialUpdateRewardSchema,
        query: QuerySchema,
    };
    out: Pick<ValidationTargets, 'param' | 'json' | 'query'> & {
        param: ParamSchema,
        json: CreateRewardSchema | FullUpdateRewardSchema | PartialUpdateRewardSchema,
        query: QuerySchema,
    };
}>;

export const getAllRewards = async (c: RewardContext) => {
    const { source } = c.req.valid("query") || {};

    const rewards = await rewardService.getAllRewards(c, source);

    return ApiResponse.ok(c, "Rewards retrieved successfully", rewards);
}

export const getPointShopCatalog = async (c: RewardContext) => {
    const rewards = await rewardService.getPointShopCatalog(c);

    return ApiResponse.ok(c, "Point Shop catalog retrieved successfully", rewards);
}

export const getRewardById = async (c: RewardContext) => {
    const { rewardId } = c.req.valid("param");

    const reward = await rewardService.getRewardById(c, rewardId);

    return ApiResponse.ok(c, "Reward retrieved successfully", reward);
}

export const createReward = async (c: RewardContext) => {
    const rewardData = c.req.valid("json");

    const reward = await rewardService.createReward(c, rewardData);

    return ApiResponse.created(c, "Reward created successfully", reward);
}

export const fullUpdateReward = async (c: RewardContext) => {
    const { rewardId } = c.req.valid("param");
    const rewardData = c.req.valid("json");

    const reward = await rewardService.fullUpdateReward(c, rewardId, rewardData);

    return ApiResponse.ok(c, "Reward updated successfully", reward);
}

export const partialUpdateReward = async (c: RewardContext) => {
    const { rewardId } = c.req.valid("param");
    const rewardData = c.req.valid("json");

    const reward = await rewardService.partialUpdateReward(c, rewardId, rewardData);

    return ApiResponse.ok(c, "Reward updated successfully", reward);
}

export const removeReward = async (c: RewardContext) => {
    const { rewardId } = c.req.valid("param");

    await rewardService.removeReward(c, rewardId);

    return ApiResponse.ok(c, "Reward deleted successfully");
}

export default {
    getAllRewards,
    getPointShopCatalog,
    getRewardById,
    createReward,
    fullUpdateReward,
    partialUpdateReward,
    removeReward
};
