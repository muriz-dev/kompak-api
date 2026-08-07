import { Hono } from "hono";
import { describeRoute, validator } from "hono-openapi";
import * as rewardController from "./reward.controller";
import { paramSchema, querySchema, createRewardSchema, fullUpdateRewardSchema, partialUpdateRewardSchema } from "./reward.schema";
import { requireAuth, requireRole } from "../../middlewares/auth";

const rewardRouter = new Hono();

rewardRouter.get(
    "/",
    describeRoute({
        summary: "Get All Rewards",
        description: "Retrieves a catalog of available rewards. Pass `?source=POINT_SHOP` to get items redeemable with points, or `?source=LEADERBOARD` to see prizes reserved for top-ranking citizens.",
        tags: ["Rewards"],
        responses: {
            200: {
                description: "Rewards retrieved successfully",
            },
        },
    }),
    validator("query", querySchema),
    rewardController.getAllRewards,
);

rewardRouter.get(
    "/:rewardId",
    describeRoute({
        summary: "Get Reward by ID",
        description: "Retrieve a reward by its ID.",
        tags: ["Rewards"],
        responses: {
            200: {
                description: "Reward retrieved successfully",
            },
            404: {
                description: "Reward not found",
            },
        },
    }),
    validator("param", paramSchema),
    rewardController.getRewardById,
);

rewardRouter.post(
    "/",
    describeRoute({
        summary: "Create Reward",
        description: "Creates a new reward offering. Accessible by Admins OR by Citizens who own a VERIFIED provider account.",
        tags: ["Rewards"],
        security: [{ bearerAuth: [] }],
        responses: {
            201: {
                description: "Reward created successfully",
            },
            400: {
                description: "Invalid request body",
            },
        },
    }),
    requireAuth,
    requireRole(['ADMIN', 'CITIZEN']),
    validator("json", createRewardSchema),
    rewardController.createReward,
);

rewardRouter.put(
    "/:rewardId",
    describeRoute({
        summary: "Full Update Reward",
        description: "Replaces the entire reward record. Accessible by Admins or the Provider who owns this reward.",
        tags: ["Rewards"],
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: "Reward updated successfully",
            },
            400: {
                description: "Invalid request body",
            },
            404: {
                description: "Reward not found",
            },
        },
    }),
    requireAuth,
    requireRole(['ADMIN', 'CITIZEN']),
    validator("param", paramSchema),
    validator("json", fullUpdateRewardSchema),
    rewardController.fullUpdateReward,
);

rewardRouter.patch(
    "/:rewardId",
    describeRoute({
        summary: "Partial Update Reward",
        description: "Updates specific fields of a reward (e.g., deducting stock). Accessible by Admins or the Provider who owns this reward.",
        tags: ["Rewards"],
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: "Reward updated successfully",
            },
            400: {
                description: "Invalid request body",
            },
            404: {
                description: "Reward not found",
            },
        },
    }),
    requireAuth,
    requireRole(['ADMIN', 'CITIZEN']),
    validator("param", paramSchema),
    validator("json", partialUpdateRewardSchema),
    rewardController.partialUpdateReward,
);

rewardRouter.delete(
    "/:rewardId",
    describeRoute({
        summary: "Remove Reward",
        description: "Admin/Provider: Remove a reward by its ID.",
        tags: ["Rewards"],
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: "Reward deleted successfully",
            },
            404: {
                description: "Reward not found",
            },
        },
    }),
    requireAuth,
    requireRole(['ADMIN', 'CITIZEN']),
    validator("param", paramSchema),
    rewardController.removeReward,
);

export default rewardRouter;
