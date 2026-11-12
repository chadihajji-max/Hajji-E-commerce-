import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight, 
  ShieldCheck, 
  CreditCard, 
  Truck, 
  DollarSign, 
  Lock,
  Tag,
  Check
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { DbService } from '../../services/dbService';
import { PaymentMethod, Order } from '../../types';
import { useToast } from '../../context/ToastContext';

export const CheckoutPage: React.FC = () => {
  const { items, subtotal, freeShippingThreshold, clearCart } = useCart();
  const { t, language, isRtl } = useLanguage();
  const { navigate } = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: '',
    city: '',
    notes: '',
  });

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user.full_name,
        email: prev.email || user.email,
        phone: prev.phone || user.phone || '',
      }));
    }
  }, [user]);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  const shippingCost = subtotal >= freeShippingThreshold ? 0 : 9.95;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const finalTotal = Number((taxableAmount + shippingCost).toFixed(2));

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setApplyingCoupon(true);
    try {
      const res = await DbService.validateCoupon(couponCode, subtotal);
      if (res.valid) {
        setAppliedCoupon(res.coupon?.code || couponCode.toUpperCase());
        setDiscountAmount(res.discountAmount);
        showToast(res.message || 'Coupon applied successfully!', 'success');
      } else {
        showToast(res.message || 'Invalid coupon code', 'error');
      }
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponCode('');
    showToast('Coupon removed', 'info');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      showToast('Your shopping bag is empty', 'error');
      return;
    }

    if (!formData.name || !formData.email || !formData.phone || !formData.address) {
      showToast('Please fill all mandatory shipping details', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const created = await DbService.createOrder({
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: formData.phone,
        shipping_address: formData.address,
        shipping_city: formData.city || 'Standard Area',
        subtotal,
        shipping_cost: shippingCost,
        discount_amount: discountAmount,
        total_amount: finalTotal,
        payment_method: paymentMethod,
        coupon_code: appliedCoupon || undefined,
        notes: formData.notes,
        items: [...items],
        user_id: user?.id,
      });

      setConfirmedOrder(created);
      clearCart();
      showToast(t('orderSuccessTitle'), 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`Order submission error: ${msg}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // If order is successfully confirmed, show receipt
  if (confirmedOrder) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900">
          {t('orderSuccessTitle')}
        </h1>

        <p className="text-xs sm:text-sm text-neutral-600 max-w-md mx-auto leading-relaxed">
          {t('orderSuccessMessage')}
        </p>

        <div className="p-6 bg-white border border-neutral-200 rounded-xl text-left space-y-4 shadow-2xs">
          <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
            <span className="text-xs text-neutral-500">{t('orderNumber')}</span>
            <span className="font-mono font-bold text-sm text-neutral-900">{confirmedOrder.order_number}</span>
          </div>

          <div className="space-y-1 text-xs text-neutral-600">
            <div><b>Customer:</b> {confirmedOrder.customer_name} ({confirmedOrder.customer_email})</div>
            <div><b>Shipping Address:</b> {confirmedOrder.shipping_address}, {confirmedOrder.shipping_city}</div>
            <div><b>Payment:</b> {confirmedOrder.payment_method.toUpperCase()}</div>
            {confirmedOrder.coupon_code && (
              <div className="text-emerald-700"><b>Applied Promo:</b> {confirmedOrder.coupon_code}</div>
            )}
            <div className="pt-2 font-bold text-neutral-900 text-sm">
              Total Paid / Due: ${confirmedOrder.total_amount.toFixed(2)} USD
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-3 pt-4">
          <button
            onClick={() => navigate('home')}
            className="px-6 py-2.5 bg-neutral-900 text-white rounded-lg text-xs font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            {language === 'ar' ? 'العودة للمتجر الرئيسي' : 'Return to Storefront'}
          </button>
          {user ? (
            <button
              onClick={() => navigate('profile')}
              className="px-6 py-2.5 bg-neutral-100 text-neutral-800 rounded-lg text-xs font-semibold hover:bg-neutral-200 transition-colors cursor-pointer border border-neutral-200"
            >
              View in My Orders
            </button>
          ) : (
            <button
              onClick={() => navigate('admin-orders')}
              className="px-6 py-2.5 bg-neutral-100 text-neutral-800 rounded-lg text-xs font-semibold hover:bg-neutral-200 transition-colors cursor-pointer border border-neutral-200"
            >
              {language === 'ar' ? 'عرض في لوحة التحكم' : 'View in Admin Orders'}
            </button>
          )}
        </div>
      </div>
    );
  }

  // If bag is empty and no confirmed order
  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-lg font-bold text-neutral-900">{t('emptyBagTitle')}</h2>
        <p className="text-xs text-neutral-500">{t('emptyBagDesc')}</p>
        <button
          onClick={() => navigate('catalog')}
          className="px-5 py-2.5 bg-neutral-900 text-white rounded-lg text-xs font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          {t('continueShopping')}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back button */}
      <button
        onClick={() => navigate('catalog')}
        className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer"
      >
        {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
        <span>{t('continueShopping')}</span>
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight">
          {t('checkoutTitle')}
        </h1>
        {user ? (
          <span className="text-xs text-neutral-600">
            Checking out as <b>{user.full_name}</b> ({user.email})
          </span>
        ) : (
          <span className="text-xs text-neutral-500">
            Guest checkout or log in to link orders to your profile
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Form Column */}
        <div className="lg:col-span-7 space-y-6">
          {/* Contact Details */}
          <div className="bg-white p-6 rounded-xl border border-neutral-200 space-y-4 shadow-2xs">
            <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-neutral-700" />
              <span>{t('contactDetails')}</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-neutral-700 block mb-1">
                  {t('fullName')} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Alex Morgan"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:border-neutral-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-700 block mb-1">
                  {t('emailAddress')} *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="alex@domain.com"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:border-neutral-900 focus:bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-neutral-700 block mb-1">
                  {t('phoneNumber')} *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:border-neutral-900 focus:bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-neutral-700 block mb-1">
                  {t('streetAddress')} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street name, building, apartment number"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:border-neutral-900 focus:bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-neutral-700 block mb-1">
                  {t('city')}
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="e.g. New York, Dubai, Riyadh"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:border-neutral-900 focus:bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-neutral-700 block mb-1">
                  {t('orderNotes')}
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Special instructions for delivery partner..."
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:border-neutral-900 focus:bg-white resize-none"
                />
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="bg-white p-6 rounded-xl border border-neutral-200 space-y-4 shadow-2xs">
            <h2 className="text-sm font-bold text-neutral-900">
              {t('paymentMethod')}
            </h2>

            <div className="space-y-2">
              <label className="flex items-center justify-between p-3.5 border rounded-lg cursor-pointer transition-colors border-neutral-200 hover:border-neutral-400">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="accent-neutral-900"
                  />
                  <div>
                    <span className="text-xs font-bold text-neutral-900 block">{t('cashOnDelivery')}</span>
                    <span className="text-[11px] text-neutral-500">Pay in cash or mobile card terminal upon physical delivery</span>
                  </div>
                </div>
                <Truck className="w-4 h-4 text-neutral-400" />
              </label>

              <label className="flex items-center justify-between p-3.5 border rounded-lg cursor-pointer transition-colors border-neutral-200 hover:border-neutral-400">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')}
                    className="accent-neutral-900"
                  />
                  <div>
                    <span className="text-xs font-bold text-neutral-900 block">{t('creditCardPreview')}</span>
                    <span className="text-[11px] text-neutral-500">Encrypted instant checkout with Visa, Mastercard, or Mada</span>
                  </div>
                </div>
                <CreditCard className="w-4 h-4 text-neutral-400" />
              </label>

              <label className="flex items-center justify-between p-3.5 border rounded-lg cursor-pointer transition-colors border-neutral-200 hover:border-neutral-400">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    value="paypal"
                    checked={paymentMethod === 'paypal'}
                    onChange={() => setPaymentMethod('paypal')}
                    className="accent-neutral-900"
                  />
                  <div>
                    <span className="text-xs font-bold text-neutral-900 block">{t('paypalPreview')}</span>
                    <span className="text-[11px] text-neutral-500">Connect to your personal PayPal buyer protection account</span>
                  </div>
                </div>
                <DollarSign className="w-4 h-4 text-neutral-400" />
              </label>
            </div>
          </div>
        </div>

        {/* Right Summary Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-neutral-200 space-y-4 shadow-2xs">
            <h2 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-3">
              {t('orderSummary')} ({items.length} items)
            </h2>

            {/* List of items */}
            <div className="space-y-3 max-h-56 overflow-y-auto divide-y divide-neutral-100">
              {items.map((item, idx) => (
                <div key={idx} className="pt-2 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.product.image_url}
                      alt={item.product.title_en}
                      className="w-10 h-10 object-cover rounded bg-neutral-100 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h4 className="font-semibold text-neutral-900 line-clamp-1">
                        {language === 'ar' ? item.product.title_ar : item.product.title_en}
                      </h4>
                      <span className="text-[11px] text-neutral-400 font-mono">
                        Qty: {item.quantity} · Size: {item.selectedSize || 'M'}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-neutral-900 shrink-0">
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Coupon Code Input */}
            <div className="pt-3 border-t border-neutral-100">
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs">
                  <div className="flex items-center gap-2 text-emerald-800">
                    <Tag className="w-3.5 h-3.5" />
                    <span className="font-mono font-bold">{appliedCoupon}</span>
                    <span>(-${discountAmount.toFixed(2)})</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-[11px] text-emerald-700 hover:text-emerald-900 underline font-medium cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Promo code (e.g. AURA10)"
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg pl-9 pr-3 py-1.5 text-xs font-mono focus:outline-hidden focus:border-neutral-900"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={applyingCoupon || !couponCode.trim()}
                    className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-300 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0"
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>

            {/* Calculation */}
            <div className="pt-3 border-t border-neutral-200 space-y-2 text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>{t('subtotal')}</span>
                <span className="font-mono tabular-nums font-semibold">${subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Coupon Discount</span>
                  <span className="font-mono tabular-nums font-semibold">-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-neutral-600">
                <span>{t('shipping')}</span>
                <span className="font-medium text-emerald-600">
                  {shippingCost === 0 ? t('freeShipping') : `$${shippingCost.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-neutral-900 pt-2 border-t border-neutral-100">
                <span>{t('total')} (USD)</span>
                <span className="font-mono tabular-nums">${finalTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-400 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:translate-y-[-1px]"
            >
              <span>{submitting ? 'Registering Order...' : t('completeOrder')}</span>
              {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </button>

            <div className="pt-2 text-[11px] text-neutral-400 text-center flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-neutral-600" />
              <span>Direct registration in database with SSL encryption</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
