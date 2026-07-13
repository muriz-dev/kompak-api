import { env } from "cloudflare:workers";
import { describe, it, expect, beforeAll } from "vitest";
import { applyMigrations, generateTestToken } from "../../test-setup";
import app from "../../index";
import { uuidv7 } from "uuidv7";

describe("Point Transaction Module", () => {
    let userId: string;
    let adminToken: string;
    let userToken: string;

    beforeAll(async () => {
        await applyMigrations();

        // Create a user for point transaction tests
        const userPayload = {
            name: "Points User",
            email: "points@example.com",
            password: "password",
            faceEmbeddingId: "face-points-123"
        };
        const uRes = await app.request("/users/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userPayload)
        }, env);
        const uData = await uRes.json() as any;
        userId = uData.data.id;

        const adminId = uuidv7();
        adminToken = await generateTestToken(adminId, "ADMIN");
        userToken = await generateTestToken(userId, "USER");
    });

    it("should manually create a point transaction", async () => {
        const payload = {
            userId: userId,
            amount: 150,
            transactionType: "ATTENDANCE_REWARD"
        };

        const res = await app.request("/point-transactions", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${adminToken}`
            },
            body: JSON.stringify(payload)
        }, env);

        expect(res.status).toBe(201);
        const data = await res.json() as any;
        expect(data.message).toBe("Point transaction created successfully");
        expect(data.data.amount).toBe(150);
        expect(data.data.transactionType).toBe("ATTENDANCE_REWARD");
    });

    it("should retrieve a list of all point transactions", async () => {
        const res = await app.request("/point-transactions", {
            headers: {
                "Authorization": `Bearer ${adminToken}`
            }
        }, env);
        expect(res.status).toBe(200);
        const data = await res.json() as any;
        expect(data.data.length).toBeGreaterThan(0);

        // Make sure our manual transaction is there
        const tx = data.data.find((tx: any) => tx.transactionType === "ATTENDANCE_REWARD");
        expect(tx).toBeDefined();
    });

    it("should retrieve point transactions for a specific user", async () => {
        const res = await app.request(`/point-transactions/user/${userId}`, {
            headers: {
                "Authorization": `Bearer ${userToken}`
            }
        }, env);
        expect(res.status).toBe(200);
        const data = await res.json() as any;
        expect(data.data.length).toBe(1);
        expect(data.data[0].amount).toBe(150);
    });
});
