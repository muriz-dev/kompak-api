import { applyD1Migrations } from "cloudflare:test";
import { env } from "cloudflare:workers";
// @ts-ignore
import sqlContent from "../drizzle/0000_slippery_felicia_hardy.sql?raw";

let initialized = false;

export const applyMigrations = async () => {
    if (initialized) return;
    
    const queries = sqlContent
        .split("--> statement-breakpoint")
        .map((q: string) => q.trim())
        .filter(Boolean);

    const migrations = [
        {
            name: "0000_slippery_felicia_hardy.sql",
            queries: queries
        }
    ];

    await applyD1Migrations(env.DB, migrations);
    initialized = true;
};
