import { z } from "zod";

export const getLeaderboardQuerySchema = z.object({
    limit: z.coerce.number().min(1).max(100).optional().default(50),
});

export const distributeLeaderboardSchema = z.object({
    month: z.number().min(1).max(12),
    year: z.number().min(2024).max(2100),
});

export type GetLeaderboardQuerySchema = z.infer<typeof getLeaderboardQuerySchema>;
export type DistributeLeaderboardSchema = z.infer<typeof distributeLeaderboardSchema>;
