import React, { useState, useEffect } from 'react';
import { CreditCard, DollarSign, Truck, CheckCircle2, XCircle, ShieldCheck, Settings } from 'lucide-react';
import { PaymentGateway } from '../../types';
import { DbService } from '../../services/dbService';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { LoadingState } from '../../components/common/LoadingState';

export const AdminPayments: React.FC = () => {
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [loading, setLoading] = useState(true);

  const { t, language } = useLanguage();
  const { showToast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await DbService.getPaymentGateways();
      setGateways(data);
    } catch (err) {
      console.error('Failed to load payment gateways:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleEnabled = async (gw: PaymentGateway) => {
    const updated = { ...gw, is_enabled: !gw.is_enabled };
    await DbService.savePaymentGateway(updated);
    showToast(`${gw.name_en} set to ${updated.is_enabled ? 'Active' : 'Disabled'}`);
    loadData();
  };

  const handleToggleTestMode = async (gw: PaymentGateway) => {
    const updated = { ...gw, test_mode: !gw.test_mode };
    await DbService.savePaymentGateway(updated);
    showToast(`${gw.name_en} test mode set to ${updated.test_mode ? 'Sandbox / Test' : 'Live Production'}`);
    loadData();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-neutral-900">
          {language === 'ar' ? 'إعدادات بوابات وطرق الدفع' : 'Payment Gateways & Processing Settings'}
        </h2>
        <p className="text-xs text-neutral-500 mt-0.5">
          Enable or disable checkout payment processors and configure customer payment guidelines.
        </p>
      </div>

      {loading ? (
        <LoadingState variant="table" count={3} />
      ) : (
        <div className="space-y-4">
          {gateways.map((gw) => (
            <div
              key={gw.id}
              className={`p-6 bg-white rounded-2xl border transition-all shadow-2xs ${
                gw.is_enabled ? 'border-neutral-200' : 'border-neutral-200 opacity-65'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-neutral-100 text-neutral-900 shrink-0">
                    {gw.code === 'cod' && <Truck className="w-5 h-5" />}
                    {gw.code === 'card' && <CreditCard className="w-5 h-5" />}
                    {gw.code === 'paypal' && <DollarSign className="w-5 h-5" />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-neutral-900">{gw.name_en}</h3>
                      <span className="font-mono text-[10px] uppercase text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded">
                        {gw.code}
                      </span>
                      {gw.test_mode !== undefined && (
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                          gw.test_mode ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'
                        }`}>
                          {gw.test_mode ? 'Sandbox' : 'Production'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500 font-medium" dir="rtl">{gw.name_ar}</p>
                    <p className="text-xs text-neutral-600 pt-1 leading-relaxed max-w-xl">
                      {gw.instructions_en}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  {gw.test_mode !== undefined && (
                    <button
                      onClick={() => handleToggleTestMode(gw)}
                      className="px-3 py-1.5 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      {gw.test_mode ? 'Switch to Live' : 'Switch to Test'}
                    </button>
                  )}

                  <button
                    onClick={() => handleToggleEnabled(gw)}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-2xs ${
                      gw.is_enabled
                        ? 'bg-neutral-900 hover:bg-neutral-800 text-white'
                        : 'bg-neutral-200 hover:bg-neutral-300 text-neutral-700'
                    }`}
                  >
                    {gw.is_enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
