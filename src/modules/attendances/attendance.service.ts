import type { Context } from "hono";
import attendanceRepository from "./attendance.repository";
import { ApiError } from "../../utils/api-error";
import { calculateDistance } from "../../utils/geolocation";
import type { CreateAttendanceInput } from "./attendance.schema";
import { uuidv7 } from "uuidv7";

export const recordAttendance = async (c: Context, data: CreateAttendanceInput) => {
    // Fetch Event
    const event = await attendanceRepository.getEvent(c, data.eventId);

    if (!event) {
        throw new ApiError(404, "Event not found");
    }

    // Fetch User by userId or faceEmbeddingId
    let user;

    if (data.userId) {
        user = await attendanceRepository.getUser(c, data.userId);
    } else if (data.faceEmbeddingId) {
        user = await attendanceRepository.getUserByFaceEmbeddingId(c, data.faceEmbeddingId);
    }

    if (!user) {
        throw new ApiError(404, "User not found or Face not recognized");
    }

    if (user.status !== "APPROVED") {
        throw new ApiError(403, "User account is pending approval or rejected");
    }

    const now = new Date();
    const nowMs = now.getTime();

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
    if (event.latitude === null || event.longitude === null) {
        throw new ApiError(400, "Event does not have geolocation configured");
    }

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

    // Database Transaction
    const rewardPoints = event.rewardPoints;
    const attendanceId = uuidv7();

    try {
        await attendanceRepository.createAttendanceTransaction(
            c,
            attendanceId,
            user,
            event.id,
            rewardPoints,
            now
        );
    } catch (error: any) {
        // Handle unique constraint violation just in case of race condition
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

export default {
    recordAttendance
};
