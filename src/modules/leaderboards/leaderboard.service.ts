import type { Context } from "hono";
import leaderboardRepository from "./leaderboard.repository";

export const getLeaderboard = async (c: Context, limit?: number) => {
    return leaderboardRepository.getLeaderboard(c, limit);
};

export default {
    getLeaderboard
};
