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
            status: "ACTIVE",
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24
        },
        env.JWT_SECRET as string
    );
};

type RegistrationFormOverrides = Partial<{
    name: string | null;
    phoneNumber: string | null;
    email: string | null;
    birthDate: string | null;
    password: string | null;
    faceImage: File | null;
}>;

export const createRegistrationForm = (
    overrides: RegistrationFormOverrides = {}
) => {
    const values = {
        name: "Test User",
        phoneNumber: "08123456789",
        email: "test@example.com",
        birthDate: "1990-01-01",
        password: "password123",
        ...overrides,
    };
    const form = new FormData();

    for (const field of ["name", "phoneNumber", "email", "birthDate", "password"] as const) {
        const value = values[field];
        if (value !== null) form.append(field, value);
    }

    const faceImage = overrides.faceImage === undefined
        ? new File([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], "face.jpg", {
            type: "image/jpeg",
        })
        : overrides.faceImage;
    if (faceImage !== null) form.append("faceImage", faceImage);

    return form;
};

type AttendanceFormOverrides = Partial<{
    eventId: string | null;
    latitude: string | null;
    longitude: string | null;
    faceImage: File | null;
    activityPhotoUrl: string | null;
    activityDescription: string | null;
}>;

export const createAttendanceForm = (
    overrides: AttendanceFormOverrides = {}
) => {
    const values = {
        eventId: "00000000-0000-7000-8000-000000000000",
        latitude: "-6.2",
        longitude: "106.816666",
        activityPhotoUrl: null,
        activityDescription: null,
        ...overrides,
    };
    const form = new FormData();

    for (const field of [
        "eventId",
        "latitude",
        "longitude",
        "activityPhotoUrl",
        "activityDescription",
    ] as const) {
        const value = values[field];
        if (value !== null) form.append(field, value);
    }

    const faceImage = overrides.faceImage === undefined
        ? new File([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], "face.jpg", {
            type: "image/jpeg",
        })
        : overrides.faceImage;
    if (faceImage !== null) form.append("faceImage", faceImage);

    return form;
};
