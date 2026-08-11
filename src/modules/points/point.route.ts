import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { requireAuth } from "../../middlewares/auth";
import * as controller from "./point.controller";

const pointRouter = new Hono();

pointRouter.get(
    "/me",
    describeRoute({
        summary: "Get My Point History",
        description: "Returns the current balance and a unified ledger of attendance earnings, reward spending, and redemption refunds.",
        tags: ["Points"],
        security: [{ bearerAuth: [] }],
        responses: {
            200: { description: "Point history retrieved successfully" },
        },
    }),
    requireAuth,
    controller.getMyPointHistory,
);

export default pointRouter;
