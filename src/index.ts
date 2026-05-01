import { createServer } from "node:http";
import { env } from "./lib/env.js";
import { createApp } from "./server/app.js";

const app = createApp();
const server = createServer(app);

server.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${env.PORT}`);
});

