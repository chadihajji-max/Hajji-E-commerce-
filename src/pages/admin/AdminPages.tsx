import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Globe, 
  CheckCircle, 
  XCircle, 
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { DbService } from '../../services/dbService';
import { StaticPage } from '../../types';

export const AdminPages: React.FC = () => {
  const { t, isRtl } = useLanguage();
  const { showToast } = useToast();

  const [pages, setPages] = useState<StaticPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<StaticPage | null>(null);
  const [activeLangTab, setActiveLangTab] = useState<'en' | 'ar'>('en');
  const [formData, setFormData] = useState<Partial<StaticPage>>({
    slug: '',
    title_en: '',
    title_ar: '',
    content_en: '',
    content_ar: '',
    is_published: true,
  });

  // Preview Drawer
  const [previewPage, setPreviewPage] = useState<StaticPage | null>(null);

  const loadPages = async () => {
    setLoading(true);
    try {
      const data = await DbService.getPages();
      setPages(data);
    } catch {
      showToast('Failed to load store pages', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPages();
  }, []);

  const handleOpenModal = (page?: StaticPage) => {
    if (page) {
      setEditingPage(page);
      setFormData(page);
    } else {
      setEditingPage(null);
      setFormData({
        id: 'page_' + Date.now().toString(36),
        slug: '',
        title_en: '',
        title_ar: '',
        content_en: '',
        content_ar: '',
        is_published: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
    setActiveLangTab(isRtl ? 'ar' : 'en');
    setIsModalOpen(true);
  };

  const handleSavePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title_en?.trim() || !formData.slug?.trim()) {
      showToast(isRtl ? 'يرجى إدخال عنوان الصفحة والمسار (Slug)' : 'Please provide title and page slug', 'error');
      return;
    }

    const cleanSlug = formData.slug.toLowerCase().trim().replace(/[^a-z0-9-_]/g, '-');

    const payload: StaticPage = {
      id: editingPage ? editingPage.id : ('page_' + Date.now().toString(36)),
      slug: cleanSlug,
      title_en: formData.title_en.trim(),
      title_ar: formData.title_ar?.trim() || formData.title_en.trim(),
      content_en: formData.content_en?.trim() || '',
      content_ar: formData.content_ar?.trim() || formData.content_en?.trim() || '',
      is_published: formData.is_published !== undefined ? formData.is_published : true,
      updated_at: new Date().toISOString(),
      created_at: editingPage ? editingPage.created_at : new Date().toISOString(),
    };

    try {
      await DbService.savePage(payload);
      showToast(
        editingPage 
          ? (isRtl ? 'تم تحديث الصفحة بنجاح' : 'Page content updated successfully')
          : (isRtl ? 'تم إنشاء الصفحة الجديدة بنجاح' : 'New CMS page published successfully'),
        'success'
      );
      setIsModalOpen(false);
      loadPages();
    } catch {
      showToast('Error saving page', 'error');
    }
  };

  const handleDeletePage = async (id: string, title: string) => {
    if (!confirm(isRtl ? `هل أنت متأكد من حذف الصفحة "${title}"؟` : `Delete page "${title}"?`)) return;
    try {
      await DbService.deletePage(id);
      showToast(isRtl ? 'تم حذف الصفحة' : 'Page deleted successfully', 'success');
      loadPages();
    } catch {
      showToast('Failed to delete page', 'error');
    }
  };

  const handleTogglePublish = async (page: StaticPage) => {
    const updated = { ...page, is_published: !page.is_published };
    await DbService.savePage(updated);
    showToast(
      isRtl
        ? (updated.is_published ? 'تم نشر الصفحة للجمهور' : 'تم تحويل الصفحة إلى مسودة')
        : `Page ${updated.is_published ? 'Published' : 'Unpublished (Draft)'}`,
      'success'
    );
    loadPages();
  };

  const filteredPages = pages.filter(p => 
    p.title_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.title_ar.includes(searchTerm) ||
    p.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-neutral-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-neutral-500">
              {isRtl ? 'إجمالي صفحات المتجر' : 'Total CMS Pages'}
            </span>
            <FileText className="w-4 h-4 text-neutral-800" />
          </div>
          <div className="text-2xl font-bold text-neutral-900 mt-2">
            {pages.length}
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            {isRtl ? 'صفحات السياسات، من نحن، الشحن والإرجاع' : 'Policy, Information, and Terms documents'}
          </p>
        </div>

        <div className="bg-white border border-neutral-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-neutral-500">
              {isRtl ? 'الصفحات المنشورة' : 'Published Live'}
            </span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-900 mt-2">
            {pages.filter(p => p.is_published).length}
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            {isRtl ? 'متاحة للزوار في تذييل الموقع' : 'Accessible in public footer navigation'}
          </p>
        </div>

        <div className="bg-white border border-neutral-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-neutral-500">
              {isRtl ? 'دعم اللغتين' : 'Dual Localization'}
            </span>
            <Globe className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-900 mt-2">
            AR / EN
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            {isRtl ? 'محتوى كامل بالإنجليزية والعربية' : 'Complete bilingual content parity'}
          </p>
        </div>
      </div>

      {/* Pages Table */}
      <div className="bg-white border border-neutral-200 shadow-xs">
        <div className="p-4 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder={isRtl ? 'البحث عن صفحة أو مسار...' : 'Search page title or slug...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-neutral-200 text-sm focus:border-neutral-900 outline-none"
            />
          </div>

          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold px-4 py-2.5 transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{isRtl ? 'إنشاء صفحة جديدة' : 'Add CMS Page'}</span>
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-neutral-400 text-sm">
            <div className="inline-block animate-spin w-5 h-5 border-2 border-neutral-900 border-t-transparent mb-2" />
            <p>{isRtl ? 'جاري تحميل الصفحات...' : 'Loading store pages...'}</p>
          </div>
        ) : filteredPages.length === 0 ? (
          <div className="p-12 text-center text-neutral-500 text-sm">
            <FileText className="w-10 h-10 mx-auto text-neutral-300 mb-2" />
            <p>{isRtl ? 'لا توجد صفحات تطابق البحث' : 'No store pages found'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-neutral-700">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-xs uppercase text-neutral-500 font-medium">
                <tr>
                  <th className="px-5 py-3.5">{isRtl ? 'عنوان الصفحة' : 'Page Title'}</th>
                  <th className="px-5 py-3.5">{isRtl ? 'المسار (Slug)' : 'URL Slug'}</th>
                  <th className="px-5 py-3.5">{isRtl ? 'آخر تعديل' : 'Last Updated'}</th>
                  <th className="px-5 py-3.5">{isRtl ? 'الحالة' : 'Status'}</th>
                  <th className="px-5 py-3.5 text-right">{isRtl ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredPages.map((page) => (
                  <tr key={page.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-neutral-900">
                        {page.title_en}
                      </div>
                      <div className="text-xs text-neutral-500 font-arabic mt-0.5" dir="rtl">
                        {page.title_ar}
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs bg-neutral-100 text-neutral-800 px-2.5 py-1 border border-neutral-200">
                        /{page.slug}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-xs text-neutral-500">
                      {new Date(page.updated_at || page.created_at).toLocaleDateString()}
                    </td>

                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => handleTogglePublish(page)}
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 cursor-pointer transition-colors ${
                          page.is_published 
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100' 
                            : 'bg-neutral-100 text-neutral-600 border border-neutral-300 hover:bg-neutral-200'
                        }`}
                      >
                        {page.is_published ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            <span>{isRtl ? 'منشور' : 'Published'}</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-neutral-400" />
                            <span>{isRtl ? 'مسودة' : 'Draft'}</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setPreviewPage(page)}
                          className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 cursor-pointer"
                          title="Preview Page"
                        >
                          <BookOpen className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenModal(page)}
                          className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 cursor-pointer"
                          title="Edit Page"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePage(page.id, page.title_en)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                          title="Delete Page"
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
        )}
      </div>

      {/* Add / Edit Page Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="bg-white border border-neutral-300 max-w-2xl w-full p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-neutral-900 pb-3 border-b border-neutral-200">
              {editingPage 
                ? (isRtl ? `تعديل الصفحة: ${editingPage.title_en}` : `Edit Page: ${editingPage.title_en}`)
                : (isRtl ? 'إنشاء صفحة معلومات جديدة' : 'Create New CMS Page')}
            </h3>

            <form onSubmit={handleSavePage} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">
                  {isRtl ? 'مسار الرابط (Slug)' : 'URL Slug (Identifier)'}
                </label>
                <div className="flex items-center">
                  <span className="bg-neutral-100 border border-r-0 border-neutral-300 px-3 py-2 text-xs font-mono text-neutral-500">
                    /page/
                  </span>
                  <input
                    type="text"
                    required
                    value={formData.slug || ''}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="privacy-policy"
                    className="flex-1 px-3 py-2 border border-neutral-300 text-sm font-mono focus:border-neutral-900 outline-none"
                  />
                </div>
              </div>

              {/* Language Tabs for Title and Content */}
              <div className="border-b border-neutral-200 flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveLangTab('en')}
                  className={`px-4 py-2 text-xs font-semibold border-b-2 cursor-pointer transition-colors ${
                    activeLangTab === 'en'
                      ? 'border-neutral-900 text-neutral-900'
                      : 'border-transparent text-neutral-500 hover:text-neutral-700'
                  }`}
                >
                  English Content
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLangTab('ar')}
                  className={`px-4 py-2 text-xs font-semibold border-b-2 cursor-pointer transition-colors ${
                    activeLangTab === 'ar'
                      ? 'border-neutral-900 text-neutral-900'
                      : 'border-transparent text-neutral-500 hover:text-neutral-700'
                  }`}
                >
                  المحتوى بالعربية (Arabic)
                </button>
              </div>

              {activeLangTab === 'en' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">
                      Page Title (English)
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title_en || ''}
                      onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                      placeholder="e.g. Terms of Service"
                      className="w-full px-3 py-2 border border-neutral-300 text-sm focus:border-neutral-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">
                      Body Content (English)
                    </label>
                    <textarea
                      rows={8}
                      value={formData.content_en || ''}
                      onChange={(e) => setFormData({ ...formData, content_en: e.target.value })}
                      placeholder="Write comprehensive terms, policies, or store background..."
                      className="w-full px-3 py-2 border border-neutral-300 text-sm focus:border-neutral-900 outline-none font-mono text-xs leading-relaxed"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3" dir="rtl">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">
                      عنوان الصفحة (بالعربية)
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title_ar || ''}
                      onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                      placeholder="مثال: الشروط والأحكام"
                      className="w-full px-3 py-2 border border-neutral-300 text-sm focus:border-neutral-900 outline-none font-arabic"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">
                      نص ومحتوى الصفحة (بالعربية)
                    </label>
                    <textarea
                      rows={8}
                      value={formData.content_ar || ''}
                      onChange={(e) => setFormData({ ...formData, content_ar: e.target.value })}
                      placeholder="أدخل نص السياسة أو تفاصيل الشحن والإرجاع..."
                      className="w-full px-3 py-2 border border-neutral-300 text-sm focus:border-neutral-900 outline-none font-arabic text-xs leading-relaxed"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="pagePublished"
                  checked={formData.is_published ?? true}
                  onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                  className="w-4 h-4 accent-neutral-900 cursor-pointer"
                />
                <label htmlFor="pagePublished" className="text-xs font-medium text-neutral-800 cursor-pointer">
                  {isRtl ? 'نشر الصفحة وإتاحتها للزوار' : 'Publish page to live storefront footer'}
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
                  {editingPage ? (isRtl ? 'حفظ التعديلات' : 'Save Changes') : (isRtl ? 'نشر الصفحة' : 'Publish Page')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reader / Live Preview Modal */}
      {previewPage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="bg-white border border-neutral-300 max-w-2xl w-full p-6 shadow-xl relative max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <div>
                <span className="text-xs font-mono text-neutral-400">/{previewPage.slug}</span>
                <h3 className="text-lg font-bold text-neutral-900">
                  {isRtl ? previewPage.title_ar : previewPage.title_en}
                </h3>
              </div>
              <button
                onClick={() => setPreviewPage(null)}
                className="text-neutral-400 hover:text-neutral-900 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">
              {isRtl ? previewPage.content_ar : previewPage.content_en}
            </div>

            <div className="pt-3 border-t border-neutral-200 flex justify-end">
              <button
                onClick={() => setPreviewPage(null)}
                className="px-4 py-2 bg-neutral-900 text-white text-xs font-medium cursor-pointer"
              >
                {isRtl ? 'إغلاق المعاينة' : 'Close Preview'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
