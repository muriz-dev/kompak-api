import { Hono } from "hono";
import { describeRoute, validator } from "hono-openapi";
import authController from "./auth.controller";
import { loginSchema } from "./auth.schema";

const router = new Hono();

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

export default router;
