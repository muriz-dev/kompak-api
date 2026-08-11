import { and, asc, desc, eq, gt } from "drizzle-orm";
import type { Context } from "hono";
import { getDb } from "../../db/connection";
import {
    users,
    rewards,
    badgeDefinitions,
    badgeAwards,
    leaderboardDistributions,
    rewardRedemptions,
} from "../../db/schema";
import { uuidv7 } from "uuidv7";

export const getLeaderboard = async (
    c: Context,
    currentUserId: string,
    limit: number = 50,
) => {
    const db = getDb(c.env.DB);

    const citizens = await db
        .select({
            id: users.id,
            name: users.name,
            points: users.leaderboardPoints,
        })
        .from(users)
        .where(and(eq(users.role, "CITIZEN"), eq(users.status, "ACTIVE")))
        .orderBy(desc(users.leaderboardPoints), asc(users.name), asc(users.id))
        .all();

    const entries = citizens.map((citizen, index) => ({
        id: citizen.id,
        name: citizen.name,
        points: citizen.points,
        rank: index + 1,
    }));

    const configuredRewards = await db
        .select({
            id: rewards.id,
            rank: rewards.leaderboardPosition,
            title: rewards.name,
            description: rewards.description,
            imageUrl: rewards.imageUrl,
        })
        .from(rewards)
        .where(and(
            eq(rewards.source, "LEADERBOARD"),
            eq(rewards.status, "ACTIVE"),
            gt(rewards.stock, 0),
        ))
        .orderBy(asc(rewards.leaderboardPosition), asc(rewards.name))
        .all();

    return {
        entries: entries.slice(0, limit),
        currentUser: entries.find((entry) => entry.id === currentUserId) ?? null,
        stats: {
            totalCitizens: entries.length,
            participatingCitizens: entries.filter((entry) => entry.points > 0).length,
            totalPoints: entries.reduce((total, entry) => total + entry.points, 0),
        },
        rewards: configuredRewards
            .filter((reward) => reward.rank != null && reward.rank >= 1 && reward.rank <= 3)
            .map((reward) => ({ ...reward, rank: reward.rank as number })),
    };
};

export const hasDistribution = async (c: Context, period: string) => {
    const db = getDb(c.env.DB);
    const distribution = await db.query.leaderboardDistributions.findFirst({
        columns: { id: true },
        where: eq(leaderboardDistributions.period, period),
    });
    return distribution != null;
};

export const distributeAndResetLeaderboard = async (c: Context, adminId: string, month: number, year: number) => {
    const db = getDb(c.env.DB);
    
    // 1. Get Top 3 citizens (only those with > 0 points)
    const topUsers = await db.select({
        id: users.id,
        leaderboardPoints: users.leaderboardPoints
    })
    .from(users)
    .where(and(eq(users.role, "CITIZEN"), eq(users.status, "ACTIVE")))
    .orderBy(desc(users.leaderboardPoints), asc(users.name), asc(users.id))
    .limit(3)
    .all();

    const usersWithPoints = topUsers.filter(u => (u.leaderboardPoints ?? 0) > 0);

    // 2. Fetch Leaderboard Rewards
    const lbRewards = await db.select()
        .from(rewards)
        .where(and(
            eq(rewards.source, "LEADERBOARD"),
            eq(rewards.status, "ACTIVE"),
            gt(rewards.stock, 0),
        ))
        .all();
    
    // 3. Fetch Leaderboard Badges
    const lbBadges = await db.select()
        .from(badgeDefinitions)
        .where(eq(badgeDefinitions.category, "LEADERBOARD"))
        .all();

    const batchOps: any[] = [];
    const period = `${year}-${String(month).padStart(2, '0')}`;

    batchOps.push(
        db.insert(leaderboardDistributions).values({
            id: uuidv7(),
            period,
            distributedBy: adminId,
        })
    );

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
                    idempotencyKey: `leaderboard-${period}-${user.id}-${reward.id}`,
                    status: "PENDING", // Wait for admin to deliver/approve physical rewards
                    expiresAt: new Date(Date.now() + reward.validityDays * 86_400_000),
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
        db.update(users)
            .set({ leaderboardPoints: 0 })
            .where(eq(users.role, "CITIZEN"))
    );

    // Execute transaction if there's any operation (usually there is at least the reset)
    if (batchOps.length > 0) {
        await db.batch(batchOps as any);
    }
};

export default {
    getLeaderboard,
    hasDistribution,
    distributeAndResetLeaderboard
};
