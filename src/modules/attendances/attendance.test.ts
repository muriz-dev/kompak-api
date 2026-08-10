import { env } from "cloudflare:workers";
import { describe, it, expect, beforeAll } from "vitest";
import { applyMigrations, generateTestToken } from "../../test-setup";
import app from "../../index";
import { uuidv7 } from "uuidv7";

describe("Attendance Module", () => {
    let userId: string;
    let eventId: string;
    let userToken: string;
    let adminToken: string;

    beforeAll(async () => {
        await applyMigrations();

        const { drizzle } = await import("drizzle-orm/d1");
        const { users, events } = await import("../../db/schema");
        const db = drizzle(env.DB);

        // Insert Admin
        const adminId = uuidv7();
        await db.insert(users).values({
            id: adminId, name: "Admin", email: "admin@test.com", password: "pwd",
            faceEmbeddingId: "face-admin", phoneNumber: "081", role: "ADMIN", status: "ACTIVE",
            birthDate: new Date().toISOString()
        });

        // Insert Citizen
        userId = uuidv7();
        await db.insert(users).values({
            id: userId, name: "Att User", email: "att@test.com", password: "pwd",
            faceEmbeddingId: "face-att", phoneNumber: "082", role: "CITIZEN", status: "ACTIVE",
            balance: 0, leaderboardPoints: 0,
            birthDate: new Date().toISOString()
        });

        adminToken = await generateTestToken(adminId, "ADMIN");
        userToken = await generateTestToken(userId, "CITIZEN");

        const now = new Date();
        const past = new Date(now.getTime() - 1000 * 60 * 60); // 1 hr ago
        const future = new Date(now.getTime() + 1000 * 60 * 60); // 1 hr future

        // Create an event directly in DB
        eventId = uuidv7();
        await db.insert(events).values({
            id: eventId,
            title: "Test Event",
            description: "Test Desc",
            status: "PUBLISHED",
            eventDate: now,
            attendanceStartTime: past,
            attendanceEndTime: future,
            rewardPoints: 50,
            latitude: -6.200000,
            longitude: 106.816666,
            radiusMeters: 100,
            createdBy: adminId
        });


    });

    it("should fail attendance if outside radius", async () => {
        const attPayload = {
            eventId: eventId,
            latitude: -6.100000, // Far away
            longitude: 106.816666,
            activityDescription: "Attending!"
        };
        const res = await app.request("/attendances", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${userToken}`
            },
            body: JSON.stringify(attPayload)
        }, env);

        expect(res.status).toBe(400);
        const data = await res.json() as any;
        expect(data.message).toBe("User is not within the event radius");
    });



    it("should successfully record attendance and give points", async () => {
        const attPayload = {
            eventId: eventId,
            latitude: -6.200000, // Exact same location
            longitude: 106.816666,
            activityPhotoUrl: "https://example.com/photo.jpg"
        };
        const res = await app.request("/attendances", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${userToken}`
            },
            body: JSON.stringify(attPayload)
        }, env);

        expect(res.status).toBe(201);
        const data = await res.json() as any;
        expect(data.message).toBe("Attendance recorded successfully");
        expect(data.data.pointsEarned).toBe(50);
        expect(data.data.attendanceId).toBeDefined();
    });

    it("should prevent duplicate attendance", async () => {
        const attPayload = {
            eventId: eventId,
            latitude: -6.200000,
            longitude: 106.816666
        };
        const res = await app.request("/attendances", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${userToken}`
            },
            body: JSON.stringify(attPayload)
        }, env);

        expect(res.status).toBe(409);
        const data = await res.json() as any;
        expect(data.message).toBe("User has already attended this event");
    });

    it("should retrieve user's own attendances", async () => {
        const res = await app.request("/attendances/me", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${userToken}`
            }
        }, env);

        expect(res.status).toBe(200);
        const data = await res.json() as any;
        expect(data.data.length).toBeGreaterThan(0);
        expect(data.data[0].eventId).toBe(eventId);
        expect(data.data[0].activityPhotoUrl).toBe("https://example.com/photo.jpg");
    });

    it("should allow admin to retrieve event attendances", async () => {
        const res = await app.request(`/attendances/event/${eventId}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${adminToken}`
            }
        }, env);

        expect(res.status).toBe(200);
        const data = await res.json() as any;
        expect(data.data.length).toBeGreaterThan(0);
        expect(data.data[0].userId).toBe(userId);
        expect(data.data[0].eventTransaction.points).toBe(50);
        expect(data.data[0].user.password).toBeUndefined();
        expect(data.data[0].user.faceEmbeddingId).toBeUndefined();
    });

    it("should prevent citizen from retrieving event attendances", async () => {
        const res = await app.request(`/attendances/event/${eventId}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${userToken}` // User is citizen
            }
        }, env);

        expect(res.status).toBe(403);
    });

    it("should let an admin delete an event that already has attendance history", async () => {
        const res = await app.request(`/events/${eventId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${adminToken}`
            }
        }, env);

        expect(res.status).toBe(200);

        const detail = await app.request(`/events/admin/${eventId}`, {
            headers: {
                "Authorization": `Bearer ${adminToken}`
            }
        }, env);
        expect(detail.status).toBe(404);
    });
});
