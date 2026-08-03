import { env } from "cloudflare:workers";
import { describe, it, expect, beforeAll } from "vitest";
import { applyMigrations, generateTestToken } from "../../test-setup";
import app from "../../index";
import { uuidv7 } from "uuidv7";

describe("User Module", () => {
    let adminToken: string;

    beforeAll(async () => {
        await applyMigrations();
        const { drizzle } = await import("drizzle-orm/d1");
        const { users } = await import("../../db/schema");
        const db = drizzle(env.DB);

        const adminId = uuidv7();
        await db.insert(users).values({
            id: adminId, name: "Admin", email: "admin2@test.com", password: "pwd",
            faceEmbeddingId: "admin", phoneNumber: "010", role: "ADMIN", status: "ACTIVE",
            birthDate: new Date().toISOString()
        });
        adminToken = await generateTestToken(adminId, "ADMIN");
    });

    it("should register a new user successfully", async () => {
        const payload = {
            name: "Test User",
            email: "test@example.com",
            password: "password123",
            phoneNumber: "08123456789",
            birthDate: "1990-01-01",
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
            phoneNumber: "08123456789",
            birthDate: "1990-01-01",
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
        const listRes = await app.request("/users", {
            headers: { "Authorization": `Bearer ${adminToken}` }
        }, env);
        const listData = await listRes.json() as any;
        const userId = listData.data.find((u: any) => u.email === "test@example.com").id;

        const res = await app.request(`/users/${userId}`, {
            headers: { "Authorization": `Bearer ${adminToken}` }
        }, env);
        expect(res.status).toBe(200);
        const data = await res.json() as any;
        expect(data.data.email).toBe("test@example.com");
    });
});
