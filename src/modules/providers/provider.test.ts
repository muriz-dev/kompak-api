import { env } from "cloudflare:workers";
import { describe, it, expect, beforeAll } from "vitest";
import { applyMigrations, generateTestToken } from "../../test-setup";
import app from "../../index";
import { uuidv7 } from "uuidv7";

describe("Provider Module", () => {
    let userToken: string;
    
    beforeAll(async () => {
        await applyMigrations();
        const userId = uuidv7();
        
        // Insert user into DB to satisfy provider's ownerId foreign key
        const { drizzle } = await import("drizzle-orm/d1");
        const { users } = await import("../../db/schema");
        const db = drizzle(env.DB);
        await db.insert(users).values({
            id: userId,
            name: "Test User",
            email: "test@example.com",
            password: "password123", // added mandatory field
            faceEmbeddingId: "dummy-face-id", // added mandatory field
            phoneNumber: "08123456789", // added mandatory field
            birthDate: new Date().toISOString(),
            role: "CITIZEN"
        });

        userToken = await generateTestToken(userId, "CITIZEN");
    });


    it("should create a provider successfully", async () => {
        const payload = {
            name: "Test Provider",
            address: "123 Test St",
            latitude: -6.200000,
            longitude: 106.816666,
        };

        const res = await app.request("/providers", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${userToken}`
            },
            body: JSON.stringify(payload)
        }, env);

        expect(res.status).toBe(201);
        const data = await res.json() as any;
        expect(data.message).toBe("Provider created successfully");
        expect(data.data.name).toBe("Test Provider");
        expect(data.data.status).toBe("PENDING");
    });

    it("should retrieve a list of providers", async () => {
        const res = await app.request("/providers", undefined, env);
        expect(res.status).toBe(200);
        const data = await res.json() as any;
        expect(data.data.length).toBeGreaterThan(0);
        expect(data.data[0].name).toBe("Test Provider");
    });
});
