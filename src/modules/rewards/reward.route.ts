import { Hono } from "hono";
import { describeRoute, validator } from "hono-openapi";
import * as rewardController from "./reward.controller";
import { adminProviderRewardsQuerySchema, paramSchema, providerParamSchema, querySchema, createRewardSchema, fullUpdateRewardSchema, partialUpdateRewardSchema } from "./reward.schema";
import { requireAuth, requireRole } from "../../middlewares/auth";

const rewardRouter = new Hono();

rewardRouter.get(
    "/point-shop",
    describeRoute({
        summary: "Get Point Shop Catalog",
        description: "Returns in-stock active Point Shop rewards from verified providers, including pickup information required by the resident app.",
        tags: ["Rewards"],
        responses: {
            200: {
                description: "Point Shop catalog retrieved successfully",
            },
        },
    }),
    rewardController.getPointShopCatalog,
);

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
    "/admin/providers/:providerId",
    describeRoute({
        summary: "Get Provider Point Shop Products",
        description: "Admin ONLY. Returns a searchable and paginated provider product catalog. Filter by ACTIVE for products currently listed in Point Shop or INACTIVE for products eligible to be added.",
        tags: ["Rewards"],
        security: [{ bearerAuth: [] }],
        responses: {
            200: { description: "Provider products retrieved successfully" },
            403: { description: "Admin access required" },
            404: { description: "Provider not found" },
        },
    }),
    requireAuth,
    requireRole(["ADMIN"]),
    validator("param", providerParamSchema),
    validator("query", adminProviderRewardsQuerySchema),
    rewardController.getAdminProviderRewards,
);

rewardRouter.get(
    "/admin/point-shop",
    describeRoute({
        summary: "Get Admin Point Shop Products",
        description: "Admin ONLY. Returns the global Point Shop product catalog. ACTIVE products are currently visible to residents; INACTIVE products are eligible to be added.",
        tags: ["Rewards"],
        security: [{ bearerAuth: [] }],
        responses: {
            200: { description: "Point Shop products retrieved successfully" },
            403: { description: "Admin access required" },
        },
    }),
    requireAuth,
    requireRole(["ADMIN"]),
    validator("query", adminProviderRewardsQuerySchema),
    rewardController.getAdminPointShopRewards,
);

rewardRouter.get(
    "/admin/leaderboard",
    describeRoute({
        summary: "Get Leaderboard Prize Configuration",
        description: "Admin ONLY. Returns the active rewards configured for leaderboard positions 1 through 3, including provider identity.",
        tags: ["Rewards"],
        security: [{ bearerAuth: [] }],
        responses: {
            200: { description: "Leaderboard rewards retrieved successfully" },
            403: { description: "Admin access required" },
        },
    }),
    requireAuth,
    requireRole(["ADMIN"]),
    rewardController.getAdminLeaderboardRewards,
);

rewardRouter.get(
    "/provider/me",
    describeRoute({
        summary: "Get Current Provider Products",
        description: "Returns the authenticated provider owner's searchable and paginated Point Shop products, including products awaiting admin activation.",
        tags: ["Rewards"],
        security: [{ bearerAuth: [] }],
        responses: {
            200: { description: "Current provider products retrieved successfully" },
            404: { description: "The current user has not registered a provider" },
        },
    }),
    requireAuth,
    requireRole(["ADMIN", "CITIZEN"]),
    validator("query", adminProviderRewardsQuerySchema),
    rewardController.getMyProviderRewards,
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
