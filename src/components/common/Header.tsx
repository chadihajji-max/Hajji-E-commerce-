import React, { useState } from 'react';
import { ShoppingBag, Globe, Menu, X, Database, User, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useCart } from '../../context/CartContext';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  onOpenSupabaseModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSupabaseModal }) => {
  const { language, toggleLanguage, t } = useLanguage();
  const { totalItemsCount, setIsCartOpen } = useCart();
  const { currentRoute, navigate } = useRouter();
  const { user, isStaff, openAuthModal } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        
        {/* Zone 1: Brand Wordmark (Single text element) */}
        <button
          onClick={() => navigate('home')}
          className="text-lg font-bold tracking-tight text-neutral-900 whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity cursor-pointer text-left"
        >
          {t('brandName')}
        </button>

        {/* Zone 2: 4 Clean Single-Line Nav Links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-neutral-600">
          <button
            onClick={() => navigate('home')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-neutral-900 cursor-pointer ${
              currentRoute === 'home' ? 'text-neutral-900 font-bold' : ''
            }`}
          >
            {t('home')}
          </button>
          <button
            onClick={() => navigate('catalog')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-neutral-900 cursor-pointer ${
              currentRoute === 'catalog' ? 'text-neutral-900 font-bold' : ''
            }`}
          >
            {t('catalog')}
          </button>
          <button
            onClick={() => navigate('shein-deals')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-neutral-900 cursor-pointer ${
              currentRoute === 'shein-deals' ? 'text-neutral-900 font-bold' : ''
            }`}
          >
            {t('sheinDeals')}
          </button>
          <button
            onClick={() => navigate('admin-overview')}
            className="transition-colors whitespace-nowrap shrink-0 text-neutral-500 hover:text-neutral-900 cursor-pointer"
          >
            {t('admin')}
          </button>
        </nav>

        {/* Zone 3: Primary Action & Utilities */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Supabase Status Trigger */}
          <button
            onClick={onOpenSupabaseModal}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200/80 rounded-md transition-colors cursor-pointer"
            title="Inspect Supabase & Database Architecture"
          >
            <Database className="w-3.5 h-3.5 text-neutral-700" />
            <span className="font-mono">Supabase</span>
          </button>

          {/* User Account / Auth Trigger */}
          {user ? (
            <button
              onClick={() => navigate('profile')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold text-neutral-800 hover:bg-neutral-100 transition-colors cursor-pointer border border-neutral-200"
              title="View Account Profile"
            >
              <User className="w-3.5 h-3.5 text-neutral-600" />
              <span className="max-w-[90px] truncate">{user.full_name.split(' ')[0]}</span>
              {isStaff && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Admin/Manager Privileges" />
              )}
            </button>
          ) : (
            <button
              onClick={() => openAuthModal('login')}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-neutral-800 hover:bg-neutral-100 rounded-md transition-colors cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-neutral-500" />
              <span>{language === 'ar' ? 'دخول' : 'Sign In'}</span>
            </button>
          )}

          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:text-neutral-900 rounded-md hover:bg-neutral-100 transition-colors cursor-pointer"
            aria-label="Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-neutral-500" />
            <span>{language === 'en' ? 'العربية' : 'EN'}</span>
          </button>

          {/* Shopping Bag Button */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 text-neutral-700 hover:text-neutral-900 transition-colors cursor-pointer rounded-lg hover:bg-neutral-100"
            aria-label="View Shopping Bag"
          >
            <ShoppingBag className="w-4 h-4" />
            {totalItemsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-neutral-900 text-white text-[10px] font-mono font-bold flex items-center justify-center">
                {totalItemsCount}
              </span>
            )}
          </button>

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-neutral-700 hover:text-neutral-900 cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-200 bg-white px-4 pt-3 pb-5 space-y-2">
          <button
            onClick={() => {
              navigate('home');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-sm font-medium text-neutral-700 hover:text-neutral-900"
          >
            {t('home')}
          </button>
          <button
            onClick={() => {
              navigate('catalog');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-sm font-medium text-neutral-700 hover:text-neutral-900"
          >
            {t('catalog')}
          </button>
          <button
            onClick={() => {
              navigate('shein-deals');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-sm font-medium text-neutral-700 hover:text-neutral-900"
          >
            {t('sheinDeals')}
          </button>
          <button
            onClick={() => {
              navigate('admin-overview');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-sm font-semibold text-neutral-900"
          >
            {t('admin')}
          </button>

          {user ? (
            <button
              onClick={() => {
                navigate('profile');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2 text-sm font-medium text-neutral-700 hover:text-neutral-900"
            >
              Profile ({user.full_name})
            </button>
          ) : (
            <button
              onClick={() => {
                openAuthModal('login');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2 text-sm font-semibold text-neutral-900"
            >
              Sign In / Register
            </button>
          )}

          <button
            onClick={() => {
              onOpenSupabaseModal();
              setMobileMenuOpen(false);
            }}
            className="w-full mt-2 py-2 px-3 bg-neutral-100 text-neutral-800 rounded text-xs font-mono flex items-center justify-center gap-2"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Supabase Architecture Setup</span>
          </button>
        </div>
      )}
    </header>
  );
};
