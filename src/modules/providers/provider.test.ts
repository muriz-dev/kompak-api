import { env } from "cloudflare:workers";
import { describe, it, expect, beforeAll } from "vitest";
import { applyMigrations, generateTestToken } from "../../test-setup";
import app from "../../index";
import { uuidv7 } from "uuidv7";

describe("Provider Module", () => {
    let userToken: string;
    let adminToken: string;
    let userId: string;
    let providerId: string;
    
    beforeAll(async () => {
        await applyMigrations();
        userId = uuidv7();
        const adminId = uuidv7();
        
        // Insert user into DB to satisfy provider's ownerId foreign key
        const { drizzle } = await import("drizzle-orm/d1");
        const { users } = await import("../../db/schema");
        const db = drizzle(env.DB);
        await db.insert(users).values({
            id: userId,
            name: "Test User",
            email: "test@example.com",
            password: "password123", // added mandatory field
            faceEmbeddingId: "dummy-face-id", // added mandatory field
            phoneNumber: "08123456789", // added mandatory field
            birthDate: new Date().toISOString(),
            role: "CITIZEN",
            status: "ACTIVE",
            balance: 100,
        });
        await db.insert(users).values({
            id: adminId,
            name: "Provider Admin",
            email: "provider-admin@example.com",
            password: "password123",
            faceEmbeddingId: "provider-admin-face-id",
            phoneNumber: "08987654321",
            birthDate: new Date().toISOString(),
            role: "ADMIN",
            status: "ACTIVE",
        });

        userToken = await generateTestToken(userId, "CITIZEN");
        adminToken = await generateTestToken(adminId, "ADMIN");
    });


    it("should create a provider successfully", async () => {
        const payload = {
            name: "Test Provider",
            address: "123 Test St",
            latitude: -6.200000,
            longitude: 106.816666,
        };

        const res = await app.request("/providers", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${userToken}`
            },
            body: JSON.stringify(payload)
        }, env);

        expect(res.status).toBe(201);
        const data = await res.json() as any;
        expect(data.message).toBe("Provider created successfully");
        expect(data.data.name).toBe("Test Provider");
        expect(data.data.status).toBe("PENDING");
        providerId = data.data.id;
    });

    it("should retrieve a list of providers", async () => {
        const res = await app.request("/providers", undefined, env);
        expect(res.status).toBe(200);
        const data = await res.json() as any;
        expect(data.data.length).toBeGreaterThan(0);
        expect(data.data[0].name).toBe("Test Provider");
    });

    it("should return the authenticated user's provider state", async () => {
        const res = await app.request("/providers/me", {
            headers: { "Authorization": `Bearer ${userToken}` },
        }, env);
        const data = await res.json() as any;

        expect(res.status, JSON.stringify(data)).toBe(200);
        expect(data.data).toMatchObject({
            id: providerId,
            ownerId: userId,
            name: "Test Provider",
            status: "PENDING",
            stats: { completedPoints: 0, activeProducts: 0 },
        });
        expect(data.data.products).toEqual([]);
        expect(data.data.owner.password).toBeUndefined();
        expect(data.data.owner.faceEmbeddingId).toBeUndefined();
    });

    it("should prevent duplicate provider registrations for one owner", async () => {
        const res = await app.request("/providers", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${userToken}`,
            },
            body: JSON.stringify({
                name: "Duplicate Provider",
                address: "Duplicate Address",
                latitude: -6.2,
                longitude: 106.8,
            }),
        }, env);

        expect(res.status).toBe(409);
    });

    it("should protect the admin provider list", async () => {
        const res = await app.request("/providers/admin", {
            headers: { "Authorization": `Bearer ${userToken}` },
        }, env);
        expect(res.status).toBe(403);
    });

    it("should return a filtered and paginated admin provider list", async () => {
        const res = await app.request(
            "/providers/admin?query=Test&status=PENDING&page=1&pageSize=4",
            { headers: { "Authorization": `Bearer ${adminToken}` } },
            env,
        );
        const data = await res.json() as any;

        expect(res.status, JSON.stringify(data)).toBe(200);
        expect(data.data.items).toHaveLength(1);
        expect(data.data.items[0]).toMatchObject({
            id: providerId,
            name: "Test Provider",
            status: "PENDING",
            owner: { id: userId, name: "Test User" },
        });
        expect(data.data.pagination).toMatchObject({
            page: 1,
            pageSize: 4,
            total: 1,
            totalPages: 1,
        });
        expect(data.data.items[0].owner.password).toBeUndefined();
        expect(data.data.items[0].owner.faceEmbeddingId).toBeUndefined();
    });

    it("should verify a provider and return admin detail aggregates", async () => {
        const verifyResponse = await app.request(`/providers/${providerId}/status`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${adminToken}`,
            },
            body: JSON.stringify({ status: "VERIFIED" }),
        }, env);
        expect(verifyResponse.status).toBe(200);

        const { drizzle } = await import("drizzle-orm/d1");
        const { rewardRedemptions, rewards } = await import("../../db/schema");
        const db = drizzle(env.DB);
        const rewardId = uuidv7();
        await db.insert(rewards).values({
            id: rewardId,
            providerId,
            name: "Admin Detail Reward",
            description: "A provider product",
            pointsRequired: 25,
            stock: 2,
            type: "PRODUCT",
            source: "POINT_SHOP",
            status: "ACTIVE",
        });
        await db.insert(rewardRedemptions).values({
            id: uuidv7(),
            userId,
            rewardId,
            providerId,
            pointsSpent: 25,
            idempotencyKey: "provider-admin-detail",
            status: "COMPLETED",
            completedAt: new Date(),
            expiresAt: new Date(Date.now() + 86_400_000),
        });

        const detailResponse = await app.request(`/providers/admin/${providerId}`, {
            headers: { "Authorization": `Bearer ${adminToken}` },
        }, env);
        const data = await detailResponse.json() as any;

        expect(detailResponse.status, JSON.stringify(data)).toBe(200);
        expect(data.data).toMatchObject({
            id: providerId,
            status: "VERIFIED",
            stats: { completedPoints: 25, activeProducts: 1 },
        });
        expect(data.data.products).toHaveLength(1);
        expect(data.data.products[0]).toMatchObject({
            id: rewardId,
            name: "Admin Detail Reward",
            stock: 1,
        });
    });

    it("should allow an admin to archive a verified provider", async () => {
        const response = await app.request(`/providers/${providerId}/status`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${adminToken}`,
            },
            body: JSON.stringify({ status: "INACTIVE" }),
        }, env);
        const data = await response.json() as any;

        expect(response.status, JSON.stringify(data)).toBe(200);
        expect(data.data.status).toBe("INACTIVE");
    });
});
