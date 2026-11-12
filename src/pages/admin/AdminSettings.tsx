import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Database, 
  Download, 
  RotateCcw, 
  Check, 
  ExternalLink, 
  Sparkles,
  RefreshCw
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

export const AdminSettings: React.FC<AdminSettingsProps> = ({ onOpenSupabaseModal }) => {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<SupabaseConnectionStatus | null>(null);
  const [testingDb, setTestingDb] = useState(false);

  const { t, language } = useLanguage();
  const { showToast } = useToast();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const data = await StorageService.getSettings();
        setSettings(data);
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
      showToast('Store settings saved successfully!', 'success');
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
    <div className="space-y-8 max-w-4xl">
      {/* Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        
        {/* 1. General Store Identity */}
        <div className="bg-white p-6 rounded-xl border border-neutral-200 space-y-4">
          <h3 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-3">
            {language === 'ar' ? 'هوية المتجر والإعدادات الأساسية' : 'Store Identity & Localization'}
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
                step="5"
                value={settings.free_shipping_threshold}
                onChange={(e) => setSettings({ ...settings, free_shipping_threshold: parseFloat(e.target.value) })}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 focus:outline-hidden focus:border-neutral-900 font-mono"
              />
            </div>
          </div>
        </div>

        {/* 2. SHEIN Affiliate Program Defaults */}
        <div className="bg-white p-6 rounded-xl border border-neutral-200 space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
            <Sparkles className="w-4 h-4 text-neutral-800" />
            <h3 className="text-sm font-bold text-neutral-900">
              {language === 'ar' ? 'إعدادات شبكة شي إن للمسوقين' : 'SHEIN Affiliate Program Configuration'}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-neutral-700 block mb-1">SHEIN Publisher / Affiliate ID</label>
              <input
                type="text"
                value={settings.shein_publisher_id}
                onChange={(e) => setSettings({ ...settings, shein_publisher_id: e.target.value })}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 focus:outline-hidden focus:border-neutral-900 font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-neutral-700 block mb-1">Default Campaign Sub-ID</label>
              <input
                type="text"
                value={settings.default_sub_id}
                onChange={(e) => setSettings({ ...settings, default_sub_id: e.target.value })}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 focus:outline-hidden focus:border-neutral-900 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : t('save')}</span>
          </button>
        </div>
      </form>

      {/* 3. Supabase & Netlify Architecture Card */}
      <div className="bg-white p-6 rounded-xl border border-neutral-200 space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-neutral-800" />
            <h3 className="text-sm font-bold text-neutral-900">
              Supabase Backend & PostgreSQL Schema
            </h3>
          </div>
          <button
            onClick={onOpenSupabaseModal}
            className="text-xs text-neutral-600 hover:text-neutral-900 font-semibold cursor-pointer"
          >
            Open Architecture Guide
          </button>
        </div>

        <p className="text-xs text-neutral-500 leading-relaxed">
          Aura is pre-wired to communicate directly with Supabase via <code className="font-mono bg-neutral-100 px-1 py-0.5 rounded">@supabase/supabase-js</code>. If credentials are not present in <code className="font-mono bg-neutral-100 px-1 py-0.5 rounded">.env</code> or Netlify dashboard, the system automatically falls back to an in-browser persistent database without breaking any user flows.
        </p>

        <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg border border-neutral-200">
          <div className="text-xs space-y-1">
            <div className="font-semibold text-neutral-900">
              Current Mode: {isSupabaseConfigured() ? 'Supabase Live Connected' : 'Resilient Local Storage Adapter'}
            </div>
            <div className="text-[11px] text-neutral-500">
              {connectionStatus?.message || 'Ready for live PostgreSQL syncing.'}
            </div>
          </div>
          <button
            onClick={handleTestDatabase}
            disabled={testingDb}
            className="px-3.5 py-1.5 bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-200 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testingDb ? 'animate-spin' : ''}`} />
            <span>{testingDb ? 'Testing...' : 'Test Connection'}</span>
          </button>
        </div>
      </div>

      {/* 4. Data Management & Export */}
      <div className="bg-white p-6 rounded-xl border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-neutral-900">
            Database Backup & Reset
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Export a full JSON snapshot of your products, orders, and SHEIN affiliate clicks.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportJSON}
            className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={handleResetData}
            className="px-3.5 py-2 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>
    </div>
  );
};
