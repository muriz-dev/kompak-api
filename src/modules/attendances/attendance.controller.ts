import type { Context } from "hono";
import attendanceService from "./attendance.service";

export const recordAttendance = async (c: Context) => {
    const payload = c.req.valid("json" as never) as any;
    
    const data = await attendanceService.recordAttendance(c, payload);
    
    return c.json({
        success: true,
        message: "Attendance recorded successfully",
        data
    }, 201);
};

export const getMyAttendances = async (c: Context) => {
    const data = await attendanceService.getMyAttendances(c);
    return c.json({
        success: true,
        message: "My attendances retrieved successfully",
        data
    });
};

export const getEventAttendances = async (c: Context) => {
    const { eventId } = c.req.valid("param" as never) as any;
    const data = await attendanceService.getEventAttendances(c, eventId);
    return c.json({
        success: true,
        message: "Event attendances retrieved successfully",
        data
    });
};

export default {
    recordAttendance,
    getMyAttendances,
    getEventAttendances
};
