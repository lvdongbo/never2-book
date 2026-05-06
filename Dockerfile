# ---- Build Stage ----
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json* ./

RUN npm ci

COPY . .

# Generate Prisma/Drizzle migrations
RUN npm run db:generate || true

# Build Next.js
RUN npm run build

# ---- Production Stage ----
FROM node:22-alpine AS runner

WORKDIR /app

# Install runtime dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

ENV NODE_ENV=production

COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json* ./

# Install only production deps
RUN npm ci --omit=dev

# Rebuild better-sqlite3 for the current architecture
RUN npm rebuild better-sqlite3

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Create data directory for SQLite and uploads
RUN mkdir -p /app/data/uploads

# Run migrations on startup
COPY docker-entrypoint.sh /app/
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 3000

ENV DATABASE_URL=/app/data/never2.db
ENV UPLOAD_DIR=/app/data/uploads

ENTRYPOINT ["/app/docker-entrypoint.sh"]
