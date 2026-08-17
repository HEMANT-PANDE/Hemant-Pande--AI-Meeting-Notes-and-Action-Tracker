import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthedRequest } from "../middleware/auth";
import * as actionItemService from "../services/actionItem.service";

export const list = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const q = req.query as unknown as {
    search?: string;
    status?: string;
    priority?: string;
    owner?: string;
    overdueOnly?: boolean;
    dueBefore?: Date;
    dueAfter?: Date;
    meetingId?: string;
    page: number;
    limit: number;
  };
  const result = await actionItemService.listActionItems({ ownerId: req.user!.userId, ...q });
  res.status(200).json(result);
});

export const create = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const item = await actionItemService.createActionItem(req.user!.userId, req.body);
  res.status(201).json({ actionItem: item });
});

export const update = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const item = await actionItemService.updateActionItem(req.params.id, req.user!.userId, req.body);
  res.status(200).json({ actionItem: item });
});

export const remove = asyncHandler(async (req: AuthedRequest, res: Response) => {
  await actionItemService.deleteActionItem(req.params.id, req.user!.userId);
  res.status(204).send();
});
