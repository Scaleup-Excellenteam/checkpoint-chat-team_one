import { Request, Response, NextFunction } from "express";
import Message from "../schemas/messages.schema";
import { containsSensitiveData } from "@/services/dlp.service";

export const validateMessageContent = (req: Request, res: Response, next: NextFunction) => {
    const { room, user, content, createdAt } = req.body;
    // test for valid content (no sensitive data)
    if (containsSensitiveData(content)) {
        return res.status(400).json({ error: "Message contains sensitive data" });
    }
    // If the message content is valid, call next()
    // If not, return a 400 Bad Request response
    next();
};
