import type { Context } from "hono";
import { uuidv7 } from "uuidv7";
import { ApiResponse } from "../../utils/api-response";
import { ApiError } from "../../utils/api-error";
import { generatePresignedPutUrl, getPublicUrl } from "../../libs/storage";
import type { Env } from "../../types";
import type { UploadUrlSchema } from "./storage.schema";

export class StorageController {
    async getUploadUrl(c: Context<Env>) {
        const { folder, contentType, contentLength } = c.req.valid("json" as never) as UploadUrlSchema;
        const currentUser = c.get("currentUser");

        if (folder === "events" && currentUser?.role !== "ADMIN") {
            throw ApiError.forbidden("Only admins can upload event images");
        }
        
        const fileName = uuidv7();
        
        // Map common content types to extensions
        const extMap: Record<string, string> = {
            "image/jpeg": ".jpg",
            "image/png": ".png",
            "image/webp": ".webp",
            "image/gif": ".gif"
        };
        const ext = extMap[contentType] || "";
        
        const key = `${folder}/${fileName}${ext}`;
        
        try {
            const uploadUrl = await generatePresignedPutUrl(
                c.env, 
                key, 
                contentType, 
                contentLength
            );
            
            const publicUrl = getPublicUrl(c.env, key);
            
            return ApiResponse.ok(c, "Upload URL generated successfully", {
                uploadUrl,
                publicUrl,
                key,
            });
        } catch (error: any) {
            console.error("Presigned URL Error:", error);
            throw ApiError.server(`Failed to generate upload URL: ${error.message}`);
        }
    }
}
