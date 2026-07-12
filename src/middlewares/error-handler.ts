import type { Context } from "hono";

import { ApiError } from "../utils/api-error";

export const errorHandler = (err: unknown, c: Context): Response => {
    let statusCode = 500;
    let message = "Internal server error";
    let errors: unknown;

    if (err instanceof ApiError) {
        statusCode = err.statusCode;
        message = err.message;
        errors = err.errors;
    } else if (err instanceof Error) {
        message = err.message;
    }

    const response = {
        success: false,
        message,
        statusCode,
        ...(errors !== undefined && { errors })
    };

    return new Response(JSON.stringify(response), {
        status: statusCode,
        headers: {
            "Content-Type": "application/json"
        }
    });
};