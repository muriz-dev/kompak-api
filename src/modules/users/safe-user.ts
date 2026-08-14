import type { users } from "../../db/schema";

export type UserRecord = typeof users.$inferSelect;
export type SafeUser = Omit<UserRecord, "password" | "faceEmbeddingId">;

export const toSafeUser = (user: UserRecord): SafeUser => {
    const { password: _password, faceEmbeddingId: _faceEmbeddingId, ...safeUser } = user;
    return safeUser;
};
