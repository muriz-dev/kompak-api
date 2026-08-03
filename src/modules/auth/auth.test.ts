import { env } from "cloudflare:workers";
import { describe, it, expect, beforeAll } from "vitest";
import { applyMigrations } from "../../test-setup";
import app from "../../index";

describe("Auth Module", () => {
    beforeAll(async () => {
        await applyMigrations();
    });

    it("should login successfully with valid credentials", async () => {
        // First register a user
        const payload = {
            name: "Login User",
            email: "login@example.com",
            password: "password123",
            phoneNumber: "08123456789",
            birthDate: "1990-01-01",
            faceEmbeddingId: "face-login-123"
        };
        await app.request("/users/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        }, env);

        // Then login
        const loginPayload = {
            email: "login@example.com",
            password: "password123"
        };
        const res = await app.request("/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(loginPayload)
        }, env);

        expect(res.status).toBe(200);
        const data = await res.json() as any;
        expect(data.message).toBe("Login successful");
        expect(data.data.user.email).toBe("login@example.com");
    });

    it("should fail login with incorrect password", async () => {
        const loginPayload = {
            email: "login@example.com",
            password: "wrongpassword"
        };
        const res = await app.request("/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(loginPayload)
        }, env);

        expect(res.status).toBe(401);
        const data = await res.json() as any;
        expect(data.message).toBe("Invalid email or password");
    });

    it("should fail login with non-existent email", async () => {
        const loginPayload = {
            email: "nobody@example.com",
            password: "password123"
        };
        const res = await app.request("/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(loginPayload)
        }, env);

        expect(res.status).toBe(401);
    });
});
