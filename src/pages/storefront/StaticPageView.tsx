import React, { useState, useEffect } from 'react';
import { FileText, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';
import { StaticPage } from '../../types';
import { DbService } from '../../services/dbService';
import { useLanguage } from '../../context/LanguageContext';
import { useRouter } from '../../context/RouterContext';
import { LoadingState } from '../../components/common/LoadingState';

export const StaticPageView: React.FC = () => {
  const [pages, setPages] = useState<StaticPage[]>([]);
  const [loading, setLoading] = useState(true);

  const { t, language, isRtl } = useLanguage();
  const { params, navigate } = useRouter();
  const slug = params.slug || 'about-us';

  useEffect(() => {
    const loadPages = async () => {
      try {
        setLoading(true);
        const data = await DbService.getPages();
        setPages(data);
      } catch (err) {
        console.error('Failed to load CMS pages:', err);
      } finally {
        setLoading(false);
      }
    };
    loadPages();
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <LoadingState variant="table" count={3} />
      </div>
    );
  }

  const activePage = pages.find(p => p.slug === slug) || pages[0];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <button
        onClick={() => navigate('home')}
        className="text-xs text-neutral-500 hover:text-neutral-900 flex items-center gap-1.5 cursor-pointer"
      >
        {isRtl ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
        <span>{isRtl ? 'العودة للرئيسية' : 'Back to Homepage'}</span>
      </button>

      {activePage ? (
        <article className="bg-white rounded-2xl border border-neutral-200 p-8 sm:p-12 shadow-2xs space-y-6">
          <div className="border-b border-neutral-200 pb-6 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">
              CMS Document · /{activePage.slug}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
              {isRtl ? activePage.title_ar : activePage.title_en}
            </h1>
          </div>

          <div className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap font-sans">
            {isRtl ? activePage.content_ar : activePage.content_en}
          </div>
        </article>
      ) : (
        <div className="text-center py-20 bg-white border border-neutral-200 rounded-2xl p-8">
          <FileText className="w-12 h-12 mx-auto text-neutral-300 mb-3" />
          <h3 className="text-base font-bold text-neutral-900">Document not found</h3>
          <p className="text-xs text-neutral-500 mt-1">The requested policy or info page is currently unpublished.</p>
        </div>
      )}
    </div>
  );
};
