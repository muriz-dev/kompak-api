import { eq } from "drizzle-orm";
import type { Context } from "hono";
import { getDb } from "../../db/connection";
import { users } from "../../db/schema";

export const getUserByEmail = async (c: Context, email: string) => {
    const db = getDb(c.env.DB);
    return db.query.users.findFirst({
        where: eq(users.email, email),
    });
};

export default {
    getUserByEmail
};
