import type { Context, Env, ValidationTargets } from "hono";
import rewardService from "./reward.service";
import type { AdminProviderRewardsQuerySchema, ParamSchema, ProviderParamSchema, QuerySchema, CreateRewardSchema, FullUpdateRewardSchema, PartialUpdateRewardSchema } from "./reward.schema";
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

type AdminProviderRewardsContext = Context<Env, any, {
    in: Pick<ValidationTargets, 'param' | 'query'> & {
        param: ProviderParamSchema,
        query: AdminProviderRewardsQuerySchema,
    };
    out: Pick<ValidationTargets, 'param' | 'query'> & {
        param: ProviderParamSchema,
        query: AdminProviderRewardsQuerySchema,
    };
}>;

type AdminPointShopContext = Context<Env, any, {
    in: Pick<ValidationTargets, 'query'> & {
        query: AdminProviderRewardsQuerySchema,
    };
    out: Pick<ValidationTargets, 'query'> & {
        query: AdminProviderRewardsQuerySchema,
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

export const getAdminProviderRewards = async (c: AdminProviderRewardsContext) => {
    const { providerId } = c.req.valid("param");
    const query = c.req.valid("query");
    const rewards = await rewardService.getAdminProviderRewards(c, providerId, query);

    return ApiResponse.ok(c, "Admin provider rewards retrieved successfully", rewards);
}

export const getMyProviderRewards = async (c: AdminPointShopContext) => {
    const query = c.req.valid("query");
    const rewards = await rewardService.getMyProviderRewards(c, query);

    return ApiResponse.ok(c, "Current provider rewards retrieved successfully", rewards);
}

export const getAdminPointShopRewards = async (c: AdminPointShopContext) => {
    const query = c.req.valid("query");
    const rewards = await rewardService.getAdminProviderRewards(c, query.providerId, query);

    return ApiResponse.ok(c, "Admin Point Shop rewards retrieved successfully", rewards);
}

export const getAdminLeaderboardRewards = async (c: Context) => {
    const rewards = await rewardService.getAdminLeaderboardRewards(c);
    return ApiResponse.ok(c, "Admin leaderboard rewards retrieved successfully", rewards);
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
    getAdminProviderRewards,
    getMyProviderRewards,
    getAdminPointShopRewards,
    getAdminLeaderboardRewards,
    getRewardById,
    createReward,
    fullUpdateReward,
    partialUpdateReward,
    removeReward
};
