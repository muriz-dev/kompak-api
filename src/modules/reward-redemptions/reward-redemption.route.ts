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
        description: "Admin ONLY. Retrieves a system-wide list of all reward redemption transactions.",
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
        description: "Retrieves the reward redemption history for the currently logged-in citizen. Useful for showing a 'My Vouchers' or 'My Prizes' screen.",
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
        description: "Admin or Provider ONLY. Retrieves all redemption transactions for rewards offered by a specific provider. Providers use this to see who has claimed their rewards.",
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
        description: "Retrieves the full details of a specific reward redemption transaction, including its current status (e.g., PENDING, COMPLETED, CANCELLED).",
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
        description: "Allows a citizen to spend their accumulated points to redeem a specific reward. The system automatically deducts points and decreases reward stock. The initial status is PENDING.",
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
        description: "Admin or Provider ONLY. Updates the lifecycle status of a redemption. Providers can use this to mark a prize as COMPLETED when the citizen physically claims it at their store.",
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
