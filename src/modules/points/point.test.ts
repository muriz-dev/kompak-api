import { env } from "cloudflare:workers";
import { beforeAll, describe, expect, it } from "vitest";
import { uuidv7 } from "uuidv7";
import app from "../../index";
import { applyMigrations, generateTestToken } from "../../test-setup";

describe("Point History Module", () => {
    let token: string;
    let rewardId: string;
    let providerToken: string;

    beforeAll(async () => {
        await applyMigrations();
        const { drizzle } = await import("drizzle-orm/d1");
        const { attendances, eventTransactions, events, providers, rewards, users } = await import("../../db/schema");
        const db = drizzle(env.DB);

        const adminId = uuidv7();
        const userId = uuidv7();
        const providerOwnerId = uuidv7();
        await db.insert(users).values([
            {
                id: adminId, name: "Point Admin", email: "point-admin@test.com", password: "pwd",
                faceEmbeddingId: "point-admin", phoneNumber: "point-01", role: "ADMIN", status: "ACTIVE",
                birthDate: new Date().toISOString(),
            },
            {
                id: userId, name: "Point User", email: "point-user@test.com", password: "pwd",
                faceEmbeddingId: "point-user", phoneNumber: "point-02", role: "CITIZEN", status: "ACTIVE",
                balance: 100, birthDate: new Date().toISOString(),
            },
            {
                id: providerOwnerId, name: "Point Provider", email: "point-provider@test.com", password: "pwd",
                faceEmbeddingId: "point-provider", phoneNumber: "point-03", role: "CITIZEN", status: "ACTIVE",
                birthDate: new Date().toISOString(),
            },
        ]);
        token = await generateTestToken(userId, "CITIZEN");
        providerToken = await generateTestToken(providerOwnerId, "CITIZEN");

        const providerId = uuidv7();
        await db.insert(providers).values({
            id: providerId, ownerId: providerOwnerId, name: "Point Shop Provider",
            address: "Point Street", latitude: 0, longitude: 0, status: "VERIFIED",
        });
        rewardId = uuidv7();
        await db.insert(rewards).values({
            id: rewardId, providerId, name: "Point Voucher", description: "Voucher test",
            pointsRequired: 20, stock: 5, type: "VOUCHER", source: "POINT_SHOP",
        });

        const eventId = uuidv7();
        const attendanceId = uuidv7();
        const now = new Date();
        await db.insert(events).values({
            id: eventId, createdBy: adminId, title: "Kerja Bakti", description: "Bersih kampung",
            eventDate: now, rewardPoints: 50, attendanceStartTime: now, attendanceEndTime: now,
            latitude: 0, longitude: 0, status: "PUBLISHED",
        });
        await db.insert(attendances).values({
            id: attendanceId, userId, eventId, status: "PRESENT", verifiedAt: now,
        });
        await db.insert(eventTransactions).values({
            id: uuidv7(), userId, attendanceId, eventId, points: 50,
        });
    });

    it("returns attendance earnings, redemption spending, and refunds", async () => {
        const create = await app.request("/reward-redemptions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ rewardId, idempotencyKey: "point-history-redemption" }),
        }, env);
        expect(create.status).toBe(201);
        const redemption = await create.json() as any;

        const reject = await app.request(`/reward-redemptions/${redemption.data.id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${providerToken}` },
            body: JSON.stringify({ status: "REJECTED" }),
        }, env);
        expect(reject.status).toBe(200);

        const res = await app.request("/points/me", {
            headers: { "Authorization": `Bearer ${token}` },
        }, env);
        expect(res.status).toBe(200);
        const body = await res.json() as any;
        expect(body.data.balance).toBe(100);
        expect(body.data.entries).toEqual(expect.arrayContaining([
            expect.objectContaining({ direction: "IN", points: 50, title: "Kerja Bakti", referenceType: "EVENT" }),
            expect.objectContaining({ direction: "OUT", points: 20, title: "Point Voucher", referenceType: "REDEMPTION" }),
            expect.objectContaining({ direction: "IN", points: 20, referenceType: "REDEMPTION_REFUND" }),
        ]));
    });
});
