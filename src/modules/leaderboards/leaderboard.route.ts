import { Hono } from "hono";
import { describeRoute, validator } from "hono-openapi";
import leaderboardController from "./leaderboard.controller";
import { getLeaderboardQuerySchema } from "./leaderboard.schema";

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

export default router;
