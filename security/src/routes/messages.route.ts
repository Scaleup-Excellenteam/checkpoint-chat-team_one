import { Router } from "express";
import { pushMessage } from "../controllers/messages.controller";
import { validateMessageContent } from "../middleware/DLP";
const router = Router();

// Define your message routes here
router.post("/", validateMessageContent, pushMessage);

export default router;
