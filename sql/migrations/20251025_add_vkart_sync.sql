-- Migration: add vkart_sync table to track per-user last synced timestamp
-- Run this in Supabase SQL editor or via your migration tooling

CREATE TABLE IF NOT EXISTS vkart_sync (
  user_id TEXT PRIMARY KEY,
  last_synced_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_vkart_sync_user_id ON vkart_sync(user_id);
