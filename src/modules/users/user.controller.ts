import type { Context, Env, ValidationTargets } from "hono";
import userService from "./user.service";
import type { ParamSchema, RegisterUserSchema, UpdateStatusSchema } from "./user.schema";
import { ApiResponse } from "../../utils/api-response";

type UserContext = Context<Env, any, {
    in: Pick<ValidationTargets, 'param' | 'json'> & {
        param: ParamSchema,
        json: RegisterUserSchema & UpdateStatusSchema
    };
    out: Pick<ValidationTargets, 'param' | 'json'> & {
        param: ParamSchema,
        json: RegisterUserSchema & UpdateStatusSchema
    };
}>;

export const register = async (ctx: UserContext) => {
    const data = ctx.req.valid("json");
    const user = await userService.register(ctx, data);
    
    // Hapus password dari response
    const { password, ...safeUser } = user;
    
    return ApiResponse.created(ctx, "Registration successful. Please wait for admin approval.", safeUser);
};

export const getAllUsers = async (ctx: UserContext) => {
    const status = ctx.req.query("status");
    const users = await userService.getAllUsers(ctx, status);
    
    // Hapus password dari seluruh array
    const safeUsers = users.map(({ password, ...user }) => user);
    
    return ApiResponse.ok(ctx, "Users retrieved successfully", safeUsers);
};

export const getUserById = async (ctx: UserContext) => {
    const { id } = ctx.req.valid("param");
    const user = await userService.getUserById(ctx, id);
    
    const { password, ...safeUser } = user;
    
    return ApiResponse.ok(ctx, "User retrieved successfully", safeUser);
};

export const updateUserStatus = async (ctx: UserContext) => {
    const { id } = ctx.req.valid("param");
    const data = ctx.req.valid("json");
    
    const user = await userService.updateUserStatus(ctx, id, data);
    
    const { password, ...safeUser } = user;
    
    return ApiResponse.ok(ctx, "User status updated successfully", safeUser);
};

export default {
    register,
    getAllUsers,
    getUserById,
    updateUserStatus
};
