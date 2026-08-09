import { z } from "zod";

const MAX_FACE_IMAGE_BYTES = 10 * 1024 * 1024;
const FACE_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const normalizePhoneNumber = (value: string) => {
    const compact = value.replace(/[\s()-]/g, "");
    if (compact.startsWith("08")) return `+62${compact.slice(1)}`;
    if (compact.startsWith("628")) return `+${compact}`;
    return compact;
};

const isPastCalendarDate = (value: string) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return false;

    const [, year, month, day] = match;
    const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    const today = new Date();
    const todayUtc = Date.UTC(
        today.getUTCFullYear(),
        today.getUTCMonth(),
        today.getUTCDate()
    );

    return date.getUTCFullYear() === Number(year)
        && date.getUTCMonth() === Number(month) - 1
        && date.getUTCDate() === Number(day)
        && date.getTime() < todayUtc;
};

export const paramSchema = z.object({
    id: z.uuid("Invalid user ID"),
});

export const registerUserSchema = z.object({
    name: z.string()
        .trim()
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name must be at most 100 characters"),
    phoneNumber: z.string()
        .trim()
        .transform(normalizePhoneNumber)
        .refine(
            (value) => /^\+628\d{7,11}$/.test(value),
            "Enter a valid Indonesian mobile number"
        ),
    email: z.email("Invalid email format")
        .max(254, "Email must be at most 254 characters")
        .transform((value) => value.trim().toLowerCase()),
    birthDate: z.string()
        .refine(isPastCalendarDate, "Birth date must be a valid past date in YYYY-MM-DD format"),
    password: z.string()
        .min(6, "Password must be at least 6 characters")
        .max(72, "Password must be at most 72 characters"),
    faceImage: z.instanceof(File, { message: "Face image is required" })
        .refine(
            (file) => file.size <= MAX_FACE_IMAGE_BYTES,
            "Face image must be no larger than 10 MB"
        )
        .refine(
            (file) => FACE_IMAGE_TYPES.includes(file.type),
            "Face image must be a JPEG, PNG, or WebP file"
        ),
});

export const updateStatusSchema = z.object({
    status: z.enum(["ACTIVE", "REJECTED", "PENDING"]),
});

export type ParamSchema = z.infer<typeof paramSchema>;
export type RegisterUserSchema = z.infer<typeof registerUserSchema>;
export type RegisterUserData = Omit<RegisterUserSchema, "faceImage"> & {
    faceEmbeddingId: string;
};
export type UpdateStatusSchema = z.infer<typeof updateStatusSchema>;
