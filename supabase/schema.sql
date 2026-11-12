-- =========================================================
-- AURA COMMERCE - COMPLETE SUPABASE POSTGRESQL SCHEMA (PHASE 2)
-- Relational Models, Authentication, RBAC & Row Level Security (RLS)
-- =========================================================

-- Enable uuid-ossp extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================
-- 1. ROLES & PERMISSIONS (RBAC)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.roles (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Default System Roles
INSERT INTO public.roles (id, name, description) VALUES
  ('role_admin', 'admin', 'Full platform administrator with unrestricted access'),
  ('role_manager', 'manager', 'Store operations manager for catalog and order fulfillment'),
  ('role_customer', 'customer', 'Verified consumer account for personal orders and profiles')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.permissions (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  role_id TEXT NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role_id, permission_key)
);

-- Seed Core Permissions
INSERT INTO public.permissions (id, role_id, permission_key) VALUES
  ('perm_1', 'role_admin', 'manage_all'),
  ('perm_2', 'role_admin', 'manage_products'),
  ('perm_3', 'role_admin', 'manage_orders'),
  ('perm_4', 'role_admin', 'manage_settings'),
  ('perm_5', 'role_admin', 'manage_affiliates'),
  ('perm_6', 'role_manager', 'manage_products'),
  ('perm_7', 'role_manager', 'manage_orders'),
  ('perm_8', 'role_customer', 'view_own_orders')
ON CONFLICT DO NOTHING;

-- =========================================================
-- 2. USER PROFILES (Linked to Supabase auth.users)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer' REFERENCES public.roles(name),
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Helper security function to check if current executing user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Helper security function to check if current user is manager or admin
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  );
$$;

-- Trigger to automatically create a profile record when a new user signs up in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- 3. CATEGORIES & TAXONOMY
-- =========================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================
-- 4. PRODUCTS & RELATIONAL IMAGES
-- =========================================================
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  sku TEXT UNIQUE NOT NULL,
  title_en TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  description_en TEXT,
  description_ar TEXT,
  category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  compare_at_price NUMERIC(10,2),
  stock INTEGER NOT NULL DEFAULT 0,
  image_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  rating NUMERIC(3,2) DEFAULT 4.80,
  reviews_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.product_images (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  alt_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================
-- 5. SHEIN AFFILIATE PRODUCTS & TRACKED CLICKS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.affiliate_products (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  product_id TEXT UNIQUE NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  platform TEXT DEFAULT 'SHEIN',
  external_product_id TEXT,
  affiliate_url TEXT NOT NULL,
  commission_rate NUMERIC(5,2) DEFAULT 12.00,
  default_sub_id TEXT DEFAULT 'aura_campaign',
  original_price NUMERIC(10,2),
  promo_code TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  product_id TEXT REFERENCES public.products(id) ON DELETE SET NULL,
  affiliate_product_id TEXT REFERENCES public.affiliate_products(id) ON DELETE SET NULL,
  sub_id TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_hash TEXT,
  estimated_commission NUMERIC(10,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================
-- 6. CUSTOMERS, ORDERS & ORDER ITEMS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.customers (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT DEFAULT 'US',
  total_spent NUMERIC(10,2) DEFAULT 0.00,
  orders_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  order_number TEXT UNIQUE NOT NULL,
  customer_id TEXT REFERENCES public.customers(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  shipping_city TEXT NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  shipping_cost NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_method TEXT DEFAULT 'cod' CHECK (payment_method IN ('cod', 'card', 'paypal')),
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
  coupon_code TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES public.products(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  size TEXT,
  color TEXT,
  total NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================
-- 7. BANNERS, COUPONS, SHIPPING, PAGES & SETTINGS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.banners (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  title_en TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  subtitle_en TEXT,
  subtitle_ar TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  target_channel TEXT DEFAULT 'all' CHECK (target_channel IN ('all', 'shein', 'direct')),
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.coupons (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10,2) NOT NULL,
  min_order_amount NUMERIC(10,2) DEFAULT 0.00,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.shipping_methods (
  id TEXT PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description_en TEXT,
  description_ar TEXT,
  cost NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  estimated_days TEXT NOT NULL DEFAULT '3-5 business days',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pages (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  slug TEXT UNIQUE NOT NULL,
  title_en TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  content_en TEXT NOT NULL,
  content_ar TEXT NOT NULL,
  is_published BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.store_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  store_name TEXT DEFAULT 'Aura Commerce',
  currency TEXT DEFAULT 'USD',
  shein_publisher_id TEXT DEFAULT 'SHEIN_AFF_98421',
  default_sub_id TEXT DEFAULT 'aura_direct',
  support_email TEXT DEFAULT 'hajji.ecommerce@gmail.com',
  free_shipping_threshold NUMERIC(10,2) DEFAULT 75.00,
  maintenance_mode BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================
-- 8. INDEXES FOR HIGH-PERFORMANCE RELATIONAL QUERIES
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_prod_product ON public.affiliate_products(product_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_prod ON public.affiliate_clicks(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_pages_slug ON public.pages(slug);

-- =========================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================

-- Enable RLS on every table
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- A. ROLES & PERMISSIONS
CREATE POLICY "Public read roles" ON public.roles FOR SELECT USING (true);
CREATE POLICY "Admin manage roles" ON public.roles FOR ALL USING (public.is_admin());
CREATE POLICY "Public read permissions" ON public.permissions FOR SELECT USING (true);
CREATE POLICY "Admin manage permissions" ON public.permissions FOR ALL USING (public.is_admin());

-- B. PROFILES
CREATE POLICY "User read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "User update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Admin insert profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id OR public.is_admin());
CREATE POLICY "Admin delete profile" ON public.profiles FOR DELETE USING (public.is_admin());

-- C. CATALOG (CATEGORIES, PRODUCTS, PRODUCT_IMAGES)
CREATE POLICY "Public read active categories" ON public.categories FOR SELECT USING (is_active = true OR public.is_staff());
CREATE POLICY "Staff manage categories" ON public.categories FOR ALL USING (public.is_staff());

CREATE POLICY "Public read active products" ON public.products FOR SELECT USING (is_active = true OR public.is_staff());
CREATE POLICY "Staff manage products" ON public.products FOR ALL USING (public.is_staff());

CREATE POLICY "Public read product images" ON public.product_images FOR SELECT USING (true);
CREATE POLICY "Staff manage product images" ON public.product_images FOR ALL USING (public.is_staff());

-- D. SHEIN AFFILIATE PRODUCTS & CLICKS
CREATE POLICY "Public read affiliate products" ON public.affiliate_products FOR SELECT USING (is_active = true OR public.is_staff());
CREATE POLICY "Staff manage affiliate products" ON public.affiliate_products FOR ALL USING (public.is_staff());

CREATE POLICY "Public insert affiliate clicks" ON public.affiliate_clicks FOR INSERT WITH CHECK (true);
CREATE POLICY "Staff read affiliate clicks" ON public.affiliate_clicks FOR SELECT USING (public.is_staff());

-- E. CUSTOMERS
CREATE POLICY "User read own customer record" ON public.customers FOR SELECT USING (auth.uid() = user_id OR public.is_staff());
CREATE POLICY "Public insert customer record" ON public.customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Staff manage customers" ON public.customers FOR ALL USING (public.is_staff());

-- F. ORDERS & ORDER ITEMS
CREATE POLICY "User view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id OR public.is_staff());
CREATE POLICY "Public insert orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Staff update orders" ON public.orders FOR UPDATE USING (public.is_staff());
CREATE POLICY "Admin delete orders" ON public.orders FOR DELETE USING (public.is_admin());

CREATE POLICY "User view own order items" ON public.order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id AND (orders.user_id = auth.uid() OR public.is_staff())
  )
);
CREATE POLICY "Public insert order items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Staff manage order items" ON public.order_items FOR ALL USING (public.is_staff());

-- G. BANNERS, COUPONS, SHIPPING, PAGES, SETTINGS
CREATE POLICY "Public read active banners" ON public.banners FOR SELECT USING (is_active = true OR public.is_staff());
CREATE POLICY "Staff manage banners" ON public.banners FOR ALL USING (public.is_staff());

CREATE POLICY "Public read active coupons" ON public.coupons FOR SELECT USING (is_active = true OR public.is_staff());
CREATE POLICY "Staff manage coupons" ON public.coupons FOR ALL USING (public.is_staff());

CREATE POLICY "Public read shipping methods" ON public.shipping_methods FOR SELECT USING (is_active = true OR public.is_staff());
CREATE POLICY "Staff manage shipping methods" ON public.shipping_methods FOR ALL USING (public.is_staff());

CREATE POLICY "Public read published pages" ON public.pages FOR SELECT USING (is_published = true OR public.is_staff());
CREATE POLICY "Staff manage pages" ON public.pages FOR ALL USING (public.is_staff());

CREATE POLICY "Public read store settings" ON public.store_settings FOR SELECT USING (true);
CREATE POLICY "Admin update store settings" ON public.store_settings FOR UPDATE USING (public.is_admin());
