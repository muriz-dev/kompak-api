import { env } from "cloudflare:workers";
import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import { applyMigrations, createRegistrationForm } from "../../test-setup";
import app from "../../index";

describe("Auth Module", () => {
    beforeAll(async () => {
        await applyMigrations();
    });

    let authToken = "";

    beforeEach(() => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(
            JSON.stringify({ face_id: "face-login-123" }),
            { status: 201, headers: { "Content-Type": "application/json" } }
        )));
    });

    afterAll(() => vi.unstubAllGlobals());

    it("should login successfully with valid credentials", async () => {
        // First register a user
        await app.request("/users/register", {
            method: "POST",
            body: createRegistrationForm({
                name: "Login User",
                email: "login@example.com",
            })
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
        authToken = data.data.token;
    });

    it("should get current user profile (/auth/me)", async () => {
        const res = await app.request("/auth/me", {
            method: "GET",
            headers: { "Authorization": `Bearer ${authToken}` }
        }, env);

        expect(res.status).toBe(200);
        const data = await res.json() as any;
        expect(data.message).toBe("Current session retrieved successfully");
        expect(data.data.email).toBe("login@example.com");
        expect(data.data.password).toBeUndefined(); // ensure password is not leaked
    });

    it("should fail to get profile without token", async () => {
        const res = await app.request("/auth/me", {
            method: "GET",
        }, env);

        expect(res.status).toBe(401);
    });

    it("should logout successfully (/auth/logout)", async () => {
        const res = await app.request("/auth/logout", {
            method: "POST",
            headers: { "Authorization": `Bearer ${authToken}` }
        }, env);

        expect(res.status).toBe(200);
        const data = await res.json() as any;
        expect(data.message).toBe("Logged out successfully");
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
