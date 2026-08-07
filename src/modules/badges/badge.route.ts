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
        description: "Retrieves all available badge definitions in the system. Use this to render a 'Badge Catalog' or 'Achievements Guide' for citizens.",
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
        description: "Admin ONLY. Defines a new badge (e.g., 'First Blood', 'Top Contributor').",
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
        description: "Retrieves the list of badges currently owned by the logged-in citizen. Ideal for displaying on the user profile.",
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
        description: "Admin ONLY. Manually grants a badge with the 'SPECIAL' category to a specific user (e.g., 'Hero of the Month').",
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
