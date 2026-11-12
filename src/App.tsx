import React, { useState } from 'react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { ToastProvider } from './context/ToastContext';
import { CartProvider } from './context/CartContext';
import { RouterProvider, useRouter } from './context/RouterContext';
import { AuthProvider } from './context/AuthContext';

// Storefront components & pages
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { CartDrawer } from './components/common/CartDrawer';
import { SupabaseSetupModal } from './components/common/SupabaseSetupModal';
import { AuthModal } from './components/common/AuthModal';
import { AdminAccessGuard } from './components/common/AdminAccessGuard';

import { StoreHome } from './pages/storefront/StoreHome';
import { StoreCatalog } from './pages/storefront/StoreCatalog';
import { ProductDetail } from './pages/storefront/ProductDetail';
import { SheinAffiliateDeals } from './pages/storefront/SheinAffiliateDeals';
import { CheckoutPage } from './pages/storefront/CheckoutPage';
import { UserProfileView } from './pages/storefront/UserProfileView';

// Admin components & pages
import { AdminSidebar } from './components/admin/AdminSidebar';
import { AdminHeader } from './components/admin/AdminHeader';
import { AdminOverview } from './pages/admin/AdminOverview';
import { AdminProducts } from './pages/admin/AdminProducts';
import { AdminCategories } from './pages/admin/AdminCategories';
import { AdminSheinHub } from './pages/admin/AdminSheinHub';
import { AdminOrders } from './pages/admin/AdminOrders';
import { AdminCustomers } from './pages/admin/AdminCustomers';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminInventory } from './pages/admin/AdminInventory';
import { AdminShipping } from './pages/admin/AdminShipping';
import { AdminPayments } from './pages/admin/AdminPayments';
import { AdminCoupons } from './pages/admin/AdminCoupons';
import { AdminBanners } from './pages/admin/AdminBanners';
import { AdminPages } from './pages/admin/AdminPages';
import { AdminReports } from './pages/admin/AdminReports';
import { AdminSettings } from './pages/admin/AdminSettings';

const MainLayout: React.FC = () => {
  const { currentRoute, isAdmin } = useRouter();
  const { t, isRtl } = useLanguage();
  const [supabaseModalOpen, setSupabaseModalOpen] = useState(false);
  const [adminProductModalOpen, setAdminProductModalOpen] = useState(false);
  const [mobileAdminSidebarOpen, setMobileAdminSidebarOpen] = useState(false);

  // Render Admin Layout Protected with RBAC Guard
  if (isAdmin) {
    const getAdminTitle = () => {
      switch (currentRoute) {
        case 'admin-products':
          return { title: t('adminProducts'), subtitle: 'Manage direct catalog items, pricing, SKUs, and SHEIN affiliate links' };
        case 'admin-categories':
          return { title: t('adminCategories'), subtitle: 'Organize catalog taxonomy, category hierarchy, and navigation structure' };
        case 'admin-shein':
          return { title: t('adminSheinHub'), subtitle: 'Generate tracked affiliate URLs, inspect outbound clicks, and simulate commissions' };
        case 'admin-orders':
          return { title: t('adminOrders'), subtitle: 'Review incoming customer orders, fulfillment workflows, and payment statuses' };
        case 'admin-customers':
          return { title: t('adminCustomers'), subtitle: 'View registered customer accounts, lifetime spending, and order history' };
        case 'admin-users':
          return { title: t('adminUsers'), subtitle: 'Manage staff administrators, role assignments, and granular access permissions' };
        case 'admin-inventory':
          return { title: t('adminInventory'), subtitle: 'Monitor stock levels in real time, view low stock alerts, and adjust quantities' };
        case 'admin-shipping':
          return { title: t('adminShipping'), subtitle: 'Configure regional delivery carriers, shipping rates, and delivery timeframes' };
        case 'admin-payments':
          return { title: t('adminPayments'), subtitle: 'Manage Stripe, PayPal, Mada, Apple Pay, and Cash on Delivery gateways' };
        case 'admin-coupons':
          return { title: t('adminCoupons'), subtitle: 'Create promotional voucher codes, percentage discounts, and redemption limits' };
        case 'admin-banners':
          return { title: t('adminBanners'), subtitle: 'Publish storefront hero banners, promotional carousels, and SHEIN spotlights' };
        case 'admin-pages':
          return { title: t('adminPages'), subtitle: 'Manage bilingual CMS pages, privacy policy, and terms of service documents' };
        case 'admin-reports':
          return { title: t('adminReports'), subtitle: 'Comprehensive financial reports, SHEIN affiliate ROI, and CSV data export' };
        case 'admin-settings':
          return { title: t('adminSettings'), subtitle: 'Configure store identity, currency, SHEIN publisher credentials, and Supabase' };
        case 'admin-overview':
        default:
          return { title: t('adminOverview'), subtitle: 'Live store telemetry, sales analytics, and recent storefront activity' };
      }
    };

    const { title, subtitle } = getAdminTitle();

    return (
      <AdminAccessGuard>
        <div className="min-h-screen bg-neutral-100 flex flex-col md:flex-row antialiased text-neutral-900">
          {/* Desktop Sidebar */}
          <div className="hidden md:block">
            <AdminSidebar onOpenSupabaseModal={() => setSupabaseModalOpen(true)} />
          </div>

          {/* Mobile Sidebar Overlay */}
          {mobileAdminSidebarOpen && (
            <div className="fixed inset-0 z-50 flex md:hidden">
              <div 
                className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs"
                onClick={() => setMobileAdminSidebarOpen(false)}
              />
              <div className="relative z-10">
                <AdminSidebar onOpenSupabaseModal={() => {
                  setMobileAdminSidebarOpen(false);
                  setSupabaseModalOpen(true);
                }} />
              </div>
            </div>
          )}

          {/* Admin Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 min-h-screen">
            <AdminHeader
              title={title}
              subtitle={subtitle}
              onOpenSupabaseModal={() => setSupabaseModalOpen(true)}
              onOpenNewProductModal={currentRoute === 'admin-products' ? () => setAdminProductModalOpen(true) : undefined}
              onToggleMobileSidebar={() => setMobileAdminSidebarOpen(!mobileAdminSidebarOpen)}
            />

            <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
              {currentRoute === 'admin-overview' && (
                <AdminOverview onOpenSupabaseModal={() => setSupabaseModalOpen(true)} />
              )}
              {currentRoute === 'admin-products' && (
                <AdminProducts
                  isModalOpen={adminProductModalOpen}
                  setIsModalOpen={setAdminProductModalOpen}
                />
              )}
              {currentRoute === 'admin-categories' && <AdminCategories />}
              {currentRoute === 'admin-shein' && <AdminSheinHub />}
              {currentRoute === 'admin-orders' && <AdminOrders />}
              {currentRoute === 'admin-customers' && <AdminCustomers />}
              {currentRoute === 'admin-users' && <AdminUsers />}
              {currentRoute === 'admin-inventory' && <AdminInventory />}
              {currentRoute === 'admin-shipping' && <AdminShipping />}
              {currentRoute === 'admin-payments' && <AdminPayments />}
              {currentRoute === 'admin-coupons' && <AdminCoupons />}
              {currentRoute === 'admin-banners' && <AdminBanners />}
              {currentRoute === 'admin-pages' && <AdminPages />}
              {currentRoute === 'admin-reports' && <AdminReports />}
              {currentRoute === 'admin-settings' && (
                <AdminSettings onOpenSupabaseModal={() => setSupabaseModalOpen(true)} />
              )}
            </main>
          </div>

          <SupabaseSetupModal
            isOpen={supabaseModalOpen}
            onClose={() => setSupabaseModalOpen(false)}
          />
          <AuthModal />
        </div>
      </AdminAccessGuard>
    );
  }

  // Render Public Storefront Layout
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 antialiased text-neutral-900">
      <Header onOpenSupabaseModal={() => setSupabaseModalOpen(true)} />

      <main className="flex-1">
        {currentRoute === 'home' && <StoreHome />}
        {currentRoute === 'catalog' && <StoreCatalog />}
        {currentRoute === 'product-detail' && <ProductDetail />}
        {currentRoute === 'shein-deals' && <SheinAffiliateDeals />}
        {currentRoute === 'checkout' && <CheckoutPage />}
        {currentRoute === 'profile' && <UserProfileView />}
      </main>

      <Footer />
      <CartDrawer />
      <SupabaseSetupModal
        isOpen={supabaseModalOpen}
        onClose={() => setSupabaseModalOpen(false)}
      />
      <AuthModal />
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <RouterProvider>
              <MainLayout />
            </RouterProvider>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </LanguageProvider>
  );
}
