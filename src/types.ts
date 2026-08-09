export type KompakBindings = CloudflareBindings & {
    FACE_API_URL: string;
    FACE_API_KEY: string;
};

export type Env = {
    Bindings: KompakBindings;
};
