import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ExternalLink, 
  Copy, 
  Check, 
  Calculator, 
  TrendingUp, 
  MousePointerClick, 
  ShieldCheck, 
  Plus 
} from 'lucide-react';
import { AffiliateLink, AffiliateClickLog } from '../../types';
import { StorageService } from '../../services/storage';
import { buildSheinAffiliateUrl, calculateEstimatedCommission } from '../../services/sheinAffiliate';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { LoadingState } from '../../components/common/LoadingState';

export const AdminSheinHub: React.FC = () => {
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [clicks, setClicks] = useState<AffiliateClickLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Link Generator form state
  const [title, setTitle] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [subId, setSubId] = useState('campaign_spring');
  const [campaign, setCampaign] = useState('spring_2026');
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // Commission Simulator state
  const [monthlyVisitors, setMonthlyVisitors] = useState(5000);
  const [conversionRate, setConversionRate] = useState(3.0); // 3%
  const [avgOrderVal, setAvgOrderVal] = useState(48.0); // $48
  const [commissionRate, setCommissionRate] = useState(14.0); // 14%

  const { t, language } = useLanguage();
  const { showToast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [l, c] = await Promise.all([
        StorageService.getAffiliateLinks(),
        StorageService.getAffiliateClicks(),
      ]);
      setLinks(l);
      setClicks(c);
    } catch (err) {
      console.error('Failed to load SHEIN hub data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGenerateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUrl.trim()) return;

    const formatted = buildSheinAffiliateUrl({
      url: targetUrl.trim(),
      subId: subId.trim() || 'default',
      campaign: campaign.trim() || undefined,
    });

    setGeneratedUrl(formatted);

    const newLink: AffiliateLink = {
      id: 'aff-' + Date.now().toString(36),
      title: title.trim() || 'Custom SHEIN Deal',
      original_shein_url: targetUrl.trim(),
      affiliate_url: formatted,
      aff_id: import.meta.env.VITE_SHEIN_AFFILIATE_ID || 'SHEIN_AFF_98421',
      sub_id: subId.trim() || 'default',
      campaign: campaign.trim(),
      clicks: 0,
      estimated_commission_rate: 15.0,
      created_at: new Date().toISOString(),
    };

    await StorageService.saveAffiliateLink(newLink);
    showToast('Tracked SHEIN Affiliate Link saved!', 'success');
    loadData();
  };

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    showToast(t('sheinLinkCopied'), 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  // Simulator calculation
  const estimatedOrders = Math.round((monthlyVisitors * conversionRate) / 100);
  const estimatedGrossGmv = estimatedOrders * avgOrderVal;
  const projectedCommission = (estimatedGrossGmv * commissionRate) / 100;

  if (loading) {
    return <LoadingState variant="table" count={4} />;
  }

  return (
    <div className="space-y-8">
      {/* Overview Banner */}
      <div className="bg-neutral-900 text-white p-6 sm:p-8 rounded-xl border border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-neutral-800 text-amber-400 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>SHEIN AFFILIATE PROGRAM ENGINE</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            {language === 'ar' ? 'إدارة الروابط التابعة وعمولات شي إن' : 'SHEIN Affiliate Integration & Campaign Manager'}
          </h2>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Generate authenticated affiliate links, monitor click traffic, inspect sub-ID performance, and calculate estimated commission revenues.
          </p>
        </div>

        <div className="bg-neutral-800 p-4 rounded-lg border border-neutral-700 text-xs space-y-1.5 shrink-0">
          <div className="text-neutral-400 font-mono text-[10px] uppercase">Publisher ID</div>
          <div className="font-mono font-bold text-white text-sm">
            {import.meta.env.VITE_SHEIN_AFFILIATE_ID || 'SHEIN_AFF_98421'}
          </div>
          <div className="text-[10px] text-emerald-400 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            <span>Active Publisher Credentials</span>
          </div>
        </div>
      </div>

      {/* Two Column: Link Generator + Commission Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Link Generator */}
        <div className="lg:col-span-6 bg-white p-6 rounded-xl border border-neutral-200 space-y-4">
          <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
            <Plus className="w-4 h-4 text-neutral-700" />
            <span>{t('generateLink')}</span>
          </h3>
          <p className="text-xs text-neutral-500">
            Paste any SHEIN collection or product page URL to create a tracked affiliate link with publisher and sub-ID tags.
          </p>

          <form onSubmit={handleGenerateLink} className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-neutral-700 block mb-1">Campaign Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Summer Linen Slip Drops"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:border-neutral-900"
              />
            </div>

            <div>
              <label className="font-semibold text-neutral-700 block mb-1">Original SHEIN URL *</label>
              <input
                type="url"
                required
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://us.shein.com/goods-p-..."
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-hidden focus:border-neutral-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Sub-ID (Tracking)</label>
                <input
                  type="text"
                  value={subId}
                  onChange={(e) => setSubId(e.target.value)}
                  placeholder="e.g. ig_story_01"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-hidden focus:border-neutral-900"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Campaign Name</label>
                <input
                  type="text"
                  value={campaign}
                  onChange={(e) => setCampaign(e.target.value)}
                  placeholder="e.g. spring_promo"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-hidden focus:border-neutral-900"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Generate & Save Tracked Link
            </button>
          </form>

          {generatedUrl && (
            <div className="mt-3 p-3 bg-neutral-50 border border-neutral-200 rounded-lg space-y-2">
              <span className="text-[10px] uppercase font-mono text-neutral-400 block">Generated Tracked URL</span>
              <p className="text-[11px] font-mono text-neutral-700 break-all leading-tight">
                {generatedUrl}
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => copyLink(generatedUrl)}
                  className="px-3 py-1 bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-700 text-xs font-medium rounded flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy</span>
                </button>
                <a
                  href={generatedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-700 text-xs font-medium rounded flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Test Link</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Commission Revenue Simulator */}
        <div className="lg:col-span-6 bg-white p-6 rounded-xl border border-neutral-200 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-neutral-700" />
              <span>SHEIN Affiliate Commission Simulator</span>
            </h3>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold">
              Live Projection
            </span>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between font-medium text-neutral-700 mb-1">
                <span>Monthly Storefront Visitors:</span>
                <span className="font-mono font-bold">{monthlyVisitors.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="500"
                max="50000"
                step="500"
                value={monthlyVisitors}
                onChange={(e) => setMonthlyVisitors(parseInt(e.target.value))}
                className="w-full accent-neutral-900"
              />
            </div>

            <div>
              <div className="flex justify-between font-medium text-neutral-700 mb-1">
                <span>Affiliate Conversion Rate:</span>
                <span className="font-mono font-bold">{conversionRate.toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="8.0"
                step="0.5"
                value={conversionRate}
                onChange={(e) => setConversionRate(parseFloat(e.target.value))}
                className="w-full accent-neutral-900"
              />
            </div>

            <div>
              <div className="flex justify-between font-medium text-neutral-700 mb-1">
                <span>Average SHEIN Cart Order Value:</span>
                <span className="font-mono font-bold">${avgOrderVal.toFixed(2)} USD</span>
              </div>
              <input
                type="range"
                min="20"
                max="120"
                step="2"
                value={avgOrderVal}
                onChange={(e) => setAvgOrderVal(parseFloat(e.target.value))}
                className="w-full accent-neutral-900"
              />
            </div>

            <div>
              <div className="flex justify-between font-medium text-neutral-700 mb-1">
                <span>Commission Tier:</span>
                <span className="font-mono font-bold">{commissionRate.toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min="8.0"
                max="20.0"
                step="1.0"
                value={commissionRate}
                onChange={(e) => setCommissionRate(parseFloat(e.target.value))}
                className="w-full accent-neutral-900"
              />
            </div>
          </div>

          {/* Projection Results */}
          <div className="pt-4 border-t border-neutral-100 grid grid-cols-2 gap-4">
            <div className="p-3 bg-neutral-50 rounded-lg">
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">Estimated Orders</span>
              <span className="text-base font-bold font-mono text-neutral-900">{estimatedOrders} orders/mo</span>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg">
              <span className="text-[10px] text-emerald-700 uppercase tracking-wider block">Projected Monthly Comm.</span>
              <span className="text-base font-extrabold font-mono text-emerald-800">
                ${projectedCommission.toFixed(2)} USD
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Active Affiliate Links Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-2xs">
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
            Tracked Campaigns & Deep Links ({links.length})
          </h3>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Campaign / Title</th>
                <th className="px-4 py-3">Sub-ID</th>
                <th className="px-4 py-3">Clicks</th>
                <th className="px-4 py-3">Tracked Link</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {links.map((link) => (
                <tr key={link.id} className="hover:bg-neutral-50/50">
                  <td className="px-4 py-3 font-semibold text-neutral-900">
                    {link.title}
                  </td>
                  <td className="px-4 py-3 font-mono text-neutral-500">
                    {link.sub_id || 'default'}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-neutral-900">
                    {link.clicks}
                  </td>
                  <td className="px-4 py-3 font-mono text-neutral-500 text-[11px] max-w-xs truncate">
                    {link.affiliate_url}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => copyLink(link.affiliate_url)}
                        className="p-1.5 text-neutral-500 hover:text-neutral-900 rounded hover:bg-neutral-100 transition-colors cursor-pointer"
                        title="Copy"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <a
                        href={link.affiliate_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-neutral-500 hover:text-neutral-900 rounded hover:bg-neutral-100 transition-colors cursor-pointer"
                        title="Open"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
