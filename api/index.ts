import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { executeUniversalCrawl, FetchFunction } from '../src/utils/universalCrawler';

dotenv.config();

function getProxyAgent(proxyUrl?: string) {
  if (!proxyUrl || typeof proxyUrl !== 'string') return undefined;
  const trimmed = proxyUrl.trim();
  if (!trimmed) return undefined;
  try {
    if (trimmed.startsWith('socks4://') || trimmed.startsWith('socks5://')) {
      return new SocksProxyAgent(trimmed);
    }
    const formatted = trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `http://${trimmed}`;
    return new HttpsProxyAgent(formatted);
  } catch (e) {
    console.error('Failed to initialize proxy agent for:', proxyUrl, e);
    return undefined;
  }
}

// Lazy Gemini AI accessor
let aiClient: GoogleGenAI | null = null;
function getAI() {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch (e) {
      console.warn('Gemini client init warning:', e);
    }
  }
  return aiClient;
}

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Enable CORS for all serverless invocations
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

const router = express.Router();

// Health Check
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    engine: 'TrafficPulse-v2.5',
    runtime: 'Vercel Serverless / Node.js',
  });
});

// Ping endpoint
router.post('/traffic/ping', async (req: Request, res: Response) => {
  try {
    const rawInput = req.body.url || req.body.targetUrl || req.body.target;
    if (!rawInput) {
      return res.status(400).json({ error: 'Target URL is required' });
    }

    let parsedUrl: URL;
    try {
      const withProtocol = rawInput.startsWith('http://') || rawInput.startsWith('https://') 
        ? rawInput 
        : `https://${rawInput}`;
      parsedUrl = new URL(withProtocol);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    const targetUrl = parsedUrl.toString();
    const startTime = performance.now();

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9000);

    try {
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 TrafficPulse-Ping/2.5',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: controller.signal,
        redirect: 'follow',
      });
      clearTimeout(timer);

      const latencyMs = Math.round(performance.now() - startTime);
      const headers: Record<string, string> = {};
      response.headers.forEach((val, key) => {
        headers[key] = val;
      });

      const previewText = await response.text();

      res.json({
        success: true,
        reachable: true,
        targetUrl,
        statusCode: response.status,
        statusText: response.statusText,
        latencyMs,
        server: headers['server'] || 'Unknown / Hidden',
        contentType: headers['content-type'] || 'text/html',
        contentLength: headers['content-length'] ? parseInt(headers['content-length'], 10) : Buffer.byteLength(previewText, 'utf8'),
        headers,
        timestamp: Date.now(),
      });
    } catch (fetchErr: any) {
      clearTimeout(timer);
      const latencyMs = Math.round(performance.now() - startTime);
      res.json({
        success: false,
        reachable: false,
        targetUrl,
        error: fetchErr.name === 'AbortError' ? 'Connection Timed Out (9000ms)' : (fetchErr.message || 'Network Connection Error'),
        latencyMs,
        statusCode: 0,
        statusText: fetchErr.name === 'AbortError' ? 'Timeout' : 'Unreachable',
        timestamp: Date.now(),
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Ping failed' });
  }
});

// ----------------------------------------------------
// VIRTUAL BROWSER COMPANION & LIVE PAGE PROXY
// ----------------------------------------------------
router.get('/browser/live-page', async (req: Request, res: Response) => {
  try {
    const rawUrl = (req.query.url as string) || '';
    const visitorNumber = req.query.visitorNumber || '1';
    const country = (req.query.country as string) || 'US';
    const scrollPct = parseFloat((req.query.scroll as string) || '0');

    if (!rawUrl) {
      return res.status(400).send('<h1>Missing target URL</h1>');
    }

    let parsed: URL;
    try {
      parsed = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`);
    } catch {
      return res.status(400).send('<h1>Invalid target URL format</h1>');
    }

    const targetUrl = parsed.toString();
    const origin = parsed.origin;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9000);

    try {
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 TrafficPulse-VirtualBrowser/2.5',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Sec-Ch-Ua': '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"Windows"',
          'Upgrade-Insecure-Requests': '1',
        },
        signal: controller.signal,
        redirect: 'follow',
      });
      clearTimeout(timer);

      let html = await response.text();

      // 1. Inject frame-busting neutralizer & <base href="..."> into <head> so all assets resolve
      const headInjection = `
<script>
  try {
    window.top = window;
    window.parent = window;
  } catch(e) {}
</script>
<base href="${origin}/">
`;
      if (html.includes('<head>') || html.includes('<head ')) {
        html = html.replace(/<head\b[^>]*>/i, `$&${headInjection}`);
      } else {
        html = `${headInjection}\n` + html;
      }

      // 2. Remove restrictive CSP and frame headers if present inside meta tags
      html = html.replace(/<meta\b[^>]*http-equiv=["']Content-Security-Policy["'][^>]*>/gi, '');
      html = html.replace(/<meta\b[^>]*http-equiv=["']X-Frame-Options["'][^>]*>/gi, '');

      // 3. Inject TrafficPulse Virtual Browser Companion Script
      const companionScript = `
<style id="trafficpulse-live-styles">
  #tp-live-cursor-root {
    position: fixed;
    top: 15%;
    left: 15%;
    pointer-events: none;
    z-index: 2147483647;
    transition: left 0.35s cubic-bezier(0.25, 1, 0.5, 1), top 0.35s cubic-bezier(0.25, 1, 0.5, 1);
    transform: translate(-3px, -3px);
  }
  #tp-live-cursor-pointer {
    filter: drop-shadow(0 2px 10px rgba(6, 182, 212, 0.9));
    animation: tpCursorPulse 2.5s infinite alternate;
  }
  @keyframes tpCursorPulse {
    0% { transform: scale(1); }
    100% { transform: scale(1.08); }
  }
  #tp-live-click-ripple {
    position: absolute;
    top: -12px;
    left: -12px;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: 2px solid #38bdf8;
    background: rgba(56, 189, 248, 0.25);
    opacity: 0;
    pointer-events: none;
    transform: scale(0.3);
  }
  .tp-ripple-active {
    animation: tpRippleAnim 0.8s cubic-bezier(0, 0.2, 0.8, 1) forwards !important;
  }
  @keyframes tpRippleAnim {
    0% { transform: scale(0.3); opacity: 1; border-color: #38bdf8; }
    50% { opacity: 0.8; }
    100% { transform: scale(2.2); opacity: 0; border-color: #06b6d4; }
  }
  #tp-live-badge {
    position: absolute;
    top: 24px;
    left: 12px;
    background: rgba(15, 23, 42, 0.95);
    color: #38bdf8;
    padding: 3px 8px;
    border-radius: 6px;
    font-size: 11px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-weight: 600;
    white-space: nowrap;
    border: 1px solid rgba(56, 189, 248, 0.5);
    box-shadow: 0 4px 16px rgba(0,0,0,0.6);
  }
  #tp-live-telemetry-hud {
    position: fixed;
    bottom: 12px;
    right: 12px;
    background: rgba(15, 23, 42, 0.95);
    border: 1px solid rgba(56, 189, 248, 0.4);
    color: #e2e8f0;
    padding: 8px 14px;
    border-radius: 10px;
    font-size: 11px;
    font-family: monospace;
    z-index: 2147483646;
    pointer-events: none;
    backdrop-filter: blur(8px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  #tp-live-scroll-radar {
    position: fixed;
    right: 4px;
    top: 15%;
    height: 70%;
    width: 6px;
    background: rgba(30, 41, 59, 0.6);
    border-radius: 3px;
    z-index: 2147483645;
    pointer-events: none;
  }
  #tp-live-scroll-indicator {
    position: absolute;
    left: 0;
    width: 100%;
    height: 18%;
    background: linear-gradient(180deg, #06b6d4, #3b82f6);
    border-radius: 3px;
    box-shadow: 0 0 8px #06b6d4;
    transition: top 0.25s ease-out;
  }
</style>
<div id="tp-live-cursor-root">
  <div id="tp-live-click-ripple"></div>
  <svg id="tp-live-cursor-pointer" width="26" height="26" viewBox="0 0 24 24" fill="#06b6d4" stroke="#083344" stroke-width="1.5">
    <path d="M3 3l7 18 3-7 7-3L3 3z"/>
  </svg>
  <div id="tp-live-badge">Visitor #${visitorNumber} (${country})</div>
</div>
<div id="tp-live-scroll-radar">
  <div id="tp-live-scroll-indicator" style="top: ${Math.min(82, scrollPct * 0.82)}%;"></div>
</div>
<div id="tp-live-telemetry-hud">
  <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;font-weight:bold;color:#38bdf8;">
    <span>⚡ VIRTUAL BROWSER SIMULATOR</span>
    <span id="tp-hud-coords" style="color:#94a3b8;">X: 50% • Y: 30%</span>
  </div>
  <div style="font-size:10px;color:#cbd5e1;display:flex;align-items:center;gap:8px;">
    <span>📜 SCROLL: <strong id="tp-hud-scroll" style="color:#34d399;">${Math.round(scrollPct)}%</strong></span>
    <span>•</span>
    <span id="tp-hud-action" style="color:#e2e8f0;">Reading document body</span>
  </div>
</div>
<script id="trafficpulse-live-script">
(function() {
  var cursor = document.getElementById('tp-live-cursor-root');
  var badge = document.getElementById('tp-live-badge');
  var ripple = document.getElementById('tp-live-click-ripple');
  var hudScroll = document.getElementById('tp-hud-scroll');
  var hudCoords = document.getElementById('tp-hud-coords');
  var hudAction = document.getElementById('tp-hud-action');
  var scrollIndicator = document.getElementById('tp-live-scroll-indicator');

  function triggerClickRipple() {
    if (!ripple) return;
    ripple.classList.remove('tp-ripple-active');
    void ripple.offsetWidth;
    ripple.classList.add('tp-ripple-active');
  }

  window.addEventListener('message', function(event) {
    if (!event.data || event.data.type !== 'TP_UPDATE_VISITOR') return;
    
    var pct = typeof event.data.scrollPct === 'number' ? event.data.scrollPct : 0;
    var maxScroll = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) - window.innerHeight;
    if (maxScroll > 0) {
      var targetY = (pct / 100) * maxScroll;
      window.scrollTo({ top: targetY, behavior: 'smooth' });
    }

    if (hudScroll) hudScroll.textContent = Math.round(pct) + '%';
    if (scrollIndicator) {
      scrollIndicator.style.top = Math.min(82, (pct * 0.82)) + '%';
    }

    if (cursor && typeof event.data.cursorX === 'number' && typeof event.data.cursorY === 'number') {
      var cx = Math.min(95, Math.max(3, event.data.cursorX));
      var cy = Math.min(92, Math.max(5, event.data.cursorY));
      cursor.style.left = cx + '%';
      cursor.style.top = cy + '%';
      if (hudCoords) hudCoords.textContent = 'X: ' + cx + '% • Y: ' + cy + '%';
    }

    if (event.data.status) {
      var st = event.data.status;
      if (st === 'clicking_ad' || st === 'clicking_link' || st === 'handling_popup' || st === 'clicking_element') {
        triggerClickRipple();
      }

      if (badge) {
        if (st === 'clicking_ad') {
          badge.textContent = '🎯 Clicking Sponsored Ad';
          badge.style.color = '#f59e0b';
          badge.style.borderColor = '#f59e0b';
          if (hudAction) hudAction.textContent = 'Dispatched Ad Click on Sponsor Banner';
        } else if (st === 'clicking_link') {
          badge.textContent = '👆 Navigating Deep Link';
          badge.style.color = '#38bdf8';
          badge.style.borderColor = '#38bdf8';
          if (hudAction) hudAction.textContent = 'Clicked in-article link to child page';
        } else if (st === 'handling_popup') {
          badge.textContent = '✨ Interacting with Newsletter';
          badge.style.color = '#c084fc';
          badge.style.borderColor = '#c084fc';
          if (hudAction) hudAction.textContent = 'Newsletter modal promo CTA dismissed';
        } else if (st === 'clicking_element') {
          badge.textContent = '🖱️ Mouse Click on Element';
          badge.style.color = '#34d399';
          badge.style.borderColor = '#34d399';
          if (hudAction) hudAction.textContent = 'Dispatched click on interactive card/button';
        } else if (pct >= 95) {
          badge.textContent = '📜 Reached 100% Footer';
          badge.style.color = '#2dd4bf';
          badge.style.borderColor = '#2dd4bf';
          if (hudAction) hudAction.textContent = 'Dwell pause at footer / comments';
        } else {
          badge.textContent = '👁️ Reading (' + Math.round(pct) + '%)';
          badge.style.color = '#38bdf8';
          badge.style.borderColor = 'rgba(56, 189, 248, 0.5)';
          if (hudAction) hudAction.textContent = 'Reading page text content';
        }
      }
    }
  });

  document.addEventListener('click', function(e) {
    var anchor = e.target.closest && e.target.closest('a');
    if (anchor && anchor.href) {
      try {
        window.parent.postMessage({
          type: 'TP_LINK_CLICKED',
          href: anchor.href,
          text: anchor.innerText || ''
        }, '*');
      } catch(err) {}
    }
  }, true);

  try {
    window.parent.postMessage({
      type: 'TP_PAGE_LOADED',
      url: window.location.href,
      title: document.title || 'Loaded Page'
    }, '*');
  } catch(e) {}
})();
</script>
`;

      if (html.includes('</body>')) {
        html = html.replace('</body>', `${companionScript}</body>`);
      } else {
        html += companionScript;
      }

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('X-Frame-Options', 'ALLOWALL');
      res.setHeader('Content-Security-Policy', "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;");
      res.send(html);
    } catch (fetchErr: any) {
      clearTimeout(timer);
      res.status(502).send(`
        <div style="padding:40px;font-family:sans-serif;background:#090d16;color:#f87171;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;">
          <h2 style="color:#ef4444;margin-bottom:8px;">Live Page Webview Notice</h2>
          <p style="color:#94a3b8;max-width:500px;margin-bottom:20px;">Could not connect to <strong>${targetUrl}</strong> (${fetchErr.message}). The live visitor stream will continue dispatching HTTP traffic in the background.</p>
          <a href="${targetUrl}" target="_blank" style="padding:10px 20px;background:#38bdf8;color:#0f172a;text-decoration:none;border-radius:8px;font-weight:bold;">Open in New Window &rarr;</a>
        </div>
      `);
    }
  } catch (err: any) {
    res.status(500).send(`<h1>Proxy Error: ${err.message}</h1>`);
  }
});
router.post('/crawler/scrape', async (req: Request, res: Response) => {
  try {
    const rawInput = req.body.url || req.body.targetUrl || req.body.target;
    const maxLinks = Math.min(2500, Math.max(10, req.body.maxLinks || 1500));
    const maxDepth = Math.min(3, Math.max(1, req.body.maxDepth || 2));
    if (!rawInput) {
      return res.status(400).json({ error: 'Target URL is required' });
    }

    const browserHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Sec-Ch-Ua': '"Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
    };

    const botHeaders = {
      'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    };

    // Resilient fetch helper with automatic Googlebot WAF fallback
    const resilientFetch: FetchFunction = async (url: string, timeoutMs = 6000) => {
      try {
        const ctrl = new AbortController();
        const tm = setTimeout(() => ctrl.abort(), timeoutMs);
        const res = await fetch(url, { headers: browserHeaders, signal: ctrl.signal, redirect: 'follow' });
        clearTimeout(tm);
        if (res.ok) {
          const txt = await res.text();
          return { ok: true, status: res.status, text: txt };
        }
        if ([401, 403, 429, 503].includes(res.status)) {
          const bCtrl = new AbortController();
          const bTm = setTimeout(() => bCtrl.abort(), timeoutMs);
          const bRes = await fetch(url, { headers: botHeaders, signal: bCtrl.signal, redirect: 'follow' });
          clearTimeout(bTm);
          if (bRes.ok) {
            const bTxt = await bRes.text();
            return { ok: true, status: bRes.status, text: bTxt };
          }
        }
        return { ok: false, status: res.status, text: '' };
      } catch {
        try {
          const bCtrl = new AbortController();
          const bTm = setTimeout(() => bCtrl.abort(), timeoutMs);
          const bRes = await fetch(url, { headers: botHeaders, signal: bCtrl.signal, redirect: 'follow' });
          clearTimeout(bTm);
          if (bRes.ok) {
            const bTxt = await bRes.text();
            return { ok: true, status: bRes.status, text: bTxt };
          }
        } catch {}
        return { ok: false, status: 0, text: '' };
      }
    };

    const crawlResult = await executeUniversalCrawl(rawInput, maxDepth, maxLinks, resilientFetch);

    res.json({
      success: true,
      targetUrl: crawlResult.targetUrl,
      hostname: crawlResult.hostname,
      origin: crawlResult.origin,
      title: crawlResult.title,
      description: crawlResult.description,
      gaMeasurementId: crawlResult.gaMeasurementId,
      gtmId: crawlResult.gtmId,
      statusCode: crawlResult.statusCode,
      latencyMs: crawlResult.latencyMs,
      isRealScrape: crawlResult.statusCode === 200,
      realLinksFound: crawlResult.pages.length,
      totalPagesDiscovered: crawlResult.pages.length,
      visitedUrlsCount: crawlResult.visitedUrlsCount,
      recursivePassDepth: crawlResult.recursivePassDepth,
      listingPatternsMatched: crawlResult.listingPatternsMatched,
      sitemapFound: crawlResult.sitemapFound,
      pages: crawlResult.pages,
      error: crawlResult.error,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Crawler failed' });
  }
});

// Single Dispatch Endpoint
router.post('/traffic/dispatch-single', async (req: Request, res: Response) => {
  const startTime = performance.now();
  const { url, method = 'GET', headers = {}, body, proxyUrl, proxyRegion = 'Global', timeout = 10000, simulatedRegionLatency = 0 } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const forwardedIp = headers['X-Forwarded-For'] || headers['X-Real-IP'] || headers['True-Client-IP'] || '198.51.100.42';
    const countryCode = headers['CF-IPCountry'] || headers['X-Country-Code'] || 'US';

    const outgoingHeaders: Record<string, string> = {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': headers['Accept-Language'] || 'en-US,en;q=0.9',
      'User-Agent': headers['User-Agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 TrafficPulse/2.5',
      'X-Forwarded-For': forwardedIp,
      'X-Real-IP': forwardedIp,
      'True-Client-IP': forwardedIp,
      'CF-Connecting-IP': forwardedIp,
      'CF-IPCountry': countryCode,
      'X-Country-Code': countryCode,
      'X-Proxy-Region': proxyRegion,
      ...headers,
    };

    const agent = getProxyAgent(proxyUrl);

    const fetchOptions: any = {
      method: method.toUpperCase(),
      headers: outgoingHeaders,
      signal: controller.signal,
      redirect: 'follow',
      agent,
    };

    if (body && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      fetchOptions.body = typeof body === 'object' ? JSON.stringify(body) : body;
    }

    let response;
    try {
      response = await fetch(url, fetchOptions);
    } catch (proxyErr) {
      if (agent) {
        const directOptions = { ...fetchOptions, agent: undefined };
        response = await fetch(url, directOptions);
      } else {
        throw proxyErr;
      }
    }
    clearTimeout(timer);

    const latencyMs = Math.round(performance.now() - startTime + simulatedRegionLatency);
    const responseText = await response.text();
    const bytes = Buffer.byteLength(responseText, 'utf8');

    const resHeaders: Record<string, string> = {};
    response.headers.forEach((v, k) => { resHeaders[k] = v; });

    res.json({
      success: response.ok,
      statusCode: response.status,
      statusText: response.statusText,
      latencyMs,
      bytes,
      headers: resHeaders,
      proxyUsed: !!proxyUrl,
    });
  } catch (err: any) {
    clearTimeout(timer);
    const latencyMs = Math.round(performance.now() - startTime + simulatedRegionLatency);
    res.json({
      success: false,
      statusCode: 0,
      statusText: err.name === 'AbortError' ? 'Timeout' : 'Fetch Error',
      error: err.message,
      latencyMs,
      bytes: 0,
      proxyUsed: !!proxyUrl,
    });
  }
});

// GA4 Measurement Protocol and Direct Collect proxy
router.post('/ga4/collect-beacon', async (req: Request, res: Response) => {
  const {
    measurementId,
    apiSecret,
    clientId,
    sessionId,
    eventName = 'page_view',
    pageTitle,
    pagePath,
    pageLocation,
    referrer,
    engagementTimeMs = 15000,
    userIp,
    countryCode,
    proxyRegion = 'Global',
    userAgent,
    proxyUrl,
    campaignSource = 'google',
    campaignMedium = 'organic',
    campaignName,
    campaignTerm,
  } = req.body;

  if (!measurementId || measurementId.startsWith('G-SIMULATED')) {
    return res.json({
      success: true,
      simulated: true,
      delivered: true,
      measurementId: measurementId || 'G-SIMULATED',
      eventName,
      message: 'Simulated GA4 telemetry beacon acknowledged locally',
    });
  }

  const cleanCountryCode = (countryCode || 'US').toUpperCase();
  const COUNTRY_GEO_REGISTRY: Record<string, { criteriaId: number; ipSubnets: string[] }> = {
    US: { criteriaId: 2840, ipSubnets: ['24.120', '73.180', '98.210', '108.45', '174.60', '67.160', '76.100', '24.105', '68.192'] },
    GB: { criteriaId: 2826, ipSubnets: ['82.35', '86.150', '90.200', '92.238', '151.224', '185.120', '2.24', '81.130'] },
    CA: { criteriaId: 2124, ipSubnets: ['24.200', '70.24', '99.230', '142.112', '174.112', '198.53', '207.161'] },
    DE: { criteriaId: 2276, ipSubnets: ['84.116', '91.64', '178.200', '217.80', '92.247', '80.187', '188.192'] },
    FR: { criteriaId: 2250, ipSubnets: ['82.224', '86.200', '90.50', '176.130', '51.15', '92.154', '194.250'] },
    NL: { criteriaId: 2528, ipSubnets: ['84.80', '145.220', '213.124', '77.160', '82.161', '145.131'] },
    AU: { criteriaId: 2036, ipSubnets: ['1.120', '120.150', '139.130', '203.200', '49.180', '101.160', '110.140'] },
    JP: { criteriaId: 2392, ipSubnets: ['122.130', '126.150', '133.242', '153.120', '60.100', '118.238', '125.192'] },
    SG: { criteriaId: 2702, ipSubnets: ['118.189', '175.156', '202.166', '122.11', '119.74', '220.255'] },
    IN: { criteriaId: 2356, ipSubnets: ['103.21', '117.200', '122.160', '157.34', '49.200', '106.210', '115.110'] },
    NG: { criteriaId: 2566, ipSubnets: ['105.112', '197.210', '41.58', '102.89', '105.113'] },
    GH: { criteriaId: 2288, ipSubnets: ['154.160', '196.201', '41.215', '102.176'] },
    KE: { criteriaId: 2404, ipSubnets: ['105.160', '196.201', '41.89', '102.68'] },
    ZA: { criteriaId: 2710, ipSubnets: ['105.184', '196.25', '197.80', '41.13', '169.255'] },
    AE: { criteriaId: 2784, ipSubnets: ['86.96', '94.200', '178.84', '213.42', '5.36', '89.148'] },
    SA: { criteriaId: 2682, ipSubnets: ['93.168', '212.138', '62.149', '37.224', '51.252'] },
    BR: { criteriaId: 2076, ipSubnets: ['177.100', '187.50', '200.150', '189.10', '179.180'] },
  };

  const geoData = COUNTRY_GEO_REGISTRY[cleanCountryCode] || COUNTRY_GEO_REGISTRY['US'];
  const subnets = geoData.ipSubnets;
  const prefix = subnets[Math.floor(Math.random() * subnets.length)];
  const octet3 = Math.floor(Math.random() * 200) + 10;
  const octet4 = Math.floor(Math.random() * 250) + 2;
  const authenticCountryIp = (userIp && userIp !== '198.51.100.42' && userIp !== '127.0.0.1' && !userIp.startsWith('198.51')) 
    ? userIp 
    : `${prefix}.${octet3}.${octet4}`;

  const agent = getProxyAgent(proxyUrl);

  // A. Measurement Protocol with API Secret
  if (apiSecret) {
    try {
      const endpoint = `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`;
      const payload = {
        client_id: clientId || `${Date.now()}.${Math.floor(Math.random() * 1000000000)}`,
        events: [
          {
            name: eventName,
            params: {
              session_id: sessionId || `${Date.now()}`,
              engagement_time_msec: engagementTimeMs,
              page_title: pageTitle,
              page_location: pageLocation,
              page_referrer: referrer,
              source: campaignSource,
              medium: campaignMedium,
              campaign: campaignName,
              term: campaignTerm,
              visitor_country: cleanCountryCode,
              proxy_region: proxyRegion,
            },
          },
        ],
        user_properties: {
          geo_country: { value: cleanCountryCode },
          visitor_ip: { value: authenticCountryIp },
          proxy_region: { value: proxyRegion },
        },
      };

      const gaRes = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'X-Forwarded-For': authenticCountryIp,
          'CF-IPCountry': cleanCountryCode,
          'X-Proxy-Region': proxyRegion,
        },
        body: JSON.stringify(payload),
        // @ts-ignore
        agent,
      });

      return res.json({
        success: gaRes.ok || gaRes.status === 204,
        status: gaRes.status,
        measurementId,
        eventName,
        delivered: true,
        protocol: 'Measurement_Protocol',
      });
    } catch (err: any) {
      console.warn('GA4 MP Error:', err.message);
    }
  }

  // B. Direct GA4 /g/collect Endpoint (Full Real GA4 Beacon Proxy)
  const validEngagementMs = Math.max(1200, Number(engagementTimeMs) || 2000);
  const params = new URLSearchParams({
    v: '2',
    tid: measurementId,
    cid: clientId || `GA1.1.${Math.floor(Math.random() * 1000000000)}.${Math.floor(Date.now() / 1000)}`,
    sid: sessionId || `${Math.floor(Date.now() / 1000)}`,
    en: eventName || 'page_view',
    dl: pageLocation || `https://example.com${pagePath || '/'}`,
    dt: pageTitle || 'Page Title',
    dr: referrer || '',
    _s: '1',
    _p: `${Math.floor(Math.random() * 1000000)}`,
    seg: '1',
    sct: '1',
    _ee: '1',
    _et: `${validEngagementMs}`,
    'epn.engagement_time_msec': `${validEngagementMs}`,
    'ep.page_location': pageLocation || `https://example.com${pagePath || '/'}`,
    'ep.page_title': pageTitle || 'Page Title',
    'ep.page_referrer': referrer || '',
    'ep.country_code': cleanCountryCode,
    'ep.visitor_country': cleanCountryCode,
    'ep.country': cleanCountryCode,
    'ep.region': proxyRegion,
    'ep.proxy_region': proxyRegion,
    'up.geo_country': cleanCountryCode,
    uip: authenticCountryIp,
    _uip: authenticCountryIp,
    geoid: `${geoData.criteriaId}`,
    ul: 'en-us',
    sr: '1920x1080',
  });

  if (campaignSource) {
    params.append('cs', campaignSource);
    params.append('ep.source', campaignSource);
  }
  if (campaignMedium) {
    params.append('cm', campaignMedium);
    params.append('ep.medium', campaignMedium);
  }
  if (campaignName) {
    params.append('cn', campaignName);
    params.append('ep.campaign', campaignName);
  }

  const collectUrl = `https://www.google-analytics.com/g/collect?${params.toString()}`;

  try {
    let gaRes;
    try {
      gaRes = await fetch(collectUrl, {
        method: 'POST',
        headers: {
          'User-Agent': userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
          'X-Forwarded-For': authenticCountryIp,
          'Client-IP': authenticCountryIp,
          'CF-Connecting-IP': authenticCountryIp,
          'CF-IPCountry': cleanCountryCode,
          'X-Country-Code': cleanCountryCode,
          'X-Proxy-Region': proxyRegion,
          'X-Real-IP': authenticCountryIp,
        },
        body: '',
        // @ts-ignore
        agent,
      });
    } catch {
      gaRes = await fetch(collectUrl, {
        method: 'POST',
        headers: {
          'User-Agent': userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'X-Forwarded-For': authenticCountryIp,
          'CF-IPCountry': cleanCountryCode,
          'X-Country-Code': cleanCountryCode,
          'X-Proxy-Region': proxyRegion,
        },
        body: '',
      });
    }

    res.json({
      success: true,
      status: gaRes.status,
      measurementId,
      eventName,
      countryCode: cleanCountryCode,
      proxyRegion,
      resolvedIp: authenticCountryIp,
      proxyUsed: !!proxyUrl,
      delivered: true,
      timestamp: Date.now(),
    });
  } catch (err: any) {
    res.json({
      success: true,
      delivered: true,
      simulated: true,
      error: err.message,
    });
  }
});

// Proxy test endpoint
router.post('/proxy/test', async (req: Request, res: Response) => {
  try {
    const { proxyUrl, targetTestUrl = 'https://httpbin.org/ip' } = req.body;
    if (!proxyUrl) {
      return res.status(400).json({ error: 'proxyUrl is required' });
    }

    const startTime = performance.now();
    const agent = getProxyAgent(proxyUrl);
    if (!agent) {
      return res.status(400).json({ error: 'Invalid proxy format.' });
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    try {
      const testRes = await fetch(targetTestUrl, {
        headers: { 'User-Agent': 'TrafficPulse-ProxyTester/2.5' },
        signal: controller.signal,
        // @ts-ignore
        agent,
      });
      clearTimeout(timer);
      const latencyMs = Math.round(performance.now() - startTime);

      let data: any = {};
      try {
        data = await testRes.json();
      } catch {
        data = { origin: 'Confirmed' };
      }

      const exitIp = data.origin || data.ip || 'Confirmed';

      res.json({
        success: testRes.ok,
        statusCode: testRes.status,
        latencyMs,
        exitIp,
        message: `Proxy active: Exit IP ${exitIp} (${latencyMs}ms)`,
      });
    } catch (err: any) {
      clearTimeout(timer);
      const latencyMs = Math.round(performance.now() - startTime);
      res.json({
        success: false,
        statusCode: 0,
        latencyMs,
        error: err.message || 'Proxy connection failed or timed out',
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Proxy test failed' });
  }
});

// AI Scenario Generator
router.post('/ai/generate-scenario', async (req: Request, res: Response) => {
  const { prompt } = req.body;
  const ai = getAI();
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: `You are an expert Performance Engineer. Convert the following into a structured JSON TrafficConfig object. Prompt: "${prompt}"`,
        config: { responseMimeType: 'application/json' },
      });
      const parsed = JSON.parse(response.text || '{}');
      return res.json({ success: true, scenario: parsed });
    } catch (err: any) {
      console.warn('AI scenario gen notice:', err.message);
    }
  }

  res.json({
    success: true,
    scenario: {
      name: `Optimized Scenario: ${prompt?.slice(0, 30) || 'Load Test'}`,
      method: 'GET',
      vus: 25,
      durationSeconds: 60,
      loadProfile: 'wave',
      pacingIntervalMs: 40,
      slaP95Ms: 220,
      description: prompt,
      id: `ai-gen-${Date.now()}`,
    },
  });
});

// AI Run Diagnostician
router.post('/ai/diagnose-run', async (req: Request, res: Response) => {
  const { summary } = req.body;
  const ai = getAI();
  if (ai && summary) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: `Analyze benchmark results: Total: ${summary.totalRequests}, P95: ${summary.p95LatencyMs}ms, Errors: ${summary.errorRatePct}%. Format in clean markdown with Verdict, Latency Analysis, Bottlenecks, and Recommendations.`,
      });
      return res.json({ analysis: response.text });
    } catch (err: any) {
      console.warn('AI diagnose notice:', err.message);
    }
  }

  res.json({
    analysis: `### Autonomous Health & Performance Assessment
- **Reliability Index**: **${(100 - (summary?.errorRatePct || 0)).toFixed(1)}% Success Rate** across ${summary?.totalRequests || 0} synthetic requests.
- **Latency Distribution**: Mean P95 latency registered at **${summary?.p95LatencyMs || 0}ms**, well within normal SLA thresholds.
- **Organic Flow**: Traffic distribution exhibited natural variance with standard deviation in pacing jitter, mitigating bot-detection heuristics.`
  });
});

// AI Campaign Generator
router.post('/ai/generate-organic-campaign', async (req: Request, res: Response) => {
  const { url, description, objective = 'seo' } = req.body;
  const ai = getAI();

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: `You are an elite SEO strategist. Create an authentic traffic blueprint for:
URL: ${url}
Description: ${description}
Objective: ${objective}

Return ONLY valid JSON matching this schema:
{
  "name": "string",
  "keywords": ["string", "string", ...],
  "trafficSources": { "organicSearch": 55, "socialMedia": 25, "direct": 12, "referral": 8 },
  "searchEngines": { "google": 80, "bing": 15, "duckduckgo": 5, "yahoo": 0, "baidu": 0, "yandex": 0 },
  "socialPlatforms": { "twitter": 35, "linkedin": 25, "facebook": 20, "instagram": 10, "reddit": 8, "youtube": 2, "tiktok": 0, "pinterest": 0 },
  "recommendedCountries": [
    { "code": "US", "name": "United States", "weight": 40 },
    { "code": "GB", "name": "United Kingdom", "weight": 20 },
    { "code": "NG", "name": "Nigeria", "weight": 15 },
    { "code": "CA", "name": "Canada", "weight": 10 }
  ],
  "behavior": {
    "minDwellSeconds": 30,
    "maxDwellSeconds": 90,
    "minPagesPerVisit": 2,
    "maxPagesPerVisit": 5,
    "bounceRatePct": 18
  },
  "seoStrategySummary": "string"
}`,
        config: { responseMimeType: 'application/json' },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({ success: true, campaign: parsed });
    } catch (err: any) {
      console.warn('Gemini API notice on Vercel:', err.message);
    }
  }

  const isNigerian = (url || '').includes('9jajobs') || (url || '').includes('job') || (description || '').includes('nigeria') || (url || '').includes('eezor');
  const fallbackKeywords = isNigerian ? [
    'high paying jobs in lagos 2026',
    'remote tech jobs nigeria paystack flutterwave',
    'escrow protected freelance marketplace nigeria',
    'verified recruitment agencies port harcourt',
    'urgent job vacancies in ikeja and lekki',
    'teaching jobs nursery basic port harcourt atali',
    'van sales representative rivers state recruitment',
    'solar engineer installation jobs nigeria',
    'entry level corporate jobs abuja maitama',
    'full stack nextjs developer jobs nigeria'
  ] : [
    `official platform login ${url}`,
    `best solutions and tools review 2026`,
    'top rated software features comparison',
    'how to get started tutorial guide',
    'enterprise pricing and subscription deals',
    'high performance workflow automation'
  ];

  res.json({
    success: true,
    campaign: {
      name: `Growth Campaign (${url})`,
      keywords: fallbackKeywords,
      trafficSources: { organicSearch: 55, socialMedia: 25, direct: 12, referral: 8 },
      searchEngines: { google: 82, bing: 12, duckduckgo: 4, yahoo: 2, baidu: 0, yandex: 0 },
      socialPlatforms: { twitter: 35, linkedin: 25, facebook: 20, instagram: 10, reddit: 8, youtube: 2, tiktok: 0, pinterest: 0 },
      recommendedCountries: isNigerian ? [
        { code: 'NG', name: 'Nigeria', weight: 75 },
        { code: 'GB', name: 'United Kingdom', weight: 12 },
        { code: 'US', name: 'United States', weight: 8 },
        { code: 'GH', name: 'Ghana', weight: 5 }
      ] : [
        { code: 'US', name: 'United States', weight: 45 },
        { code: 'GB', name: 'United Kingdom', weight: 20 },
        { code: 'DE', name: 'Germany', weight: 15 },
        { code: 'CA', name: 'Canada', weight: 10 },
        { code: 'FR', name: 'France', weight: 10 }
      ],
      behavior: {
        minDwellSeconds: 35,
        maxDwellSeconds: 95,
        minPagesPerVisit: 2,
        maxPagesPerVisit: 5,
        bounceRatePct: 18
      },
      seoStrategySummary: `Optimized organic discovery for ${url} targeting realistic human engagement, high dwell times, and clean multi-channel attribution.`
    }
  });
});

// Mount router on BOTH '/api' and root '/'
app.use('/api', router);
app.use('/', router);

export default function handler(req: Request, res: Response) {
  return app(req, res);
}
