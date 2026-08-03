import { env } from "cloudflare:workers";
import { describe, it, expect, beforeAll } from "vitest";
import { applyMigrations, generateTestToken } from "../../test-setup";
import app from "../../index";
import { uuidv7 } from "uuidv7";

describe("Announcements Module", () => {
    let adminToken: string;
    let userToken: string;
    let announcementId: string;

    beforeAll(async () => {
        await applyMigrations();

        const { drizzle } = await import("drizzle-orm/d1");
        const { users } = await import("../../db/schema");
        const db = drizzle(env.DB);

        // 1. Create Admin
        const adminId = uuidv7();
        await db.insert(users).values({
            id: adminId, name: "Admin Announcement", email: "adminann@test.com", password: "pwd",
            faceEmbeddingId: "admin-ann", phoneNumber: "0100", role: "ADMIN", status: "ACTIVE",
            birthDate: new Date().toISOString()
        });
        adminToken = await generateTestToken(adminId, "ADMIN");

        // 2. Create Citizen
        const userId = uuidv7();
        await db.insert(users).values({
            id: userId, name: "User Announcement", email: "userann@test.com", password: "pwd",
            faceEmbeddingId: "user-ann", phoneNumber: "0101", role: "CITIZEN", status: "ACTIVE",
            birthDate: new Date().toISOString()
        });
        userToken = await generateTestToken(userId, "CITIZEN");
    });

    it("should allow admin to create an announcement", async () => {
        const payload = {
            title: "Important Update",
            description: "System maintenance will occur this weekend.",
        };
        const res = await app.request("/announcements", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${adminToken}`
            },
            body: JSON.stringify(payload)
        }, env);

        expect(res.status).toBe(201);
        const data = await res.json() as any;
        expect(data.data.announcementId).toBeDefined();
        announcementId = data.data.announcementId;
    });

    it("should prevent citizen from creating an announcement", async () => {
        const payload = {
            title: "Citizen Update",
            description: "I want to broadcast something.",
        };
        const res = await app.request("/announcements", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${userToken}`
            },
            body: JSON.stringify(payload)
        }, env);

        expect(res.status).toBe(403);
    });

    it("should allow citizen to view announcements list", async () => {
        const res = await app.request("/announcements", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${userToken}`
            }
        }, env);

        expect(res.status).toBe(200);
        const data = await res.json() as any;
        expect(Array.isArray(data.data)).toBe(true);
        expect(data.data.length).toBeGreaterThan(0);
        expect(data.data[0].id).toBe(announcementId);
    });

    it("should allow citizen to view specific announcement details", async () => {
        const res = await app.request(`/announcements/${announcementId}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${userToken}`
            }
        }, env);

        expect(res.status).toBe(200);
        const data = await res.json() as any;
        expect(data.data.title).toBe("Important Update");
        expect(data.data.description).toContain("maintenance");
    });

    it("should allow admin to delete announcement", async () => {
        const res = await app.request(`/announcements/${announcementId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${adminToken}`
            }
        }, env);

        expect(res.status).toBe(200);

        // Verify deletion
        const getRes = await app.request(`/announcements/${announcementId}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${userToken}`
            }
        }, env);
        expect(getRes.status).toBe(404);
    });
});
