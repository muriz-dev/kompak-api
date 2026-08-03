import type { Context, Env, ValidationTargets } from "hono";
import leaderboardService from "./leaderboard.service";
import type { GetLeaderboardQuerySchema } from "./leaderboard.schema";
import { ApiResponse } from "../../utils/api-response";

type LeaderboardContext = Context<Env, any, {
    in: Pick<ValidationTargets, 'query'> & {
        query: GetLeaderboardQuerySchema
    };
    out: Pick<ValidationTargets, 'query'> & {
        query: GetLeaderboardQuerySchema
    };
}>;

export const getLeaderboard = async (ctx: LeaderboardContext) => {
    const { limit } = ctx.req.valid("query");

    const leaderboard = await leaderboardService.getLeaderboard(ctx, limit);

    return ApiResponse.ok(ctx, "Leaderboard retrieved successfully", leaderboard);
};

export const distributeLeaderboard = async (ctx: Context) => {
    const payload = ctx.req.valid("json" as never) as any;

    await leaderboardService.distributeAndResetLeaderboard(ctx, payload.month, payload.year);

    return ApiResponse.ok(ctx, "Leaderboard rewards and badges distributed successfully, points have been reset.");
};

export default {
    getLeaderboard,
    distributeLeaderboard
};
