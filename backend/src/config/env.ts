import "dotenv/config";
import { z } from "zod";

// Fail fast and loud at startup if required env vars are missing/malformed,
// instead of surfacing confusing errors deep inside a request handler.
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  AI_PROVIDER: z.enum(["anthropic", "gemini", "mock"]).default("mock"),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default("claude-haiku-4-5-20251001"),
  GEMINI_API_KEY: z.string().optional(),
  // "gemini-flash-latest" is a stable alias Google keeps pointed at their
  // current recommended fast model, so this doesn't need to be updated
  // every time a specific dated model (e.g. gemini-2.5-flash) is deprecated.
  GEMINI_MODEL: z.string().default("gemini-flash-latest"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

if (parsed.data.AI_PROVIDER === "anthropic" && !parsed.data.ANTHROPIC_API_KEY) {
  console.warn(
    "[env] AI_PROVIDER=anthropic but ANTHROPIC_API_KEY is not set. " +
      "Falling back to the mock AI provider so the app still runs."
  );
  parsed.data.AI_PROVIDER = "mock";
}

if (parsed.data.AI_PROVIDER === "gemini" && !parsed.data.GEMINI_API_KEY) {
  console.warn(
    "[env] AI_PROVIDER=gemini but GEMINI_API_KEY is not set. " +
      "Falling back to the mock AI provider so the app still runs."
  );
  parsed.data.AI_PROVIDER = "mock";
}

export const env = parsed.data;
