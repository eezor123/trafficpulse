import { type SocialMediaInfo, generateSocialMediaRoutes } from '../utils/socialMediaEmbed.ts';

export function renderSocialMediaLivePage(socialInfo: SocialMediaInfo, allowAds: boolean): string {
  const platform = socialInfo.platform;
  const canonicalUrl = socialInfo.canonicalUrl;
  const embedUrl = socialInfo.directEmbedUrl;
  const platformName = socialInfo.platformName;
  const title = socialInfo.titleSuggestion;
  const isVideo = socialInfo.mediaType === 'video' || socialInfo.mediaType === 'reel';

  const platformBadgeColor = 
    platform === 'facebook' ? '#1877F2' :
    platform === 'youtube' ? '#FF0000' :
    platform === 'instagram' ? '#E1306C' :
    platform === 'tiktok' ? '#00F2FE' :
    platform === 'vimeo' ? '#1AB7EA' :
    '#38BDF8';

  const platformIcon = 
    platform === 'facebook' ? '📘' :
    platform === 'youtube' ? '▶️' :
    platform === 'instagram' ? '📸' :
    platform === 'tiktok' ? '🎵' :
    platform === 'twitter' ? '𝕏' :
    '🎬';

  const subRoutes = generateSocialMediaRoutes(canonicalUrl, socialInfo);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${platformName} Live Stream • TrafficPulse Live Simulator</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #090d16;
      color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      min-height: 100vh;
      overflow-x: hidden;
      padding-bottom: 80px;
    }

    /* Ambient background glow */
    .bg-glow {
      position: fixed;
      top: -100px;
      left: 50%;
      transform: translateX(-50%);
      width: 700px;
      height: 350px;
      background: radial-gradient(circle, ${platformBadgeColor}33 0%, rgba(9, 13, 22, 0) 70%);
      pointer-events: none;
      z-index: 0;
    }

    .container {
      max-width: 960px;
      margin: 0 auto;
      padding: 16px;
      position: relative;
      z-index: 1;
    }

    /* Top Navigation / Platform Bar */
    .top-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(51, 65, 85, 0.7);
      backdrop-filter: blur(12px);
      border-radius: 14px;
      padding: 10px 16px;
      margin-bottom: 16px;
    }
    .platform-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 700;
      color: #fff;
    }
    .platform-badge {
      background: ${platformBadgeColor};
      color: #fff;
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 800;
      display: flex;
      align-items: center;
      gap: 4px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      box-shadow: 0 0 16px ${platformBadgeColor}66;
    }
    .live-status {
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.4);
      color: #fca5a5;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      font-family: monospace;
    }
    .live-dot {
      width: 7px;
      height: 7px;
      background: #ef4444;
      border-radius: 50%;
      animation: pulseDot 1.4s infinite;
    }
    @keyframes pulseDot {
      0% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(1.3); }
      100% { opacity: 1; transform: scale(1); }
    }

    /* Video Player Stage */
    .player-stage {
      background: #020617;
      border: 1px solid rgba(51, 65, 85, 0.8);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px ${platformBadgeColor}22;
      position: relative;
      margin-bottom: 16px;
    }
    .video-viewport {
      width: 100%;
      height: 520px;
      position: relative;
      background: #000;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .video-frame {
      width: 100%;
      height: 100%;
      border: none;
      display: block;
      background: #000;
    }

    /* Player Direct Fallback notice if frame takes a second */
    .player-overlay-hud {
      position: absolute;
      top: 12px;
      left: 12px;
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid rgba(56, 189, 248, 0.4);
      color: #38bdf8;
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 11px;
      font-family: monospace;
      font-weight: 600;
      pointer-events: none;
      z-index: 10;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    }

    /* Post Author & Details Bar */
    .author-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 18px;
      background: rgba(15, 23, 42, 0.95);
      border-top: 1px solid rgba(51, 65, 85, 0.6);
      flex-wrap: wrap;
      gap: 12px;
    }
    .author-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .author-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: linear-gradient(135deg, ${platformBadgeColor}, #6366f1);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 16px;
      color: #fff;
      border: 2px solid rgba(255, 255, 255, 0.2);
    }
    .author-name {
      font-size: 14px;
      font-weight: 700;
      color: #f8fafc;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .verified-badge {
      color: #38bdf8;
      font-size: 12px;
    }
    .author-meta {
      font-size: 11px;
      color: #94a3b8;
    }

    .follow-btn {
      background: ${platformBadgeColor};
      color: #fff;
      border: none;
      padding: 8px 16px;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }
    .follow-btn:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }

    /* Video Actions Deck (Likes, Comments, Shares) */
    .actions-deck {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 18px;
      background: rgba(15, 23, 42, 0.7);
      border-top: 1px solid rgba(51, 65, 85, 0.4);
      flex-wrap: wrap;
    }
    .action-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(30, 41, 59, 0.7);
      border: 1px solid rgba(71, 85, 105, 0.6);
      color: #cbd5e1;
      padding: 8px 14px;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
      user-select: none;
    }
    .action-btn:hover {
      background: rgba(51, 65, 85, 0.9);
      color: #fff;
      border-color: rgba(148, 163, 184, 0.6);
    }
    .action-btn.liked {
      background: rgba(239, 68, 68, 0.2);
      border-color: rgba(239, 68, 68, 0.6);
      color: #f87171;
    }
    .heart-burst {
      position: absolute;
      pointer-events: none;
      animation: floatHeart 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
      font-size: 22px;
      z-index: 9999;
    }
    @keyframes floatHeart {
      0% { opacity: 1; transform: translate(0, 0) scale(0.6); }
      50% { opacity: 0.9; transform: translate(-10px, -45px) scale(1.4); }
      100% { opacity: 0; transform: translate(-20px, -90px) scale(1.8); }
    }

    /* Video Details & Caption */
    .caption-box {
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(51, 65, 85, 0.6);
      border-radius: 14px;
      padding: 16px;
      margin-bottom: 16px;
    }
    .caption-title {
      font-size: 15px;
      font-weight: 700;
      color: #fff;
      margin-bottom: 6px;
      line-height: 1.4;
    }
    .caption-desc {
      font-size: 13px;
      color: #cbd5e1;
      line-height: 1.6;
    }
    .caption-tags {
      margin-top: 10px;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .tag {
      background: rgba(30, 41, 59, 0.9);
      border: 1px solid rgba(71, 85, 105, 0.5);
      color: #38bdf8;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
    }

    /* Recommended Videos Stream (Navigable Simulator Routes) */
    .up-next-section {
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(51, 65, 85, 0.6);
      border-radius: 14px;
      padding: 16px;
      margin-bottom: 16px;
    }
    .section-title {
      font-size: 13px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #94a3b8;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .routes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 12px;
    }
    .route-card {
      background: rgba(30, 41, 59, 0.7);
      border: 1px solid rgba(51, 65, 85, 0.6);
      border-radius: 12px;
      padding: 12px;
      cursor: pointer;
      transition: all 0.2s;
      text-decoration: none;
      color: inherit;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .route-card:hover {
      background: rgba(51, 65, 85, 0.8);
      border-color: #38bdf8;
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
    }
    .route-badge {
      font-size: 10px;
      font-weight: 700;
      color: #38bdf8;
      text-transform: uppercase;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .route-title {
      font-size: 12px;
      font-weight: 700;
      color: #f1f5f9;
      line-height: 1.3;
    }
    .route-desc {
      font-size: 11px;
      color: #94a3b8;
      line-height: 1.4;
    }

    /* Live Comments Feed */
    .comments-section {
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(51, 65, 85, 0.6);
      border-radius: 14px;
      padding: 16px;
    }
    .comment-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 10px;
      max-height: 300px;
      overflow-y: auto;
    }
    .comment-item {
      display: flex;
      gap: 10px;
      background: rgba(30, 41, 59, 0.5);
      border: 1px solid rgba(71, 85, 105, 0.4);
      padding: 10px 12px;
      border-radius: 10px;
      font-size: 12px;
    }
    .comment-avatar {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: #475569;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 11px;
      flex-shrink: 0;
    }
    .comment-body {
      flex: 1;
    }
    .comment-author {
      font-weight: 700;
      color: #f8fafc;
      margin-bottom: 2px;
    }
    .comment-text {
      color: #cbd5e1;
      line-height: 1.4;
    }

    /* Companion Virtual Cursor & Telemetry Overlay */
    #tp-live-cursor-root {
      position: fixed;
      top: 25%;
      left: 30%;
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
</head>
<body>
  <div class="bg-glow"></div>

  <div class="container">
    <!-- Top Bar -->
    <div class="top-bar">
      <div class="platform-pill">
        <span class="platform-badge">${platformIcon} ${platformName}</span>
        <span>${title}</span>
      </div>
      <div style="display: flex; align-items: center; gap: 10px;">
        <div class="live-status">
          <span class="live-dot"></span>
          <span>LIVE STREAM</span>
        </div>
        <a href="${canonicalUrl}" target="_blank" rel="noopener noreferrer" style="color: #38bdf8; font-size: 11px; text-decoration: none; font-weight: 700; background: rgba(56, 189, 248, 0.1); padding: 4px 8px; border-radius: 6px; border: 1px solid rgba(56, 189, 248, 0.3);">
          Open Direct &rarr;
        </a>
      </div>
    </div>

    <!-- Video Stage -->
    <div class="player-stage">
      <div class="player-overlay-hud">
        ⚡ DIRECT PLAYER • REAL STREAM ACTIVE
      </div>
      <div class="video-viewport">
        <iframe
          id="tp-embed-player"
          src="${embedUrl}"
          class="video-frame"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowfullscreen="true"
        ></iframe>
      </div>

      <!-- Author Bar -->
      <div class="author-bar">
        <div class="author-info">
          <div class="author-avatar">${platformName.charAt(0)}</div>
          <div>
            <div class="author-name">
              <span>${platformName} Verified Creator</span>
              <span class="verified-badge">✓</span>
            </div>
            <div class="author-meta">Official Release • 2.4M Views • High-Definition Stream</div>
          </div>
        </div>
        <button type="button" class="follow-btn" id="follow-cta" onclick="toggleFollow()">
          + Follow Channel
        </button>
      </div>

      <!-- Actions Deck -->
      <div class="actions-deck">
        <button type="button" class="action-btn" id="like-btn" onclick="triggerLike(event)">
          <span id="heart-icon">❤️</span>
          <span id="like-count">18.4K</span> Likes
        </button>
        <button type="button" class="action-btn" onclick="scrollToComments()">
          <span>💬</span>
          <span>1,248 Comments</span>
        </button>
        <button type="button" class="action-btn" onclick="shareVideo()">
          <span>↗️</span>
          <span>Share Stream</span>
        </button>
        <button type="button" class="action-btn" onclick="reloadPlayer()">
          <span>🔄</span>
          <span>Replay Video</span>
        </button>
      </div>
    </div>

    <!-- Video Caption & Tags -->
    <div class="caption-box">
      <div class="caption-title">${title}</div>
      <div class="caption-desc">
        Streaming verified multimedia feed from ${platformName}. The TrafficPulse virtual browser simulator is actively generating authentic human dwell time, video seeking, like actions, and multi-route navigation across related content.
      </div>
      <div class="caption-tags">
        <span class="tag">#${platform}</span>
        <span class="tag">#viral</span>
        <span class="tag">#video</span>
        <span class="tag">#livestream</span>
        <span class="tag">#trending</span>
      </div>
    </div>

    <!-- Up Next / Recommended Navigation Routes -->
    <div class="up-next-section">
      <div class="section-title">
        <span>🎬 Up Next: Recommended Video Routes</span>
        <span style="font-size: 11px; color: #38bdf8; text-transform: none; font-weight: normal;">Click to Navigate Simulator</span>
      </div>
      <div class="routes-grid">
        ${subRoutes.map((route, i) => `
          <div class="route-card" onclick="navigateRoute('${route.url}', '${route.title.replace(/'/g, "\\'")}')">
            <div class="route-badge">▶ Route 0${i + 1} • ${route.category.toUpperCase()}</div>
            <div class="route-title">${route.title}</div>
            <div class="route-desc">${route.description}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Live Comments Feed -->
    <div class="comments-section" id="comments-box">
      <div class="section-title">
        <span>💬 Live Discussion & Viewer Reactions</span>
        <span style="font-size: 11px; color: #34d399;">● 12 new comments / min</span>
      </div>
      <div class="comment-list" id="comment-stream">
        <div class="comment-item">
          <div class="comment-avatar">JD</div>
          <div class="comment-body">
            <div class="comment-author">James Davis</div>
            <div class="comment-text">The clarity on this clip is insane! Great production quality 🔥</div>
          </div>
        </div>
        <div class="comment-item">
          <div class="comment-avatar">EM</div>
          <div class="comment-body">
            <div class="comment-author">Elena Martinez</div>
            <div class="comment-text">Watching from California! Shared this to my group chat 🙌</div>
          </div>
        </div>
        <div class="comment-item">
          <div class="comment-avatar">AK</div>
          <div class="comment-body">
            <div class="comment-author">Alex Kim</div>
            <div class="comment-text">Wait until 1:45, that part was totally unexpected haha 👏</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Companion Telemetry HUD & Visitor Cursor -->
  <div id="tp-live-cursor-root">
    <div id="tp-live-click-ripple"></div>
    <svg id="tp-live-cursor-pointer" width="26" height="26" viewBox="0 0 24 24" fill="#06b6d4" stroke="#083344" stroke-width="1.5">
      <path d="M3 3l7 18 3-7 7-3L3 3z"/>
    </svg>
    <div id="tp-live-badge">Watching Video Stream</div>
  </div>
  <div id="tp-live-scroll-radar">
    <div id="tp-live-scroll-indicator" style="top: 0%;"></div>
  </div>
  <div id="tp-live-telemetry-hud">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;font-weight:bold;color:#38bdf8;">
      <span>⚡ SOCIAL VIDEO SIMULATOR</span>
      <span id="tp-hud-coords" style="color:#94a3b8;">X: 50% • Y: 30%</span>
    </div>
    <div style="font-size:10px;color:#cbd5e1;display:flex;align-items:center;gap:8px;">
      <span>📜 SCROLL: <strong id="tp-hud-scroll" style="color:#34d399;">0%</strong></span>
      <span>•</span>
      <span id="tp-hud-action" style="color:#e2e8f0;">Watching Live Stream</span>
    </div>
  </div>

  <script id="trafficpulse-social-script">
    (function() {
      var cursor = document.getElementById('tp-live-cursor-root');
      var badge = document.getElementById('tp-live-badge');
      var ripple = document.getElementById('tp-live-click-ripple');
      var hudScroll = document.getElementById('tp-hud-scroll');
      var hudCoords = document.getElementById('tp-hud-coords');
      var hudAction = document.getElementById('tp-hud-action');
      var scrollIndicator = document.getElementById('tp-live-scroll-indicator');
      var likeBtn = document.getElementById('like-btn');
      var likeCount = document.getElementById('like-count');
      var currentLikes = 18400;

      function triggerClickRipple() {
        if (!ripple) return;
        ripple.classList.remove('tp-ripple-active');
        void ripple.offsetWidth;
        ripple.classList.add('tp-ripple-active');
      }

      window.triggerLike = function(e) {
        currentLikes++;
        if (likeCount) likeCount.textContent = (currentLikes / 1000).toFixed(1) + 'K';
        if (likeBtn) likeBtn.classList.add('liked');

        // Spawn floating heart animation
        var heart = document.createElement('div');
        heart.className = 'heart-burst';
        heart.textContent = '❤️';
        var rect = likeBtn ? likeBtn.getBoundingClientRect() : { left: 100, top: 100 };
        heart.style.left = (rect.left + 20) + 'px';
        heart.style.top = (rect.top - 10) + 'px';
        document.body.appendChild(heart);
        setTimeout(function() { heart.remove(); }, 900);
      };

      window.toggleFollow = function() {
        var btn = document.getElementById('follow-cta');
        if (btn) {
          if (btn.textContent.includes('Follow')) {
            btn.textContent = '✓ Following';
            btn.style.background = '#10b981';
          } else {
            btn.textContent = '+ Follow Channel';
            btn.style.background = '${platformBadgeColor}';
          }
        }
      };

      window.scrollToComments = function() {
        var el = document.getElementById('comments-box');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      };

      window.shareVideo = function() {
        try {
          navigator.clipboard.writeText('${canonicalUrl}');
          alert('Stream link copied to clipboard!');
        } catch(e) {}
      };

      window.reloadPlayer = function() {
        var iframe = document.getElementById('tp-embed-player');
        if (iframe) iframe.src = iframe.src;
      };

      window.navigateRoute = function(url, title) {
        try {
          window.parent.postMessage({
            type: 'TP_LINK_CLICKED',
            href: url,
            text: title
          }, '*');
        } catch(e) {}
      };

      // Listen for parent telemetry & visitor movement
      var lastAppliedScrollPct = -1;
      var isScrolling = false;

      window.addEventListener('message', function(event) {
        try {
          if (!event.data || event.data.type !== 'TP_UPDATE_VISITOR') return;

          var pct = typeof event.data.scrollPct === 'number' ? event.data.scrollPct : 0;
          if (Math.abs(pct - lastAppliedScrollPct) >= 2.0 && !isScrolling) {
            lastAppliedScrollPct = pct;
            isScrolling = true;
            requestAnimationFrame(function() {
              try {
                var maxScroll = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) - window.innerHeight;
                if (maxScroll > 0) {
                  var targetY = (pct / 100) * maxScroll;
                  window.scrollTo({ top: targetY, behavior: 'smooth' });
                }
              } catch(e) {}
              isScrolling = false;
            });
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
              if (Math.random() < 0.4) {
                window.triggerLike();
              }
            }

            if (badge) {
              var vNum = event.data.visitorNumber ? (' #' + event.data.visitorNumber) : '';
              var cCode = event.data.country ? (' (' + event.data.country + ')') : '';
              if (st === 'clicking_link') {
                badge.textContent = '👆 Navigating Next Video' + vNum;
                badge.style.color = '#38bdf8';
                if (hudAction) hudAction.textContent = 'Navigating to related video clip';
              } else if (st === 'clicking_element') {
                badge.textContent = '❤️ Liked Video Stream' + vNum;
                badge.style.color = '#f87171';
                if (hudAction) hudAction.textContent = 'Dispatched Like reaction on video';
              } else if (pct >= 60) {
                badge.textContent = '💬 Reading Comments' + vNum;
                badge.style.color = '#34d399';
                if (hudAction) hudAction.textContent = 'Browsing viewer discussion feed';
              } else {
                badge.textContent = '▶️ Watching Stream ' + Math.round(pct) + '%' + vNum + cCode;
                badge.style.color = '#38bdf8';
                if (hudAction) hudAction.textContent = 'Streaming full media playback';
              }
            }
          }
        } catch(err) {}
      });

      // Post loaded message to parent window
      try {
        window.parent.postMessage({
          type: 'TP_PAGE_LOADED',
          url: window.location.href,
          title: document.title
        }, '*');
      } catch(e) {}
    })();
  </script>
</body>
</html>`;
}
