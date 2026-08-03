import type { Context } from "hono";
import badgeService from "./badge.service";

export const getBadgeDefinitions = async (c: Context) => {
    const data = await badgeService.getBadgeDefinitions(c);
    return c.json({
        success: true,
        message: "Badge definitions retrieved successfully",
        data
    });
};

export const createBadgeDefinition = async (c: Context) => {
    const payload = c.req.valid("json" as never) as any;
    const data = await badgeService.createBadgeDefinition(c, payload);
    return c.json({
        success: true,
        message: "Badge definition created successfully",
        data
    }, 201);
};

export const getMyBadges = async (c: Context) => {
    const data = await badgeService.getMyBadges(c);
    return c.json({
        success: true,
        message: "My badges retrieved successfully",
        data
    });
};

export const awardSpecialBadge = async (c: Context) => {
    const payload = c.req.valid("json" as never) as any;
    const data = await badgeService.awardSpecialBadge(c, payload);
    return c.json({
        success: true,
        message: "Special badge awarded successfully",
        data
    }, 201);
};

export default {
    getBadgeDefinitions,
    createBadgeDefinition,
    getMyBadges,
    awardSpecialBadge
};
