import { env } from "cloudflare:workers";
import { describe, it, expect, beforeAll } from "vitest";
import { applyMigrations, generateTestToken } from "../../test-setup";
import app from "../../index";
import { uuidv7 } from "uuidv7";

describe("Leaderboard Module", () => {
    let adminToken: string;
    let u1: string, u2: string, u3: string, u4: string;

    beforeAll(async () => {
        await applyMigrations();

        const { drizzle } = await import("drizzle-orm/d1");
        const { users, rewards, badgeDefinitions, providers } = await import("../../db/schema");
        const db = drizzle(env.DB);

        // 1. Create Admin
        const adminId = uuidv7();
        await db.insert(users).values({
            id: adminId, name: "LB Admin", email: "lbadmin@test.com", password: "pwd",
            faceEmbeddingId: "lb-admin", phoneNumber: "010", role: "ADMIN", status: "ACTIVE",
            birthDate: new Date().toISOString()
        });
        adminToken = await generateTestToken(adminId, "ADMIN");

        // 1.5 Create a Provider
        const providerId = uuidv7();
        await db.insert(providers).values({
            id: providerId, ownerId: adminId, name: "System Provider",
            address: "System", status: "VERIFIED",
            latitude: 0, longitude: 0
        });

        // 2. Create 4 Citizens with varied leaderboardPoints and some balance
        const createCitizen = async (name: string, lbp: number) => {
            const id = uuidv7();
            await db.insert(users).values({
                id, name, email: `${name}@test.com`, password: "pwd",
                faceEmbeddingId: `lb-${name}`, phoneNumber: `011${name}`, role: "CITIZEN", status: "ACTIVE",
                balance: 1000, leaderboardPoints: lbp,
                birthDate: new Date().toISOString()
            });
            return id;
        };

        u1 = await createCitizen("User1", 500); // Rank 1
        u2 = await createCitizen("User2", 300); // Rank 2
        u3 = await createCitizen("User3", 100); // Rank 3
        u4 = await createCitizen("User4", 50);  // Rank 4

        // 3. Create Leaderboard Badges
        await db.insert(badgeDefinitions).values([
            { id: uuidv7(), name: "Rank 1", category: "LEADERBOARD", criteria: "Top 1" },
            { id: uuidv7(), name: "Rank 2", category: "LEADERBOARD", criteria: "Top 2" },
            { id: uuidv7(), name: "Rank 3", category: "LEADERBOARD", criteria: "Top 3" },
        ]);

        // 4. Create Leaderboard Rewards
        await db.insert(rewards).values([
            { id: uuidv7(), providerId: providerId, name: "Gold Trophy", type: "PRODUCT", pointsRequired: 0, stock: 10, source: "LEADERBOARD", leaderboardPosition: 1 },
            { id: uuidv7(), providerId: providerId, name: "Silver Trophy", type: "PRODUCT", pointsRequired: 0, stock: 10, source: "LEADERBOARD", leaderboardPosition: 2 },
        ]);
    });

    it("should retrieve the leaderboard with correct ordering", async () => {
        const res = await app.request("/leaderboard", undefined, env);
        expect(res.status).toBe(200);

        const data = await res.json() as any;
        expect(Array.isArray(data.data)).toBe(true);
        expect(data.data.length).toBeGreaterThanOrEqual(4);

        // Verify order
        expect(data.data[0].id).toBe(u1);
        expect(data.data[0].leaderboardPoints).toBe(500);
        expect(data.data[1].id).toBe(u2);
        expect(data.data[2].id).toBe(u3);
    });

    it("should process distribution and reset points", async () => {
        const month = new Date().getMonth() + 1; // Current month
        const year = new Date().getFullYear();

        const res = await app.request("/leaderboard/distribute", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${adminToken}`
            },
            body: JSON.stringify({ month, year })
        }, env);

        expect(res.status).toBe(200);
        const data = await res.json() as any;
        expect(data.success).toBe(true);
    });

    it("should have reset leaderboard points but kept balance intact", async () => {
        const { drizzle } = await import("drizzle-orm/d1");
        const { users } = await import("../../db/schema");
        const { eq } = await import("drizzle-orm");
        const db = drizzle(env.DB);

        const checkUser1 = await db.select().from(users).where(eq(users.id, u1)).get();
        expect(checkUser1?.leaderboardPoints).toBe(0); // Reset
        expect(checkUser1?.balance).toBe(1000); // Intact

        const checkUser4 = await db.select().from(users).where(eq(users.id, u4)).get();
        expect(checkUser4?.leaderboardPoints).toBe(0);
    });

    it("should have awarded badges to top 3 and rewards up to available ranks", async () => {
        const { drizzle } = await import("drizzle-orm/d1");
        const { badgeAwards, rewardRedemptions } = await import("../../db/schema");
        const { eq } = await import("drizzle-orm");
        const db = drizzle(env.DB);

        // Check u1 (Rank 1)
        const u1Badges = await db.select().from(badgeAwards).where(eq(badgeAwards.userId, u1)).all();
        expect(u1Badges.length).toBe(1); // Rank 1 Badge
        
        const u1Rewards = await db.select().from(rewardRedemptions).where(eq(rewardRedemptions.userId, u1)).all();
        expect(u1Rewards.length).toBe(1); // Gold Trophy

        // Check u2 (Rank 2)
        const u2Badges = await db.select().from(badgeAwards).where(eq(badgeAwards.userId, u2)).all();
        expect(u2Badges.length).toBe(1); // Rank 2 Badge

        const u2Rewards = await db.select().from(rewardRedemptions).where(eq(rewardRedemptions.userId, u2)).all();
        expect(u2Rewards.length).toBe(1); // Silver Trophy

        // Check u3 (Rank 3)
        const u3Badges = await db.select().from(badgeAwards).where(eq(badgeAwards.userId, u3)).all();
        expect(u3Badges.length).toBe(1); // Rank 3 Badge

        const u3Rewards = await db.select().from(rewardRedemptions).where(eq(rewardRedemptions.userId, u3)).all();
        expect(u3Rewards.length).toBe(0); // No Bronze Trophy was created

        // Check u4 (Rank 4)
        const u4Badges = await db.select().from(badgeAwards).where(eq(badgeAwards.userId, u4)).all();
        expect(u4Badges.length).toBe(0); // None
    });
});
