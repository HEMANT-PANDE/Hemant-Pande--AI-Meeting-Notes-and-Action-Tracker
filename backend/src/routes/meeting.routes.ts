import { Router } from "express";
import * as meetingController from "../controllers/meeting.controller";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  createMeetingSchema,
  listMeetingsSchema,
  meetingIdParamSchema,
  updateMeetingSchema,
} from "../validators/meeting.validators";

const router = Router();
router.use(requireAuth);

router.get("/", validate(listMeetingsSchema), meetingController.list);
router.post("/", validate(createMeetingSchema), meetingController.create);
router.get("/:id", validate(meetingIdParamSchema), meetingController.getById);
router.put("/:id", validate(updateMeetingSchema), meetingController.update);
router.delete("/:id", validate(meetingIdParamSchema), meetingController.remove);
router.post("/:id/regenerate-insights", validate(meetingIdParamSchema), meetingController.regenerate);

export default router;
