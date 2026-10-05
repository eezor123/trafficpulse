/**
 * Social Media & Video URL Embedding & Simulation Utility
 * Handles Facebook Video, Live, Reels, Posts, YouTube, Instagram, TikTok, Twitter/X, and Vimeo.
 * Converts direct post/video URLs to embed-compatible URLs that bypass X-Frame-Options restrictions,
 * provides verified direct video stream fallbacks, and creates realistic navigable routes for the simulator.
 */

export interface SocialMediaInfo {
  isSocial: boolean;
  platform: 'facebook' | 'youtube' | 'instagram' | 'tiktok' | 'twitter' | 'vimeo' | 'generic_video' | 'none';
  platformName: string;
  mediaType: 'video' | 'reel' | 'post' | 'channel' | 'photo' | 'page';
  directEmbedUrl: string;
  canonicalUrl: string;
  videoId?: string;
  authorOrChannel?: string;
  titleSuggestion: string;
  isEmbedAllowedDirectly: boolean;
  isLive?: boolean;
  directVideoSources: string[];
}

// Highly reliable, public high-definition video streams with open CORS and zero expiration
export const VERIFIED_DIRECT_VIDEO_STREAMS = [
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  'https://www.w3schools.com/html/mov_bbb.mp4',
  'https://www.w3schools.com/tags/movie.mp4',
];

/**
 * Determines whether a given URL is a social media or video link and extracts metadata & embed targets.
 */
export function parseSocialMediaUrl(rawUrl: string): SocialMediaInfo {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return {
      isSocial: false,
      platform: 'none',
      platformName: 'Unknown',
      mediaType: 'page',
      directEmbedUrl: rawUrl || '',
      canonicalUrl: rawUrl || '',
      titleSuggestion: 'Web Page',
      isEmbedAllowedDirectly: false,
      directVideoSources: VERIFIED_DIRECT_VIDEO_STREAMS,
    };
  }

  const clean = rawUrl.trim();
  const withProtocol = clean.startsWith('http://') || clean.startsWith('https://')
    ? clean
    : `https://${clean}`;

  let parsed: URL;
  try {
    parsed = new URL(withProtocol);
  } catch {
    return {
      isSocial: false,
      platform: 'none',
      platformName: 'Invalid URL',
      mediaType: 'page',
      directEmbedUrl: rawUrl,
      canonicalUrl: rawUrl,
      titleSuggestion: 'Web Page',
      isEmbedAllowedDirectly: false,
      directVideoSources: VERIFIED_DIRECT_VIDEO_STREAMS,
    };
  }

  const host = parsed.hostname.toLowerCase().replace(/^www\./, '').replace(/^m\./, '').replace(/^web\./, '');
  const pathname = parsed.pathname;
  const search = parsed.searchParams;

  // --------------------------------------------------------------------------
  // 1. FACEBOOK (Videos, Live Broadcasts, Reels, Watch, Shares, Posts)
  // --------------------------------------------------------------------------
  if (host === 'facebook.com' || host === 'fb.watch' || host === 'fb.com') {
    const isLive = pathname.includes('/live') || search.has('live') || pathname.includes('watch/live') || pathname.includes('/watch/live/');
    const isFbWatch = host === 'fb.watch';
    const isWatchPath = pathname.startsWith('/watch') || search.has('v');
    const isReel = pathname.includes('/reel/') || pathname.includes('/reels/');
    const isVideoPath = pathname.includes('/videos/') || pathname.includes('/video.php');
    const isShareVideo = pathname.includes('/share/v/') || pathname.includes('/share/r/');
    const isPost = pathname.includes('/posts/') || pathname.includes('/story.php') || pathname.includes('/permalink.php') || pathname.includes('/share/p/');
    const isPhoto = pathname.includes('/photos/') || pathname.includes('/photo.php') || pathname.includes('/photo');

    const isVideo = isLive || isFbWatch || isWatchPath || isReel || isVideoPath || isShareVideo;
    const mediaType: SocialMediaInfo['mediaType'] = isReel ? 'reel' : isVideo ? 'video' : isPost ? 'post' : isPhoto ? 'photo' : 'page';

    let videoId: string | undefined = search.get('v') || undefined;
    if (!videoId) {
      if (isFbWatch) {
        const seg = pathname.replace(/^\//, '').split('/')[0];
        if (seg) videoId = seg;
      } else {
        const match = pathname.match(/(?:videos|reel|reels|share\/v|share\/r|live)\/([0-9a-zA-Z_-]+)/);
        if (match) videoId = match[1];
      }
    }

    // Clean tracking parameters (mibextid, sfnsn, fbclid, rdid, ref, __cft__, __tn__, s, fs, etc.)
    let cleanCanonical = withProtocol;
    if (videoId && /^\d+$/.test(videoId)) {
      cleanCanonical = isReel
        ? `https://www.facebook.com/reel/${videoId}`
        : isLive
        ? `https://www.facebook.com/watch/live/?v=${videoId}`
        : `https://www.facebook.com/watch/?v=${videoId}`;
    } else {
      const cleanParams = new URLSearchParams(search);
      const trackingKeys = ['mibextid', 'sfnsn', 'fbclid', 'rdid', 'ref', '__cft__', '__tn__', 's', 'fs', 'wtsid', 'extid', 'context'];
      trackingKeys.forEach(k => cleanParams.delete(k));
      const q = cleanParams.toString();
      cleanCanonical = `${parsed.origin}${parsed.pathname}${q ? `?${q}` : ''}`;
    }

    // Direct embed URL using Facebook's official plugins:
    // IMPORTANT: Facebook plugins REQUIRE width to be an integer (e.g. 560 or 500) and NEVER 'auto'!
    // show_text=0 removes header clutter, autoplay=1 enables direct broadcast
    const directEmbedUrl = isVideo
      ? `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(cleanCanonical)}&show_text=0&width=560&autoplay=1`
      : `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(cleanCanonical)}&show_text=true&width=560`;

    return {
      isSocial: true,
      platform: 'facebook',
      platformName: 'Facebook',
      mediaType,
      directEmbedUrl,
      canonicalUrl: cleanCanonical,
      videoId,
      titleSuggestion: isLive 
        ? 'Facebook Live Broadcast • Streaming Now' 
        : isReel 
        ? 'Facebook Reel Video' 
        : isVideo 
        ? 'Facebook Watch Video' 
        : 'Facebook Post Discussion',
      isEmbedAllowedDirectly: true,
      isLive,
      directVideoSources: VERIFIED_DIRECT_VIDEO_STREAMS,
    };
  }

  // --------------------------------------------------------------------------
  // 2. YOUTUBE (Watch, Shorts, Embed, youtu.be)
  // --------------------------------------------------------------------------
  if (host === 'youtube.com' || host === 'youtu.be' || host === 'm.youtube.com') {
    let videoId: string | undefined = undefined;
    let isShort = false;

    if (host === 'youtu.be') {
      videoId = pathname.replace(/^\//, '').split('/')[0] || undefined;
    } else if (pathname.includes('/shorts/')) {
      const match = pathname.match(/\/shorts\/([0-9a-zA-Z_-]+)/);
      if (match) videoId = match[1];
      isShort = true;
    } else if (pathname.includes('/embed/')) {
      const match = pathname.match(/\/embed\/([0-9a-zA-Z_-]+)/);
      if (match) videoId = match[1];
    } else {
      videoId = search.get('v') || undefined;
    }

    const cleanVideoId = videoId ? videoId.split('?')[0].split('&')[0] : '';
    const directEmbedUrl = cleanVideoId
      ? `https://www.youtube.com/embed/${cleanVideoId}?autoplay=1&enablejsapi=1&rel=0`
      : withProtocol;

    return {
      isSocial: true,
      platform: 'youtube',
      platformName: 'YouTube',
      mediaType: isShort ? 'reel' : 'video',
      directEmbedUrl,
      canonicalUrl: withProtocol,
      videoId: cleanVideoId,
      titleSuggestion: isShort ? 'YouTube Short Clip' : 'YouTube Video Stream',
      isEmbedAllowedDirectly: !!cleanVideoId,
      directVideoSources: VERIFIED_DIRECT_VIDEO_STREAMS,
    };
  }

  // --------------------------------------------------------------------------
  // 3. INSTAGRAM (Reels, Posts, TV)
  // --------------------------------------------------------------------------
  if (host === 'instagram.com' || host === 'instagr.am') {
    const isReel = pathname.includes('/reel/') || pathname.includes('/reels/');
    const isPost = pathname.includes('/p/') || pathname.includes('/tv/');
    let postId: string | undefined = undefined;
    const match = pathname.match(/\/(?:reel|reels|p|tv)\/([0-9a-zA-Z_-]+)/);
    if (match) postId = match[1];

    const directEmbedUrl = postId
      ? `https://www.instagram.com/${isReel ? 'reel' : 'p'}/${postId}/embed/`
      : withProtocol;

    return {
      isSocial: true,
      platform: 'instagram',
      platformName: 'Instagram',
      mediaType: isReel ? 'reel' : isPost ? 'post' : 'page',
      directEmbedUrl,
      canonicalUrl: withProtocol,
      videoId: postId,
      titleSuggestion: isReel ? 'Instagram Reel Clip' : 'Instagram Post & Video',
      isEmbedAllowedDirectly: !!postId,
      directVideoSources: VERIFIED_DIRECT_VIDEO_STREAMS,
    };
  }

  // --------------------------------------------------------------------------
  // 4. TIKTOK (Videos, Shortlinks)
  // --------------------------------------------------------------------------
  if (host === 'tiktok.com' || host === 'vm.tiktok.com' || host === 'vt.tiktok.com') {
    let videoId: string | undefined = undefined;
    const match = pathname.match(/\/video\/([0-9]+)/);
    if (match) videoId = match[1];

    const directEmbedUrl = videoId
      ? `https://www.tiktok.com/embed/v2/${videoId}`
      : withProtocol;

    return {
      isSocial: true,
      platform: 'tiktok',
      platformName: 'TikTok',
      mediaType: 'reel',
      directEmbedUrl,
      canonicalUrl: withProtocol,
      videoId,
      titleSuggestion: 'TikTok Viral Video',
      isEmbedAllowedDirectly: !!videoId,
      directVideoSources: VERIFIED_DIRECT_VIDEO_STREAMS,
    };
  }

  // --------------------------------------------------------------------------
  // 5. TWITTER / X (Posts, Statuses)
  // --------------------------------------------------------------------------
  if (host === 'twitter.com' || host === 'x.com') {
    let tweetId: string | undefined = undefined;
    const match = pathname.match(/\/status\/([0-9]+)/);
    if (match) tweetId = match[1];

    const directEmbedUrl = tweetId
      ? `https://platform.twitter.com/widgets/tweet.html?id=${tweetId}&dnt=true`
      : withProtocol;

    return {
      isSocial: true,
      platform: 'twitter',
      platformName: 'X (Twitter)',
      mediaType: 'post',
      directEmbedUrl,
      canonicalUrl: withProtocol,
      videoId: tweetId,
      titleSuggestion: 'X (Twitter) Post & Media',
      isEmbedAllowedDirectly: !!tweetId,
      directVideoSources: VERIFIED_DIRECT_VIDEO_STREAMS,
    };
  }

  // --------------------------------------------------------------------------
  // 6. VIMEO
  // --------------------------------------------------------------------------
  if (host === 'vimeo.com') {
    const match = pathname.match(/\/([0-9]+)/);
    const vimeoId = match ? match[1] : undefined;
    const directEmbedUrl = vimeoId
      ? `https://player.vimeo.com/video/${vimeoId}?autoplay=1`
      : withProtocol;

    return {
      isSocial: true,
      platform: 'vimeo',
      platformName: 'Vimeo',
      mediaType: 'video',
      directEmbedUrl,
      canonicalUrl: withProtocol,
      videoId: vimeoId,
      titleSuggestion: 'Vimeo High-Definition Video',
      isEmbedAllowedDirectly: !!vimeoId,
      directVideoSources: VERIFIED_DIRECT_VIDEO_STREAMS,
    };
  }

  // Not a social media video/post link
  return {
    isSocial: false,
    platform: 'none',
    platformName: parsed.hostname,
    mediaType: 'page',
    directEmbedUrl: withProtocol,
    canonicalUrl: withProtocol,
    titleSuggestion: parsed.hostname,
    isEmbedAllowedDirectly: false,
    directVideoSources: VERIFIED_DIRECT_VIDEO_STREAMS,
  };
}

/**
 * Generates realistic navigable sub-routes for social media video links
 * so that virtual simulator users can visit, dwell on, and navigate through the video experience.
 */
export function generateSocialMediaRoutes(
  targetUrl: string,
  info: SocialMediaInfo
): Array<{
  url: string;
  path: string;
  title: string;
  category: 'post' | 'page' | 'category';
  visitWeight: number;
  description: string;
}> {
  const canonical = info.canonicalUrl || targetUrl;
  const platformName = info.platformName;
  const mediaLabel = info.mediaType === 'reel' ? 'Reel' : info.mediaType === 'post' ? 'Post' : 'Video';

  let baseIdentifier = '';
  try {
    const p = new URL(canonical);
    baseIdentifier = p.pathname + p.search;
  } catch {
    baseIdentifier = '/watch';
  }

  return [
    {
      url: canonical,
      path: baseIdentifier || '/',
      title: `${platformName} ${mediaLabel} - Live Stream & Playback`,
      category: 'post',
      visitWeight: 100,
      description: `Primary active view of ${platformName} ${mediaLabel.toLowerCase()} with full playback, sound, and live interactive HUD.`,
    },
    {
      url: `${canonical}#comments`,
      path: `${baseIdentifier}#comments`,
      title: `Comments & Community Discussion (${platformName})`,
      category: 'post',
      visitWeight: 80,
      description: `Visitor scrolling into user comments, pinned replies, and viewer reactions.`,
    },
    {
      url: `${canonical}#author-channel`,
      path: `${baseIdentifier}#author-channel`,
      title: `Creator Official Channel & Video Portfolio`,
      category: 'category',
      visitWeight: 65,
      description: `Browsing creator profile, follower metrics, and upload playlist.`,
    },
    {
      url: `${canonical}#up-next-1`,
      path: `${baseIdentifier}#up-next-1`,
      title: `Up Next: Trending Highlight Stream 01`,
      category: 'post',
      visitWeight: 75,
      description: `Simulator auto-navigating to the next recommended video in the playlist stream.`,
    },
    {
      url: `${canonical}#up-next-2`,
      path: `${baseIdentifier}#up-next-2`,
      title: `Up Next: Related Live Discussion 02`,
      category: 'post',
      visitWeight: 70,
      description: `Simulator browsing companion live broadcast session with viewer interactions.`,
    },
    {
      url: `${canonical}#theater-fullscreen`,
      path: `${baseIdentifier}#theater-fullscreen`,
      title: `Theater Mode & Fullscreen Replay`,
      category: 'post',
      visitWeight: 50,
      description: `Full cinema theater viewport simulation with replay and social share.`,
    },
  ];
}
