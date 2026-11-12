import React, { useState } from 'react';
import { X, Lock, Mail, User, Phone, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { UserRole } from '../../types';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, authModalMode, login, register, loading } = useAuth();
  const { language, isRtl } = useLanguage();

  const [mode, setMode] = useState<'login' | 'register'>(authModalMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('customer');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync mode with trigger
  React.useEffect(() => {
    setMode(authModalMode);
    setErrorMsg(null);
  }, [authModalMode, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        if (!fullName.trim()) {
          setErrorMsg('Full name is required.');
          return;
        }
        await register(email, password, fullName, phone, role);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    }
  };

  const handleQuickLogin = async (demoEmail: string, demoPass: string) => {
    setErrorMsg(null);
    try {
      await login(demoEmail, demoPass);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-neutral-200 overflow-hidden relative animate-in fade-in zoom-in-95 duration-150">
        
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 z-10 p-2 text-neutral-400 hover:text-neutral-900 bg-white/80 rounded-full transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="p-6 bg-neutral-50/80 border-b border-neutral-200 text-center">
          <div className="w-10 h-10 rounded-full bg-neutral-900 text-white flex items-center justify-center mx-auto mb-3 shadow-xs">
            <Lock className="w-4 h-4" />
          </div>
          <h3 className="text-base font-extrabold text-neutral-900">
            {mode === 'login'
              ? (language === 'ar' ? 'تسجيل الدخول إلى منصة أورا' : 'Sign in to Aura Platform')
              : (language === 'ar' ? 'إنشاء حساب جديد' : 'Create an Account')}
          </h3>
          <p className="text-xs text-neutral-500 mt-1">
            {language === 'ar' 
              ? 'نظام مصادقة متكامل مدعوم بـ Supabase و صلاحيات RBAC' 
              : 'Supabase Authentication & Role-Based Access Control'}
          </p>

          {/* Mode Tabs */}
          <div className="flex bg-neutral-200/70 p-1 rounded-lg mt-4 max-w-xs mx-auto text-xs font-semibold">
            <button
              onClick={() => { setMode('login'); setErrorMsg(null); }}
              className={`flex-1 py-1.5 rounded-md transition-colors cursor-pointer ${
                mode === 'login' ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {language === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
            </button>
            <button
              onClick={() => { setMode('register'); setErrorMsg(null); }}
              className={`flex-1 py-1.5 rounded-md transition-colors cursor-pointer ${
                mode === 'register' ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {language === 'ar' ? 'حساب جديد' : 'Register'}
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 leading-snug">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {mode === 'register' && (
              <>
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">
                    {language === 'ar' ? 'الاسم الكامل' : 'Full Name'} *
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Leila Mansour"
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg pl-9 pr-3 py-2 focus:outline-hidden focus:border-neutral-900 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">
                    {language === 'ar' ? 'رقم الهاتف (اختياري)' : 'Phone Number (Optional)'}
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg pl-9 pr-3 py-2 focus:outline-hidden focus:border-neutral-900 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">
                    {language === 'ar' ? 'الدور والصلاحية (RBAC Role)' : 'Account Role (RBAC)'}
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 focus:outline-hidden focus:border-neutral-900 focus:bg-white"
                  >
                    <option value="customer">Customer (Storefront Shopper)</option>
                    <option value="manager">Manager (Catalog & Orders Ops)</option>
                    <option value="admin">Administrator (Full Access)</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="font-semibold text-neutral-700 block mb-1">
                {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'} *
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-lg pl-9 pr-3 py-2 focus:outline-hidden focus:border-neutral-900 focus:bg-white font-mono text-[11px]"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-neutral-700 block mb-1">
                {language === 'ar' ? 'كلمة المرور' : 'Password'} *
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-lg pl-9 pr-3 py-2 focus:outline-hidden focus:border-neutral-900 focus:bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs mt-2"
            >
              <span>{loading ? 'Authenticating...' : mode === 'login' ? 'Sign In' : 'Create Account'}</span>
              {isRtl ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </form>

          {/* One-Click Quick Login Demo Suite */}
          <div className="pt-3 border-t border-neutral-200">
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block mb-2 text-center">
              Quick Test Credentials (RBAC Verification)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@aura-commerce.com', 'admin123')}
                className="p-2 border border-neutral-200 rounded-lg bg-neutral-50 hover:bg-neutral-100 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-neutral-900 font-bold text-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-neutral-800" />
                  <span>Admin User</span>
                </div>
                <div className="text-[10px] text-neutral-400 font-mono mt-0.5">Role: admin</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('customer@aura-commerce.com', 'customer123')}
                className="p-2 border border-neutral-200 rounded-lg bg-neutral-50 hover:bg-neutral-100 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-neutral-900 font-bold text-xs">
                  <User className="w-3.5 h-3.5 text-neutral-800" />
                  <span>Customer</span>
                </div>
                <div className="text-[10px] text-neutral-400 font-mono mt-0.5">Role: customer</div>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
