import { env } from "cloudflare:workers";
import { describe, it, expect, beforeAll } from "vitest";
import { applyMigrations, generateTestToken } from "../../test-setup";
import app from "../../index";
import { uuidv7 } from "uuidv7";

describe("Event Module", () => {
    let adminToken: string;
    let adminId: string;
    let citizenToken: string;
    let draftEventId: string;
    
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

        const citizenId = uuidv7();
        await db.insert(users).values({
            id: citizenId, name: "Citizen", email: "citizen@test.com", password: "pwd",
            faceEmbeddingId: "citizen", phoneNumber: "011", role: "CITIZEN", status: "ACTIVE",
            birthDate: new Date().toISOString()
        });
        citizenToken = await generateTestToken(citizenId, "CITIZEN");
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
        expect(data.data.status).toBe("DRAFT");
        draftEventId = data.data.id;
    });

    it("should hide draft events from the public event list", async () => {
        const res = await app.request("/events", undefined, env);
        expect(res.status).toBe(200);
        const data = await res.json() as any;
        expect(data.data.every((event: any) => event.status === "PUBLISHED")).toBe(true);
        expect(data.data.some((event: any) => event.title === "Test Event")).toBe(false);
    });

    it("should require an admin session for the management event list", async () => {
        const unauthenticated = await app.request("/events/admin", undefined, env);
        expect(unauthenticated.status).toBe(401);

        const forbidden = await app.request("/events/admin", {
            headers: { "Authorization": `Bearer ${citizenToken}` }
        }, env);
        expect(forbidden.status).toBe(403);
    });

    it("should retrieve draft events for an admin", async () => {
        const res = await app.request("/events/admin?status=DRAFT", {
            headers: { "Authorization": `Bearer ${adminToken}` }
        }, env);
        expect(res.status).toBe(200);
        const data = await res.json() as any;
        expect(data.data.length).toBeGreaterThan(0);
        expect(data.data.every((event: any) => event.status === "DRAFT")).toBe(true);
        expect(data.data.some((event: any) => event.title === "Test Event")).toBe(true);
    });

    it("should create a published event with its banner URL", async () => {
        const bannerUrl = "https://kompak-api.test/storage/events/banner.png";
        const start = new Date(Date.now() + 86400000);
        const res = await app.request("/events", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                title: "Published Community Event",
                description: "Visible immediately after creation",
                eventDate: start.toISOString(),
                attendanceStartTime: start.toISOString(),
                attendanceEndTime: new Date(start.getTime() + 3600000).toISOString(),
                rewardPoints: 25,
                latitude: -6.2,
                longitude: 106.816666,
                radiusMeters: 75,
                status: "PUBLISHED",
                bannerUrl,
            })
        }, env);

        expect(res.status).toBe(201);
        const data = await res.json() as any;
        expect(data.data.status).toBe("PUBLISHED");
        expect(data.data.bannerUrl).toBe(bannerUrl);

        const publicResponse = await app.request("/events", undefined, env);
        const publicData = await publicResponse.json() as any;
        expect(
            publicData.data.some((event: any) =>
                event.id === data.data.id && event.bannerUrl === bannerUrl
            )
        ).toBe(true);
    });

    it("should reject invalid event schedules and coordinates", async () => {
        const start = new Date(Date.now() + 86400000);
        const res = await app.request("/events", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                title: "Invalid Event",
                description: "Invalid schedule and coordinates",
                eventDate: start.toISOString(),
                attendanceStartTime: start.toISOString(),
                attendanceEndTime: start.toISOString(),
                rewardPoints: 10,
                latitude: 91,
                longitude: 181,
            })
        }, env);

        expect(res.status).toBe(400);
    });

    it("should validate uploads and reserve event images for admins", async () => {
        const forbidden = await app.request("/storage/upload-url", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${citizenToken}`
            },
            body: JSON.stringify({
                folder: "events",
                contentType: "image/png",
                contentLength: 1024,
            })
        }, env);
        expect(forbidden.status).toBe(403);

        const invalidType = await app.request("/storage/upload-url", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                folder: "events",
                contentType: "application/pdf",
                contentLength: 1024,
            })
        }, env);
        expect(invalidType.status).toBe(400);

        const tooLarge = await app.request("/storage/upload-url", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                folder: "events",
                contentType: "image/jpeg",
                contentLength: 5 * 1024 * 1024 + 1,
            })
        }, env);
        expect(tooLarge.status).toBe(400);
    });

    it("should let an admin publish a draft event", async () => {
        const res = await app.request(`/events/${draftEventId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${adminToken}`
            },
            body: JSON.stringify({ status: "PUBLISHED" })
        }, env);

        expect(res.status).toBe(200);
        const data = await res.json() as any;
        expect(data.data.status).toBe("PUBLISHED");
    });

    it("should reject invalid event status transitions", async () => {
        const res = await app.request(`/events/${draftEventId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${adminToken}`
            },
            body: JSON.stringify({ status: "DRAFT" })
        }, env);

        expect(res.status).toBe(400);
        const data = await res.json() as any;
        expect(data.message).toBe("Cannot update event status from PUBLISHED to DRAFT");
    });

    it("should let an admin close a published event", async () => {
        const res = await app.request(`/events/${draftEventId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${adminToken}`
            },
            body: JSON.stringify({ status: "CLOSED" })
        }, env);

        expect(res.status).toBe(200);
        const data = await res.json() as any;
        expect(data.data.status).toBe("CLOSED");
    });

    it("should let an admin cancel a published event", async () => {
        const createResponse = await app.request("/events", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                title: "Event to Cancel",
                description: "An event used to verify cancellation",
                eventDate: new Date(Date.now() + 86400000).toISOString(),
                attendanceStartTime: new Date(Date.now() + 86400000).toISOString(),
                attendanceEndTime: new Date(Date.now() + 90000000).toISOString(),
                rewardPoints: 10,
                latitude: -6.2,
                longitude: 106.8
            })
        }, env);
        const created = await createResponse.json() as any;
        const eventId = created.data.id;

        await app.request(`/events/${eventId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${adminToken}`
            },
            body: JSON.stringify({ status: "PUBLISHED" })
        }, env);

        const cancelResponse = await app.request(`/events/${eventId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${adminToken}`
            },
            body: JSON.stringify({ status: "CANCELLED" })
        }, env);

        expect(cancelResponse.status).toBe(200);
        const cancelled = await cancelResponse.json() as any;
        expect(cancelled.data.status).toBe("CANCELLED");
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
            expect(data.data.some((event: any) => event.title === "Upcoming Event")).toBe(true);
            expect(data.data.some((event: any) => event.title === "Draft Event")).toBe(false);
            expect(data.data.every((event: any) => event.status === "PUBLISHED")).toBe(true);
        });

        it("should retrieve only ongoing events when timeframe=ongoing", async () => {
            const res = await app.request("/events?timeframe=ongoing", undefined, env);
            expect(res.status).toBe(200);
            const data = await res.json() as any;
            expect(data.data.length).toBe(1);
            expect(data.data[0].title).toBe("Ongoing Event");
        });

        it("should keep drafts out of the unfiltered public list", async () => {
            const res = await app.request("/events", undefined, env);
            expect(res.status).toBe(200);
            const data = await res.json() as any;
            expect(data.data.every((event: any) => event.status === "PUBLISHED")).toBe(true);
            expect(data.data.some((event: any) => event.title === "Draft Event")).toBe(false);
        });
    });
});
