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
});
