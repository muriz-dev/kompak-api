import type { Context } from "hono";
import attendanceRepository from "./attendance.repository";
import { ApiError } from "../../utils/api-error";
import { calculateDistance } from "../../utils/geolocation";
import type { CreateAttendanceInput } from "./attendance.schema";
import { httpFaceEnrollmentClient } from "../users/face-enrollment.client";

export const recordAttendance = async (c: Context, data: CreateAttendanceInput) => {
    const event = await attendanceRepository.getEvent(c, data.eventId);

    if (!event) {
        throw new ApiError(404, "Event not found");
    }

    if (event.status !== "PUBLISHED") {
        throw new ApiError(400, "Event is not active or published");
    }

    const jwtPayload = c.get("jwtPayload") as any;
    const userId = jwtPayload?.id;
    
    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    const user = await attendanceRepository.getUser(c, userId);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (user.status !== "ACTIVE") {
        throw new ApiError(403, "User account is pending approval or rejected");
    }

    const nowMs = Date.now();

    // Time Window Validation
    if (!event.attendanceStartTime || !event.attendanceEndTime) {
        throw new ApiError(400, "Event does not have an active attendance window");
    }

    const startTimeMs = new Date(event.attendanceStartTime).getTime();
    const endTimeMs = new Date(event.attendanceEndTime).getTime();

    if (nowMs < startTimeMs || nowMs > endTimeMs) {
        throw new ApiError(400, "Attendance is currently closed for this event");
    }

    // Geolocation Validation

    const radius = event.radiusMeters ?? 50;
    const distance = calculateDistance(
        data.latitude,
        data.longitude,
        event.latitude,
        event.longitude
    );

    if (distance > radius) {
        throw new ApiError(400, "User is not within the event radius");
    }

    // Idempotency Check (Check if already attended)
    const existingAttendance = await attendanceRepository.getExistingAttendance(c, user.id, event.id);

    if (existingAttendance) {
        throw new ApiError(409, "User has already attended this event");
    }

    const faceResult = await httpFaceEnrollmentClient.search(c.env, data.faceImage);
    if (!faceResult.matched || faceResult.faceId !== user.faceEmbeddingId) {
        throw ApiError.validation("Face could not be verified", {
            faceImage: "Your face does not match the registered identity. Please try again.",
            faceCode: "face_mismatch",
        });
    }

    // Database Transaction
    const rewardPoints = event.rewardPoints;

    let attendanceId: string;
    try {
        attendanceId = await attendanceRepository.createAttendanceTransaction(
            c,
            {
                userId: user.id,
                eventId: event.id,
                activityPhotoUrl: data.activityPhotoUrl,
                activityDescription: data.activityDescription,
                rewardPoints: rewardPoints,
                currentBalance: user.balance ?? 0,
                currentLeaderboardPoints: user.leaderboardPoints ?? 0
            }
        );
    } catch (error: any) {
        if (error.message?.includes('UNIQUE constraint failed') || error.message?.includes('D1_ERROR')) {
            throw ApiError.conflict("User has already attended this event");
        }
        console.error("ATTENDANCE ERROR:", error);
        throw ApiError.server("Failed to record attendance due to server error");
    }

    return {
        attendanceId,
        pointsEarned: rewardPoints
    };
};

export const getMyAttendances = async (c: Context) => {
    const jwtPayload = c.get("jwtPayload") as any;
    return attendanceRepository.getAttendancesByUserId(c, jwtPayload.id);
};

export const getEventAttendances = async (c: Context, eventId: string) => {
    return attendanceRepository.getAttendancesByEventId(c, eventId);
};

export default {
    recordAttendance,
    getMyAttendances,
    getEventAttendances
};
