import type { Context, ValidationTargets } from "hono";
import authService from "./auth.service";
import type { LoginSchema } from "./auth.schema";
import { ApiResponse } from "../../utils/api-response";
import { toSafeUser } from "../users/safe-user";
import type { Env } from "../../types";

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
    const currentUser = ctx.get("currentUser");
    return ApiResponse.ok(
        ctx,
        "Current session retrieved successfully",
        toSafeUser(currentUser)
    );
};

export const logout = async (ctx: Context<Env>) => {
    return ApiResponse.ok(ctx, "Logged out successfully");
};

export default {
    login,
    getMe,
    logout
};
