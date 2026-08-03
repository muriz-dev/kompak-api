import { Hono } from "hono";
import { describeRoute, validator } from "hono-openapi";
import * as controller from "./reward-redemption.controller";
import { paramSchema, createRedemptionSchema, updateRedemptionStatusSchema } from "./reward-redemption.schema";
import { requireAuth, requireRole } from "../../middlewares/auth";
import { z } from "zod";

const rewardRedemptionRouter = new Hono();

rewardRedemptionRouter.get(
    "/",
    describeRoute({
        summary: "Get All Redemptions",
        description: "Admin: Retrieve a list of all reward redemptions.",
        tags: ["Reward Redemptions"],
        security: [{ bearerAuth: [] }],
        responses: {
            200: { description: "Redemptions retrieved successfully" },
        },
    }),
    requireAuth,
    requireRole(["ADMIN"]),
    controller.getAllRedemptions,
);

rewardRedemptionRouter.get(
    "/me",
    describeRoute({
        summary: "Get My Redemptions",
        description: "Retrieve all redemptions made by the authenticated user.",
        tags: ["Reward Redemptions"],
        security: [{ bearerAuth: [] }],
        responses: {
            200: { description: "Redemptions retrieved successfully" },
        },
    }),
    requireAuth,
    controller.getMyRedemptions,
);

rewardRedemptionRouter.get(
    "/provider/:providerId",
    describeRoute({
        summary: "Get Provider Redemptions",
        description: "Admin/Provider: Retrieve all redemptions for a specific provider.",
        tags: ["Reward Redemptions"],
        security: [{ bearerAuth: [] }],
        responses: {
            200: { description: "Redemptions retrieved successfully" },
        },
    }),
    requireAuth,
    requireRole(["ADMIN", "CITIZEN"]),
    validator("param", z.object({ providerId: z.uuid("Invalid provider ID") })),
    controller.getProviderRedemptions,
);

rewardRedemptionRouter.get(
    "/:redemptionId",
    describeRoute({
        summary: "Get Redemption by ID",
        description: "Retrieve a specific redemption by its ID.",
        tags: ["Reward Redemptions"],
        security: [{ bearerAuth: [] }],
        responses: {
            200: { description: "Redemption retrieved successfully" },
            404: { description: "Redemption not found" },
        },
    }),
    requireAuth,
    validator("param", paramSchema),
    controller.getRedemptionById,
);

rewardRedemptionRouter.post(
    "/",
    describeRoute({
        summary: "Create Reward Redemption",
        description: "Redeem a reward using user points.",
        tags: ["Reward Redemptions"],
        security: [{ bearerAuth: [] }],
        responses: {
            201: { description: "Redemption created successfully" },
            400: { description: "Insufficient points or out of stock" },
        },
    }),
    requireAuth,
    validator("json", createRedemptionSchema),
    controller.createRedemption,
);

rewardRedemptionRouter.patch(
    "/:redemptionId/status",
    describeRoute({
        summary: "Update Redemption Status",
        description: "Admin/Provider: Update the status of a redemption (e.g. approve or reject).",
        tags: ["Reward Redemptions"],
        security: [{ bearerAuth: [] }],
        responses: {
            200: { description: "Status updated successfully" },
            400: { description: "Invalid state transition" },
            404: { description: "Redemption not found" },
        },
    }),
    requireAuth,
    requireRole(["ADMIN", "CITIZEN"]),
    validator("param", paramSchema),
    validator("json", updateRedemptionStatusSchema),
    controller.updateRedemptionStatus,
);

export default rewardRedemptionRouter;
