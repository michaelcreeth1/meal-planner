import { createServer } from "./server.js";

const host = process.env.HOST ?? "0.0.0.0";
const port = Number(process.env.PORT ?? 8787);
const app = createServer();

try {
  await app.listen({ host, port });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
