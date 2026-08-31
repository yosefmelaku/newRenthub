-- Migration: add extra fields to properties table
-- Run with: psql $DATABASE_URL -f this_file.sql

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS subcity         VARCHAR,
  ADD COLUMN IF NOT EXISTS total_units     INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS rented_units    INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS parking_spaces  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS office_sqm      INTEGER;
