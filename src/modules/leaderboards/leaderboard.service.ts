import type { Context } from "hono";
import leaderboardRepository from "./leaderboard.repository";
import { ApiError } from "../../utils/api-error";

export const getLeaderboard = async (c: Context, limit?: number) => {
    return leaderboardRepository.getLeaderboard(c, limit);
};

export const distributeAndResetLeaderboard = async (c: Context, month: number, year: number) => {
    const jwtPayload = c.get("jwtPayload") as any;
    
    // Validate period
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    if (year > currentYear || (year === currentYear && month > currentMonth)) {
        throw new ApiError(400, "Cannot distribute leaderboard for future periods");
    }

    try {
        await leaderboardRepository.distributeAndResetLeaderboard(c, jwtPayload.id, month, year);
    } catch (error) {
        console.error("DISTRIBUTION ERROR:", error);
        throw ApiError.server("Failed to distribute leaderboard rewards and badges");
    }
};

export default {
    getLeaderboard,
    distributeAndResetLeaderboard
};
