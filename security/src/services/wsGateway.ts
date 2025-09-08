import type { IncomingMessage } from "http";
import WebSocket, { WebSocketServer } from "ws";
import pino from "pino";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { getEnv } from "../config/env";
import { assessContentRisk, basicSanitize } from "./dlp.service";
import { createMessageValidator } from "../schemas/messages.schema";

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

export function createWsGateway() {
  const env = getEnv();
  const ajv = new Ajv({ allErrors: true, removeAdditional: "failing", allowUnionTypes: true });
  addFormats(ajv);
  const validateMessage = createMessageValidator(ajv);

  const wss = new WebSocketServer({ noServer: true });

  wss.on("connection", (client: WebSocket, req: IncomingMessage) => {
    const ip = (req.socket.remoteAddress || "").toString();

    // Connect to backend WS
    const downstream = new WebSocket(env.DOWNSTREAM_WS_URL, { perMessageDeflate: true });

    downstream.on("open", () => logger.debug({ ip }, "downstream connected"));
    downstream.on("close", (code, reason) => {
      logger.debug({ code, reason: reason.toString() }, "downstream closed");
      if (client.readyState === WebSocket.OPEN) client.close(code, reason);
    });
    downstream.on("error", (err) => {
      logger.warn({ err }, "downstream error");
      if (client.readyState === WebSocket.OPEN) client.close(1011, "upstream error");
    });

    // Forward backend -> client
    downstream.on("message", (data) => {
      if (client.readyState === WebSocket.OPEN) client.send(data);
    });

    // Validate and forward client -> backend
    client.on("message", (raw) => {
      // Size guard
      const size = Buffer.isBuffer(raw) ? raw.byteLength : Buffer.byteLength(String(raw), "utf8");
      if (size === 0 || size > env.MAX_MSG_BYTES) {
        logger.warn({ ip, size }, "message size invalid");
        return client.close(1009, "message too large");
      }

      let msg: unknown;
      try {
        const text = typeof raw === "string" ? raw : raw.toString("utf8");
        msg = JSON.parse(text);
      } catch {
        logger.warn({ ip }, "invalid json");
        return client.close(1003, "invalid json");
      }

      if (!validateMessage(msg)) {
        logger.warn({ ip, errors: validateMessage.errors }, "schema validation failed");
        return client.close(1003, "invalid message");
      }

      // Optional sanitize known text fields
      // Example: for send_message payload
      try {
        const m = msg as any;
        if (m?.type === "send_message" && typeof m?.payload?.text === "string") {
          m.payload.text = basicSanitize(m.payload.text);
        }
      } catch { /* noop */ }

      // DLP scoring (catch risky, pass-through unless DLP_MODE=block)
      const contentForDlp = (msg as any)?.payload?.text ?? (msg as any)?.payload?.token ?? "";
      const risk = assessContentRisk(contentForDlp);
      const flagged = risk.sensitive || risk.score >= env.DLP_BLOCK_THRESHOLD;

      if (flagged) {
        logger.warn({ ip, reasons: risk.reasons, score: risk.score }, "dlp flagged message");
        if (env.DLP_MODE === "block") {
          return client.close(1008, "message blocked");
        }
      }

      if (downstream.readyState === WebSocket.OPEN) {
        downstream.send(JSON.stringify(msg));
      } else {
        logger.warn("downstream not ready");
        client.close(1011, "upstream not ready");
      }
    });

    client.on("close", () => {
      if (downstream.readyState === WebSocket.OPEN) downstream.close(1000, "client closed");
    });
    client.on("error", (err) => {
      logger.warn({ err }, "client error");
      if (downstream.readyState === WebSocket.OPEN) downstream.close(1011, "client error");
    });
  });

  function handleUpgrade(req: IncomingMessage, socket: any, head: Buffer) {
    const env = getEnv();
    const origin = (req.headers.origin || "").toString();
    if (env.ALLOWED_WS_ORIGINS.length && !env.ALLOWED_WS_ORIGINS.includes(origin)) {
      socket.destroy();
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
  }

  return { handleUpgrade };
}