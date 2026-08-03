import { env } from "cloudflare:workers";
import { describe, it, expect, beforeAll } from "vitest";
import { applyMigrations, generateTestToken } from "../../test-setup";
import app from "../../index";
import { uuidv7 } from "uuidv7";

describe("Badges Module", () => {
    let adminId: string;
    let userId: string;
    let adminToken: string;
    let userToken: string;
    let badgeDefId: string;

    beforeAll(async () => {
        await applyMigrations();

        const { drizzle } = await import("drizzle-orm/d1");
        const { users } = await import("../../db/schema");
        const db = drizzle(env.DB);

        adminId = uuidv7();
        await db.insert(users).values({
            id: adminId, name: "Admin", email: "badgeadmin@test.com", password: "pwd",
            faceEmbeddingId: "badge-admin", phoneNumber: "090", role: "ADMIN", status: "ACTIVE",
            birthDate: new Date().toISOString()
        });

        userId = uuidv7();
        await db.insert(users).values({
            id: userId, name: "Badge User", email: "badge@test.com", password: "pwd",
            faceEmbeddingId: "badge-user", phoneNumber: "091", role: "CITIZEN", status: "ACTIVE",
            balance: 0, leaderboardPoints: 0,
            birthDate: new Date().toISOString()
        });

        adminToken = await generateTestToken(adminId, "ADMIN");
        userToken = await generateTestToken(userId, "CITIZEN");
    });

    it("should allow admin to create a badge definition", async () => {
        const payload = {
            name: "Test Special Badge",
            description: "A special badge for testing",
            category: "SPECIAL",
            criteria: "Admin manually awards this"
        };
        const res = await app.request("/badges", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${adminToken}`
            },
            body: JSON.stringify(payload)
        }, env);

        expect(res.status).toBe(201);
        const data = await res.json() as any;
        expect(data.data.badgeId).toBeDefined();
        badgeDefId = data.data.badgeId;
    });

    it("should prevent citizen from creating a badge definition", async () => {
        const payload = {
            name: "Citizen Badge",
            description: "A badge created by citizen",
            category: "SPECIAL",
            criteria: "Should fail"
        };
        const res = await app.request("/badges", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${userToken}`
            },
            body: JSON.stringify(payload)
        }, env);

        expect(res.status).toBe(403);
    });

    it("should list badge definitions", async () => {
        const res = await app.request("/badges", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${userToken}`
            }
        }, env);

        expect(res.status).toBe(200);
        const data = await res.json() as any;
        expect(data.data.length).toBeGreaterThan(0);
        expect(data.data[0].id).toBe(badgeDefId);
    });

    it("should allow admin to award a special badge", async () => {
        const payload = {
            userId: userId,
            badgeDefinitionId: badgeDefId,
            reason: "Great job!"
        };
        const res = await app.request("/badges/award", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${adminToken}`
            },
            body: JSON.stringify(payload)
        }, env);

        expect(res.status).toBe(201);
        const data = await res.json() as any;
        expect(data.message).toBe("Special badge awarded successfully");
        expect(data.data.awardId).toBeDefined();
    });

    it("should allow user to view their earned badges", async () => {
        const res = await app.request("/badges/me", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${userToken}`
            }
        }, env);

        expect(res.status).toBe(200);
        const data = await res.json() as any;
        expect(data.data.length).toBe(1);
        expect(data.data[0].badgeDefinitionId).toBe(badgeDefId);
        expect(data.data[0].reason).toBe("Great job!");
    });
});
