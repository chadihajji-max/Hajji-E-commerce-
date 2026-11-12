export type Language = 'en' | 'ar';
export type CurrencyCode = 'USD';

// ==========================================
// RBAC: Roles and User Profiles
// ==========================================
export type UserRole = 'admin' | 'manager' | 'customer';

export type PermissionKey = 
  | 'manage_all'
  | 'manage_products'
  | 'manage_orders'
  | 'manage_settings'
  | 'manage_affiliates'
  | 'view_own_orders';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
}

export interface AuthSession {
  user: UserProfile | null;
  token?: string;
}

// ==========================================
// Catalog & Categories
// ==========================================
export interface Category {
  id: string;
  slug: string;
  name_en: string;
  name_ar: string;
  icon: string;
  image_url?: string;
  parent_id?: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  is_primary: boolean;
  sort_order: number;
  alt_text?: string;
}

export interface Product {
  id: string;
  sku: string;
  title_en: string;
  title_ar: string;
  description_en: string;
  description_ar: string;
  category_id: string;
  price: number;
  compare_at_price?: number;
  stock: number;
  image_url: string;
  is_active: boolean;
  is_featured: boolean;
  rating: number;
  reviews_count: number;
  created_at: string;
  updated_at?: string;
  
  // Phase 4 attributes & SEO
  attributes?: {
    sizes?: string[];
    colors?: string[];
    material?: string;
  };
  seo_title?: string;
  seo_description?: string;
  images?: ProductImage[];

  // Relational SHEIN Affiliate attributes
  is_shein_affiliate: boolean;
  shein_product_id?: string;
  shein_affiliate_url?: string;
  shein_commission_rate?: number; // e.g. 15 for 15%
  shein_sub_id?: string;

  // Joined relations
  affiliate_details?: AffiliateProduct;
}

export interface AffiliateProduct {
  id: string;
  product_id: string;
  platform: string;
  external_product_id?: string;
  affiliate_url: string;
  commission_rate: number;
  default_sub_id: string;
  original_price?: number;
  promo_code?: string;
  is_active: boolean;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

// ==========================================
// Customers & Orders
// ==========================================
export interface Customer {
  id: string;
  user_id?: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country?: string;
  total_spent: number;
  orders_count: number;
  created_at: string;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentMethod = 'cod' | 'card' | 'paypal';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  title: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
  total: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id?: string;
  user_id?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  shipping_city: string;
  subtotal: number;
  shipping_cost: number;
  discount_amount: number;
  total_amount: number;
  currency: CurrencyCode;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  coupon_code?: string;
  items: CartItem[];
  order_items?: OrderItem[];
  notes?: string;
  created_at: string;
  updated_at?: string;
}

// ==========================================
// Promotions, Banners, Shipping & Content
// ==========================================
export interface Banner {
  id: string;
  title_en: string;
  title_ar: string;
  subtitle_en?: string;
  subtitle_ar?: string;
  image_url: string;
  link_url?: string;
  target_channel: 'all' | 'shein' | 'direct';
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_uses?: number;
  current_uses: number;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
}

export interface ShippingMethod {
  id: string;
  name_en: string;
  name_ar: string;
  description_en?: string;
  description_ar?: string;
  cost: number;
  estimated_days: string;
  is_active: boolean;
  created_at: string;
}

export interface StaticPage {
  id: string;
  slug: string;
  title_en: string;
  title_ar: string;
  content_en: string;
  content_ar: string;
  is_published: boolean;
  updated_at: string;
  created_at: string;
}

// ==========================================
// SHEIN Affiliate Analytics & Links
// ==========================================
export interface AffiliateLink {
  id: string;
  title: string;
  original_shein_url: string;
  affiliate_url: string;
  aff_id: string;
  sub_id?: string;
  campaign?: string;
  clicks: number;
  estimated_commission_rate?: number;
  created_at: string;
}

export interface AffiliateClickLog {
  id: string;
  product_id?: string;
  affiliate_product_id?: string;
  product_title?: string;
  affiliate_url: string;
  sub_id?: string;
  referrer?: string;
  device_type?: string;
  user_agent?: string;
  ip_hash?: string;
  created_at: string;
  estimated_commission?: number;
}

// ==========================================
// System Settings & Connectivity
// ==========================================
export interface PaymentGateway {
  id: string;
  code: 'cod' | 'card' | 'paypal';
  name_en: string;
  name_ar: string;
  is_enabled: boolean;
  instructions_en: string;
  instructions_ar: string;
  test_mode?: boolean;
}

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'stock' | 'affiliate' | 'system';
  created_at: string;
  is_read: boolean;
  link_route?: AppRoute;
}

export interface StoreSettings {
  id: string;
  store_name: string;
  currency: CurrencyCode;
  shein_publisher_id: string;
  default_sub_id: string;
  support_email: string;
  free_shipping_threshold: number;
  maintenance_mode?: boolean;
}

export interface SupabaseConnectionStatus {
  isConfigured: boolean;
  isConnected: boolean;
  url?: string;
  message?: string;
  authWorking?: boolean;
  tablesFound?: string[];
  roleChecked?: string;
}

export type AppRoute = 
  | 'home'
  | 'catalog'
  | 'categories'
  | 'category-detail'
  | 'product-detail'
  | 'shein-deals'
  | 'checkout'
  | 'login'
  | 'register'
  | 'profile'
  | 'page'
  | 'admin-overview'
  | 'admin-products'
  | 'admin-categories'
  | 'admin-shein'
  | 'admin-orders'
  | 'admin-customers'
  | 'admin-users'
  | 'admin-inventory'
  | 'admin-shipping'
  | 'admin-payments'
  | 'admin-coupons'
  | 'admin-banners'
  | 'admin-pages'
  | 'admin-reports'
  | 'admin-settings';

