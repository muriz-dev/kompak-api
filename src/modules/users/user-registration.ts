import type { Context } from "hono";
import type { Env } from "../../types";
import { ApiError } from "../../utils/api-error";
import { hashPassword } from "../../utils/password";
import type { RegisterUserSchema } from "./user.schema";
import userRepository from "./user.repository";
import {
    httpFaceEnrollmentClient,
    type FaceEnrollmentClient,
} from "./face-enrollment.client";

type RegistrationRepository = Pick<
    typeof userRepository,
    "create" | "getByEmail"
>;

type RegistrationDependencies = {
    repository: RegistrationRepository;
    faceEnrollment: Pick<FaceEnrollmentClient, "enroll" | "delete">;
    hash: typeof hashPassword;
};

export const createUserRegistration = ({
    repository,
    faceEnrollment,
    hash,
}: RegistrationDependencies) => ({
    async register(c: Context<Env, string, any>, data: RegisterUserSchema) {
        const existingUser = await repository.getByEmail(c, data.email);
        if (existingUser) {
            throw ApiError.conflict("Email already registered");
        }

        const { faceImage, password, ...personalData } = data;
        const passwordHash = await hash(password);
        const faceEmbeddingId = await faceEnrollment.enroll(c.env, faceImage);

        try {
            return await repository.create(c, {
                ...personalData,
                password: passwordHash,
                faceEmbeddingId,
            });
        } catch (error) {
            try {
                await faceEnrollment.delete(c.env, faceEmbeddingId);
            } catch (cleanupError) {
                console.error(
                    "Failed to compensate face enrollment after registration failure",
                    cleanupError instanceof Error ? cleanupError.message : "Unknown cleanup error"
                );
            }
            throw error;
        }
    },
});

export const userRegistration = createUserRegistration({
    repository: userRepository,
    faceEnrollment: httpFaceEnrollmentClient,
    hash: hashPassword,
});
