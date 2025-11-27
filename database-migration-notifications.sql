-- Add notification preferences to users
-- Run this in Supabase SQL Editor

-- Add columns for notification preferences
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS notification_time TIME DEFAULT '07:00:00';
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS enable_telegram BOOLEAN DEFAULT false;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS enable_push BOOLEAN DEFAULT false;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS enable_email BOOLEAN DEFAULT true;

-- Create a user_preferences table (alternative approach if auth.users can't be modified)
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  notification_time TIME DEFAULT '07:00:00',
  telegram_chat_id TEXT,
  enable_telegram BOOLEAN DEFAULT false,
  enable_push BOOLEAN DEFAULT false,
  enable_email BOOLEAN DEFAULT true,
  push_subscription JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_telegram ON user_preferences(telegram_chat_id) WHERE telegram_chat_id IS NOT NULL;

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own preferences
CREATE POLICY "Users can view own preferences" 
  ON user_preferences 
  FOR SELECT 
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can update own preferences" 
  ON user_preferences 
  FOR UPDATE 
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own preferences" 
  ON user_preferences 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid()::text);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_user_preferences_updated_at_trigger ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at_trigger
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_preferences_updated_at();
