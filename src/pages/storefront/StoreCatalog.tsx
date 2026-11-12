import React, { useState, useEffect, useMemo } from 'react';
import { Search, SlidersHorizontal, ExternalLink, ShoppingBag, Eye, RotateCcw } from 'lucide-react';
import { Product, Category } from '../../types';
import { StorageService } from '../../services/storage';
import { useLanguage } from '../../context/LanguageContext';
import { useRouter } from '../../context/RouterContext';
import { useCart } from '../../context/CartContext';
import { createAffiliateClickRecord } from '../../services/sheinAffiliate';
import { QuickViewModal } from '../../components/common/QuickViewModal';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { useToast } from '../../context/ToastContext';

export const StoreCatalog: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { params, navigate } = useRouter();
  const { t, language } = useLanguage();
  const { addItem } = useCart();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(params.category || 'all');
  const [channelFilter, setChannelFilter] = useState<'all' | 'direct' | 'shein'>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'newest'>('featured');
  const [maxPrice, setMaxPrice] = useState<number>(350);
  const [selectedQuickProduct, setSelectedQuickProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (params.category) {
      setSelectedCategory(params.category);
    }
  }, [params.category]);

  const loadCatalog = async () => {
    try {
      setLoading(true);
      setError(null);
      const [prods, cats] = await Promise.all([
        StorageService.getProducts(),
        StorageService.getCategories(),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (selectedCategory !== 'all' && p.category_id !== selectedCategory) {
        return false;
      }
      // Channel filter (SHEIN vs Direct)
      if (channelFilter === 'shein' && !p.is_shein_affiliate) {
        return false;
      }
      if (channelFilter === 'direct' && p.is_shein_affiliate) {
        return false;
      }
      // Max price
      if (p.price > maxPrice) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitleEn = p.title_en.toLowerCase().includes(q);
        const matchTitleAr = p.title_ar.toLowerCase().includes(q);
        const matchSku = p.sku.toLowerCase().includes(q);
        return matchTitleEn || matchTitleAr || matchSku;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
    });
  }, [products, selectedCategory, channelFilter, maxPrice, searchQuery, sortBy]);

  const handleAffiliateClick = async (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    const log = createAffiliateClickRecord(product);
    await StorageService.recordAffiliateClick(log);
    showToast(t('trackClickSuccess'), 'info');
    if (product.shein_affiliate_url) {
      window.open(product.shein_affiliate_url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleQuickAdd = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    addItem(product, 1);
  };

  const resetFilters = () => {
    setSelectedCategory('all');
    setChannelFilter('all');
    setMaxPrice(350);
    setSearchQuery('');
    setSortBy('featured');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight">
            {t('catalog')}
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            {language === 'ar'
              ? `عرض ${filteredProducts.length} من أصل ${products.length} منتج متوفر بالدولار الأمريكي (USD)`
              : `Showing ${filteredProducts.length} of ${products.length} curated essentials and SHEIN trending items in USD ($)`}
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full bg-white border border-neutral-200 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-hidden focus:border-neutral-900 transition-colors"
          />
        </div>
      </div>

      {/* Filter Toolbar Controls */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 flex flex-wrap items-center justify-between gap-4">
        
        {/* Category Segmented Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 max-w-full">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            {t('allCategories')}
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                selectedCategory === c.id
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              {language === 'ar' ? c.name_ar : c.name_en}
            </button>
          ))}
        </div>

        {/* Source Channels & Sort */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Source Filter */}
          <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg text-xs">
            <button
              onClick={() => setChannelFilter('all')}
              className={`px-2.5 py-1 font-medium rounded transition-colors cursor-pointer ${
                channelFilter === 'all' ? 'bg-white text-neutral-900 shadow-2xs font-semibold' : 'text-neutral-600'
              }`}
            >
              {t('allProducts')}
            </button>
            <button
              onClick={() => setChannelFilter('direct')}
              className={`px-2.5 py-1 font-medium rounded transition-colors cursor-pointer ${
                channelFilter === 'direct' ? 'bg-white text-neutral-900 shadow-2xs font-semibold' : 'text-neutral-600'
              }`}
            >
              {t('directDeliveryOnly')}
            </button>
            <button
              onClick={() => setChannelFilter('shein')}
              className={`px-2.5 py-1 font-medium rounded transition-colors cursor-pointer ${
                channelFilter === 'shein' ? 'bg-white text-neutral-900 shadow-2xs font-semibold' : 'text-neutral-600'
              }`}
            >
              SHEIN
            </button>
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs bg-white border border-neutral-200 rounded-lg px-3 py-1.5 text-neutral-700 focus:outline-hidden focus:border-neutral-900 cursor-pointer"
          >
            <option value="featured">{t('sortFeatured')}</option>
            <option value="price-asc">{t('sortPriceAsc')}</option>
            <option value="price-desc">{t('sortPriceDesc')}</option>
            <option value="newest">{t('sortNewest')}</option>
          </select>

          {/* Reset Filters button */}
          {(selectedCategory !== 'all' || channelFilter !== 'all' || searchQuery) && (
            <button
              onClick={resetFilters}
              className="p-1.5 text-neutral-400 hover:text-neutral-900 transition-colors cursor-pointer"
              title={t('clearFilters')}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Product Grid */}
      {loading ? (
        <LoadingState variant="cards" count={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={loadCatalog} />
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          title={t('noResultsFound')}
          description={language === 'ar' ? 'لا توجد منتجات تطابق الفلاتر المحددة حالياً' : 'No items match your active filters and search query.'}
          actionLabel={t('clearFilters')}
          onAction={resetFilters}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => navigate('product-detail', { id: product.id })}
              className="group bg-white rounded-xl border border-neutral-200 overflow-hidden flex flex-col justify-between hover:border-neutral-300 transition-all duration-200 cursor-pointer"
            >
              {/* Product Card Image */}
              <div className="relative aspect-[4/3] bg-neutral-100 overflow-hidden">
                <img
                  src={product.image_url}
                  alt={product.title_en}
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
                {product.is_shein_affiliate && (
                  <div className="absolute top-2.5 left-2.5 bg-neutral-900/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow-2xs">
                    SHEIN Partner
                  </div>
                )}
                {/* Quick View Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedQuickProduct(product);
                  }}
                  className="absolute bottom-2.5 right-2.5 p-2 bg-white/90 hover:bg-white text-neutral-900 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title={t('quickView')}
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Product Info */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between text-[11px] text-neutral-400 font-medium mb-1">
                    <span>{product.sku}</span>
                    <span className={product.stock > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                      {product.stock > 0 ? t('inStock') : t('outOfStock')}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-neutral-900 line-clamp-2 leading-snug group-hover:text-neutral-700">
                    {language === 'ar' ? product.title_ar : product.title_en}
                  </h3>
                </div>

                <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-bold font-mono tabular-nums text-neutral-900">
                      ${product.price.toFixed(2)}
                    </span>
                    {product.compare_at_price && (
                      <span className="text-[11px] font-mono tabular-nums text-neutral-400 line-through">
                        ${product.compare_at_price.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {product.is_shein_affiliate ? (
                    <button
                      onClick={(e) => handleAffiliateClick(e, product)}
                      className="px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-900 hover:text-white text-neutral-800 text-[11px] font-semibold rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>SHEIN</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  ) : (
                    <button
                      onClick={(e) => handleQuickAdd(e, product)}
                      disabled={product.stock <= 0}
                      className="p-1.5 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-200 text-white rounded-md transition-colors cursor-pointer"
                      title={t('addToBag')}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick View Modal */}
      <QuickViewModal
        product={selectedQuickProduct}
        onClose={() => setSelectedQuickProduct(null)}
        onViewFullDetails={(id) => {
          setSelectedQuickProduct(null);
          navigate('product-detail', { id });
        }}
      />
    </div>
  );
};
