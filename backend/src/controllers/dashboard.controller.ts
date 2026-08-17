import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthedRequest } from "../middleware/auth";
import * as dashboardService from "../services/dashboard.service";

export const getStats = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const stats = await dashboardService.getDashboardStats(req.user!.userId);
  res.status(200).json(stats);
});
