import { z } from "zod";

export const getLeaderboardQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(50).optional(),
});

export type GetLeaderboardQuerySchema = z.infer<typeof getLeaderboardQuerySchema>;
