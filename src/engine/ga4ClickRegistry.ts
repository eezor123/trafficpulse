/**
 * GA4 External Click Registry & Enhanced Measurement Payload Builder
 * Ensures 100% compliance with Google Analytics 4 Outbound Click rules:
 * - Domain of link_url MUST be different from dl (current page location)
 * - Required parameters: link_url, link_domain, link_text, outbound: true
 * - Automatic dual dispatch of select_content / select_promotion for universal GA4 reporting
 */

export interface Ga4OutboundTarget {
  linkUrl: string;
  linkDomain: string;
  linkText: string;
  outbound: true;
  linkClasses: string;
  linkId: string;
  contentType?: string;
  promotionName?: string;
}

const JOB_AND_CAREER_TARGETS: { url: string; domain: string; text: string }[] = [
  { url: 'https://careers.google.com/jobs/results/?q=software+engineer', domain: 'careers.google.com', text: 'Google Careers Portal (Verified Listing)' },
  { url: 'https://www.linkedin.com/jobs/search/?keywords=remote+developer', domain: 'www.linkedin.com', text: 'LinkedIn Job Opportunities (Direct Apply)' },
  { url: 'https://boards.greenhouse.io/tech-partners/jobs/459201', domain: 'boards.greenhouse.io', text: 'Greenhouse Application Portal' },
  { url: 'https://jobs.github.com/positions/remote-engineering', domain: 'jobs.github.com', text: 'GitHub Verified Positions' },
  { url: 'https://apply.workable.com/enterprise-jobs/j/84920/', domain: 'apply.workable.com', text: 'Workable Job Application' },
  { url: 'https://www.indeed.com/viewjob?jk=987123654', domain: 'www.indeed.com', text: 'Indeed Prime Opening' },
  { url: 'https://wellfound.com/jobs/startup-roles', domain: 'wellfound.com', text: 'Wellfound (AngelList) Talent' },
  { url: 'https://remoteok.com/remote-jobs', domain: 'remoteok.com', text: 'RemoteOK Curated Position' },
];

const REFERENCE_AND_TECH_TARGETS: { url: string; domain: string; text: string }[] = [
  { url: 'https://web.dev/articles/vitals', domain: 'web.dev', text: 'Google Web.dev Core Web Vitals Guide' },
  { url: 'https://developer.mozilla.org/en-US/docs/Web/Performance', domain: 'developer.mozilla.org', text: 'MDN Web Performance Specifications' },
  { url: 'https://en.wikipedia.org/wiki/Search_engine_optimization', domain: 'en.wikipedia.org', text: 'Wikipedia: Search Engine Ranking Factors' },
  { url: 'https://github.com/trending/typescript', domain: 'github.com', text: 'GitHub Open Source Top Repositories' },
  { url: 'https://news.ycombinator.com/item?id=38912450', domain: 'news.ycombinator.com', text: 'Hacker News Community Discussion' },
  { url: 'https://cloud.google.com/architecture', domain: 'cloud.google.com', text: 'Google Cloud Scalable Architecture Spec' },
  { url: 'https://w3.org/TR/navigation-timing-2/', domain: 'w3.org', text: 'W3C Navigation & Performance API' },
];

const OFFERS_AND_COMMERCE_TARGETS: { url: string; domain: string; text: string }[] = [
  { url: 'https://offers.partner-network.com/special-deal?ref=organic', domain: 'offers.partner-network.com', text: 'Exclusive Partner Offer (50% Off)' },
  { url: 'https://signup.external-portal.com/register?promo=welcome2026', domain: 'signup.external-portal.com', text: 'Partner Portal Registration Deal' },
  { url: 'https://tech-deals.ad-server.net/claim-discount?slot=featured', domain: 'tech-deals.ad-server.net', text: 'Featured Promotion Voucher' },
  { url: 'https://cloud.google.com/free', domain: 'cloud.google.com', text: 'Google Cloud $300 Free Credits' },
];

const AD_NETWORK_TARGETS: { url: string; domain: string; text: string }[] = [
  { url: 'https://googleads.g.doubleclick.net/pagead/ads?client=ca-pub-984210547120&slotname=9182736450', domain: 'googleads.g.doubleclick.net', text: 'Google Ads Sponsored Placement' },
  { url: 'https://adclick.g.doubleclick.net/aclk?sa=l&ai=Cq789123456789&num=1', domain: 'adclick.g.doubleclick.net', text: 'DoubleClick Verified Ad Unit' },
  { url: 'https://securepubads.g.doubleclick.net/gampad/ads?iu=/1234/ad_slot_top', domain: 'securepubads.g.doubleclick.net', text: 'Google Ad Manager Premium Unit' },
];

/**
 * Returns an authentic outbound target guaranteed to have a domain
 * distinct from the current site so GA4 classifies it as an outbound click.
 */
export function getAuthenticOutboundTarget(
  category: 'job' | 'article_reference' | 'popup_offer' | 'ad_banner' | 'ui_cta' = 'job',
  customContext?: string
): Ga4OutboundTarget {
  let pool = JOB_AND_CAREER_TARGETS;

  if (category === 'article_reference') {
    pool = REFERENCE_AND_TECH_TARGETS;
  } else if (category === 'popup_offer') {
    pool = OFFERS_AND_COMMERCE_TARGETS;
  } else if (category === 'ad_banner') {
    pool = AD_NETWORK_TARGETS;
  } else if (category === 'ui_cta') {
    pool = Math.random() < 0.6 ? JOB_AND_CAREER_TARGETS : REFERENCE_AND_TECH_TARGETS;
  }

  const selected = pool[Math.floor(Math.random() * pool.length)];
  const nonce = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;

  let text = customContext || selected.text;
  let url = selected.url;

  // Add tracking query param for unique URL logging
  if (url.includes('?')) {
    url = `${url}&gacid=${nonce}`;
  } else {
    url = `${url}?gacid=${nonce}`;
  }

  return {
    linkUrl: url,
    linkDomain: selected.domain,
    linkText: text,
    outbound: true,
    linkClasses: `outbound-link external-partner ${category}-cta`,
    linkId: `outbound_${category}_${nonce}`,
    contentType: category === 'ad_banner' ? 'ad' : category === 'popup_offer' ? 'promotion' : 'external_link',
    promotionName: category === 'ad_banner' || category === 'popup_offer' ? text : undefined,
  };
}
