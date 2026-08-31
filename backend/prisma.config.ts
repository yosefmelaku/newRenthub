import path from 'path';
import { defineConfig, env } from 'prisma/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Load DATABASE_URL from .env
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '.env') });

export default defineConfig({
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),

  datasource: {
    url: env("DATABASE_URL"),
  },
  migrate: {
    adapter: async () => {
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      return new PrismaPg(pool);
    },
  },
  migrations: {
    seed: 'bun ./prisma/seed.ts',
  },
});

