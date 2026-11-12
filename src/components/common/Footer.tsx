import React, { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useRouter } from '../../context/RouterContext';
import { useToast } from '../../context/ToastContext';

export const Footer: React.FC = () => {
  const { t, language } = useLanguage();
  const { navigate } = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      showToast('Please enter a valid email address', 'error');
      return;
    }
    setSubscribed(true);
    showToast('Subscribed to private editorial updates', 'success');
    setEmail('');
  };

  return (
    <footer className="bg-neutral-900 text-neutral-400 border-t border-neutral-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          
          {/* Brand & Mission */}
          <div className="space-y-3">
            <span className="text-base font-bold text-white tracking-tight">
              {t('brandName')}
            </span>
            <p className="text-neutral-400 leading-relaxed text-xs">
              {language === 'ar'
                ? 'منصة تجارة إلكترونية مستقلة تجمع بين التصميم المعماري الهادئ وأحدث صيحات الموضة من شبكة شي إن للمسوقين.'
                : 'Curated modern lifestyle essentials and authenticated SHEIN affiliate trend highlights delivered with architectural calm.'}
            </p>
            <div className="pt-2 text-[11px] text-neutral-500 font-mono">
              Currency: USD ($) · English & Arabic RTL
            </div>
          </div>

          {/* Quick Departments */}
          <div>
            <h4 className="font-semibold text-white uppercase tracking-wider text-[11px] mb-3">
              {language === 'ar' ? 'الأقسام' : 'Departments'}
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => navigate('catalog')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {t('allProducts')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('shein-deals')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {t('sheinDeals')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('catalog', { category: 'cat-fashion' })}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {language === 'ar' ? 'الأزياء والملابس' : 'Apparel & Outwear'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('catalog', { category: 'cat-home' })}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {language === 'ar' ? 'المنزل والديكور' : 'Home & Living'}
                </button>
              </li>
            </ul>
          </div>

          {/* Platform & Governance */}
          <div>
            <h4 className="font-semibold text-white uppercase tracking-wider text-[11px] mb-3">
              {language === 'ar' ? 'الإدارة والتقنية' : 'Platform'}
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => navigate('admin-overview')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {t('admin')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('admin-shein')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {t('adminSheinHub')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('admin-settings')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {t('adminSettings')}
                </button>
              </li>
              <li className="text-[11px] text-neutral-500 pt-1">
                Netlify Ready · Supabase DB
              </li>
            </ul>
          </div>

          {/* Editorial Dispatch Newsletter */}
          <div>
            <h4 className="font-semibold text-white uppercase tracking-wider text-[11px] mb-3">
              {language === 'ar' ? 'النشرة البريدية' : 'Editorial Dispatch'}
            </h4>
            <p className="text-neutral-400 text-xs mb-3 leading-relaxed">
              {language === 'ar'
                ? 'احصل على إشعارات العروض الحصرية وتخفيضات شي إن الموسمية.'
                : 'Receive private notifications on seasonal drops and curated affiliate deals.'}
            </p>
            {subscribed ? (
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs py-2">
                <Check className="w-4 h-4" />
                <span>Subscribed successfully</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="flex-1 bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 px-3 py-2 rounded-lg text-xs focus:outline-hidden focus:border-neutral-500"
                  required
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-white text-neutral-900 font-semibold rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer shrink-0"
                  aria-label="Subscribe"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Affiliate Disclosure & Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-neutral-800 text-[11px] text-neutral-500 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="max-w-2xl leading-relaxed text-center md:text-left">
            {t('affiliateDisclaimerFooter')}
          </p>
          <div className="shrink-0">
            © {new Date().getFullYear()} {t('brandName')}. {t('allRightsReserved')}
          </div>
        </div>
      </div>
    </footer>
  );
};
