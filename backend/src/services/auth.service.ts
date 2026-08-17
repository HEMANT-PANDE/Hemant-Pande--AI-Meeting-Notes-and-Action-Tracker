import bcrypt from "bcryptjs";
import { prisma } from "../config/db";
import { signToken } from "../utils/jwt";
import { AppError } from "../utils/AppError";

const SALT_ROUNDS = 12;

export async function registerUser(input: { name: string; email: string; password: string }) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new AppError("An account with this email already exists", 409);
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: { name: input.name, email: input.email, passwordHash },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  const token = signToken({ userId: user.id, email: user.email });
  return { user, token };
}

export async function loginUser(input: { email: string; password: string }) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  // Same message for "no such user" and "wrong password" — don't leak which one.
  if (!user) throw new AppError("Invalid email or password", 401);

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) throw new AppError("Invalid email or password", 401);

  const token = signToken({ userId: user.id, email: user.email });
  return {
    user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt },
    token,
  };
}

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, createdAt: true },
  });
  if (!user) throw new AppError("User not found", 404);
  return user;
}
