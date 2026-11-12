import React, { useState, useEffect } from 'react';
import { FolderTree, ArrowRight, ArrowLeft, Sparkles, Package } from 'lucide-react';
import { Category, Product } from '../../types';
import { StorageService } from '../../services/storage';
import { useLanguage } from '../../context/LanguageContext';
import { useRouter } from '../../context/RouterContext';
import { LoadingState } from '../../components/common/LoadingState';

export const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const { t, language, isRtl } = useLanguage();
  const { navigate, params } = useRouter();
  const selectedSlug = params.slug || params.id;

  useEffect(() => {
    const loadCategoriesData = async () => {
      try {
        setLoading(true);
        const [cats, prods] = await Promise.all([
          StorageService.getCategories(),
          StorageService.getProducts(),
        ]);
        setCategories(cats);
        setProducts(prods);
      } catch (err) {
        console.error('Failed to load categories page:', err);
      } finally {
        setLoading(false);
      }
    };
    loadCategoriesData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <LoadingState variant="cards" count={4} />
      </div>
    );
  }

  // If a specific category is selected, render category detail view
  if (selectedSlug) {
    const activeCategory = categories.find(c => c.id === selectedSlug || c.slug === selectedSlug);
    const categoryProducts = products.filter(p => p.category_id === activeCategory?.id);

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        <div className="bg-neutral-900 text-white rounded-2xl p-8 sm:p-12 relative overflow-hidden">
          <div className="relative z-10 space-y-3 max-w-2xl">
            <button
              onClick={() => navigate('categories')}
              className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 cursor-pointer mb-2"
            >
              {isRtl ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
              <span>{isRtl ? 'العودة لكافة الأقسام' : 'Back to All Categories'}</span>
            </button>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {activeCategory ? (isRtl ? activeCategory.name_ar : activeCategory.name_en) : 'Department Category'}
            </h1>
            <p className="text-neutral-400 text-xs sm:text-sm">
              {categoryProducts.length} {isRtl ? 'منتج متوفر في هذا القسم' : 'curated essentials available in this department'}
            </p>
          </div>
        </div>

        {categoryProducts.length === 0 ? (
          <div className="text-center py-16 bg-white border border-neutral-200 rounded-2xl p-8">
            <Package className="w-12 h-12 mx-auto text-neutral-300 mb-3" />
            <h3 className="text-sm font-bold text-neutral-900">
              {isRtl ? 'لا توجد منتجات في هذا القسم حالياً' : 'No products found in this category'}
            </h3>
            <button
              onClick={() => navigate('catalog')}
              className="mt-4 px-5 py-2.5 bg-neutral-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
            >
              {isRtl ? 'تصفح كافة المنتجات' : 'Browse All Products'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categoryProducts.map((p) => (
              <div
                key={p.id}
                onClick={() => navigate('product-detail', { id: p.id })}
                className="bg-white rounded-xl border border-neutral-200 overflow-hidden flex flex-col justify-between hover:border-neutral-400 transition-all cursor-pointer group shadow-2xs"
              >
                <div className="relative aspect-square bg-neutral-100 overflow-hidden">
                  <img
                    src={p.image_url}
                    alt={p.title_en}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  {p.is_shein_affiliate && (
                    <span className="absolute top-2.5 left-2.5 bg-amber-500 text-neutral-950 font-bold text-[10px] px-2 py-0.5 rounded shadow-xs">
                      SHEIN Affiliate
                    </span>
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <h3 className="text-xs font-bold text-neutral-900 line-clamp-1">
                    {isRtl ? p.title_ar : p.title_en}
                  </h3>
                  <div className="font-mono text-sm font-extrabold text-neutral-900">
                    ${p.price.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Categories Index Grid View
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="border-b border-neutral-200 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
            {isRtl ? 'أقسام وتصنيفات المتجر' : 'Store Departments & Taxonomy'}
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            {isRtl ? 'استكشف كافة أقسام الأزياء والمنزل والتقنية بعناية فائقة' : 'Explore curated apparel, home interiors, and minimalist tech collections'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map((cat) => {
          const count = products.filter(p => p.category_id === cat.id).length;
          return (
            <div
              key={cat.id}
              onClick={() => navigate('category-detail', { id: cat.id })}
              className="group bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-2xs hover:border-neutral-900 transition-all duration-300 cursor-pointer flex flex-col justify-between"
            >
              <div className="relative aspect-[16/10] bg-neutral-100 overflow-hidden">
                <img
                  src={cat.image_url || '/src/assets/images/product_outerwear_1794492839551.jpg'}
                  alt={cat.name_en}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/70 via-transparent to-transparent flex items-end p-5">
                  <span className="text-[10px] font-mono uppercase bg-white/20 backdrop-blur-xs text-white px-2.5 py-0.5 rounded border border-white/20">
                    {count} {isRtl ? 'منتج' : 'Items'}
                  </span>
                </div>
              </div>

              <div className="p-5 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 group-hover:text-neutral-700">
                    {isRtl ? cat.name_ar : cat.name_en}
                  </h3>
                  <span className="text-xs text-neutral-400 font-mono mt-0.5 block">/{cat.slug}</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-neutral-100 group-hover:bg-neutral-900 group-hover:text-white flex items-center justify-center transition-colors">
                  {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
