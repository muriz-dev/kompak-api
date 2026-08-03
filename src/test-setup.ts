import { applyD1Migrations } from "cloudflare:test";
import { env } from "cloudflare:workers";
// @ts-ignore
import sqlContent from "../drizzle/0000_glossy_madame_hydra.sql?raw";

let initialized = false;

export const applyMigrations = async () => {
    if (initialized) return;

    const queries = sqlContent
        .split("--> statement-breakpoint")
        .map((q: string) => q.trim())
        .filter(Boolean);

    const migrations = [
        {
            name: "0000_glossy_madame_hydra.sql",
            queries: queries
        }
    ];

    await applyD1Migrations(env.DB, migrations);
    initialized = true;
};

import { sign } from "hono/jwt";

export const generateTestToken = async (userId: string, role: string = "USER") => {
    return await sign(
        {
            id: userId,
            role,
            status: "APPROVED",
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24
        },
        env.JWT_SECRET as string
    );
};
