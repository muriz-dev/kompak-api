import { Hono } from "hono";
import { openAPIRouteHandler } from "hono-openapi";
import { Scalar } from "@scalar/hono-api-reference";
import type { Env } from "./types";

import eventRouter from "./modules/events/event.route";
import rewardRouter from "./modules/rewards/reward.route";
import attendanceRouter from "./modules/attendances/attendance.route";
import pointTransactionRouter from "./modules/point-transactions/point-transaction.route";
import leaderboardRouter from "./modules/leaderboards/leaderboard.route";
import authRouter from "./modules/auth/auth.route";
import userRouter from "./modules/users/user.route";
import providerRouter from "./modules/providers/provider.route";
import rewardRedemptionRouter from "./modules/reward-redemptions/reward-redemption.route";

const router = new Hono<Env>();

// Modules Router
router.route("/events", eventRouter);
router.route("/rewards", rewardRouter);
router.route("/attendances", attendanceRouter);
router.route("/point-transactions", pointTransactionRouter);
router.route("/leaderboard", leaderboardRouter);
router.route("/auth", authRouter);
router.route("/users", userRouter);
router.route("/providers", providerRouter);
router.route("/reward-redemptions", rewardRedemptionRouter);

// Documentation Router
router.get("/openapi", (c, _next) =>
    openAPIRouteHandler(router, {
        documentation: {
            info: {
                title: "Kompak API",
                version: "1.0.0",
                description: "Kompak Service",
            },
            servers: [{ url: c.env.API_BASE_URL, description: "Local Server" }],
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: "http",
                        scheme: "bearer",
                        bearerFormat: "JWT",
                    },
                },
            },
        },
    })(c, _next)
);

router.get(
    "/docs",
    Scalar({
        theme: "saturn",
        url: "openapi",
    }),
);

export default router;