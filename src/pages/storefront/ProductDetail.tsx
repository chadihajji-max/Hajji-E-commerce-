import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  ExternalLink, 
  ShoppingBag, 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  Check, 
  Star 
} from 'lucide-react';
import { Product } from '../../types';
import { StorageService } from '../../services/storage';
import { useLanguage } from '../../context/LanguageContext';
import { useRouter } from '../../context/RouterContext';
import { useCart } from '../../context/CartContext';
import { createAffiliateClickRecord } from '../../services/sheinAffiliate';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { useToast } from '../../context/ToastContext';

export const ProductDetail: React.FC = () => {
  const { params, navigate } = useRouter();
  const { t, language, isRtl } = useLanguage();
  const { addItem } = useCart();
  const { showToast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState('M');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!params.id) {
        navigate('catalog');
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const data = await StorageService.getProductById(params.id);
        if (!data) {
          setError('Product not found or currently unavailable.');
        } else {
          setProduct(data);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [params.id, navigate]);

  const handleAddToBag = () => {
    if (!product) return;
    addItem(product, quantity, selectedSize);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleAffiliateClick = async () => {
    if (!product) return;
    const log = createAffiliateClickRecord(product);
    await StorageService.recordAffiliateClick(log);
    showToast(t('trackClickSuccess'), 'info');
    if (product.shein_affiliate_url) {
      window.open(product.shein_affiliate_url, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <LoadingState />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <ErrorState message={error || 'Product not found'} onRetry={() => navigate('catalog')} />
      </div>
    );
  }

  const sizes = ['XS', 'S', 'M', 'L', 'XL'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Breadcrumb Back Button */}
      <button
        onClick={() => navigate('catalog')}
        className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer"
      >
        {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
        <span>{language === 'ar' ? 'العودة إلى المتجر' : 'Back to Catalog'}</span>
      </button>

      {/* Main Contiguous Purchase Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Gallery Column */}
        <div className="lg:col-span-7">
          <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200 shadow-xs">
            <img
              src={product.image_url}
              alt={product.title_en}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="mt-4 p-4 rounded-xl border border-neutral-100 bg-neutral-50/50 flex items-center justify-between text-xs text-neutral-500">
            <span>High-Fidelity Studio Asset</span>
            <span>Natural Diffused Lighting</span>
            <span>8K Commercial Render</span>
          </div>
        </div>

        {/* Right Sticky Purchase Module */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span className="font-mono">SKU: {product.sku}</span>
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-neutral-900">{product.rating}</span>
                <span className="text-neutral-400">({product.reviews_count} {t('reviews')})</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 leading-tight">
              {language === 'ar' ? product.title_ar : product.title_en}
            </h1>

            {/* Price Row */}
            <div className="flex items-baseline gap-3 pt-1">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-neutral-900">
                ${product.price.toFixed(2)}
              </span>
              {product.compare_at_price && (
                <span className="text-sm font-mono tabular-nums text-neutral-400 line-through">
                  ${product.compare_at_price.toFixed(2)}
                </span>
              )}
            </div>

            {/* Stock status pill */}
            <div className="flex items-center gap-2 pt-1 text-xs">
              <span className={`w-2 h-2 rounded-full ${product.stock > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <span className={product.stock > 0 ? 'text-emerald-700 font-medium' : 'text-rose-700'}>
                {product.stock > 0 ? `${t('inStock')} (${product.stock} units)` : t('outOfStock')}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="pt-2 text-xs text-neutral-600 leading-relaxed space-y-2 border-t border-neutral-100">
            <p>{language === 'ar' ? product.description_ar : product.description_en}</p>
          </div>

          {/* Size Selection */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-neutral-900">Select Size:</span>
              <span className="text-neutral-500 uppercase">{selectedSize}</span>
            </div>
            <div className="flex gap-2">
              {sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSize(s)}
                  className={`w-10 h-10 rounded-lg border text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer ${
                    selectedSize === s
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-neutral-200 text-neutral-700 hover:border-neutral-400'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity Selector for direct purchases */}
          {!product.is_shein_affiliate && (
            <div className="space-y-2 pt-2">
              <span className="text-xs font-semibold text-neutral-900 block">Quantity:</span>
              <div className="inline-flex items-center border border-neutral-200 rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer"
                >
                  -
                </button>
                <span className="px-4 text-xs font-mono font-semibold text-neutral-900">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="px-3 py-2 text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Affiliate Notice if SHEIN Product */}
          {product.is_shein_affiliate && (
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span>{t('sheinPartnerBadge')}</span>
              </div>
              <p className="text-amber-800 text-[11px] leading-relaxed">
                {t('commissionNotice')}. Tracked sub-ID: <span className="font-mono">{product.shein_sub_id || 'general'}</span>.
              </p>
            </div>
          )}

          {/* Primary Action Button */}
          <div className="pt-4 space-y-3">
            {product.is_shein_affiliate ? (
              <button
                onClick={handleAffiliateClick}
                className="w-full py-3.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:translate-y-[-1px]"
              >
                <span>{t('buyOnShein')}</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleAddToBag}
                disabled={product.stock <= 0}
                className="w-full py-3.5 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-200 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:translate-y-[-1px]"
              >
                {added ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>{t('itemAdded')}</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>{t('addToBag')}</span>
                  </>
                )}
              </button>
            )}

            {/* Guarantees */}
            <div className="pt-4 border-t border-neutral-100 grid grid-cols-2 gap-3 text-[11px] text-neutral-500">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-neutral-700" />
                <span>Free delivery over $75</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-neutral-700" />
                <span>30-Day returns policy</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
