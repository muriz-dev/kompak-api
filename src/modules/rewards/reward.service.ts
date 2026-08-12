import type { Context } from "hono";
import rewardRepository from "./reward.repository";
import type { AdminProviderRewardsQuerySchema, CreateRewardSchema, FullUpdateRewardSchema, PartialUpdateRewardSchema } from "./reward.schema";
import { ApiError } from "../../utils/api-error";
import providerRepository from "../providers/provider.repository";

export const getAllRewards = async (c: Context, source?: "POINT_SHOP" | "LEADERBOARD") => {
    return rewardRepository.getAll(c, source);
}

export const getPointShopCatalog = async (c: Context) => {
    return rewardRepository.getPointShopCatalog(c);
}

export const getAdminProviderRewards = async (
    c: Context,
    providerId: string | undefined,
    query: AdminProviderRewardsQuerySchema,
) => {
    if (providerId) {
        const provider = await providerRepository.getById(c, providerId);
        if (!provider) throw ApiError.notFound(`Provider with ID ${providerId} not found`);
    }
    return rewardRepository.getAdminProviderPage(c, providerId, query);
};

export const getMyProviderRewards = async (
    c: Context,
    query: AdminProviderRewardsQuerySchema,
) => {
    const user = c.get("jwtPayload") as any;
    const provider = await providerRepository.getByOwnerId(c, user.id);
    if (!provider) throw ApiError.notFound("You have not registered a provider account");

    return rewardRepository.getAdminProviderPage(c, provider.id, query);
};

export const getAdminLeaderboardRewards = async (c: Context) =>
    rewardRepository.getAdminLeaderboardRewards(c);

const validateLeaderboardPlacement = async (
    c: Context,
    reward: {
        source: "POINT_SHOP" | "LEADERBOARD";
        status: "ACTIVE" | "INACTIVE";
        leaderboardPosition?: number | null;
    },
    rewardId?: string,
) => {
    if (reward.source === "POINT_SHOP") {
        if (reward.leaderboardPosition != null) {
            throw ApiError.badRequest("Point Shop rewards cannot have a leaderboard position");
        }
        return;
    }
    if (reward.leaderboardPosition == null) {
        throw ApiError.badRequest("Leaderboard position is required for leaderboard rewards");
    }
    if (reward.status === "ACTIVE") {
        const occupied = await rewardRepository.getActiveLeaderboardRewardAtPosition(
            c,
            reward.leaderboardPosition,
            rewardId,
        );
        if (occupied) {
            throw ApiError.conflict(`Leaderboard position ${reward.leaderboardPosition} already has an active reward`);
        }
    }
};

export const getRewardById = async (c: Context, rewardId: string) => {
    const reward = await rewardRepository.getById(c, rewardId);

    if (!reward) throw ApiError.notFound(`Reward with ID ${rewardId} not found`);

    return reward;
}

export const createReward = async (c: Context, rewardData: CreateRewardSchema) => {
    const user = c.get("jwtPayload") as any;

    if (user.role !== "ADMIN" && rewardData.source === "LEADERBOARD") {
        throw ApiError.forbidden("Only admins can configure leaderboard rewards");
    }

    if (user.role !== "ADMIN") {
        const provider = await providerRepository.getById(c, rewardData.providerId);
        if (!provider || provider.ownerId !== user.id) {
            throw ApiError.forbidden("You do not have permission to manage this provider's rewards");
        }
        if (provider.status !== "VERIFIED") {
            throw ApiError.forbidden("Your provider account must be verified to offer rewards");
        }
    }

    const status = user.role === "ADMIN" ? "ACTIVE" : "INACTIVE";
    await validateLeaderboardPlacement(c, { ...rewardData, status });
    return rewardRepository.create(c, {
        ...rewardData,
        status,
    });
}

export const fullUpdateReward = async (c: Context, rewardId: string, rewardData: FullUpdateRewardSchema) => {
    const reward = await getRewardById(c, rewardId);
    const user = c.get("jwtPayload") as any;

    if (user.role !== "ADMIN") {
        const provider = await providerRepository.getById(c, reward.providerId);
        if (!provider || provider.ownerId !== user.id) {
            throw ApiError.forbidden("You do not have permission to modify this reward");
        }
        if (rewardData.source !== "POINT_SHOP" || reward.source !== "POINT_SHOP") {
            throw ApiError.forbidden("Only admins can configure leaderboard rewards");
        }
    }

    await validateLeaderboardPlacement(c, {
        ...rewardData,
        status: reward.status,
    }, rewardId);

    return user.role === "ADMIN"
        ? rewardRepository.fullUpdate(c, rewardId, rewardData)
        : rewardRepository.partialUpdate(c, rewardId, {
            ...rewardData,
            status: "INACTIVE",
        });
}

export const partialUpdateReward = async (c: Context, rewardId: string, rewardData: PartialUpdateRewardSchema) => {
    const reward = await getRewardById(c, rewardId);
    const user = c.get("jwtPayload") as any;

    if (user.role !== "ADMIN") {
        const provider = await providerRepository.getById(c, reward.providerId);
        if (!provider || provider.ownerId !== user.id) {
            throw ApiError.forbidden("You do not have permission to modify this reward");
        }
        if (rewardData.status !== undefined) {
            throw ApiError.forbidden("Only admins can change Point Shop visibility");
        }
        if (rewardData.source !== undefined || rewardData.leaderboardPosition !== undefined) {
            throw ApiError.forbidden("Only admins can configure leaderboard rewards");
        }
    }


    await validateLeaderboardPlacement(c, {
        source: rewardData.source ?? reward.source,
        status: rewardData.status ?? reward.status,
        leaderboardPosition: rewardData.leaderboardPosition ?? reward.leaderboardPosition,
    }, rewardId);

    return rewardRepository.partialUpdate(c, rewardId, user.role === "ADMIN"
        ? rewardData
        : { ...rewardData, status: "INACTIVE" });
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
    getAdminProviderRewards,
    getMyProviderRewards,
    getAdminLeaderboardRewards,
    getRewardById,
    createReward,
    fullUpdateReward,
    partialUpdateReward,
    removeReward
}
