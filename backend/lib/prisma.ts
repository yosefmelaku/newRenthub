/**
 * lib/prisma.ts
 *
 * Prisma Client singleton — the single point of connection between
 * your Express backend and your local PostgreSQL database.
 *
 * ─── How this replaces the old pg Pool ────────────────────────────────────
 *
 * OLD (database/db.ts):
 *   import { Pool } from 'pg';
 *   const pool = new Pool({ user, password, host, port, database });
 *   // Every controller had to import pool and call pool.query('SELECT ...')
 *
 * NEW (this file):
 *   import { PrismaClient } from '@prisma/client';
 *   const prisma = new PrismaClient();
 *   // Every controller imports prisma and calls prisma.user.findMany() etc.
 *
 * Prisma manages its own internal connection pool — you never manually
 * acquire or release connections.
 *
 * The globalForPrisma pattern prevents multiple PrismaClient instances
 * from being created during hot-reload in development (bun --watch).
 * ─────────────────────────────────────────────────────────────────────────
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from backend root so DATABASE_URL is available
dotenv.config({ path: path.join(__dirname, '../.env') });

// Singleton pattern — one PrismaClient for the whole app lifetime
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient(): PrismaClient {
  // Create a pg connection pool using the DATABASE_URL from .env
  // DATABASE_URL = postgresql://postgres:Yosef%401223@localhost:5432/rentalsystem
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  // PrismaPg adapter bridges Prisma Client ↔ the pg pool
  // This is what allows Prisma to talk to your local PostgreSQL
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']   // logs every SQL query in dev — remove in prod
      : ['error'],
  });
}

// Reuse existing instance if available (avoids hot-reload connection leaks)
export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
