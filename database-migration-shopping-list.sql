-- Shopping List Feature Migration
-- Run this in Supabase SQL Editor

-- Create shopping_list table
CREATE TABLE IF NOT EXISTS shopping_list (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  quantity TEXT DEFAULT '1',
  unit TEXT DEFAULT 'pcs',
  added_from TEXT NOT NULL CHECK (added_from IN ('recipe', 'low_stock', 'manual')),
  recipe_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_shopping_list_user_id ON shopping_list(user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_list_added_from ON shopping_list(added_from);
CREATE INDEX IF NOT EXISTS idx_shopping_list_created_at ON shopping_list(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE shopping_list ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only view their own shopping list
CREATE POLICY "Users can view their own shopping list"
ON shopping_list
FOR SELECT
USING (auth.uid()::text = user_id);

-- Create policy: Users can only insert their own shopping list items
CREATE POLICY "Users can insert their own shopping list items"
ON shopping_list
FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

-- Create policy: Users can only update their own shopping list items
CREATE POLICY "Users can update their own shopping list items"
ON shopping_list
FOR UPDATE
USING (auth.uid()::text = user_id);

-- Create policy: Users can only delete their own shopping list items
CREATE POLICY "Users can delete their own shopping list items"
ON shopping_list
FOR DELETE
USING (auth.uid()::text = user_id);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Shopping list table created successfully with RLS policies!';
END $$;
