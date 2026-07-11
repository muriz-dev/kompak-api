import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import type { Context, MiddlewareHandler } from "hono";
import type { Env } from "../types";
import * as schema from "./schema";

export type Db = DrizzleD1Database<typeof schema>;

export type DbVariables = {
    db: Db;
};

let cachedDb: Db | undefined;

export const getDb = (database: D1Database): Db => {
    if (!cachedDb) {
        cachedDb = drizzle(database, { schema });
    }

    return cachedDb;
};

export const dbMiddleware: MiddlewareHandler<Env & { Variables: DbVariables }> = async (c, next) => {
    c.set("db", getDb(c.env.DB));
    await next();
};

export const getDbFromContext = (c: Context<{ Variables: DbVariables }>) => {
    return c.get("db");
};
