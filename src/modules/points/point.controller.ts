import type { Context } from "hono";
import { ApiResponse } from "../../utils/api-response";
import pointService from "./point.service";

export const getMyPointHistory = async (c: Context) => {
    const data = await pointService.getMyPointHistory(c);
    return ApiResponse.ok(c, "Point history retrieved successfully", data);
};
