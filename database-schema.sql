-- NoshNuture Database Schema
-- Run this SQL in Supabase SQL Editor

-- Create inventory_items table
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  order_id TEXT NOT NULL,
  order_date TEXT NOT NULL,
  product_name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  expiry_date TEXT NOT NULL,
  days_until_expiry INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('fresh', 'caution', 'warning', 'expired')),
  storage_type TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  common_uses TEXT[] DEFAULT '{}',
  is_consumed BOOLEAN DEFAULT FALSE,
  consumed_date TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_inventory_user_id ON inventory_items(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_expiry ON inventory_items(days_until_expiry);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON inventory_items(status);
CREATE INDEX IF NOT EXISTS idx_inventory_consumed ON inventory_items(is_consumed);

-- Enable Row Level Security (RLS)
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for now (we'll add auth later)
CREATE POLICY "Allow all operations for demo" 
  ON inventory_items 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_inventory_items_updated_at 
  BEFORE UPDATE ON inventory_items 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
