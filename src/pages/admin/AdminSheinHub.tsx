import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ExternalLink, 
  Copy, 
  Check, 
  Calculator, 
  TrendingUp, 
  MousePointerClick, 
  ShieldCheck, 
  Plus,
  Trash2,
  Edit3,
  Search,
  CheckCircle,
  XCircle,
  Tag,
  DollarSign
} from 'lucide-react';
import { AffiliateLink, AffiliateClickLog, Product, Category } from '../../types';
import { StorageService } from '../../services/storage';
import { DbService } from '../../services/dbService';
import { buildSheinAffiliateUrl, createAffiliateClickRecord } from '../../services/sheinAffiliate';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { LoadingState } from '../../components/common/LoadingState';

const PRESET_SHEIN_IMAGES = [
  { label: 'SHEIN Emerald Satin Dress', url: '/src/assets/images/product_shein_dress_1794492839873.jpg' },
  { label: 'SHEIN Neutral Co-ord', url: '/src/assets/images/store_hero_curated_1794492838701.jpg' },
  { label: 'SHEIN Outerwear Trench', url: '/src/assets/images/product_outerwear_1794492839551.jpg' },
];

export const AdminSheinHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'products' | 'generator' | 'clicks'>('products');
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [clicks, setClicks] = useState<AffiliateClickLog[]>([]);
  const [sheinProducts, setSheinProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Product Modal state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingSheinProduct, setEditingSheinProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<Partial<Product>>({
    sku: 'SHEIN-DEAL-01',
    title_en: '',
    title_ar: '',
    description_en: '',
    description_ar: '',
    category_id: 'cat-fashion',
    price: 39.00,
    compare_at_price: 55.00,
    stock: 99,
    image_url: PRESET_SHEIN_IMAGES[0].url,
    is_active: true,
    is_featured: true,
    is_shein_affiliate: true,
    shein_product_id: 'goods-p-992184',
    shein_affiliate_url: 'https://us.shein.com/goods-p-992184.html?aff_id=SHEIN_AFF_98421',
    shein_commission_rate: 15.0,
    shein_sub_id: 'admin_shein_hub',
  });

  // Link Generator form state
  const [title, setTitle] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [subId, setSubId] = useState('campaign_spring');
  const [campaign, setCampaign] = useState('spring_2026');
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // Simulator state
  const [monthlyVisitors, setMonthlyVisitors] = useState(5000);
  const [conversionRate, setConversionRate] = useState(3.0);
  const [avgOrderVal, setAvgOrderVal] = useState(48.0);
  const [commissionRate, setCommissionRate] = useState(14.0);

  const { t, isRtl } = useLanguage();
  const { showToast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [l, c, prods, cats] = await Promise.all([
        StorageService.getAffiliateLinks(),
        StorageService.getAffiliateClicks(),
        StorageService.getProducts(),
        StorageService.getCategories(),
      ]);
      setLinks(l);
      setClicks(c);
      setSheinProducts(prods.filter(p => p.is_shein_affiliate));
      setCategories(cats);
    } catch (err) {
      console.error('Failed to load SHEIN hub data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenProductModal = (prod?: Product) => {
    if (prod) {
      setEditingSheinProduct(prod);
      setProductForm({ ...prod });
    } else {
      setEditingSheinProduct(null);
      setProductForm({
        id: 'shein-prod-' + Date.now().toString(36),
        sku: `SHEIN-${Math.floor(1000 + Math.random() * 9000)}`,
        title_en: '',
        title_ar: '',
        description_en: '',
        description_ar: '',
        category_id: categories[0]?.id || 'cat-fashion',
        price: 39.00,
        compare_at_price: 55.00,
        stock: 100,
        image_url: PRESET_SHEIN_IMAGES[0].url,
        is_active: true,
        is_featured: true,
        is_shein_affiliate: true,
        shein_product_id: `goods-p-${Math.floor(100000 + Math.random() * 900000)}`,
        shein_affiliate_url: 'https://us.shein.com/goods-p-3829471.html?aff_id=SHEIN_AFF_98421',
        shein_commission_rate: 15.0,
        shein_sub_id: 'shein_hub_direct',
      });
    }
    setIsProductModalOpen(true);
  };

  const handleSaveSheinProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.title_en || !productForm.price) {
      showToast(isRtl ? 'يرجى إدخال عنوان المنتج والسعر' : 'Please provide title and price', 'error');
      return;
    }

    let finalAffUrl = productForm.shein_affiliate_url;
    if (finalAffUrl && !finalAffUrl.includes('aff_id')) {
      finalAffUrl = buildSheinAffiliateUrl({
        url: finalAffUrl,
        subId: productForm.shein_sub_id || 'shein_admin'
      });
    }

    const payload: Product = {
      id: editingSheinProduct?.id || productForm.id || 'shein-prod-' + Date.now().toString(36),
      sku: productForm.sku || 'SHEIN-SKU',
      title_en: productForm.title_en,
      title_ar: productForm.title_ar || productForm.title_en,
      description_en: productForm.description_en || '',
      description_ar: productForm.description_ar || '',
      category_id: productForm.category_id || 'cat-fashion',
      price: Number(productForm.price) || 0,
      compare_at_price: productForm.compare_at_price ? Number(productForm.compare_at_price) : undefined,
      stock: Number(productForm.stock) || 100,
      image_url: productForm.image_url || PRESET_SHEIN_IMAGES[0].url,
      is_active: productForm.is_active ?? true,
      is_featured: productForm.is_featured ?? true,
      is_shein_affiliate: true,
      shein_product_id: productForm.shein_product_id,
      shein_affiliate_url: finalAffUrl,
      shein_commission_rate: Number(productForm.shein_commission_rate) || 15.0,
      shein_sub_id: productForm.shein_sub_id,
      rating: editingSheinProduct?.rating || 4.8,
      reviews_count: editingSheinProduct?.reviews_count || 45,
      created_at: editingSheinProduct?.created_at || new Date().toISOString(),
    };

    await StorageService.saveProduct(payload);
    showToast(isRtl ? 'تم حفظ منتج شي إن التابع بنجاح' : 'SHEIN affiliate product saved successfully', 'success');
    setIsProductModalOpen(false);
    loadData();
  };

  const handleDeleteSheinProduct = async (id: string, title: string) => {
    if (confirm(isRtl ? `هل أنت متأكد من حذف المنتج "${title}"؟` : `Delete SHEIN product "${title}"?`)) {
      await StorageService.deleteProduct(id);
      showToast(isRtl ? 'تم حذف المنتج التابع' : 'SHEIN affiliate product removed', 'success');
      loadData();
    }
  };

  const handleGenerateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUrl.trim()) return;

    const formatted = buildSheinAffiliateUrl({
      url: targetUrl.trim(),
      subId: subId.trim() || 'default',
      campaign: campaign.trim() || undefined,
    });

    setGeneratedUrl(formatted);

    const newLink: AffiliateLink = {
      id: 'aff-' + Date.now().toString(36),
      title: title.trim() || 'Custom SHEIN Deal',
      original_shein_url: targetUrl.trim(),
      affiliate_url: formatted,
      aff_id: import.meta.env.VITE_SHEIN_AFFILIATE_ID || 'SHEIN_AFF_98421',
      sub_id: subId.trim() || 'default',
      campaign: campaign.trim(),
      clicks: 0,
      estimated_commission_rate: 15.0,
      created_at: new Date().toISOString(),
    };

    await StorageService.saveAffiliateLink(newLink);
    showToast('Tracked SHEIN Affiliate Link saved!', 'success');
    loadData();
  };

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    showToast(t('sheinLinkCopied'), 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  // Simulator calculation
  const estimatedOrders = Math.round((monthlyVisitors * conversionRate) / 100);
  const estimatedGrossGmv = estimatedOrders * avgOrderVal;
  const projectedCommission = (estimatedGrossGmv * commissionRate) / 100;

  const totalCommissions = clicks.reduce((acc, c) => acc + (c.estimated_commission || 1.85), 0);

  if (loading) {
    return <LoadingState variant="table" count={4} />;
  }

  return (
    <div className="space-y-8">
      {/* Overview Banner */}
      <div className="bg-neutral-900 text-white p-6 sm:p-8 rounded-xl border border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-neutral-800 text-amber-400 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>SHEIN AFFILIATE PROGRAM ENGINE</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            {isRtl ? 'إدارة برنامج شي إن التابع والعمولات' : 'SHEIN Affiliate Integration & Management Hub'}
          </h2>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Manage dedicated SHEIN affiliate products, generate tracked destination URLs, inspect outbound click statistics, and project publisher commission revenues.
          </p>
        </div>

        <div className="bg-neutral-800 p-4 rounded-lg border border-neutral-700 text-xs space-y-1.5 shrink-0">
          <div className="text-neutral-400 font-mono text-[10px] uppercase">Publisher ID</div>
          <div className="font-mono font-bold text-white text-sm">
            {import.meta.env.VITE_SHEIN_AFFILIATE_ID || 'SHEIN_AFF_98421'}
          </div>
          <div className="text-[10px] text-emerald-400 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            <span>Active Publisher Credentials</span>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-neutral-200 gap-2">
        <button
          onClick={() => setActiveTab('products')}
          className={`px-5 py-2.5 text-xs font-semibold border-b-2 cursor-pointer transition-colors ${
            activeTab === 'products' ? 'border-neutral-900 text-neutral-900' : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
        >
          {isRtl ? `منتجات شي إن التابعة (${sheinProducts.length})` : `SHEIN Affiliate Products (${sheinProducts.length})`}
        </button>
        <button
          onClick={() => setActiveTab('generator')}
          className={`px-5 py-2.5 text-xs font-semibold border-b-2 cursor-pointer transition-colors ${
            activeTab === 'generator' ? 'border-neutral-900 text-neutral-900' : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
        >
          {isRtl ? 'مولد الروابط والتحويل' : 'URL Link Generator'}
        </button>
        <button
          onClick={() => setActiveTab('clicks')}
          className={`px-5 py-2.5 text-xs font-semibold border-b-2 cursor-pointer transition-colors ${
            activeTab === 'clicks' ? 'border-neutral-900 text-neutral-900' : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
        >
          {isRtl ? `إحصاءات النقرات (${clicks.length})` : `Click Statistics (${clicks.length})`}
        </button>
      </div>

      {/* Tab 1: SHEIN Affiliate Products Management */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">
                {isRtl ? 'إدارة منتجات شي إن المعروضة في المتجر' : 'Curated SHEIN Affiliate Catalog'}
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                {isRtl ? 'هذه المنتجات مفصولة عن مخزون المتجر المباشر وتحول الزوار إلى رابط التتبع التابع.' : 'Separated from direct inventory and configured with secure publisher tracking URLs.'}
              </p>
            </div>

            <button
              onClick={() => handleOpenProductModal()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isRtl ? 'إضافة منتج شي إن' : 'Add SHEIN Product'}</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-neutral-700">
                <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider text-[10px] font-semibold">
                  <tr>
                    <th className="px-5 py-3.5">{isRtl ? 'المنتج' : 'Product'}</th>
                    <th className="px-5 py-3.5">{isRtl ? 'معرف شي إن' : 'SHEIN ID / SKU'}</th>
                    <th className="px-5 py-3.5">{isRtl ? 'السعر العرض' : 'Price / Promo'}</th>
                    <th className="px-5 py-3.5">{isRtl ? 'نسبة العمولة' : 'Commission'}</th>
                    <th className="px-5 py-3.5">{isRtl ? 'الحالة' : 'Status'}</th>
                    <th className="px-5 py-3.5 text-right">{isRtl ? 'الإجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {sheinProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-100 border border-neutral-200 shrink-0">
                            <img src={p.image_url} alt={p.title_en} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <div className="font-bold text-neutral-900 line-clamp-1">{p.title_en}</div>
                            <div className="text-[11px] text-neutral-500 line-clamp-1 font-arabic" dir="rtl">{p.title_ar}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3 font-mono text-[11px] text-neutral-600">
                        {p.shein_product_id || p.sku}
                      </td>

                      <td className="px-5 py-3">
                        <div className="font-bold text-neutral-900">${p.price.toFixed(2)}</div>
                        {p.compare_at_price && (
                          <div className="text-[10px] text-neutral-400 line-through">${p.compare_at_price.toFixed(2)}</div>
                        )}
                      </td>

                      <td className="px-5 py-3">
                        <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-semibold text-[11px]">
                          {p.shein_commission_rate || 15}% Est.
                        </span>
                      </td>

                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                          p.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-neutral-100 text-neutral-600'
                        }`}>
                          {p.is_active ? (isRtl ? 'نشط' : 'Active') : (isRtl ? 'معطل' : 'Disabled')}
                        </span>
                      </td>

                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenProductModal(p)}
                            className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors cursor-pointer"
                            title="Edit SHEIN product"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSheinProduct(p.id, p.title_en)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                            title="Delete SHEIN product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: URL Link Generator */}
      {activeTab === 'generator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-6 bg-white p-6 rounded-xl border border-neutral-200 space-y-4">
            <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-neutral-700" />
              <span>{t('generateLink')}</span>
            </h3>
            <p className="text-xs text-neutral-500">
              Paste any SHEIN collection or product page URL to create a tracked affiliate link with publisher and sub-ID tags.
            </p>

            <form onSubmit={handleGenerateLink} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Campaign Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Summer Linen Slip Drops"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:border-neutral-900"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Original SHEIN Product URL</label>
                <input
                  type="url"
                  required
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://us.shein.com/pd-p-123456.html"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-hidden focus:border-neutral-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Tracking Sub-ID</label>
                  <input
                    type="text"
                    value={subId}
                    onChange={(e) => setSubId(e.target.value)}
                    placeholder="campaign_spring"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-hidden focus:border-neutral-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Campaign Tag</label>
                  <input
                    type="text"
                    value={campaign}
                    onChange={(e) => setCampaign(e.target.value)}
                    placeholder="spring_2026"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-hidden focus:border-neutral-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer"
              >
                {t('generateLink')}
              </button>
            </form>

            {generatedUrl && (
              <div className="mt-4 p-4 bg-neutral-50 border border-neutral-200 rounded-lg space-y-2">
                <span className="text-[10px] font-mono text-neutral-500 uppercase">Generated Tracked Aff Link</span>
                <div className="p-2 bg-white border border-neutral-200 rounded font-mono text-[11px] text-neutral-900 break-all">
                  {generatedUrl}
                </div>
                <button
                  onClick={() => copyLink(generatedUrl)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 text-white rounded text-xs font-medium cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? t('sheinLinkCopied') : t('copy')}</span>
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Commission Simulator */}
          <div className="lg:col-span-6 bg-white p-6 rounded-xl border border-neutral-200 space-y-4">
            <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-neutral-700" />
              <span>{isRtl ? 'حاسبة العمولات الإجمالية' : 'Publisher Revenue & Commission Simulator'}</span>
            </h3>
            <p className="text-xs text-neutral-500">
              Project potential affiliate returns based on traffic volume, conversion rates, and average order value.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Monthly Affiliate Visitors: {monthlyVisitors.toLocaleString()}</label>
                <input
                  type="range"
                  min="500"
                  max="50000"
                  step="500"
                  value={monthlyVisitors}
                  onChange={(e) => setMonthlyVisitors(Number(e.target.value))}
                  className="w-full accent-neutral-900 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Conversion Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={conversionRate}
                    onChange={(e) => setConversionRate(Number(e.target.value))}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Avg Order Value ($)</label>
                  <input
                    type="number"
                    value={avgOrderVal}
                    onChange={(e) => setAvgOrderVal(Number(e.target.value))}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Commission Rate (%)</label>
                <input
                  type="number"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(Number(e.target.value))}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs"
                />
              </div>
            </div>

            <div className="bg-neutral-900 text-white p-4 rounded-xl space-y-3">
              <div className="flex justify-between text-xs text-neutral-400">
                <span>Estimated Orders:</span>
                <span className="font-mono text-white font-bold">{estimatedOrders.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs text-neutral-400">
                <span>Projected Gross GMV:</span>
                <span className="font-mono text-white font-bold">${estimatedGrossGmv.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="pt-2 border-t border-neutral-800 flex justify-between items-center">
                <span className="text-xs font-bold text-amber-400">Projected Commission:</span>
                <span className="font-mono text-emerald-400 text-lg font-extrabold">
                  ${projectedCommission.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Click Statistics & Logs */}
      {activeTab === 'clicks' && (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-2xs p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">
                {isRtl ? 'سجل النقرات والأرباح المقدرة' : 'Outbound Affiliate Clicks & Real-time Telemetry'}
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                {isRtl ? `إجمالي العمولات المسجلة من النقرات: $${totalCommissions.toFixed(2)} USD` : `Total estimated commission from tracked clicks: $${totalCommissions.toFixed(2)} USD`}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-700">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider text-[10px] font-semibold">
                <tr>
                  <th className="px-5 py-3.5">{isRtl ? 'معرف المنتج' : 'Target Product ID'}</th>
                  <th className="px-5 py-3.5">{isRtl ? 'وقت النقرة' : 'Timestamp'}</th>
                  <th className="px-5 py-3.5">{isRtl ? 'الجهاز' : 'Device'}</th>
                  <th className="px-5 py-3.5">{isRtl ? 'المصدر' : 'Referrer'}</th>
                  <th className="px-5 py-3.5 text-right">{isRtl ? 'العمولة المقدرة' : 'Est. Commission'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {clicks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-neutral-400">
                      {isRtl ? 'لا توجد نقرات مسجلة بعد. جرب الضغط على منتجات شي إن في المتجر.' : 'No click logs recorded yet. Try clicking affiliate products on the storefront.'}
                    </td>
                  </tr>
                ) : (
                  clicks.map((c) => (
                    <tr key={c.id} className="hover:bg-neutral-50/80">
                      <td className="px-5 py-3 font-mono text-[11px] text-neutral-900">
                        {c.product_id || c.affiliate_product_id || 'SHEIN_DEAL'}
                      </td>
                      <td className="px-5 py-3 text-neutral-500">
                        {new Date(c.created_at).toLocaleString()}
                      </td>
                      <td className="px-5 py-3 font-mono uppercase text-[10px] text-neutral-600">
                        {c.device_type || 'Desktop'}
                      </td>
                      <td className="px-5 py-3 text-neutral-500">
                        {c.referrer || 'Storefront Affiliate Portal'}
                      </td>
                      <td className="px-5 py-3 text-right font-bold font-mono text-emerald-700">
                        +${(c.estimated_commission || 1.85).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit SHEIN Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-neutral-300 max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
              <h3 className="text-base font-bold text-neutral-900">
                {editingSheinProduct 
                  ? (isRtl ? `تعديل منتج شي إن: ${editingSheinProduct.title_en}` : `Edit SHEIN Product: ${editingSheinProduct.title_en}`)
                  : (isRtl ? 'إضافة منتج شي إن تابع جديد' : 'Add New SHEIN Affiliate Product')}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSheinProduct} className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold uppercase text-neutral-700 mb-1">
                    {isRtl ? 'عنوان المنتج (إنجليزي)' : 'Product Title (English)*'}
                  </label>
                  <input
                    type="text"
                    required
                    value={productForm.title_en || ''}
                    onChange={(e) => setProductForm({ ...productForm, title_en: e.target.value })}
                    placeholder="SHEIN Satin Midi Dress"
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase text-neutral-700 mb-1">
                    {isRtl ? 'عنوان المنتج (عربي)' : 'Product Title (Arabic)*'}
                  </label>
                  <input
                    type="text"
                    required
                    value={productForm.title_ar || ''}
                    onChange={(e) => setProductForm({ ...productForm, title_ar: e.target.value })}
                    placeholder="فستان ساتان من شي إن"
                    dir="rtl"
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 font-arabic"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold uppercase text-neutral-700 mb-1">
                    {isRtl ? 'معرف شي إن (SHEIN ID)' : 'SHEIN Product ID'}
                  </label>
                  <input
                    type="text"
                    required
                    value={productForm.shein_product_id || ''}
                    onChange={(e) => setProductForm({ ...productForm, shein_product_id: e.target.value })}
                    placeholder="goods-p-3829471"
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase text-neutral-700 mb-1">
                    {isRtl ? 'السعر العرض ($)' : 'Promo Price ($)*'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={productForm.price ?? 36}
                    onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase text-neutral-700 mb-1">
                    {isRtl ? 'السعر الأصلي ($)' : 'Original Price ($)'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={productForm.compare_at_price ?? ''}
                    onChange={(e) => setProductForm({ ...productForm, compare_at_price: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="49.00"
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase text-neutral-700 mb-1">
                  {isRtl ? 'رابط التتبع التابع (Affiliate Tracking URL)' : 'Affiliate Tracking URL*'}
                </label>
                <input
                  type="url"
                  required
                  value={productForm.shein_affiliate_url || ''}
                  onChange={(e) => setProductForm({ ...productForm, shein_affiliate_url: e.target.value })}
                  placeholder="https://us.shein.com/...-p-123.html?aff_id=..."
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase text-neutral-700 mb-1">
                  {isRtl ? 'صورة المنتج' : 'Product Image URL'}
                </label>
                <input
                  type="text"
                  required
                  value={productForm.image_url || ''}
                  onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 font-mono text-[11px] mb-2"
                />

                <div className="flex gap-2">
                  {PRESET_SHEIN_IMAGES.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setProductForm({ ...productForm, image_url: img.url })}
                      className="text-[11px] px-2.5 py-1 bg-white border border-neutral-300 rounded hover:border-neutral-900 cursor-pointer"
                    >
                      {img.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold uppercase text-neutral-700 mb-1">
                    {isRtl ? 'الوصف (إنجليزي)' : 'Description (English)'}
                  </label>
                  <textarea
                    rows={3}
                    value={productForm.description_en || ''}
                    onChange={(e) => setProductForm({ ...productForm, description_en: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase text-neutral-700 mb-1">
                    {isRtl ? 'الوصف (عربي)' : 'Description (Arabic)'}
                  </label>
                  <textarea
                    rows={3}
                    value={productForm.description_ar || ''}
                    onChange={(e) => setProductForm({ ...productForm, description_ar: e.target.value })}
                    dir="rtl"
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 font-arabic"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 bg-white border border-neutral-300 rounded-lg font-semibold hover:bg-neutral-100 cursor-pointer"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-semibold cursor-pointer"
                >
                  {editingSheinProduct ? (isRtl ? 'حفظ التعديلات' : 'Save Changes') : (isRtl ? 'حفظ المنتج التابع' : 'Save Affiliate Product')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
