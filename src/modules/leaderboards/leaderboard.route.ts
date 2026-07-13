import { Hono } from "hono";
import { describeRoute, validator } from "hono-openapi";
import leaderboardController from "./leaderboard.controller";
import { getLeaderboardQuerySchema } from "./leaderboard.schema";

const router = new Hono();

router.get(
    "/",
    describeRoute({
        description: "Get the community leaderboard based on reputation points",
        responses: {
            200: { description: "Leaderboard retrieved successfully" },
        },
    }),
    validator("query", getLeaderboardQuerySchema),
    leaderboardController.getLeaderboard
);

export default router;
