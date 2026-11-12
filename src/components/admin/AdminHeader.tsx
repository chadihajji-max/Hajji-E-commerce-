import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Globe, 
  ExternalLink, 
  Database, 
  Menu, 
  Search, 
  Bell, 
  Check, 
  CheckCheck,
  User, 
  LogOut,
  AlertTriangle,
  Package,
  ShoppingBag,
  TrendingUp,
  X
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { isSupabaseConfigured } from '../../services/supabase';
import { DbService } from '../../services/dbService';
import { AdminNotification, AppRoute } from '../../types';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  onOpenNewProductModal?: () => void;
  onOpenSupabaseModal: () => void;
  onToggleMobileSidebar?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  title,
  subtitle,
  onOpenNewProductModal,
  onOpenSupabaseModal,
  onToggleMobileSidebar,
}) => {
  const { language, toggleLanguage, t } = useLanguage();
  const { navigate } = useRouter();
  const { user, logout } = useAuth();
  const hasLiveSupabase = isSupabaseConfigured();

  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ id: string; label: string; route: AppRoute; type: string }[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadNotifications();

    // Click outside listeners
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    const list = await DbService.getNotifications();
    setNotifications(list);
  };

  const handleMarkAsRead = async (id: string) => {
    await DbService.markNotificationRead(id);
    loadNotifications();
  };

  const handleMarkAllRead = async () => {
    await DbService.markAllNotificationsRead();
    loadNotifications();
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }

    const q = query.toLowerCase();
    const [prods, orders, customers] = await Promise.all([
      DbService.getProducts(),
      DbService.getOrders(),
      DbService.getCustomers(),
    ]);

    const results: { id: string; label: string; route: AppRoute; type: string }[] = [];

    // Search products
    prods.filter(p => p.title_en.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)).slice(0, 3).forEach(p => {
      results.push({ id: p.id, label: `${p.sku} - ${p.title_en}`, route: 'admin-products', type: 'Product' });
    });

    // Search orders
    orders.filter(o => o.order_number.toLowerCase().includes(q) || o.customer_name.toLowerCase().includes(q)).slice(0, 3).forEach(o => {
      results.push({ id: o.id, label: `Order ${o.order_number} (${o.customer_name})`, route: 'admin-orders', type: 'Order' });
    });

    // Search customers
    customers.filter(c => c.full_name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)).slice(0, 2).forEach(c => {
      results.push({ id: c.id, label: `${c.full_name} (${c.email})`, route: 'admin-customers', type: 'Customer' });
    });

    setSearchResults(results);
    setSearchOpen(results.length > 0);
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <header className="bg-white border-b border-neutral-200 px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-30 shadow-2xs">
      
      {/* Title & Mobile Toggle */}
      <div className="flex items-center gap-3">
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-1.5 text-neutral-600 hover:text-neutral-900 border border-neutral-200 rounded-lg cursor-pointer"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}
        <div>
          <h1 className="text-base sm:text-lg font-bold text-neutral-900 leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[11px] text-neutral-500 hidden sm:block">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Utilities & OpenCart-Inspired Top Controls */}
      <div className="flex items-center gap-2.5 flex-wrap">
        
        {/* Global Admin Search Bar */}
        <div ref={searchRef} className="relative hidden lg:block w-52">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => searchResults.length > 0 && setSearchOpen(true)}
            placeholder="Search catalog, orders..."
            className="w-full bg-neutral-50 border border-neutral-200 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-hidden focus:border-neutral-900 focus:bg-white"
          />

          {searchOpen && searchResults.length > 0 && (
            <div className="absolute top-full mt-1.5 left-0 w-80 bg-white rounded-xl shadow-xl border border-neutral-200 py-2 z-50 divide-y divide-neutral-100 text-xs">
              {searchResults.map((res) => (
                <button
                  key={`${res.type}-${res.id}`}
                  onClick={() => {
                    navigate(res.route);
                    setSearchOpen(false);
                    setSearchQuery('');
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-neutral-50 flex items-center justify-between gap-2 cursor-pointer"
                >
                  <span className="font-medium text-neutral-900 truncate">{res.label}</span>
                  <span className="text-[10px] font-mono uppercase text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded">
                    {res.type}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications Bell Dropdown */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-neutral-700 transition-colors cursor-pointer"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-mono font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-neutral-200 py-2 z-50 divide-y divide-neutral-100 text-xs">
              <div className="px-4 py-2 flex items-center justify-between bg-neutral-50">
                <span className="font-bold text-neutral-900">Notifications ({unreadCount} new)</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[10px] text-neutral-500 hover:text-neutral-900 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCheck className="w-3 h-3" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto divide-y divide-neutral-100">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-neutral-400 text-xs">No notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 hover:bg-neutral-50/80 transition-colors flex items-start gap-2.5 ${
                        !n.is_read ? 'bg-neutral-50/50' : ''
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {n.type === 'order' && <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />}
                        {n.type === 'stock' && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                        {n.type === 'affiliate' && <TrendingUp className="w-3.5 h-3.5 text-blue-600" />}
                        {n.type === 'system' && <Database className="w-3.5 h-3.5 text-neutral-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-neutral-900 text-xs leading-snug">{n.title}</h4>
                        <p className="text-[11px] text-neutral-500 leading-snug mt-0.5">{n.message}</p>
                        <div className="flex items-center justify-between mt-1 pt-1">
                          <span className="text-[10px] text-neutral-400 font-mono">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {n.link_route && (
                            <button
                              onClick={() => {
                                navigate(n.link_route!);
                                handleMarkAsRead(n.id);
                                setNotificationsOpen(false);
                              }}
                              className="text-[10px] text-neutral-800 font-bold hover:underline cursor-pointer"
                            >
                              Inspect
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Supabase Status Indicator */}
        <button
          onClick={onOpenSupabaseModal}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-xs text-neutral-700 transition-colors cursor-pointer"
          title="Supabase PostgreSQL Architecture"
        >
          <Database className="w-3.5 h-3.5 text-neutral-600" />
          <span className="font-mono text-[11px] hidden sm:inline">
            {hasLiveSupabase ? 'Supabase: Live' : 'Supabase: Local'}
          </span>
          <span 
            className={`w-2 h-2 rounded-full ${
              hasLiveSupabase ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
          />
        </button>

        {/* Language Switch */}
        <button
          onClick={toggleLanguage}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-xs font-medium text-neutral-700 transition-colors cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5 text-neutral-500" />
          <span>{language === 'en' ? 'العربية' : 'EN'}</span>
        </button>

        {/* Add Product Button */}
        {onOpenNewProductModal && (
          <button
            onClick={onOpenNewProductModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('addProduct')}</span>
          </button>
        )}
      </div>
    </header>
  );
};
