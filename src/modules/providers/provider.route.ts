import { Hono } from "hono";
import { describeRoute, validator } from "hono-openapi";
import * as controller from "./provider.controller";
import { adminProviderListQuerySchema, paramSchema, createProviderSchema, fullUpdateProviderSchema, partialUpdateProviderSchema, updateProviderStatusSchema } from "./provider.schema";
import { requireAuth, requireRole } from "../../middlewares/auth";

const providerRouter = new Hono();

providerRouter.get(
    "/admin",
    describeRoute({
        summary: "Get Providers for Admin Management",
        description: "Admin ONLY. Returns a searchable, filterable, paginated provider list including owner information.",
        tags: ["Providers"],
        security: [{ bearerAuth: [] }],
        responses: {
            200: { description: "Admin providers retrieved successfully" },
            403: { description: "Forbidden" },
        },
    }),
    requireAuth,
    requireRole(["ADMIN"]),
    validator("query", adminProviderListQuerySchema),
    controller.getAdminProviders,
);

providerRouter.get(
    "/admin/:providerId",
    describeRoute({
        summary: "Get Provider Admin Detail",
        description: "Admin ONLY. Returns provider ownership, completed-point totals, active-product totals, and Point Shop products.",
        tags: ["Providers"],
        security: [{ bearerAuth: [] }],
        responses: {
            200: { description: "Admin provider detail retrieved successfully" },
            404: { description: "Provider not found" },
        },
    }),
    requireAuth,
    requireRole(["ADMIN"]),
    validator("param", paramSchema),
    controller.getAdminProviderById,
);

providerRouter.get(
    "/",
    describeRoute({
        summary: "Get All Providers",
        description: "Retrieves a list of all registered providers (e.g., local businesses or sponsors).",
        tags: ["Providers"],
        responses: {
            200: {
                description: "Providers retrieved successfully",
            },
        },
    }),
    controller.getAllProviders,
);

providerRouter.get(
    "/me",
    describeRoute({
        summary: "Get Current User Provider",
        description: "Returns the authenticated user's provider registration, approval status, dashboard statistics, and products.",
        tags: ["Providers"],
        security: [{ bearerAuth: [] }],
        responses: {
            200: { description: "Current provider retrieved successfully" },
            404: { description: "The current user has not registered a provider" },
        },
    }),
    requireAuth,
    requireRole(["ADMIN", "CITIZEN"]),
    controller.getMyProvider,
);

providerRouter.get(
    "/:providerId",
    describeRoute({
        summary: "Get Provider by ID",
        description: "Retrieve a provider by its ID.",
        tags: ["Providers"],
        responses: {
            200: {
                description: "Provider retrieved successfully",
            },
            404: {
                description: "Provider not found",
            },
        },
    }),
    validator("param", paramSchema),
    controller.getProviderById,
);

providerRouter.post(
    "/",
    describeRoute({
        summary: "Create Provider",
        description: "Registers a citizen as a new provider. The newly created provider will have a 'PENDING' status and cannot offer rewards until approved by an admin.",
        tags: ["Providers"],
        security: [{ bearerAuth: [] }],
        responses: {
            201: {
                description: "Provider created successfully",
            },
            400: {
                description: "Invalid request body",
            },
        },
    }),
    requireAuth,
    validator("json", createProviderSchema),
    controller.createProvider,
);

providerRouter.put(
    "/:providerId",
    describeRoute({
        summary: "Full Update Provider",
        description: "Update a provider by its ID (full update).",
        tags: ["Providers"],
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: "Provider updated successfully",
            },
            400: {
                description: "Invalid request body",
            },
            404: {
                description: "Provider not found",
            },
        },
    }),
    requireAuth,
    requireRole(["ADMIN", "CITIZEN"]),
    validator("param", paramSchema),
    validator("json", fullUpdateProviderSchema),
    controller.fullUpdateProvider,
);

providerRouter.patch(
    "/:providerId",
    describeRoute({
        summary: "Partial Update Provider",
        description: "Update a provider by its ID (partial update).",
        tags: ["Providers"],
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: "Provider updated successfully",
            },
            400: {
                description: "Invalid request body",
            },
            404: {
                description: "Provider not found",
            },
        },
    }),
    requireAuth,
    requireRole(["ADMIN", "CITIZEN"]),
    validator("param", paramSchema),
    validator("json", partialUpdateProviderSchema),
    controller.partialUpdateProvider,
);

providerRouter.patch(
    "/:providerId/status",
    describeRoute({
        summary: "Update Provider Status",
        description: "Admin ONLY. Approves (VERIFIED) or Rejects (REJECTED) a pending provider registration.",
        tags: ["Providers"],
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: "Provider status updated successfully",
            },
            400: {
                description: "Invalid request body",
            },
            404: {
                description: "Provider not found",
            },
        },
    }),
    requireAuth,
    requireRole(['ADMIN']),
    validator("param", paramSchema),
    validator("json", updateProviderStatusSchema),
    controller.updateProviderStatus,
);

providerRouter.delete(
    "/:providerId",
    describeRoute({
        summary: "Remove Provider",
        description: "Admin: Remove a provider by its ID.",
        tags: ["Providers"],
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: "Provider deleted successfully",
            },
            404: {
                description: "Provider not found",
            },
        },
    }),
    requireAuth,
    requireRole(['ADMIN']),
    validator("param", paramSchema),
    controller.removeProvider,
);

export default providerRouter;
