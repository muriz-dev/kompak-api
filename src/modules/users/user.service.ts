import type { Context } from "hono";
import type { Env } from "../../types";
import userRepository from "./user.repository";
import type { RegisterUserSchema, UpdateStatusSchema } from "./user.schema";
import { ApiError } from "../../utils/api-error";
import { userRegistration } from "./user-registration";

export const register = async (c: Context<Env, string, any>, data: RegisterUserSchema) => {
    return userRegistration.register(c, data);
};

export const getAllUsers = async (c: Context, status?: string) => {
    return userRepository.getAll(c, status);
};

export const getUserById = async (c: Context, id: string) => {
    const user = await userRepository.getById(c, id);
    if (!user) {
        throw ApiError.notFound("User not found");
    }
    return user;
};

export const updateUserStatus = async (c: Context, id: string, data: UpdateStatusSchema) => {
    const user = await userRepository.getById(c, id);
    if (!user) {
        throw ApiError.notFound("User not found");
    }
    
    return userRepository.updateStatus(c, id, data);
};

export default {
    register,
    getAllUsers,
    getUserById,
    updateUserStatus
};
