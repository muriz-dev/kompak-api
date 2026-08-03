import { Hono } from "hono";
import { describeRoute, validator } from "hono-openapi";
import pointTransactionController from "./point-transaction.controller";
import { createPointTransactionSchema, paramSchema } from "./point-transaction.schema";
import { requireAuth, requireRole } from "../../middlewares/auth";

const router = new Hono();

router.get(
    "/",
    describeRoute({
        summary: "Get All Point Transactions",
        description: "Admin: Get all point transactions",
        tags: ["Point Transactions"],
        security: [{ bearerAuth: [] }],
        responses: {
            200: { description: "Point transactions retrieved successfully" },
        },
    }),
    requireAuth,
    requireRole(['ADMIN']),
    pointTransactionController.getAllTransactions
);

router.post(
    "/",
    describeRoute({
        summary: "Create Point Transaction",
        description: "Admin: Create a new point transaction manually",
        tags: ["Point Transactions"],
        security: [{ bearerAuth: [] }],
        responses: {
            201: { description: "Point transaction created successfully" },
        },
    }),
    requireAuth,
    requireRole(['ADMIN']),
    validator("json", createPointTransactionSchema),
    pointTransactionController.createTransaction
);

router.get(
    "/:id",
    describeRoute({
        summary: "Get Point Transaction by ID",
        description: "Admin: Get a point transaction by ID",
        tags: ["Point Transactions"],
        security: [{ bearerAuth: [] }],
        responses: {
            200: { description: "Point transaction retrieved successfully" },
            404: { description: "Point transaction not found" },
        },
    }),
    requireAuth,
    requireRole(['ADMIN']),
    validator("param", paramSchema.pick({ id: true })),
    pointTransactionController.getTransactionById
);

router.get(
    "/user/:userId",
    describeRoute({
        summary: "Get User Point Transactions",
        description: "Get all point transactions for a specific user",
        tags: ["Point Transactions"],
        security: [{ bearerAuth: [] }],
        responses: {
            200: { description: "User point transactions retrieved successfully" },
        },
    }),
    requireAuth,
    validator("param", paramSchema.pick({ userId: true })),
    pointTransactionController.getTransactionsByUserId
);

export default router;
