import { z } from "zod";

export const paramSchema = z.object({
    id: z.uuid("Invalid point transaction ID"),
    userId: z.uuid("Invalid user ID"),
});

export const createPointTransactionSchema = z.object({
    userId: z.uuid("Invalid user ID"),
    amount: z.number().int("Amount must be an integer"),
    transactionType: z.enum(["ATTENDANCE_REWARD", "ITEM_REDEEM"]),
    referenceId: z.uuid("Invalid reference ID").optional(),
});

export type ParamSchema = z.infer<typeof paramSchema>;
export type CreatePointTransactionSchema = z.infer<typeof createPointTransactionSchema>;
