-- Migration: Add Authentication and Row Level Security
-- Run this in Supabase SQL Editor after setting up authentication

-- 1. Remove default value from user_id column
ALTER TABLE inventory_items 
ALTER COLUMN user_id DROP DEFAULT;

-- 2. Enable Row Level Security on inventory_items table
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

-- 3. Create policy: Users can only see their own inventory items
CREATE POLICY "Users can view their own inventory" 
ON inventory_items 
FOR SELECT 
USING (auth.uid()::text = user_id);

-- 4. Create policy: Users can only insert their own inventory items
CREATE POLICY "Users can insert their own inventory" 
ON inventory_items 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

-- 5. Create policy: Users can only update their own inventory items
CREATE POLICY "Users can update their own inventory" 
ON inventory_items 
FOR UPDATE 
USING (auth.uid()::text = user_id);

-- 6. Create policy: Users can only delete their own inventory items
CREATE POLICY "Users can delete their own inventory" 
ON inventory_items 
FOR DELETE 
USING (auth.uid()::text = user_id);

-- 7. Optional: If you have demo-user data, you can clean it up
-- DELETE FROM inventory_items WHERE user_id = 'demo-user';

-- 8. Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'inventory_items';
