import { GeoCountry } from '../types';

export interface GeneratedFingerprint {
  deviceType: string;
  userAgent: string;
  clientHints: {
    secChUa: string;
    secChUaMobile: string;
    secChUaPlatform: string;
  };
  screenResolution: string;
  viewportWidth: number;
  viewportHeight: number;
  devicePixelRatio: number;
  colorDepth: number;
  hardwareConcurrency: number;
  deviceMemory: number;
  webGlVendor: string;
  webGlRenderer: string;
  canvasHash: string;
  audioNoiseHash: string;
  acceptLanguage: string;
  timezone: string;
  ipAddress: string;
  country: GeoCountry;
}

const SCREEN_RESOLUTIONS = [
  { resolution: '1920x1080', width: 1920, height: 1080, dpr: 1 },
  { resolution: '2560x1440', width: 2560, height: 1440, dpr: 1 },
  { resolution: '1440x900', width: 1440, height: 900, dpr: 2 },
  { resolution: '1536x864', width: 1536, height: 864, dpr: 1.25 },
  { resolution: '1366x768', width: 1366, height: 768, dpr: 1 },
  { resolution: '390x844 (Mobile iOS)', width: 390, height: 844, dpr: 3 },
  { resolution: '412x915 (Mobile Android)', width: 412, height: 915, dpr: 2.625 },
];

const GPU_RENDERERS = [
  { vendor: 'Google Inc. (NVIDIA)', renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 Direct3D11 vs_5_0 ps_5_0, D3D11)' },
  { vendor: 'Apple', renderer: 'Apple M3 Pro GPU' },
  { vendor: 'Google Inc. (Intel)', renderer: 'ANGLE (Intel, Intel(R) Iris(R) Xe Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)' },
  { vendor: 'Apple', renderer: 'Apple M2 Max GPU' },
  { vendor: 'Qualcomm', renderer: 'Adreno (TM) 740' },
];

export function generateVisitorFingerprint(
  country: GeoCountry,
  deviceCategory?: string
): GeneratedFingerprint {
  // Device Selection
  const devices = [
    { type: 'Desktop Chrome (Windows 11)', weight: 35 },
    { type: 'Desktop Chrome (macOS)', weight: 22 },
    { type: 'Desktop Safari (macOS)', weight: 15 },
    { type: 'Mobile iOS (iPhone 16 Safari)', weight: 14 },
    { type: 'Mobile Android (Chrome 128)', weight: 8 },
    { type: 'Desktop Edge (Windows 11)', weight: 6 },
  ];

  let selectedDevice = deviceCategory;
  if (!selectedDevice) {
    const totalWeight = devices.reduce((acc, d) => acc + d.weight, 0);
    let rand = Math.random() * totalWeight;
    for (const d of devices) {
      if (rand < d.weight) {
        selectedDevice = d.type;
        break;
      }
      rand -= d.weight;
    }
    if (!selectedDevice) selectedDevice = devices[0].type;
  }

  let userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
  let secChUa = '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"';
  let secChUaMobile = '?0';
  let secChUaPlatform = '"Windows"';
  let screenRes = SCREEN_RESOLUTIONS[0];

  if (selectedDevice.includes('macOS') && selectedDevice.includes('Chrome')) {
    userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
    secChUaPlatform = '"macOS"';
    screenRes = SCREEN_RESOLUTIONS[2];
  } else if (selectedDevice.includes('Safari') && !selectedDevice.includes('iPhone')) {
    userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';
    secChUa = '';
    secChUaPlatform = '"macOS"';
    screenRes = SCREEN_RESOLUTIONS[2];
  } else if (selectedDevice.includes('iPhone') || selectedDevice.includes('Mobile iOS')) {
    userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
    secChUa = '';
    secChUaMobile = '?1';
    secChUaPlatform = '"iOS"';
    screenRes = SCREEN_RESOLUTIONS[5];
  } else if (selectedDevice.includes('Mobile Android')) {
    userAgent = 'Mozilla/5.0 (Linux; Android 15; Pixel 9 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.6613.127 Mobile Safari/537.36';
    secChUa = '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"';
    secChUaMobile = '?1';
    secChUaPlatform = '"Android"';
    screenRes = SCREEN_RESOLUTIONS[6];
  } else if (selectedDevice.includes('Edge')) {
    userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Edg/128.0.2792.89';
    secChUa = '"Chromium";v="128", "Not;A=Brand";v="24", "Microsoft Edge";v="128"';
    secChUaPlatform = '"Windows"';
    screenRes = SCREEN_RESOLUTIONS[0];
  }

  // Country IP generation
  const ipPrefix = country.ipSample ? country.ipSample.split('.').slice(0, 2).join('.') : '198.51';
  const ipAddress = `${ipPrefix}.${Math.floor(Math.random() * 200) + 10}.${Math.floor(Math.random() * 250) + 2}`;

  const gpu = GPU_RENDERERS[Math.floor(Math.random() * GPU_RENDERERS.length)];
  const concurrencyOptions = [4, 8, 12, 16];
  const memoryOptions = [8, 16, 32];

  return {
    deviceType: selectedDevice,
    userAgent,
    clientHints: {
      secChUa,
      secChUaMobile,
      secChUaPlatform,
    },
    screenResolution: screenRes.resolution,
    viewportWidth: screenRes.width,
    viewportHeight: screenRes.height,
    devicePixelRatio: screenRes.dpr,
    colorDepth: 24,
    hardwareConcurrency: concurrencyOptions[Math.floor(Math.random() * concurrencyOptions.length)],
    deviceMemory: memoryOptions[Math.floor(Math.random() * memoryOptions.length)],
    webGlVendor: gpu.vendor,
    webGlRenderer: gpu.renderer,
    canvasHash: `cnv_${Math.floor(Math.random() * 1000000).toString(16)}`,
    audioNoiseHash: `aud_${Math.floor(Math.random() * 1000000).toString(16)}`,
    acceptLanguage: country.locale || 'en-US,en;q=0.9',
    timezone: country.timezone || 'UTC',
    ipAddress,
    country,
  };
}

// Map country codes to official localized Google search engine domains
export const GOOGLE_COUNTRY_DOMAINS: Record<string, string> = {
  US: 'www.google.com',
  GB: 'www.google.co.uk',
  DE: 'www.google.de',
  FR: 'www.google.fr',
  JP: 'www.google.co.jp',
  CA: 'www.google.ca',
  AU: 'www.google.com.au',
  BR: 'www.google.com.br',
  IN: 'www.google.co.in',
  IT: 'www.google.it',
  ES: 'www.google.es',
  NL: 'www.google.nl',
  MX: 'www.google.com.mx',
  CH: 'www.google.ch',
  SE: 'www.google.se',
  NO: 'www.google.no',
  DK: 'www.google.dk',
  FI: 'www.google.fi',
  BE: 'www.google.be',
  AT: 'www.google.at',
  IE: 'www.google.ie',
  PL: 'www.google.pl',
  ZA: 'www.google.co.za',
  NG: 'www.google.com.ng',
  SG: 'www.google.com.sg',
  AE: 'www.google.ae',
  SA: 'www.google.com.sa',
  TR: 'www.google.com.tr',
  KR: 'www.google.co.kr',
  TW: 'www.google.com.tw',
  HK: 'www.google.com.hk',
  NZ: 'www.google.co.nz',
  AR: 'www.google.com.ar',
  CL: 'www.google.cl',
  CO: 'www.google.com.co',
  PE: 'www.google.com.pe',
  EG: 'www.google.com.eg',
  KE: 'www.google.co.ke',
  MA: 'www.google.co.ma',
  ID: 'www.google.co.id',
  MY: 'www.google.com.my',
  TH: 'www.google.co.th',
  VN: 'www.google.com.vn',
  PH: 'www.google.com.ph',
  PK: 'www.google.com.pk',
  BD: 'www.google.com.bd',
  IL: 'www.google.co.il',
  QA: 'www.google.com.qa',
  KW: 'www.google.com.kw',
};

export function extractSearchQueryFromPage(pageTitle?: string, pagePath?: string): string {
  if (pageTitle && pageTitle.trim().length > 3) {
    const cleaned = pageTitle
      .replace(/[-_|–—].*$/, '') // remove site name suffixes e.g. " - TechBlog"
      .replace(/<[^>]*>/g, '')
      .replace(/[^\w\s-]/gi, '')
      .trim();
    if (cleaned.length >= 3) return cleaned.toLowerCase();
  }

  if (pagePath && pagePath !== '/' && pagePath.length > 2) {
    const slug = pagePath.split('/').filter(Boolean).pop() || '';
    const words = slug.replace(/[-_]/g, ' ').replace(/\.\w+$/, '').trim();
    if (words.length >= 3) return words.toLowerCase();
  }

  return 'organic search query';
}

export function buildOrganicReferrer(
  source: 'Organic Search' | 'Social' | 'Direct' | 'Referral',
  keyword: string,
  targetUrl: string,
  searchEngine: string = 'google',
  socialPlatform: string = 'twitter',
  customUrl?: string,
  countryCode?: string,
  pageTitle?: string,
  pagePath?: string,
  forceGoogleReferrer?: boolean,
  googleReferrerMode?: 'country_localized' | 'google_com' | 'dynamic_query'
): { referrerUrl: string; referrerName: string } {
  // If Force Google Search Referrer is active, override source to Organic Search Google
  const effectiveSource = forceGoogleReferrer ? 'Organic Search' : source;
  const effectiveEngine = forceGoogleReferrer ? 'google' : searchEngine;

  if (effectiveSource === 'Direct') {
    return { referrerUrl: '', referrerName: 'Direct / Bookmarks' };
  }

  if (effectiveSource === 'Organic Search') {
    // Dynamic Query generation from page title / slug if keyword is generic or auto-query is active
    let queryToUse = keyword;
    if (!queryToUse || queryToUse === 'performance analytics' || googleReferrerMode === 'dynamic_query') {
      const derived = extractSearchQueryFromPage(pageTitle, pagePath);
      if (derived && derived !== 'organic search query') {
        queryToUse = derived;
      }
    }
    if (!queryToUse) queryToUse = 'google search result';

    const encodedKw = encodeURIComponent(queryToUse);

    if (effectiveEngine === 'google') {
      // Determine Google Domain based on country localization
      let googleDomain = 'www.google.com';
      if (googleReferrerMode !== 'google_com' && countryCode) {
        googleDomain = GOOGLE_COUNTRY_DOMAINS[countryCode.toUpperCase()] || 'www.google.com';
      }

      return {
        referrerUrl: `https://${googleDomain}/search?q=${encodedKw}&oq=${encodedKw}&sourceid=chrome&ie=UTF-8`,
        referrerName: `Google Search [${googleDomain}] ("${queryToUse}")`,
      };
    }

    switch (effectiveEngine) {
      case 'bing':
        return {
          referrerUrl: `https://www.bing.com/search?q=${encodedKw}&form=QBLH`,
          referrerName: `Bing Search ("${queryToUse}")`,
        };
      case 'duckduckgo':
        return {
          referrerUrl: `https://duckduckgo.com/?q=${encodedKw}&t=h_&ia=web`,
          referrerName: `DuckDuckGo ("${queryToUse}")`,
        };
      case 'yahoo':
        return {
          referrerUrl: `https://search.yahoo.com/search?p=${encodedKw}`,
          referrerName: `Yahoo Search ("${queryToUse}")`,
        };
      case 'baidu':
        return {
          referrerUrl: `https://www.baidu.com/s?wd=${encodedKw}`,
          referrerName: `Baidu Search ("${queryToUse}")`,
        };
      case 'yandex':
        return {
          referrerUrl: `https://yandex.com/search/?text=${encodedKw}`,
          referrerName: `Yandex Search ("${queryToUse}")`,
        };
      default:
        return {
          referrerUrl: `https://www.google.com/search?q=${encodedKw}`,
          referrerName: `Google Search ("${queryToUse}")`,
        };
    }
  }

  if (effectiveSource === 'Social') {
    const randSlug = Math.random().toString(36).substring(2, 8);
    switch (socialPlatform) {
      case 'twitter':
        return {
          referrerUrl: `https://t.co/${randSlug}`,
          referrerName: 'X / Twitter (t.co)',
        };
      case 'linkedin':
        return {
          referrerUrl: `https://lnkd.in/${randSlug}`,
          referrerName: 'LinkedIn Feed (lnkd.in)',
        };
      case 'reddit':
        return {
          referrerUrl: `https://www.reddit.com/r/technology/comments/${randSlug}/`,
          referrerName: 'Reddit (r/technology)',
        };
      case 'facebook':
        return {
          referrerUrl: `https://l.facebook.com/l.php?u=${encodeURIComponent(targetUrl)}`,
          referrerName: 'Facebook (l.facebook.com)',
        };
      case 'instagram':
        return {
          referrerUrl: `https://l.instagram.com/?u=${encodeURIComponent(targetUrl)}`,
          referrerName: 'Instagram Stories (l.instagram.com)',
        };
      case 'youtube':
        return {
          referrerUrl: 'https://www.youtube.com/',
          referrerName: 'YouTube Description Link',
        };
      default:
        return {
          referrerUrl: `https://t.co/${randSlug}`,
          referrerName: 'Social Referral',
        };
    }
  }

  if (effectiveSource === 'Referral') {
    if (customUrl) {
      try {
        const host = new URL(customUrl).hostname;
        return { referrerUrl: customUrl, referrerName: `Referral (${host})` };
      } catch {
        return { referrerUrl: customUrl, referrerName: 'External Referral' };
      }
    }
    return {
      referrerUrl: 'https://techcrunch.com/features/cloud-infrastructure-tools',
      referrerName: 'TechCrunch Article Link',
    };
  }

  return { referrerUrl: '', referrerName: 'Direct' };
}
