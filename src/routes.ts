import { Hono } from "hono";
import { openAPIRouteHandler } from "hono-openapi";
import { Scalar } from "@scalar/hono-api-reference";
import type { Env } from "./types";

import eventRouter from "./modules/events/event.route";
import rewardRouter from "./modules/rewards/reward.route";
import attendanceRouter from "./modules/attendances/attendance.route";

const router = new Hono<Env>();

// Modules Router
router.route("/events", eventRouter);
router.route("/rewards", rewardRouter);
router.route("/attendances", attendanceRouter);

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