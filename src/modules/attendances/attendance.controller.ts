import type { Context, Env, ValidationTargets } from "hono";
import attendanceService from "./attendance.service";
import type { CreateAttendanceInput } from "./attendance.schema";
import { ApiResponse } from "../../utils/api-response";

type AttendanceContext = Context<Env, any, {
    in: Pick<ValidationTargets, 'json'> & {
        json: CreateAttendanceInput
    };
    out: Pick<ValidationTargets, 'json'> & {
        json: CreateAttendanceInput
    };
}>;

export const recordAttendance = async (c: AttendanceContext) => {
    const body = c.req.valid("json");

    const result = await attendanceService.recordAttendance(c, body);

    return ApiResponse.created(c, "Attendance recorded successfully", result);
};

export default {
    recordAttendance
};
