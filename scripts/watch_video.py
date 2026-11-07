#!/usr/bin/env python3
"""
Playwright Python Autonomous Video Watcher

Requirements:
  pip install playwright
  playwright install chromium

Usage:
  python scripts/watch_video.py --url "https://www.youtube.com/watch?v=dQw4w9WgXcQ" --duration 30
"""

import sys
import time
import argparse
import random
from playwright.sync_api import sync_playwright

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
]

def dismiss_consent_banners(page, is_youtube):
    selectors = [
        'button[aria-label*="Accept all" i]',
        'button[aria-label*="Accept the use of cookies" i]',
        'button:has-text("Accept all")',
        'button:has-text("I agree")',
        'button:has-text("Agree")',
        'form[action*="consent.youtube.com"] button',
        '#onetrust-accept-btn-handler',
        '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll',
        'button:has-text("Accept Cookies")',
        'button:has-text("Allow All")',
    ]
    for sel in selectors:
        try:
            btn = page.locator(sel).first
            if btn.is_visible(timeout=1500):
                btn.click()
                print(f"[Playwright] Dismissed cookie/consent banner: {sel}")
                time.sleep(1)
                return True
        except Exception:
            pass
    return False

def initiate_playback(page, is_youtube):
    if is_youtube:
        yt_selectors = [
            '.ytp-large-play-button',
            'button.ytp-large-play-button',
            '.ytp-play-button',
            '#movie_player video',
        ]
        for sel in yt_selectors:
            try:
                el = page.locator(sel).first
                if el.is_visible(timeout=2500):
                    el.click()
                    print(f"[Playwright] Clicked YouTube play button: {sel}")
                    time.sleep(1)
                    return True
            except Exception:
                pass

    # Generic player selectors
    generic = [
        'button.vjs-big-play-button',
        'button[aria-label*="Play" i]',
        'button.play-button',
        'video',
    ]
    for sel in generic:
        try:
            el = page.locator(sel).first
            if el.is_visible(timeout=2000):
                el.click()
                print(f"[Playwright] Clicked generic play element: {sel}")
                return True
        except Exception:
            pass

    # Direct DOM video.play() fallback
    try:
        page.evaluate("() => { const v = document.querySelector('video'); if (v) { v.muted = true; v.play(); } }")
        print("[Playwright] Dispatched direct DOM video.play() fallback")
        return True
    except Exception:
        return False

def handle_youtube_skip_ads(page):
    ad_selectors = [
        '.ytp-ad-skip-button-modern',
        '.ytp-skip-ad-button',
        'button.ytp-ad-skip-button',
    ]
    for sel in ad_selectors:
        try:
            btn = page.locator(sel).first
            if btn.is_visible(timeout=300):
                btn.click()
                print("[Playwright] Clicked YouTube 'Skip Ad' button")
                break
        except Exception:
            pass

def main():
    parser = argparse.ArgumentParser(description="Autonomous Playwright Video Watcher")
    parser.add_argument("--url", "-u", default="https://www.youtube.com/watch?v=dQw4w9WgXcQ", help="Video URL")
    parser.add_argument("--duration", "-d", type=int, default=30, help="Watch duration in seconds")
    parser.add_argument("--headed", action="store_true", help="Launch visible browser")
    parser.add_argument("--screenshot", action="store_true", default=True, help="Take verification screenshot")
    args = parser.parse_args()

    url = args.url
    duration = args.duration
    headless = not args.headed
    is_youtube = "youtube.com" in url or "youtu.be" in url

    print("=" * 65)
    print("  PYTHON PLAYWRIGHT VIDEO WATCHER AUTOMATION")
    print("=" * 65)
    print(f"Target URL:     {url}")
    print(f"Watch Duration: {duration} seconds")
    print(f"Browser Mode:   {'Headless' if headless else 'Headed'}")
    print("=" * 65)

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=headless,
            args=[
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-blink-features=AutomationControlled",
                "--autoplay-policy=no-user-gesture-required",
                "--mute-audio",
            ]
        )

        context = browser.new_context(
            user_agent=random.choice(USER_AGENTS),
            viewport={"width": 1920, "height": 1080},
            locale="en-US",
            timezone_id="America/New_York",
        )

        # Anti-bot stealth: remove navigator.webdriver
        context.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
            window.chrome = { runtime: {} };
        """)

        page = context.new_page()

        print(f"[Playwright] Navigating to {url}...")
        page.goto(url, wait_until="domcontentloaded", timeout=45000)
        print(f"[Playwright] Page loaded: {page.title()}")
        time.sleep(1.5)

        dismiss_consent_banners(page, is_youtube)
        initiate_playback(page, is_youtube)

        # Stream monitoring loop
        start = time.time()
        print(f"[Playwright] Commencing active watch stream for {duration} seconds...")

        last_report = 0
        while time.time() - start < duration:
            elapsed = int(time.time() - start)
            if is_youtube and elapsed % 4 == 0:
                handle_youtube_skip_ads(page)

            if elapsed - last_report >= 5:
                last_report = elapsed
                try:
                    cur_time = page.evaluate("() => document.querySelector('video') ? document.querySelector('video').currentTime : 0")
                    is_paused = page.evaluate("() => document.querySelector('video') ? document.querySelector('video').paused : true")
                    print(f"[Playwright] Elapsed: {elapsed}s/{duration}s | Video Timecode: {cur_time:.1f}s | Status: {'Paused' if is_paused else 'Playing ▶'}")
                except Exception:
                    print(f"[Playwright] Elapsed: {elapsed}s/{duration}s | Watching stream...")

            time.sleep(1)

        print(f"[Playwright] Completed {duration}s watch session successfully!")

        if args.screenshot:
            screenshot_path = "playwright_video_verification.png"
            page.screenshot(path=screenshot_path)
            print(f"[Playwright] Saved verification screenshot to {screenshot_path}")

        context.close()
        browser.close()

if __name__ == "__main__":
    main()
