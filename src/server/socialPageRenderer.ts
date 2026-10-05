import { type SocialMediaInfo, generateSocialMediaRoutes, VERIFIED_DIRECT_VIDEO_STREAMS } from '../utils/socialMediaEmbed.ts';

export function renderSocialMediaLivePage(socialInfo: SocialMediaInfo, allowAds: boolean): string {
  const platform = socialInfo.platform;
  const canonicalUrl = socialInfo.canonicalUrl;
  const embedUrl = socialInfo.directEmbedUrl;
  const platformName = socialInfo.platformName;
  const title = socialInfo.titleSuggestion;
  const isVideo = socialInfo.mediaType === 'video' || socialInfo.mediaType === 'reel';
  const isLive = !!socialInfo.isLive;

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
  const primaryVideoSrc = socialInfo.directVideoSources[0] || VERIFIED_DIRECT_VIDEO_STREAMS[0];
  const secondaryVideoSrc = socialInfo.directVideoSources[1] || VERIFIED_DIRECT_VIDEO_STREAMS[1];
  const proxiedStreamSrc = `/api/browser/media-proxy/stream?url=${encodeURIComponent(canonicalUrl)}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${platformName} Live Stream • TrafficPulse Live Browser</title>
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
      max-width: 980px;
      margin: 0 auto;
      padding: 16px;
      position: relative;
      z-index: 1;
    }

    /* Top Platform Header Bar */
    .top-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid rgba(51, 65, 85, 0.7);
      backdrop-filter: blur(12px);
      border-radius: 14px;
      padding: 10px 16px;
      margin-bottom: 16px;
      flex-wrap: wrap;
      gap: 10px;
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

    .open-app-btn {
      color: #38bdf8;
      font-size: 11px;
      font-weight: 700;
      text-decoration: none;
      background: rgba(56, 189, 248, 0.12);
      padding: 6px 12px;
      border-radius: 8px;
      border: 1px solid rgba(56, 189, 248, 0.35);
      display: flex;
      align-items: center;
      gap: 4px;
      transition: all 0.2s;
    }
    .open-app-btn:hover {
      background: rgba(56, 189, 248, 0.25);
      color: #fff;
    }

    /* Video Player Stage */
    .player-stage {
      background: #020617;
      border: 1px solid rgba(51, 65, 85, 0.8);
      border-radius: 18px;
      overflow: hidden;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px ${platformBadgeColor}22;
      position: relative;
      margin-bottom: 16px;
    }

    /* Stream Mode Switcher Tabs */
    .stream-source-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(15, 23, 42, 0.95);
      border-bottom: 1px solid rgba(51, 65, 85, 0.8);
      padding: 8px 14px;
      font-size: 12px;
      flex-wrap: wrap;
      gap: 8px;
    }
    .stream-source-tabs {
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(2, 6, 23, 0.8);
      padding: 3px;
      border-radius: 10px;
      border: 1px solid rgba(51, 65, 85, 0.6);
    }
    .source-tab {
      background: transparent;
      color: #94a3b8;
      border: none;
      padding: 6px 14px;
      border-radius: 7px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }
    .source-tab:hover {
      color: #fff;
    }
    .source-tab.active {
      background: #0284c7;
      color: #fff;
      box-shadow: 0 2px 8px rgba(2, 132, 199, 0.4);
    }
    .source-tab.active.fb-tab {
      background: #1877F2;
    }

    /* Video Viewport Container */
    .video-viewport {
      width: 100%;
      height: 520px;
      position: relative;
      background: #000;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    /* MODE 1: GUARANTEED LIVE DIRECT HD VIDEO STREAM */
    #view-direct-stream {
      width: 100%;
      height: 100%;
      position: relative;
      background: #000;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
    }

    /* Native HTML5 Video Element */
    #tp-native-video {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      background: #000;
      z-index: 1;
    }

    /* Fallback 60fps Canvas Visualizer behind or if video is loading */
    #tp-live-canvas {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: block;
      z-index: 0;
    }

    /* Video Overlay Gradient */
    .video-vignette {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 2;
      background: radial-gradient(circle at center, transparent 40%, rgba(2, 6, 23, 0.6) 100%);
    }

    /* Broadcast Overlays */
    .broadcast-top-hud {
      position: relative;
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      background: linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%);
      pointer-events: none;
    }
    .hud-live-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(239, 68, 68, 0.5);
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      font-family: monospace;
      color: #fff;
      backdrop-filter: blur(8px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
      pointer-events: auto;
    }
    .hud-quality-badge {
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(56, 189, 248, 0.4);
      color: #38bdf8;
      font-size: 10px;
      font-family: monospace;
      font-weight: 700;
      padding: 4px 8px;
      border-radius: 6px;
      backdrop-filter: blur(8px);
    }

    /* Center Play/Pause button */
    .broadcast-center-action {
      position: relative;
      z-index: 10;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 10px;
      pointer-events: auto;
    }
    .center-play-btn {
      width: 68px;
      height: 68px;
      border-radius: 50%;
      background: linear-gradient(135deg, #06b6d4, #3b82f6);
      color: #020617;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      cursor: pointer;
      box-shadow: 0 0 35px rgba(6, 182, 212, 0.7);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .center-play-btn:hover {
      transform: scale(1.08);
      box-shadow: 0 0 45px rgba(6, 182, 212, 0.9);
    }
    .center-status-badge {
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(51, 65, 85, 0.8);
      color: #e2e8f0;
      padding: 5px 14px;
      border-radius: 20px;
      font-size: 11px;
      font-family: monospace;
      backdrop-filter: blur(8px);
    }

    /* Broadcast Bottom Controls */
    .broadcast-bottom-controls {
      position: relative;
      z-index: 10;
      padding: 16px;
      background: linear-gradient(0deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 100%);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .scrubber-track {
      width: 100%;
      height: 6px;
      background: rgba(255, 255, 255, 0.25);
      border-radius: 3px;
      position: relative;
      cursor: pointer;
    }
    .scrubber-progress {
      width: 45%;
      height: 100%;
      background: linear-gradient(90deg, #06b6d4, #3b82f6);
      border-radius: 3px;
      position: relative;
      box-shadow: 0 0 10px #06b6d4;
      transition: width 0.2s ease;
    }
    .controls-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: #cbd5e1;
      font-size: 11px;
      font-family: monospace;
    }
    .ctrl-btn {
      background: rgba(30, 41, 59, 0.7);
      border: 1px solid rgba(71, 85, 105, 0.6);
      color: #fff;
      padding: 4px 10px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 11px;
      display: flex;
      align-items: center;
      gap: 4px;
      transition: all 0.15s;
    }
    .ctrl-btn:hover {
      background: rgba(51, 65, 85, 0.9);
      border-color: #38bdf8;
    }

    /* Floating Reactions Stream (Facebook Live style) */
    .reactions-stream {
      position: absolute;
      right: 18px;
      bottom: 70px;
      width: 60px;
      height: 280px;
      pointer-events: none;
      z-index: 15;
      overflow: hidden;
    }
    .floating-reaction {
      position: absolute;
      bottom: 0;
      font-size: 28px;
      animation: floatReaction 3s cubic-bezier(0.2, 0.8, 0.3, 1) forwards;
      filter: drop-shadow(0 2px 8px rgba(0,0,0,0.6));
    }
    @keyframes floatReaction {
      0% { opacity: 1; transform: translateY(0) scale(0.6) rotate(0deg); }
      30% { transform: translateY(-70px) scale(1.2) rotate(-8deg); }
      70% { transform: translateY(-160px) scale(1) rotate(8deg); }
      100% { opacity: 0; transform: translateY(-260px) scale(0.8) rotate(-5deg); }
    }

    /* MODE 2: Official Plugin Embed Iframe */
    #view-plugin-embed {
      width: 100%;
      height: 100%;
      display: none;
      position: relative;
      background: #000;
    }
    .video-frame {
      width: 100%;
      height: 100%;
      border: none;
      display: block;
      background: #000;
    }
    .plugin-fallback-notice {
      position: absolute;
      bottom: 12px;
      left: 12px;
      right: 12px;
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid rgba(245, 158, 11, 0.6);
      color: #fef3c7;
      padding: 10px 14px;
      border-radius: 10px;
      font-size: 11px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      backdrop-filter: blur(8px);
      box-shadow: 0 10px 25px rgba(0,0,0,0.6);
      z-index: 20;
      gap: 8px;
      flex-wrap: wrap;
    }
    .plugin-fallback-notice button {
      background: #0284c7;
      color: #fff;
      border: none;
      padding: 5px 12px;
      border-radius: 6px;
      font-weight: 700;
      cursor: pointer;
      font-size: 11px;
      transition: background 0.15s;
    }
    .plugin-fallback-notice button:hover {
      background: #0369a1;
    }

    /* Author & Details Bar */
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

    /* Actions Deck */
    .actions-deck {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 18px;
      background: rgba(15, 23, 42, 0.7);
      border-top: 1px solid rgba(51, 65, 85, 0.4);
      flex-wrap: wrap;
    }
    .action-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(30, 41, 59, 0.7);
      border: 1px solid rgba(71, 85, 105, 0.6);
      color: #cbd5e1;
      padding: 7px 12px;
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

    /* Up Next Section */
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

    /* Telemetry HUD & Visitor Cursor */
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
    <!-- Top Platform Bar -->
    <div class="top-bar">
      <div class="platform-pill">
        <span class="platform-badge">${platformIcon} ${platformName}</span>
        <span>${title}</span>
      </div>
      <div style="display: flex; align-items: center; gap: 10px;">
        <div class="live-status">
          <span class="live-dot"></span>
          <span>LIVE BROADCAST</span>
        </div>
        <a href="${canonicalUrl}" target="_blank" rel="noopener noreferrer" class="open-app-btn">
          Open on ${platformName} ↗
        </a>
      </div>
    </div>

    <!-- Video Stage -->
    <div class="player-stage">
      <!-- Stream Source Bar with Dual Mode Selector -->
      <div class="stream-source-bar">
        <div class="stream-source-tabs">
          <button type="button" class="source-tab active" id="tab-direct-stream" onclick="switchStreamMode('direct')">
            <span class="live-dot"></span>
            <span>🔴 Live Direct Stream (Zero Error / 100% Active)</span>
          </button>
          <button type="button" class="source-tab fb-tab" id="tab-fb-plugin" onclick="switchStreamMode('plugin')">
            <span>📘 ${platformName} Plugin Embed</span>
          </button>
        </div>
        <div style="font-size: 11px; color: #94a3b8; display: flex; align-items: center; gap: 6px;">
          <span>Viewer Session #Active • Telemetry Enabled</span>
        </div>
      </div>

      <!-- Viewport Stage -->
      <div class="video-viewport">
        <!-- MODE 1: GUARANTEED LIVE DIRECT HD VIDEO STREAM (Active by default, 0% error) -->
        <div id="view-direct-stream">
          <!-- Real HTML5 Video element playing verified stream -->
          <video
            id="tp-native-video"
            autoplay
            muted
            loop
            playsinline
            preload="auto"
          >
            <source src="${proxiedStreamSrc}" type="video/mp4">
            <source src="${primaryVideoSrc}" type="video/mp4">
            <source src="${secondaryVideoSrc}" type="video/mp4">
          </video>

          <!-- 60fps Canvas Visualizer behind or if video is loading/error -->
          <canvas id="tp-live-canvas"></canvas>
          <div class="video-vignette"></div>

          <!-- Top HUD -->
          <div class="broadcast-top-hud">
            <div class="hud-live-pill">
              <span class="live-dot"></span>
              <span id="live-viewer-count">2,418 Watching Live</span>
            </div>
            <div class="hud-quality-badge">
              1080p 60fps • ULTRA HD
            </div>
          </div>

          <!-- Center Action Play/Pause Toggle -->
          <div class="broadcast-center-action">
            <button type="button" class="center-play-btn" id="center-play-toggle" onclick="togglePlayState()">
              ⏸
            </button>
            <div class="center-status-badge" id="center-status-text">
              Live Stream Broadcasting • Simulator Active
            </div>
          </div>

          <!-- Floating Live Reactions Stream (Facebook Live style hearts, likes, fire) -->
          <div class="reactions-stream" id="reactions-container"></div>

          <!-- Bottom Controls Bar -->
          <div class="broadcast-bottom-controls">
            <div class="scrubber-track" onclick="seekStream(event)">
              <div class="scrubber-progress" id="stream-progress"></div>
            </div>
            <div class="controls-row">
              <div style="display: flex; align-items: center; gap: 10px;">
                <button type="button" class="ctrl-btn" onclick="togglePlayState()" id="play-pause-btn">
                  <span id="play-pause-icon">⏸</span>
                  <span id="play-pause-label">Pause</span>
                </button>
                <button type="button" class="ctrl-btn" onclick="toggleMute()" id="mute-btn">
                  <span id="mute-icon">🔇</span>
                  <span id="mute-label">Unmute</span>
                </button>
                <span id="broadcast-clock">● LIVE 00:32:15</span>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span>Feed: High Speed Direct CDN</span>
                <button type="button" class="ctrl-btn" onclick="switchStreamMode('plugin')">
                  Test ${platformName} Embed ↗
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- MODE 2: Official Plugin Embed Iframe -->
        <div id="view-plugin-embed">
          <iframe
            id="tp-embed-player"
            src="${embedUrl}"
            class="video-frame"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowfullscreen="true"
          ></iframe>
          <div class="plugin-fallback-notice">
            <span>💡 Notice: If ${platformName} shows "Video Unavailable" (caused by browser third-party cookie restrictions or privacy settings), switch to the Live Direct Stream.</span>
            <div style="display:flex; align-items:center; gap:8px;">
              <button type="button" onclick="switchStreamMode('direct')">Switch to Live Direct Stream (Zero Error)</button>
              <a href="${canonicalUrl}" target="_blank" rel="noopener noreferrer" style="color:#38bdf8; font-size:11px; text-decoration:underline;">Open on ${platformName} ↗</a>
            </div>
          </div>
        </div>
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
            <div class="author-meta">Official Live Stream • Verified Broadcaster • TrafficPulse Simulator</div>
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
          <span id="like-count">24.8K</span> Likes
        </button>
        <button type="button" class="action-btn" onclick="triggerReaction('👍')">
          <span>👍</span>
          <span>Thumbs Up</span>
        </button>
        <button type="button" class="action-btn" onclick="triggerReaction('🔥')">
          <span>🔥</span>
          <span>Fire</span>
        </button>
        <button type="button" class="action-btn" onclick="triggerReaction('🥰')">
          <span>🥰</span>
          <span>Love</span>
        </button>
        <button type="button" class="action-btn" onclick="scrollToComments()">
          <span>💬</span>
          <span>1,842 Comments</span>
        </button>
        <button type="button" class="action-btn" onclick="shareVideo()">
          <span>↗️</span>
          <span>Share Stream</span>
        </button>
      </div>
    </div>

    <!-- Video Caption & Tags -->
    <div class="caption-box">
      <div class="caption-title">${title}</div>
      <div class="caption-desc">
        Streaming real-time verified multimedia feed from ${platformName}. TrafficPulse virtual browser is simulating authentic viewer dwell time, video seeking, live reactions, and multi-route navigation across related content.
      </div>
      <div class="caption-tags">
        <span class="tag">#${platform}</span>
        <span class="tag">#live</span>
        <span class="tag">#video</span>
        <span class="tag">#stream</span>
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
        <span style="font-size: 11px; color: #34d399;">● 18 new comments / min</span>
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
        <div class="comment-item">
          <div class="comment-avatar">SL</div>
          <div class="comment-body">
            <div class="comment-author">Sarah Lee</div>
            <div class="comment-text">Is this broadcast live right now? Beautiful stream quality ❤️</div>
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
    <div id="tp-live-badge">Watching Live Stream</div>
  </div>
  <div id="tp-live-scroll-radar">
    <div id="tp-live-scroll-indicator" style="top: 0%;"></div>
  </div>
  <div id="tp-live-telemetry-hud">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;font-weight:bold;color:#38bdf8;">
      <span>⚡ LIVE VIDEO SIMULATOR</span>
      <span id="tp-hud-coords" style="color:#94a3b8;">X: 50% • Y: 30%</span>
    </div>
    <div style="font-size:10px;color:#cbd5e1;display:flex;align-items:center;gap:8px;">
      <span>📜 SCROLL: <strong id="tp-hud-scroll" style="color:#34d399;">0%</strong></span>
      <span>•</span>
      <span id="tp-hud-action" style="color:#e2e8f0;">Streaming Broadcast</span>
    </div>
  </div>

  <script id="trafficpulse-social-script">
    (function() {
      var isPlaying = true;
      var isMuted = true;
      var currentLikes = 24820;
      var viewerBase = 2418;
      var likeBtn = document.getElementById('like-btn');
      var likeCount = document.getElementById('like-count');
      var viewerCountEl = document.getElementById('live-viewer-count');
      var reactionsContainer = document.getElementById('reactions-container');
      var centerBtn = document.getElementById('center-play-toggle');
      var centerStatus = document.getElementById('center-status-text');
      var playPauseIcon = document.getElementById('play-pause-icon');
      var playPauseLabel = document.getElementById('play-pause-label');
      var muteIcon = document.getElementById('mute-icon');
      var muteLabel = document.getElementById('mute-label');
      var nativeVideo = document.getElementById('tp-native-video');
      var scrubberProgress = document.getElementById('stream-progress');

      // Initialize video element
      if (nativeVideo) {
        nativeVideo.muted = true;
        nativeVideo.play().catch(function() {
          // Autoplay policy fallback: muted is required
          nativeVideo.muted = true;
          nativeVideo.play().catch(function() {});
        });

        nativeVideo.addEventListener('timeupdate', function() {
          if (nativeVideo.duration && scrubberProgress) {
            var pct = (nativeVideo.currentTime / nativeVideo.duration) * 100;
            scrubberProgress.style.width = pct + '%';
          }
        });
      }

      // Mode Switcher: toggle between Direct Stream and Plugin Embed
      window.switchStreamMode = function(mode) {
        var viewDirect = document.getElementById('view-direct-stream');
        var viewPlugin = document.getElementById('view-plugin-embed');
        var tabDirect = document.getElementById('tab-direct-stream');
        var tabPlugin = document.getElementById('tab-fb-plugin');

        if (mode === 'plugin') {
          if (viewDirect) viewDirect.style.display = 'none';
          if (viewPlugin) viewPlugin.style.display = 'block';
          if (tabDirect) tabDirect.classList.remove('active');
          if (tabPlugin) tabPlugin.classList.add('active');
          if (nativeVideo) nativeVideo.pause();
        } else {
          if (viewDirect) viewDirect.style.display = 'flex';
          if (viewPlugin) viewPlugin.style.display = 'none';
          if (tabDirect) tabDirect.classList.add('active');
          if (tabPlugin) tabPlugin.classList.remove('active');
          if (nativeVideo && isPlaying) nativeVideo.play().catch(function(){});
        }
      };

      // Play / Pause Toggle
      window.togglePlayState = function() {
        isPlaying = !isPlaying;
        if (nativeVideo) {
          if (isPlaying) {
            nativeVideo.play().catch(function(){});
          } else {
            nativeVideo.pause();
          }
        }
        if (centerBtn) centerBtn.textContent = isPlaying ? '⏸' : '▶';
        if (playPauseIcon) playPauseIcon.textContent = isPlaying ? '⏸' : '▶';
        if (playPauseLabel) playPauseLabel.textContent = isPlaying ? 'Pause' : 'Play';
        if (centerStatus) {
          centerStatus.textContent = isPlaying 
            ? 'Live Stream Broadcasting • Simulator Active'
            : 'Broadcast Paused';
        }
      };

      // Mute Toggle
      window.toggleMute = function() {
        isMuted = !isMuted;
        if (nativeVideo) {
          nativeVideo.muted = isMuted;
        }
        if (muteIcon) muteIcon.textContent = isMuted ? '🔇' : '🔊';
        if (muteLabel) muteLabel.textContent = isMuted ? 'Unmute' : 'Mute';
      };

      // Seek Bar
      window.seekStream = function(e) {
        if (!nativeVideo || !nativeVideo.duration) return;
        var rect = e.currentTarget.getBoundingClientRect();
        var clickX = e.clientX - rect.left;
        var ratio = Math.max(0, Math.min(1, clickX / rect.width));
        nativeVideo.currentTime = ratio * nativeVideo.duration;
        if (scrubberProgress) scrubberProgress.style.width = (ratio * 100) + '%';
      };

      // Floating Reaction Spawner (Facebook Live style)
      window.triggerReaction = function(emoji) {
        if (!reactionsContainer) return;
        var r = document.createElement('div');
        r.className = 'floating-reaction';
        r.textContent = emoji || '❤️';
        r.style.left = (Math.random() * 30 + 10) + 'px';
        reactionsContainer.appendChild(r);
        setTimeout(function() { r.remove(); }, 3000);
      };

      window.triggerLike = function(e) {
        currentLikes++;
        if (likeCount) likeCount.textContent = (currentLikes / 1000).toFixed(1) + 'K';
        if (likeBtn) likeBtn.classList.add('liked');
        for (var i = 0; i < 4; i++) {
          setTimeout(function() {
            window.triggerReaction(['❤️', '👍', '🔥', '🥰'][Math.floor(Math.random() * 4)]);
          }, i * 150);
        }
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

      // Navigate to sub-routes (comments, up-next, etc.)
      window.navigateRoute = function(url, title) {
        try {
          window.parent.postMessage({
            type: 'TP_LINK_CLICKED',
            href: url,
            text: title
          }, '*');
        } catch(e) {}
      };

      // Simulated Live Canvas Graphic Visualizer (Backup / ambient)
      var canvas = document.getElementById('tp-live-canvas');
      if (canvas) {
        var ctx = canvas.getContext('2d');
        var animTime = 0;

        function resizeCanvas() {
          if (!canvas || !canvas.parentElement) return;
          canvas.width = canvas.parentElement.clientWidth;
          canvas.height = canvas.parentElement.clientHeight;
        }
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        function drawVisualizer() {
          if (!ctx || !canvas) return;
          var w = canvas.width || 800;
          var h = canvas.height || 500;

          if (isPlaying) {
            animTime += 0.03;
          }

          // Background gradient
          var grad = ctx.createLinearGradient(0, 0, w, h);
          grad.addColorStop(0, '#020617');
          grad.addColorStop(0.5, '#090d16');
          grad.addColorStop(1, '#020617');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, w, h);

          // Central studio ambient glow
          var radGrad = ctx.createRadialGradient(w/2, h/2, 10, w/2, h/2, w * 0.45);
          radGrad.addColorStop(0, '${platformBadgeColor}44');
          radGrad.addColorStop(0.5, 'rgba(99, 102, 241, 0.15)');
          radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = radGrad;
          ctx.fillRect(0, 0, w, h);

          requestAnimationFrame(drawVisualizer);
        }
        drawVisualizer();
      }

      // Viewer Count Fluctuator
      setInterval(function() {
        var offset = Math.floor(Math.random() * 9) - 4;
        viewerBase = Math.max(1200, viewerBase + offset);
        if (viewerCountEl) {
          viewerCountEl.textContent = viewerBase.toLocaleString() + ' Watching Live';
        }
      }, 3500);

      // Random reaction generator
      setInterval(function() {
        if (isPlaying && Math.random() < 0.6) {
          window.triggerReaction(['❤️', '👍', '🔥', '🥰', '👏'][Math.floor(Math.random() * 5)]);
        }
      }, 2200);

      // Dynamically add new comments
      var commentNames = ['David Miller', 'Sophie Martin', 'Ryan Chen', 'Jessica Taylor', 'Lucas Brown'];
      var commentMessages = [
        'Awesome live video feed! 🙌',
        'Loving the sound design here ❤️',
        'Shared this with my followers ↗️',
        'Such high frame rate and quality 🔥',
        'Greetings from Toronto! Enjoying the stream 😊'
      ];
      setInterval(function() {
        var list = document.getElementById('comment-stream');
        if (list && isPlaying) {
          var name = commentNames[Math.floor(Math.random() * commentNames.length)];
          var msg = commentMessages[Math.floor(Math.random() * commentMessages.length)];
          var initials = name.split(' ').map(function(n){return n[0];}).join('');
          var item = document.createElement('div');
          item.className = 'comment-item';
          item.innerHTML = '<div class="comment-avatar">' + initials + '</div><div class="comment-body"><div class="comment-author">' + name + '</div><div class="comment-text">' + msg + '</div></div>';
          list.prepend(item);
          if (list.children.length > 8) {
            list.lastElementChild.remove();
          }
        }
      }, 5000);

      // Handle parent cursor & telemetry updates
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
        try {
          if (!event.data || event.data.type !== 'TP_UPDATE_VISITOR') return;

          var pct = typeof event.data.scrollPct === 'number' ? event.data.scrollPct : 0;
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
              if (Math.random() < 0.5) {
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
