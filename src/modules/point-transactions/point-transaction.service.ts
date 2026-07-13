import type { Context } from "hono";
import pointTransactionRepository from "./point-transaction.repository";
import type { CreatePointTransactionSchema } from "./point-transaction.schema";
import { ApiError } from "../../utils/api-error";

export const getAllTransactions = async (c: Context) => {
    return pointTransactionRepository.getAll(c);
};

export const getTransactionById = async (c: Context, id: string) => {
    const transaction = await pointTransactionRepository.getById(c, id);
    if (!transaction) throw ApiError.notFound(`Point transaction with ID ${id} not found`);
    return transaction;
};

export const getTransactionsByUserId = async (c: Context, userId: string) => {
    return pointTransactionRepository.getByUserId(c, userId);
};

export const createTransaction = async (c: Context, data: CreatePointTransactionSchema) => {
    return pointTransactionRepository.create(c, data);
};

export default {
    getAllTransactions,
    getTransactionById,
    getTransactionsByUserId,
    createTransaction
};
