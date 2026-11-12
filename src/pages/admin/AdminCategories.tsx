import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  X, 
  FolderTree, 
  CheckCircle, 
  XCircle, 
  Image as ImageIcon,
  ArrowUpDown
} from 'lucide-react';
import { Category } from '../../types';
import { DbService } from '../../services/dbService';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';

const PRESET_CATEGORY_IMAGES = [
  { label: 'Apparel Studio', url: '/src/assets/images/product_outerwear_1794492839551.jpg' },
  { label: 'SHEIN Fashion', url: '/src/assets/images/product_shein_dress_1794492839873.jpg' },
  { label: 'Minimalist Decor', url: '/src/assets/images/product_home_decor_1794492840631.jpg' },
  { label: 'Tech & Watches', url: '/src/assets/images/product_watch_tech_1794492841349.jpg' },
  { label: 'Hero Campaign', url: '/src/assets/images/store_hero_curated_1794492838701.jpg' },
];

export const AdminCategories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [formData, setFormData] = useState<Partial<Category>>({
    id: '',
    slug: '',
    name_en: '',
    name_ar: '',
    icon: 'FolderTree',
    image_url: PRESET_CATEGORY_IMAGES[0].url,
    parent_id: '',
    sort_order: 1,
    is_active: true,
  });

  const { t, isRtl } = useLanguage();
  const { showToast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await DbService.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openNewModal = () => {
    setEditingCategory(null);
    setFormData({
      id: 'cat_' + Date.now().toString(36),
      slug: '',
      name_en: '',
      name_ar: '',
      icon: 'FolderTree',
      image_url: PRESET_CATEGORY_IMAGES[0].url,
      parent_id: '',
      sort_order: categories.length + 1,
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setFormData({ ...cat });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(isRtl ? `هل أنت متأكد من حذف القسم "${name}"؟` : `Delete category "${name}"?`)) {
      await DbService.deleteCategory(id);
      showToast(isRtl ? 'تم حذف القسم بنجاح' : 'Category deleted successfully', 'info');
      loadData();
    }
  };

  const handleToggleActive = async (cat: Category) => {
    const updated: Category = { ...cat, is_active: !(cat.is_active ?? true) };
    await DbService.saveCategory(updated);
    showToast(isRtl ? `تم تحديث حالة القسم ${updated.name_ar}` : `Category status updated`, 'success');
    loadData();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name_en || !formData.slug) {
      showToast(isRtl ? 'يرجى إدخال اسم القسم والمسار (Slug)' : 'Please provide both English name and URL slug', 'error');
      return;
    }

    const payload: Category = {
      id: editingCategory?.id || formData.id || 'cat_' + Date.now().toString(36),
      slug: formData.slug.toLowerCase().trim().replace(/\s+/g, '-'),
      name_en: formData.name_en.trim(),
      name_ar: formData.name_ar?.trim() || formData.name_en.trim(),
      icon: formData.icon || 'FolderTree',
      image_url: formData.image_url || PRESET_CATEGORY_IMAGES[0].url,
      parent_id: formData.parent_id || undefined,
      sort_order: Number(formData.sort_order) || 1,
      is_active: formData.is_active ?? true,
    };

    await DbService.saveCategory(payload);
    showToast(isRtl ? 'تم حفظ القسم بنجاح' : 'Category saved successfully', 'success');
    setIsModalOpen(false);
    loadData();
  };

  const filtered = categories.filter((c) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return c.name_en.toLowerCase().includes(q) || c.name_ar.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isRtl ? 'البحث في الأقسام والتصنيفات...' : 'Search categories and taxonomy...'}
            className="w-full bg-white border border-neutral-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-hidden focus:border-neutral-900"
          />
        </div>

        <button
          onClick={openNewModal}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-2xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{isRtl ? 'إضافة قسم جديد' : 'Add New Category'}</span>
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingState variant="table" count={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={isRtl ? 'لا توجد أقسام مسجلة' : 'No categories found'}
          description={isRtl ? 'أنشئ أول قسم لتصنيف منتجات المتجر.' : 'Create your first catalog department to organize store products.'}
          actionLabel={isRtl ? 'إضافة قسم' : 'Add Category'}
          onAction={openNewModal}
        />
      ) : (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-700">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider text-[10px] font-semibold">
                <tr>
                  <th className="px-5 py-3.5">{isRtl ? 'صورة القسم' : 'Image'}</th>
                  <th className="px-5 py-3.5">{isRtl ? 'اسم القسم (EN)' : 'Department (EN)'}</th>
                  <th className="px-5 py-3.5">{isRtl ? 'اسم القسم (AR)' : 'Department (AR)'}</th>
                  <th className="px-5 py-3.5">{isRtl ? 'المسار (Slug)' : 'URL Slug'}</th>
                  <th className="px-5 py-3.5">{isRtl ? 'القسم الرئيسي' : 'Parent Category'}</th>
                  <th className="px-5 py-3.5">{isRtl ? 'الترتيب' : 'Sort'}</th>
                  <th className="px-5 py-3.5">{isRtl ? 'الحالة' : 'Status'}</th>
                  <th className="px-5 py-3.5 text-right">{isRtl ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filtered.map((cat) => {
                  const parentCat = categories.find(p => p.id === cat.parent_id);
                  return (
                    <tr key={cat.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="px-5 py-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-100 border border-neutral-200 shrink-0">
                          {cat.image_url ? (
                            <img src={cat.image_url} alt={cat.name_en} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-400">
                              <FolderTree className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-3 font-bold text-neutral-900">
                        {cat.name_en}
                      </td>

                      <td className="px-5 py-3 font-medium text-neutral-800 font-arabic" dir="rtl">
                        {cat.name_ar}
                      </td>

                      <td className="px-5 py-3 font-mono text-[11px] text-neutral-600">
                        /{cat.slug}
                      </td>

                      <td className="px-5 py-3 text-neutral-500">
                        {parentCat ? (isRtl ? parentCat.name_ar : parentCat.name_en) : <span className="text-neutral-400 italic">Root Level</span>}
                      </td>

                      <td className="px-5 py-3 font-mono">
                        #{cat.sort_order || 1}
                      </td>

                      <td className="px-5 py-3">
                        <button
                          onClick={() => handleToggleActive(cat)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer transition-colors ${
                            cat.is_active !== false
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-neutral-100 text-neutral-600 border border-neutral-300 hover:bg-neutral-200'
                          }`}
                        >
                          {cat.is_active !== false ? (
                            <>
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              <span>{isRtl ? 'نشط' : 'Active'}</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-neutral-400" />
                              <span>{isRtl ? 'معطل' : 'Disabled'}</span>
                            </>
                          )}
                        </button>
                      </td>

                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(cat)}
                            className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors cursor-pointer"
                            title="Edit Category"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(cat.id, cat.name_en)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                            title="Delete Category"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-neutral-300 max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
              <h3 className="text-base font-bold text-neutral-900">
                {editingCategory 
                  ? (isRtl ? `تعديل القسم: ${editingCategory.name_en}` : `Edit Category: ${editingCategory.name_en}`)
                  : (isRtl ? 'إنشاء قسم جديد' : 'Create New Catalog Category')}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">
                    {isRtl ? 'اسم القسم (إنجليزي)' : 'Category Name (English)'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name_en || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({ 
                        ...formData, 
                        name_en: val, 
                        slug: editingCategory ? formData.slug : val.toLowerCase().replace(/[^a-z0-9]+/g, '-') 
                      });
                    }}
                    placeholder="e.g. Designer Apparel"
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:border-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">
                    {isRtl ? 'اسم القسم (عربي)' : 'Category Name (Arabic)'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name_ar || ''}
                    onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                    placeholder="مثال: الأزياء الراقية"
                    dir="rtl"
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:border-neutral-900 font-arabic"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">
                  {isRtl ? 'مسار الرابط (URL Slug)' : 'URL Slug'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.slug || ''}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="designer-apparel"
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-xs font-mono focus:outline-hidden focus:border-neutral-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">
                    {isRtl ? 'القسم الرئيسي (Parent)' : 'Parent Department'}
                  </label>
                  <select
                    value={formData.parent_id || ''}
                    onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:border-neutral-900"
                  >
                    <option value="">{isRtl ? '-- قسم رئيسي جذري -- (Root Level)' : '-- Root Level Category --'}</option>
                    {categories.filter(c => c.id !== editingCategory?.id).map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {isRtl ? cat.name_ar : cat.name_en}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">
                    {isRtl ? 'ترتيب العرض' : 'Sort Order'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.sort_order || 1}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 1 })}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:border-neutral-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">
                  {isRtl ? 'صورة القسم (Image URL)' : 'Category Image URL'}
                </label>
                <input
                  type="text"
                  value={formData.image_url || ''}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://... or /src/assets/images/..."
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-xs font-mono focus:outline-hidden focus:border-neutral-900 mb-2"
                />

                {/* Preset image picker */}
                <div className="p-2 bg-neutral-50 border border-neutral-200 rounded-lg space-y-1.5">
                  <span className="text-[11px] font-semibold text-neutral-500 uppercase">
                    {isRtl ? 'اختر من صور الاستوديو الجاهزة:' : 'Or pick studio asset:'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_CATEGORY_IMAGES.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormData({ ...formData, image_url: img.url })}
                        className={`text-[11px] px-2.5 py-1 rounded-md border transition-colors cursor-pointer ${
                          formData.image_url === img.url
                            ? 'bg-neutral-900 text-white border-neutral-900'
                            : 'bg-white text-neutral-700 border-neutral-300 hover:border-neutral-500'
                        }`}
                      >
                        {img.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="catActive"
                  checked={formData.is_active ?? true}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded-sm accent-neutral-900 cursor-pointer"
                />
                <label htmlFor="catActive" className="text-xs font-medium text-neutral-800 cursor-pointer">
                  {isRtl ? 'عرض القسم ونشره في المتجر' : 'Publish and show category in public store navigation'}
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-100 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  {editingCategory ? (isRtl ? 'حفظ التعديلات' : 'Save Changes') : (isRtl ? 'إنشاء القسم' : 'Create Category')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
