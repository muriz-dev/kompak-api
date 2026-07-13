import { z } from "zod";

export const paramSchema = z.object({
    id: z.string().uuid("Invalid user ID"),
});

export const registerUserSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    faceEmbeddingId: z.string().min(1, "Face embedding ID is required for verification"),
});

export const updateStatusSchema = z.object({
    status: z.enum(["APPROVED", "REJECTED", "PENDING"]),
});

export type ParamSchema = z.infer<typeof paramSchema>;
export type RegisterUserSchema = z.infer<typeof registerUserSchema>;
export type UpdateStatusSchema = z.infer<typeof updateStatusSchema>;
