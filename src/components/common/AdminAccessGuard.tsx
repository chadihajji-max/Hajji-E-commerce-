import React from 'react';
import { ShieldAlert, Lock, ArrowRight, ArrowLeft, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useRouter } from '../../context/RouterContext';

export const AdminAccessGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isStaff, isAdmin, openAuthModal, login } = useAuth();
  const { t, language, isRtl } = useLanguage();
  const { navigate } = useRouter();

  // If user has admin or manager privileges, allow access
  if (isStaff) {
    return <>{children}</>;
  }

  const handleQuickAdminLogin = async () => {
    try {
      await login('admin@aura-commerce.com', 'admin123');
    } catch {
      openAuthModal('login');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-neutral-200 shadow-xl p-8 text-center space-y-6">
        <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-rose-600 font-bold bg-rose-50 px-2.5 py-1 rounded">
            RBAC Authorization Barrier
          </span>
          <h2 className="text-xl font-bold text-neutral-900">
            {language === 'ar' ? 'صلاحيات المشرف مطلوبة' : 'Administrator Access Required'}
          </h2>
          <p className="text-xs text-neutral-500 leading-relaxed">
            {user ? (
              <>
                You are currently logged in as <b>{user.full_name}</b> with role{' '}
                <span className="font-mono font-bold uppercase text-neutral-800">
                  [{user.role}]
                </span>
                . The Admin Operations Portal is restricted to users with <code className="font-mono bg-neutral-100 px-1 py-0.5 rounded">admin</code> or <code className="font-mono bg-neutral-100 px-1 py-0.5 rounded">manager</code> privileges.
              </>
            ) : (
              'You must authenticate with verified administrator credentials to access store operations, product management, and order telemetry.'
            )}
          </p>
        </div>

        <div className="space-y-2 pt-2">
          <button
            onClick={handleQuickAdminLogin}
            className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs"
          >
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>Sign In as Demo Admin (1-Click)</span>
          </button>

          <button
            onClick={() => openAuthModal('login')}
            className="w-full py-2.5 border border-neutral-200 hover:bg-neutral-50 text-neutral-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-neutral-500" />
            <span>Custom Login with Supabase Auth</span>
          </button>

          <button
            onClick={() => navigate('home')}
            className="w-full py-2 text-xs font-medium text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
          >
            {language === 'ar' ? 'العودة إلى واجهة المتجر' : 'Return to Public Storefront'}
          </button>
        </div>
      </div>
    </div>
  );
};
