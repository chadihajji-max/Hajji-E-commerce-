import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language } from '../types';

interface Translations {
  [key: string]: {
    en: string;
    ar: string;
  };
}

export const translations: Translations = {
  // Brand & Nav
  brandName: { en: 'Aura Commerce', ar: 'أورا للتجارة' },
  home: { en: 'Home', ar: 'الرئيسية' },
  catalog: { en: 'Catalog', ar: 'المتجر' },
  sheinDeals: { en: 'SHEIN Trends', ar: 'عروض شي إن' },
  admin: { en: 'Admin Portal', ar: 'لوحة التحكم' },
  storefront: { en: 'Storefront', ar: 'واجهة المتجر' },
  cart: { en: 'Bag', ar: 'السلة' },
  searchPlaceholder: { en: 'Search curated products or SHEIN deals...', ar: 'ابحث عن المنتجات أو عروض شي إن...' },
  
  // Hero
  heroKicker: { en: 'Spring/Summer 2026 Collection', ar: 'تشكيلة ربيع وصيف 2026' },
  heroTitle: { en: 'Elevated Essentials & Global Trends', ar: 'أساسيات راقية وأحدث صيحات الموضة' },
  heroSubtitle: { en: 'Curated premium lifestyle essentials paired with hand-picked SHEIN affiliate trending styles at direct manufacturer value.', ar: 'مجموعة مختارة بعناية من الأساسيات العصرية مع أفضل تصاميم شي إن الرائجة بأسعار المصنع المباشرة.' },
  shopCollection: { en: 'Explore Collection', ar: 'استكشف التشكيلة' },
  exploreShein: { en: 'Browse SHEIN Trends', ar: 'عروض شي إن الحصرية' },

  // Trust / Features
  featureQualityTitle: { en: 'Curated Excellence', ar: 'جودة منتقاة' },
  featureQualityDesc: { en: 'Each item inspected for enduring material craftsmanship.', ar: 'كل قطعة خضعت للفحص لضمان دقة الصنع وجودة الخامات.' },
  featureShippingTitle: { en: 'Global Delivery', ar: 'توصيل دولي' },
  featureShippingDesc: { en: 'Free standard shipping on all qualifying orders over $75.', ar: 'شحن مجاني لكافة الطلبات المؤهلة التي تتجاوز 75 دولاراً.' },
  featureAffiliateTitle: { en: 'Verified SHEIN Partner', ar: 'شريك معتمد لدى شي إن' },
  featureAffiliateDesc: { en: 'Direct official affiliate links with genuine promotional codes.', ar: 'روابط تابعة رسمية ومباشرة مع أفضل رموز الخصم المعتمدة.' },

  // Catalog & Product
  allCategories: { en: 'All Departments', ar: 'كافة الأقسام' },
  allProducts: { en: 'All Items', ar: 'جميع المنتجات' },
  sheinOnly: { en: 'SHEIN Affiliate Only', ar: 'عروض شي إن فقط' },
  directDeliveryOnly: { en: 'Direct Store Delivery', ar: 'توصيل المتجر المباشر' },
  sortBy: { en: 'Sort by', ar: 'ترتيب حسب' },
  sortFeatured: { en: 'Featured', ar: 'المميزة' },
  sortPriceAsc: { en: 'Price: Low to High', ar: 'السعر: من الأقل للأعلى' },
  sortPriceDesc: { en: 'Price: High to Low', ar: 'السعر: من الأعلى للأقل' },
  sortNewest: { en: 'New Arrivals', ar: 'وصل حديثاً' },
  filterByPrice: { en: 'Price Range', ar: 'نطاق السعر' },
  inStock: { en: 'In Stock', ar: 'متوفر' },
  outOfStock: { en: 'Sold Out', ar: 'نفد من المخزون' },
  addToBag: { en: 'Add to Bag', ar: 'إضافة إلى السلة' },
  buyOnShein: { en: 'Buy on SHEIN (Affiliate)', ar: 'شراء من شي إن (رابط تابع)' },
  viewDetails: { en: 'View Details', ar: 'التفاصيل' },
  sheinPartnerBadge: { en: 'SHEIN Verified Affiliate', ar: 'شريك معتمد من شي إن' },
  commissionNotice: { en: 'Earns affiliate commission at no extra cost to you', ar: 'يكسب عمولة تابعة دون أي تكلفة إضافية عليك' },
  quickView: { en: 'Quick Look', ar: 'نظرة سريعة' },
  sku: { en: 'SKU', ar: 'رمز المنتج' },
  category: { en: 'Category', ar: 'القسم' },
  stockCount: { en: 'Available Quantity', ar: 'الكمية المتاحة' },
  reviews: { en: 'reviews', ar: 'تقييم' },

  // Cart & Drawer
  shoppingBag: { en: 'Your Shopping Bag', ar: 'حقيبة التسوق' },
  emptyBagTitle: { en: 'Your bag is empty', ar: 'حقيبة التسوق فارغة' },
  emptyBagDesc: { en: 'Explore our curated catalog or discover trending SHEIN pieces to fill it up.', ar: 'استكشف تشكيلتنا المنتقاة أو تعرف على أحدث تصاميم شي إن لإضافتها.' },
  continueShopping: { en: 'Continue Shopping', ar: 'متابعة التسوق' },
  subtotal: { en: 'Subtotal', ar: 'المجموع الفرعي' },
  shipping: { en: 'Estimated Shipping', ar: 'تكلفة الشحن المقدرة' },
  freeShipping: { en: 'FREE', ar: 'مجاني' },
  total: { en: 'Total', ar: 'المجموع الإجمالي' },
  proceedToCheckout: { en: 'Proceed to Checkout', ar: 'المتابعة للدفع' },
  clearBag: { en: 'Clear Bag', ar: 'إفراغ السلة' },
  itemRemoved: { en: 'Item removed from bag', ar: 'تمت إزالة المنتج من السلة' },
  itemAdded: { en: 'Item added to bag', ar: 'تمت إضافة المنتج إلى السلة' },

  // Checkout Page
  checkoutTitle: { en: 'Checkout & Shipping Information', ar: 'معلومات الشحن والدفع' },
  contactDetails: { en: 'Customer Contact Details', ar: 'بيانات العميل' },
  fullName: { en: 'Full Name', ar: 'الاسم الكامل' },
  emailAddress: { en: 'Email Address', ar: 'البريد الإلكتروني' },
  phoneNumber: { en: 'Phone Number', ar: 'رقم الهاتف' },
  streetAddress: { en: 'Street Address', ar: 'عنوان الشارع' },
  city: { en: 'City / Region', ar: 'المدينة / المنطقة' },
  orderNotes: { en: 'Order Notes / Delivery instructions (Optional)', ar: 'ملاحظات الطلب أو تعليمات التوصيل (اختياري)' },
  paymentMethod: { en: 'Payment Method', ar: 'طريقة الدفع' },
  cashOnDelivery: { en: 'Cash on Delivery (COD)', ar: 'الدفع عند الاستلام' },
  creditCardPreview: { en: 'Credit / Debit Card (Secure)', ar: 'بطاقة ائتمان / مدى (آمن)' },
  paypalPreview: { en: 'PayPal Express', ar: 'بايبال السريع' },
  completeOrder: { en: 'Place Order Now', ar: 'تأكيد الطلب الآن' },
  orderSummary: { en: 'Order Summary', ar: 'ملخص الطلب' },
  orderSuccessTitle: { en: 'Order Confirmed!', ar: 'تم تأكيد طلبك بنجاح!' },
  orderSuccessMessage: { en: 'Thank you for shopping with Aura. Your order has been registered in the database.', ar: 'شكراً لتسوقك من أورا. تم تسجيل طلبك بنجاح في قاعدة البيانات.' },
  orderNumber: { en: 'Order Reference', ar: 'رقم الطلب' },

  // SHEIN Deals Page
  sheinDealsTitle: { en: 'Curated SHEIN Trends & Affiliate Showcase', ar: 'عروض وتصاميم شي إن المختارة' },
  sheinDealsSubtitle: { en: 'Direct links powered by the official SHEIN Affiliate Network. Tracked sub-IDs ensure authentic discounts and verified buyer security.', ar: 'روابط مباشرة مدعومة من شبكة شي إن للمسوقين مع تتبع المعرفات لضمان أفضل الأسعار والتخفيضات الرسمية.' },
  affiliateDisclosureNotice: { en: 'Disclosure: When you purchase through our SHEIN links, we may earn an affiliate commission at zero additional cost to you. We only recommend pieces we love.', ar: 'إخلاء مسؤولية: عند الشراء عبر روابط شي إن، قد نحصل على عمولة تسويقية دون أي تكلفة إضافية عليك. نختار دائماً أفضل المنتجات.' },
  sheinLinkCopied: { en: 'Affiliate link copied to clipboard!', ar: 'تم نسخ الرابط التابع إلى الحافظة!' },
  trackClickSuccess: { en: 'Redirecting to SHEIN with affiliate tracking...', ar: 'جاري التوجيه إلى شي إن مع تتبع الرابط...' },

  // Admin Dashboard (OpenCart-Style Architecture)
  adminOverview: { en: 'Dashboard Overview', ar: 'لوحة القيادة' },
  adminProducts: { en: 'Products', ar: 'المنتجات' },
  adminCategories: { en: 'Categories', ar: 'الأقسام' },
  adminSheinHub: { en: 'SHEIN Affiliate Hub', ar: 'مركز شي إن للمسوقين' },
  adminOrders: { en: 'Orders', ar: 'الطلبات' },
  adminCustomers: { en: 'Customers', ar: 'العملاء' },
  adminUsers: { en: 'Users & Roles', ar: 'المستخدمون والأدوار' },
  adminInventory: { en: 'Inventory Stock', ar: 'إدارة المخزون' },
  adminShipping: { en: 'Shipping Methods', ar: 'طرق الشحن' },
  adminPayments: { en: 'Payment Gateways', ar: 'بوابات الدفع' },
  adminCoupons: { en: 'Coupons & Discounts', ar: 'القسائم والخصومات' },
  adminBanners: { en: 'Banners & Ads', ar: 'البانرات والإعلانات' },
  adminPages: { en: 'Information Pages', ar: 'صفحات المعلومات' },
  adminReports: { en: 'Reports & Analytics', ar: 'التقارير والإحصائيات' },
  adminSettings: { en: 'Store Settings & Supabase', ar: 'إعدادات المتجر وسوبابيز' },
  
  // Navigation Groups
  groupCatalog: { en: 'Catalog', ar: 'الكاتالوج' },
  groupSales: { en: 'Sales & Orders', ar: 'المبيعات والطلبات' },
  groupMarketing: { en: 'Marketing & Ads', ar: 'التسويق والإعلانات' },
  groupSystem: { en: 'System & Config', ar: 'النظام والإعدادات' },
  groupReports: { en: 'Reports', ar: 'التقارير' },
  totalRevenue: { en: 'Store Direct Revenue', ar: 'إجمالي مبيعات المتجر' },
  estCommissions: { en: 'Est. SHEIN Commissions', ar: 'العمولات التقديرية من شي إن' },
  affiliateClicksTotal: { en: 'Tracked Affiliate Clicks', ar: 'النقرات المتتبعة' },
  activeCatalogCount: { en: 'Active Products', ar: 'المنتجات النشطة' },
  recentOrders: { en: 'Recent Customer Orders', ar: 'أحدث الطلبات' },
  recentClicks: { en: 'Recent Affiliate Clicks', ar: 'أحدث نقرات الروابط التابعة' },
  addProduct: { en: 'New Product', ar: 'إضافة منتج جديد' },
  generateLink: { en: 'Generate SHEIN Link', ar: 'توليد رابط ترويجي لشي إن' },
  supabaseStatus: { en: 'Supabase Database', ar: 'قاعدة بيانات سوبابيز' },
  supabaseConnected: { en: 'Supabase Live Connected', ar: 'سوبابيز متصل بنجاح' },
  supabaseLocalFallback: { en: 'Supabase Local Fallback Ready', ar: 'سوبابيز: وضع التخزين المحلي النشط' },
  configureSupabase: { en: 'Configure Supabase', ar: 'تهيئة سوبابيز' },
  exportData: { en: 'Export JSON', ar: 'تصدير البيانات' },
  status: { en: 'Status', ar: 'الحالة' },
  actions: { en: 'Actions', ar: 'الإجراءات' },
  delete: { en: 'Delete', ar: 'حذف' },
  edit: { en: 'Edit', ar: 'تعديل' },
  save: { en: 'Save Changes', ar: 'حفظ التعديلات' },
  cancel: { en: 'Cancel', ar: 'إلغاء' },
  titleEn: { en: 'Title (English)', ar: 'العنوان (بالإنجليزية)' },
  titleAr: { en: 'Title (Arabic)', ar: 'العنوان (بالعربية)' },
  priceUsd: { en: 'Price (USD $)', ar: 'السعر (بالدولار)' },
  stockQty: { en: 'Stock Quantity', ar: 'كمية المخزون' },
  isSheinItem: { en: 'Is SHEIN Affiliate Product?', ar: 'هل هو منتج تابع لـ شي إن؟' },
  sheinUrl: { en: 'SHEIN Affiliate Target URL', ar: 'رابط شي إن التابع المستهدف' },
  commissionRate: { en: 'Commission Rate (%)', ar: 'نسبة العمولة (%)' },
  productSaved: { en: 'Product saved successfully!', ar: 'تم حفظ المنتج بنجاح!' },
  productDeleted: { en: 'Product deleted!', ar: 'تم حذف المنتج!' },

  // Common States
  loadingTitle: { en: 'Loading store data...', ar: 'جاري تحميل بيانات المتجر...' },
  errorTitle: { en: 'Something went wrong', ar: 'حدث خطأ غير متوقع' },
  retry: { en: 'Retry', ar: 'إعادة المحاولة' },
  noResultsFound: { en: 'No matching items found', ar: 'لم يتم العثور على نتائج مطابقة' },
  clearFilters: { en: 'Reset Filters', ar: 'إعادة ضبط الفلاتر' },
  allRightsReserved: { en: 'All rights reserved.', ar: 'جميع الحقوق محفوظة.' },
  currencyLabel: { en: 'USD ($)', ar: 'دولار أمريكي ($)' },
  switchToArabic: { en: 'العربية', ar: 'العربية' },
  switchToEnglish: { en: 'English', ar: 'English' },
  affiliateDisclaimerFooter: { 
    en: 'Aura Commerce operates as an independent retailer and authorized SHEIN affiliate partner. SHEIN brand names and trademarks belong to their respective owners.', 
    ar: 'تعمل أورا كمنصة تجارية مستقلة وشريك ترويجي معتمد لـ شي إن. جميع العلامات التجارية وحقوق الملكية لشي إن محفوظة لأصحابها.' 
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: keyof typeof translations) => string;
  isRtl: boolean;
  dir: 'rtl' | 'ltr';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('aura_language');
    return (saved === 'ar' || saved === 'en') ? saved : 'en';
  });

  const isRtl = language === 'ar';
  const dir = isRtl ? 'rtl' : 'ltr';

  useEffect(() => {
    localStorage.setItem('aura_language', language);
    document.documentElement.setAttribute('lang', language);
    document.documentElement.setAttribute('dir', dir);
  }, [language, dir]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const toggleLanguage = () => {
    setLanguageState(prev => (prev === 'en' ? 'ar' : 'en'));
  };

  const t = (key: keyof typeof translations): string => {
    if (!translations[key]) {
      return String(key);
    }
    return translations[key][language] || translations[key].en;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t, isRtl, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
