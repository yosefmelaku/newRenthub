/**
 * database/db.ts  —  DEPRECATED
 *
 * This file is no longer used. All database access has been migrated to
 * Prisma Client (`../lib/prisma`).
 *
 * ─── Migration summary ───────────────────────────────────────────────────────
 *
 * Old approach (raw pg connection pool):
 *   import { Pool } from 'pg';
 *   const pool = new Pool({ user, password, host, port, database });
 *   const result = await pool.query('SELECT * FROM public.users WHERE email = $1', [email]);
 *   const user = result.rows[0];   // manual unwrap, no type safety
 *
 * New approach (Prisma Client singleton in lib/prisma.ts):
 *   import { PrismaClient } from '@prisma/client';
 *   const prisma = new PrismaClient();     // manages its own connection pool
 *   const user = await prisma.user.findUnique({ where: { email } });  // fully typed
 *
 * Why the pg pool is no longer needed:
 *   • PrismaClient maintains its own internal connection pool — no manual
 *     pool.connect() / client.release() lifecycle.
 *   • Queries are expressed as type-safe method calls, not SQL strings with
 *     positional $1…$N parameters.
 *   • Transactions use prisma.$transaction(async (tx) => { ... }) — no manual
 *     BEGIN / COMMIT / ROLLBACK.
 *   • The singleton in lib/prisma.ts prevents multiple PrismaClient instances
 *     from being created during hot-reload in development.
 *
 * Safe to delete this file once you confirm no imports remain.
 * ────────────────────────────────────────────────────────────────────────────
 */

// Re-export a stub so any overlooked import doesn't crash the server.
// Remove this file entirely once all imports have been cleaned up.
export default null;
