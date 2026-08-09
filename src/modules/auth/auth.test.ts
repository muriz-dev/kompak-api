import { env } from "cloudflare:workers";
import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import { applyMigrations, createRegistrationForm, generateTestToken } from "../../test-setup";
import app from "../../index";
import { uuidv7 } from "uuidv7";

describe("Auth Module", () => {
    let adminToken = "";
    let userId = "";

    beforeAll(async () => {
        await applyMigrations();
        const { drizzle } = await import("drizzle-orm/d1");
        const { users } = await import("../../db/schema");
        const db = drizzle(env.DB);
        const adminId = uuidv7();
        await db.insert(users).values({
            id: adminId,
            name: "Auth Admin",
            email: "auth-admin@example.com",
            password: "not-used",
            faceEmbeddingId: "auth-admin-face",
            phoneNumber: "081000000001",
            role: "ADMIN",
            status: "ACTIVE",
            birthDate: "1990-01-01",
        });
        adminToken = await generateTestToken(adminId, "ADMIN");
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
        expect(data.data.user.password).toBeUndefined();
        expect(data.data.user.faceEmbeddingId).toBeUndefined();
        userId = data.data.user.id;
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
        expect(data.data.faceEmbeddingId).toBeUndefined();
        expect(data.data.status).toBe("PENDING");
    });

    it("should authorize an approved user immediately with the same token", async () => {
        const blockedRes = await app.request(`/users/${userId}`, {
            headers: { "Authorization": `Bearer ${authToken}` }
        }, env);
        expect(blockedRes.status).toBe(403);

        const approvalRes = await app.request(`/users/${userId}/status`, {
            method: "PATCH",
            headers: {
                "Authorization": `Bearer ${adminToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ status: "ACTIVE" })
        }, env);
        expect(approvalRes.status).toBe(200);

        const protectedRes = await app.request(`/users/${userId}`, {
            headers: { "Authorization": `Bearer ${authToken}` }
        }, env);
        expect(protectedRes.status).toBe(200);

        const meRes = await app.request("/auth/me", {
            headers: { "Authorization": `Bearer ${authToken}` }
        }, env);
        const meData = await meRes.json() as any;
        expect(meData.data.status).toBe("ACTIVE");
    });

    it("should reflect rejection immediately and block protected APIs", async () => {
        const rejectionRes = await app.request(`/users/${userId}/status`, {
            method: "PATCH",
            headers: {
                "Authorization": `Bearer ${adminToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ status: "REJECTED" })
        }, env);
        expect(rejectionRes.status).toBe(200);

        const meRes = await app.request("/auth/me", {
            headers: { "Authorization": `Bearer ${authToken}` }
        }, env);
        const meData = await meRes.json() as any;
        expect(meData.data.status).toBe("REJECTED");

        const protectedRes = await app.request(`/users/${userId}`, {
            headers: { "Authorization": `Bearer ${authToken}` }
        }, env);
        expect(protectedRes.status).toBe(403);
    });

    it("should reject a valid token when its user no longer exists", async () => {
        const missingUserToken = await generateTestToken(uuidv7());
        const res = await app.request("/auth/me", {
            headers: { "Authorization": `Bearer ${missingUserToken}` }
        }, env);

        expect(res.status).toBe(401);
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
