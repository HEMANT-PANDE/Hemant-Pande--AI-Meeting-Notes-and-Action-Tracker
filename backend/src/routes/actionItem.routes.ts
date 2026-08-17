import { Router } from "express";
import * as actionItemController from "../controllers/actionItem.controller";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  createActionItemSchema,
  listActionItemsSchema,
  updateActionItemSchema,
} from "../validators/actionItem.validators";
import { meetingIdParamSchema } from "../validators/meeting.validators";

const router = Router();
router.use(requireAuth);

router.get("/", validate(listActionItemsSchema), actionItemController.list);
router.post("/", validate(createActionItemSchema), actionItemController.create);
router.put("/:id", validate(updateActionItemSchema), actionItemController.update);
router.delete("/:id", validate(meetingIdParamSchema), actionItemController.remove);

export default router;
