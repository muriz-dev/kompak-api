import { desc } from "drizzle-orm";
import type { Context } from "hono";
import { getDb } from "../../db/connection";
import { users } from "../../db/schema";

export const getLeaderboard = async (c: Context, limit: number = 50) => {
    const db = getDb(c.env.DB);
    
    return db.query.users.findMany({
        columns: {
            id: true,
            name: true,
            leaderboardPoints: true,
        },
        orderBy: [desc(users.leaderboardPoints)],
        limit: limit,
    });
};

export default {
    getLeaderboard
};
