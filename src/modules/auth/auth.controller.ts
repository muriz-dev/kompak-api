import type { Context, Env, ValidationTargets } from "hono";
import authService from "./auth.service";
import type { LoginSchema } from "./auth.schema";
import { ApiResponse } from "../../utils/api-response";

type AuthContext = Context<Env, any, {
    in: Pick<ValidationTargets, 'json'> & {
        json: LoginSchema
    };
    out: Pick<ValidationTargets, 'json'> & {
        json: LoginSchema
    };
}>;

export const login = async (ctx: AuthContext) => {
    const data = ctx.req.valid("json");
    
    const result = await authService.login(ctx, data);
    
    return ApiResponse.ok(ctx, "Login successful", result);
};

export const getMe = async (ctx: Context<Env>) => {
    const payload = ctx.get("jwtPayload") as { id: string };
    const user = await authService.getMe(ctx, payload.id);
    return ApiResponse.ok(ctx, "Current session retrieved successfully", user);
};

export const logout = async (ctx: Context<Env>) => {
    return ApiResponse.ok(ctx, "Logged out successfully");
};

export default {
    login,
    getMe,
    logout
};
