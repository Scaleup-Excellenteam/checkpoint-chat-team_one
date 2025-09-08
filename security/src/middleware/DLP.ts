import { Request, Response, NextFunction } from "express";
import { assessContentRisk, basicSanitize } from "../services/dlp.service";
import {getEnv} from "../config/env";
import type {} from "../types/express";

// Validate and DLP-check chat message content
export const validateMessageContent = (req: Request, res: Response, next: NextFunction) => {
  const { DLP_MODE, DLP_BLOCK_THRESHOLD, MAX_MSG_BYTES } = getEnv();
  const { content } = req.body ?? {};

  // Basic shape checks
  if (typeof content !== "string") {
    return res.status(400).json({ error: "Invalid message content" });
  }
  const byteLen = Buffer.byteLength(content, "utf8");
  if (byteLen === 0 || byteLen > MAX_MSG_BYTES) {
    return res.status(400).json({ error: "Message size out of allowed range" });
  }

  // Sanitize
  req.body.content = basicSanitize(content);

  // Risk assessment
  const result = assessContentRisk(req.body.content);
  // Attach to request for downstream logging/auditing
  req.dlp = result;

  // Pass-through by default; block only in block mode when threshold is exceeded
  const flagged = result.score >= DLP_BLOCK_THRESHOLD || result.sensitive;
  res.setHeader("x-dlp-flagged", flagged ? "1" : "0");

  if (flagged && DLP_MODE === "block") {
    return res.status(400).json({ error: "Message blocked by DLP" });
  }

  next();
};
