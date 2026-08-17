import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { logger } from "../utils/logger";

// Central error handler. Operational errors (AppError) surface their message
// to the client; anything else is logged server-side and only a generic
// message is returned — never a stack trace or raw error detail.
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  if (err instanceof AppError) {
    logger.warn("Operational error", {
      path: req.path,
      method: req.method,
      message: err.message,
      statusCode: err.statusCode,
    });
    return res.status(err.statusCode).json({ error: err.message });
  }

  logger.error("Unhandled error", {
    path: req.path,
    method: req.method,
    error: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
  });

  return res.status(500).json({ error: "Something went wrong. Please try again." });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
}
