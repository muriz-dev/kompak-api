import { describe, expect, it } from "vitest";
import type { Env } from "./storage";
import { getPublicUrl, getS3ClientConfig } from "./storage";

const createEnv = (overrides: Partial<Env> = {}) => ({
    S3_ENDPOINT: "https://example.storage.test",
    S3_REGION: "auto",
    S3_BUCKET_NAME: "kompak-test",
    S3_ACCESS_KEY_ID: "access-key",
    S3_SECRET_ACCESS_KEY: "secret-key",
    R2_PUBLIC_URL: "https://api.example.test/storage",
    ...overrides,
} as Env);

describe("storage configuration", () => {
    it("preserves the deployed R2 public URL and path-style defaults", () => {
        const env = createEnv();

        expect(getPublicUrl(env, "events/banner.png")).toBe(
            "https://api.example.test/storage/events/banner.png",
        );
        expect(getS3ClientConfig(env).forcePathStyle).toBe(true);
    });

    it("prefers provider-neutral overrides when configured", () => {
        const env = createEnv({
            STORAGE_PUBLIC_URL: "https://assets.example.test/",
            STORAGE_FORCE_PATH_STYLE: "false",
        });

        expect(getPublicUrl(env, "/events/banner.png")).toBe(
            "https://assets.example.test/events/banner.png",
        );
        expect(getS3ClientConfig(env).forcePathStyle).toBe(false);
    });
});
