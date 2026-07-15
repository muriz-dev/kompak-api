import { Hono } from "hono";
import { describeRoute, validator } from "hono-openapi";
import * as rewardController from "./reward.controller";
import { paramSchema, createRewardSchema, fullUpdateRewardSchema, partialUpdateRewardSchema } from "./reward.schema";
import { requireAuth, requireAdmin } from "../../middlewares/auth";

const rewardRouter = new Hono();

rewardRouter.get(
    "/",
    describeRoute({
        summary: "Get All Rewards",
        description: "Retrieve a list of all rewards in the SGA profile system.",
        tags: ["Rewards"],
        responses: {
            200: {
                description: "Rewards retrieved successfully",
            },
        },
    }),
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
        description: "Admin: Create a new reward.",
        tags: ["Rewards"],
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
    requireAdmin,
    validator("json", createRewardSchema),
    rewardController.createReward,
);

rewardRouter.put(
    "/:rewardId",
    describeRoute({
        summary: "Full Update Reward",
        description: "Admin: Update a reward by its ID (full update).",
        tags: ["Rewards"],
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
    requireAdmin,
    validator("param", paramSchema),
    validator("json", fullUpdateRewardSchema),
    rewardController.fullUpdateReward,
);

rewardRouter.patch(
    "/:rewardId",
    describeRoute({
        summary: "Partial Update Reward",
        description: "Admin: Update a reward by its ID (partial update).",
        tags: ["Rewards"],
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
    requireAdmin,
    validator("param", paramSchema),
    validator("json", partialUpdateRewardSchema),
    rewardController.partialUpdateReward,
);

rewardRouter.delete(
    "/:rewardId",
    describeRoute({
        summary: "Remove Reward",
        description: "Admin: Remove a reward by its ID.",
        tags: ["Rewards"],
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
    requireAdmin,
    validator("param", paramSchema),
    rewardController.removeReward,
);

export default rewardRouter;
