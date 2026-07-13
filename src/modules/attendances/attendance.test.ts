import { env } from "cloudflare:workers";
import { describe, it, expect, beforeAll } from "vitest";
import { applyMigrations } from "../../test-setup";
import app from "../../index";

describe("Attendance Module", () => {
    let userId: string;
    let eventId: string;

    beforeAll(async () => {
        await applyMigrations();

        // 1. Create a user
        const userPayload = {
            name: "Attendance User",
            email: "att@example.com",
            password: "password",
            faceEmbeddingId: "face-att-123"
        };
        const uRes = await app.request("/users/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userPayload)
        }, env);
        const uData = await uRes.json() as any;
        userId = uData.data.id;

        const now = new Date();
        const past = new Date(now.getTime() - 1000 * 60 * 60); // 1 hr ago
        const future = new Date(now.getTime() + 1000 * 60 * 60); // 1 hr future

        // 2. Create an event
        const eventPayload = {
            title: "Attendance Event",
            eventDate: new Date().toISOString(),
            attendanceStartTime: past.toISOString(),
            attendanceEndTime: future.toISOString(),
            rewardPoints: 50,
            latitude: -6.200000,
            longitude: 106.816666,
            radiusMeters: 100 // 100 meters
        };
        const eRes = await app.request("/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(eventPayload)
        }, env);
        const eData = await eRes.json() as any;
        eventId = eData.data.id;
    });

    it("should fail attendance if user is PENDING", async () => {
        const attPayload = {
            faceEmbeddingId: "face-att-123",
            eventId: eventId,
            latitude: -6.200000,
            longitude: 106.816666
        };
        const res = await app.request("/attendances", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(attPayload)
        }, env);

        expect(res.status).toBe(403);
        const data = await res.json() as any;
        expect(data.message).toBe("User account is pending approval or rejected");
    });

    it("should approve user", async () => {
        const res = await app.request(`/users/${userId}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "APPROVED" })
        }, env);

        expect(res.status).toBe(200);
        const data = await res.json() as any;
        expect(data.data.status).toBe("APPROVED");
    });

    it("should fail attendance if outside radius", async () => {
        const attPayload = {
            faceEmbeddingId: "face-att-123",
            eventId: eventId,
            latitude: -6.100000, // Far away
            longitude: 106.816666
        };
        const res = await app.request("/attendances", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(attPayload)
        }, env);

        expect(res.status).toBe(400);
        const data = await res.json() as any;
        expect(data.message).toBe("User is not within the event radius");
    });

    it("should successfully record attendance and give points", async () => {
        const attPayload = {
            faceEmbeddingId: "face-att-123",
            eventId: eventId,
            latitude: -6.200000, // Exact same location
            longitude: 106.816666
        };
        const res = await app.request("/attendances", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(attPayload)
        }, env);

        expect(res.status).toBe(201);
        const data = await res.json() as any;
        expect(data.message).toBe("Attendance recorded successfully");
        expect(data.data.pointsEarned).toBe(50);
    });

    it("should prevent duplicate attendance", async () => {
        const attPayload = {
            faceEmbeddingId: "face-att-123",
            eventId: eventId,
            latitude: -6.200000,
            longitude: 106.816666
        };
        const res = await app.request("/attendances", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(attPayload)
        }, env);

        expect(res.status).toBe(409);
        const data = await res.json() as any;
        expect(data.message).toBe("User has already attended this event");
    });
});
