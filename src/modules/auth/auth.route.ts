import { Hono } from "hono";
import { describeRoute, validator } from "hono-openapi";
import authController from "./auth.controller";
import { loginSchema } from "./auth.schema";

const router = new Hono();

router.post(
    "/login",
    describeRoute({
        description: "Simple login endpoint for MVP",
        responses: {
            200: { description: "Login successful" },
            401: { description: "Invalid email or password" },
        },
    }),
    validator("json", loginSchema),
    authController.login
);

export default router;
