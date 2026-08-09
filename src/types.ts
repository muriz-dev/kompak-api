import type { users } from "./db/schema";

export type KompakBindings = CloudflareBindings & {
    FACE_API_URL: string;
    FACE_API_KEY: string;
};

export type CurrentUser = typeof users.$inferSelect;

export type Env = {
    Bindings: KompakBindings;
    Variables: {
        currentUser: CurrentUser;
        jwtPayload: {
            id: string;
            exp?: number;
            role?: string;
            status?: string;
        };
    };
};
