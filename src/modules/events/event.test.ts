import { env } from "cloudflare:workers";
import { describe, it, expect, beforeAll } from "vitest";
import { applyMigrations } from "../../test-setup";
import app from "../../index";

describe("Event Module", () => {
    beforeAll(async () => {
        await applyMigrations();
    });

    it("should create an event successfully", async () => {
        const payload = {
            title: "Test Event",
            description: "A test event with radius",
            eventDate: new Date().toISOString(),
            rewardPoints: 100,
            latitude: -6.200000,
            longitude: 106.816666,
            radiusMeters: 50
        };

        const res = await app.request("/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        }, env);

        expect(res.status).toBe(201);
        const data = await res.json() as any;
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
});
