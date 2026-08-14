import type { Context, Env, ValidationTargets } from "hono";
import providerService from "./provider.service";
import type { AdminProviderListQuerySchema, ParamSchema, CreateProviderSchema, FullUpdateProviderSchema, PartialUpdateProviderSchema, UpdateProviderStatusSchema } from "./provider.schema";
import { ApiResponse } from "../../utils/api-response";

type ProviderContext = Context<Env, any, {
    in: Pick<ValidationTargets, 'param' | 'json' | 'query'> & {
        param: ParamSchema,
        json: CreateProviderSchema | FullUpdateProviderSchema | PartialUpdateProviderSchema | UpdateProviderStatusSchema,
        query: AdminProviderListQuerySchema,
    };
    out: Pick<ValidationTargets, 'param' | 'json' | 'query'> & {
        param: ParamSchema,
        json: CreateProviderSchema | FullUpdateProviderSchema | PartialUpdateProviderSchema | UpdateProviderStatusSchema,
        query: AdminProviderListQuerySchema,
    };
}>;

export const getAllProviders = async (ctx: ProviderContext) => {
    const providers = await providerService.getAllProviders(ctx);
    return ApiResponse.ok(ctx, "Providers retrieved successfully", providers);
}

export const getProviderById = async (ctx: ProviderContext) => {
    const { providerId } = ctx.req.valid("param");
    const provider = await providerService.getProviderById(ctx, providerId);
    return ApiResponse.ok(ctx, "Provider retrieved successfully", provider);
}

export const getMyProvider = async (ctx: ProviderContext) => {
    const provider = await providerService.getMyProvider(ctx);
    return ApiResponse.ok(ctx, "Current provider retrieved successfully", provider);
}

export const getAdminProviders = async (ctx: ProviderContext) => {
    const query = ctx.req.valid("query");
    const providers = await providerService.getAdminProviders(ctx, query);
    return ApiResponse.ok(ctx, "Admin providers retrieved successfully", providers);
};

export const getAdminProviderById = async (ctx: ProviderContext) => {
    const { providerId } = ctx.req.valid("param");
    const provider = await providerService.getAdminProviderById(ctx, providerId);
    return ApiResponse.ok(ctx, "Admin provider detail retrieved successfully", provider);
};

export const createProvider = async (ctx: ProviderContext) => {
    const providerData = ctx.req.valid("json") as CreateProviderSchema;
    const provider = await providerService.createProvider(ctx, providerData);
    return ApiResponse.created(ctx, "Provider created successfully", provider);
}

export const fullUpdateProvider = async (ctx: ProviderContext) => {
    const { providerId } = ctx.req.valid("param");
    const providerData = ctx.req.valid("json") as FullUpdateProviderSchema;
    const provider = await providerService.fullUpdateProvider(ctx, providerId, providerData);
    return ApiResponse.ok(ctx, "Provider updated successfully", provider);
}

export const partialUpdateProvider = async (ctx: ProviderContext) => {
    const { providerId } = ctx.req.valid("param");
    const providerData = ctx.req.valid("json") as PartialUpdateProviderSchema;
    const provider = await providerService.partialUpdateProvider(ctx, providerId, providerData);
    return ApiResponse.ok(ctx, "Provider updated successfully", provider);
}

export const updateProviderStatus = async (ctx: ProviderContext) => {
    const { providerId } = ctx.req.valid("param");
    const statusData = ctx.req.valid("json") as UpdateProviderStatusSchema;
    const provider = await providerService.updateProviderStatus(ctx, providerId, statusData);
    return ApiResponse.ok(ctx, "Provider status updated successfully", provider);
}

export const removeProvider = async (ctx: ProviderContext) => {
    const { providerId } = ctx.req.valid("param");
    await providerService.removeProvider(ctx, providerId);
    return ApiResponse.ok(ctx, "Provider deleted successfully");
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
};
