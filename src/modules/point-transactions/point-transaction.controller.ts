import type { Context, Env, ValidationTargets } from "hono";
import pointTransactionService from "./point-transaction.service";
import type { ParamSchema, CreatePointTransactionSchema } from "./point-transaction.schema";
import { ApiResponse } from "../../utils/api-response";

type PointTransactionContext = Context<Env, any, {
    in: Pick<ValidationTargets, 'param' | 'json'> & {
        param: ParamSchema,
        json: CreatePointTransactionSchema
    };
    out: Pick<ValidationTargets, 'param' | 'json'> & {
        param: ParamSchema,
        json: CreatePointTransactionSchema
    };
}>;

export const getAllTransactions = async (ctx: PointTransactionContext) => {
    const transactions = await pointTransactionService.getAllTransactions(ctx);

    return ApiResponse.ok(ctx, "Point transactions retrieved successfully", transactions);
};

export const getTransactionById = async (ctx: PointTransactionContext) => {
    const { id } = ctx.req.valid("param");

    const transaction = await pointTransactionService.getTransactionById(ctx, id);

    return ApiResponse.ok(ctx, "Point transaction retrieved successfully", transaction);
};

export const getTransactionsByUserId = async (ctx: PointTransactionContext) => {
    const { userId } = ctx.req.valid("param");

    const transactions = await pointTransactionService.getTransactionsByUserId(ctx, userId);

    return ApiResponse.ok(ctx, "User point transactions retrieved successfully", transactions);
};

export const createTransaction = async (ctx: PointTransactionContext) => {
    const data = ctx.req.valid("json");

    const transaction = await pointTransactionService.createTransaction(ctx, data);

    return ApiResponse.created(ctx, "Point transaction created successfully", transaction);
};

export default {
    getAllTransactions,
    getTransactionById,
    getTransactionsByUserId,
    createTransaction
};
