import { desc, eq } from "drizzle-orm";
import type { Context } from "hono";
import { getDb } from "../../db/connection";
import { users, rewards, badgeDefinitions, badgeAwards, rewardRedemptions } from "../../db/schema";
import { uuidv7 } from "uuidv7";

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

export const distributeAndResetLeaderboard = async (c: Context, adminId: string, month: number, year: number) => {
    const db = getDb(c.env.DB);
    
    // 1. Get Top 3 citizens (only those with > 0 points)
    const topUsers = await db.select({
        id: users.id,
        leaderboardPoints: users.leaderboardPoints
    })
    .from(users)
    .where(eq(users.role, "CITIZEN"))
    .orderBy(desc(users.leaderboardPoints))
    .limit(3)
    .all();

    const usersWithPoints = topUsers.filter(u => (u.leaderboardPoints ?? 0) > 0);

    // 2. Fetch Leaderboard Rewards
    const lbRewards = await db.select()
        .from(rewards)
        .where(eq(rewards.source, "LEADERBOARD"))
        .all();
    
    // 3. Fetch Leaderboard Badges
    const lbBadges = await db.select()
        .from(badgeDefinitions)
        .where(eq(badgeDefinitions.category, "LEADERBOARD"))
        .all();

    const batchOps: any[] = [];
    const period = `${year}-${String(month).padStart(2, '0')}`;

    for (let i = 0; i < usersWithPoints.length; i++) {
        const user = usersWithPoints[i];
        const rank = i + 1;

        // Find reward for this rank
        const reward = lbRewards.find(r => r.leaderboardPosition === rank);
        if (reward) {
            batchOps.push(
                db.insert(rewardRedemptions).values({
                    id: uuidv7(),
                    userId: user.id,
                    rewardId: reward.id,
                    providerId: reward.providerId,
                    pointsSpent: 0, // Leaderboard rewards are free
                    status: "PENDING", // Wait for admin to deliver/approve physical rewards
                })
            );
        }

        // Find badge for this rank
        // We match by name: "Rank 1", "Rank 2", "Rank 3"
        const badge = lbBadges.find(b => b.name === `Rank ${rank}`);
        if (badge) {
            batchOps.push(
                db.insert(badgeAwards).values({
                    id: uuidv7(),
                    userId: user.id,
                    badgeDefinitionId: badge.id,
                    leaderboardYear: year,
                    leaderboardPeriod: period,
                    reason: `Finished Rank ${rank} in ${period}`,
                    awardedBy: adminId, // System / Admin
                })
            );
        }
    }

    // Reset ALL users' leaderboard points
    batchOps.push(
        db.update(users).set({ leaderboardPoints: 0 })
    );

    // Execute transaction if there's any operation (usually there is at least the reset)
    if (batchOps.length > 0) {
        await db.batch(batchOps as any);
    }
};

export default {
    getLeaderboard,
    distributeAndResetLeaderboard
};
