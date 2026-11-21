import 'dotenv/config';
import { createApp } from './app.js';

const app = createApp();
const server = app.listen(Number(process.env.PORT || 5174), () => {
  console.info(JSON.stringify({ event: 'server_started', port: Number(process.env.PORT || 5174) }));
});

function shutdown() {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
