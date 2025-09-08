import http from "http";
import app from "./app";
import { createWsGateway } from "./services/wsGateway";
import { getEnv } from "./config/env";

const server = http.createServer(app);

const { handleUpgrade } = createWsGateway();
server.on("upgrade", (req, socket, head) => handleUpgrade(req, socket, head));

const { PORT } = getEnv();
server.listen(PORT, () => console.log(`Security gateway listening on ${PORT}`));

export default server;