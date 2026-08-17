import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthedRequest } from "../middleware/auth";
import * as meetingService from "../services/meeting.service";

export const list = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { search, type, page, limit } = req.query as unknown as {
    search?: string;
    type?: string;
    page: number;
    limit: number;
  };
  const result = await meetingService.listMeetings({ ownerId: req.user!.userId, search, type, page, limit });
  res.status(200).json(result);
});

export const getById = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const meeting = await meetingService.getMeetingById(req.params.id, req.user!.userId);
  res.status(200).json({ meeting });
});

export const create = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const meeting = await meetingService.createMeeting(req.user!.userId, req.body);
  res.status(201).json({ meeting });
});

export const update = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const meeting = await meetingService.updateMeeting(req.params.id, req.user!.userId, req.body);
  res.status(200).json({ meeting });
});

export const remove = asyncHandler(async (req: AuthedRequest, res: Response) => {
  await meetingService.deleteMeeting(req.params.id, req.user!.userId);
  res.status(204).send();
});

export const regenerate = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const meeting = await meetingService.regenerateInsights(req.params.id, req.user!.userId);
  res.status(200).json({ meeting });
});
