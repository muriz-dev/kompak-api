import type { Context } from "hono";
import { describe, expect, it, vi } from "vitest";
import type { Env } from "../../types";
import { createRegistrationForm } from "../../test-setup";
import { createUserRegistration } from "./user-registration";
import { registerUserSchema } from "./user.schema";

describe("User registration orchestration", () => {
    it("deletes an enrolled face when user persistence fails", async () => {
        const repository = {
            getByEmail: vi.fn().mockResolvedValue(undefined),
            create: vi.fn().mockRejectedValue(new Error("Database unavailable")),
        };
        const faceEnrollment = {
            enroll: vi.fn().mockResolvedValue("face-created-before-db-error"),
            delete: vi.fn().mockResolvedValue(undefined),
        };
        const registration = createUserRegistration({
            repository,
            faceEnrollment,
            hash: vi.fn().mockResolvedValue("hashed-password"),
        });
        const data = registerUserSchema.parse(Object.fromEntries(createRegistrationForm({
            email: "cleanup@example.com",
        })));
        const context = {
            env: {
                FACE_API_URL: "https://face.test",
                FACE_API_KEY: "test-face-api-key",
            },
        } as Context<Env>;

        await expect(registration.register(context, data)).rejects.toThrow("Database unavailable");
        expect(faceEnrollment.delete).toHaveBeenCalledWith(
            context.env,
            "face-created-before-db-error"
        );
    });
});
