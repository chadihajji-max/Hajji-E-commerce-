import React, { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, ShieldCheck, Sparkles, ExternalLink, ShoppingBag, Eye, Truck, Award } from 'lucide-react';
import { Product } from '../../types';
import { StorageService } from '../../services/storage';
import { useLanguage } from '../../context/LanguageContext';
import { useRouter } from '../../context/RouterContext';
import { useCart } from '../../context/CartContext';
import { createAffiliateClickRecord } from '../../services/sheinAffiliate';
import { QuickViewModal } from '../../components/common/QuickViewModal';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { useToast } from '../../context/ToastContext';

export const StoreHome: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuickProduct, setSelectedQuickProduct] = useState<Product | null>(null);

  const { t, language, isRtl } = useLanguage();
  const { navigate } = useRouter();
  const { addItem } = useCart();
  const { showToast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await StorageService.getProducts();
      setProducts(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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

  const featuredItems = products.filter(p => p.is_featured).slice(0, 4);
  const sheinDeals = products.filter(p => p.is_shein_affiliate).slice(0, 3);

  return (
    <div className="space-y-16 pb-20">
      {/* 1. Architectural Hero Banner */}
      <section className="relative overflow-hidden bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Column: Typography & CTAs */}
            <div className="lg:col-span-6 space-y-6">
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 uppercase tracking-widest">
                <span>{t('heroKicker')}</span>
                <span>·</span>
                <span>USD ($)</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-neutral-900 tracking-tight leading-[1.15]" style={{ textWrap: 'balance' }}>
                {t('heroTitle')}
              </h1>

              <p className="text-sm sm:text-base text-neutral-600 leading-relaxed max-w-xl">
                {t('heroSubtitle')}
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => navigate('catalog')}
                  className="px-6 py-3 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer shadow-sm hover:translate-y-[-1px]"
                >
                  <span>{t('shopCollection')}</span>
                  {isRtl ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={() => navigate('shein-deals')}
                  className="px-6 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors cursor-pointer border border-neutral-200"
                >
                  <Sparkles className="w-3.5 h-3.5 text-neutral-700" />
                  <span>{t('exploreShein')}</span>
                </button>
              </div>

              {/* Sub-strip Trust Metrics */}
              <div className="pt-6 border-t border-neutral-100 flex items-center gap-6 text-xs text-neutral-500">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-neutral-800" />
                  <span>Authenticated Quality</span>
                </div>
                <span>·</span>
                <div className="flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-neutral-800" />
                  <span>Worldwide Dispatch</span>
                </div>
              </div>
            </div>

            {/* Right Column: High-Fidelity Campaign Hero Image */}
            <div className="lg:col-span-6">
              <div className="relative aspect-[16/10] sm:aspect-[16/9] lg:aspect-[4/3] rounded-2xl overflow-hidden shadow-xl border border-neutral-200/80 bg-neutral-100">
                <img
                  src="/src/assets/images/store_hero_curated_1794492838701.jpg"
                  alt="Aura Commerce Editorial Collection"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/60 via-transparent to-transparent flex items-end p-6">
                  <div className="text-white">
                    <p className="text-xs uppercase tracking-widest text-neutral-200 font-medium">AURA LOOKBOOK</p>
                    <p className="text-sm font-semibold">Effortless Tailoring & Sustainable Silhouettes</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. Value Propositions / Proof Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white border border-neutral-200 rounded-xl flex items-start gap-4">
            <div className="p-2.5 rounded-lg bg-neutral-100 text-neutral-900 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wide">
                {t('featureQualityTitle')}
              </h3>
              <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                {t('featureQualityDesc')}
              </p>
            </div>
          </div>

          <div className="p-6 bg-white border border-neutral-200 rounded-xl flex items-start gap-4">
            <div className="p-2.5 rounded-lg bg-neutral-100 text-neutral-900 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wide">
                {t('featureShippingTitle')}
              </h3>
              <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                {t('featureShippingDesc')}
              </p>
            </div>
          </div>

          <div className="p-6 bg-white border border-neutral-200 rounded-xl flex items-start gap-4">
            <div className="p-2.5 rounded-lg bg-neutral-100 text-neutral-900 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wide">
                {t('featureAffiliateTitle')}
              </h3>
              <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                {t('featureAffiliateDesc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Featured Curated Collection */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-neutral-200 pb-4">
          <div>
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1">
              {language === 'ar' ? 'تشكيلة مختارة' : 'Curated Selection'}
            </span>
            <h2 className="text-2xl font-bold text-neutral-900">
              {language === 'ar' ? 'أبرز المنتجات المختارة' : 'Featured Essentials'}
            </h2>
          </div>
          <button
            onClick={() => navigate('catalog')}
            className="text-xs font-semibold text-neutral-900 hover:text-neutral-600 flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <span>{t('allProducts')}</span>
            {isRtl ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        </div>

        {loading ? (
          <LoadingState variant="cards" count={3} />
        ) : error ? (
          <ErrorState message={error} onRetry={loadData} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredItems.map((product) => (
              <div
                key={product.id}
                onClick={() => navigate('product-detail', { id: product.id })}
                className="group bg-white rounded-xl border border-neutral-200 overflow-hidden flex flex-col justify-between hover:border-neutral-300 transition-all duration-200 cursor-pointer"
              >
                {/* Image Section */}
                <div className="relative aspect-[4/3] bg-neutral-100 overflow-hidden">
                  <img
                    src={product.image_url}
                    alt={product.title_en}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  {product.is_shein_affiliate && (
                    <div className="absolute top-2.5 left-2.5 bg-neutral-900/90 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow-xs">
                      SHEIN Partner
                    </div>
                  )}
                  {/* Quick Look Overlay Button */}
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

                {/* Info Section */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-medium block mb-1">
                      {product.sku}
                    </span>
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
                        title={t('buyOnShein')}
                      >
                        <span>SHEIN</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    ) : (
                      <button
                        onClick={(e) => handleQuickAdd(e, product)}
                        className="p-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-md transition-colors cursor-pointer"
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
      </section>

      {/* 4. SHEIN Affiliate Trending Deals Spotlight */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-neutral-900 text-white rounded-2xl p-8 lg:p-10 border border-neutral-800 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-800 text-neutral-300 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>OFFICIAL SHEIN AFFILIATE ENGINE</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {language === 'ar' ? 'أحدث صيحات شي إن بأسعار المصنع' : 'Verified SHEIN Trending Styles & Affiliate Deals'}
            </h2>

            <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed">
              {t('affiliateDisclosureNotice')}
            </p>

            <div className="pt-2">
              <button
                onClick={() => navigate('shein-deals')}
                className="px-5 py-2.5 bg-white text-neutral-900 text-xs font-bold rounded-lg hover:bg-neutral-200 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <span>{t('exploreShein')}</span>
                {isRtl ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </section>

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
