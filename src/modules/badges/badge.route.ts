import { Hono } from "hono";
import { describeRoute, validator } from "hono-openapi";
import badgeController from "./badge.controller";
import { createBadgeDefinitionSchema, awardSpecialBadgeSchema } from "./badge.schema";
import { requireAuth, requireRole } from "../../middlewares/auth";

const router = new Hono();

router.get(
    "/",
    describeRoute({
        summary: "Get Badge Definitions",
        description: "Retrieve all available badge definitions.",
        tags: ["Badges"],
        security: [{ bearerAuth: [] }],
        responses: {
            200: { description: "Badge definitions retrieved successfully" },
        },
    }),
    requireAuth,
    badgeController.getBadgeDefinitions
);

router.post(
    "/",
    describeRoute({
        summary: "Create Badge Definition",
        description: "Create a new badge definition (Admin only).",
        tags: ["Badges"],
        security: [{ bearerAuth: [] }],
        responses: {
            201: { description: "Badge definition created successfully" },
            403: { description: "Forbidden" },
        },
    }),
    requireAuth,
    requireRole(["ADMIN"]),
    validator("json", createBadgeDefinitionSchema),
    badgeController.createBadgeDefinition
);

router.get(
    "/me",
    describeRoute({
        summary: "Get My Badges",
        description: "Retrieve badges awarded to the currently logged-in user.",
        tags: ["Badges"],
        security: [{ bearerAuth: [] }],
        responses: {
            200: { description: "My badges retrieved successfully" },
        },
    }),
    requireAuth,
    badgeController.getMyBadges
);

router.post(
    "/award",
    describeRoute({
        summary: "Award Special Badge",
        description: "Manually award a SPECIAL category badge to a user (Admin only).",
        tags: ["Badges"],
        security: [{ bearerAuth: [] }],
        responses: {
            201: { description: "Badge awarded successfully" },
            400: { description: "Badge is not a SPECIAL category" },
            403: { description: "Forbidden" },
            404: { description: "User or Badge not found" },
        },
    }),
    requireAuth,
    requireRole(["ADMIN"]),
    validator("json", awardSpecialBadgeSchema),
    badgeController.awardSpecialBadge
);

export default router;
