import type { Context } from "hono";
import { sign } from "hono/jwt";
import authRepository from "./auth.repository";
import type { LoginSchema } from "./auth.schema";
import { ApiError } from "../../utils/api-error";
import { comparePassword } from "../../utils/password";

export const login = async (c: Context, data: LoginSchema) => {
    const user = await authRepository.getUserByEmail(c, data.email);
    
    if (!user) {
        throw ApiError.unauthorized("Invalid email or password");
    }
    
    const isPasswordValid = await comparePassword(data.password, user.password);
    if (!isPasswordValid) {
        throw ApiError.unauthorized("Invalid email or password");
    }

    const { password, ...userWithoutPassword } = user;
    
    // Sign real JWT token for MVP
    const token = await sign(
        {
            id: user.id,
            role: user.role,
            status: user.status,
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 // 1 day expiration
        },
        c.env.JWT_SECRET as string
    );
    
    return {
        user: userWithoutPassword,
        token: token
    };
};

export default {
    login
};
