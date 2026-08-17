import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" })); // generous enough for pasted transcripts as JSON
app.use(morgan(env.NODE_ENV === "development" ? "dev" : "combined"));

app.get("/health", (_req, res) => res.status(200).json({ status: "ok", uptime: process.uptime() }));

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);
