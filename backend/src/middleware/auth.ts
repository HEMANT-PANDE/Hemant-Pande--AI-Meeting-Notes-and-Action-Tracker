import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/jwt";
import { UnauthorizedError } from "../utils/AppError";

export interface AuthedRequest extends Request {
  user?: { userId: string; email: string };
}

// Bearer-token auth. Simpler than httpOnly cookies across two localhost
// ports within the assessment's time box — documented as a known trade-off
// (XSS could exfiltrate the token) in the README.
export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return next(new UnauthorizedError("Authentication token missing"));
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired session"));
  }
}
