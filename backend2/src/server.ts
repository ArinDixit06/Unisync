import { createServer } from "node:http";

import cors from "cors";
import express from "express";
import { WebSocketServer } from "ws";

import { getTokenSubject } from "./supabaseAuth.js";
import { ApiError } from "./errors.js";
import { configureLogging, getLogger } from "./logging.js";
import { closeDb, initDb } from "./db.js";
import { frontendOrigins, settings } from "./config.js";
import { listenAndForward } from "./realtimeBus.js";
import { manager } from "./realtime.js";
import authRouter from "./routes/auth.js";
import calendarRouter from "./routes/calendar.js";
import composeRouter from "./routes/compose.js";
import emailsRouter from "./routes/emails.js";
import healthRouter from "./routes/health.js";
import labelsRouter from "./routes/labels.js";
import searchRouter from "./routes/search.js";
import syncRouter from "./routes/sync.js";
import webhooksRouter from "./routes/webhooks.js";

const app = express();
const logger = getLogger();
const abortController = new AbortController();
const maxAttachmentBytes = 150 * 1024 * 1024;
const maxJsonBodyLimit = "210mb";
const corsOptions = {
  origin: frontendOrigins(),
  credentials: true,
  methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"] as string[],
  allowedHeaders: ["Authorization", "Content-Type"] as string[],
  // Keep preflight responses bodyless but use 200 so clients and proxies do not
  // misread the preflight as a failed "204 no content" request.
  optionsSuccessStatus: 200
};

configureLogging();

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use((request, _response, next) => {
  if (request.path.startsWith("/webhooks")) return express.raw({ type: "*/*" })(request, _response, next);
  return express.json({ limit: maxJsonBodyLimit })(request, _response, next);
});

app.use(async (request, response, next) => {
  const start = Date.now();
  response.on("finish", async () => {
    const authHeader = request.header("authorization");
    const token = authHeader?.toLowerCase().startsWith("bearer ") ? authHeader.split(" ", 2)[1].trim() : null;
    logger.info("request", {
      method: request.method,
      path: request.path,
      status: response.statusCode,
      latency_ms: Date.now() - start,
      user_id: token ? await getTokenSubject(token) : null
    });
  });
  next();
});

app.use(healthRouter);
app.get("/", (_request, response) => {
  response.json({ status: "ok", service: "backend2" });
});
app.use("/auth", authRouter);
app.use("/emails", emailsRouter);
app.use("/compose", composeRouter);
app.use("/search", searchRouter);
app.use("/labels", labelsRouter);
app.use("/calendar", calendarRouter);
app.use("/webhooks", webhooksRouter);
app.use("/sync", syncRouter);

app.use((error: any, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  if (error?.type === "entity.too.large") {
    response.status(413).json({
      error: {
        code: "payload_too_large",
        message: `Attachments can be up to ${Math.round(maxAttachmentBytes / (1024 * 1024))} MB total.`
      }
    });
    return;
  }
  if (error instanceof ApiError) {
    response.status(error.statusCode).json({ error: { code: error.code, message: error.message, details: error.details } });
    return;
  }
  response.status(500).json({ error: { code: "http_error", message: String(error?.message ?? error) } });
});

const server = createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("connection", async (socket, request) => {
  const token = request.headers["sec-websocket-protocol"];
  const actualToken = Array.isArray(token) ? token[0] : token;
  const userId = actualToken ? await getTokenSubject(actualToken) : null;
  if (!userId) {
    socket.close(4401, "Unauthorized");
    return;
  }
  manager.connect(userId, socket);
  socket.on("close", () => manager.disconnect(userId, socket));
});

await initDb();
if (settings.useRedis && settings.redisUrl) {
  void listenAndForward(abortController.signal);
}

const port = Number(process.env.PORT ?? 8000);
server.listen(port, "0.0.0.0");

process.on("SIGINT", async () => {
  abortController.abort();
  await closeDb();
  server.close();
});
