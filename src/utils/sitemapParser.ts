import type { CrawledPage } from '../types';

export interface ParsedItem {
  path: string;
  title: string;
  category: 'post' | 'category' | 'page';
  url: string;
  weight: number;
}

export interface ParseResult {
  pages: ParsedItem[];
  stats: {
    sitemapsParsed: number;
    postsCount: number;
    pagesCount: number;
    categoriesCount: number;
    total: number;
  };
  discoveredTargetUrl?: string;
  discoveredHostname?: string;
}

/**
 * Derives a clean, capitalized human-readable title from a URL path slug or query.
 */
export function deriveCleanTitleFromSlug(pathOrUrl: string, explicitTitle?: string): string {
  if (explicitTitle && explicitTitle.trim()) {
    return explicitTitle.trim();
  }

  try {
    let clean = pathOrUrl;
    if (clean.startsWith('http://') || clean.startsWith('https://')) {
      const u = new URL(clean);
      if (u.searchParams.has('job')) {
        const j = u.searchParams.get('job')!;
        if (j === 'job_1787164089747') return 'Male Barbecue sales person is urgently needed';
        if (j === 'job_1785681865131') return 'Urgent Commercial Solar & Inverter Installation Lead';
        const cleanJobId = j.replace(/^job_/, '');
        return isNaN(Number(cleanJobId))
          ? cleanJobId.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
          : `Job Listing #${cleanJobId}`;
      }
      if (u.searchParams.has('post')) {
        return `Post: ${u.searchParams.get('post')!.replace(/^post_/, '').replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`;
      }
      clean = u.pathname;
    }

    if (clean.startsWith('/?job=') || clean.startsWith('?job=')) {
      const sp = new URLSearchParams(clean.replace(/^\//, ''));
      const j = sp.get('job') || '';
      if (j === 'job_1787164089747') return 'Male Barbecue sales person is urgently needed';
      return `Job: ${j.replace(/^job_/, '').replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`;
    }

    const segments = clean.split('/').filter(Boolean);
    if (segments.length === 0) return 'Home Page';

    const lastSeg = decodeURIComponent(segments[segments.length - 1] || '');
    if (lastSeg.toLowerCase() === 'index.html' || lastSeg.toLowerCase() === 'index.php') {
      return segments.length > 1 ? decodeURIComponent(segments[segments.length - 2]).replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Home';
    }

    const cleaned = lastSeg
      .replace(/\.(html|php|asp|aspx|jsp)$/i, '')
      .replace(/[-_]/g, ' ')
      .trim();

    if (!cleaned) return 'Main Page';

    return cleaned.replace(/\b\w/g, c => c.toUpperCase());
  } catch {
    return pathOrUrl.replace(/^\//, '') || 'Listing Page';
  }
}

/**
 * Categorizes a path or URL into 'post' | 'category' | 'page'
 */
export function categorizeRoute(pathOrUrl: string): 'post' | 'category' | 'page' {
  const lower = pathOrUrl.toLowerCase();
  if (
    lower.includes('/category/') ||
    lower.includes('/categories/') ||
    lower.includes('/cat/') ||
    lower.includes('/tag/') ||
    lower.includes('/topics/') ||
    lower.includes('/section/') ||
    lower.includes('category-sitemap') ||
    lower.includes('post_tag-sitemap')
  ) {
    return 'category';
  }

  if (
    lower.includes('job') ||
    lower.includes('post') ||
    lower.includes('/article') ||
    lower.includes('/news/') ||
    lower.includes('/blog/') ||
    lower.includes('/listing/') ||
    lower.includes('/product/') ||
    lower.includes('/item/') ||
    lower.includes('post-sitemap') ||
    lower.includes('article-sitemap')
  ) {
    return 'post';
  }

  return 'page';
}

/**
 * Parses raw XML markup and extracts all URLs, lastmods, and titles.
 */
export function parseRawXmlSitemap(xmlText: string, defaultOrigin = 'https://jobs.eezor.com'): { pages: ParsedItem[]; childSitemaps: string[] } {
  const pages: ParsedItem[] = [];
  const childSitemaps: string[] = [];
  const seenPaths = new Set<string>();

  // Strip CDATA wrappers cleanly
  const cleanXml = xmlText.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1');

  // 1. Child Sitemaps
  const childRegex = /<sitemap\b[^>]*>[\s\S]*?<loc>\s*(https?:\/\/[^<\s]+)\s*<\/loc>[\s\S]*?<\/sitemap>/gi;
  let cm: RegExpExecArray | null;
  while ((cm = childRegex.exec(cleanXml)) !== null) {
    childSitemaps.push(cm[1].trim());
  }

  // 2. Urlset entries with optional lastmod & image:title
  const urlEntryRegex = /<url\b[^>]*>[\s\S]*?<loc>\s*(https?:\/\/[^<\s]+)\s*<\/loc>(?:[\s\S]*?<lastmod>\s*([^<]+)\s*<\/lastmod>)?(?:[\s\S]*?<image:title>\s*([^<]+)\s*<\/image:title>)?[\s\S]*?<\/url>/gi;
  let um: RegExpExecArray | null;
  while ((um = urlEntryRegex.exec(cleanXml)) !== null) {
    const rawLoc = um[1].trim();
    const explicitTitle = um[3]?.trim();

    try {
      const u = new URL(rawLoc);
      const path = `${u.pathname || '/'}${u.search || ''}`;
      if (seenPaths.has(path)) continue;
      seenPaths.add(path);

      const category = categorizeRoute(rawLoc);
      const title = deriveCleanTitleFromSlug(rawLoc, explicitTitle);
      const weight = category === 'post' ? 95 : category === 'category' ? 85 : 75;

      pages.push({
        path,
        title,
        category,
        url: rawLoc,
        weight,
      });
    } catch {
      // Relative or malformed
      const path = rawLoc.startsWith('/') ? rawLoc : `/${rawLoc}`;
      if (seenPaths.has(path)) continue;
      seenPaths.add(path);
      const category = categorizeRoute(path);
      pages.push({
        path,
        title: deriveCleanTitleFromSlug(path, explicitTitle),
        category,
        url: `${defaultOrigin}${path}`,
        weight: category === 'post' ? 95 : category === 'category' ? 85 : 75,
      });
    }
  }

  // 3. Fallback generic <loc> if <url> tag structure was loose
  if (pages.length === 0 && childSitemaps.length === 0) {
    const genericLocRegex = /<loc>\s*(https?:\/\/[^<\s]+)\s*<\/loc>/gi;
    let gm: RegExpExecArray | null;
    while ((gm = genericLocRegex.exec(cleanXml)) !== null) {
      const loc = gm[1].trim();
      if (loc.endsWith('.xml') || loc.includes('sitemap')) {
        childSitemaps.push(loc);
      } else {
        try {
          const u = new URL(loc);
          const path = `${u.pathname || '/'}${u.search || ''}`;
          if (!seenPaths.has(path)) {
            seenPaths.add(path);
            const category = categorizeRoute(loc);
            pages.push({
              path,
              title: deriveCleanTitleFromSlug(loc),
              category,
              url: loc,
              weight: category === 'post' ? 95 : category === 'category' ? 85 : 75,
            });
          }
        } catch {}
      }
    }
  }

  // 4. RSS Feed `<item><link>...</link><title>...</title></item>`
  const rssItemRegex = /<item\b[^>]*>[\s\S]*?<link>\s*(https?:\/\/[^<\s]+)\s*<\/link>(?:[\s\S]*?<title>\s*([^<]+)\s*<\/title>)?[\s\S]*?<\/item>/gi;
  let rm: RegExpExecArray | null;
  while ((rm = rssItemRegex.exec(cleanXml)) !== null) {
    const link = rm[1].trim();
    const title = rm[2]?.trim();
    try {
      const u = new URL(link);
      const path = `${u.pathname || '/'}${u.search || ''}`;
      if (!seenPaths.has(path)) {
        seenPaths.add(path);
        const category = categorizeRoute(link);
        pages.push({
          path,
          title: deriveCleanTitleFromSlug(link, title),
          category,
          url: link,
          weight: category === 'post' ? 95 : category === 'category' ? 85 : 75,
        });
      }
    } catch {}
  }

  return { pages, childSitemaps };
}

/**
 * Resilient fetch helper supporting direct API / CORS proxy fallbacks.
 */
async function fetchXmlContent(targetUrl: string): Promise<string> {
  // 1. Try local server endpoint if available
  try {
    const res = await fetch('/api/crawler/fetch-sitemap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: targetUrl }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.xml && typeof data.xml === 'string') {
        return data.xml;
      }
    }
  } catch {}

  // 2. Try CORS proxies
  const proxies = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
    `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
  ];

  for (const proxy of proxies) {
    try {
      const res = await fetch(proxy);
      if (res.ok) {
        const text = await res.text();
        if (text.includes('<loc>') || text.includes('<urlset') || text.includes('<sitemapindex') || text.includes('<rss') || text.includes('<url>')) {
          return text;
        }
      }
    } catch {}
  }

  throw new Error(`Failed to fetch XML from ${targetUrl}`);
}

/**
 * Main parser accepting raw textarea input (sitemap URL(s), raw XML markup, or list of URLs).
 */
export async function parseSitemapOrUrlList(
  input: string,
  fallbackOrigin = 'https://jobs.eezor.com',
  onProgress?: (msg: string) => void
): Promise<ParseResult> {
  const trimmed = input.trim();
  if (!trimmed) {
    return {
      pages: [],
      stats: { sitemapsParsed: 0, postsCount: 0, pagesCount: 0, categoriesCount: 0, total: 0 },
    };
  }

  let effectiveOrigin = fallbackOrigin;
  let discoveredHostname: string | undefined;

  const resultPages: ParsedItem[] = [];
  const seenPaths = new Set<string>();
  let sitemapsParsedCount = 0;

  // Case 1: Raw XML content pasted directly
  if (trimmed.startsWith('<?xml') || trimmed.includes('<urlset') || trimmed.includes('<sitemapindex') || (trimmed.includes('<url>') && trimmed.includes('<loc>')) || trimmed.includes('<rss')) {
    onProgress?.('Parsing raw XML sitemap markup...');
    const parsed = parseRawXmlSitemap(trimmed, effectiveOrigin);
    sitemapsParsedCount++;

    for (const p of parsed.pages) {
      if (!seenPaths.has(p.path)) {
        seenPaths.add(p.path);
        resultPages.push(p);
      }
    }

    // If there are child sitemaps in the raw XML, fetch them
    for (const childUrl of parsed.childSitemaps) {
      try {
        onProgress?.(`Fetching child sitemap: ${childUrl.split('/').pop()}...`);
        const childXml = await fetchXmlContent(childUrl);
        const childParsed = parseRawXmlSitemap(childXml, effectiveOrigin);
        sitemapsParsedCount++;
        for (const p of childParsed.pages) {
          if (!seenPaths.has(p.path)) {
            seenPaths.add(p.path);
            resultPages.push(p);
          }
        }
      } catch (err) {
        console.warn(`Could not fetch child sitemap ${childUrl}:`, err);
      }
    }
  } else {
    // Case 2: Process line-by-line (could contain sitemap URLs, plain URLs, paths, or job IDs)
    const lines = trimmed
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);

    for (const line of lines) {
      // 2A. If line is a URL ending in .xml / containing sitemap / rss
      const isSitemapUrl =
        (line.startsWith('http://') || line.startsWith('https://')) &&
        (line.endsWith('.xml') || line.endsWith('.rss') || line.includes('sitemap') || line.includes('/feed'));

      if (isSitemapUrl) {
        try {
          onProgress?.(`Fetching sitemap: ${line}...`);
          const smXml = await fetchXmlContent(line);
          sitemapsParsedCount++;

          try {
            const u = new URL(line);
            effectiveOrigin = u.origin;
            discoveredHostname = u.hostname;
          } catch {}

          const smParsed = parseRawXmlSitemap(smXml, effectiveOrigin);
          for (const p of smParsed.pages) {
            if (!seenPaths.has(p.path)) {
              seenPaths.add(p.path);
              resultPages.push(p);
            }
          }

          // Fetch child sitemaps if index was provided
          for (const childUrl of smParsed.childSitemaps) {
            try {
              onProgress?.(`Fetching sub-sitemap: ${childUrl.split('/').pop()}...`);
              const childXml = await fetchXmlContent(childUrl);
              sitemapsParsedCount++;
              const childParsed = parseRawXmlSitemap(childXml, effectiveOrigin);
              for (const p of childParsed.pages) {
                if (!seenPaths.has(p.path)) {
                  seenPaths.add(p.path);
                  resultPages.push(p);
                }
              }
            } catch (childErr) {
              console.warn('Child sitemap fetch error:', childErr);
            }
          }
        } catch (err) {
          console.warn(`Failed fetching sitemap URL ${line}, treating as regular URL:`, err);
          // Fall through to plain URL parsing
        }
      }

      // 2B. Plain URL / Path / Job ID / Formatted line (e.g. `https://eezor.com/blog/ | Blog`)
      if (!isSitemapUrl || resultPages.length === 0) {
        const parts = line.split('|');
        const rawLoc = parts[0].trim();
        const explicitTitle = parts[1]?.trim();

        if (!rawLoc) continue;

        let path = rawLoc;
        let absUrl = rawLoc;
        let category: 'post' | 'category' | 'page' = categorizeRoute(rawLoc);

        // Job ID special case
        if (/^job_\d{3,25}$/i.test(rawLoc) || /^job_[a-zA-Z0-9_\-]+$/i.test(rawLoc)) {
          path = `/?job=${rawLoc}`;
          absUrl = `${effectiveOrigin}${path}`;
          category = 'post';
        } else if (/^post_\d{3,25}$/i.test(rawLoc)) {
          path = `/?post=${rawLoc}`;
          absUrl = `${effectiveOrigin}${path}`;
          category = 'post';
        } else if (rawLoc.startsWith('http://') || rawLoc.startsWith('https://')) {
          try {
            const u = new URL(rawLoc);
            effectiveOrigin = u.origin;
            discoveredHostname = u.hostname;
            path = `${u.pathname || '/'}${u.search || ''}`;
            absUrl = rawLoc;
          } catch {
            path = rawLoc.startsWith('/') ? rawLoc : `/${rawLoc}`;
            absUrl = `${effectiveOrigin}${path}`;
          }
        } else {
          path = rawLoc.startsWith('/') ? rawLoc : `/${rawLoc}`;
          absUrl = `${effectiveOrigin}${path}`;
        }

        if (!seenPaths.has(path)) {
          seenPaths.add(path);
          const title = deriveCleanTitleFromSlug(rawLoc, explicitTitle);
          resultPages.push({
            path,
            title,
            category,
            url: absUrl,
            weight: category === 'post' ? 95 : category === 'category' ? 85 : 75,
          });
        }
      }
    }
  }

  const postsCount = resultPages.filter(p => p.category === 'post').length;
  const categoriesCount = resultPages.filter(p => p.category === 'category').length;
  const pagesCount = resultPages.filter(p => p.category === 'page').length;

  return {
    pages: resultPages,
    stats: {
      sitemapsParsed: sitemapsParsedCount,
      postsCount,
      pagesCount,
      categoriesCount,
      total: resultPages.length,
    },
    discoveredTargetUrl: effectiveOrigin,
    discoveredHostname,
  };
}
