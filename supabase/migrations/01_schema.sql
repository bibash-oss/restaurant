-- ==============================================================================
-- RESTAURANT QR ORDERING & PAYMENT MVP - DATABASE SCHEMA
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. RESTAURANTS
CREATE TABLE IF NOT EXISTS public.restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    currency TEXT NOT NULL DEFAULT 'usd',
    address TEXT,
    phone TEXT,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABLES
CREATE TABLE IF NOT EXISTS public.tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    table_number TEXT NOT NULL,
    qr_token TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_table_per_restaurant UNIQUE (restaurant_id, table_number)
);

-- 3. CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. MENU ITEMS
CREATE TABLE IF NOT EXISTS public.menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL, -- price in cents (e.g., 1499 = $14.99)
    image_url TEXT,
    is_available BOOLEAN DEFAULT true NOT NULL,
    dietary_tags TEXT[] DEFAULT '{}', -- e.g. ['Vegetarian', 'Gluten-Free']
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    table_id UUID NOT NULL REFERENCES public.tables(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED')),
    total_amount INTEGER NOT NULL, -- calculated server-side in cents
    currency TEXT NOT NULL DEFAULT 'usd',
    stripe_session_id TEXT,
    customer_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. ORDER ITEMS
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price INTEGER NOT NULL, -- frozen price at time of order in cents
    item_name TEXT NOT NULL -- snapshot of name in case menu item is later renamed
);

-- INDEXES FOR FAST QUERYING
CREATE INDEX IF NOT EXISTS idx_restaurants_slug ON public.restaurants(slug);
CREATE INDEX IF NOT EXISTS idx_tables_qr_token ON public.tables(qr_token);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON public.menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_categories_restaurant ON public.categories(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant ON public.orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- RESTAURANTS: Anyone can read restaurant details (for public ordering menu)
CREATE POLICY "Public can view restaurants" 
ON public.restaurants FOR SELECT USING (true);

-- RESTAURANTS: Authenticated owner can manage
CREATE POLICY "Owner can manage own restaurant" 
ON public.restaurants FOR ALL TO authenticated 
USING (owner_id = auth.uid()) 
WITH CHECK (owner_id = auth.uid());

-- TABLES: Anyone can read active tables
CREATE POLICY "Public can view active tables" 
ON public.tables FOR SELECT USING (is_active = true);

-- TABLES: Authenticated owner can manage tables
CREATE POLICY "Restaurant owner can manage tables" 
ON public.tables FOR ALL TO authenticated 
USING (restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()))
WITH CHECK (restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()));

-- CATEGORIES: Public read
CREATE POLICY "Public can view categories" 
ON public.categories FOR SELECT USING (true);

-- CATEGORIES: Authenticated owner manage
CREATE POLICY "Restaurant owner can manage categories" 
ON public.categories FOR ALL TO authenticated 
USING (restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()))
WITH CHECK (restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()));

-- MENU ITEMS: Public can view available items
CREATE POLICY "Public can view menu items" 
ON public.menu_items FOR SELECT USING (true);

-- MENU ITEMS: Authenticated owner manage
CREATE POLICY "Restaurant owner can manage menu items" 
ON public.menu_items FOR ALL TO authenticated 
USING (restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()))
WITH CHECK (restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()));

-- ORDERS: Public can read orders (to track their order status via orderId)
CREATE POLICY "Anyone can view their order" 
ON public.orders FOR SELECT USING (true);

-- ORDERS: Public can insert pending orders (or server creates it)
CREATE POLICY "Anyone can insert orders" 
ON public.orders FOR INSERT WITH CHECK (true);

-- ORDERS: Authenticated owner can update/manage orders
CREATE POLICY "Restaurant owner can update orders" 
ON public.orders FOR ALL TO authenticated 
USING (restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()))
WITH CHECK (restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()));

-- ORDER ITEMS: Public read and insert
CREATE POLICY "Anyone can view order items" 
ON public.order_items FOR SELECT USING (true);

CREATE POLICY "Anyone can insert order items" 
ON public.order_items FOR INSERT WITH CHECK (true);

-- ==============================================================================
-- AUTOMATIC TIMESTAMP TRIGGER
-- ==============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_restaurants_updated_at ON public.restaurants;
CREATE TRIGGER set_restaurants_updated_at BEFORE UPDATE ON public.restaurants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_tables_updated_at ON public.tables;
CREATE TRIGGER set_tables_updated_at BEFORE UPDATE ON public.tables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_menu_items_updated_at ON public.menu_items;
CREATE TRIGGER set_menu_items_updated_at BEFORE UPDATE ON public.menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_orders_updated_at ON public.orders;
CREATE TRIGGER set_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
