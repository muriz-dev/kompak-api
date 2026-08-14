import type { ObjectCannedACL, S3ClientConfig } from "@aws-sdk/client-s3";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { KompakBindings } from "../types";

export type Env = KompakBindings;

const parseBoolean = (value: string | undefined, fallback: boolean) => {
    if (!value) return fallback;

    switch (value.trim().toLowerCase()) {
        case "true":
        case "1":
        case "yes":
        case "on":
            return true;
        case "false":
        case "0":
        case "no":
        case "off":
            return false;
        default:
            return fallback;
    }
};

export const getS3ClientConfig = (env: Env): S3ClientConfig => ({
    endpoint: env.S3_ENDPOINT || '',
    region: env.S3_REGION || 'auto',
    credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: env.S3_SECRET_ACCESS_KEY || '',
    },
    // Keep the existing R2 behavior by default while allowing providers
    // that require virtual-hosted-style URLs to opt out.
    forcePathStyle: parseBoolean(env.STORAGE_FORCE_PATH_STYLE, true),
});

const createS3Client = (env: Env) => new S3Client(getS3ClientConfig(env));

export function getPublicUrl(env: Env, key: string) {
    // R2_PUBLIC_URL remains as a backwards-compatible alias so the currently
    // deployed Cloudflare environment does not need to change.
    const baseUrl = (env.STORAGE_PUBLIC_URL || env.R2_PUBLIC_URL || '').replace(/\/+$/, '');
    const normalizedKey = key.replace(/^\/+/, '');
    return `${baseUrl}/${normalizedKey}`;
}

export async function generatePresignedPutUrl(env: Env, key: string, contentType: string, contentLength?: number, acl?: ObjectCannedACL) {
    const s3Client = createS3Client(env);
    const command = new PutObjectCommand({
        Bucket: env.S3_BUCKET_NAME,
        Key: key,
        ContentType: contentType,
        ...(contentLength !== undefined && { ContentLength: contentLength }),
        ...(acl !== undefined && { ACL: acl }),
    });

    try {
        const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        return url;
    } catch (error) {
        throw error;
    }
}

export async function generatePresignedGetUrl(env: Env, key: string, expiresIn = 3600) {
    const s3Client = createS3Client(env);
    const command = new GetObjectCommand({
        Bucket: env.S3_BUCKET_NAME,
        Key: key,
    });

    try {
        const url = await getSignedUrl(s3Client, command, { expiresIn });
        return url;
    } catch (error) {
        throw error;
    }
}

export async function deleteFile(env: Env, key: string) {
    const s3Client = createS3Client(env);
    await s3Client.send(new DeleteObjectCommand({
        Bucket: env.S3_BUCKET_NAME,
        Key: key,
    }));
}

export async function getObject(env: Env, key: string) {
    const s3Client = createS3Client(env);
    try {
        const object = await s3Client.send(new GetObjectCommand({
            Bucket: env.S3_BUCKET_NAME,
            Key: key,
        }));

        return {
            Body: object.Body,
            ContentType: object.ContentType,
            ContentLength: object.ContentLength,
            ETag: object.ETag,
        };
    } catch (error: any) {
        if (
            error?.name === "NoSuchKey" ||
            error?.name === "NotFound" ||
            error?.$metadata?.httpStatusCode === 404
        ) {
            return null;
        }

        throw error;
    }
}
