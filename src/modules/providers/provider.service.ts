import type { Context } from "hono";
import providerRepository from "./provider.repository";
import type { CreateProviderSchema, FullUpdateProviderSchema, PartialUpdateProviderSchema, UpdateProviderStatusSchema } from "./provider.schema";
import { ApiError } from "../../utils/api-error";

export const getAllProviders = async (c: Context) => {
    return providerRepository.getAll(c);
}

export const getProviderById = async (c: Context, providerId: string) => {
    const provider = await providerRepository.getById(c, providerId);

    if (!provider) throw ApiError.notFound(`Provider with ID ${providerId} not found`);

    return provider;
}

export const createProvider = async (c: Context, providerData: CreateProviderSchema) => {
    // We can infer ownerId from the authenticated user if they are registering themselves as provider
    const user = c.get("jwtPayload") as any;

    if (user && !providerData.ownerId) {
        providerData.ownerId = user.id;
    }

    return providerRepository.create(c, providerData);
}

export const fullUpdateProvider = async (c: Context, providerId: string, providerData: FullUpdateProviderSchema) => {
    const provider = await getProviderById(c, providerId);
    const user = c.get("jwtPayload") as any;

    if (user.role === "PROVIDER" && provider.ownerId !== user.id) {
        throw ApiError.forbidden("You do not have permission to update this provider");
    }

    return providerRepository.fullUpdate(c, providerId, providerData);
}

export const partialUpdateProvider = async (c: Context, providerId: string, providerData: PartialUpdateProviderSchema) => {
    const provider = await getProviderById(c, providerId);
    const user = c.get("jwtPayload") as any;

    if (user.role === "PROVIDER" && provider.ownerId !== user.id) {
        throw ApiError.forbidden("You do not have permission to update this provider");
    }

    return providerRepository.partialUpdate(c, providerId, providerData);
}

export const updateProviderStatus = async (c: Context, providerId: string, statusData: UpdateProviderStatusSchema) => {
    await getProviderById(c, providerId);

    return providerRepository.updateStatus(c, providerId, statusData);
}

export const removeProvider = async (c: Context, providerId: string) => {
    await getProviderById(c, providerId);

    return providerRepository.remove(c, providerId);
}

export default {
    getAllProviders,
    getProviderById,
    createProvider,
    fullUpdateProvider,
    partialUpdateProvider,
    updateProviderStatus,
    removeProvider
}
