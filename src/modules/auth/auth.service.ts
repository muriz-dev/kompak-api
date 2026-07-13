import type { Context } from "hono";
import authRepository from "./auth.repository";
import type { LoginSchema } from "./auth.schema";
import { ApiError } from "../../utils/api-error";

export const login = async (c: Context, data: LoginSchema) => {
    const user = await authRepository.getUserByEmail(c, data.email);
    
    if (!user) {
        throw ApiError.unauthorized("Invalid email or password");
    }
    
    // Sederhana: cek password langsung (tanpa hashing untuk versi MVP)
    if (user.password !== data.password) {
        throw ApiError.unauthorized("Invalid email or password");
    }
    
    // Return user info (tanpa password) dan token sederhana
    const { password, ...userWithoutPassword } = user;
    
    return {
        user: userWithoutPassword,
        token: "dummy-jwt-token-for-mvp" // Mock token
    };
};

export default {
    login
};
