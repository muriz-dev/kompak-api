import { z } from "zod";
import type { MiddlewareHandler } from "hono";
import type { Env } from "../types";

// Gunakan .loose() agar Zod tidak membuang bindings seperti D1 (c.env.DB)
const envSchema = z.object({
    API_BASE_URL: z.url("API_BASE_URL harus berupa URL yang valid"),
    CORS_ORIGINS: z.url("CORS_ORIGINS harus berupa URL yang valid"),
}).loose();

export const validateEnv: MiddlewareHandler<Env> = async (c, next) => {
    try {
        envSchema.parse(c.env);
        await next();
    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error("❌ Validasi Environment Gagal:", JSON.stringify(error.format(), null, 2));

            return c.json({
                success: false,
                message: "Internal Server Error: Misconfigured Environment",
            }, 500);
        }
        throw error;
    }
};
