import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Heart, 
  MessageCircle, 
  Share2, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Sparkles, 
  ExternalLink,
  ShieldCheck,
  Check,
  Disc,
  Eye,
  Video,
  Radio,
  RefreshCw,
  ThumbsUp,
  Flame,
  AlertTriangle
} from 'lucide-react';
import { SocialMediaInfo, generateSocialMediaRoutes, VERIFIED_DIRECT_VIDEO_STREAMS } from '../utils/socialMediaEmbed';
import { ActiveVisitorSession } from '../types';

interface SocialVideoDomSimulatorProps {
  socialInfo: SocialMediaInfo;
  targetUrl: string;
  selectedVisitor?: ActiveVisitorSession;
  onNavigateToUrl?: (url: string) => void;
  onSwitchToLive?: () => void;
}

export const SocialVideoDomSimulator: React.FC<SocialVideoDomSimulatorProps> = ({
  socialInfo,
  targetUrl,
  selectedVisitor,
  onNavigateToUrl,
  onSwitchToLive,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [likesCount, setLikesCount] = useState(24820);
  const [hasLiked, setHasLiked] = useState(false);
  const [hearts, setHearts] = useState<Array<{ id: number; emoji: string; x: number; y: number }>>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [playerMode, setPlayerMode] = useState<'direct_stream' | 'official_embed'>('direct_stream');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState('00:32');
  const [progressPct, setProgressPct] = useState(35);

  // Dynamic Metadata resolved via Media Proxy
  const [videoTitle, setVideoTitle] = useState(socialInfo.titleSuggestion);
  const [videoDesc, setVideoDesc] = useState(`Real-time verified media stream from ${socialInfo.platformName}.`);
  const [videoPoster, setVideoPoster] = useState('');
  const [iframeStatus, setIframeStatus] = useState<'loading' | 'loaded' | 'error' | 'timeout'>('loading');

  const [comments, setComments] = useState([
    { id: 1, name: 'David Miller', text: 'This stream clarity is incredible! Loving the sound design 🙌', time: '1m ago' },
    { id: 2, name: 'Elena Martinez', text: 'Watching from California! Shared this to my group chat ❤️', time: '2m ago' },
    { id: 3, name: 'Alex Kim', text: 'The camera work at 1:45 is totally fire 🔥', time: '4m ago' },
  ]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const iframeTimeoutRef = useRef<any>(null);

  const platformName = socialInfo.platformName;
  const platform = socialInfo.platform;
  const routes = generateSocialMediaRoutes(targetUrl, socialInfo);
  const primaryVideoSrc = socialInfo.directVideoSources?.[0] || VERIFIED_DIRECT_VIDEO_STREAMS[0];
  const proxiedStreamSrc = `/api/browser/media-proxy/stream?url=${encodeURIComponent(socialInfo.canonicalUrl || targetUrl)}`;

  const platformColor = 
    platform === 'facebook' ? '#1877F2' :
    platform === 'youtube' ? '#FF0000' :
    platform === 'instagram' ? '#E1306C' :
    platform === 'tiktok' ? '#00F2FE' :
    platform === 'vimeo' ? '#1AB7EA' :
    '#38BDF8';

  // Fetch real social metadata from Media Proxy on mount
  useEffect(() => {
    let isCancelled = false;
    async function loadMeta() {
      try {
        const res = await fetch(`/api/browser/media-proxy?url=${encodeURIComponent(targetUrl)}`);
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled && data.success) {
            if (data.title && !data.title.toLowerCase().includes('log in')) {
              setVideoTitle(data.title);
            }
            if (data.description && !data.description.toLowerCase().includes('log into')) {
              setVideoDesc(data.description);
            }
            if (data.poster) {
              setVideoPoster(data.poster);
            }
          }
        }
      } catch {}
    }
    loadMeta();
    return () => { isCancelled = true; };
  }, [targetUrl]);

  // Autoplay video on mount
  useEffect(() => {
    if (videoRef.current && playerMode === 'direct_stream') {
      videoRef.current.muted = isMuted;
      videoRef.current.play().catch(() => {});
    }
  }, [playerMode, isMuted]);

  // Monitor iframe loading and timeout recovery
  useEffect(() => {
    if (playerMode === 'official_embed') {
      setIframeStatus('loading');
      if (iframeTimeoutRef.current) clearTimeout(iframeTimeoutRef.current);
      iframeTimeoutRef.current = setTimeout(() => {
        setIframeStatus(prev => prev === 'loading' ? 'timeout' : prev);
      }, 3500);
    }
    return () => {
      if (iframeTimeoutRef.current) clearTimeout(iframeTimeoutRef.current);
    };
  }, [playerMode, targetUrl]);

  // Video time tracking
  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      const cur = videoRef.current.currentTime;
      const dur = videoRef.current.duration;
      setProgressPct((cur / dur) * 100);
      const mins = Math.floor(cur / 60);
      const secs = Math.floor(cur % 60);
      setCurrentTime(`${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  const triggerReaction = (emoji: string = '❤️', e?: React.MouseEvent) => {
    if (emoji === '❤️') {
      setLikesCount(prev => prev + (hasLiked ? -1 : 1));
      setHasLiked(!hasLiked);
    }
    const clientX = e ? e.clientX : window.innerWidth / 2 + (Math.random() * 80 - 40);
    const clientY = e ? e.clientY : window.innerHeight / 2;
    const newHeart = { id: Date.now() + Math.random(), emoji, x: clientX, y: clientY };
    setHearts(prev => [...prev.slice(-8), newHeart]);
    setTimeout(() => {
      setHearts(prev => prev.filter(h => h.id !== newHeart.id));
    }, 1200);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(socialInfo.canonicalUrl || targetUrl);
    setToastMessage('Live stream link copied to clipboard!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Add periodic simulated comments
  useEffect(() => {
    const interval = setInterval(() => {
      const sampleNames = ['Sophie Martin', 'Ryan Chen', 'Lucas Brown', 'Jessica Taylor', 'Noah Wilson'];
      const sampleTexts = [
        'Great live broadcast quality! 🔥',
        'Shared this with my followers ↗️',
        'Loving the live chat vibe tonight ❤️',
        'Audio is super clean and crisp 🎧',
        'Watching from London, hello everyone! 👋'
      ];
      const newComment = {
        id: Date.now(),
        name: sampleNames[Math.floor(Math.random() * sampleNames.length)],
        text: sampleTexts[Math.floor(Math.random() * sampleTexts.length)],
        time: 'Just now'
      };
      setComments(prev => [newComment, ...prev.slice(0, 5)]);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 font-sans select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 border border-emerald-500/60 text-emerald-300 px-4 py-2 rounded-xl text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Floating Animated Reaction Emojis */}
      {hearts.map(h => (
        <div
          key={h.id}
          className="fixed pointer-events-none z-50 text-3xl animate-bounce"
          style={{ left: h.x - 14, top: h.y - 30 }}
        >
          {h.emoji}
        </div>
      ))}

      {/* Top Social Platform Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-extrabold text-sm shadow-md shrink-0"
            style={{ backgroundColor: platformColor }}
          >
            {platform === 'facebook' ? 'fb' : platform === 'youtube' ? 'YT' : platform === 'instagram' ? 'IG' : '▶'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-wide">{platformName} Live Stream</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-500/30 flex items-center gap-1 font-mono font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                LIVE
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 font-mono">
                Media Proxy Active
              </span>
            </div>
            <div className="text-xs text-slate-400 font-mono truncate max-w-md">{targetUrl}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onSwitchToLive && (
            <button
              type="button"
              onClick={onSwitchToLive}
              className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Full Browser Live Webview</span>
            </button>
          )}
          <a
            href={targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700 flex items-center gap-1 text-xs"
            title={`Open directly on ${platformName}`}
          >
            <span>Open on {platformName}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Main Video Viewport Stage */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
        {/* Stream Source Mode Selector */}
        <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPlayerMode('direct_stream')}
              className={`px-3 py-1 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                playerMode === 'direct_stream'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
              <span>⚡ Active Media Proxy Stream (Zero Error / 100% Active)</span>
            </button>

            <button
              type="button"
              onClick={() => setPlayerMode('official_embed')}
              className={`px-3 py-1 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                playerMode === 'official_embed'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <span>📘 {platformName} Official Embed</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span>HD 1080p 60fps</span>
            <span>•</span>
            <span className="text-emerald-400 font-mono">Stream Online</span>
          </div>
        </div>

        {/* Video Player Box */}
        <div className="w-full relative bg-black aspect-video flex items-center justify-center overflow-hidden">
          {playerMode === 'direct_stream' ? (
            <div className="w-full h-full relative group">
              {/* High Definition HTML5 Video Element with Media Proxy + Verified CDN Fallback */}
              <video
                ref={videoRef}
                poster={videoPoster || undefined}
                autoPlay
                muted={isMuted}
                loop
                playsInline
                onTimeUpdate={handleTimeUpdate}
                className="w-full h-full object-cover bg-black"
              >
                <source src={proxiedStreamSrc} type="video/mp4" />
                <source src={primaryVideoSrc} type="video/mp4" />
              </video>

              {/* Vignette Overlay */}
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/80 via-transparent to-black/60" />

              {/* Top HUD */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 pointer-events-none">
                <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-700 text-xs font-mono text-slate-200 pointer-events-auto">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <span className="font-bold">2.4K Watching Live</span>
                </div>
                <div className="flex items-center gap-2 pointer-events-auto">
                  <span className="bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700 text-[10px] font-mono text-cyan-300 font-bold">
                    1080p 60fps ULTRA HD
                  </span>
                </div>
              </div>

              {/* Center Play/Pause button on hover or pause */}
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-auto">
                {!isPlaying && (
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="w-16 h-16 rounded-full bg-cyan-500/90 hover:bg-cyan-400 text-slate-950 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.6)] transition-transform hover:scale-105 cursor-pointer"
                  >
                    <Play className="w-7 h-7 fill-current ml-1" />
                  </button>
                )}
              </div>

              {/* Bottom Scrubber & Controls */}
              <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2 z-10 bg-gradient-to-t from-black/90 to-transparent">
                <div 
                  className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden cursor-pointer"
                  onClick={(e) => {
                    if (videoRef.current && videoRef.current.duration) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const ratio = (e.clientX - rect.left) / rect.width;
                      videoRef.current.currentTime = ratio * videoRef.current.duration;
                    }
                  }}
                >
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 rounded-full relative transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={togglePlay} className="hover:text-white cursor-pointer">
                      {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                    </button>
                    <button type="button" onClick={toggleMute} className="hover:text-white cursor-pointer">
                      {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <span className="text-slate-300">● LIVE {currentTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Disc className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                    <span>Media Proxy Stream Active</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-full relative bg-black flex flex-col justify-between">
              {/* Iframe with official Facebook/platform embed */}
              <iframe
                ref={iframeRef}
                src={socialInfo.directEmbedUrl}
                className="w-full h-full border-none bg-black"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture; web-share"
                allowFullScreen
                onLoad={() => setIframeStatus('loaded')}
                onError={() => setIframeStatus('error')}
              />

              {/* Smart Recovery Alert Bar */}
              {(iframeStatus === 'timeout' || iframeStatus === 'error') && (
                <div className="absolute bottom-2 left-2 right-2 bg-slate-900/95 border border-amber-500/70 p-3 rounded-xl text-xs text-amber-200 flex items-center justify-between backdrop-blur-md shadow-2xl animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      {platformName} video unavailable or restricted by browser cookie policies.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPlayerMode('direct_stream')}
                    className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold text-xs cursor-pointer shrink-0 ml-3 shadow-md"
                  >
                    Switch to Media Proxy Stream
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Creator Header Bar */}
        <div className="p-4 sm:p-5 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div 
              className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-base shadow-md ring-2 ring-white/10 shrink-0"
              style={{ backgroundColor: platformColor }}
            >
              {platformName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white text-sm">{platformName} Verified Creator</span>
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span className="text-[10px] text-slate-400">• Official Channel</span>
              </div>
              <div className="text-xs text-slate-400">2.8M Followers • Live Broadcast</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsFollowing(!isFollowing)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
                isFollowing 
                  ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40' 
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              {isFollowing ? '✓ Following' : '+ Follow Channel'}
            </button>
          </div>
        </div>

        {/* Live Reaction Bar (Facebook Live style) */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => triggerReaction('❤️', e)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                hasLiked 
                  ? 'bg-rose-950/70 border-rose-500/60 text-rose-300' 
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span>❤️</span>
              <span>{(likesCount / 1000).toFixed(1)}K Likes</span>
            </button>

            <button
              type="button"
              onClick={(e) => triggerReaction('👍', e)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <span>👍</span>
              <span>Like</span>
            </button>

            <button
              type="button"
              onClick={(e) => triggerReaction('🔥', e)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <span>🔥</span>
              <span>Fire</span>
            </button>

            <button
              type="button"
              onClick={(e) => triggerReaction('🥰', e)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <span>🥰</span>
              <span>Love</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Video Details & Caption Box */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2">
        <div className="text-sm font-bold text-white leading-snug">{videoTitle}</div>
        <div className="text-xs text-slate-300 leading-relaxed">{videoDesc}</div>
        <div className="flex flex-wrap gap-2 pt-1">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">#{platform}</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">#live</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">#videostream</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">#trafficpulse</span>
        </div>
      </div>

      {/* Up Next Recommended Routes */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
          <span className="flex items-center gap-1.5">
            <Video className="w-4 h-4 text-cyan-400" />
            <span>🎬 Up Next: Recommended Video Routes</span>
          </span>
          <span className="text-[11px] text-cyan-400 font-normal">Click to Navigate Simulator</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {routes.map((route, i) => (
            <button
              key={route.path + i}
              type="button"
              onClick={() => onNavigateToUrl?.(route.url || route.path)}
              className="p-3 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 text-left transition-all group cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                  <span>▶ Route 0{i + 1}</span>
                  <span className="text-slate-500">• {route.category}</span>
                </div>
                <div className="text-xs font-bold text-white group-hover:text-cyan-300 line-clamp-1 mb-1">
                  {route.title}
                </div>
                <div className="text-[11px] text-slate-400 line-clamp-2">
                  {route.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Live Discussion & Viewer Comments */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
          <span className="flex items-center gap-1.5">
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>💬 Live Discussion & Viewer Stream</span>
          </span>
          <span className="text-[11px] text-emerald-400 font-normal">● 18 comments / min</span>
        </div>

        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {comments.map(c => (
            <div key={c.id} className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-2.5 text-xs">
              <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-[10px] text-cyan-300 shrink-0">
                {c.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-[11px]">{c.name}</span>
                  <span className="text-[10px] text-slate-500">{c.time}</span>
                </div>
                <div className="text-slate-300 text-xs mt-0.5">{c.text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
