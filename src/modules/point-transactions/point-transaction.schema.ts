import { z } from "zod";

export const paramSchema = z.object({
    id: z.string().uuid("Invalid point transaction ID"),
    userId: z.string().uuid("Invalid user ID"),
});

export const createPointTransactionSchema = z.object({
    userId: z.string().uuid("Invalid user ID"),
    amount: z.number().int("Amount must be an integer"),
    transactionType: z.enum(["ATTENDANCE_REWARD", "ITEM_REDEEM"]),
    referenceId: z.string().uuid("Invalid reference ID").optional(),
});

export type ParamSchema = z.infer<typeof paramSchema>;
export type CreatePointTransactionSchema = z.infer<typeof createPointTransactionSchema>;
