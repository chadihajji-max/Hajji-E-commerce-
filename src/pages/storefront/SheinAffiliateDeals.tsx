import React, { useState, useEffect } from 'react';
import { Sparkles, ExternalLink, Copy, Check, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react';
import { Product, AffiliateLink } from '../../types';
import { StorageService } from '../../services/storage';
import { useLanguage } from '../../context/LanguageContext';
import { useRouter } from '../../context/RouterContext';
import { buildSheinAffiliateUrl, createAffiliateClickRecord } from '../../services/sheinAffiliate';
import { LoadingState } from '../../components/common/LoadingState';
import { useToast } from '../../context/ToastContext';

export const SheinAffiliateDeals: React.FC = () => {
  const [sheinProducts, setSheinProducts] = useState<Product[]>([]);
  const [affiliateLinks, setAffiliateLinks] = useState<AffiliateLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [customUrl, setCustomUrl] = useState('');
  const [convertedUrl, setConvertedUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const { t, language, isRtl } = useLanguage();
  const { navigate } = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    const loadSheinData = async () => {
      try {
        setLoading(true);
        const [prods, links] = await Promise.all([
          StorageService.getProducts(),
          StorageService.getAffiliateLinks(),
        ]);
        setSheinProducts(prods.filter(p => p.is_shein_affiliate));
        setAffiliateLinks(links);
      } catch (err) {
        console.error('Failed to load SHEIN deals:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSheinData();
  }, []);

  const handleProductRedirect = async (product: Product) => {
    const log = createAffiliateClickRecord(product);
    await StorageService.recordAffiliateClick(log);
    showToast(t('trackClickSuccess'), 'info');
    if (product.shein_affiliate_url) {
      window.open(product.shein_affiliate_url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleConvertUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;
    const formatted = buildSheinAffiliateUrl({
      url: customUrl.trim(),
      subId: 'buyer_custom_link'
    });
    setConvertedUrl(formatted);
    showToast('Affiliate link created with partner tags!', 'success');
  };

  const copyConverted = () => {
    navigator.clipboard.writeText(convertedUrl);
    setCopiedLink(true);
    showToast(t('sheinLinkCopied'), 'success');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Header Spotlight */}
      <div className="bg-neutral-900 text-white rounded-2xl p-8 sm:p-12 relative overflow-hidden border border-neutral-800">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-neutral-800 text-neutral-300 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>AUTHENTICATED SHEIN AFFILIATE PORTAL</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            {t('sheinDealsTitle')}
          </h1>

          <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed">
            {t('sheinDealsSubtitle')}
          </p>

          <div className="p-4 bg-neutral-800/80 rounded-xl border border-neutral-700/60 text-xs text-neutral-300 flex items-start gap-3 mt-4">
            <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {t('affiliateDisclosureNotice')}
            </p>
          </div>
        </div>
      </div>

      {/* Featured SHEIN Products Grid */}
      <div className="space-y-6">
        <div className="flex justify-between items-end border-b border-neutral-200 pb-4">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">
              {language === 'ar' ? 'تصاميم شي إن الرائجة المختارة' : 'Trending SHEIN Wardrobe Essentials'}
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Curated by Aura stylists with direct tracked affiliate links
            </p>
          </div>
          <span className="text-xs font-mono text-neutral-500">
            {sheinProducts.length} items
          </span>
        </div>

        {loading ? (
          <LoadingState variant="cards" count={3} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sheinProducts.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-neutral-200 overflow-hidden flex flex-col justify-between hover:border-neutral-300 transition-all duration-200 shadow-2xs"
              >
                <div className="relative aspect-[4/3] bg-neutral-100 overflow-hidden">
                  <img
                    src={item.image_url}
                    alt={item.title_en}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2.5 left-2.5 bg-neutral-900/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded">
                    Verified SHEIN Item
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex justify-between items-center text-[11px] text-neutral-400 font-mono mb-1">
                      <span>{item.shein_product_id || item.sku}</span>
                      <span className="text-amber-700 font-semibold">{item.shein_commission_rate || 15}% Est. Commission</span>
                    </div>
                    <h3 className="text-sm font-bold text-neutral-900 leading-snug">
                      {language === 'ar' ? item.title_ar : item.title_en}
                    </h3>
                    <p className="text-xs text-neutral-600 line-clamp-2 mt-2 leading-relaxed">
                      {language === 'ar' ? item.description_ar : item.description_en}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                    <div>
                      <span className="text-base font-extrabold font-mono text-neutral-900">
                        ${item.price.toFixed(2)}
                      </span>
                      {item.compare_at_price && (
                        <span className="text-xs font-mono text-neutral-400 line-through ml-2">
                          ${item.compare_at_price.toFixed(2)}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleProductRedirect(item)}
                      className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <span>{t('buyOnShein')}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Featured Affiliate Collections / Links */}
      <div className="space-y-4 pt-4">
        <h3 className="text-base font-bold text-neutral-900">
          {language === 'ar' ? 'حملات وروابط تابعة نشطة' : 'Direct Curated SHEIN Campaign Links'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {affiliateLinks.map((link) => (
            <div key={link.id} className="p-4 bg-white rounded-xl border border-neutral-200 flex items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-neutral-900">{link.title}</h4>
                <div className="flex items-center gap-2 text-[11px] text-neutral-500 font-mono mt-1">
                  <span>Sub-ID: {link.sub_id || 'default'}</span>
                  <span>·</span>
                  <span>{link.clicks} tracked clicks</span>
                </div>
              </div>
              <button
                onClick={() => {
                  window.open(link.affiliate_url, '_blank', 'noopener,noreferrer');
                }}
                className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 cursor-pointer shrink-0"
              >
                <span>Visit Deals</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Link Converter Box */}
      <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-xl space-y-4">
        <div>
          <h3 className="text-sm font-bold text-neutral-900">
            {language === 'ar' ? 'توليد رابط ترويجي لأي منتج من شي إن' : 'SHEIN URL Affiliate Formatter'}
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Paste any SHEIN item link to automatically attach Aura affiliate publisher ID & sub-ID tracking.
          </p>
        </div>

        <form onSubmit={handleConvertUrl} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="https://us.shein.com/goods-p-..."
            className="flex-1 bg-white border border-neutral-200 px-3 py-2 text-xs rounded-lg focus:outline-hidden focus:border-neutral-900 font-mono"
            required
          />
          <button
            type="submit"
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0"
          >
            {language === 'ar' ? 'توليد الرابط' : 'Format Affiliate Link'}
          </button>
        </form>

        {convertedUrl && (
          <div className="p-3 bg-white border border-neutral-200 rounded-lg flex items-center justify-between gap-3">
            <span className="text-[11px] font-mono text-neutral-600 truncate flex-1">
              {convertedUrl}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={copyConverted}
                className="p-1.5 text-neutral-600 hover:text-neutral-900 border border-neutral-200 rounded hover:bg-neutral-50 transition-colors cursor-pointer"
                title="Copy formatted link"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <a
                href={convertedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-neutral-600 hover:text-neutral-900 border border-neutral-200 rounded hover:bg-neutral-50 transition-colors cursor-pointer"
                title="Open link"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
