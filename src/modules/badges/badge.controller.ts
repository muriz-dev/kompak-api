import type { Context } from "hono";
import badgeService from "./badge.service";
import { ApiResponse } from "../../utils/api-response";

export const getBadgeDefinitions = async (c: Context) => {
    const data = await badgeService.getBadgeDefinitions(c);

    return ApiResponse.ok(c, "Badge definitions retrieved successfully", data);
};

export const createBadgeDefinition = async (c: Context) => {
    const payload = c.req.valid("json" as never) as any;

    const data = await badgeService.createBadgeDefinition(c, payload);

    return ApiResponse.created(c, "Badge definition created successfully", data);
};

export const getMyBadges = async (c: Context) => {
    const data = await badgeService.getMyBadges(c);

    return ApiResponse.ok(c, "My badges retrieved successfully", data);
};

export const awardSpecialBadge = async (c: Context) => {
    const payload = c.req.valid("json" as never) as any;

    const data = await badgeService.awardSpecialBadge(c, payload);

    return ApiResponse.created(c, "Special badge awarded successfully", data);
};

export default {
    getBadgeDefinitions,
    createBadgeDefinition,
    getMyBadges,
    awardSpecialBadge
};
