# syntax=docker/dockerfile:1

# ---- deps: install once, reused by the build stage ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- build: compile TypeScript and generate the Prisma client ----
FROM node:20-alpine AS builder
WORKDIR /app
# Prisma's query/schema engine binaries for the linux-musl target need
# OpenSSL, which node:20-alpine doesn't ship — without this, `prisma
# generate` silently produces an engine that fails at runtime with
# "Could not parse schema engine response".
RUN apk add --no-cache openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# ---- runtime: minimal image, prod deps only ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl

COPY package.json package-lock.json ./
# --ignore-scripts: @prisma/client's postinstall would try (and fail to find
# a schema, since it isn't copied in yet) to run `prisma generate` here —
# harmless either way, but skipped since the already-generated client is
# copied in explicitly below.
RUN npm ci --omit=dev --ignore-scripts

# Compiled JS, Prisma schema/migrations, and the already-generated Prisma
# client (query engine included) — generated once in the build stage rather
# than re-generated here, since builder and runner share the same base image.
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:4000/health || exit 1

# Applies any pending migrations, then starts the server. Safe to run on
# every boot: prisma migrate deploy is a no-op when the schema is current.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
