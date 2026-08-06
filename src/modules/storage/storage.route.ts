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
        description: "Generates a presigned URL to upload a file directly to R2 storage.",
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: "Presigned URL generated successfully",
            },
        },
    }),
    requireAuth,
    validator("json", uploadUrlSchema),
    (c) => storageController.getUploadUrl(c)
);

export default storageRouter;
