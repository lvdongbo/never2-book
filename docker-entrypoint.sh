#!/bin/sh
set -e

echo "Running database migrations..."
cd /app
npx tsx drizzle/migrate.ts || echo "Migration warning (may already be up-to-date)"

echo "Starting Next.js server..."
exec npx next start
