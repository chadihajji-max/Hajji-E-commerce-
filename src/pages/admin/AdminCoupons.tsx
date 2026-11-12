import React, { useState, useEffect } from 'react';
import { 
  Tag, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Percent, 
  DollarSign, 
  Copy, 
  Check, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { DbService } from '../../services/dbService';
import { Coupon } from '../../types';

export const AdminCoupons: React.FC = () => {
  const { t, isRtl } = useLanguage();
  const { showToast } = useToast();

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'percentage' | 'fixed'>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState<Partial<Coupon>>({
    code: '',
    discount_type: 'percentage',
    discount_value: 10,
    min_order_amount: 50,
    max_uses: 100,
    is_active: true,
  });

  // Simulator state
  const [testCode, setTestCode] = useState('AURA10');
  const [testAmount, setTestAmount] = useState('100');
  const [testResult, setTestResult] = useState<{ valid: boolean; message: string; discount: number } | null>(null);

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const data = await DbService.getCoupons();
      setCoupons(data);
    } catch {
      showToast('Failed to load coupons from database', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast(isRtl ? `تم نسخ الكود: ${code}` : `Copied promo code: ${code}`, 'success');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleOpenModal = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData(coupon);
    } else {
      setEditingCoupon(null);
      setFormData({
        id: 'coup_' + Date.now().toString(36),
        code: '',
        discount_type: 'percentage',
        discount_value: 15,
        min_order_amount: 50,
        max_uses: 500,
        current_uses: 0,
        is_active: true,
        created_at: new Date().toISOString(),
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code?.trim()) {
      showToast(isRtl ? 'يرجى إدخال كود القسيمة' : 'Please enter a coupon code', 'error');
      return;
    }

    const payload: Coupon = {
      id: editingCoupon ? editingCoupon.id : ('coup_' + Date.now().toString(36)),
      code: formData.code.trim().toUpperCase(),
      discount_type: formData.discount_type || 'percentage',
      discount_value: Number(formData.discount_value) || 0,
      min_order_amount: Number(formData.min_order_amount) || 0,
      max_uses: formData.max_uses ? Number(formData.max_uses) : undefined,
      current_uses: editingCoupon ? editingCoupon.current_uses : 0,
      expires_at: formData.expires_at || undefined,
      is_active: formData.is_active !== undefined ? formData.is_active : true,
      created_at: editingCoupon ? editingCoupon.created_at : new Date().toISOString(),
    };

    try {
      await DbService.saveCoupon(payload);
      showToast(
        editingCoupon 
          ? (isRtl ? 'تم تحديث القسيمة بنجاح' : 'Coupon updated successfully')
          : (isRtl ? 'تمت إضافة القسيمة الترويجية' : 'Promotional coupon created successfully'),
        'success'
      );
      setIsModalOpen(false);
      loadCoupons();
    } catch {
      showToast('Error saving coupon to database', 'error');
    }
  };

  const handleDeleteCoupon = async (id: string, code: string) => {
    if (!confirm(isRtl ? `هل أنت متأكد من حذف القسيمة "${code}"؟` : `Delete promo code "${code}"?`)) return;
    try {
      await DbService.deleteCoupon(id);
      showToast(isRtl ? 'تم حذف القسيمة بنجاح' : 'Coupon deleted successfully', 'success');
      loadCoupons();
    } catch {
      showToast('Failed to delete coupon', 'error');
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    const updated = { ...coupon, is_active: !coupon.is_active };
    await DbService.saveCoupon(updated);
    showToast(
      isRtl
        ? (updated.is_active ? `تم تفعيل الكوبون ${coupon.code}` : `تم إيقاف الكوبون ${coupon.code}`)
        : `Coupon ${coupon.code} is now ${updated.is_active ? 'Active' : 'Inactive'}`,
      'success'
    );
    loadCoupons();
  };

  const handleRunSimulator = async () => {
    const amt = parseFloat(testAmount);
    if (isNaN(amt) || amt <= 0) {
      showToast(isRtl ? 'أدخل قيمة صالحة للسلة' : 'Enter a valid cart amount', 'error');
      return;
    }
    const res = await DbService.validateCoupon(testCode, amt);
    setTestResult({
      valid: res.valid,
      message: res.message || '',
      discount: res.discountAmount,
    });
  };

  const filteredCoupons = coupons.filter(c => {
    const matchesSearch = c.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || c.discount_type === filterType;
    return matchesSearch && matchesType;
  });

  const totalRedemptions = coupons.reduce((sum, c) => sum + (c.current_uses || 0), 0);
  const activeCouponsCount = coupons.filter(c => c.is_active).length;

  return (
    <div className="space-y-6">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-neutral-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-neutral-500">
              {isRtl ? 'إجمالي القسائم النشطة' : 'Active Coupons'}
            </span>
            <Tag className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-900 mt-2">
            {activeCouponsCount} <span className="text-xs font-normal text-neutral-400">/ {coupons.length}</span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            {isRtl ? 'جاهزة للاستخدام في السلة والخروج' : 'Available for storefront redemption'}
          </p>
        </div>

        <div className="bg-white border border-neutral-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-neutral-500">
              {isRtl ? 'مرات الاستخدام الإجمالية' : 'Total Redemptions'}
            </span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-neutral-900 mt-2">
            {totalRedemptions}
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            {isRtl ? 'عمليات شراء مسجلة بكوبونات ترويجية' : 'Successful checkouts with discounts'}
          </p>
        </div>

        <div className="bg-white border border-neutral-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-neutral-500">
              {isRtl ? 'تخفيضات SHEIN والمنصة' : 'Cross-Channel Offers'}
            </span>
            <Percent className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-900 mt-2">
            10% - 25%
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            {isRtl ? 'نسب تخفيض تنافسية تدعم التحويل' : 'Standard promotional margin range'}
          </p>
        </div>
      </div>

      {/* Interactive Coupon Validation Simulator */}
      <div className="bg-neutral-900 text-white p-5 border border-neutral-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              {isRtl ? 'محاكي فحص الكوبونات قبل النشر' : 'Real-time Coupon Validation Sandbox'}
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              {isRtl 
                ? 'اختبر ما إذا كان الكود سيطبق الخصم بالشكل الصحيح على سلة بقيمة محددة' 
                : 'Test code calculation directly against simulated customer subtotal before publishing'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={testCode}
              onChange={(e) => setTestCode(e.target.value.toUpperCase())}
              placeholder="CODE"
              className="bg-neutral-800 border border-neutral-700 px-3 py-1.5 text-xs text-white uppercase tracking-wider font-mono focus:border-amber-400 outline-none w-28"
            />
            <div className="relative">
              <span className="absolute left-2.5 top-1.5 text-xs text-neutral-500">$</span>
              <input
                type="number"
                value={testAmount}
                onChange={(e) => setTestAmount(e.target.value)}
                placeholder="Cart Total"
                className="bg-neutral-800 border border-neutral-700 pl-6 pr-3 py-1.5 text-xs text-white focus:border-amber-400 outline-none w-28"
              />
            </div>
            <button
              onClick={handleRunSimulator}
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-semibold text-xs transition-colors cursor-pointer"
            >
              {isRtl ? 'اختبر الآن' : 'Test Code'}
            </button>
          </div>
        </div>

        {testResult && (
          <div className={`mt-3 p-3 text-xs border flex items-center justify-between ${
            testResult.valid 
              ? 'bg-emerald-950/60 border-emerald-800 text-emerald-200' 
              : 'bg-rose-950/60 border-rose-800 text-rose-200'
          }`}>
            <div className="flex items-center gap-2">
              {testResult.valid ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
              <span>{testResult.message}</span>
            </div>
            {testResult.valid && (
              <span className="font-bold text-sm bg-emerald-900/80 px-2 py-0.5 border border-emerald-700">
                -${testResult.discount.toFixed(2)} USD
              </span>
            )}
          </div>
        )}
      </div>

      {/* Main Table Toolbar */}
      <div className="bg-white border border-neutral-200 shadow-xs">
        <div className="p-4 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder={isRtl ? 'البحث عن كود القسيمة...' : 'Search by coupon code...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-neutral-200 text-sm focus:border-neutral-900 outline-none"
              />
            </div>

            <div className="flex items-center gap-1 border border-neutral-200 p-0.5 text-xs">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 transition-colors cursor-pointer ${filterType === 'all' ? 'bg-neutral-900 text-white font-medium' : 'text-neutral-600 hover:text-neutral-900'}`}
              >
                {isRtl ? 'الكل' : 'All'}
              </button>
              <button
                onClick={() => setFilterType('percentage')}
                className={`px-3 py-1.5 transition-colors cursor-pointer ${filterType === 'percentage' ? 'bg-neutral-900 text-white font-medium' : 'text-neutral-600 hover:text-neutral-900'}`}
              >
                {isRtl ? 'نسبة مئوية %' : 'Percentage %'}
              </button>
              <button
                onClick={() => setFilterType('fixed')}
                className={`px-3 py-1.5 transition-colors cursor-pointer ${filterType === 'fixed' ? 'bg-neutral-900 text-white font-medium' : 'text-neutral-600 hover:text-neutral-900'}`}
              >
                {isRtl ? 'قيمة ثابتة $' : 'Fixed $'}
              </button>
            </div>
          </div>

          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold px-4 py-2.5 transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{isRtl ? 'إضافة قسيمة جديدة' : 'Add Coupon'}</span>
          </button>
        </div>

        {/* Coupons List */}
        {loading ? (
          <div className="p-12 text-center text-neutral-400 text-sm">
            <div className="inline-block animate-spin w-5 h-5 border-2 border-neutral-900 border-t-transparent mb-2" />
            <p>{isRtl ? 'جاري تحميل القسائم...' : 'Loading promotional coupons...'}</p>
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="p-12 text-center text-neutral-500 text-sm">
            <Tag className="w-10 h-10 mx-auto text-neutral-300 mb-2" />
            <p>{isRtl ? 'لا توجد قسائم تطابق معايير البحث' : 'No promo coupons found matching criteria'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-neutral-700">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-xs uppercase text-neutral-500 font-medium">
                <tr>
                  <th className="px-5 py-3.5">{isRtl ? 'كود القسيمة' : 'Coupon Code'}</th>
                  <th className="px-5 py-3.5">{isRtl ? 'نوع الخصم وقيمته' : 'Discount Rate'}</th>
                  <th className="px-5 py-3.5">{isRtl ? 'الحد الأدنى للطلب' : 'Min Order'}</th>
                  <th className="px-5 py-3.5">{isRtl ? 'مرات الاستخدام' : 'Usage / Limit'}</th>
                  <th className="px-5 py-3.5">{isRtl ? 'الحالة' : 'Status'}</th>
                  <th className="px-5 py-3.5 text-right">{isRtl ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredCoupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-neutral-900 tracking-wider bg-neutral-100 px-2.5 py-1 border border-neutral-300">
                          {coupon.code}
                        </span>
                        <button
                          onClick={() => handleCopyCode(coupon.code)}
                          title="Copy Code"
                          className="p-1 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                        >
                          {copiedCode === coupon.code ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        {coupon.discount_type === 'percentage' ? (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold px-2 py-0.5">
                            <Percent className="w-3 h-3" />
                            {coupon.discount_value}% OFF
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-800 border border-indigo-200 text-xs font-semibold px-2 py-0.5">
                            <DollarSign className="w-3 h-3" />
                            ${coupon.discount_value.toFixed(2)} OFF
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-3.5 font-medium text-neutral-800">
                      ${coupon.min_order_amount.toFixed(2)}
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-neutral-900">{coupon.current_uses}</span>
                        <span className="text-neutral-400">/</span>
                        <span className="text-neutral-500">{coupon.max_uses ? coupon.max_uses : '∞'}</span>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => handleToggleActive(coupon)}
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 cursor-pointer transition-colors ${
                          coupon.is_active 
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100' 
                            : 'bg-neutral-100 text-neutral-600 border border-neutral-300 hover:bg-neutral-200'
                        }`}
                      >
                        {coupon.is_active ? (
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

                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenModal(coupon)}
                          className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 cursor-pointer"
                          title="Edit Coupon"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCoupon(coupon.id, coupon.code)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                          title="Delete Coupon"
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

      {/* Add / Edit Coupon Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="bg-white border border-neutral-300 max-w-md w-full p-6 shadow-xl relative animate-in fade-in duration-150">
            <h3 className="text-base font-bold text-neutral-900 pb-3 border-b border-neutral-200">
              {editingCoupon 
                ? (isRtl ? `تعديل القسيمة: ${editingCoupon.code}` : `Edit Promo Code: ${editingCoupon.code}`)
                : (isRtl ? 'إنشاء قسيمة ترويجية جديدة' : 'Create New Promotional Coupon')}
            </h3>

            <form onSubmit={handleSaveCoupon} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">
                  {isRtl ? 'كود القسيمة (مثال: AURA20)' : 'Coupon Code (e.g., AURA20)'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.code || ''}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="CODE"
                  className="w-full px-3 py-2 border border-neutral-300 text-sm font-mono uppercase tracking-wider focus:border-neutral-900 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">
                    {isRtl ? 'نوع الخصم' : 'Discount Type'}
                  </label>
                  <select
                    value={formData.discount_type || 'percentage'}
                    onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-neutral-300 text-sm focus:border-neutral-900 outline-none"
                  >
                    <option value="percentage">{isRtl ? 'نسبة مئوية (%)' : 'Percentage (%)'}</option>
                    <option value="fixed">{isRtl ? 'مبلغ ثابت ($)' : 'Fixed Amount ($)'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">
                    {formData.discount_type === 'percentage' 
                      ? (isRtl ? 'النسبة المئوية (%)' : 'Rate (%)')
                      : (isRtl ? 'القيمة ($ USD)' : 'Amount ($ USD)')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={formData.discount_value || ''}
                    onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-neutral-300 text-sm focus:border-neutral-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">
                    {isRtl ? 'الحد الأدنى للطلب ($)' : 'Min Order ($)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.min_order_amount || 0}
                    onChange={(e) => setFormData({ ...formData, min_order_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-neutral-300 text-sm focus:border-neutral-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">
                    {isRtl ? 'الحد الأقصى للاستخدام' : 'Max Uses (Limit)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Unlimited"
                    value={formData.max_uses || ''}
                    onChange={(e) => setFormData({ ...formData, max_uses: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-neutral-300 text-sm focus:border-neutral-900 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="couponActive"
                  checked={formData.is_active ?? true}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 accent-neutral-900 cursor-pointer"
                />
                <label htmlFor="couponActive" className="text-xs font-medium text-neutral-800 cursor-pointer">
                  {isRtl ? 'تفعيل القسيمة مباشرة على المتجر' : 'Publish and activate coupon immediately'}
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
                  {editingCoupon ? (isRtl ? 'حفظ التعديلات' : 'Save Changes') : (isRtl ? 'إنشاء القسيمة' : 'Create Coupon')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
