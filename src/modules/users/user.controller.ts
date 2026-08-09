import type { Context, ValidationTargets } from "hono";
import userService from "./user.service";
import type { ParamSchema, RegisterUserSchema, UpdateStatusSchema } from "./user.schema";
import { ApiResponse } from "../../utils/api-response";
import type { Env } from "../../types";

type RegisterContext = Context<Env, string, {
    in: Pick<ValidationTargets, 'form'> & {
        form: RegisterUserSchema
    };
    out: Pick<ValidationTargets, 'form'> & {
        form: RegisterUserSchema
    };
}>;

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

const toSafeUser = <T extends { password: string; faceEmbeddingId: string }>(user: T) => {
    const { password, faceEmbeddingId, ...safeUser } = user;
    return safeUser;
};

export const register = async (ctx: RegisterContext) => {
    const data = ctx.req.valid("form");
    const user = await userService.register(ctx, data);

    const safeUser = toSafeUser(user);

    return ApiResponse.created(ctx, "Registration successful. Please wait for admin approval.", safeUser);
};

export const getAllUsers = async (ctx: UserContext) => {
    const status = ctx.req.query("status");
    const users = await userService.getAllUsers(ctx, status);
    
    const safeUsers = users.map(toSafeUser);
    
    return ApiResponse.ok(ctx, "Users retrieved successfully", safeUsers);
};

export const getUserById = async (ctx: UserContext) => {
    const { id } = ctx.req.valid("param");
    const user = await userService.getUserById(ctx, id);
    
    const safeUser = toSafeUser(user);
    
    return ApiResponse.ok(ctx, "User retrieved successfully", safeUser);
};

export const updateUserStatus = async (ctx: UserContext) => {
    const { id } = ctx.req.valid("param");
    const data = ctx.req.valid("json");
    
    const user = await userService.updateUserStatus(ctx, id, data);
    
    const safeUser = toSafeUser(user);
    
    return ApiResponse.ok(ctx, "User status updated successfully", safeUser);
};

export default {
    register,
    getAllUsers,
    getUserById,
    updateUserStatus
};
