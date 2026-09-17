export interface Restaurant {
  id: string;
  owner_id?: string | null;
  name: string;
  slug: string;
  currency: string;
  address?: string | null;
  phone?: string | null;
  logo_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface RestaurantTable {
  id: string;
  restaurant_id: string;
  table_number: string;
  qr_token: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  restaurant_id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id?: string | null;
  name: string;
  description: string | null;
  price: number; // in cents, e.g. 1499 = $14.99
  image_url: string | null;
  is_available: boolean;
  dietary_tags?: string[];
  created_at: string;
  updated_at: string;
}

export type OrderStatus = 'PENDING' | 'PREPARING' | 'DISPATCHED' | 'PAID' | 'READY' | 'COMPLETED' | 'CANCELLED';

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id?: string | null;
  quantity: number;
  unit_price: number;
  item_name: string;
}

export interface Order {
  id: string;
  restaurant_id: string;
  table_id: string;
  status: OrderStatus;
  total_amount: number;
  currency: string;
  stripe_session_id?: string | null;
  customer_notes?: string | null;
  created_at: string;
  updated_at: string;
  tables?: {
    table_number: string;
  };
  order_items?: OrderItem[];
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}
