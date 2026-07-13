import { Hono } from "hono";
import { describeRoute, validator } from "hono-openapi";
import pointTransactionController from "./point-transaction.controller";
import { createPointTransactionSchema, paramSchema } from "./point-transaction.schema";
import { requireAuth, requireAdmin } from "../../middlewares/auth";

const router = new Hono();

router.get(
    "/",
    describeRoute({
        description: "Get all point transactions",
        responses: {
            200: { description: "Point transactions retrieved successfully" },
        },
    }),
    requireAuth,
    requireAdmin,
    pointTransactionController.getAllTransactions
);

router.post(
    "/",
    describeRoute({
        description: "Create a new point transaction manually",
        responses: {
            201: { description: "Point transaction created successfully" },
        },
    }),
    requireAuth,
    requireAdmin,
    validator("json", createPointTransactionSchema),
    pointTransactionController.createTransaction
);

router.get(
    "/:id",
    describeRoute({
        description: "Get a point transaction by ID",
        responses: {
            200: { description: "Point transaction retrieved successfully" },
            404: { description: "Point transaction not found" },
        },
    }),
    requireAuth,
    requireAdmin,
    validator("param", paramSchema.pick({ id: true })),
    pointTransactionController.getTransactionById
);

router.get(
    "/user/:userId",
    describeRoute({
        description: "Get all point transactions for a specific user",
        responses: {
            200: { description: "User point transactions retrieved successfully" },
        },
    }),
    requireAuth,
    validator("param", paramSchema.pick({ userId: true })),
    pointTransactionController.getTransactionsByUserId
);

export default router;
