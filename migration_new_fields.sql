-- Migration: add temperature, payment_method and has_royalties to deals table
-- Run this in the Supabase SQL Editor

ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS temperature     smallint DEFAULT 1,
  ADD COLUMN IF NOT EXISTS payment_method  text     DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS has_royalties   boolean  DEFAULT false;

-- Optional: add a check constraint so temperature is always 1-5
ALTER TABLE deals
  ADD CONSTRAINT deals_temperature_range CHECK (temperature >= 1 AND temperature <= 5);
