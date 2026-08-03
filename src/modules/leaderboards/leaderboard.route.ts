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
        description: "Get the community leaderboard based on reputation points",
        tags: ["Leaderboards"],
        responses: {
            200: { description: "Leaderboard retrieved successfully" },
        },
    }),
    validator("query", getLeaderboardQuerySchema),
    leaderboardController.getLeaderboard
);

router.post(
    "/distribute",
    describeRoute({
        summary: "Distribute Leaderboard Rewards & Badges",
        description: "Process monthly leaderboard, award badges and rewards to Top 3 citizens, and reset all leaderboard points to 0. (Admin only)",
        tags: ["Leaderboards"],
        security: [{ bearerAuth: [] }],
        responses: {
            200: { description: "Distribution successful" },
            400: { description: "Invalid period" },
            403: { description: "Forbidden" },
        },
    }),
    requireAuth,
    requireRole(["ADMIN"]),
    validator("json", distributeLeaderboardSchema),
    leaderboardController.distributeLeaderboard
);

export default router;
