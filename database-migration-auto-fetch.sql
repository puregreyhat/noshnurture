-- Migration: Add Auto-Fetch Tracking for v-it Orders
-- Run this in Supabase SQL Editor to enable auto-fetch features

-- 1. Create table to track v-it sync status per user
CREATE TABLE IF NOT EXISTS vkart_sync (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  auto_fetch_enabled BOOLEAN DEFAULT false,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create index for user lookups
CREATE INDEX IF NOT EXISTS idx_vkart_sync_user_id ON vkart_sync(user_id);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE vkart_sync ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policy: Users can view their own sync preferences
CREATE POLICY "Users can view their own vkart_sync"
  ON vkart_sync
  FOR SELECT
  USING (auth.uid()::text = user_id);

-- 5. Create RLS Policy: Users can update their own sync preferences
CREATE POLICY "Users can update their own vkart_sync"
  ON vkart_sync
  FOR UPDATE
  USING (auth.uid()::text = user_id);

-- 6. Create RLS Policy: System can insert new sync records
CREATE POLICY "Allow insert for authenticated users"
  ON vkart_sync
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- Verify table was created
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'vkart_sync';
