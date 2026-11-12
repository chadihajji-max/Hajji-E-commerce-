import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  FolderTree,
  Warehouse,
  TrendingUp, 
  ShoppingBag, 
  Users, 
  UserCog,
  Truck, 
  CreditCard, 
  Tag, 
  Image, 
  FileText, 
  BarChart3, 
  Settings, 
  Store, 
  ArrowLeft, 
  ArrowRight,
  Database,
  ChevronDown,
  ChevronRight,
  LogOut,
  Sparkles
} from 'lucide-react';
import { useRouter } from '../../context/RouterContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { AppRoute } from '../../types';

interface AdminSidebarProps {
  onOpenSupabaseModal: () => void;
}

interface NavGroup {
  id: string;
  titleKey: keyof typeof import('../../context/LanguageContext').translations;
  icon: React.ReactNode;
  items: {
    route: AppRoute;
    labelKey: keyof typeof import('../../context/LanguageContext').translations;
    icon: React.ReactNode;
  }[];
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ onOpenSupabaseModal }) => {
  const { currentRoute, navigate } = useRouter();
  const { t, language, isRtl } = useLanguage();
  const { user, logout } = useAuth();

  // Accordion open groups
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    catalog: true,
    sales: true,
    marketing: false,
    system: false,
    reports: false,
  });

  const toggleGroup = (groupId: string) => {
    setOpenGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const navGroups: NavGroup[] = [
    {
      id: 'catalog',
      titleKey: 'groupCatalog',
      icon: <Package className="w-4 h-4" />,
      items: [
        { route: 'admin-products', labelKey: 'adminProducts', icon: <Package className="w-3.5 h-3.5" /> },
        { route: 'admin-categories', labelKey: 'adminCategories', icon: <FolderTree className="w-3.5 h-3.5" /> },
        { route: 'admin-inventory', labelKey: 'adminInventory', icon: <Warehouse className="w-3.5 h-3.5" /> },
      ],
    },
    {
      id: 'affiliate',
      titleKey: 'adminSheinHub',
      icon: <TrendingUp className="w-4 h-4" />,
      items: [
        { route: 'admin-shein', labelKey: 'adminSheinHub', icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" /> },
      ],
    },
    {
      id: 'sales',
      titleKey: 'groupSales',
      icon: <ShoppingBag className="w-4 h-4" />,
      items: [
        { route: 'admin-orders', labelKey: 'adminOrders', icon: <ShoppingBag className="w-3.5 h-3.5" /> },
        { route: 'admin-customers', labelKey: 'adminCustomers', icon: <Users className="w-3.5 h-3.5" /> },
      ],
    },
    {
      id: 'marketing',
      titleKey: 'groupMarketing',
      icon: <Tag className="w-4 h-4" />,
      items: [
        { route: 'admin-coupons', labelKey: 'adminCoupons', icon: <Tag className="w-3.5 h-3.5" /> },
        { route: 'admin-banners', labelKey: 'adminBanners', icon: <Image className="w-3.5 h-3.5" /> },
      ],
    },
    {
      id: 'system',
      titleKey: 'groupSystem',
      icon: <Settings className="w-4 h-4" />,
      items: [
        { route: 'admin-users', labelKey: 'adminUsers', icon: <UserCog className="w-3.5 h-3.5" /> },
        { route: 'admin-shipping', labelKey: 'adminShipping', icon: <Truck className="w-3.5 h-3.5" /> },
        { route: 'admin-payments', labelKey: 'adminPayments', icon: <CreditCard className="w-3.5 h-3.5" /> },
        { route: 'admin-pages', labelKey: 'adminPages', icon: <FileText className="w-3.5 h-3.5" /> },
        { route: 'admin-settings', labelKey: 'adminSettings', icon: <Settings className="w-3.5 h-3.5" /> },
      ],
    },
    {
      id: 'reports',
      titleKey: 'groupReports',
      icon: <BarChart3 className="w-4 h-4" />,
      items: [
        { route: 'admin-reports', labelKey: 'adminReports', icon: <BarChart3 className="w-3.5 h-3.5" /> },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-neutral-900 text-white flex flex-col shrink-0 min-h-screen border-r border-neutral-800 select-none">
      {/* Brand & OpenCart-Inspired Operations Bar */}
      <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-white text-xs">
            A
          </div>
          <div>
            <h2 className="text-xs font-bold tracking-tight text-white flex items-center gap-1.5">
              <span>{t('brandName')}</span>
            </h2>
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
              OpenCart Engine Pro
            </span>
          </div>
        </div>
      </div>

      {/* Nav List with Hierarchical Accordion */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-210px)]">
        {/* Main Dashboard item */}
        <button
          onClick={() => navigate('admin-overview')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left ${
            currentRoute === 'admin-overview'
              ? 'bg-neutral-800 text-white font-semibold'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 text-neutral-400" />
          <span className="truncate">{t('adminOverview')}</span>
        </button>

        {/* Group Sections */}
        {navGroups.map((group) => {
          const isOpen = openGroups[group.id] || group.items.some(i => i.route === currentRoute);
          const hasActiveChild = group.items.some(i => i.route === currentRoute);

          return (
            <div key={group.id} className="pt-1">
              {/* Group Header Button */}
              <button
                onClick={() => toggleGroup(group.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  hasActiveChild ? 'text-white' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={hasActiveChild ? 'text-white' : 'text-neutral-500'}>
                    {group.icon}
                  </span>
                  <span>{t(group.titleKey)}</span>
                </div>
                {isOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
                )}
              </button>

              {/* Group Submenu Items */}
              {isOpen && (
                <div className={`mt-0.5 space-y-0.5 ${isRtl ? 'pr-4 border-r' : 'pl-4 border-l'} border-neutral-800`}>
                  {group.items.map((item) => {
                    const isActive = currentRoute === item.route;
                    return (
                      <button
                        key={item.route}
                        onClick={() => navigate(item.route)}
                        className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer text-left ${
                          isActive
                            ? 'bg-neutral-800 text-white font-semibold'
                            : 'text-neutral-400 hover:text-white hover:bg-neutral-800/40'
                        }`}
                      >
                        <span className={isActive ? 'text-white' : 'text-neutral-500'}>
                          {item.icon}
                        </span>
                        <span className="truncate">{t(item.labelKey)}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Database Quick Trigger */}
      <div className="p-3 border-t border-neutral-800 bg-neutral-900/50">
        <button
          onClick={onOpenSupabaseModal}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-neutral-800/70 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono text-[11px]">Supabase RLS</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono font-semibold">16 Tables</span>
        </button>
      </div>

      {/* Authenticated User Session */}
      {user && (
        <div className="px-3 py-2.5 border-t border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-neutral-800 text-white flex items-center justify-center text-xs font-bold shrink-0">
              {user.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-white block truncate">{user.full_name}</span>
              <span className="text-[10px] font-mono text-neutral-400 uppercase">{user.role}</span>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-neutral-400 hover:text-rose-400 transition-colors cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Return to Public Storefront Button */}
      <div className="p-3 border-t border-neutral-800">
        <button
          onClick={() => navigate('home')}
          className="w-full py-2 px-3 bg-white hover:bg-neutral-100 text-neutral-900 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          {isRtl ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
          <Store className="w-3.5 h-3.5" />
          <span>{t('storefront')}</span>
        </button>
      </div>
    </aside>
  );
};
