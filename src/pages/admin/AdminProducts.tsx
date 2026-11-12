import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  X, 
  Check, 
  Sparkles, 
  ExternalLink,
  CheckCircle,
  XCircle,
  Star,
  Layers,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';
import { Product, Category, ProductImage } from '../../types';
import { StorageService } from '../../services/storage';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { buildSheinAffiliateUrl } from '../../services/sheinAffiliate';

interface AdminProductsProps {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
}

const PRESET_PRODUCT_IMAGES = [
  { label: 'Outerwear Coat', url: '/src/assets/images/product_outerwear_1794492839551.jpg' },
  { label: 'SHEIN Emerald Dress', url: '/src/assets/images/product_shein_dress_1794492839873.jpg' },
  { label: 'Tech Smartwatch', url: '/src/assets/images/product_watch_tech_1794492841349.jpg' },
  { label: 'Home Ceramic Vase', url: '/src/assets/images/product_home_decor_1794492840631.jpg' },
  { label: 'Studio Neutral Co-ord', url: '/src/assets/images/store_hero_curated_1794492838701.jpg' },
];

export const AdminProducts: React.FC<AdminProductsProps> = ({ isModalOpen, setIsModalOpen }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering, Sorting & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc' | 'stock'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Bulk Selection
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const { t, isRtl } = useLanguage();
  const { showToast } = useToast();

  const [formData, setFormData] = useState<Partial<Product>>({
    sku: '',
    title_en: '',
    title_ar: '',
    description_en: '',
    description_ar: '',
    category_id: 'cat-fashion',
    price: 49.00,
    compare_at_price: 65.00,
    stock: 25,
    image_url: PRESET_PRODUCT_IMAGES[0].url,
    is_active: true,
    is_featured: false,
    is_shein_affiliate: false,
    shein_commission_rate: 15,
    shein_sub_id: 'admin_catalog',
    attributes: {
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Beige', 'Black', 'White'],
      material: 'Virgin Wool Blend',
    },
    seo_title: '',
    seo_description: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [p, c] = await Promise.all([
        StorageService.getProducts(),
        StorageService.getCategories(),
      ]);
      setProducts(p);
      setCategories(c);
    } catch (err) {
      console.error('Failed to load products in admin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openNewModal = () => {
    setEditingProduct(null);
    setFormData({
      id: 'prod-' + Date.now().toString(36),
      sku: `AUR-${Math.floor(100 + Math.random() * 900)}`,
      title_en: '',
      title_ar: '',
      description_en: '',
      description_ar: '',
      category_id: categories[0]?.id || 'cat-fashion',
      price: 49.00,
      compare_at_price: 65.00,
      stock: 25,
      image_url: PRESET_PRODUCT_IMAGES[1].url,
      is_active: true,
      is_featured: false,
      is_shein_affiliate: false,
      shein_commission_rate: 15,
      shein_sub_id: 'spring_admin',
      attributes: {
        sizes: ['S', 'M', 'L'],
        colors: ['Emerald', 'Black', 'Cream'],
        material: 'Premium Satin Blend',
      },
      seo_title: '',
      seo_description: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({ 
      ...product,
      attributes: product.attributes || { sizes: ['S', 'M', 'L'], colors: ['Default'], material: 'Standard' }
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(isRtl ? `هل أنت متأكد من حذف المنتج "${name}"؟` : `Delete product "${name}"?`)) {
      await StorageService.deleteProduct(id);
      showToast(isRtl ? 'تم حذف المنتج بنجاح' : 'Product deleted successfully', 'info');
      loadData();
    }
  };

  const handleToggleStatus = async (product: Product) => {
    const updated = { ...product, is_active: !product.is_active };
    await StorageService.saveProduct(updated);
    showToast(isRtl ? `تم تحديث حالة المنتج` : `Product set to ${updated.is_active ? 'Active' : 'Inactive'}`, 'success');
    loadData();
  };

  const handleToggleFeature = async (product: Product) => {
    const updated = { ...product, is_featured: !product.is_featured };
    await StorageService.saveProduct(updated);
    showToast(isRtl ? 'تم تحديث حالة المميز' : `Product featured status updated`, 'success');
    loadData();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title_en || !formData.price) {
      showToast(isRtl ? 'يرجى إدخال اسم المنتج والسعر' : 'Please provide product title and price', 'error');
      return;
    }

    let finalSheinUrl = formData.shein_affiliate_url;
    if (formData.is_shein_affiliate && (!finalSheinUrl || !finalSheinUrl.includes('aff_id'))) {
      finalSheinUrl = buildSheinAffiliateUrl({
        url: finalSheinUrl || 'https://shein.com',
        subId: formData.shein_sub_id || 'catalog'
      });
    }

    const payload: Product = {
      id: editingProduct?.id || formData.id || 'prod-' + Date.now().toString(36),
      sku: formData.sku || `AUR-${Math.floor(1000 + Math.random() * 9000)}`,
      title_en: formData.title_en || 'Untitled Product',
      title_ar: formData.title_ar || formData.title_en || 'منتج جديد',
      description_en: formData.description_en || '',
      description_ar: formData.description_ar || '',
      category_id: formData.category_id || 'cat-fashion',
      price: Number(formData.price) || 0,
      compare_at_price: formData.compare_at_price ? Number(formData.compare_at_price) : undefined,
      stock: Number(formData.stock) || 0,
      image_url: formData.image_url || PRESET_PRODUCT_IMAGES[0].url,
      is_active: formData.is_active ?? true,
      is_featured: formData.is_featured ?? false,
      is_shein_affiliate: formData.is_shein_affiliate ?? false,
      shein_product_id: formData.shein_product_id,
      shein_affiliate_url: finalSheinUrl,
      shein_commission_rate: Number(formData.shein_commission_rate) || 15,
      shein_sub_id: formData.shein_sub_id,
      attributes: formData.attributes,
      seo_title: formData.seo_title || formData.title_en,
      seo_description: formData.seo_description || formData.description_en,
      rating: editingProduct?.rating || 4.9,
      reviews_count: editingProduct?.reviews_count || 12,
      created_at: editingProduct?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await StorageService.saveProduct(payload);
    showToast(isRtl ? 'تم حفظ المنتج بنجاح' : 'Product saved successfully', 'success');
    setIsModalOpen(false);
    loadData();
  };

  // Bulk Actions
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedProductIds(filteredProducts.map(p => p.id));
    } else {
      setSelectedProductIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedProductIds.includes(id)) {
      setSelectedProductIds(selectedProductIds.filter(i => i !== id));
    } else {
      setSelectedProductIds([...selectedProductIds, id]);
    }
  };

  const handleBulkAction = async (action: 'enable' | 'disable' | 'delete') => {
    if (selectedProductIds.length === 0) return;
    if (action === 'delete') {
      if (!confirm(isRtl ? `هل أنت متأكد من حذف ${selectedProductIds.length} منتجات؟` : `Delete ${selectedProductIds.length} selected products?`)) return;
      for (const id of selectedProductIds) {
        await StorageService.deleteProduct(id);
      }
      showToast(isRtl ? 'تم حذف المنتجات المحددة' : 'Selected products deleted', 'success');
    } else {
      const targetActive = action === 'enable';
      for (const id of selectedProductIds) {
        const prod = products.find(p => p.id === id);
        if (prod) {
          await StorageService.saveProduct({ ...prod, is_active: targetActive });
        }
      }
      showToast(isRtl ? 'تم تحديث حالة المنتجات المحددة' : `Selected products status updated to ${targetActive ? 'Active' : 'Disabled'}`, 'success');
    }
    setSelectedProductIds([]);
    loadData();
  };

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (categoryFilter !== 'all' && p.category_id !== categoryFilter) return false;
      if (statusFilter === 'active' && !p.is_active) return false;
      if (statusFilter === 'disabled' && p.is_active) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return p.title_en.toLowerCase().includes(q) || p.title_ar.includes(q) || p.sku.toLowerCase().includes(q);
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'stock') return b.stock - a.stock;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [products, categoryFilter, statusFilter, searchQuery, sortBy]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);

  return (
    <div className="space-y-6">
      {/* Top Filter & Search Bar */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder={isRtl ? 'البحث عن منتج، SKU...' : 'Search title or SKU...'}
                className="w-full bg-neutral-50 border border-neutral-300 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-hidden focus:border-neutral-900"
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              className="bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:border-neutral-900 text-neutral-700"
            >
              <option value="all">{isRtl ? 'جميع الأقسام' : 'All Categories'}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {isRtl ? c.name_ar : c.name_en}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as any); setCurrentPage(1); }}
              className="bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:border-neutral-900 text-neutral-700"
            >
              <option value="all">{isRtl ? 'جميع الحالات' : 'All Status'}</option>
              <option value="active">{isRtl ? 'نشط فقط' : 'Active Only'}</option>
              <option value="disabled">{isRtl ? 'معطل فقط' : 'Disabled Only'}</option>
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:border-neutral-900 text-neutral-700"
            >
              <option value="newest">{isRtl ? 'الأحدث أولاً' : 'Newest First'}</option>
              <option value="price-asc">{isRtl ? 'السعر: من الأقل للأعلى' : 'Price: Low to High'}</option>
              <option value="price-desc">{isRtl ? 'السعر: من الأعلى للأقل' : 'Price: High to Low'}</option>
              <option value="stock">{isRtl ? 'المخزون المتوفر' : 'Stock Level'}</option>
            </select>
          </div>

          <button
            onClick={openNewModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>{isRtl ? 'إضافة منتج جديد' : 'Add New Product'}</span>
          </button>
        </div>

        {/* Bulk Actions Bar */}
        {selectedProductIds.length > 0 && (
          <div className="flex items-center justify-between bg-neutral-900 text-white p-2.5 rounded-lg text-xs animate-in fade-in">
            <span className="font-medium px-2">
              {isRtl ? `تم تحديد ${selectedProductIds.length} منتج` : `${selectedProductIds.length} products selected`}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkAction('enable')}
                className="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 rounded text-xs font-semibold cursor-pointer"
              >
                {isRtl ? 'تفعيل المحدد' : 'Enable Selected'}
              </button>
              <button
                onClick={() => handleBulkAction('disable')}
                className="px-3 py-1 bg-neutral-700 hover:bg-neutral-600 rounded text-xs font-semibold cursor-pointer"
              >
                {isRtl ? 'تعطيل المحدد' : 'Disable Selected'}
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="px-3 py-1 bg-rose-700 hover:bg-rose-600 rounded text-xs font-semibold cursor-pointer"
              >
                {isRtl ? 'حذف المحدد' : 'Delete Selected'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Products Table */}
      {loading ? (
        <LoadingState variant="table" count={5} />
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          title={isRtl ? 'لا توجد منتجات مطابقة' : 'No products found'}
          description={isRtl ? 'جرب تغيير فلاتر البحث أو أضف منتجاً جديداً.' : 'Try adjusting your search criteria or add a new catalog item.'}
          actionLabel={isRtl ? 'إضافة منتج' : 'Add Product'}
          onAction={openNewModal}
        />
      ) : (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-700">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider text-[10px] font-semibold">
                <tr>
                  <th className="px-4 py-3.5 w-10">
                    <input
                      type="checkbox"
                      checked={selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0}
                      onChange={handleSelectAll}
                      className="rounded accent-neutral-900 cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-3.5">{isRtl ? 'المنتج' : 'Product'}</th>
                  <th className="px-4 py-3.5">{isRtl ? 'SKU' : 'SKU'}</th>
                  <th className="px-4 py-3.5">{isRtl ? 'القسم' : 'Category'}</th>
                  <th className="px-4 py-3.5">{isRtl ? 'السعر' : 'Price / Sale'}</th>
                  <th className="px-4 py-3.5">{isRtl ? 'المخزون' : 'Stock'}</th>
                  <th className="px-4 py-3.5">{isRtl ? 'مميز' : 'Featured'}</th>
                  <th className="px-4 py-3.5">{isRtl ? 'الحالة' : 'Status'}</th>
                  <th className="px-4 py-3.5 text-right">{isRtl ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {paginatedProducts.map((p) => {
                  const cat = categories.find(c => c.id === p.category_id);
                  const isSelected = selectedProductIds.includes(p.id);
                  return (
                    <tr key={p.id} className={`hover:bg-neutral-50/80 transition-colors ${isSelected ? 'bg-neutral-100/80' : ''}`}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(p.id)}
                          className="rounded accent-neutral-900 cursor-pointer"
                        />
                      </td>

                      <td className="px-4 py-3">
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

                      <td className="px-4 py-3 font-mono text-[11px] text-neutral-600">
                        {p.sku}
                      </td>

                      <td className="px-4 py-3">
                        <span className="bg-neutral-100 text-neutral-800 px-2 py-0.5 rounded text-[11px]">
                          {cat ? (isRtl ? cat.name_ar : cat.name_en) : p.category_id}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-bold text-neutral-900">${p.price.toFixed(2)}</div>
                        {p.compare_at_price && p.compare_at_price > p.price && (
                          <div className="text-[10px] text-neutral-400 line-through">${p.compare_at_price.toFixed(2)}</div>
                        )}
                      </td>

                      <td className="px-4 py-3 font-semibold">
                        <span className={p.stock < 10 ? 'text-rose-600 font-bold' : 'text-neutral-800'}>
                          {p.stock} {isRtl ? 'قطعة' : 'units'}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleFeature(p)}
                          className={`p-1.5 rounded-md transition-colors cursor-pointer ${p.is_featured ? 'text-amber-500 bg-amber-50' : 'text-neutral-300 hover:text-neutral-500'}`}
                          title="Toggle Featured"
                        >
                          <Star className="w-4 h-4 fill-current" />
                        </button>
                      </td>

                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleStatus(p)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer transition-colors ${
                            p.is_active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-neutral-100 text-neutral-600 border border-neutral-300 hover:bg-neutral-200'
                          }`}
                        >
                          {p.is_active ? (
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

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id, p.title_en)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                            title="Delete Product"
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

          {/* Pagination Controls */}
          <div className="p-4 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-600 bg-neutral-50/50">
            <div>
              {isRtl 
                ? `عرض ${(currentPage - 1) * itemsPerPage + 1} إلى ${Math.min(currentPage * itemsPerPage, filteredProducts.length)} من أصل ${filteredProducts.length} منتج`
                : `Showing ${(currentPage - 1) * itemsPerPage + 1} to ${Math.min(currentPage * itemsPerPage, filteredProducts.length)} of ${filteredProducts.length} products`}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded border border-neutral-300 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-100 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 font-semibold text-neutral-900">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded border border-neutral-300 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-100 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-neutral-300 max-w-3xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
              <h3 className="text-base font-bold text-neutral-900">
                {editingProduct 
                  ? (isRtl ? `تعديل المنتج: ${editingProduct.title_en}` : `Edit Product: ${editingProduct.title_en}`)
                  : (isRtl ? 'إضافة منتج جديد للمتجر' : 'Add New Catalog Product')}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 pt-4 text-xs">
              {/* Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold uppercase text-neutral-700 mb-1">
                    {isRtl ? 'اسم المنتج (إنجليزي)' : 'Product Name (English)*'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title_en || ''}
                    onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                    placeholder="e.g. Minimalist Cashmere Sweater"
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 focus:outline-hidden focus:border-neutral-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase text-neutral-700 mb-1">
                    {isRtl ? 'اسم المنتج (عربي)' : 'Product Name (Arabic)'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title_ar || ''}
                    onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                    placeholder="مثال: كنزة كشمير عصرية"
                    dir="rtl"
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 focus:outline-hidden focus:border-neutral-900 font-arabic"
                  />
                </div>
              </div>

              {/* SKU & Category & Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold uppercase text-neutral-700 mb-1">
                    {isRtl ? 'رمز المنتج (SKU)' : 'SKU Code*'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sku || ''}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="AUR-KASH-01"
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 font-mono focus:outline-hidden focus:border-neutral-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase text-neutral-700 mb-1">
                    {isRtl ? 'القسم (Category)' : 'Department Category*'}
                  </label>
                  <select
                    value={formData.category_id || 'cat-fashion'}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 focus:outline-hidden focus:border-neutral-900"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {isRtl ? c.name_ar : c.name_en}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold uppercase text-neutral-700 mb-1">
                    {isRtl ? 'كمية المخزون' : 'Stock Quantity'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock ?? 25}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 focus:outline-hidden focus:border-neutral-900"
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold uppercase text-neutral-700 mb-1">
                    {isRtl ? 'السعر الأساسي ($ USD)*' : 'Regular Price ($ USD)*'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.price ?? 49}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 focus:outline-hidden focus:border-neutral-900 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase text-neutral-700 mb-1">
                    {isRtl ? 'سعر الخصم / المقارنة ($ USD)' : 'Compare at Price ($ USD - Sale)'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.compare_at_price ?? ''}
                    onChange={(e) => setFormData({ ...formData, compare_at_price: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="e.g. 75.00"
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 focus:outline-hidden focus:border-neutral-900"
                  />
                </div>
              </div>

              {/* Descriptions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold uppercase text-neutral-700 mb-1">
                    {isRtl ? 'الوصف (إنجليزي)' : 'Description (English)'}
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description_en || ''}
                    onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                    placeholder="Describe craftsmanship and materials..."
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 focus:outline-hidden focus:border-neutral-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase text-neutral-700 mb-1">
                    {isRtl ? 'الوصف (عربي)' : 'Description (Arabic)'}
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description_ar || ''}
                    onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                    placeholder="صف تفاصيل التصميم والخامات والمميزات..."
                    dir="rtl"
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 focus:outline-hidden focus:border-neutral-900 font-arabic"
                  />
                </div>
              </div>

              {/* Image URL & Preset Picker */}
              <div>
                <label className="block font-semibold uppercase text-neutral-700 mb-1">
                  {isRtl ? 'رابط الصورة الرئيسية' : 'Primary Product Image URL'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.image_url || ''}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="/src/assets/images/..."
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 font-mono text-[11px] focus:outline-hidden focus:border-neutral-900 mb-2"
                />

                <div className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg space-y-1.5">
                  <span className="text-[11px] font-semibold text-neutral-500 uppercase">
                    {isRtl ? 'أو اختر من صور الاستوديو الجاهزة:' : 'Or pick studio asset:'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_PRODUCT_IMAGES.map((img, idx) => (
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

              {/* Attributes & Variations */}
              <div className="border border-neutral-200 p-3 rounded-lg bg-neutral-50/60 space-y-3">
                <span className="font-bold text-neutral-900 block text-xs uppercase tracking-wider">
                  {isRtl ? 'خصائص وخيارات المنتج (Attributes & Variations)' : 'Product Attributes & Variations'}
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-neutral-600 mb-1 font-medium">{isRtl ? 'المقاسات (مفصولة بفواصل)' : 'Sizes (comma separated)'}</label>
                    <input
                      type="text"
                      value={formData.attributes?.sizes?.join(', ') || 'S, M, L, XL'}
                      onChange={(e) => setFormData({
                        ...formData,
                        attributes: { ...formData.attributes, sizes: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }
                      })}
                      className="w-full bg-white border border-neutral-300 rounded px-2.5 py-1.5 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-neutral-600 mb-1 font-medium">{isRtl ? 'الألوان المتاحة' : 'Colors (comma separated)'}</label>
                    <input
                      type="text"
                      value={formData.attributes?.colors?.join(', ') || 'Beige, Black'}
                      onChange={(e) => setFormData({
                        ...formData,
                        attributes: { ...formData.attributes, colors: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }
                      })}
                      className="w-full bg-white border border-neutral-300 rounded px-2.5 py-1.5 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-neutral-600 mb-1 font-medium">{isRtl ? 'الخامة والمادة' : 'Material / Fabric'}</label>
                    <input
                      type="text"
                      value={formData.attributes?.material || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        attributes: { ...formData.attributes, material: e.target.value }
                      })}
                      placeholder="Virgin Wool Blend"
                      className="w-full bg-white border border-neutral-300 rounded px-2.5 py-1.5 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* SEO Title & Description */}
              <div className="border border-neutral-200 p-3 rounded-lg bg-neutral-50/60 space-y-3">
                <span className="font-bold text-neutral-900 block text-xs uppercase tracking-wider">
                  {isRtl ? 'تحسين محركات البحث (SEO)' : 'SEO Metadata'}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-neutral-600 mb-1 font-medium">{isRtl ? 'عنوان SEO' : 'SEO Title'}</label>
                    <input
                      type="text"
                      value={formData.seo_title || ''}
                      onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                      placeholder="Custom browser title tag"
                      className="w-full bg-white border border-neutral-300 rounded px-2.5 py-1.5 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-neutral-600 mb-1 font-medium">{isRtl ? 'وصف SEO' : 'SEO Meta Description'}</label>
                    <input
                      type="text"
                      value={formData.seo_description || ''}
                      onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
                      placeholder="Search engine snippet description..."
                      className="w-full bg-white border border-neutral-300 rounded px-2.5 py-1.5 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6 pt-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="prodActive"
                    checked={formData.is_active ?? true}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 rounded-sm accent-neutral-900 cursor-pointer"
                  />
                  <label htmlFor="prodActive" className="font-medium text-neutral-800 cursor-pointer">
                    {isRtl ? 'نشط في المتجر' : 'Active on Storefront'}
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="prodFeatured"
                    checked={formData.is_featured ?? false}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="w-4 h-4 rounded-sm accent-neutral-900 cursor-pointer"
                  />
                  <label htmlFor="prodFeatured" className="font-medium text-neutral-800 cursor-pointer">
                    {isRtl ? 'منتج مميز (Featured)' : 'Featured Essential'}
                  </label>
                </div>
              </div>

              {/* Footer Buttons */}
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
                  {editingProduct ? (isRtl ? 'حفظ التعديلات' : 'Save Changes') : (isRtl ? 'إنشاء المنتج' : 'Save Product')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
