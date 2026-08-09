import type { KompakBindings } from "../../types";
import { ApiError } from "../../utils/api-error";

const FACE_REQUEST_TIMEOUT_MS = 15_000;

type FaceRegistrationResponse = {
    face_id: string;
};

type FaceErrorResponse = {
    code?: string;
    message?: string;
};

export interface FaceEnrollmentClient {
    enroll(env: KompakBindings, faceImage: File): Promise<string>;
    delete(env: KompakBindings, faceId: string): Promise<void>;
}

const requestWithTimeout = async (
    input: string,
    init: RequestInit
): Promise<Response> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FACE_REQUEST_TIMEOUT_MS);

    try {
        return await fetch(input, { ...init, signal: controller.signal });
    } catch (error) {
        if (controller.signal.aborted) {
            throw ApiError.gatewayTimeout("Face enrollment service timed out");
        }
        throw ApiError.serviceUnavailable("Face enrollment service is unavailable");
    } finally {
        clearTimeout(timeout);
    }
};

const readFaceError = async (response: Response): Promise<FaceErrorResponse> => {
    try {
        return await response.json<FaceErrorResponse>();
    } catch {
        return {};
    }
};

export const httpFaceEnrollmentClient: FaceEnrollmentClient = {
    async enroll(env, faceImage) {
        const form = new FormData();
        form.append("image", faceImage, faceImage.name || "face.jpg");

        const response = await requestWithTimeout(
            `${env.FACE_API_URL.replace(/\/$/, "")}/api/v1/faces`,
            {
                method: "POST",
                headers: { "X-API-Key": env.FACE_API_KEY },
                body: form,
            }
        );

        if (!response.ok) {
            const error = await readFaceError(response);
            const message = error.message || "Face image could not be enrolled";

            if (response.status === 413) {
                throw ApiError.payloadTooLarge(message);
            }
            if (response.status === 422) {
                throw ApiError.validation(message, {
                    faceImage: message,
                    faceCode: error.code,
                });
            }
            throw ApiError.serviceUnavailable("Face enrollment service is unavailable");
        }

        const data = await response.json<FaceRegistrationResponse>();
        if (!data.face_id) {
            throw ApiError.badGateway("Face enrollment service returned an invalid response");
        }
        return data.face_id;
    },

    async delete(env, faceId) {
        const response = await requestWithTimeout(
            `${env.FACE_API_URL.replace(/\/$/, "")}/api/v1/faces/${encodeURIComponent(faceId)}`,
            {
                method: "DELETE",
                headers: { "X-API-Key": env.FACE_API_KEY },
            }
        );

        if (!response.ok && response.status !== 404) {
            throw ApiError.serviceUnavailable("Face enrollment cleanup failed");
        }
    },
};
