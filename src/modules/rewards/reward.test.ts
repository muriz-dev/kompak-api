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

    it("should protect the admin provider product catalog", async () => {
        const res = await app.request(`/rewards/admin/providers/${providerId}`, undefined, env);
        expect(res.status).toBe(401);
    });

    it("should paginate and filter products for one provider", async () => {
        const { drizzle } = await import("drizzle-orm/d1");
        const { rewards } = await import("../../db/schema");
        const db = drizzle(env.DB);
        await db.insert(rewards).values({
            id: uuidv7(),
            providerId,
            name: "Inactive Provider Product",
            pointsRequired: 275,
            stock: 12,
            type: "PRODUCT",
            source: "POINT_SHOP",
            status: "INACTIVE",
        });

        const res = await app.request(
            `/rewards/admin/providers/${providerId}?query=Inactive&status=INACTIVE&page=1&pageSize=4`,
            { headers: { "Authorization": `Bearer ${adminToken}` } },
            env,
        );

        expect(res.status).toBe(200);
        const data = await res.json() as any;
        expect(data.data.items).toHaveLength(1);
        expect(data.data.items[0]).toMatchObject({
            providerId,
            name: "Inactive Provider Product",
            source: "POINT_SHOP",
            status: "INACTIVE",
        });
        expect(data.data.pagination).toEqual({
            page: 1,
            pageSize: 4,
            total: 1,
            totalPages: 1,
        });
    });

    it("should expose the global admin Point Shop with provider filtering", async () => {
        const res = await app.request(
            `/rewards/admin/point-shop?providerId=${providerId}&status=INACTIVE&page=1&pageSize=3`,
            { headers: { "Authorization": `Bearer ${adminToken}` } },
            env,
        );

        expect(res.status).toBe(200);
        const data = await res.json() as any;
        expect(data.data.items).toEqual(expect.arrayContaining([
            expect.objectContaining({
                providerId,
                name: "Inactive Provider Product",
                status: "INACTIVE",
            }),
        ]));
        expect(data.data.items.every((reward: any) => reward.providerId === providerId)).toBe(true);
    });

    it("should let an admin activate a provider product", async () => {
        const listResponse = await app.request(
            `/rewards/admin/point-shop?providerId=${providerId}&status=INACTIVE&page=1&pageSize=3`,
            { headers: { "Authorization": `Bearer ${adminToken}` } },
            env,
        );
        const list = await listResponse.json() as any;
        const inactiveRewardId = list.data.items[0].id;
        const res = await app.request(`/rewards/${inactiveRewardId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${adminToken}`,
            },
            body: JSON.stringify({ status: "ACTIVE" }),
        }, env);

        expect(res.status).toBe(200);
        const data = await res.json() as any;
        expect(data.data.status).toBe("ACTIVE");
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
            expect(data.data).toEqual(expect.arrayContaining([
                expect.objectContaining({ name: "Test Reward", source: "POINT_SHOP" }),
            ]));
            expect(data.data.every((reward: any) => reward.source === "POINT_SHOP")).toBe(true);
        });

        it("should retrieve only LEADERBOARD rewards", async () => {
            const res = await app.request("/rewards?source=LEADERBOARD", undefined, env);
            expect(res.status).toBe(200);
            const data = await res.json() as any;
            expect(data.data.length).toBe(1);
            expect(data.data[0].name).toBe("Leaderboard Reward");
        });
    });

    describe("Leaderboard Reward Management", () => {
        let leaderboardRewardId: string;

        it("should require a rank for leaderboard rewards", async () => {
            const res = await app.request("/rewards", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${adminToken}`,
                },
                body: JSON.stringify({
                    name: "Missing Rank Prize",
                    pointsRequired: 0,
                    stock: 1,
                    type: "PRODUCT",
                    source: "LEADERBOARD",
                    providerId,
                }),
            }, env);

            expect(res.status).toBe(400);
        });

        it("should configure one active reward for a leaderboard rank", async () => {
            const payload = {
                name: "Third Place Prize",
                description: "Leaderboard prize",
                pointsRequired: 0,
                stock: 1,
                type: "PRODUCT",
                source: "LEADERBOARD",
                leaderboardPosition: 3,
                providerId,
            };
            const res = await app.request("/rewards", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${adminToken}`,
                },
                body: JSON.stringify(payload),
            }, env);

            expect(res.status).toBe(201);
            const data = await res.json() as any;
            leaderboardRewardId = data.data.id;
            expect(data.data).toMatchObject({
                source: "LEADERBOARD",
                leaderboardPosition: 3,
                status: "ACTIVE",
            });

            const duplicate = await app.request("/rewards", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${adminToken}`,
                },
                body: JSON.stringify({ ...payload, name: "Duplicate Third Place" }),
            }, env);
            expect(duplicate.status).toBe(409);
        });

        it("should return provider-backed leaderboard configuration and archive a prize", async () => {
            const list = await app.request("/rewards/admin/leaderboard", {
                headers: { "Authorization": `Bearer ${adminToken}` },
            }, env);
            expect(list.status).toBe(200);
            const listData = await list.json() as any;
            expect(listData.data).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    id: leaderboardRewardId,
                    leaderboardPosition: 3,
                    provider: expect.objectContaining({ id: providerId, name: "Provider" }),
                }),
            ]));

            const archive = await app.request(`/rewards/${leaderboardRewardId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${adminToken}`,
                },
                body: JSON.stringify({ status: "INACTIVE" }),
            }, env);
            expect(archive.status).toBe(200);
            const archiveData = await archive.json() as any;
            expect(archiveData.data.status).toBe("INACTIVE");
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
            expect(data.data.status).toBe("INACTIVE");
        });

        it("should return only the authenticated provider's products", async () => {
            const res = await app.request(
                "/rewards/provider/me?status=INACTIVE&page=1&pageSize=10",
                { headers: { "Authorization": `Bearer ${verifiedProviderToken}` } },
                env,
            );
            const data = await res.json() as any;

            expect(res.status, JSON.stringify(data)).toBe(200);
            expect(data.data.items).toEqual([
                expect.objectContaining({
                    id: providerRewardId,
                    providerId: verifiedProviderId,
                    name: "Provider Reward",
                    status: "INACTIVE",
                }),
            ]);
            expect(data.data.pagination).toMatchObject({ total: 1, page: 1 });
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
            expect(data.data.status).toBe("INACTIVE");
        });

        it("should NOT allow a provider to publish their own reward", async () => {
            const res = await app.request(`/rewards/${providerRewardId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${verifiedProviderToken}`,
                },
                body: JSON.stringify({ status: "ACTIVE" }),
            }, env);

            expect(res.status).toBe(403);
        });
    });
});
