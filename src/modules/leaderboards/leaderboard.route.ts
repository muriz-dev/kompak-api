import { Hono } from "hono";
import { describeRoute, validator } from "hono-openapi";
import leaderboardController from "./leaderboard.controller";
import { getLeaderboardQuerySchema, distributeLeaderboardSchema } from "./leaderboard.schema";
import { requireAuth, requireRole } from "../../middlewares/auth";

const router = new Hono();

router.get(
    "/",
    describeRoute({
        summary: "Get Leaderboard",
        description: "Fetches the current community leaderboard for active citizens, including totals, configured Top-3 rewards, and the authenticated citizen's rank.",
        tags: ["Leaderboards"],
        security: [{ bearerAuth: [] }],
        responses: {
            200: { description: "Leaderboard retrieved successfully" },
            401: { description: "Unauthorized" },
        },
    }),
    requireAuth,
    validator("query", getLeaderboardQuerySchema),
    leaderboardController.getLeaderboard
);

router.post(
    "/distribute",
    describeRoute({
        summary: "Distribute Leaderboard Rewards & Badges",
        description: "Admin ONLY. Automatically processes the end-of-month leaderboard. It awards badges and rewards to the Top 3 ranking citizens for the specified period, and then resets all `leaderboardPoints` back to 0 for the next period.",
        tags: ["Leaderboards"],
        security: [{ bearerAuth: [] }],
        responses: {
            200: { description: "Distribution successful" },
            400: { description: "Invalid period" },
            409: { description: "Period has already been distributed" },
            403: { description: "Forbidden" },
        },
    }),
    requireAuth,
    requireRole(["ADMIN"]),
    validator("json", distributeLeaderboardSchema),
    leaderboardController.distributeLeaderboard
);

export default router;
