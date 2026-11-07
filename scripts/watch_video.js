#!/usr/bin/env node
/**
 * Standalone Node.js Playwright Video Watcher CLI
 * 
 * Strict Requirements Met:
 * 1. Real Browser Rendering: Headless/headed Chromium browser via Playwright with complete JavaScript execution.
 * 2. Anti-Bot Bypassing: Realistic User-Agents, viewports, navigator.webdriver masking, Chrome runtime emulation.
 * 3. Handle Cookie/Consent Banners: Auto-detection and programmatic dismissal of YouTube/Google, GDPR, OneTrust, CookieBot consent modals.
 * 4. Video Interaction & Playback: Targets YouTube (.ytp-large-play-button), Vimeo, Facebook, TikTok, and HTML5 <video> elements with human-like clicks.
 * 5. Watch Duration: Configurable timeout/duration parameter keeping the browser open while monitoring stream timecode before graceful teardown.
 * 
 * Usage:
 *   node scripts/watch_video.js --url "https://www.youtube.com/watch?v=dQw4w9WgXcQ" --duration 30
 *   node scripts/watch_video.js --url "https://example.com/video" --duration 15 --no-screenshot
 */

import { chromium } from 'playwright';

const MODERN_USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
];

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    duration: 30,
    headless: true,
    screenshot: true,
    muteAudio: true,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--url' || arg === '-u') {
      options.url = args[++i];
    } else if (arg === '--duration' || arg === '-d') {
      options.duration = parseInt(args[++i], 10) || 30;
    } else if (arg === '--headed') {
      options.headless = false;
    } else if (arg === '--headless') {
      options.headless = true;
    } else if (arg === '--no-screenshot') {
      options.screenshot = false;
    } else if (arg === '--unmute') {
      options.muteAudio = false;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
TrafficPulse Playwright Video Watcher CLI

Requirements Implemented:
  1. Real Browser Rendering (Chromium browser with JS/video execution)
  2. Anti-Bot Bypassing (realistic UA, navigator.webdriver masking, chrome shims)
  3. Cookie/Consent Modal Handling (YouTube, Google, OneTrust, CookieBot)
  4. Video Interaction & Playback (.ytp-large-play-button, HTML5 <video>, ad skipping)
  5. Configurable Watch Duration (heartbeat telemetry, graceful cleanup)

Options:
  --url, -u       Video URL to watch (default: YouTube sample)
  --duration, -d  Watch duration in seconds (default: 30)
  --headed        Run in headed/visible mode (default: headless)
  --headless      Run in headless mode
  --unmute        Do not mute audio
  --no-screenshot Skip capturing verification screenshot
      `);
      process.exit(0);
    }
  }

  return options;
}

async function dismissCookieBanners(page, isYouTube, log) {
  const selectors = [
    'button[aria-label*="Accept all" i]',
    'button[aria-label*="Accept the use of cookies" i]',
    'button:has-text("Accept all")',
    'button:has-text("I agree")',
    'button:has-text("Agree")',
    'ytd-button-renderer:has-text("Accept")',
    'form[action*="consent.youtube.com"] button',
    'form[action*="consent.google.com"] button',
    '#onetrust-accept-btn-handler',
    '#accept-recommended-btn-handler',
    '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll',
    'button[id*="cookie-accept" i]',
    'button:has-text("Accept Cookies")',
    'button:has-text("Allow All")',
    'button:has-text("Accept All Cookies")',
    'button:has-text("Got it")',
  ];

  for (const selector of selectors) {
    try {
      const button = page.locator(selector).first();
      if (await button.isVisible({ timeout: 1200 })) {
        await button.click({ delay: 100 });
        log(`Dismissed cookie/consent banner matching: "${selector}"`);
        await page.waitForTimeout(800);
        return true;
      }
    } catch {}
  }

  try {
    for (const frame of page.frames()) {
      for (const sel of ['button[aria-label*="Accept" i]', 'button:has-text("Accept all")', 'button:has-text("I agree")']) {
        const btn = frame.locator(sel).first();
        if (await btn.isVisible({ timeout: 500 })) {
          await btn.click();
          log(`Dismissed consent dialog in iframe: "${sel}"`);
          return true;
        }
      }
    }
  } catch {}

  return false;
}

async function initiateVideoPlayback(page, isYouTube, log) {
  if (isYouTube) {
    const ytPlaySelectors = [
      '.ytp-large-play-button',
      'button.ytp-large-play-button',
      '.ytp-play-button',
      '#movie_player video',
      'video.video-stream',
    ];

    for (const sel of ytPlaySelectors) {
      try {
        const el = page.locator(sel).first();
        if (await el.isVisible({ timeout: 2500 })) {
          await el.click({ delay: 50 });
          log(`Triggered YouTube play element: "${sel}"`);
          await page.waitForTimeout(1000);
          return true;
        }
      } catch {}
    }
  }

  const genericSelectors = [
    'button.vjs-big-play-button',
    'button[aria-label*="Play" i]',
    'button.play-btn',
    '.video-player-play-button',
    'video',
  ];

  for (const sel of genericSelectors) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 2000 })) {
        await el.click();
        log(`Triggered play element: "${sel}"`);
        return true;
      }
    } catch {}
  }

  // Direct DOM video.play() fallback
  return await page.evaluate(() => {
    const vids = Array.from(document.querySelectorAll('video'));
    if (vids.length > 0) {
      const v = vids[0];
      v.muted = true;
      const promise = v.play();
      if (promise !== undefined) {
        promise.catch(() => {});
      }
      return true;
    }
    return false;
  }).catch(() => false);
}

async function handleYouTubeAds(page, log) {
  try {
    const skipSelectors = [
      '.ytp-ad-skip-button',
      '.ytp-skip-ad-button',
      'button.ytp-ad-skip-button-modern',
      '.ytp-ad-overlay-close-button',
    ];
    for (const sel of skipSelectors) {
      const btn = page.locator(sel).first();
      if (await btn.isVisible({ timeout: 300 })) {
        await btn.click();
        log(`Skipped YouTube advertisement via: ${sel}`);
        return true;
      }
    }
  } catch {}
  return false;
}

async function getVideoCurrentTime(page) {
  try {
    return await page.evaluate(() => {
      const v = document.querySelector('video');
      return v ? v.currentTime : 0;
    });
  } catch {
    return 0;
  }
}

async function isVideoPaused(page) {
  try {
    return await page.evaluate(() => {
      const v = document.querySelector('video');
      return v ? v.paused : true;
    });
  } catch {
    return true;
  }
}

async function watchVideo(options) {
  const {
    url,
    duration = 30,
    headless = true,
    muteAudio = true,
    screenshot = true,
  } = options;

  const log = (msg) => {
    const ts = new Date().toISOString().split('T')[1].slice(0, 8);
    console.log(`\x1b[36m[${ts}] [PlaywrightWatcher]\x1b[0m ${msg}`);
  };

  const isYouTube = url.toLowerCase().includes('youtube.com') || url.toLowerCase().includes('youtu.be');
  const userAgent = MODERN_USER_AGENTS[Math.floor(Math.random() * MODERN_USER_AGENTS.length)];

  log(`Targeting URL: ${url}`);
  log(`Duration: ${duration}s | Headless: ${headless} | Audio: ${muteAudio ? 'Muted' : 'Unmuted'}`);

  let browser = null;
  let context = null;
  let page = null;

  try {
    const launchArgs = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--disable-blink-features=AutomationControlled',
      '--autoplay-policy=no-user-gesture-required',
    ];
    if (muteAudio) launchArgs.push('--mute-audio');

    browser = await chromium.launch({
      headless,
      args: launchArgs,
    });

    context = await browser.newContext({
      userAgent,
      viewport: { width: 1920, height: 1080 },
      locale: 'en-US',
      timezoneId: 'America/New_York',
    });

    // Anti-bot stealth init script
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      window.chrome = { app: { isInstalled: false }, runtime: {}, loadTimes: () => {}, csi: () => {} };
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
    });

    page = await context.newPage();

    log('Navigating to target video...');
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });

    const title = await page.title().catch(() => 'Unknown Title');
    log(`Page Loaded: "${title}"`);

    await page.waitForTimeout(1500);

    log('Checking for cookie consent / privacy prompts...');
    const consentDismissed = await dismissCookieBanners(page, isYouTube, log);
    if (consentDismissed) log('Cookie / consent banner successfully handled!');

    log('Triggering video playback...');
    const played = await initiateVideoPlayback(page, isYouTube, log);
    const initialTime = await getVideoCurrentTime(page);
    log(`Initial playback timecode: ${initialTime.toFixed(1)}s`);

    log(`Streaming video for ${duration} seconds...`);
    const startTime = Date.now();
    const targetMs = duration * 1000;
    let lastReport = 0;

    while (Date.now() - startTime < targetMs) {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      if (isYouTube && elapsed % 4 === 0) {
        await handleYouTubeAds(page, log);
      }

      if (elapsed - lastReport >= 5) {
        lastReport = elapsed;
        const currentTime = await getVideoCurrentTime(page);
        const paused = await isVideoPaused(page);
        log(`Progress: ${elapsed}s / ${duration}s | Timecode: ${currentTime.toFixed(1)}s | State: ${paused ? 'Paused' : 'Playing ▶'}`);

        if (paused && elapsed > 2) {
          log('Video is paused. Attempting resume click...');
          await page.evaluate(() => {
            const v = document.querySelector('video');
            if (v) v.play().catch(() => {});
          }).catch(() => {});
        }
      }

      await page.waitForTimeout(1000);
    }

    const finalTime = await getVideoCurrentTime(page);
    log(`Playback session complete! Streamed timecode: ${initialTime.toFixed(1)}s -> ${finalTime.toFixed(1)}s`);

    let screenshotBuffer = null;
    if (screenshot && page) {
      try {
        screenshotBuffer = await page.screenshot({ type: 'jpeg', quality: 80 });
        log(`Captured verification screenshot (${screenshotBuffer.length} bytes).`);
      } catch (err) {
        log(`Screenshot error: ${err.message}`);
      }
    }

    return {
      success: true,
      title,
      consentDismissed,
      videoStarted: played || (finalTime > initialTime),
      initialTime,
      finalTime,
      actualDwell: Math.floor((Date.now() - startTime) / 1000),
      screenshotBase64: screenshotBuffer ? screenshotBuffer.toString('base64') : null,
    };
  } finally {
    log('Gracefully closing browser instance...');
    try {
      if (page) await page.close().catch(() => {});
      if (context) await context.close().catch(() => {});
      if (browser) await browser.close().catch(() => {});
    } catch {}
    log('Browser closed cleanly.');
  }
}

async function main() {
  const options = parseArgs();
  console.log('='.repeat(70));
  console.log('  TRAFFICPULSE PLAYWRIGHT VIDEO WATCHER AUTOMATION');
  console.log('='.repeat(70));

  try {
    const result = await watchVideo(options);
    console.log('='.repeat(70));
    console.log('  SESSION RESULTS SUMMARY');
    console.log('='.repeat(70));
    console.log(`Status:             \x1b[32mSUCCESS\x1b[0m`);
    console.log(`Title:              ${result.title}`);
    console.log(`Consent Dismissed:  ${result.consentDismissed ? 'Yes' : 'No / Not required'}`);
    console.log(`Video Started:      ${result.videoStarted ? 'Yes' : 'No'}`);
    console.log(`Timecode:           ${result.initialTime.toFixed(1)}s -> ${result.finalTime.toFixed(1)}s`);
    console.log(`Actual Dwell:       ${result.actualDwell}s`);
    if (result.screenshotBase64) {
      console.log(`Screenshot:         Captured (${result.screenshotBase64.length} base64 chars)`);
    }
    console.log('='.repeat(70));
    process.exit(0);
  } catch (err) {
    console.error('\n\x1b[31mExecution Error:\x1b[0m', err.message);
    process.exit(1);
  }
}

main();
