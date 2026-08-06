import { jwt } from "hono/jwt";
import type { Context, Next } from "hono";
import { ApiResponse } from "../utils/api-response";
import { ApiError } from "../utils/api-error";

export const requireAuth = async (c: Context, next: Next) => {
    try {
        const jwtMiddleware = jwt({
            secret: c.env.JWT_SECRET as string,
            alg: "HS256",
        });
        return await jwtMiddleware(c, async () => {
            const payload = c.get("jwtPayload") as any;
            const path = c.req.path;
            
            // BR-005: Only ACTIVE users can access protected features.
            // Allow /auth/ endpoints (e.g., /auth/me, /auth/logout) to bypass this check.
            if (payload && payload.status !== "ACTIVE" && !path.startsWith("/auth/")) {
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
    return async (c: Context, next: Next) => {
        const payload = c.get("jwtPayload") as any;
        
        if (!payload || !roles.includes(payload.role)) {
            return ApiResponse.forbidden(c, "Forbidden: Insufficient permissions");
        }
        
        return next();
    };
};
