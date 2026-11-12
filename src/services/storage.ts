import { 
  Product, 
  Category, 
  Order, 
  OrderStatus, 
  AffiliateLink, 
  AffiliateClickLog, 
  StoreSettings 
} from '../types';
import { getSupabaseClient, isSupabaseConfigured } from './supabase';
import { buildSheinAffiliateUrl } from './sheinAffiliate';

const STORAGE_KEYS = {
  PRODUCTS: 'aura_products_v1',
  CATEGORIES: 'aura_categories_v1',
  ORDERS: 'aura_orders_v1',
  AFFILIATE_LINKS: 'aura_affiliate_links_v1',
  AFFILIATE_CLICKS: 'aura_affiliate_clicks_v1',
  SETTINGS: 'aura_store_settings_v1',
};

// Seed Categories
const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'cat-fashion',
    slug: 'fashion-apparel',
    name_en: 'Apparel & Fashion',
    name_ar: 'الأزياء والملابس',
    icon: 'Sparkles',
    sort_order: 1,
  },
  {
    id: 'cat-home',
    slug: 'home-interiors',
    name_en: 'Home & Living',
    name_ar: 'المنزل والديكور',
    icon: 'Home',
    sort_order: 2,
  },
  {
    id: 'cat-tech',
    slug: 'tech-lifestyle',
    name_en: 'Minimalist Tech',
    name_ar: 'التقنية العصرية',
    icon: 'Watch',
    sort_order: 3,
  },
  {
    id: 'cat-beauty',
    slug: 'beauty-wellness',
    name_en: 'Beauty & Wellness',
    name_ar: 'الجمال والعناية',
    icon: 'Flower2',
    sort_order: 4,
  },
];

// Seed Products with generated high-fidelity assets
const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    sku: 'AUR-COAT-01',
    title_en: 'Tailored Beige Wool Studio Overcoat',
    title_ar: 'معطف استوديو صوفي أنيق باللون البيج',
    description_en: 'Crafted from double-faced virgin wool blend with a sculpted architectural lapel, deep patch pockets, and unlined minimalist drape.',
    description_ar: 'مصنوع من مزيج الصوف الطبيعي الفاخر بتصميم معماري انسيابي، مع جيوب عميقة وقصة كلاسيكية راقية تناسب كافة المناسبات.',
    category_id: 'cat-fashion',
    price: 185.00,
    compare_at_price: 240.00,
    stock: 14,
    image_url: '/src/assets/images/product_outerwear_1794492839551.jpg',
    is_active: true,
    is_featured: true,
    is_shein_affiliate: false,
    rating: 4.9,
    reviews_count: 42,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'prod-002',
    sku: 'SHEIN-DRS-892',
    title_en: 'SHEIN Satin Emerald Midi Slip Dress',
    title_ar: 'فستان ميدي حريري زمردي من شي إن',
    description_en: 'Fluid emerald satin with delicate adjustable straps and a side slit. Official SHEIN affiliate curated piece with verified high buyer satisfaction.',
    description_ar: 'ساتان انسيابي أنيق باللون الأخضر الزمردي مع فتحة جانبية رقيقة وأشرطة قابلة للتعديل. قطعة مميزة موثقة من شي إن.',
    category_id: 'cat-fashion',
    price: 36.50,
    compare_at_price: 49.00,
    stock: 85,
    image_url: '/src/assets/images/product_shein_dress_1794492839873.jpg',
    is_active: true,
    is_featured: true,
    is_shein_affiliate: true,
    shein_product_id: 'goods-p-3829471',
    shein_affiliate_url: buildSheinAffiliateUrl({
      url: 'https://us.shein.com/goods-p-3829471.html',
      subId: 'spring_trends_dress'
    }),
    shein_commission_rate: 15.00,
    shein_sub_id: 'spring_trends_dress',
    rating: 4.8,
    reviews_count: 128,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'prod-003',
    sku: 'AUR-TECH-WATCH',
    title_en: 'Titanium Horizon Smartwatch',
    title_ar: 'ساعة تيتانيوم هورايزون الذكية',
    description_en: 'Aeronautical grade titanium bezel, high-contrast always-on OLED panel, comprehensive wellness telemetry, and 7-day battery life.',
    description_ar: 'إطار متين من التيتانيوم المستخدم في صناعة الطيران، شاشة OLED فائقة الوضوح، مستشعرات حيوية دقيقة مع بطارية تدوم 7 أيام.',
    category_id: 'cat-tech',
    price: 245.00,
    compare_at_price: 299.00,
    stock: 9,
    image_url: '/src/assets/images/product_watch_tech_1794492841349.jpg',
    is_active: true,
    is_featured: true,
    is_shein_affiliate: false,
    rating: 4.95,
    reviews_count: 67,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'prod-004',
    sku: 'AUR-HOME-VASE',
    title_en: 'Fluted Ceramic Ribbed Vase on Travertine',
    title_ar: 'مزهرية سيراميك مضلعة على قاعدة ترافيرتين',
    description_en: 'Hand-thrown artisanal ceramic with tactile vertical fluting and matte limestone glaze. Ideal for dried botanicals and minimalist spaces.',
    description_ar: 'سيراميك يدوي الصنع بأضلاع عمودية وطبقة طلاء حجرية غير لامعة، يضفي لمسة اسكندنافية هادئة على المساحات الداخلية.',
    category_id: 'cat-home',
    price: 68.00,
    compare_at_price: 85.00,
    stock: 22,
    image_url: '/src/assets/images/product_home_decor_1794492840631.jpg',
    is_active: true,
    is_featured: true,
    is_shein_affiliate: false,
    rating: 4.88,
    reviews_count: 31,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'prod-005',
    sku: 'SHEIN-KNIT-551',
    title_en: 'SHEIN French Chic Neutral Co-ord Ensemble',
    title_ar: 'طقم كاجوال فرنسي عصري من شي إن',
    description_en: 'Relaxed linen-cotton blend silhouette in neutral oat. High-demand SHEIN affiliate bestseller with tracked buyer discounts.',
    description_ar: 'طقم أنيق بقصة واسعة ومريحة من مزيج الكتان والقطن، أحد أكثر منتجات شي إن طلباً مع كود خصم إضافي.',
    category_id: 'cat-fashion',
    price: 44.00,
    compare_at_price: 58.00,
    stock: 120,
    image_url: '/src/assets/images/store_hero_curated_1794492838701.jpg',
    is_active: true,
    is_featured: false,
    is_shein_affiliate: true,
    shein_product_id: 'goods-p-994102',
    shein_affiliate_url: buildSheinAffiliateUrl({
      url: 'https://us.shein.com/goods-p-994102.html',
      subId: 'neutral_coord_look'
    }),
    shein_commission_rate: 12.00,
    shein_sub_id: 'neutral_coord_look',
    rating: 4.75,
    reviews_count: 94,
    created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
  }
];

// Seed Initial Orders for Admin demonstration
const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-1041',
    order_number: 'AUR-2026-1041',
    customer_name: 'Omar Al-Hassan',
    customer_email: 'omar.hassan@example.com',
    customer_phone: '+971 50 123 4567',
    shipping_address: 'Al Wasl Road, Villa 42',
    shipping_city: 'Dubai',
    subtotal: 185.00,
    shipping_cost: 0.00,
    discount_amount: 0.00,
    total_amount: 185.00,
    currency: 'USD',
    status: 'processing',
    payment_method: 'card',
    payment_status: 'paid',
    items: [
      { product: INITIAL_PRODUCTS[0], quantity: 1, selectedSize: 'L' }
    ],
    notes: 'Please leave with concierge if unavailable.',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'ord-1040',
    order_number: 'AUR-2026-1040',
    customer_name: 'Sarah Jenkins',
    customer_email: 'sarah.j@example.com',
    customer_phone: '+1 415 555 0192',
    shipping_address: '742 Evergreen Terrace',
    shipping_city: 'San Francisco',
    subtotal: 313.00,
    shipping_cost: 0.00,
    discount_amount: 0.00,
    total_amount: 313.00,
    currency: 'USD',
    status: 'shipped',
    payment_method: 'paypal',
    payment_status: 'paid',
    items: [
      { product: INITIAL_PRODUCTS[2], quantity: 1 },
      { product: INITIAL_PRODUCTS[3], quantity: 1 }
    ],
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
  }
];

// Seed Initial Affiliate Tracked Links
const INITIAL_AFFILIATE_LINKS: AffiliateLink[] = [
  {
    id: 'aff-01',
    title: 'SHEIN Spring Satin Slip Dresses',
    original_shein_url: 'https://us.shein.com/women-dresses-c-1727.html',
    affiliate_url: buildSheinAffiliateUrl({
      url: 'https://us.shein.com/women-dresses-c-1727.html',
      subId: 'banner_dresses'
    }),
    aff_id: import.meta.env.VITE_SHEIN_AFFILIATE_ID || 'SHEIN_AFF_98421',
    sub_id: 'banner_dresses',
    campaign: 'spring_2026',
    clicks: 142,
    estimated_commission_rate: 15.0,
    created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
  },
  {
    id: 'aff-02',
    title: 'SHEIN Modern Urban Streetwear Picks',
    original_shein_url: 'https://us.shein.com/trend-c-streetwear.html',
    affiliate_url: buildSheinAffiliateUrl({
      url: 'https://us.shein.com/trend-c-streetwear.html',
      subId: 'streetwear_promo'
    }),
    aff_id: import.meta.env.VITE_SHEIN_AFFILIATE_ID || 'SHEIN_AFF_98421',
    sub_id: 'streetwear_promo',
    campaign: 'influencer_push',
    clicks: 89,
    estimated_commission_rate: 12.0,
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  }
];

const INITIAL_CLICKS: AffiliateClickLog[] = [
  {
    id: 'clk-01',
    product_id: 'prod-002',
    product_title: 'SHEIN Satin Emerald Midi Slip Dress',
    affiliate_url: buildSheinAffiliateUrl({ url: 'https://shein.com', subId: 'spring_trends_dress' }),
    sub_id: 'spring_trends_dress',
    estimated_commission: 5.48,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'clk-02',
    product_id: 'prod-005',
    product_title: 'SHEIN French Chic Neutral Co-ord Ensemble',
    affiliate_url: buildSheinAffiliateUrl({ url: 'https://shein.com', subId: 'neutral_coord_look' }),
    sub_id: 'neutral_coord_look',
    estimated_commission: 5.28,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  }
];

const INITIAL_SETTINGS: StoreSettings = {
  id: 'default',
  store_name: 'Aura Commerce',
  currency: 'USD',
  shein_publisher_id: import.meta.env.VITE_SHEIN_AFFILIATE_ID || 'SHEIN_AFF_98421',
  default_sub_id: import.meta.env.VITE_SHEIN_DEFAULT_SUBID || 'aura_direct',
  support_email: 'hajji.ecommerce@gmail.com',
  free_shipping_threshold: 75.00,
};

// Local storage helpers
const loadFromLocal = <T>(key: string, defaultVal: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultVal;
    return JSON.parse(raw);
  } catch {
    return defaultVal;
  }
};

const saveToLocal = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('LocalStorage write failed:', err);
  }
};

// STORAGE REPOSITORY CLASS
export class StorageService {
  // PRODUCTS
  static async getProducts(): Promise<Product[]> {
    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      try {
        const { data, error } = await client
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          return data as Product[];
        }
      } catch (err) {
        console.warn('Supabase getProducts fallback to local:', err);
      }
    }
    return loadFromLocal<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  }

  static async getProductById(id: string): Promise<Product | null> {
    const products = await this.getProducts();
    return products.find(p => p.id === id) || null;
  }

  static async saveProduct(product: Product): Promise<Product> {
    const products = await this.getProducts();
    const existingIndex = products.findIndex(p => p.id === product.id);
    let updatedProducts: Product[];

    if (existingIndex >= 0) {
      updatedProducts = [...products];
      updatedProducts[existingIndex] = { ...product, created_at: products[existingIndex].created_at };
    } else {
      updatedProducts = [product, ...products];
    }

    saveToLocal(STORAGE_KEYS.PRODUCTS, updatedProducts);

    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      try {
        await client.from('products').upsert(product);
      } catch (err) {
        console.warn('Supabase saveProduct failed:', err);
      }
    }

    return product;
  }

  static async deleteProduct(id: string): Promise<boolean> {
    const products = await this.getProducts();
    const filtered = products.filter(p => p.id !== id);
    saveToLocal(STORAGE_KEYS.PRODUCTS, filtered);

    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      try {
        await client.from('products').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase deleteProduct failed:', err);
      }
    }
    return true;
  }

  // CATEGORIES
  static async getCategories(): Promise<Category[]> {
    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      try {
        const { data, error } = await client
          .from('categories')
          .select('*')
          .order('sort_order', { ascending: true });
        if (!error && data && data.length > 0) {
          return data as Category[];
        }
      } catch (err) {
        console.warn('Supabase getCategories fallback to local:', err);
      }
    }
    return loadFromLocal<Category[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
  }

  // ORDERS
  static async getOrders(): Promise<Order[]> {
    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      try {
        const { data, error } = await client
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          return data as Order[];
        }
      } catch (err) {
        console.warn('Supabase getOrders fallback to local:', err);
      }
    }
    return loadFromLocal<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
  }

  static async createOrder(orderInput: Omit<Order, 'id' | 'order_number' | 'created_at'>): Promise<Order> {
    const orderNumber = `AUR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: Order = {
      ...orderInput,
      id: 'ord-' + Date.now().toString(36),
      order_number: orderNumber,
      created_at: new Date().toISOString(),
    };

    const orders = await this.getOrders();
    const updated = [newOrder, ...orders];
    saveToLocal(STORAGE_KEYS.ORDERS, updated);

    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      try {
        await client.from('orders').insert(newOrder);
      } catch (err) {
        console.warn('Supabase createOrder failed:', err);
      }
    }

    return newOrder;
  }

  static async updateOrderStatus(id: string, status: OrderStatus): Promise<Order | null> {
    const orders = await this.getOrders();
    const target = orders.find(o => o.id === id);
    if (!target) return null;

    target.status = status;
    saveToLocal(STORAGE_KEYS.ORDERS, orders);

    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      try {
        await client.from('orders').update({ status }).eq('id', id);
      } catch (err) {
        console.warn('Supabase updateOrderStatus failed:', err);
      }
    }
    return target;
  }

  // SHEIN AFFILIATE LINKS
  static async getAffiliateLinks(): Promise<AffiliateLink[]> {
    return loadFromLocal<AffiliateLink[]>(STORAGE_KEYS.AFFILIATE_LINKS, INITIAL_AFFILIATE_LINKS);
  }

  static async saveAffiliateLink(link: AffiliateLink): Promise<AffiliateLink> {
    const links = await this.getAffiliateLinks();
    const existingIdx = links.findIndex(l => l.id === link.id);
    let updated: AffiliateLink[];
    if (existingIdx >= 0) {
      updated = [...links];
      updated[existingIdx] = link;
    } else {
      updated = [link, ...links];
    }
    saveToLocal(STORAGE_KEYS.AFFILIATE_LINKS, updated);
    return link;
  }

  // AFFILIATE CLICKS & CONVERSIONS
  static async getAffiliateClicks(): Promise<AffiliateClickLog[]> {
    return loadFromLocal<AffiliateClickLog[]>(STORAGE_KEYS.AFFILIATE_CLICKS, INITIAL_CLICKS);
  }

  static async recordAffiliateClick(clickLog: AffiliateClickLog): Promise<void> {
    const clicks = await this.getAffiliateClicks();
    const updated = [clickLog, ...clicks];
    saveToLocal(STORAGE_KEYS.AFFILIATE_CLICKS, updated);

    // Also increment link clicks count if matching URL
    const links = await this.getAffiliateLinks();
    const matched = links.find(l => l.affiliate_url === clickLog.affiliate_url);
    if (matched) {
      matched.clicks = (matched.clicks || 0) + 1;
      saveToLocal(STORAGE_KEYS.AFFILIATE_LINKS, links);
    }

    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      try {
        await client.from('affiliate_clicks').insert(clickLog);
      } catch (err) {
        console.warn('Supabase recordAffiliateClick failed:', err);
      }
    }
  }

  // SETTINGS
  static async getSettings(): Promise<StoreSettings> {
    return loadFromLocal<StoreSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  }

  static async updateSettings(newSettings: Partial<StoreSettings>): Promise<StoreSettings> {
    const current = await this.getSettings();
    const updated = { ...current, ...newSettings };
    saveToLocal(STORAGE_KEYS.SETTINGS, updated);
    return updated;
  }

  // RESET
  static async resetToDefaults(): Promise<void> {
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.ORDERS);
    localStorage.removeItem(STORAGE_KEYS.AFFILIATE_LINKS);
    localStorage.removeItem(STORAGE_KEYS.AFFILIATE_CLICKS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  }
}
