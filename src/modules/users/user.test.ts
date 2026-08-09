import { env } from "cloudflare:workers";
import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import { applyMigrations, createRegistrationForm, generateTestToken } from "../../test-setup";
import app from "../../index";
import { uuidv7 } from "uuidv7";

describe("User Module", () => {
    let adminToken: string;
    let faceFetch: ReturnType<typeof vi.fn>;

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

    beforeEach(() => {
        faceFetch = vi.fn().mockResolvedValue(new Response(
            JSON.stringify({ face_id: "face-123" }),
            { status: 201, headers: { "Content-Type": "application/json" } }
        ));
        vi.stubGlobal("fetch", faceFetch);
    });

    afterAll(() => vi.unstubAllGlobals());

    it("should register a new user successfully", async () => {
        const res = await app.request("/users/register", {
            method: "POST",
            body: createRegistrationForm()
        }, env);

        expect(res.status).toBe(201);
        const data = await res.json() as any;
        expect(data.message).toBe("Registration successful. Please wait for admin approval.");
        expect(data.data.email).toBe("test@example.com");
        expect(data.data.phoneNumber).toBe("+628123456789");
        expect(data.data.status).toBe("PENDING");
        expect(data.data.password).toBeUndefined();
        expect(data.data.faceEmbeddingId).toBeUndefined();
        expect(faceFetch).toHaveBeenCalledTimes(1);

        const [url, init] = faceFetch.mock.calls[0];
        expect(url).toBe("https://face.test/api/v1/faces");
        expect(init.headers).toEqual({ "X-API-Key": "test-face-api-key" });
        expect(init.body).toBeInstanceOf(FormData);
        expect((init.body as FormData).get("image")).toBeInstanceOf(File);
    });

    it("should fail to register with duplicate email", async () => {
        const res = await app.request("/users/register", {
            method: "POST",
            body: createRegistrationForm({ name: "Test User 2" })
        }, env);

        expect(res.status).toBe(409);
        const data = await res.json() as any;
        expect(data.message).toBe("Email already registered");
        expect(faceFetch).not.toHaveBeenCalled();
    });

    it("should return field errors before enrolling a face", async () => {
        const res = await app.request("/users/register", {
            method: "POST",
            body: createRegistrationForm({
                email: "invalid-email",
                phoneNumber: null,
            })
        }, env);

        expect(res.status).toBe(422);
        const data = await res.json() as any;
        expect(data.errors.email).toBeDefined();
        expect(data.errors.phoneNumber).toBeDefined();
        expect(faceFetch).not.toHaveBeenCalled();
    });

    it("should map face enrollment errors without creating a user", async () => {
        faceFetch.mockResolvedValueOnce(new Response(
            JSON.stringify({ code: "face_too_blurry", message: "Face image is too blurry" }),
            { status: 422, headers: { "Content-Type": "application/json" } }
        ));

        const res = await app.request("/users/register", {
            method: "POST",
            body: createRegistrationForm({ email: "blurry@example.com" })
        }, env);

        expect(res.status).toBe(422);
        const data = await res.json() as any;
        expect(data.errors.faceImage).toBe("Face image is too blurry");

        const listRes = await app.request("/users", {
            headers: { "Authorization": `Bearer ${adminToken}` }
        }, env);
        const listData = await listRes.json() as any;
        expect(listData.data.some((user: any) => user.email === "blurry@example.com")).toBe(false);
    });

    it("should document registration as multipart form data", async () => {
        const res = await app.request("/openapi", {}, env);

        expect(res.status).toBe(200);
        const spec = await res.json() as any;
        expect(
            spec.paths["/users/register"].post.requestBody.content["multipart/form-data"]
        ).toBeDefined();
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
        expect(data.data.faceEmbeddingId).toBeUndefined();
    });
});
