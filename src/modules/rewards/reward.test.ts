import { env } from "cloudflare:workers";
import { describe, it, expect, beforeAll } from "vitest";
import { applyMigrations, generateTestToken } from "../../test-setup";
import app from "../../index";
import { uuidv7 } from "uuidv7";

describe("Reward Module", () => {
    let rewardId: string;
    let adminToken: string;
    let providerId: string;

    beforeAll(async () => {
        await applyMigrations();
        const { drizzle } = await import("drizzle-orm/d1");
        const { users, providers } = await import("../../db/schema");
        const db = drizzle(env.DB);

        const adminId = uuidv7();
        await db.insert(users).values({
            id: adminId, name: "Admin", email: "admin@test.com", password: "pwd",
            faceEmbeddingId: "admin", phoneNumber: "010", role: "ADMIN", status: "ACTIVE",
            birthDate: new Date().toISOString()
        });
        adminToken = await generateTestToken(adminId, "ADMIN");

        providerId = uuidv7();
        await db.insert(providers).values({
            id: providerId, ownerId: adminId, name: "Provider",
            address: "Address", status: "VERIFIED",
            latitude: 0, longitude: 0
        });
    });

    it("should create a reward successfully", async () => {
        const payload = {
            name: "Test Reward",
            pointsRequired: 100,
            stock: 50,
            type: "VOUCHER",
            source: "POINT_SHOP",
            providerId: providerId
        };

        const res = await app.request("/rewards", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${adminToken}`
            },
            body: JSON.stringify(payload)
        }, env);

        expect(res.status).toBe(201);
        const data = await res.json() as any;
        expect(data.message).toBe("Reward created successfully");
        expect(data.data.name).toBe("Test Reward");

        rewardId = data.data.id;
    });

    it("should retrieve a list of rewards", async () => {
        const res = await app.request("/rewards", undefined, env);
        expect(res.status).toBe(200);
        const data = await res.json() as any;
        expect(data.data.length).toBeGreaterThan(0);
        expect(data.data[0].name).toBe("Test Reward");
    });

    it("should retrieve a specific reward by ID", async () => {
        const res = await app.request(`/rewards/${rewardId}`, undefined, env);
        expect(res.status).toBe(200);
        const data = await res.json() as any;
        expect(data.data.name).toBe("Test Reward");
    });

    it("should expose a mobile-ready Point Shop catalog", async () => {
        const res = await app.request("/rewards/point-shop", undefined, env);
        expect(res.status).toBe(200);
        const data = await res.json() as any;
        const reward = data.data.find((item: any) => item.id === rewardId);
        expect(reward).toMatchObject({
            description: "",
            pointsRequired: 100,
            stock: 50,
            validityDays: 7,
            isFeatured: false,
            provider: {
                id: providerId,
                name: "Provider",
                address: "Address",
            },
        });
    });

    describe("Reward Filtering by Source", () => {
        beforeAll(async () => {
            const { drizzle } = await import("drizzle-orm/d1");
            const { rewards } = await import("../../db/schema");
            const db = drizzle(env.DB);
            
            // POINT_SHOP reward is already created above as "Test Reward"
            
            // Create a LEADERBOARD reward
            await db.insert(rewards).values({
                id: uuidv7(),
                providerId: providerId,
                name: "Leaderboard Reward",
                pointsRequired: 0,
                stock: 1,
                type: "PRODUCT",
                source: "LEADERBOARD",
                status: "ACTIVE",
                leaderboardPosition: 1
            });
        });

        it("should retrieve only POINT_SHOP rewards", async () => {
            const res = await app.request("/rewards?source=POINT_SHOP", undefined, env);
            expect(res.status).toBe(200);
            const data = await res.json() as any;
            expect(data.data.length).toBe(1);
            expect(data.data[0].name).toBe("Test Reward");
        });

        it("should retrieve only LEADERBOARD rewards", async () => {
            const res = await app.request("/rewards?source=LEADERBOARD", undefined, env);
            expect(res.status).toBe(200);
            const data = await res.json() as any;
            expect(data.data.length).toBe(1);
            expect(data.data[0].name).toBe("Leaderboard Reward");
        });
    });

    describe("Provider Reward Authorization", () => {
        let verifiedProviderToken: string;
        let verifiedProviderId: string;
        let pendingProviderToken: string;
        let pendingProviderId: string;
        let providerRewardId: string;

        beforeAll(async () => {
            const { drizzle } = await import("drizzle-orm/d1");
            const { users, providers } = await import("../../db/schema");
            const db = drizzle(env.DB);

            // User 1: Verified Provider
            const user1Id = uuidv7();
            await db.insert(users).values({
                id: user1Id, name: "Verified User", email: "verified@test.com", password: "pwd",
                faceEmbeddingId: "v", phoneNumber: "011", role: "CITIZEN", status: "ACTIVE",
                birthDate: new Date().toISOString()
            });
            verifiedProviderToken = await generateTestToken(user1Id, "CITIZEN");
            verifiedProviderId = uuidv7();
            await db.insert(providers).values({
                id: verifiedProviderId, ownerId: user1Id, name: "Verified Provider",
                address: "Address", status: "VERIFIED", latitude: 0, longitude: 0
            });

            // User 2: Pending Provider
            const user2Id = uuidv7();
            await db.insert(users).values({
                id: user2Id, name: "Pending User", email: "pending@test.com", password: "pwd",
                faceEmbeddingId: "p", phoneNumber: "012", role: "CITIZEN", status: "ACTIVE",
                birthDate: new Date().toISOString()
            });
            pendingProviderToken = await generateTestToken(user2Id, "CITIZEN");
            pendingProviderId = uuidv7();
            await db.insert(providers).values({
                id: pendingProviderId, ownerId: user2Id, name: "Pending Provider",
                address: "Address", status: "PENDING", latitude: 0, longitude: 0
            });
        });

        it("should allow a VERIFIED provider to create a reward", async () => {
            const res = await app.request("/rewards", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${verifiedProviderToken}`
                },
                body: JSON.stringify({
                    name: "Provider Reward",
                    pointsRequired: 50,
                    stock: 10,
                    type: "PRODUCT",
                    source: "POINT_SHOP",
                    providerId: verifiedProviderId
                })
            }, env);

            expect(res.status).toBe(201);
            const data = await res.json() as any;
            providerRewardId = data.data.id;
        });

        it("should NOT allow a PENDING provider to create a reward", async () => {
            const res = await app.request("/rewards", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${pendingProviderToken}`
                },
                body: JSON.stringify({
                    name: "Pending Reward",
                    pointsRequired: 50,
                    stock: 10,
                    type: "PRODUCT",
                    source: "POINT_SHOP",
                    providerId: pendingProviderId
                })
            }, env);

            expect(res.status).toBe(403);
        });

        it("should NOT allow a provider to update another provider's reward", async () => {
            // verifiedProvider trying to update Admin's reward (from previous test suite)
            const res = await app.request(`/rewards/${rewardId}`, {
                method: "PUT",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${verifiedProviderToken}`
                },
                body: JSON.stringify({
                    name: "Hacked Reward",
                    pointsRequired: 1,
                    stock: 10,
                    type: "PRODUCT",
                    source: "POINT_SHOP",
                    providerId: providerId
                })
            }, env);

            expect(res.status).toBe(403);
        });

        it("should allow a VERIFIED provider to update their own reward", async () => {
            const res = await app.request(`/rewards/${providerRewardId}`, {
                method: "PATCH",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${verifiedProviderToken}`
                },
                body: JSON.stringify({
                    stock: 20
                })
            }, env);

            expect(res.status).toBe(200);
            const data = await res.json() as any;
            expect(data.data.stock).toBe(20);
        });
    });
});
