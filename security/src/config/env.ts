import "dotenv/config";

export function getEnv() {
  const {
    PORT = "8090",
    MAX_MSG_BYTES = "4096",
    DOWNSTREAM_WS_URL = "ws://backend:8080",
    ALLOWED_WS_ORIGINS = "",
    DLP_MODE = "report",
    DLP_BLOCK_THRESHOLD = "80",
  } = process.env;

  return {
    PORT: Number(PORT),
    MAX_MSG_BYTES: Number(MAX_MSG_BYTES),
    DOWNSTREAM_WS_URL,
    ALLOWED_WS_ORIGINS: ALLOWED_WS_ORIGINS.split(",").map(s => s.trim()).filter(Boolean),
    DLP_MODE: DLP_MODE === "block" ? "block" : "report",
    DLP_BLOCK_THRESHOLD: Math.max(0, Math.min(100, Number(DLP_BLOCK_THRESHOLD))),
  };
}
