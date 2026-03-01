import { Router } from "express";
import * as progressController from "../controllers/progress.controller";
import { authenticate, isStudent } from "../middlewares/auth.middleware";

const router = Router();

router.use(authenticate);
router.use(isStudent);

router.get("/", progressController.getProgress);

router.get("/statistics", progressController.getStatistics);

router.get("/chart", progressController.getChart);

export default router;
