import React, { useState, useEffect } from 'react';
import { 
  Image as ImageIcon, 
  Plus, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  CheckCircle, 
  XCircle, 
  Layers, 
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { DbService } from '../../services/dbService';
import { Banner } from '../../types';

const PRESET_IMAGES = [
  { label: 'Storefront Hero Architecture', url: '/src/assets/images/store_hero_curated_1794492838701.jpg' },
  { label: 'SHEIN Curated Dress Campaign', url: '/src/assets/images/product_shein_dress_1794492839873.jpg' },
  { label: 'Outerwear Collection', url: '/src/assets/images/product_outerwear_1794492839551.jpg' },
  { label: 'Minimalist Interior Decor', url: '/src/assets/images/product_home_decor_1794492840631.jpg' },
  { label: 'Precision Tech Chronograph', url: '/src/assets/images/product_watch_tech_1794492841349.jpg' },
];

export const AdminBanners: React.FC = () => {
  const { isRtl } = useLanguage();
  const { showToast } = useToast();

  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterChannel, setFilterChannel] = useState<'all' | 'shein' | 'direct'>('all');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState<Partial<Banner>>({
    title_en: '',
    title_ar: '',
    subtitle_en: '',
    subtitle_ar: '',
    image_url: PRESET_IMAGES[0].url,
    link_url: '#shein-deals',
    target_channel: 'all',
    sort_order: 1,
    is_active: true,
  });

  const loadBanners = async () => {
    setLoading(true);
    try {
      const data = await DbService.getBanners();
      setBanners(data);
    } catch {
      showToast('Failed to load advertising banners', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const handleOpenModal = (banner?: Banner) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData(banner);
    } else {
      setEditingBanner(null);
      setFormData({
        id: 'ban_' + Date.now().toString(36),
        title_en: '',
        title_ar: '',
        subtitle_en: '',
        subtitle_ar: '',
        image_url: PRESET_IMAGES[0].url,
        link_url: '#catalog',
        target_channel: 'all',
        sort_order: banners.length + 1,
        is_active: true,
        created_at: new Date().toISOString(),
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title_en?.trim() || !formData.image_url?.trim()) {
      showToast(isRtl ? 'يرجى إدخال العنوان ورابط الصورة' : 'Please provide banner title and image URL', 'error');
      return;
    }

    const payload: Banner = {
      id: editingBanner ? editingBanner.id : ('ban_' + Date.now().toString(36)),
      title_en: formData.title_en.trim(),
      title_ar: formData.title_ar?.trim() || formData.title_en.trim(),
      subtitle_en: formData.subtitle_en?.trim(),
      subtitle_ar: formData.subtitle_ar?.trim(),
      image_url: formData.image_url.trim(),
      link_url: formData.link_url?.trim() || '#catalog',
      target_channel: formData.target_channel || 'all',
      sort_order: Number(formData.sort_order) || 1,
      is_active: formData.is_active !== undefined ? formData.is_active : true,
      created_at: editingBanner ? editingBanner.created_at : new Date().toISOString(),
    };

    try {
      await DbService.saveBanner(payload);
      showToast(
        editingBanner 
          ? (isRtl ? 'تم تحديث الإعلان بنجاح' : 'Banner updated successfully')
          : (isRtl ? 'تمت إضافة البانر الإعلاني بنجاح' : 'Banner campaign published successfully'),
        'success'
      );
      setIsModalOpen(false);
      loadBanners();
    } catch {
      showToast('Error saving banner', 'error');
    }
  };

  const handleDeleteBanner = async (id: string, title: string) => {
    if (!confirm(isRtl ? `هل أنت متأكد من حذف البانر "${title}"؟` : `Delete banner "${title}"?`)) return;
    try {
      await DbService.deleteBanner(id);
      showToast(isRtl ? 'تم حذف الإعلان' : 'Banner campaign removed', 'success');
      loadBanners();
    } catch {
      showToast('Failed to delete banner', 'error');
    }
  };

  const handleToggleActive = async (banner: Banner) => {
    const updated = { ...banner, is_active: !banner.is_active };
    await DbService.saveBanner(updated);
    showToast(
      isRtl 
        ? (updated.is_active ? 'تم تفعيل ظهور الإعلان' : 'تم إخفاء الإعلان')
        : `Banner ${updated.is_active ? 'Published' : 'Hidden'}`,
      'success'
    );
    loadBanners();
  };

  const filteredBanners = banners.filter(b => {
    if (filterChannel === 'all') return true;
    return b.target_channel === filterChannel;
  });

  return (
    <div className="space-y-6">
      {/* Top Telemetry */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-neutral-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-neutral-500">
              {isRtl ? 'إجمالي البانرات النشطة' : 'Active Banner Slots'}
            </span>
            <ImageIcon className="w-4 h-4 text-neutral-800" />
          </div>
          <div className="text-2xl font-bold text-neutral-900 mt-2">
            {banners.filter(b => b.is_active).length} <span className="text-xs font-normal text-neutral-400">/ {banners.length}</span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            {isRtl ? 'معروضة على الواجهة الرئيسية وصفحة العروض' : 'Live on Homepage & Deals landing'}
          </p>
        </div>

        <div className="bg-white border border-neutral-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-neutral-500">
              {isRtl ? 'إعلانات شي إن التابعة' : 'SHEIN Placements'}
            </span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-neutral-900 mt-2">
            {banners.filter(b => b.target_channel === 'shein' || b.target_channel === 'all').length}
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            {isRtl ? 'توجّه الزوار بروابط التتبع التابعة' : 'Drives traffic to affiliate commission links'}
          </p>
        </div>

        <div className="bg-white border border-neutral-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-neutral-500">
              {isRtl ? 'معدل الترتيب والعرض' : 'Display Priority'}
            </span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-900 mt-2">
            1 - {banners.length || 1}
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            {isRtl ? 'يتم التحكم بترتيب الظهور تصاعدياً' : 'Ordered by sort index ascending'}
          </p>
        </div>
      </div>

      {/* Main Table and Cards */}
      <div className="bg-white border border-neutral-200 shadow-xs">
        <div className="p-4 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase text-neutral-500">{isRtl ? 'القناة:' : 'Channel:'}</span>
            <div className="flex items-center gap-1 border border-neutral-200 p-0.5 text-xs">
              <button
                onClick={() => setFilterChannel('all')}
                className={`px-3 py-1 transition-colors cursor-pointer ${filterChannel === 'all' ? 'bg-neutral-900 text-white font-medium' : 'text-neutral-600'}`}
              >
                {isRtl ? 'الكل' : 'All Channels'}
              </button>
              <button
                onClick={() => setFilterChannel('shein')}
                className={`px-3 py-1 transition-colors cursor-pointer ${filterChannel === 'shein' ? 'bg-neutral-900 text-white font-medium' : 'text-neutral-600'}`}
              >
                SHEIN
              </button>
              <button
                onClick={() => setFilterChannel('direct')}
                className={`px-3 py-1 transition-colors cursor-pointer ${filterChannel === 'direct' ? 'bg-neutral-900 text-white font-medium' : 'text-neutral-600'}`}
              >
                {isRtl ? 'المتجر المباشر' : 'Direct Store'}
              </button>
            </div>
          </div>

          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold px-4 py-2.5 transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{isRtl ? 'إضافة بانر جديد' : 'New Banner Campaign'}</span>
          </button>
        </div>

        {/* Visual Cards View */}
        {loading ? (
          <div className="p-12 text-center text-neutral-400 text-sm">
            <div className="inline-block animate-spin w-5 h-5 border-2 border-neutral-900 border-t-transparent mb-2" />
            <p>{isRtl ? 'جاري تحميل البانرات...' : 'Loading banner campaigns...'}</p>
          </div>
        ) : filteredBanners.length === 0 ? (
          <div className="p-12 text-center text-neutral-500 text-sm">
            <ImageIcon className="w-10 h-10 mx-auto text-neutral-300 mb-2" />
            <p>{isRtl ? 'لا توجد بانرات إعلانية مسجلة' : 'No banner advertisements found'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            {filteredBanners.map((banner) => (
              <div 
                key={banner.id}
                className={`border transition-all ${banner.is_active ? 'border-neutral-200 bg-white hover:border-neutral-400' : 'border-neutral-200 bg-neutral-50/60 opacity-70'}`}
              >
                {/* Banner Image Preview Container */}
                <div className="relative aspect-21/9 bg-neutral-900 overflow-hidden">
                  <img
                    src={banner.image_url}
                    alt={banner.title_en}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-neutral-950/30 to-transparent flex flex-col justify-end p-4 text-white">
                    <span className="text-[10px] uppercase font-mono tracking-wider bg-white/20 backdrop-blur-xs px-2 py-0.5 w-fit mb-1 border border-white/20">
                      #{banner.sort_order} • Channel: {banner.target_channel.toUpperCase()}
                    </span>
                    <h4 className="font-bold text-sm sm:text-base leading-tight drop-shadow-xs">
                      {isRtl ? banner.title_ar : banner.title_en}
                    </h4>
                    {(banner.subtitle_en || banner.subtitle_ar) && (
                      <p className="text-xs text-neutral-200 line-clamp-1 mt-0.5">
                        {isRtl ? (banner.subtitle_ar || banner.subtitle_en) : banner.subtitle_en}
                      </p>
                    )}
                  </div>

                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 uppercase tracking-wider backdrop-blur-xs ${
                      banner.is_active ? 'bg-emerald-600/90 text-white' : 'bg-neutral-800/90 text-neutral-300'
                    }`}>
                      {banner.is_active ? (isRtl ? 'معروض' : 'Active') : (isRtl ? 'مخفي' : 'Hidden')}
                    </span>
                  </div>
                </div>

                {/* Banner Meta & Controls */}
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-neutral-600">
                      <span className="font-medium text-neutral-900">{isRtl ? 'الرابط:' : 'Link:'}</span>
                      <a
                        href={banner.link_url}
                        className="text-indigo-600 hover:underline flex items-center gap-1 font-mono text-[11px]"
                      >
                        {banner.link_url || '#'}
                        <ArrowUpRight className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="text-neutral-500 text-[11px]">
                      {isRtl ? 'العنوان العربي:' : 'Arabic title:'} {banner.title_ar}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
                    <button
                      onClick={() => handleToggleActive(banner)}
                      className={`px-3 py-1.5 border text-xs font-medium cursor-pointer transition-colors ${
                        banner.is_active
                          ? 'border-neutral-300 hover:bg-neutral-100 text-neutral-700'
                          : 'border-emerald-600 bg-emerald-50 text-emerald-800'
                      }`}
                    >
                      {banner.is_active ? (isRtl ? 'إخفاء' : 'Deactivate') : (isRtl ? 'تفعيل' : 'Publish')}
                    </button>

                    <button
                      onClick={() => handleOpenModal(banner)}
                      className="p-1.5 border border-neutral-200 hover:border-neutral-900 text-neutral-700 cursor-pointer"
                      title="Edit banner"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteBanner(banner.id, banner.title_en)}
                      className="p-1.5 border border-neutral-200 hover:border-rose-500 hover:text-rose-600 text-neutral-500 cursor-pointer"
                      title="Delete banner"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Banner Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="bg-white border border-neutral-300 max-w-xl w-full p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-neutral-900 pb-3 border-b border-neutral-200">
              {editingBanner 
                ? (isRtl ? `تعديل البانر الإعلاني: ${editingBanner.title_en}` : `Edit Banner: ${editingBanner.title_en}`)
                : (isRtl ? 'إنشاء بانر وحملة إعلانية جديدة' : 'Create New Banner Campaign')}
            </h3>

            <form onSubmit={handleSaveBanner} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">
                    {isRtl ? 'العنوان بالإنجليزية (English)' : 'Title (English)'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title_en || ''}
                    onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                    placeholder="Spring 2026 Collection"
                    className="w-full px-3 py-2 border border-neutral-300 text-sm focus:border-neutral-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">
                    {isRtl ? 'العنوان بالعربية (Arabic)' : 'Title (Arabic)'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title_ar || ''}
                    onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                    placeholder="تشكيلة ربيع 2026 الحصرية"
                    dir="rtl"
                    className="w-full px-3 py-2 border border-neutral-300 text-sm focus:border-neutral-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">
                    {isRtl ? 'العنوان الفرعي (English)' : 'Subtitle (English)'}
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle_en || ''}
                    onChange={(e) => setFormData({ ...formData, subtitle_en: e.target.value })}
                    placeholder="Up to 40% off selected styles"
                    className="w-full px-3 py-2 border border-neutral-300 text-sm focus:border-neutral-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">
                    {isRtl ? 'العنوان الفرعي (Arabic)' : 'Subtitle (Arabic)'}
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle_ar || ''}
                    onChange={(e) => setFormData({ ...formData, subtitle_ar: e.target.value })}
                    placeholder="خصومات تصل إلى 40% على تصاميم مختارة"
                    dir="rtl"
                    className="w-full px-3 py-2 border border-neutral-300 text-sm focus:border-neutral-900 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">
                  {isRtl ? 'رابط الصورة (Image URL)' : 'Banner Image URL'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.image_url || ''}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://... or /src/assets/images/..."
                  className="w-full px-3 py-2 border border-neutral-300 text-sm font-mono text-xs focus:border-neutral-900 outline-none mb-2"
                />

                {/* Quick Presets Picker */}
                <div className="border border-neutral-200 p-2.5 bg-neutral-50 text-xs space-y-1.5">
                  <span className="font-semibold text-neutral-600 block text-[11px] uppercase">
                    {isRtl ? 'أو اختر من صور الاستوديو الجاهزة:' : 'Or pick from generated studio assets:'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_IMAGES.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormData({ ...formData, image_url: preset.url })}
                        className={`text-[11px] px-2.5 py-1 border transition-colors cursor-pointer ${
                          formData.image_url === preset.url
                            ? 'bg-neutral-900 text-white border-neutral-900'
                            : 'bg-white text-neutral-700 border-neutral-300 hover:border-neutral-500'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">
                    {isRtl ? 'الرابط الموجه (Link URL)' : 'Target Link'}
                  </label>
                  <input
                    type="text"
                    value={formData.link_url || '#'}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                    placeholder="#shein-deals or #catalog"
                    className="w-full px-3 py-2 border border-neutral-300 text-sm focus:border-neutral-900 outline-none font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">
                    {isRtl ? 'القناة المستهدفة' : 'Target Channel'}
                  </label>
                  <select
                    value={formData.target_channel || 'all'}
                    onChange={(e) => setFormData({ ...formData, target_channel: e.target.value as any })}
                    className="w-full px-3 py-2 border border-neutral-300 text-sm focus:border-neutral-900 outline-none"
                  >
                    <option value="all">{isRtl ? 'كافة القنوات (All)' : 'All Channels'}</option>
                    <option value="shein">SHEIN Affiliate</option>
                    <option value="direct">{isRtl ? 'المتجر المباشر (Direct)' : 'Direct Catalog'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">
                    {isRtl ? 'ترتيب الظهور' : 'Sort Order'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.sort_order || 1}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-neutral-300 text-sm focus:border-neutral-900 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="bannerActive"
                  checked={formData.is_active ?? true}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 accent-neutral-900 cursor-pointer"
                />
                <label htmlFor="bannerActive" className="text-xs font-medium text-neutral-800 cursor-pointer">
                  {isRtl ? 'نشر وتفعيل البانر مباشرة على المتجر' : 'Publish banner to live storefront immediately'}
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-neutral-300 text-xs font-medium text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  {editingBanner ? (isRtl ? 'حفظ التعديلات' : 'Save Changes') : (isRtl ? 'نشر الإعلان' : 'Publish Banner')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
