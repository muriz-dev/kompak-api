import { Hono } from "hono";
import { describeRoute, validator } from "hono-openapi";
import { requireAuth } from "../../middlewares/auth";
import { uploadUrlSchema } from "./storage.schema";
import { StorageController } from "./storage.controller";
import type { Env } from "../../types";

const storageRouter = new Hono<Env>();
const storageController = new StorageController();

storageRouter.post(
    "/upload-url",
    describeRoute({
        tags: ["Storage"],
        summary: "Generate Presigned Upload URL",
        description: "Generates a secure presigned URL to upload a file (e.g. user avatar, event banner) directly to Cloudflare R2 storage. The frontend must PUT the file binary to the returned URL.",
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: "Presigned URL generated successfully",
            },
            403: {
                description: "The authenticated user cannot upload to the requested folder",
            },
            400: {
                description: "Unsupported image type or file larger than 5 MB",
            },
        },
    }),
    requireAuth,
    validator("json", uploadUrlSchema),
    (c) => storageController.getUploadUrl(c)
);

export default storageRouter;
