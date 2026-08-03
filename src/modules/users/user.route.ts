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
        description: "Register a new user (Status will be PENDING)",
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
        description: "Get all users (Admin only, Optional query ?status=PENDING to filter)",
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
        description: "Get a user by ID (Authenticated users)",
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
        description: "Admin: Approve or Reject a user",
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
