import { env } from "cloudflare:workers";
import { describe, it, expect, beforeAll } from "vitest";
import { applyMigrations, generateTestToken } from "../../test-setup";
import app from "../../index";
import { uuidv7 } from "uuidv7";

describe("Event Module", () => {
    let adminToken: string;
    let adminId: string;
    
    beforeAll(async () => {
        await applyMigrations();
        const { drizzle } = await import("drizzle-orm/d1");
        const { users } = await import("../../db/schema");
        const db = drizzle(env.DB);

        adminId = uuidv7();
        await db.insert(users).values({
            id: adminId, name: "Admin", email: "admin@test.com", password: "pwd",
            faceEmbeddingId: "admin", phoneNumber: "010", role: "ADMIN", status: "ACTIVE",
            birthDate: new Date().toISOString()
        });
        adminToken = await generateTestToken(adminId, "ADMIN");
    });

    it("should create an event successfully", async () => {
        const payload = {
            title: "Test Event",
            description: "A test event with radius",
            eventDate: new Date().toISOString(),
            attendanceStartTime: new Date().toISOString(),
            attendanceEndTime: new Date(Date.now() + 3600000).toISOString(),
            rewardPoints: 100,
            latitude: -6.200000,
            longitude: 106.816666,
            radiusMeters: 50
        };

        const res = await app.request("/events", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${adminToken}`
            },
            body: JSON.stringify(payload)
        }, env);

        const data = await res.json() as any;
        if (res.status === 500) {
            console.error("DEBUG EVENT CREATION 500 ERROR:", data);
        }
        expect(res.status).toBe(201);
        expect(data.message).toBe("Event created successfully");
        expect(data.data.title).toBe("Test Event");
        expect(data.data.rewardPoints).toBe(100);
        expect(data.data.radiusMeters).toBe(50);
    });

    it("should retrieve a list of events", async () => {
        const res = await app.request("/events", undefined, env);
        expect(res.status).toBe(200);
        const data = await res.json() as any;
        expect(data.data.length).toBeGreaterThan(0);
        expect(data.data[0].title).toBe("Test Event");
    });

    describe("Event Filtering by Timeframe", () => {
        beforeAll(async () => {
            const { drizzle } = await import("drizzle-orm/d1");
            const { events } = await import("../../db/schema");
            const db = drizzle(env.DB);
            
            const now = Date.now();
            
            // Upcoming Event (Published, starts in 1 day)
            await db.insert(events).values({
                id: uuidv7(),
                createdBy: adminId,
                title: "Upcoming Event",
                description: "Starts tomorrow",
                eventDate: new Date(now + 86400000),
                attendanceStartTime: new Date(now + 86400000),
                attendanceEndTime: new Date(now + 90000000),
                rewardPoints: 10,
                latitude: 0,
                longitude: 0,
                status: "PUBLISHED"
            });

            // Ongoing Event (Published, started 1 hour ago, ends in 1 hour)
            await db.insert(events).values({
                id: uuidv7(),
                createdBy: adminId,
                title: "Ongoing Event",
                description: "Happening now",
                eventDate: new Date(now),
                attendanceStartTime: new Date(now - 3600000),
                attendanceEndTime: new Date(now + 3600000),
                rewardPoints: 10,
                latitude: 0,
                longitude: 0,
                status: "PUBLISHED"
            });
            
            // Draft Event (Starts tomorrow but not published)
            await db.insert(events).values({
                id: uuidv7(),
                createdBy: adminId,
                title: "Draft Event",
                description: "Not published",
                eventDate: new Date(now + 86400000),
                attendanceStartTime: new Date(now + 86400000),
                attendanceEndTime: new Date(now + 90000000),
                rewardPoints: 10,
                latitude: 0,
                longitude: 0,
                status: "DRAFT"
            });
        });

        it("should retrieve only upcoming events when timeframe=upcoming", async () => {
            const res = await app.request("/events?timeframe=upcoming", undefined, env);
            expect(res.status).toBe(200);
            const data = await res.json() as any;
            expect(data.data.length).toBe(1);
            expect(data.data[0].title).toBe("Upcoming Event");
        });

        it("should retrieve only ongoing events when timeframe=ongoing", async () => {
            const res = await app.request("/events?timeframe=ongoing", undefined, env);
            expect(res.status).toBe(200);
            const data = await res.json() as any;
            expect(data.data.length).toBe(1);
            expect(data.data[0].title).toBe("Ongoing Event");
        });
    });
});
