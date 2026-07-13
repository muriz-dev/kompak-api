import { Hono } from "hono";
import { describeRoute, validator } from "hono-openapi";
import userController from "./user.controller";
import { paramSchema, registerUserSchema, updateStatusSchema } from "./user.schema";

const router = new Hono();

router.post(
    "/register",
    describeRoute({
        description: "Register a new user (Status will be PENDING)",
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
        description: "Get all users (Optional query ?status=PENDING to filter)",
        responses: {
            200: { description: "Users retrieved successfully" },
        },
    }),
    userController.getAllUsers
);

router.get(
    "/:id",
    describeRoute({
        description: "Get a user by ID",
        responses: {
            200: { description: "User retrieved successfully" },
            404: { description: "User not found" },
        },
    }),
    validator("param", paramSchema),
    userController.getUserById
);

router.patch(
    "/:id/status",
    describeRoute({
        description: "Admin: Approve or Reject a user",
        responses: {
            200: { description: "User status updated successfully" },
            404: { description: "User not found" },
        },
    }),
    validator("param", paramSchema),
    validator("json", updateStatusSchema),
    userController.updateUserStatus
);

export default router;
