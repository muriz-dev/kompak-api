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
        description: "Authenticates a user using email and password. Returns a JWT access token upon success. The frontend should store this token securely (e.g., Secure Storage or HTTP-Only Cookies) and attach it as a Bearer token in the Authorization header for subsequent protected requests.",
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
        description: "Retrieves the full profile of the currently authenticated user based on the provided JWT token. Use this on initial app load to verify session validity and populate user contexts (e.g., displaying the user's name, balance, or role).",
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
        description: "Logs out the current user. Since the API uses stateless JWTs, this endpoint primarily serves as a hook for server-side analytics or future token blacklisting. The frontend MUST actively clear the JWT token from local storage/cookies upon a successful response.",
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
