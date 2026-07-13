import { Hono } from "hono";
import { describeRoute, validator } from "hono-openapi";
import pointTransactionController from "./point-transaction.controller";
import { createPointTransactionSchema, paramSchema } from "./point-transaction.schema";

const router = new Hono();

router.get(
    "/",
    describeRoute({
        description: "Get all point transactions",
        responses: {
            200: { description: "Point transactions retrieved successfully" },
        },
    }),
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
    validator("param", paramSchema.pick({ userId: true })),
    pointTransactionController.getTransactionsByUserId
);

export default router;
