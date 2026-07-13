import { env } from "cloudflare:workers";
import { describe, it, expect, beforeAll } from "vitest";
import { applyMigrations } from "../../test-setup";
import app from "../../index";

describe("User Module", () => {
    beforeAll(async () => {
        await applyMigrations();
    });

    it("should register a new user successfully", async () => {
        const payload = {
            name: "Test User",
            email: "test@example.com",
            password: "password123",
            faceEmbeddingId: "face-123"
        };

        const res = await app.request("/users/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        }, env);

        expect(res.status).toBe(201);
        const data = await res.json() as any;
        expect(data.message).toBe("Registration successful. Please wait for admin approval.");
        expect(data.data.email).toBe("test@example.com");
        expect(data.data.status).toBe("PENDING");
        expect(data.data.password).toBeUndefined();
    });

    it("should fail to register with duplicate email", async () => {
        const payload = {
            name: "Test User 2",
            email: "test@example.com",
            password: "password123",
            faceEmbeddingId: "face-456"
        };

        const res = await app.request("/users/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        }, env);

        expect(res.status).toBe(400);
        const data = await res.json() as any;
        expect(data.message).toBe("Email already registered");
    });

    it("should retrieve a user by ID", async () => {
        // First get the users list to grab the ID
        const listRes = await app.request("/users", undefined, env);
        const listData = await listRes.json() as any;
        const userId = listData.data[0].id;

        const res = await app.request(`/users/${userId}`, undefined, env);
        expect(res.status).toBe(200);
        const data = await res.json() as any;
        expect(data.data.email).toBe("test@example.com");
    });
});
