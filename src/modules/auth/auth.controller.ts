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

export default {
    login
};
