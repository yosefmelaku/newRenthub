/**
 * Run migration: Add rental_applications table
 * 
 * Usage: bun run run-migration-rental-applications.ts
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function runMigration() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL not found in environment variables');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });

  try {
    console.log('🔄 Connecting to database...');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'prisma/migrations/add_rental_applications_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    
    console.log('🔄 Running migration: add_rental_applications_table.sql');
    
    // Execute the migration
    await pool.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    console.log('✅ rental_applications table created with all columns and indexes');
    
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    if (error.detail) {
      console.error('Details:', error.detail);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
