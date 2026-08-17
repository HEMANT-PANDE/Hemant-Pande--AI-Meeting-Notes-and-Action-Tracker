import { Router } from "express";
import authRoutes from "./auth.routes";
import meetingRoutes from "./meeting.routes";
import actionItemRoutes from "./actionItem.routes";
import dashboardRoutes from "./dashboard.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/meetings", meetingRoutes);
router.use("/action-items", actionItemRoutes);
router.use("/dashboard", dashboardRoutes);

export default router;
