import React, { useState } from 'react';
import { X, ExternalLink, ShoppingBag, Check, ShieldCheck } from 'lucide-react';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { createAffiliateClickRecord } from '../../services/sheinAffiliate';
import { StorageService } from '../../services/storage';
import { useToast } from '../../context/ToastContext';

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
  onViewFullDetails: (productId: string) => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({
  product,
  onClose,
  onViewFullDetails,
}) => {
  const [selectedSize, setSelectedSize] = useState<string>('M');
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();
  const { t, language } = useLanguage();
  const { showToast } = useToast();

  if (!product) return null;

  const handleAddToBag = () => {
    addItem(product, 1, selectedSize);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleAffiliateClick = async () => {
    const clickLog = createAffiliateClickRecord(product);
    await StorageService.recordAffiliateClick(clickLog);
    showToast(t('trackClickSuccess'), 'info');
    if (product.shein_affiliate_url) {
      window.open(product.shein_affiliate_url, '_blank', 'noopener,noreferrer');
    }
  };

  const availableSizes = ['S', 'M', 'L', 'XL'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-neutral-200 overflow-hidden relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 text-neutral-400 hover:text-neutral-900 bg-white/80 rounded-full backdrop-blur-xs transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Product Image */}
          <div className="bg-neutral-100 aspect-square md:aspect-auto h-full flex items-center justify-center overflow-hidden">
            <img
              src={product.image_url}
              alt={product.title_en}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Details */}
          <div className="p-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <span>SKU: {product.sku}</span>
                <span>·</span>
                <span className={product.stock > 0 ? 'text-emerald-600 font-medium' : 'text-rose-600'}>
                  {product.stock > 0 ? t('inStock') : t('outOfStock')}
                </span>
              </div>

              <h3 className="text-base font-bold text-neutral-900 leading-snug">
                {language === 'ar' ? product.title_ar : product.title_en}
              </h3>

              <div className="flex items-baseline gap-2.5">
                <span className="text-xl font-bold font-mono tabular-nums text-neutral-900">
                  ${product.price.toFixed(2)}
                </span>
                {product.compare_at_price && (
                  <span className="text-xs font-mono tabular-nums text-neutral-400 line-through">
                    ${product.compare_at_price.toFixed(2)}
                  </span>
                )}
              </div>

              <p className="text-xs text-neutral-600 leading-relaxed line-clamp-3">
                {language === 'ar' ? product.description_ar : product.description_en}
              </p>

              {/* Size Selector */}
              <div className="pt-2">
                <label className="text-[11px] font-semibold text-neutral-700 uppercase tracking-wider block mb-1.5">
                  Select Size
                </label>
                <div className="flex gap-2">
                  {availableSizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={`w-8 h-8 rounded border text-xs font-medium flex items-center justify-center transition-colors cursor-pointer ${
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

              {/* SHEIN Affiliate Callout if applicable */}
              {product.is_shein_affiliate && (
                <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-lg text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-900 font-semibold">
                    <ShieldCheck className="w-4 h-4 text-amber-700" />
                    <span>{t('sheinPartnerBadge')}</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    {t('commissionNotice')}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-6">
              {product.is_shein_affiliate ? (
                <button
                  onClick={handleAffiliateClick}
                  className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <span>{t('buyOnShein')}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={handleAddToBag}
                  disabled={product.stock <= 0}
                  className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-200 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {added ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>{t('itemAdded')}</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>{t('addToBag')}</span>
                    </>
                  )}
                </button>
              )}

              <button
                onClick={() => {
                  onClose();
                  onViewFullDetails(product.id);
                }}
                className="w-full py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer"
              >
                {t('viewDetails')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
