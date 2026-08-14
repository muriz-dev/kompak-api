import { z } from "zod";
import { PROVIDER_STATUS } from "../../db/schema";

export const paramSchema = z.object({
    providerId: z.uuid("Invalid provider ID"),
});

export const createProviderSchema = z.object({
    ownerId: z.uuid("Invalid owner ID").optional(),
    name: z.string().min(1, "Name is required"),
    address: z.string().min(1, "Address is required"),
    latitude: z.number("Latitude must be a number"),
    longitude: z.number("Longitude must be a number"),
    logoUrl: z.url("Invalid URL").optional(),
    storePhotoUrl: z.url("Invalid URL").optional(),
});

export const fullUpdateProviderSchema = createProviderSchema;

export const partialUpdateProviderSchema = createProviderSchema.partial();

export const updateProviderStatusSchema = z.object({
    status: z.enum(PROVIDER_STATUS, { message: "Status is required and must be valid" })
});

export const adminProviderListQuerySchema = z.object({
    query: z.string().trim().max(100).optional(),
    status: z.enum(PROVIDER_STATUS).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(10),
});

export type ParamSchema = z.infer<typeof paramSchema>;
export type CreateProviderSchema = z.infer<typeof createProviderSchema>;
export type FullUpdateProviderSchema = z.infer<typeof fullUpdateProviderSchema>;
export type PartialUpdateProviderSchema = z.infer<typeof partialUpdateProviderSchema>;
export type UpdateProviderStatusSchema = z.infer<typeof updateProviderStatusSchema>;
export type AdminProviderListQuerySchema = z.infer<typeof adminProviderListQuerySchema>;
