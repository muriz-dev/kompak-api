import type { Context } from "hono";
import badgeRepository from "./badge.repository";
import { ApiError } from "../../utils/api-error";
import type { CreateBadgeDefinitionInput, AwardSpecialBadgeInput } from "./badge.schema";

export const getBadgeDefinitions = async (c: Context) => {
    return badgeRepository.getBadgeDefinitions(c);
};

export const createBadgeDefinition = async (c: Context, data: CreateBadgeDefinitionInput) => {
    const jwtPayload = c.get("jwtPayload") as any;
    
    // Only Admin is allowed, which is guarded by requireRole middleware
    const badgeId = await badgeRepository.createBadgeDefinition(c, jwtPayload.id, data);
    
    return { badgeId };
};

export const getMyBadges = async (c: Context) => {
    const jwtPayload = c.get("jwtPayload") as any;
    return badgeRepository.getUserBadges(c, jwtPayload.id);
};

export const awardSpecialBadge = async (c: Context, data: AwardSpecialBadgeInput) => {
    const jwtPayload = c.get("jwtPayload") as any;

    const user = await badgeRepository.checkUserExists(c, data.userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const badgeDef = await badgeRepository.getBadgeDefinitionById(c, data.badgeDefinitionId);
    if (!badgeDef) {
        throw new ApiError(404, "Badge definition not found");
    }

    if (badgeDef.category !== "SPECIAL") {
        throw new ApiError(400, "Only SPECIAL badges can be awarded manually by administrators");
    }

    const awardId = await badgeRepository.awardBadge(c, jwtPayload.id, data.userId, data.badgeDefinitionId, data.reason);

    return { awardId };
};

export default {
    getBadgeDefinitions,
    createBadgeDefinition,
    getMyBadges,
    awardSpecialBadge
};
