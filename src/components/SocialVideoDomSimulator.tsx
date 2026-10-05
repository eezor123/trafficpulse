import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Sparkles, 
  ExternalLink,
  ShieldCheck,
  Check,
  Disc,
  Radio,
  Eye,
  Video
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
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [likesCount, setLikesCount] = useState(18420);
  const [hasLiked, setHasLiked] = useState(false);
  const [hearts, setHearts] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<'stream' | 'comments' | 'up_next'>('stream');
  const [directPlayerActive, setDirectPlayerActive] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const platformName = socialInfo.platformName;
  const platform = socialInfo.platform;
  const isVideo = socialInfo.mediaType === 'video' || socialInfo.mediaType === 'reel';
  const routes = generateSocialMediaRoutes(targetUrl, socialInfo);

  const platformColor = 
    platform === 'facebook' ? '#1877F2' :
    platform === 'youtube' ? '#FF0000' :
    platform === 'instagram' ? '#E1306C' :
    platform === 'tiktok' ? '#00F2FE' :
    platform === 'vimeo' ? '#1AB7EA' :
    '#38BDF8';

  const triggerLike = (e?: React.MouseEvent) => {
    setLikesCount(prev => prev + (hasLiked ? -1 : 1));
    setHasLiked(!hasLiked);

    const clientX = e ? e.clientX : window.innerWidth / 2;
    const clientY = e ? e.clientY : window.innerHeight / 2;
    const newHeart = { id: Date.now() + Math.random(), x: clientX, y: clientY };
    setHearts(prev => [...prev.slice(-5), newHeart]);
    setTimeout(() => {
      setHearts(prev => prev.filter(h => h.id !== newHeart.id));
    }, 1000);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(socialInfo.canonicalUrl || targetUrl);
    setToastMessage('Stream link copied to clipboard!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 font-sans select-none">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 border border-emerald-500/60 text-emerald-300 px-4 py-2 rounded-xl text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Floating Animated Hearts */}
      {hearts.map(h => (
        <div
          key={h.id}
          className="fixed pointer-events-none z-50 text-2xl animate-float-heart"
          style={{ left: h.x - 12, top: h.y - 20 }}
        >
          ❤️
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
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                Direct Stream
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
              <span>Switch to Live Webview</span>
            </button>
          )}
          <a
            href={targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700"
            title="Open in new window"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Main Video Viewport Stage */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
        {/* Toggle between embedded player & simulated canvas */}
        <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-slate-200">
              {directPlayerActive ? 'Direct Embedded Video Player' : 'Simulated Canvas Player'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setDirectPlayerActive(!directPlayerActive)}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium underline cursor-pointer"
          >
            {directPlayerActive ? 'Switch to Canvas View' : 'Switch to Direct Video Player'}
          </button>
        </div>

        {/* Video Player Box */}
        <div className="w-full relative bg-black aspect-video flex items-center justify-center overflow-hidden">
          {directPlayerActive && socialInfo.directEmbedUrl ? (
            <iframe
              src={socialInfo.directEmbedUrl}
              className="w-full h-full border-none bg-black"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <div className="w-full h-full relative flex flex-col justify-between p-6 bg-gradient-to-t from-black via-slate-950/80 to-slate-900/60">
              {/* Top Video Bar */}
              <div className="flex items-center justify-between z-10">
                <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700 text-xs font-mono text-slate-200">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  <span>1.4K Watching Live</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700 text-[10px] font-mono text-cyan-300 font-bold">
                    1080p 60fps HD
                  </span>
                </div>
              </div>

              {/* Center Play Button Overlay */}
              <div className="flex flex-col items-center justify-center gap-3 z-10">
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-16 h-16 rounded-full bg-cyan-500/90 hover:bg-cyan-400 text-slate-950 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.6)] transition-transform hover:scale-105 cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current ml-1" />}
                </button>
                <span className="text-xs text-slate-300 font-mono bg-slate-950/80 px-3 py-1 rounded-full border border-slate-800">
                  {isPlaying ? 'Playing Live Stream • Simulated Visitor Hovering' : 'Video Paused'}
                </span>
              </div>

              {/* Bottom Scrubber & Time */}
              <div className="space-y-2 z-10">
                <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden cursor-pointer">
                  <div className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 w-3/5 rounded-full relative" />
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setIsMuted(!isMuted)} className="hover:text-white">
                      {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <span>01:45 / 03:20</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Disc className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                    <span>Original Audio • Verified Sound</span>
                  </div>
                </div>
              </div>
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
                <span className="font-bold text-white text-sm">{platformName} Creator</span>
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span className="text-[10px] text-slate-400">• Official Channel</span>
              </div>
              <div className="text-xs text-slate-400">2.8M Subscribers • Uploaded Recently</div>
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

        {/* Interactive Social Actions Bar */}
        <div className="px-4 py-3 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={triggerLike}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 font-semibold transition-all cursor-pointer ${
                hasLiked 
                  ? 'bg-rose-950/80 border-rose-500/50 text-rose-300' 
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
              <span>{(likesCount / 1000).toFixed(1)}K</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('comments')}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 font-semibold transition-all cursor-pointer ${
                activeTab === 'comments'
                  ? 'bg-indigo-950 border-indigo-500/50 text-indigo-300'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5 text-slate-400" />
              <span>1.2K Comments</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5 font-semibold transition-all cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Share</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('up_next')}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                activeTab === 'up_next'
                  ? 'bg-cyan-950 border-cyan-500/50 text-cyan-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              🎬 Up Next ({routes.length} Routes)
            </button>
          </div>
        </div>

        {/* Content Tabs (Discussion Feed & Up Next Routes) */}
        <div className="p-4 sm:p-5 bg-slate-900/60 border-t border-slate-800">
          {activeTab === 'up_next' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
                <span>Simulator Navigable Video Routes</span>
                <span className="text-[10px] text-cyan-400 font-mono">Click card to navigate simulator</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {routes.map((r, i) => (
                  <div
                    key={r.url}
                    onClick={() => onNavigateToUrl?.(r.url)}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-850 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 text-[10px] text-cyan-400 font-mono font-bold uppercase mb-1">
                        <span>Route 0{i + 1}</span>
                        <span>•</span>
                        <span>{r.category}</span>
                      </div>
                      <h5 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {r.title}
                      </h5>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                        {r.description}
                      </p>
                    </div>
                    <div className="mt-2 text-[10px] text-indigo-400 font-mono flex items-center gap-1">
                      <span>Navigate Route &rarr;</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>Live Discussion & Viewer Reactions</span>
                <span className="text-[10px] text-emerald-400 font-mono">● Realtime Stream</span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {[
                  { user: 'Sarah Jenkins', time: '1m ago', text: 'This video clip is stunning! The camera work is unbelievable 🔥' },
                  { user: 'Marcus Vance', time: '3m ago', text: 'Watching this on repeat. Shared to my feed!' },
                  { user: 'Tolu Davies', time: '5m ago', text: 'The clarity and framing are top tier. Keep these coming 🙌' },
                ].map((c, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs flex gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 font-bold flex items-center justify-center text-[10px] shrink-0">
                      {c.user.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-[11px]">{c.user}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{c.time}</span>
                      </div>
                      <p className="text-slate-300 text-[11px] mt-0.5">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
