import app, { startServer } from "./api/index";

// Start full-stack server if not running in a serverless environment (e.g. Vercel)
if (!process.env.VERCEL) {
  startServer();
}

export { app, startServer };
export default app;
