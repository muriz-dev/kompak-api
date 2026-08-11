import type { Context } from "hono";
import leaderboardRepository from "./leaderboard.repository";
import { ApiError } from "../../utils/api-error";

export const getLeaderboard = async (c: Context, limit?: number) => {
    const currentUser = c.get("currentUser") as { id: string };
    return leaderboardRepository.getLeaderboard(c, currentUser.id, limit);
};

export const distributeAndResetLeaderboard = async (c: Context, month: number, year: number) => {
    const jwtPayload = c.get("jwtPayload") as any;
    
    // Validate period
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    if (year > currentYear || (year === currentYear && month > currentMonth)) {
        throw new ApiError(400, "Cannot distribute leaderboard for future periods");
    }

    const period = `${year}-${String(month).padStart(2, "0")}`;
    if (await leaderboardRepository.hasDistribution(c, period)) {
        throw ApiError.conflict(`Leaderboard for ${period} has already been distributed`);
    }

    try {
        await leaderboardRepository.distributeAndResetLeaderboard(c, jwtPayload.id, month, year);
    } catch (error) {
        if (error instanceof ApiError) throw error;
        console.error("DISTRIBUTION ERROR:", error);
        throw ApiError.server("Failed to distribute leaderboard rewards and badges");
    }
};

export default {
    getLeaderboard,
    distributeAndResetLeaderboard
};
