import { jwt } from "hono/jwt";
import type { Context, Next } from "hono";
import { ApiResponse } from "../utils/api-response";
import { ApiError } from "../utils/api-error";
import userRepository from "../modules/users/user.repository";
import type { Env } from "../types";

export const requireAuth = async (c: Context<Env>, next: Next) => {
    try {
        const jwtMiddleware = jwt({
            secret: c.env.JWT_SECRET as string,
            alg: "HS256",
        });
        return await jwtMiddleware(c, async () => {
            const payload = c.get("jwtPayload");
            if (!payload?.id) {
                throw ApiError.unauthorized("Invalid session");
            }

            const currentUser = await userRepository.getById(c, payload.id);
            if (!currentUser) {
                throw ApiError.unauthorized("Invalid session");
            }

            c.set("currentUser", currentUser);
            const path = c.req.path;
            
            // BR-005: Only ACTIVE users can access protected features.
            // Allow /auth/ endpoints (e.g., /auth/me, /auth/logout) to bypass this check.
            if (currentUser.status !== "ACTIVE" && !path.startsWith("/auth/")) {
                throw ApiError.forbidden("Account is not active");
            }
            
            await next();
        });
    } catch (e) {
        console.error("JWT Middleware Error:", e);
        throw e;
    }
};

export const requireRole = (roles: string[]) => {
    return async (c: Context<Env>, next: Next) => {
        const currentUser = c.get("currentUser");
        
        if (!currentUser || !roles.includes(currentUser.role)) {
            return ApiResponse.forbidden(c, "Forbidden: Insufficient permissions");
        }
        
        return next();
    };
};
