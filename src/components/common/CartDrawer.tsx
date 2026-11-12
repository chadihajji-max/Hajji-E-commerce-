import React from 'react';
import { X, Plus, Minus, Trash2, ArrowRight, ArrowLeft, ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { useRouter } from '../../context/RouterContext';

export const CartDrawer: React.FC = () => {
  const { 
    items, 
    removeItem, 
    updateQuantity, 
    isCartOpen, 
    setIsCartOpen, 
    subtotal, 
    freeShippingThreshold,
    remainingForFreeShipping 
  } = useCart();
  const { t, language, isRtl } = useLanguage();
  const { navigate } = useRouter();

  if (!isCartOpen) return null;

  const handleCheckout = () => {
    setIsCartOpen(false);
    navigate('checkout');
  };

  const shippingProgress = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs transition-opacity"
        onClick={() => setIsCartOpen(false)}
        aria-hidden="true"
      />

      <div className={`fixed inset-y-0 max-w-full flex ${isRtl ? 'left-0' : 'right-0'}`}>
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-6 py-5 border-b border-neutral-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-5 h-5 text-neutral-900" />
              <h2 className="text-base font-bold text-neutral-900">
                {t('shoppingBag')} ({items.length})
              </h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 text-neutral-400 hover:text-neutral-900 transition-colors rounded-lg cursor-pointer"
              aria-label="Close Bag"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Strip */}
          <div className="bg-neutral-50 px-6 py-3 border-b border-neutral-200 text-xs text-neutral-600">
            {remainingForFreeShipping > 0 ? (
              <div>
                <span className="font-medium text-neutral-900">
                  {language === 'ar' 
                    ? `أضف بقيمة $${remainingForFreeShipping.toFixed(2)} للحصول على شحن مجاني`
                    : `Add $${remainingForFreeShipping.toFixed(2)} more for FREE worldwide shipping`}
                </span>
                <div className="w-full bg-neutral-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="bg-neutral-900 h-full transition-all duration-300"
                    style={{ width: `${shippingProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <span className="font-semibold text-emerald-700 flex items-center gap-1.5">
                {language === 'ar' ? 'تهانينا! لقد حصلت على شحن مجاني لكافة طلبك' : 'Unlocked! You qualify for FREE shipping'}
              </span>
            )}
          </div>

          {/* Items Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-neutral-100">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mb-4">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-semibold text-neutral-900 mb-1">{t('emptyBagTitle')}</h3>
                <p className="text-xs text-neutral-500 max-w-xs mb-6">{t('emptyBagDesc')}</p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-4 py-2 bg-neutral-900 text-white text-xs font-semibold rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  {t('continueShopping')}
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div key={`${item.product.id}-${item.selectedSize || 'def'}`} className="py-4 flex gap-4">
                  <img
                    src={item.product.image_url}
                    alt={item.product.title_en}
                    className="w-20 h-24 object-cover rounded-md bg-neutral-100 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-xs font-semibold text-neutral-900 leading-snug line-clamp-2">
                          {language === 'ar' ? item.product.title_ar : item.product.title_en}
                        </h4>
                        <button
                          onClick={() => removeItem(item.product.id, item.selectedSize)}
                          className="text-neutral-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {item.product.is_shein_affiliate && (
                        <p className="text-[10px] text-amber-700 font-medium mt-0.5">
                          {t('sheinPartnerBadge')}
                        </p>
                      )}
                      {item.selectedSize && (
                        <span className="text-[11px] text-neutral-500 mt-1 block">
                          Size: {item.selectedSize}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-neutral-200 rounded-md">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.selectedSize)}
                          className="px-2 py-1 text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-mono tabular-nums font-medium text-neutral-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.selectedSize)}
                          className="px-2 py-1 text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-xs font-bold font-mono tabular-nums text-neutral-900">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="p-6 border-t border-neutral-200 bg-neutral-50 space-y-4">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-neutral-600">
                  <span>{t('subtotal')}</span>
                  <span className="font-mono tabular-nums font-semibold">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>{t('shipping')}</span>
                  <span className="font-medium text-emerald-600">
                    {subtotal >= freeShippingThreshold ? t('freeShipping') : '$9.95'}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-neutral-900 pt-2 border-t border-neutral-200">
                  <span>{t('total')}</span>
                  <span className="font-mono tabular-nums">
                    ${(subtotal + (subtotal >= freeShippingThreshold ? 0 : 9.95)).toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
              >
                <span>{t('proceedToCheckout')}</span>
                {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
