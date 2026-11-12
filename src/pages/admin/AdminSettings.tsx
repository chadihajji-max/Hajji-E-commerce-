import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Database, 
  Download, 
  RotateCcw, 
  Check, 
  ExternalLink, 
  Sparkles,
  RefreshCw,
  Sliders,
  Globe,
  Share2,
  ShieldCheck
} from 'lucide-react';
import { StoreSettings, SupabaseConnectionStatus } from '../../types';
import { StorageService } from '../../services/storage';
import { checkSupabaseConnection, isSupabaseConfigured } from '../../services/supabase';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { LoadingState } from '../../components/common/LoadingState';

interface AdminSettingsProps {
  onOpenSupabaseModal: () => void;
}

const LOGO_PRESETS = [
  { label: 'Aura Minimalist Wordmark', url: '/src/assets/images/store_hero_curated_1794492838701.jpg' },
  { label: 'Studio Monochrome', url: '/src/assets/images/product_outerwear_1794492839551.jpg' },
];

export const AdminSettings: React.FC<AdminSettingsProps> = ({ onOpenSupabaseModal }) => {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<SupabaseConnectionStatus | null>(null);
  const [testingDb, setTestingDb] = useState(false);

  const { t, language, isRtl } = useLanguage();
  const { showToast } = useToast();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const data = await StorageService.getSettings();
        setSettings({
          ...data,
          social_links: data.social_links || { instagram: '', twitter: '', facebook: '' },
          description_en: data.description_en || '',
          description_ar: data.description_ar || '',
          whatsapp: data.whatsapp || '',
          phone: data.phone || '',
          logo_url: data.logo_url || '',
          favicon_url: data.favicon_url || '',
          theme_color: data.theme_color || '#171717',
          qr_code_url: data.qr_code_url || '',
          default_language: data.default_language || 'en',
        });
      } catch (err) {
        console.error('Failed to load store settings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleTestDatabase = async () => {
    setTestingDb(true);
    try {
      const res = await checkSupabaseConnection();
      setConnectionStatus(res);
      showToast(res.isConnected ? 'Supabase connected successfully' : 'Operating in offline local cache mode', res.isConnected ? 'success' : 'info');
    } catch {
      showToast('Database test failed', 'error');
    } finally {
      setTestingDb(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      setSaving(true);
      await StorageService.updateSettings(settings);
      showToast(isRtl ? 'تم حفظ إعدادات المتجر بنجاح!' : 'Store settings saved successfully!', 'success');
    } catch (err) {
      showToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleExportJSON = async () => {
    const [products, orders, affiliateLinks, clicks] = await Promise.all([
      StorageService.getProducts(),
      StorageService.getOrders(),
      StorageService.getAffiliateLinks(),
      StorageService.getAffiliateClicks(),
    ]);

    const backupData = {
      exportTimestamp: new Date().toISOString(),
      platform: 'Aura Commerce v1.0',
      settings,
      products,
      orders,
      affiliateLinks,
      clicks,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aura-commerce-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Catalog & Store data exported successfully', 'success');
  };

  const handleResetData = async () => {
    if (confirm('Are you sure you want to reset store catalog and orders to default seeds?')) {
      await StorageService.resetToDefaults();
      showToast('Database reset to defaults. Refreshing...', 'info');
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  if (loading || !settings) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-8 max-w-4xl pb-16">
      {/* Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        
        {/* 1. General Store Identity & Localization */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 space-y-4 shadow-2xs">
          <h3 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-3 flex items-center gap-2">
            <Globe className="w-4 h-4 text-neutral-700" />
            <span>{isRtl ? 'هوية المتجر والإعدادات الأساسية' : 'Store Identity & Localization'}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-neutral-700 block mb-1">Store Name</label>
              <input
                type="text"
                value={settings.store_name}
                onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 focus:outline-hidden focus:border-neutral-900"
              />
            </div>

            <div>
              <label className="font-semibold text-neutral-700 block mb-1">Currency</label>
              <input
                type="text"
                disabled
                value="USD ($)"
                className="w-full bg-neutral-100 border border-neutral-200 rounded-lg px-3 py-2 text-neutral-500 font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-neutral-700 block mb-1">Customer Support Email</label>
              <input
                type="email"
                value={settings.support_email}
                onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 focus:outline-hidden focus:border-neutral-900"
              />
            </div>

            <div>
              <label className="font-semibold text-neutral-700 block mb-1">Free Shipping Threshold ($ USD)</label>
              <input
                type="number"
                value={settings.free_shipping_threshold}
                onChange={(e) => setSettings({ ...settings, free_shipping_threshold: parseFloat(e.target.value) || 0 })}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 focus:outline-hidden focus:border-neutral-900 font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-neutral-700 block mb-1">WhatsApp Contact Number</label>
              <input
                type="text"
                value={settings.whatsapp || ''}
                onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
                placeholder="+971 50 123 4567"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 focus:outline-hidden focus:border-neutral-900 font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-neutral-700 block mb-1">Default Language</label>
              <select
                value={settings.default_language || 'en'}
                onChange={(e) => setSettings({ ...settings, default_language: e.target.value as any })}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 focus:outline-hidden focus:border-neutral-900"
              >
                <option value="en">English (LTR)</option>
                <option value="ar">العربية (RTL)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
            <div>
              <label className="font-semibold text-neutral-700 block mb-1">Store Description (English)</label>
              <textarea
                rows={2}
                value={settings.description_en || ''}
                onChange={(e) => setSettings({ ...settings, description_en: e.target.value })}
                placeholder="Curated modern lifestyle essentials..."
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 focus:outline-hidden focus:border-neutral-900"
              />
            </div>

            <div>
              <label className="font-semibold text-neutral-700 block mb-1">وصف المتجر (عربي)</label>
              <textarea
                rows={2}
                value={settings.description_ar || ''}
                onChange={(e) => setSettings({ ...settings, description_ar: e.target.value })}
                placeholder="منصة تجارة إلكترونية عصرية..."
                dir="rtl"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 focus:outline-hidden focus:border-neutral-900 font-arabic"
              />
            </div>
          </div>
        </div>

        {/* 2. Branding, Logo & Theme */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 space-y-4 shadow-2xs">
          <h3 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-3 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-neutral-700" />
            <span>{isRtl ? 'الهوية البصرية والمظهر' : 'Branding & Theme Customization'}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-neutral-700 block mb-1">Logo / Banner Image URL</label>
              <input
                type="text"
                value={settings.logo_url || ''}
                onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                placeholder="/src/assets/images/..."
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 font-mono text-[11px] mb-2"
              />
              <div className="flex gap-1.5">
                {LOGO_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSettings({ ...settings, logo_url: p.url })}
                    className="text-[10px] px-2 py-1 bg-neutral-100 rounded border border-neutral-200 hover:bg-neutral-200 cursor-pointer"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="font-semibold text-neutral-700 block mb-1">Payment QR Code URL (for QR Checkout)</label>
              <input
                type="text"
                value={settings.qr_code_url || ''}
                onChange={(e) => setSettings({ ...settings, qr_code_url: e.target.value })}
                placeholder="https://... or /src/assets/..."
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="font-semibold text-neutral-700 block mb-1">Primary Theme Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.theme_color || '#171717'}
                  onChange={(e) => setSettings({ ...settings, theme_color: e.target.value })}
                  className="w-10 h-8 rounded border border-neutral-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.theme_color || '#171717'}
                  onChange={(e) => setSettings({ ...settings, theme_color: e.target.value })}
                  className="w-32 bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-1.5 font-mono text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. Social Media Links */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 space-y-4 shadow-2xs">
          <h3 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-3 flex items-center gap-2">
            <Share2 className="w-4 h-4 text-neutral-700" />
            <span>{isRtl ? 'روابط منصات التواصل الاجتماعي' : 'Social Media Channels'}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-semibold text-neutral-700 block mb-1">Instagram URL</label>
              <input
                type="url"
                value={settings.social_links?.instagram || ''}
                onChange={(e) => setSettings({
                  ...settings,
                  social_links: { ...settings.social_links, instagram: e.target.value }
                })}
                placeholder="https://instagram.com/..."
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="font-semibold text-neutral-700 block mb-1">X (Twitter) URL</label>
              <input
                type="url"
                value={settings.social_links?.twitter || ''}
                onChange={(e) => setSettings({
                  ...settings,
                  social_links: { ...settings.social_links, twitter: e.target.value }
                })}
                placeholder="https://twitter.com/..."
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="font-semibold text-neutral-700 block mb-1">Facebook URL</label>
              <input
                type="url"
                value={settings.social_links?.facebook || ''}
                onChange={(e) => setSettings({
                  ...settings,
                  social_links: { ...settings.social_links, facebook: e.target.value }
                })}
                placeholder="https://facebook.com/..."
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 font-mono text-[11px]"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-semibold text-xs transition-colors cursor-pointer flex items-center gap-2 shadow-2xs"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : (isRtl ? 'حفظ إعدادات المتجر' : 'Save Store Settings')}</span>
          </button>
        </div>
      </form>

      {/* Database & Backup Management */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 space-y-4 shadow-2xs">
        <h3 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-3 flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-600" />
          <span>{isRtl ? 'إدارة قاعدة البيانات والنسخ الاحتياطي' : 'Database Connectivity & Backup Management'}</span>
        </h3>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="space-y-1">
            <span className="font-semibold text-neutral-900 block">Supabase PostgreSQL Sync</span>
            <p className="text-neutral-500">
              {isConnectedOrConfigured() ? 'Connected to live Supabase project instance.' : 'Running in resilient offline local storage mode.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleTestDatabase}
              disabled={testingDb}
              className="px-4 py-2 border border-neutral-300 hover:bg-neutral-50 text-neutral-800 font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingDb ? 'animate-spin' : ''}`} />
              <span>Test Connection</span>
            </button>

            <button
              onClick={handleExportJSON}
              className="px-4 py-2 border border-neutral-300 hover:bg-neutral-50 text-neutral-800 font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Backup JSON</span>
            </button>

            <button
              onClick={handleResetData}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Seeds</span>
            </button>
          </div>
        </div>

        {connectionStatus && (
          <div className={`p-4 rounded-xl text-xs border ${
            connectionStatus.isConnected ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-neutral-50 border-neutral-200 text-neutral-800'
          }`}>
            <div className="font-bold flex items-center gap-1.5 mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{connectionStatus.isConnected ? 'Connection Successful' : 'Local Fallback Mode'}</span>
            </div>
            <p className="font-mono text-[11px]">{connectionStatus.message}</p>
          </div>
        )}
      </div>
    </div>
  );
};

function isConnectedOrConfigured() {
  return isSupabaseConfigured();
}
