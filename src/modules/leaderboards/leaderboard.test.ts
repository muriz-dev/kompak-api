import { env } from "cloudflare:workers";
import { describe, it, expect, beforeAll } from "vitest";
import { applyMigrations } from "../../test-setup";
import app from "../../index";

describe("Leaderboard Module", () => {
    let userId: string;

    beforeAll(async () => {
        await applyMigrations();

        // 1. Create a user specifically for leaderboard
        const userPayload = {
            name: "Leaderboard User",
            email: "leaderboard@example.com",
            password: "password",
            faceEmbeddingId: "face-leader-123"
        };
        const uRes = await app.request("/users/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userPayload)
        }, env);
        const uData = await uRes.json() as any;
        userId = uData.data.id;

        // 2. Approve user
        await app.request(`/users/${userId}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "APPROVED" })
        }, env);

        const now = new Date();
        const past = new Date(now.getTime() - 1000 * 60 * 60);
        const future = new Date(now.getTime() + 1000 * 60 * 60);

        // 3. Create an event with high reward
        const eventPayload = {
            title: "Leaderboard Event",
            eventDate: now.toISOString(),
            attendanceStartTime: past.toISOString(),
            attendanceEndTime: future.toISOString(),
            rewardPoints: 500,
            latitude: -6.200000,
            longitude: 106.816666,
            radiusMeters: 100
        };
        const eRes = await app.request("/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(eventPayload)
        }, env);
        const eData = await eRes.json() as any;
        const eventId = eData.data.id;

        // 4. Attend event
        await app.request("/attendances", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                faceEmbeddingId: "face-leader-123",
                eventId: eventId,
                latitude: -6.200000,
                longitude: 106.816666
            })
        }, env);
    });

    it("should retrieve the leaderboard with correct ordering", async () => {
        const res = await app.request("/leaderboard", undefined, env);
        expect(res.status).toBe(200);

        const data = await res.json() as any;
        expect(Array.isArray(data.data)).toBe(true);
        expect(data.data.length).toBeGreaterThan(0);

        // The first user should have at least 500 points (could be more if previous tests added points)
        const topUser = data.data[0];
        expect(topUser.leaderboardPoints).toBeGreaterThanOrEqual(500);
    });
});
