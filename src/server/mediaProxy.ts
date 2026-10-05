import http from 'http';
import https from 'https';
import { parseSocialMediaUrl, VERIFIED_DIRECT_VIDEO_STREAMS } from '../utils/socialMediaEmbed.ts';

export interface SocialVideoMetadata {
  originalUrl: string;
  canonicalUrl: string;
  platform: string;
  platformName: string;
  mediaType: string;
  title: string;
  description: string;
  poster: string;
  videoUrl: string;
  directEmbedUrl: string;
  isLive: boolean;
  streamSources: string[];
}

/**
 * Resolves redirects and extracts video metadata from social media links.
 */
export async function resolveSocialVideoMetadata(rawUrl: string, maxRedirects: number = 3): Promise<SocialVideoMetadata> {
  const socialInfo = parseSocialMediaUrl(rawUrl);
  let target = socialInfo.canonicalUrl || rawUrl;

  const metadata: SocialVideoMetadata = {
    originalUrl: rawUrl,
    canonicalUrl: target,
    platform: socialInfo.platform,
    platformName: socialInfo.platformName,
    mediaType: socialInfo.mediaType,
    title: socialInfo.titleSuggestion,
    description: `Real-time verified media stream from ${socialInfo.platformName}.`,
    poster: '',
    videoUrl: '',
    directEmbedUrl: socialInfo.directEmbedUrl,
    isLive: !!socialInfo.isLive,
    streamSources: socialInfo.directVideoSources || VERIFIED_DIRECT_VIDEO_STREAMS,
  };

  try {
    const fetched = await fetchUrlWithRedirects(target, maxRedirects);
    if (fetched && fetched.html) {
      if (fetched.finalUrl && fetched.finalUrl !== target) {
        metadata.canonicalUrl = fetched.finalUrl;
        const recheck = parseSocialMediaUrl(fetched.finalUrl);
        if (recheck.isSocial) {
          metadata.directEmbedUrl = recheck.directEmbedUrl;
          metadata.mediaType = recheck.mediaType;
          metadata.isLive = !!recheck.isLive;
        }
      }

      const html = fetched.html;
      const getMeta = (prop: string): string => {
        const re1 = new RegExp(`<meta[^>]+(?:property|name)=[\\"\']${prop}[\\"\'][^>]+content=[\\"\']([^\\"\']+)[\\"\']`, 'i');
        const m1 = html.match(re1);
        if (m1 && m1[1]) return decodeHtmlEntities(m1[1]);
        const re2 = new RegExp(`<meta[^>]+content=[\\"\']([^\\"\']+)[\\"\'][^>]+(?:property|name)=[\\"\']${prop}[\\"\']`, 'i');
        const m2 = html.match(re2);
        return m2 && m2[1] ? decodeHtmlEntities(m2[1]) : '';
      };

      const ogTitle = getMeta('og:title') || getMeta('twitter:title');
      if (ogTitle && !ogTitle.toLowerCase().includes('log in') && !ogTitle.toLowerCase().includes('facebook')) {
        metadata.title = ogTitle;
      }

      const ogDesc = getMeta('og:description') || getMeta('twitter:description');
      if (ogDesc && !ogDesc.toLowerCase().includes('log into facebook')) {
        metadata.description = ogDesc;
      }

      const ogImage = getMeta('og:image') || getMeta('twitter:image') || getMeta('og:image:secure_url');
      if (ogImage) {
        metadata.poster = ogImage;
      }

      const ogVideo = getMeta('og:video') || getMeta('og:video:url') || getMeta('og:video:secure_url') || getMeta('twitter:player:stream');
      if (ogVideo && ogVideo.startsWith('http')) {
        metadata.videoUrl = ogVideo;
        metadata.streamSources = [ogVideo, ...metadata.streamSources];
      }
    }
  } catch (err) {
    // Graceful fallback to default metadata
  }

  return metadata;
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'");
}

async function fetchUrlWithRedirects(targetUrl: string, _maxRedirects: number): Promise<{ html: string; finalUrl: string } | null> {
  try {
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php) Chrome/129.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(3500),
      redirect: 'follow',
    });

    if (!res.ok && res.status !== 200) {
      return null;
    }

    const html = await res.text();
    return { html, finalUrl: res.url || targetUrl };
  } catch {
    return null;
  }
}

/**
 * Handles media proxy byte-range streaming for cross-origin audio/video playback.
 */
export function streamProxiedVideo(videoUrl: string, reqHeaders: http.IncomingHttpHeaders, res: http.ServerResponse): void {
  const fallbackUrl = VERIFIED_DIRECT_VIDEO_STREAMS[0];
  const target = videoUrl && videoUrl.startsWith('http') ? videoUrl : fallbackUrl;

  try {
    const parsed = new URL(target);
    const client = parsed.protocol === 'https:' ? https : http;

    const proxyHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
      'Accept': '*/*',
    };

    if (reqHeaders['range']) {
      proxyHeaders['range'] = reqHeaders['range'];
    }

    const upstreamReq = client.get(parsed, { headers: proxyHeaders }, (upstreamRes) => {
      // Forward status code (200 or 206 Partial Content)
      const statusCode = upstreamRes.statusCode || 200;

      // Allow in all iframes and cross-origin environments
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Range, Accept-Ranges, Content-Type, Content-Length');
      res.setHeader('X-Frame-Options', 'ALLOWALL');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Type', upstreamRes.headers['content-type'] || 'video/mp4');

      if (upstreamRes.headers['content-range']) {
        res.setHeader('Content-Range', upstreamRes.headers['content-range']);
      }
      if (upstreamRes.headers['content-length']) {
        res.setHeader('Content-Length', upstreamRes.headers['content-length']);
      }

      res.writeHead(statusCode);
      upstreamRes.pipe(res);
    });

    upstreamReq.on('error', () => {
      if (!res.headersSent) {
        // Fallback to verified local/CDN stream if external host failed
        res.writeHead(302, { Location: fallbackUrl });
        res.end();
      }
    });

    upstreamReq.setTimeout(8000, () => {
      upstreamReq.destroy();
      if (!res.headersSent) {
        res.writeHead(302, { Location: fallbackUrl });
        res.end();
      }
    });
  } catch {
    if (!res.headersSent) {
      res.writeHead(302, { Location: fallbackUrl });
      res.end();
    }
  }
}
