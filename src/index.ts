import { createServer } from "./server.js";
import config from "./config.js";

const server = createServer();

server.listen(config.port, () => {
  console.log(`api running on ${config.port}`);
});
