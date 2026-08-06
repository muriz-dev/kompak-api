import { Hono } from "hono";
import { describeRoute, validator } from "hono-openapi";
import authController from "./auth.controller";
import { loginSchema } from "./auth.schema";
import { requireAuth } from "../../middlewares/auth";
import type { Env } from "../../types";

const router = new Hono<Env>();

router.post(
    "/login",
    describeRoute({
        summary: "Login",
        description: "Simple login endpoint for MVP",
        tags: ["Auth"],
        responses: {
            200: { description: "Login successful" },
            401: { description: "Invalid email or password" },
        },
    }),
    validator("json", loginSchema),
    authController.login
);

router.get(
    "/me",
    describeRoute({
        summary: "Get Current User",
        description: "Get the profile of the currently logged-in user",
        tags: ["Auth"],
        security: [{ bearerAuth: [] }],
        responses: {
            200: { description: "Current session retrieved successfully" },
            401: { description: "Unauthorized" },
        },
    }),
    requireAuth,
    authController.getMe
);

router.post(
    "/logout",
    describeRoute({
        summary: "Logout",
        description: "Logout the current user (Dummy endpoint for stateless JWT)",
        tags: ["Auth"],
        security: [{ bearerAuth: [] }],
        responses: {
            200: { description: "Logged out successfully" },
        },
    }),
    requireAuth,
    authController.logout
);

export default router;
