import { Hono } from "hono";
import { describeRoute, validator } from "hono-openapi";
import userController from "./user.controller";
import { paramSchema, registerUserSchema, updateStatusSchema, updateUserSchema } from "./user.schema";
import { requireAuth, requireRole } from "../../middlewares/auth";
import { ApiResponse } from "../../utils/api-response";
import { STATUS_CODES } from "../../constants/status-code";
import type { Env } from "../../types";

const router = new Hono<Env>();

router.post(
    "/register",
    describeRoute({
        summary: "Register User",
        description: "Registers a new citizen account from personal data and one face image. The backend enrolls the face and assigns the initial PENDING status.",
        tags: ["Users"],
        responses: {
            201: { description: "Registration successful" },
            409: { description: "Email already exists" },
            413: { description: "Face image is too large" },
            422: { description: "Personal data or face image is invalid" },
            503: { description: "Face enrollment service is unavailable" },
        },
    }),
    validator("form", registerUserSchema, (result, c) => {
        if (!result.success) {
            const fieldErrors: Record<string, string> = {};
            for (const issue of result.error) {
                const field = issue.path?.[0];
                if (typeof field === "string" && fieldErrors[field] === undefined) {
                    fieldErrors[field] = issue.message;
                }
            }
            return ApiResponse.error(
                c,
                "Validation failed",
                fieldErrors,
                STATUS_CODES.UNPROCESSABLE_ENTITY
            );
        }
    }),
    userController.register
);

router.post(
    "/",
    describeRoute({
        summary: "Create Resident",
        description: "Admin ONLY. Creates an active resident account and enrolls the supplied face image for attendance verification.",
        tags: ["Users"],
        security: [{ bearerAuth: [] }],
        responses: {
            201: { description: "Resident created successfully" },
            409: { description: "Email already exists" },
            422: { description: "Resident data or face image is invalid" },
        },
    }),
    requireAuth,
    requireRole(['ADMIN']),
    validator("form", registerUserSchema),
    userController.createUserByAdmin
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

router.patch(
    "/:id",
    describeRoute({
        summary: "Update Resident",
        description: "Admin ONLY. Updates a resident's editable personal information.",
        tags: ["Users"],
        security: [{ bearerAuth: [] }],
        responses: {
            200: { description: "Resident updated successfully" },
            404: { description: "User not found" },
            409: { description: "Email already exists" },
        },
    }),
    requireAuth,
    requireRole(['ADMIN']),
    validator("param", paramSchema),
    validator("json", updateUserSchema),
    userController.updateUser
);

export default router;
