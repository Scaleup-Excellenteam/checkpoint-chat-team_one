import type { DlpResult } from "../services/dlp.service";

// Augment Express Request with `user`
import "express";

declare module "express-serve-static-core" {
  interface Request {
    user?: { id: string; username: string; roles?: string[] };
  }
}

declare global {
  namespace Express {
    interface Request {
      dlp?: DlpResult;
    }
  }
}




export {};