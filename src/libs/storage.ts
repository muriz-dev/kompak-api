import type { ObjectCannedACL } from "@aws-sdk/client-s3";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export type Env = CloudflareBindings;

const createS3Client = (env: Env) => {
    return new S3Client({
        endpoint: env.S3_ENDPOINT || '',
        region: env.S3_REGION || 'auto',
        credentials: {
            accessKeyId: env.S3_ACCESS_KEY_ID || '',
            secretAccessKey: env.S3_SECRET_ACCESS_KEY || '',
        },
        forcePathStyle: true,
    });
};

export function getPublicUrl(env: Env, key: string) {
    const baseUrl = env.R2_PUBLIC_URL || '';
    return `${baseUrl}/${key}`;
}

export async function generatePresignedPutUrl(env: Env, key: string, contentType: string, contentLength?: number, acl?: ObjectCannedACL) {
    const s3Client = createS3Client(env);
    console.log("NILAI BUCKET DARI ENV:", env.S3_BUCKET_NAME);
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
    try {
        await env.BUCKET.delete(key);
    } catch (error) {
        throw error;
    }
}

export async function getObject(env: Env, key: string) {
    try {
        const object = await env.BUCKET.get(key);
        if (!object) return null;

        return {
            Body: object.body,
            ContentType: object.httpMetadata?.contentType,
            ContentLength: object.size,
            ETag: object.etag,
        };
    } catch (error: any) {
        throw error;
    }
}