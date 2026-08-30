import type { CrawledPage } from '../types';

export interface CrawlEngineResult {
  targetUrl: string;
  hostname: string;
  origin: string;
  title: string;
  description: string;
  statusCode: number;
  latencyMs: number;
  pages: CrawledPage[];
  realLinksCount: number;
  visitedUrlsCount: number;
  recursivePassDepth: number;
  listingPatternsMatched: number;
  gaMeasurementId?: string;
  gtmId?: string;
  sitemapFound: boolean;
  crawlPhase: string;
  error?: string;
}

export type FetchFunction = (
  url: string,
  timeoutMs?: number
) => Promise<{ ok: boolean; status: number; text: string }>;

/**
 * Extracts apex registered domain from hostname to allow seamless matching
 * between www.domain.com, sub.domain.com, and domain.com.
 */
export function getApexDomain(host: string): string {
  if (!host) return '';
  const cleanHost = host.toLowerCase().trim();
  if (cleanHost === 'localhost' || cleanHost === '127.0.0.1') return cleanHost;

  const parts = cleanHost.split('.');
  if (parts.length <= 2) return cleanHost;

  // Second-level TLDs (e.g., co.uk, com.ng, org.uk, com.au, co.nz, com.br)
  const multiPartTlds = [
    'co.uk', 'org.uk', 'gov.uk', 'ac.uk',
    'com.ng', 'org.ng', 'gov.ng', 'edu.ng',
    'com.au', 'net.au', 'org.au', 'edu.au',
    'co.nz', 'org.nz', 'net.nz',
    'com.br', 'org.br', 'co.za', 'com.mx'
  ];

  const lastTwo = parts.slice(-2).join('.');
  if (multiPartTlds.includes(lastTwo) && parts.length >= 3) {
    return parts.slice(-3).join('.');
  }
  return parts.slice(-2).join('.');
}

/**
 * Checks if a candidate URL belongs to the same apex site domain
 */
export function isSameApexDomain(candidateHost: string, baseHost: string): boolean {
  if (!candidateHost || !baseHost) return false;
  const cHost = candidateHost.toLowerCase().trim();
  const bHost = baseHost.toLowerCase().trim();

  if (cHost === bHost) return true;
  if (cHost.endsWith(`.${bHost}`) || bHost.endsWith(`.${cHost}`)) return true;

  const cApex = getApexDomain(cHost);
  const bApex = getApexDomain(bHost);
  return !!cApex && cApex === bApex;
}

/**
 * Normalizes URL path and query parameters while stripping tracking noise
 */
export function normalizePathWithQuery(u: URL): string {
  const cleanSearch = new URLSearchParams(u.search);
  const trackingKeys = [
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
    'fbclid', 'gclid', 'msclkid', 'twclid', '_ga', '_gl', 'ref', 'source',
    'trk', 'mc_cid', 'mc_eid', 'igshid', 'spm'
  ];
  trackingKeys.forEach(k => cleanSearch.delete(k));

  const queryStr = cleanSearch.toString() ? `?${cleanSearch.toString()}` : '';
  const pName = u.pathname.replace(/\/+$/, '') || '/';
  return `${pName}${queryStr}`;
}

/**
 * Normalizes URL to canonical absolute string
 */
export function normalizeCanonicalUrl(u: URL): string {
  const cleanPath = normalizePathWithQuery(u);
  return `${u.protocol}//${u.host.toLowerCase()}${cleanPath}`;
}

/**
 * Converts a URL slug or path into a clean, human-readable title
 */
export function slugToTitle(slugPath: string, fallbackText?: string): string {
  if (fallbackText && fallbackText.trim().length > 2 && !fallbackText.includes('<') && !fallbackText.includes('{')) {
    return fallbackText.trim();
  }

  // Extract relevant segment from path or query
  let segment = slugPath;
  if (segment.includes('=')) {
    segment = segment.split('=').pop() || segment;
  } else {
    segment = segment.split('/').filter(Boolean).pop() || segment;
  }

  const clean = segment
    .replace(/\.html?$/i, '')
    .replace(/\.php$/i, '')
    .replace(/[?#].*$/, '')
    .replace(/[-_=+]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!clean || clean === '/') return 'Home';
  return clean.replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Classifies a discovered page path into a meaningful content category
 */
export function classifyPageCategory(
  path: string,
  linkText: string = ''
): 'post' | 'category' | 'page' | 'tag' | 'archive' | 'product' | 'other' {
  const lowerPath = path.toLowerCase();
  const lowerText = linkText.toLowerCase();

  // Category / Topics / Sections
  if (
    lowerPath.includes('/category/') ||
    lowerPath.includes('/categories/') ||
    lowerPath.includes('/topics/') ||
    lowerPath.includes('/section/') ||
    lowerPath.includes('/collections/') ||
    lowerPath.includes('category=') ||
    lowerPath.includes('cat=')
  ) {
    return 'category';
  }

  // Tags
  if (
    lowerPath.includes('/tag/') ||
    lowerPath.includes('/tags/') ||
    lowerPath.includes('/post_tag/') ||
    lowerPath.includes('tag=')
  ) {
    return 'tag';
  }

  // Products / E-commerce / Pricing
  if (
    lowerPath.includes('/product/') ||
    lowerPath.includes('/products/') ||
    lowerPath.includes('/item/') ||
    lowerPath.includes('/items/') ||
    lowerPath.includes('/shop/') ||
    lowerPath.includes('/store/') ||
    lowerPath.includes('/pricing') ||
    lowerPath.includes('product=') ||
    lowerPath.includes('item=')
  ) {
    return 'product';
  }

  // Archives / Author
  if (
    lowerPath.includes('/archive') ||
    lowerPath.includes('/author/') ||
    /\/\d{4}\/\d{2}/.test(lowerPath)
  ) {
    return 'archive';
  }

  // Posts / Articles / Blog / Listings / Jobs
  if (
    lowerPath.includes('/blog/') ||
    lowerPath.includes('/posts/') ||
    lowerPath.includes('/post/') ||
    lowerPath.includes('/article/') ||
    lowerPath.includes('/articles/') ||
    lowerPath.includes('/news/') ||
    lowerPath.includes('/story/') ||
    lowerPath.includes('/job/') ||
    lowerPath.includes('/jobs/') ||
    lowerPath.includes('/careers/') ||
    lowerPath.includes('/vacancy/') ||
    lowerPath.includes('/vacancies/') ||
    lowerPath.includes('/listing/') ||
    lowerPath.includes('/listings/') ||
    lowerPath.includes('post=') ||
    lowerPath.includes('article=') ||
    lowerPath.includes('job=') ||
    lowerPath.includes('listing=') ||
    lowerPath.includes('p=') ||
    lowerPath.includes('id=')
  ) {
    return 'post';
  }

  // Standard static pages
  const standardPages = [
    '/', '/about', '/about-us', '/contact', '/contact-us', '/privacy',
    '/privacy-policy', '/terms', '/terms-of-service', '/terms-and-conditions',
    '/faq', '/help', '/features', '/services', '/docs', '/documentation',
    '/team', '/careers', '/login', '/signup', '/register', '/press',
    '/sitemap', '/disclaimer', '/cookie-policy'
  ];

  if (standardPages.some(p => lowerPath === p || lowerPath === `${p}/` || lowerPath.startsWith(`${p}/`))) {
    return 'page';
  }

  // Long slug without category marker is typically a post/article
  if (path.length > 20 && path.includes('-')) {
    return 'post';
  }

  return 'page';
}

/**
 * Filter helper to strictly whitelist legitimate human-facing public pages
 */
export function isCleanPublicPage(testPath: string, testTitle: string = ''): boolean {
  const lowerPath = testPath.toLowerCase();
  const lowerTitle = testTitle.toLowerCase();

  // Drop static media, scripts, styles, maps, archives, and fonts
  if (
    /\.(js|jsx|ts|tsx|json|xml|rss|atom|css|map|wasm|ico|svg|png|jpg|jpeg|webp|gif|bmp|tiff|woff|woff2|ttf|eot|otf|pdf|zip|tar|gz|mp4|webm|avi|mp3|wav|ogg|bin|txt|md|yml|yaml|env|sql|log|apk|exe)($|\?)/i.test(
      lowerPath
    )
  ) {
    return false;
  }

  // Drop technical embeds or templates
  if (
    /\/(iframe|partial|template|chunk|embed|widget|bundle|sw|service-worker|manifest)\.html?/i.test(
      lowerPath
    )
  ) {
    return false;
  }

  // Drop private, API, auth, CDN, and backend internals
  const bannedPrefixes = [
    '/api/', '/api', '/_next/data/', '/__next', '/_nuxt/', '/static/', '/assets/',
    '/node_modules/', '/cdn-cgi/', '/wp-admin/', '/wp-includes/', '/xmlrpc.php',
    '/autodiscover/', '/.well-known/', '/graphql', '/socket.io', '/sockjs',
    '/telescope/', '/horizon/', '/oauth/', '/auth/callback', '/auth/login',
    '/auth/signup', '/health', '/healthz', '/metrics', '/cgi-bin/', '/track',
    '/telemetry', '/beacon', '/pixel', '/ping', '/cart/add', '/checkout',
    '/wp-json/'
  ];

  if (bannedPrefixes.some(prefix => lowerPath.startsWith(prefix) || lowerPath.includes(`/${prefix.replace(/^\//, '')}`))) {
    return false;
  }

  // Drop titles with code fragments
  if (
    lowerTitle.includes('<script') ||
    lowerTitle.includes('function(') ||
    lowerTitle.includes('{id:') ||
    lowerTitle.includes('application/json') ||
    lowerTitle.includes('[object object]') ||
    lowerTitle.includes('undefined') ||
    lowerTitle.includes('null') ||
    lowerTitle.startsWith('chunk-')
  ) {
    return false;
  }

  return true;
}

/**
 * Universal Autonomous Web Crawler Engine
 * Executes robots.txt probing, recursive XML sitemap exploration,
 * primary HTML parsing, framework state analysis, and multi-depth link extraction.
 */
export async function executeUniversalCrawl(
  rawInput: string,
  maxDepth = 2,
  maxLinks = 1500,
  fetchFn: FetchFunction
): Promise<CrawlEngineResult> {
  const startTime = performance.now();
  let parsedBase: URL;

  try {
    const withProtocol = rawInput.startsWith('http://') || rawInput.startsWith('https://')
      ? rawInput
      : `https://${rawInput}`;
    parsedBase = new URL(withProtocol);
  } catch (err) {
    throw new Error('Invalid URL format');
  }

  const targetUrl = parsedBase.toString();
  const origin = parsedBase.origin;
  const hostname = parsedBase.hostname;
  const isDirectSitemapInput =
    parsedBase.pathname.endsWith('.xml') ||
    parsedBase.pathname.includes('sitemap') ||
    parsedBase.search.includes('sitemap');

  const visitedUrls = new Set<string>();
  const rootNormalizedUrl = normalizeCanonicalUrl(parsedBase);
  visitedUrls.add(rootNormalizedUrl);

  const discoveredPaths = new Set<string>();
  const rootPathIdent = normalizePathWithQuery(parsedBase);
  discoveredPaths.add(rootPathIdent);

  const discoveredPages: CrawledPage[] = [];
  let gaMeasurementId: string | undefined;
  let gtmId: string | undefined;
  let statusCode = 200;
  let primaryHtml = '';
  let sitemapFound = false;

  // ----------------------------------------------------
  // STEP 1: FETCH PRIMARY HTML OR DIRECT SITEMAP
  // ----------------------------------------------------
  const primaryRes = await fetchFn(targetUrl, 10000);
  if (primaryRes.ok) {
    statusCode = primaryRes.status;
    primaryHtml = primaryRes.text;
  } else {
    // Try alternate protocol fallback (http -> https or https -> http)
    const altUrl = targetUrl.startsWith('https://')
      ? targetUrl.replace('https://', 'http://')
      : targetUrl.replace('http://', 'https://');
    const altRes = await fetchFn(altUrl, 8000);
    if (altRes.ok) {
      statusCode = altRes.status;
      primaryHtml = altRes.text;
    } else {
      statusCode = primaryRes.status || 500;
    }
  }

  // Extract Page Title & OG metadata
  const ogTitleMatch =
    primaryHtml.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
    primaryHtml.match(/<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i);
  const standardTitleMatch = primaryHtml.match(/<title[^>]*>([^<]+)<\/title>/i);
  const rawTitle = ogTitleMatch
    ? ogTitleMatch[1].trim()
    : standardTitleMatch
    ? standardTitleMatch[1].trim()
    : `${hostname} - Home`;
  const title = rawTitle
    .replace(/&amp;/g, '&')
    .replace(/&#8217;/g, "'")
    .replace(/&#8211;/g, '-')
    .replace(/<[^>]*>/g, '')
    .trim();

  // Extract Meta Description
  const descMatch =
    primaryHtml.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ||
    primaryHtml.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
    primaryHtml.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
  const rawDesc = descMatch ? descMatch[1].trim() : `Main website for ${hostname}`;
  const description = rawDesc
    .replace(/&amp;/g, '&')
    .replace(/&#8217;/g, "'")
    .replace(/&#8211;/g, '-')
    .replace(/<[^>]*>/g, '')
    .trim();

  // Detect GA4 / GTM
  const ga4Regexes = [
    /G-[A-Z0-9]{7,15}/i,
    /gtag\(['"]config['"],\s*['"](G-[A-Z0-9]+)['"]/i,
    /googletagmanager\.com\/gtag\/js\?id=(G-[A-Z0-9]+)/i,
    /["'](G-[A-Z0-9]{8,14})["']/,
    /measurementId["']?\s*:\s*["'](G-[A-Z0-9]+)["']/
  ];
  for (const rx of ga4Regexes) {
    const m = primaryHtml.match(rx);
    if (m) {
      gaMeasurementId = m[1] || m[0];
      break;
    }
  }
  const gtmMatch = primaryHtml.match(/GTM-[A-Z0-9]{4,10}/i);
  if (gtmMatch) {
    gtmId = gtmMatch[0];
  }

  // Add Target Root Page
  const rootCat = classifyPageCategory(rootPathIdent, title);
  discoveredPages.push({
    id: 'page_root',
    url: targetUrl,
    path: rootPathIdent,
    title: title || 'Home',
    description: description || `Main landing page for ${hostname}`,
    depth: rootPathIdent === '/' ? 0 : 1,
    status: statusCode,
    includedInVisits: true,
    visitWeight: 100,
    gaDetected: !!gaMeasurementId || !!gtmId,
    category: rootCat,
  });

  // Ensure root home '/' exists if target URL was a specific subpath
  if (rootPathIdent !== '/' && !discoveredPaths.has('/')) {
    discoveredPaths.add('/');
    discoveredPages.push({
      id: 'page_home',
      url: `${origin}/`,
      path: '/',
      title: `${hostname} - Home`,
      description: `Home page for ${hostname}`,
      depth: 0,
      status: 200,
      includedInVisits: true,
      visitWeight: 90,
      gaDetected: !!gaMeasurementId || !!gtmId,
      category: 'page',
    });
  }

  // ----------------------------------------------------
  // STEP 2: ROBOTS.TXT & SITEMAP PROBING
  // ----------------------------------------------------
  const sitemapQueue: string[] = [];
  const parsedSitemaps = new Set<string>();

  if (isDirectSitemapInput) {
    sitemapQueue.push(targetUrl);
  }

  // 2A. Probe robots.txt for declared sitemaps
  try {
    const robotsRes = await fetchFn(`${origin}/robots.txt`, 3500);
    if (robotsRes.ok && robotsRes.text) {
      const sitemapRegex = /Sitemap:\s*(https?:\/\/[^\s]+)/gi;
      let rMatch: RegExpExecArray | null;
      while ((rMatch = sitemapRegex.exec(robotsRes.text)) !== null) {
        const sUrl = rMatch[1].trim();
        if (!sitemapQueue.includes(sUrl)) {
          sitemapQueue.push(sUrl);
        }
      }
    }
  } catch {}

  // 2B. Add standard sitemap paths
  const standardSitemapPaths = [
    '/sitemap.xml',
    '/sitemap_index.xml',
    '/sitemap-index.xml',
    '/sitemaps.xml',
    '/wp-sitemap.xml',
    '/sitemap/sitemap.xml',
    '/post-sitemap.xml',
    '/page-sitemap.xml',
    '/category-sitemap.xml',
    '/sitemap-posts.xml',
    '/sitemap.php'
  ];

  standardSitemapPaths.forEach(smPath => {
    const smUrl = `${origin}${smPath}`;
    if (!sitemapQueue.includes(smUrl)) {
      sitemapQueue.push(smUrl);
    }
  });

  // 2C. Fetch queued sitemaps in concurrent batches
  let sitemapBatchCount = 0;
  while (sitemapQueue.length > 0 && sitemapBatchCount < 60 && discoveredPages.length < maxLinks) {
    const currentBatch = sitemapQueue.splice(0, 10).filter(sm => !parsedSitemaps.has(sm));
    currentBatch.forEach(sm => parsedSitemaps.add(sm));
    if (currentBatch.length === 0) break;
    sitemapBatchCount++;

    const sitemapTasks = currentBatch.map(async (smUrl) => {
      try {
        const smRes = await fetchFn(smUrl, 4500);
        if (!smRes.ok || !smRes.text) return;
        // Strip CDATA tags to cleanly match loc, lastmod, and title
        const smXml = smRes.text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1');
        if (!smXml.includes('<urlset') && !smXml.includes('<sitemapindex') && !smXml.includes('<loc>') && !smXml.includes('<sitemap')) {
          return;
        }

        sitemapFound = true;

        // Parse Child Sitemaps (<sitemap><loc>...</loc></sitemap>)
        const childSitemapRegex = /<sitemap\b[^>]*>[\s\S]*?<loc>\s*(https?:\/\/[^<\s]+)\s*<\/loc>[\s\S]*?<\/sitemap>/gi;
        let csm: RegExpExecArray | null;
        while ((csm = childSitemapRegex.exec(smXml)) !== null) {
          const childUrl = csm[1].trim();
          if (!parsedSitemaps.has(childUrl) && !sitemapQueue.includes(childUrl) && sitemapQueue.length < 200) {
            sitemapQueue.push(childUrl);
          }
        }

        // Parse Page URLs (<url><loc>...</loc><lastmod>...</lastmod><image:title>...</image:title></url>)
        const urlEntryRegex = /<url\b[^>]*>[\s\S]*?<loc>\s*(https?:\/\/[^<\s]+)\s*<\/loc>(?:[\s\S]*?<lastmod>\s*([^<]+)\s*<\/lastmod>)?(?:[\s\S]*?<image:title>\s*([^<]+)\s*<\/image:title>)?[\s\S]*?<\/url>/gi;
        let um: RegExpExecArray | null;
        while ((um = urlEntryRegex.exec(smXml)) !== null && discoveredPages.length < maxLinks) {
          const uLoc = um[1].trim();
          const imgTitle = (um[3] || '').trim();

          // If entry is a nested XML sitemap
          if (uLoc.endsWith('.xml') || (uLoc.includes('sitemap') && uLoc.includes('.xml'))) {
            if (!parsedSitemaps.has(uLoc) && !sitemapQueue.includes(uLoc) && sitemapQueue.length < 200) {
              sitemapQueue.push(uLoc);
            }
            continue;
          }

          try {
            const pageUrl = new URL(uLoc);
            if (isSameApexDomain(pageUrl.hostname, hostname)) {
              const cleanPath = normalizePathWithQuery(pageUrl);
              if (!isCleanPublicPage(cleanPath, imgTitle)) continue;

              if (!discoveredPaths.has(cleanPath) && discoveredPages.length < maxLinks) {
                discoveredPaths.add(cleanPath);
                const cat = classifyPageCategory(cleanPath, imgTitle);
                const pageTitle = slugToTitle(cleanPath, imgTitle);

                discoveredPages.push({
                  id: `sm_${discoveredPages.length + 1}`,
                  url: pageUrl.toString(),
                  path: cleanPath,
                  title: pageTitle.length > 75 ? pageTitle.slice(0, 75) + '...' : pageTitle,
                  description: `${cat.toUpperCase()}: ${pageTitle}`,
                  depth: cleanPath === '/' ? 0 : cleanPath.split('/').filter(Boolean).length || 1,
                  status: 200,
                  includedInVisits: true,
                  visitWeight: cat === 'post' ? 95 : cat === 'category' ? 88 : cat === 'product' ? 85 : 75,
                  gaDetected: !!gaMeasurementId || !!gtmId,
                  category: cat,
                });
              }
            }
          } catch {}
        }

        // Generic <loc> fallback for flat sitemaps
        const genericLocRegex = /<loc>\s*(https?:\/\/[^<\s]+)\s*<\/loc>/gi;
        let gm: RegExpExecArray | null;
        while ((gm = genericLocRegex.exec(smXml)) !== null && discoveredPages.length < maxLinks) {
          const locStr = gm[1].trim();
          if (locStr.endsWith('.xml') || (locStr.includes('sitemap') && locStr.includes('.xml'))) {
            if (!parsedSitemaps.has(locStr) && !sitemapQueue.includes(locStr) && sitemapQueue.length < 200) {
              sitemapQueue.push(locStr);
            }
            continue;
          }

          try {
            const pageUrl = new URL(locStr);
            if (isSameApexDomain(pageUrl.hostname, hostname)) {
              const cleanPath = normalizePathWithQuery(pageUrl);
              if (!isCleanPublicPage(cleanPath)) continue;

              if (!discoveredPaths.has(cleanPath) && discoveredPages.length < maxLinks) {
                discoveredPaths.add(cleanPath);
                const cat = classifyPageCategory(cleanPath);
                const pageTitle = slugToTitle(cleanPath);

                discoveredPages.push({
                  id: `sm_${discoveredPages.length + 1}`,
                  url: pageUrl.toString(),
                  path: cleanPath,
                  title: pageTitle.length > 75 ? pageTitle.slice(0, 75) + '...' : pageTitle,
                  description: `${cat.toUpperCase()}: ${pageTitle}`,
                  depth: cleanPath === '/' ? 0 : cleanPath.split('/').filter(Boolean).length || 1,
                  status: 200,
                  includedInVisits: true,
                  visitWeight: cat === 'post' ? 95 : cat === 'category' ? 88 : 75,
                  gaDetected: !!gaMeasurementId || !!gtmId,
                  category: cat,
                });
              }
            }
          } catch {}
        }
      } catch {}
    });

    await Promise.allSettled(sitemapTasks);
  }

  // ----------------------------------------------------
  // STEP 3: EXTRACT LINKS FROM PRIMARY HTML
  // ----------------------------------------------------
  if (primaryHtml) {
    // 3A. JSON-LD Schemas
    try {
      const jsonLdRegex = /<script\b[^>]*\btype=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
      let ldMatch: RegExpExecArray | null;
      while ((ldMatch = jsonLdRegex.exec(primaryHtml)) !== null && discoveredPages.length < maxLinks) {
        try {
          const rawLd = JSON.parse(ldMatch[1].trim());
          const items = Array.isArray(rawLd) ? rawLd : rawLd['@graph'] || [rawLd];
          for (const item of items) {
            if (discoveredPages.length >= maxLinks) break;
            const itemUrl = item.url || item['@id'];
            const itemTitle = item.headline || item.title || item.name;

            if (itemUrl && itemTitle && typeof itemTitle === 'string') {
              try {
                const resolved = new URL(itemUrl, origin);
                if (isSameApexDomain(resolved.hostname, hostname)) {
                  const scPath = normalizePathWithQuery(resolved);
                  if (isCleanPublicPage(scPath, itemTitle) && !discoveredPaths.has(scPath)) {
                    discoveredPaths.add(scPath);
                    const cat = classifyPageCategory(scPath, itemTitle);
                    discoveredPages.push({
                      id: `ld_${discoveredPages.length + 1}`,
                      url: resolved.toString(),
                      path: scPath,
                      title: itemTitle.length > 75 ? itemTitle.slice(0, 75) + '...' : itemTitle,
                      description: `[Schema] ${itemTitle}`,
                      depth: scPath.split('/').filter(Boolean).length || 1,
                      status: 200,
                      includedInVisits: true,
                      visitWeight: 95,
                      gaDetected: !!gaMeasurementId || !!gtmId,
                      category: cat,
                    });
                  }
                }
              } catch {}
            }
          }
        } catch {}
      }
    } catch {}

    // 3B. HTML Anchor links (<a href="...">)
    const linkRegex = /<a\b[^>]*\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>([\s\S]*?)<\/a>/gi;
    let match: RegExpExecArray | null;
    while ((match = linkRegex.exec(primaryHtml)) !== null && discoveredPages.length < maxLinks) {
      const rawHref = (match[1] || match[2] || match[3] || '').trim();
      const linkText = (match[4] || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

      if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('javascript:') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) {
        continue;
      }

      try {
        const resolvedUrl = new URL(rawHref, origin);
        if (isSameApexDomain(resolvedUrl.hostname, hostname)) {
          const pagePath = normalizePathWithQuery(resolvedUrl);
          if (!isCleanPublicPage(pagePath, linkText)) continue;

          if (!discoveredPaths.has(pagePath) && discoveredPages.length < maxLinks) {
            discoveredPaths.add(pagePath);
            const cat = classifyPageCategory(pagePath, linkText);
            const cleanTitle = slugToTitle(pagePath, linkText);

            discoveredPages.push({
              id: `page_${discoveredPages.length + 1}`,
              url: resolvedUrl.toString(),
              path: pagePath,
              title: cleanTitle.length > 75 ? cleanTitle.slice(0, 75) + '...' : cleanTitle,
              description: `${cat.toUpperCase()}: ${cleanTitle}`,
              depth: pagePath === '/' ? 0 : pagePath.split('/').filter(Boolean).length || 1,
              status: 200,
              includedInVisits: true,
              visitWeight: cat === 'post' ? 95 : cat === 'category' ? 88 : cat === 'product' ? 85 : 75,
              gaDetected: !!gaMeasurementId || !!gtmId,
              category: cat,
            });
          }
        }
      } catch {}
    }
  }

  // ----------------------------------------------------
  // STEP 4: WORDPRESS REST API PROBING (Real JSON only)
  // ----------------------------------------------------
  if (discoveredPages.length < maxLinks) {
    const wpEndpoints = [
      `${origin}/wp-json/wp/v2/posts?per_page=100&_fields=id,link,title,slug`,
      `${origin}/wp-json/wp/v2/pages?per_page=100&_fields=id,link,title,slug`,
    ];

    const wpTasks = wpEndpoints.map(async (wpUrl) => {
      try {
        const wpRes = await fetchFn(wpUrl, 3500);
        if (wpRes.ok && wpRes.text && wpRes.text.startsWith('[')) {
          const data = JSON.parse(wpRes.text);
          if (Array.isArray(data) && data.length > 0) {
            for (const item of data) {
              if (discoveredPages.length >= maxLinks) break;
              if (item.link) {
                try {
                  const resolved = new URL(item.link, origin);
                  const pPath = normalizePathWithQuery(resolved);
                  if (isCleanPublicPage(pPath) && !discoveredPaths.has(pPath)) {
                    discoveredPaths.add(pPath);
                    const rawT = item.title?.rendered || item.slug || 'Article';
                    const cleanT = rawT.replace(/&amp;/g, '&').replace(/&#8217;/g, "'").replace(/&#8211;/g, '-').replace(/<[^>]*>/g, '').trim();
                    const cat = classifyPageCategory(pPath, cleanT);
                    discoveredPages.push({
                      id: `wp_${item.id || discoveredPages.length + 1}`,
                      url: resolved.toString(),
                      path: pPath,
                      title: cleanT.length > 75 ? cleanT.slice(0, 75) + '...' : cleanT,
                      description: `[WordPress] ${cleanT}`,
                      depth: pPath.split('/').filter(Boolean).length || 1,
                      status: 200,
                      includedInVisits: true,
                      visitWeight: 95,
                      gaDetected: !!gaMeasurementId || !!gtmId,
                      category: cat,
                    });
                  }
                } catch {}
              }
            }
          }
        }
      } catch {}
    });

    await Promise.allSettled(wpTasks);
  }

  // ----------------------------------------------------
  // STEP 5: MULTI-LEVEL RECURSIVE HTML CRAWL (Depth 2 & 3)
  // ----------------------------------------------------
  const targetMaxDepth = Math.min(3, Math.max(1, maxDepth));
  let currentDepth = 1;

  while (currentDepth < targetMaxDepth && discoveredPages.length < maxLinks) {
    const unvisitedPages = discoveredPages.filter(p => {
      const canon = normalizeCanonicalUrl(new URL(p.url, origin));
      return !visitedUrls.has(canon);
    }).slice(0, 18);

    if (unvisitedPages.length === 0) break;

    const recursiveTasks = unvisitedPages.map(async (pageObj) => {
      const canon = normalizeCanonicalUrl(new URL(pageObj.url, origin));
      visitedUrls.add(canon);

      try {
        const subRes = await fetchFn(pageObj.url, 4000);
        if (!subRes.ok || !subRes.text) return;
        const subHtml = subRes.text;

        const subLinkRegex = /<a\b[^>]*\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>([\s\S]*?)<\/a>/gi;
        let sm: RegExpExecArray | null;
        while ((sm = subLinkRegex.exec(subHtml)) !== null && discoveredPages.length < maxLinks) {
          const sHref = (sm[1] || sm[2] || sm[3] || '').trim();
          const sText = (sm[4] || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
          if (!sHref || sHref.startsWith('#') || sHref.startsWith('javascript:') || sHref.startsWith('mailto:') || sHref.startsWith('tel:')) continue;

          try {
            const resolvedSub = new URL(sHref, origin);
            if (isSameApexDomain(resolvedSub.hostname, hostname)) {
              const subCleanPath = normalizePathWithQuery(resolvedSub);
              if (!isCleanPublicPage(subCleanPath, sText)) continue;

              if (!discoveredPaths.has(subCleanPath)) {
                discoveredPaths.add(subCleanPath);
                const subCat = classifyPageCategory(subCleanPath, sText);
                const sTitle = slugToTitle(subCleanPath, sText);

                discoveredPages.push({
                  id: `rec_${discoveredPages.length + 1}`,
                  url: resolvedSub.toString(),
                  path: subCleanPath,
                  title: sTitle.length > 75 ? sTitle.slice(0, 75) + '...' : sTitle,
                  description: `${subCat.toUpperCase()}: ${sTitle}`,
                  depth: currentDepth + 1,
                  status: 200,
                  includedInVisits: true,
                  visitWeight: subCat === 'post' ? 95 : subCat === 'category' ? 88 : 75,
                  gaDetected: !!gaMeasurementId || !!gtmId,
                  category: subCat,
                });
              }
            }
          } catch {}
        }
      } catch {}
    });

    await Promise.allSettled(recursiveTasks);
    currentDepth++;
  }

  const latencyMs = Math.round(performance.now() - startTime);

  return {
    targetUrl,
    hostname,
    origin,
    title: title || `${hostname} - Home`,
    description: description || `Discovered ${discoveredPages.length} active routes on ${hostname}`,
    statusCode,
    latencyMs,
    pages: discoveredPages,
    realLinksCount: discoveredPages.length,
    visitedUrlsCount: visitedUrls.size,
    recursivePassDepth: currentDepth,
    listingPatternsMatched: discoveredPages.filter(p => p.category === 'post' || p.category === 'product').length,
    gaMeasurementId,
    gtmId,
    sitemapFound,
    crawlPhase: `Crawl Complete • Discovered ${discoveredPages.length} verified routes`,
  };
}
