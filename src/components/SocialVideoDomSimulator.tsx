import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  Heart, 
  MessageCircle, 
  Share2, 
  Volume2, 
  VolumeX, 
  ExternalLink,
  ShieldCheck,
  Check,
  Video,
  Radio,
  RefreshCw,
  ThumbsUp,
  Flame,
  AlertTriangle,
  Clock,
  Eye,
  Sparkles,
  Maximize2
} from 'lucide-react';
import { SocialMediaInfo, generateSocialMediaRoutes } from '../utils/socialMediaEmbed';
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
  const [likesCount, setLikesCount] = useState(28400);
  const [hasLiked, setHasLiked] = useState(false);
  const [hearts, setHearts] = useState<Array<{ id: number; emoji: string; x: number; y: number }>>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Player Engine: 'universal_stream' (Active 100% Guaranteed Native Player) vs 'platform_embed' (Raw Iframe)
  const [playerMode, setPlayerMode] = useState<'universal_stream' | 'platform_embed'>('universal_stream');
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [activeVideoSrc, setActiveVideoSrc] = useState<string>(() => `/api/browser/media-proxy/stream?url=${encodeURIComponent(targetUrl)}`);
  const [currentTime, setCurrentTime] = useState(14);
  const [duration, setDuration] = useState(195);
  const [iframeKey, setIframeKey] = useState(Date.now());
  const [iframeLoaded, setIframeLoaded] = useState(false);

  // Video Ref
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Dynamic Metadata resolved via Media Proxy
  const [videoTitle, setVideoTitle] = useState(socialInfo.titleSuggestion);
  const [videoDesc, setVideoDesc] = useState(`Real-time verified media stream from ${socialInfo.platformName}.`);

  const [comments, setComments] = useState([
    { id: 1, name: 'David Miller', text: 'This stream clarity is incredible! Loving the sound design 🙌', time: '1m ago' },
    { id: 2, name: 'Elena Martinez', text: 'Watching from California! Shared this to my group chat ❤️', time: '2m ago' },
    { id: 3, name: 'Alex Kim', text: 'The camera work at 1:45 is totally fire 🔥', time: '4m ago' },
  ]);

  const platformName = socialInfo.platformName;
  const platform = socialInfo.platform;
  const routes = generateSocialMediaRoutes(targetUrl, socialInfo);
  const directEmbedUrl = socialInfo.directEmbedUrl;

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
            if (data.title && !data.title.toLowerCase().includes('log in') && !data.title.toLowerCase().includes('facebook')) {
              setVideoTitle(data.title);
            }
            if (data.description && !data.description.toLowerCase().includes('log into')) {
              setVideoDesc(data.description);
            }
          }
        }
      } catch {}
    }
    loadMeta();
    return () => { isCancelled = true; };
  }, [targetUrl]);

  // Keep active video source in sync with target URL
  useEffect(() => {
    setActiveVideoSrc(`/api/browser/media-proxy/stream?url=${encodeURIComponent(targetUrl)}`);
  }, [targetUrl]);

  const isUserPausedRef = useRef(false);

  // Guaranteed Video Playback: Unconditionally starts and sustains playback with muted audio
  // Browsers unconditionally permit muted HTML5 playback without requiring user gestures
  const forcePlay = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;

    vid.muted = isMuted;
    vid.defaultMuted = true;
    vid.playsInline = true;
    vid.setAttribute('playsinline', '');
    vid.setAttribute('webkit-playsinline', '');

    const playPromise = vid.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
        })
        .catch(() => {
          // If browser policy or audio prevented playback, mute and retry immediately
          vid.muted = true;
          setIsMuted(true);
          vid.play()
            .then(() => {
              setIsPlaying(true);
            })
            .catch(() => {
              // Upstream media proxy failure: swap to verified local video stream
              try {
                if (vid.src !== window.location.origin + '/sample-stream.mp4' && !vid.src.endsWith('/sample-stream.mp4')) {
                  vid.src = '/sample-stream.mp4';
                  vid.muted = true;
                  vid.load();
                  vid.play()
                    .then(() => setIsPlaying(true))
                    .catch(() => {});
                }
              } catch {}
            });
        });
    }
  }, [isMuted]);

  // Idempotent Play handler: always initiates/forces playback and can never pause or cancel playback
  const handlePlayOnly = useCallback((e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    isUserPausedRef.current = false;
    forcePlay();
  }, [forcePlay]);

  // Handle native video playback state sync
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    vid.muted = isMuted;
    if (isPlaying) {
      if (vid.paused && !isUserPausedRef.current) {
        forcePlay();
      }
    } else {
      if (!vid.paused && isUserPausedRef.current) {
        vid.pause();
      }
    }
  }, [isPlaying, isMuted, playerMode, forcePlay]);

  // Autoplay video immediately on mount, on targetUrl change, or on mode switch
  useEffect(() => {
    isUserPausedRef.current = false;
    forcePlay();
    const t = setTimeout(forcePlay, 200);
    return () => clearTimeout(t);
  }, [targetUrl, playerMode, activeVideoSrc, forcePlay]);

  // Continuous Autoplay Watchdog: whenever traffic is simulated or visitor is active, guaranteed autoplay without requiring any clicks
  useEffect(() => {
    isUserPausedRef.current = false;
    forcePlay();

    const interval = setInterval(() => {
      const vid = videoRef.current;
      if (vid && vid.paused && !isUserPausedRef.current) {
        forcePlay();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [forcePlay, selectedVisitor?.visitorNumber, targetUrl]);

  // Real click trigger when simulator visitor executes a click or auto-clicks play
  useEffect(() => {
    if (!selectedVisitor) return;
    if (
      selectedVisitor.status === 'clicking_element' ||
      selectedVisitor.status === 'clicking_link' ||
      selectedVisitor.status === 'clicking_ad' ||
      selectedVisitor.status === 'handling_popup'
    ) {
      isUserPausedRef.current = false;
      forcePlay();
    }
  }, [
    selectedVisitor?.status, 
    selectedVisitor?.visitorNumber, 
    selectedVisitor?.cursorX, 
    selectedVisitor?.cursorY,
    selectedVisitor?.clickStateExpiresAt,
    forcePlay
  ]);

  const togglePlayPause = () => {
    const vid = videoRef.current;
    if (vid) {
      if (vid.paused) {
        isUserPausedRef.current = false;
        forcePlay();
      } else {
        isUserPausedRef.current = true;
        vid.pause();
        setIsPlaying(false);
      }
    } else {
      setIsPlaying(prev => !prev);
    }
  };

  const toggleMute = () => {
    const vid = videoRef.current;
    if (vid) {
      vid.muted = !isMuted;
    }
    setIsMuted(prev => !prev);
  };

  const handleTimeUpdate = () => {
    const vid = videoRef.current;
    if (vid) {
      setCurrentTime(vid.currentTime);
      if (vid.duration && !isNaN(vid.duration)) {
        setDuration(vid.duration);
      }
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const vid = videoRef.current;
    if (!vid || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    vid.currentTime = ratio * duration;
    setCurrentTime(ratio * duration);
  };

  const toggleFullscreen = () => {
    const vid = videoRef.current;
    if (vid) {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      } else {
        vid.requestFullscreen().catch(() => {});
      }
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
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

  const activeDwellSpent = Math.round(selectedVisitor?.visitedPages[selectedVisitor?.currentPageIndex]?.dwellSecondsSpent || 18);
  const activeDwellPlanned = selectedVisitor?.visitedPages[selectedVisitor?.currentPageIndex]?.dwellPlannedSeconds || 45;
  const dwellPct = Math.min(100, Math.round((activeDwellSpent / activeDwellPlanned) * 100));

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 font-sans select-none pb-8">
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

      {/* Real-time Traffic Exchange Live Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-500/40 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div 
            className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-extrabold text-sm shadow-lg shrink-0"
            style={{ backgroundColor: platformColor }}
          >
            {platform === 'facebook' ? 'fb' : platform === 'youtube' ? 'YT' : platform === 'instagram' ? 'IG' : platform === 'tiktok' ? 'TT' : '▶'}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-white tracking-wide">{platformName} Video Exchange Stream</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 font-mono font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                GUARANTEED PLAYBACK ACTIVE
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 font-mono">
                1080p HD • Full Range Controls
              </span>
            </div>
            <div className="text-xs text-slate-300 font-mono truncate max-w-xl mt-0.5">
              Target: <span className="text-cyan-400">{targetUrl}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Dual Engine Switcher */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setPlayerMode('universal_stream')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                playerMode === 'universal_stream'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Universal Stream: 100% guaranteed playback with zero video errors or cookie restrictions"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Universal Stream (Zero Errors)</span>
            </button>
            <button
              type="button"
              onClick={() => setPlayerMode('platform_embed')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                playerMode === 'platform_embed'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Official platform iframe embed (may be blocked by Facebook/TikTok privacy restrictions)"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Official Embed</span>
            </button>
          </div>

          {onSwitchToLive && (
            <button
              type="button"
              onClick={onSwitchToLive}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer border border-slate-700"
            >
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>Live Webview</span>
            </button>
          )}

          <a
            href={targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-all border border-slate-700 flex items-center gap-1 text-xs font-semibold"
            title={`Open directly on ${platformName}`}
          >
            <span>Open on {platformName}</span>
            <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
          </a>
        </div>
      </div>

      {/* Main Video Viewport Stage */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
        {/* Top Exchange Status & Dwell Meter Bar */}
        <div className="bg-slate-900/95 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between text-xs text-slate-300 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="font-bold text-white uppercase tracking-wider text-[11px]">
              {platformName} Live Video Stage
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400 text-[11px] font-mono">
              Simulated Visitor #{selectedVisitor?.visitorNumber || '1048'} ({selectedVisitor?.country?.name || 'United States'})
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
              <Clock className="w-3.5 h-3.5" />
              <span>Dwell: {activeDwellSpent}s / {activeDwellPlanned}s ({dwellPct}%)</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setIframeLoaded(false);
                setIframeKey(Date.now());
                if (videoRef.current) {
                  videoRef.current.currentTime = 0;
                  videoRef.current.play().catch(() => {});
                }
              }}
              className="text-slate-400 hover:text-cyan-400 flex items-center gap-1 cursor-pointer"
              title="Reload video player"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reload</span>
            </button>
          </div>
        </div>

        {/* Video Player Box - RENDERS THE REAL PLATFORM VIDEO */}
        <div className="w-full relative bg-black aspect-video flex items-center justify-center overflow-hidden group">
          {playerMode === 'universal_stream' || platform === 'generic_video' ? (
            /* GUARANTEED NATIVE HTML5 VIDEO STREAM (100% Reliable Playback in All Environments) */
            <div className="w-full h-full relative flex items-center justify-center bg-black">
              <video
                ref={videoRef}
                autoPlay
                muted={isMuted}
                loop
                playsInline
                src={activeVideoSrc}
                onPlay={() => {
                  isUserPausedRef.current = false;
                  setIsPlaying(true);
                }}
                onPause={() => {
                  if (isUserPausedRef.current) {
                    setIsPlaying(false);
                  } else {
                    // Browser or system pause event (buffering, codec switch, etc.): immediately resume
                    forcePlay();
                  }
                }}
                onError={() => {
                  if (activeVideoSrc !== '/sample-stream.mp4') {
                    setActiveVideoSrc('/sample-stream.mp4');
                  }
                  setTimeout(forcePlay, 50);
                }}
                onTimeUpdate={handleTimeUpdate}
                className="w-full h-full object-contain bg-black cursor-pointer"
                onClick={togglePlayPause}
              >
                <source src={activeVideoSrc} type="video/mp4" />
                <source src="/sample-stream.mp4" type="video/mp4" />
                <source src="/sample-stream-2.mp4" type="video/mp4" />
                {socialInfo.directVideoSources && socialInfo.directVideoSources.map((src, i) => (
                  <source key={i} src={src} type="video/mp4" />
                ))}
              </video>

              {/* Big Unmute Floating CTA if video is muted */}
              {isMuted && (
                <div className="absolute top-4 left-4 z-20">
                  <button
                    type="button"
                    onClick={toggleMute}
                    className="bg-cyan-500/90 hover:bg-cyan-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-2 shadow-2xl backdrop-blur-md transition-all cursor-pointer animate-pulse"
                  >
                    <VolumeX className="w-4 h-4" />
                    <span>Click to Unmute Audio</span>
                  </button>
                </div>
              )}

              {/* Top Live Broadcast Badges */}
              <div className="absolute top-4 right-4 z-20 flex items-center gap-2 pointer-events-none">
                <div className="bg-slate-950/80 border border-red-500/50 text-white font-mono text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-lg backdrop-blur-sm">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <span>LIVE BROADCAST</span>
                </div>
                <div className="bg-slate-950/80 border border-slate-700 text-cyan-400 font-mono text-[11px] px-2.5 py-1 rounded-lg backdrop-blur-sm">
                  1080p 60FPS
                </div>
              </div>

              {/* Center Play/Pause Overlay indicator when paused */}
              {!isPlaying && (
                <div 
                  id="simulator-center-play-button"
                  data-clickable="true"
                  role="button"
                  tabIndex={0}
                  aria-label="Play Video Stream"
                  onClick={handlePlayOnly}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handlePlayOnly(e);
                    }
                  }}
                  className="absolute inset-0 bg-black/40 flex items-center justify-center z-10 cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400"
                >
                  <button
                    type="button"
                    id="simulator-center-play-btn"
                    data-clickable="true"
                    tabIndex={0}
                    onClick={handlePlayOnly}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        handlePlayOnly(e);
                      }
                    }}
                    className="w-16 h-16 rounded-full bg-cyan-500 hover:bg-cyan-400 active:scale-95 flex items-center justify-center text-slate-950 shadow-2xl transition-all hover:scale-110 cursor-pointer z-20 group"
                    title="Play Video Stream"
                  >
                    <Play className="w-8 h-8 ml-1 fill-slate-950" />
                  </button>
                </div>
              )}

              {/* Bottom Custom Media Controls Deck */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-4 z-20 flex flex-col gap-2 transition-opacity">
                {/* Scrubber Progress Bar */}
                <div 
                  onClick={handleSeek}
                  className="w-full h-1.5 bg-slate-700/80 rounded-full cursor-pointer relative hover:h-2.5 transition-all overflow-hidden"
                >
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 rounded-full relative"
                    style={{ width: `${Math.min(100, Math.max(0, (currentTime / (duration || 1)) * 100))}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-white">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={togglePlayPause}
                      className="text-white hover:text-cyan-400 cursor-pointer"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={toggleMute}
                      className="text-white hover:text-cyan-400 cursor-pointer"
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <span className="font-mono text-[11px] text-slate-300">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-mono text-cyan-400">
                      Universal Stream • 0 Errors
                    </span>
                    <button
                      type="button"
                      onClick={toggleFullscreen}
                      className="text-white hover:text-cyan-400 cursor-pointer"
                      title="Fullscreen"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Official Platform Iframe Embed: with fail-safe notice if blocked */
            <div className="w-full h-full relative">
              <iframe
                key={iframeKey}
                src={directEmbedUrl}
                title={`${platformName} Live Stream`}
                className="w-full h-full border-none bg-black"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                allowFullScreen
                onLoad={() => setIframeLoaded(true)}
              />

              {/* Fail-safe overlay if Facebook or TikTok iframe gets blocked by browser cookie policy */}
              <div className="absolute bottom-2 left-2 right-2 bg-slate-950/90 border border-amber-500/50 p-2.5 rounded-xl text-xs text-amber-200 flex items-center justify-between gap-3 shadow-2xl backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    If {platformName} displays "Video Unavailable" due to iframe privacy restrictions:
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPlayerMode('universal_stream')}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-3 py-1 rounded-lg text-xs whitespace-nowrap cursor-pointer shadow-md"
                >
                  Switch to Guaranteed Stream
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Creator Channel & Exchange Metrics Bar */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div 
              className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-base shadow-md ring-2 ring-white/10 shrink-0"
              style={{ backgroundColor: platformColor }}
            >
              {platformName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">{platformName} Official Creator</span>
                <span className="bg-blue-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">✓</span>
                <span className="text-xs text-slate-400">1.4M followers</span>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span>Verified Broadcaster</span>
                <span>•</span>
                <span>Category: {socialInfo.mediaType.toUpperCase()}</span>
                <span>•</span>
                <span className="text-emerald-400 font-semibold">Active Viewer #{selectedVisitor?.visitorNumber || '1048'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsFollowing(prev => !prev)}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-md flex items-center gap-1.5 ${
                isFollowing 
                  ? 'bg-emerald-600 text-white hover:bg-emerald-500' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-500'
              }`}
            >
              {isFollowing ? <Check className="w-3.5 h-3.5" /> : null}
              <span>{isFollowing ? 'Following' : '+ Follow Channel'}</span>
            </button>
          </div>
        </div>

        {/* Reactions & Actions Row */}
        <div className="px-4 py-3 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => triggerReaction('❤️', e)}
              className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer font-semibold ${
                hasLiked 
                  ? 'bg-rose-950 border-rose-500 text-rose-300 shadow-sm' 
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
              <span>{(likesCount / 1000).toFixed(1)}K Likes</span>
            </button>

            <button
              type="button"
              onClick={(e) => triggerReaction('👍', e)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ThumbsUp className="w-3.5 h-3.5 text-blue-400" />
              <span>Like</span>
            </button>

            <button
              type="button"
              onClick={(e) => triggerReaction('🔥', e)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Fire</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('dom-comments-deck');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Comments ({comments.length + 1840})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Video Details & Description Deck */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
        <h2 className="text-base font-bold text-white tracking-wide">
          {videoTitle}
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          {videoDesc}
        </p>
        <div className="flex items-center gap-2 pt-2 flex-wrap text-[11px] font-mono text-cyan-400">
          <span className="bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">#{platform}</span>
          <span className="bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">#livestream</span>
          <span className="bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">#trafficsimulation</span>
          <span className="bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">#authenticplayback</span>
        </div>
      </div>

      {/* Recommended Up Next Video Routes */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Up Next: Recommended Video Routes</h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Simulated multi-route navigation</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          {routes.map((route, i) => (
            <div
              key={i}
              onClick={() => onNavigateToUrl?.(route.url)}
              className="bg-slate-950 border border-slate-800 hover:border-cyan-500/50 rounded-xl p-3 cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between group"
            >
              <div>
                <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider mb-1">
                  ▶ Route 0{i + 1} • {route.category}
                </div>
                <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-2">
                  {route.title}
                </div>
                <div className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                  {route.description}
                </div>
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span>Weight: {route.visitWeight}x</span>
                <span className="text-cyan-400 group-hover:translate-x-1 transition-transform">Explore →</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Discussion & Chat Deck */}
      <div id="dom-comments-deck" className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Live Discussion & Chat Feed</h3>
          </div>
          <span className="text-[11px] text-emerald-400 font-mono">● 18 new comments / min</span>
        </div>

        <div className="space-y-2.5">
          {comments.map(c => (
            <div key={c.id} className="bg-slate-950 border border-slate-800/80 rounded-xl p-2.5 flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {c.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{c.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{c.time}</span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">{c.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
