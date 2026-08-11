import { env } from "cloudflare:workers";
import { describe, it, expect, beforeAll } from "vitest";
import { applyMigrations, generateTestToken } from "../../test-setup";
import app from "../../index";
import { uuidv7 } from "uuidv7";

describe("Reward Redemptions Module", () => {
    let adminToken: string;
    let userToken: string;
    let providerToken: string;
    
    let adminId: string;
    let userId: string;
    let providerUserId: string;
    let providerId: string;
    let rewardId: string;
    
    beforeAll(async () => {
        await applyMigrations();
        
        adminId = uuidv7();
        userId = uuidv7();
        providerUserId = uuidv7();
        providerId = uuidv7();
        rewardId = uuidv7();
        
        const { drizzle } = await import("drizzle-orm/d1");
        const { users, providers, rewards } = await import("../../db/schema");
        const db = drizzle(env.DB);
        
        // Insert admin
        await db.insert(users).values({
            id: adminId, name: "Admin", email: "admin@test.com", password: "pwd",
            faceEmbeddingId: "face", phoneNumber: "081", role: "ADMIN",
            status: "ACTIVE",
            birthDate: new Date().toISOString()
        });
        
        // Insert regular user with some balance
        await db.insert(users).values({
            id: userId, name: "User", email: "user@test.com", password: "pwd",
            faceEmbeddingId: "face2", phoneNumber: "082", role: "CITIZEN",
            balance: 500,
            status: "ACTIVE",
            birthDate: new Date().toISOString()
        });
        
        // Insert provider user
        await db.insert(users).values({
            id: providerUserId, name: "Provider", email: "prov@test.com", password: "pwd",
            faceEmbeddingId: "face3", phoneNumber: "083", role: "CITIZEN",
            status: "ACTIVE",
            birthDate: new Date().toISOString()
        });
        
        // Insert provider profile
        await db.insert(providers).values({
            id: providerId,
            ownerId: providerUserId,
            name: "Test Provider",
            address: "123 Test St",
            latitude: -6.200000,
            longitude: 106.816666,
            status: "VERIFIED"
        });
        
        // Insert a reward
        await db.insert(rewards).values({
            id: rewardId,
            providerId,
            name: "Test Reward",
            pointsRequired: 100,
            stock: 10,
            type: "PRODUCT",
            source: "POINT_SHOP",
            status: "ACTIVE"
        });

        adminToken = await generateTestToken(adminId, "ADMIN");
        userToken = await generateTestToken(userId, "CITIZEN");
        providerToken = await generateTestToken(providerUserId, "CITIZEN");
    });

    let redemptionId: string;

    it("should allow a user to redeem a reward", async () => {
        const res = await app.request("/reward-redemptions", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${userToken}`
            },
            body: JSON.stringify({ rewardId, idempotencyKey: "redeem-test-reward-1" })
        }, env);

        expect(res.status).toBe(201);
        const data = await res.json() as any;
        expect(data.success).toBe(true);
        expect(data.data.pointsSpent).toBe(100);
        expect(data.data.status).toBe("PENDING");
        
        redemptionId = data.data.id;
    });

    it("should return the same redemption for an idempotent retry", async () => {
        const res = await app.request("/reward-redemptions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${userToken}`
            },
            body: JSON.stringify({ rewardId, idempotencyKey: "redeem-test-reward-1" })
        }, env);

        expect(res.status).toBe(201);
        const data = await res.json() as any;
        expect(data.data.id).toBe(redemptionId);
        expect(data.data.balance).toBe(400);

        const { drizzle } = await import("drizzle-orm/d1");
        const { users, rewards } = await import("../../db/schema");
        const { eq } = await import("drizzle-orm");
        const db = drizzle(env.DB);
        const user = await db.select().from(users).where(eq(users.id, userId)).get();
        const reward = await db.select().from(rewards).where(eq(rewards.id, rewardId)).get();
        expect(user?.balance).toBe(400);
        expect(reward?.stock).toBe(9);
    });
    
    it("should fail redemption if insufficient points", async () => {
        // Create an expensive reward
        const expRewardId = uuidv7();
        const { drizzle } = await import("drizzle-orm/d1");
        const { rewards } = await import("../../db/schema");
        const db = drizzle(env.DB);
        
        await db.insert(rewards).values({
            id: expRewardId,
            providerId,
            name: "Expensive Reward",
            pointsRequired: 9999, // User only has 400 left
            stock: 10,
            type: "PRODUCT",
            source: "POINT_SHOP"
        });
        
        const res = await app.request("/reward-redemptions", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${userToken}`
            },
            body: JSON.stringify({ rewardId: expRewardId, idempotencyKey: "redeem-expensive-1" })
        }, env);

        expect(res.status).toBe(400);
    });

    it("should retrieve user's own redemptions", async () => {
        const res = await app.request("/reward-redemptions/me", {
            headers: { "Authorization": `Bearer ${userToken}` }
        }, env);
        
        expect(res.status).toBe(200);
        const data = await res.json() as any;
        expect(data.data.length).toBeGreaterThan(0);
        expect(data.data[0].id).toBe(redemptionId);
    });

    it("should allow provider to update redemption status", async () => {
        const res = await app.request(`/reward-redemptions/${redemptionId}/status`, {
            method: "PATCH",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${providerToken}`
            },
            body: JSON.stringify({ status: "COMPLETED" })
        }, env);

        expect(res.status).toBe(200);
        const data = await res.json() as any;
        expect(data.data.status).toBe("COMPLETED");
        expect(data.data.completedAt).toBeDefined();
    });
    
    it("should refund points if status is rejected", async () => {
        // 1. User redeems again
        let res = await app.request("/reward-redemptions", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${userToken}`
            },
            body: JSON.stringify({ rewardId, idempotencyKey: "redeem-test-reward-2" })
        }, env);
        const redemptData = await res.json() as any;
        const newRedemptId = redemptData.data.id;
        
        // 2. Provider rejects
        res = await app.request(`/reward-redemptions/${newRedemptId}/status`, {
            method: "PATCH",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${providerToken}`
            },
            body: JSON.stringify({ status: "REJECTED" })
        }, env);
        expect(res.status).toBe(200);

        const { drizzle } = await import("drizzle-orm/d1");
        const { users, rewards } = await import("../../db/schema");
        const { eq } = await import("drizzle-orm");
        const db = drizzle(env.DB);
        const user = await db.select().from(users).where(eq(users.id, userId)).get();
        const reward = await db.select().from(rewards).where(eq(rewards.id, rewardId)).get();
        expect(user?.balance).toBe(400);
        expect(reward?.stock).toBe(9);
    });

    it("should complete a pending redemption with its signed claim token", async () => {
        const createRes = await app.request("/reward-redemptions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${userToken}`
            },
            body: JSON.stringify({ rewardId, idempotencyKey: "redeem-test-reward-claim" })
        }, env);
        expect(createRes.status).toBe(201);
        const created = await createRes.json() as any;
        expect(created.data.claimToken).toEqual(expect.any(String));

        const claimRes = await app.request("/reward-redemptions/claim", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${providerToken}`
            },
            body: JSON.stringify({ claimToken: created.data.claimToken })
        }, env);
        expect(claimRes.status).toBe(200);
        const claimed = await claimRes.json() as any;
        expect(claimed.data.status).toBe("COMPLETED");
        expect(claimed.data.claimToken).toBeNull();
    });
});
