import { env } from "cloudflare:workers";
import { describe, it, expect, beforeAll } from "vitest";
import { applyMigrations } from "../../test-setup";
import app from "../../index";

describe("Reward Module", () => {
    let rewardId: string;

    beforeAll(async () => {
        await applyMigrations();
    });

    it("should create a reward successfully", async () => {
        const payload = {
            name: "Test Reward",
            pointsRequired: 100,
            stock: 50,
            category: "VOUCHER"
        };

        const res = await app.request("/rewards", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
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
