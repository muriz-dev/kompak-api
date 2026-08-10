import type { Context } from "hono";
import attendanceService from "./attendance.service";
import { ApiResponse } from "../../utils/api-response";

export const recordAttendance = async (c: Context) => {
    const payload = c.req.valid("form" as never) as any;

    const data = await attendanceService.recordAttendance(c, payload);

    return ApiResponse.created(c, "Attendance recorded successfully", data);
};

export const getMyAttendances = async (c: Context) => {
    const data = await attendanceService.getMyAttendances(c);

    return ApiResponse.ok(c, "My attendances retrieved successfully", data);
};

export const getEventAttendances = async (c: Context) => {
    const { eventId } = c.req.valid("param" as never) as any;

    const data = await attendanceService.getEventAttendances(c, eventId);

    return ApiResponse.ok(c, "Event attendances retrieved successfully", data);
};

export default {
    recordAttendance,
    getMyAttendances,
    getEventAttendances
};
