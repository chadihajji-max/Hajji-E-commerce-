import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, X, Truck, Clock, DollarSign, Check } from 'lucide-react';
import { ShippingMethod } from '../../types';
import { DbService } from '../../services/dbService';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { LoadingState } from '../../components/common/LoadingState';

export const AdminShipping: React.FC = () => {
  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<ShippingMethod | null>(null);

  const [formData, setFormData] = useState<Partial<ShippingMethod>>({
    name_en: '',
    name_ar: '',
    description_en: '',
    description_ar: '',
    cost: 0,
    estimated_days: '3-5 business days',
    is_active: true,
  });

  const { t, language } = useLanguage();
  const { showToast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await DbService.getShippingMethods();
      setMethods(data);
    } catch (err) {
      console.error('Failed to load shipping methods:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openNewModal = () => {
    setEditingMethod(null);
    setFormData({
      id: 'ship_' + Date.now().toString(36),
      name_en: '',
      name_ar: '',
      description_en: '',
      description_ar: '',
      cost: 12.00,
      estimated_days: '2-4 business days',
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (m: ShippingMethod) => {
    setEditingMethod(m);
    setFormData({ ...m });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to remove this shipping method?')) {
      await DbService.deleteShippingMethod(id);
      showToast('Shipping method removed', 'info');
      loadData();
    }
  };

  const handleToggleActive = async (m: ShippingMethod) => {
    const updated = { ...m, is_active: !m.is_active };
    await DbService.saveShippingMethod(updated);
    showToast(`Shipping method set to ${updated.is_active ? 'Active' : 'Disabled'}`);
    loadData();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name_en) {
      showToast('Please specify method name in English', 'error');
      return;
    }

    const payload: ShippingMethod = {
      id: editingMethod?.id || formData.id || 'ship_' + Date.now().toString(36),
      name_en: formData.name_en.trim(),
      name_ar: formData.name_ar?.trim() || formData.name_en.trim(),
      description_en: formData.description_en || '',
      description_ar: formData.description_ar || '',
      cost: Number(formData.cost) || 0,
      estimated_days: formData.estimated_days || '3-5 business days',
      is_active: formData.is_active ?? true,
      created_at: editingMethod?.created_at || new Date().toISOString(),
    };

    await DbService.saveShippingMethod(payload);
    showToast('Shipping method saved successfully', 'success');
    setIsModalOpen(false);
    loadData();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-base font-bold text-neutral-900">
            {language === 'ar' ? 'خيارات التوصيل والشحن' : 'Shipping Methods & Rates'}
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Configure delivery tiers, international couriers, and free delivery thresholds.
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Shipping Method</span>
        </button>
      </div>

      {loading ? (
        <LoadingState variant="table" count={3} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {methods.map((m) => (
            <div
              key={m.id}
              className={`p-5 bg-white rounded-xl border transition-all shadow-2xs flex flex-col justify-between ${
                m.is_active ? 'border-neutral-200' : 'border-neutral-200 opacity-60'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-neutral-100 text-neutral-800">
                    <Truck className="w-4 h-4" />
                  </div>
                  <button
                    onClick={() => handleToggleActive(m)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                      m.is_active ? 'bg-emerald-50 text-emerald-800' : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {m.is_active ? 'Enabled' : 'Disabled'}
                  </button>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-neutral-900">{m.name_en}</h3>
                  <h4 className="text-xs text-neutral-600 font-medium" dir="rtl">{m.name_ar}</h4>
                </div>

                <div className="flex items-baseline gap-2 pt-1">
                  <span className="text-xl font-bold font-mono tabular-nums text-neutral-900">
                    {m.cost === 0 ? 'FREE' : `$${m.cost.toFixed(2)}`}
                  </span>
                  <span className="text-xs text-neutral-400 font-mono">USD</span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium">
                  <Clock className="w-3.5 h-3.5 text-neutral-400" />
                  <span>{m.estimated_days}</span>
                </div>

                <p className="text-[11px] text-neutral-500 leading-relaxed border-t border-neutral-100 pt-2">
                  {m.description_en}
                </p>
              </div>

              <div className="pt-4 border-t border-neutral-100 flex items-center justify-end gap-2 mt-4">
                <button
                  onClick={() => openEditModal(m)}
                  className="px-2.5 py-1 text-neutral-600 hover:text-neutral-900 text-xs font-semibold rounded hover:bg-neutral-100 transition-colors cursor-pointer"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(m.id)}
                  className="px-2.5 py-1 text-rose-600 hover:text-rose-800 text-xs font-semibold rounded hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-neutral-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
              <h3 className="text-sm font-bold text-neutral-900">
                {editingMethod ? 'Edit Shipping Tier' : 'Add Shipping Method'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-neutral-400 hover:text-neutral-900 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Method Title (English) *</label>
                <input
                  type="text"
                  required
                  value={formData.name_en}
                  onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                  placeholder="e.g. DHL Express Worldwide"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded px-3 py-1.5"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Method Title (Arabic) *</label>
                <input
                  type="text"
                  required
                  dir="rtl"
                  value={formData.name_ar}
                  onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                  placeholder="مثال: شحن دي إتش إل الدولي السريع"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded px-3 py-1.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Base Cost ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) })}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded px-3 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Delivery Timeframe</label>
                  <input
                    type="text"
                    value={formData.estimated_days}
                    onChange={(e) => setFormData({ ...formData, estimated_days: e.target.value })}
                    placeholder="2-4 business days"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded px-3 py-1.5"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  value={formData.description_en}
                  onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                  placeholder="Details shown to customer during checkout..."
                  className="w-full bg-neutral-50 border border-neutral-200 rounded px-3 py-1.5 resize-none"
                />
              </div>

              <div className="pt-4 border-t border-neutral-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-neutral-200 text-neutral-700 rounded font-semibold hover:bg-neutral-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded font-semibold cursor-pointer shadow-2xs"
                >
                  Save Method
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
