// Database Types for Supabase
export type InventoryItemDB = {
  id?: string;
  user_id?: string;
  order_id: string;
  order_date: string;
  product_name: string;
  category: string;
  quantity: number;
  unit: string;
  expiry_date: string;
  days_until_expiry: number;
  status: 'fresh' | 'caution' | 'warning' | 'expired';
  storage_type: string;
  tags: string[];
  common_uses: string[];
  is_consumed: boolean;
  consumed_date?: string;
  created_at?: string;
  updated_at?: string;
};
