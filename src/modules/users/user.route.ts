import { Hono } from "hono";
import { describeRoute, validator } from "hono-openapi";
import userController from "./user.controller";
import { paramSchema, registerUserSchema, updateStatusSchema } from "./user.schema";
import { requireAuth, requireRole } from "../../middlewares/auth";

const router = new Hono();

router.post(
    "/register",
    describeRoute({
        summary: "Register User",
        description: "Registers a new citizen account. The initial status will automatically be set to PENDING. Ensure the faceEmbeddingId is generated via the frontend's Face Recognition SDK before calling this endpoint.",
        tags: ["Users"],
        responses: {
            201: { description: "Registration successful" },
            400: { description: "Validation error or Email already exists" },
        },
    }),
    validator("json", registerUserSchema),
    userController.register
);

router.get(
    "/",
    describeRoute({
        summary: "Get All Users",
        description: "Admin ONLY. Retrieves a list of all registered users. You can append the query parameter `?status=PENDING` to quickly filter users waiting for manual verification.",
        tags: ["Users"],
        security: [{ bearerAuth: [] }],
        responses: {
            200: { description: "Users retrieved successfully" },
        },
    }),
    requireAuth,
    requireRole(['ADMIN']),
    userController.getAllUsers
);

router.get(
    "/:id",
    describeRoute({
        summary: "Get User by ID",
        description: "Retrieves the public profile of a user by their UUID. This endpoint is accessible to any authenticated user (e.g., viewing another citizen's basic profile).",
        tags: ["Users"],
        security: [{ bearerAuth: [] }],
        responses: {
            200: { description: "User retrieved successfully" },
            404: { description: "User not found" },
        },
    }),
    requireAuth,
    validator("param", paramSchema),
    userController.getUserById
);

router.patch(
    "/:id/status",
    describeRoute({
        summary: "Update User Status",
        description: "Admin ONLY. Approves (ACTIVE) or Rejects (REJECTED) a pending user registration. Once ACTIVE, the user can start participating in events and claiming rewards.",
        tags: ["Users"],
        security: [{ bearerAuth: [] }],
        responses: {
            200: { description: "User status updated successfully" },
            404: { description: "User not found" },
        },
    }),
    requireAuth,
    requireRole(['ADMIN']),
    validator("param", paramSchema),
    validator("json", updateStatusSchema),
    userController.updateUserStatus
);

export default router;
