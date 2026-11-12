import { AffiliateClickLog, Product } from '../types';

export interface SheinUrlParams {
  url: string;
  affId?: string;
  subId?: string;
  campaign?: string;
}

const DEFAULT_AFF_ID = import.meta.env.VITE_SHEIN_AFFILIATE_ID || 'SHEIN_AFF_98421';
const DEFAULT_SUB_ID = import.meta.env.VITE_SHEIN_DEFAULT_SUBID || 'aura_campaign';

/**
 * Builds an authentic tracked SHEIN affiliate link with publisher and sub-ID parameters.
 */
export const buildSheinAffiliateUrl = ({
  url,
  affId = DEFAULT_AFF_ID,
  subId = DEFAULT_SUB_ID,
  campaign,
}: SheinUrlParams): string => {
  if (!url) return '';

  try {
    // If it's already a full URL or short link
    const cleanUrl = url.trim();
    const hasProtocol = cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://');
    const target = hasProtocol ? cleanUrl : `https://${cleanUrl}`;

    const parsed = new URL(target);
    
    // Append standard SHEIN affiliate parameters
    parsed.searchParams.set('aff_id', affId);
    if (subId) {
      parsed.searchParams.set('sub_id', subId);
    }
    if (campaign) {
      parsed.searchParams.set('utm_campaign', campaign);
    }
    parsed.searchParams.set('url_from', 'affiliate_partner');

    return parsed.toString();
  } catch {
    // Fallback if URL parsing fails
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}aff_id=${encodeURIComponent(affId)}&sub_id=${encodeURIComponent(subId)}`;
  }
};

/**
 * Estimates potential affiliate commission in USD.
 */
export const calculateEstimatedCommission = (price: number, commissionRatePercent: number = 12): number => {
  if (price <= 0 || commissionRatePercent <= 0) return 0;
  const commission = (price * commissionRatePercent) / 100;
  return Number(commission.toFixed(2));
};

/**
 * Prepares an affiliate tracking log entry before redirecting the buyer.
 */
export const createAffiliateClickRecord = (
  product?: Partial<Product>,
  customSubId?: string
): AffiliateClickLog => {
  const affUrl = product?.shein_affiliate_url || buildSheinAffiliateUrl({
    url: 'https://shein.com',
    subId: customSubId || product?.shein_sub_id || DEFAULT_SUB_ID
  });

  const estComm = product?.price 
    ? calculateEstimatedCommission(product.price, product.shein_commission_rate || 12)
    : 0;

  return {
    id: 'clk_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    product_id: product?.id,
    product_title: product?.title_en,
    affiliate_url: affUrl,
    sub_id: customSubId || product?.shein_sub_id || DEFAULT_SUB_ID,
    estimated_commission: estComm,
    created_at: new Date().toISOString(),
  };
};
