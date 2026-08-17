import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthedRequest } from "../middleware/auth";
import * as authService from "../services/auth.service";

export const register = asyncHandler(async (req, res: Response) => {
  const { user, token } = await authService.registerUser(req.body);
  res.status(201).json({ user, token });
});

export const login = asyncHandler(async (req, res: Response) => {
  const { user, token } = await authService.loginUser(req.body);
  res.status(200).json({ user, token });
});

// Logout is stateless (JWT, no server-side session) — the client just
// discards the token. Endpoint kept for a consistent API surface and as the
// natural place to add token revocation later if needed.
export const logout = asyncHandler(async (_req, res: Response) => {
  res.status(200).json({ message: "Logged out" });
});

export const me = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const user = await authService.getUserById(req.user!.userId);
  res.status(200).json({ user });
});
