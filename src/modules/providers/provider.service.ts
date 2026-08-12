import type { Context } from "hono";
import providerRepository from "./provider.repository";
import type { AdminProviderListQuerySchema, CreateProviderSchema, FullUpdateProviderSchema, PartialUpdateProviderSchema, UpdateProviderStatusSchema } from "./provider.schema";
import { ApiError } from "../../utils/api-error";

export const getAllProviders = async (c: Context) => {
    return providerRepository.getAll(c);
}

export const getProviderById = async (c: Context, providerId: string) => {
    const provider = await providerRepository.getById(c, providerId);

    if (!provider) throw ApiError.notFound(`Provider with ID ${providerId} not found`);

    return provider;
}

export const getMyProvider = async (c: Context) => {
    const user = c.get("jwtPayload") as any;
    const provider = await providerRepository.getByOwnerId(c, user.id);
    if (!provider) throw ApiError.notFound("You have not registered a provider account");

    return providerRepository.getAdminDetail(c, provider.id);
}

export const getAdminProviders = async (
    c: Context,
    query: AdminProviderListQuerySchema,
) => providerRepository.getAdminPage(c, query);

export const getAdminProviderById = async (c: Context, providerId: string) => {
    const provider = await providerRepository.getAdminDetail(c, providerId);
    if (!provider) throw ApiError.notFound(`Provider with ID ${providerId} not found`);
    return provider;
};

export const createProvider = async (c: Context, providerData: CreateProviderSchema) => {
    const user = c.get("jwtPayload") as any;
    const ownerId = user.role === "ADMIN"
        ? providerData.ownerId ?? user.id
        : user.id;
    const existingProvider = await providerRepository.getByOwnerId(c, ownerId);
    if (existingProvider) {
        throw ApiError.conflict("This user already has a provider account");
    }

    return providerRepository.create(c, {
        ...providerData,
        ownerId,
    });
}

export const fullUpdateProvider = async (c: Context, providerId: string, providerData: FullUpdateProviderSchema) => {
    const provider = await getProviderById(c, providerId);
    const user = c.get("jwtPayload") as any;

    if (user.role !== "ADMIN" && provider.ownerId !== user.id) {
        throw ApiError.forbidden("You do not have permission to update this provider");
    }

    if (user.role === "ADMIN") {
        return providerRepository.fullUpdate(c, providerId, providerData);
    }
    const { ownerId: _, ...ownedData } = providerData;
    return providerRepository.partialUpdate(c, providerId, {
        ...ownedData,
        status: "PENDING",
    } as PartialUpdateProviderSchema);
}

export const partialUpdateProvider = async (c: Context, providerId: string, providerData: PartialUpdateProviderSchema) => {
    const provider = await getProviderById(c, providerId);
    const user = c.get("jwtPayload") as any;

    if (user.role !== "ADMIN" && provider.ownerId !== user.id) {
        throw ApiError.forbidden("You do not have permission to update this provider");
    }

    if (user.role === "ADMIN") {
        return providerRepository.partialUpdate(c, providerId, providerData);
    }
    const { ownerId: _, ...ownedData } = providerData;
    return providerRepository.partialUpdate(c, providerId, {
        ...ownedData,
        status: "PENDING",
    } as PartialUpdateProviderSchema);
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
    getMyProvider,
    getAdminProviders,
    getAdminProviderById,
    createProvider,
    fullUpdateProvider,
    partialUpdateProvider,
    updateProviderStatus,
    removeProvider
}
