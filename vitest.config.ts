import { defineConfig } from "vitest/config";
import { cloudflareTest } from "@cloudflare/vitest-pool-workers";

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: "./wrangler.jsonc" },
      remoteBindings: false,
      miniflare: {
        bindings: {
          JWT_SECRET: "test-jwt-secret",
          FACE_API_URL: "https://face.test",
          FACE_API_KEY: "test-face-api-key",
        },
      },
    }),
  ],
  test: {
    pool: "@cloudflare/vitest-pool-workers",
  },
});
