import type { DlpResult } from "../services/dlp.service";

declare global {
  namespace Express {
    interface Request {
      dlp?: DlpResult;
    }
  }
}

export {};