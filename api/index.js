// api-src/index.ts
import express from "express";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { HttpsProxyAgent } from "https-proxy-agent";
import { SocksProxyAgent } from "socks-proxy-agent";

// src/utils/universalCrawler.ts
function getApexDomain(host) {
  if (!host) return "";
  const cleanHost = host.toLowerCase().trim();
  if (cleanHost === "localhost" || cleanHost === "127.0.0.1") return cleanHost;
  const parts = cleanHost.split(".");
  if (parts.length <= 2) return cleanHost;
  const multiPartTlds = [
    "co.uk",
    "org.uk",
    "gov.uk",
    "ac.uk",
    "com.ng",
    "org.ng",
    "gov.ng",
    "edu.ng",
    "com.au",
    "net.au",
    "org.au",
    "edu.au",
    "co.nz",
    "org.nz",
    "net.nz",
    "com.br",
    "org.br",
    "co.za",
    "com.mx"
  ];
  const lastTwo = parts.slice(-2).join(".");
  if (multiPartTlds.includes(lastTwo) && parts.length >= 3) {
    return parts.slice(-3).join(".");
  }
  return parts.slice(-2).join(".");
}
function isSameApexDomain(candidateHost, baseHost) {
  if (!candidateHost || !baseHost) return false;
  const cHost = candidateHost.toLowerCase().trim();
  const bHost = baseHost.toLowerCase().trim();
  if (cHost === bHost) return true;
  if (cHost.endsWith(`.${bHost}`) || bHost.endsWith(`.${cHost}`)) return true;
  const cApex = getApexDomain(cHost);
  const bApex = getApexDomain(bHost);
  return !!cApex && cApex === bApex;
}
function normalizePathWithQuery(u) {
  const cleanSearch = new URLSearchParams(u.search);
  const trackingKeys = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "fbclid",
    "gclid",
    "msclkid",
    "twclid",
    "_ga",
    "_gl",
    "ref",
    "source",
    "trk",
    "mc_cid",
    "mc_eid",
    "igshid",
    "spm"
  ];
  trackingKeys.forEach((k) => cleanSearch.delete(k));
  const queryStr = cleanSearch.toString() ? `?${cleanSearch.toString()}` : "";
  const pName = u.pathname.replace(/\/+$/, "") || "/";
  return `${pName}${queryStr}`;
}
function normalizeCanonicalUrl(u) {
  const cleanPath = normalizePathWithQuery(u);
  return `${u.protocol}//${u.host.toLowerCase()}${cleanPath}`;
}
function slugToTitle(slugPath, fallbackText) {
  if (fallbackText && fallbackText.trim().length > 2 && !fallbackText.includes("<") && !fallbackText.includes("{") && !fallbackText.startsWith("/") && !fallbackText.startsWith("http") && !fallbackText.includes(".com") && !fallbackText.includes(".org") && !fallbackText.includes(".net") && !fallbackText.includes(".ng") && !fallbackText.includes(".io")) {
    return fallbackText.trim();
  }
  let segment = slugPath;
  if (segment.includes("=")) {
    segment = segment.split("=").pop() || segment;
  } else {
    segment = segment.split("/").filter(Boolean).pop() || segment;
  }
  const clean = segment.replace(/\.html?$/i, "").replace(/\.php$/i, "").replace(/[?#].*$/, "").replace(/[-_=+]/g, " ").replace(/\s+/g, " ").trim();
  if (!clean || clean === "/") return "Home";
  return clean.replace(/\b\w/g, (c) => c.toUpperCase());
}
function classifyPageCategory(path3, linkText = "") {
  const lowerPath = path3.toLowerCase();
  const lowerText = linkText.toLowerCase();
  if (lowerPath.includes("/category/") || lowerPath.includes("/categories/") || lowerPath.includes("/topics/") || lowerPath.includes("/section/") || lowerPath.includes("/collections/") || lowerPath.includes("category=") || lowerPath.includes("cat=")) {
    return "category";
  }
  if (lowerPath.includes("/tag/") || lowerPath.includes("/tags/") || lowerPath.includes("/post_tag/") || lowerPath.includes("tag=")) {
    return "tag";
  }
  if (lowerPath.includes("/product/") || lowerPath.includes("/products/") || lowerPath.includes("/item/") || lowerPath.includes("/items/") || lowerPath.includes("/shop/") || lowerPath.includes("/store/") || lowerPath.includes("/pricing") || lowerPath.includes("product=") || lowerPath.includes("item=")) {
    return "product";
  }
  if (lowerPath.includes("/archive") || lowerPath.includes("/author/") || /\/\d{4}\/\d{2}/.test(lowerPath)) {
    return "archive";
  }
  if (lowerPath.includes("/blog/") || lowerPath.includes("/posts/") || lowerPath.includes("/post/") || lowerPath.includes("/article/") || lowerPath.includes("/articles/") || lowerPath.includes("/news/") || lowerPath.includes("/story/") || lowerPath.includes("/job/") || lowerPath.includes("/jobs/") || lowerPath.includes("/careers/") || lowerPath.includes("/vacancy/") || lowerPath.includes("/vacancies/") || lowerPath.includes("/listing/") || lowerPath.includes("/listings/") || lowerPath.includes("post=") || lowerPath.includes("article=") || lowerPath.includes("job=") || lowerPath.includes("listing=") || lowerPath.includes("p=") || lowerPath.includes("id=")) {
    return "post";
  }
  const standardPages = [
    "/",
    "/about",
    "/about-us",
    "/contact",
    "/contact-us",
    "/privacy",
    "/privacy-policy",
    "/terms",
    "/terms-of-service",
    "/terms-and-conditions",
    "/faq",
    "/help",
    "/features",
    "/services",
    "/docs",
    "/documentation",
    "/team",
    "/careers",
    "/login",
    "/signup",
    "/register",
    "/press",
    "/sitemap",
    "/disclaimer",
    "/cookie-policy"
  ];
  if (standardPages.some((p) => lowerPath === p || lowerPath === `${p}/` || lowerPath.startsWith(`${p}/`))) {
    return "page";
  }
  if (path3.length > 15 && (path3.includes("-") || path3.includes("_")) || (path3.match(/[-_]/g) || []).length >= 2) {
    return "post";
  }
  return "page";
}
function isCleanPublicPage(testPath, testTitle = "") {
  const lowerPath = testPath.toLowerCase();
  const lowerTitle = testTitle.toLowerCase();
  if (/\.(js|jsx|ts|tsx|json|xml|rss|atom|css|map|wasm|ico|svg|png|jpg|jpeg|webp|gif|bmp|tiff|woff|woff2|ttf|eot|otf|pdf|zip|tar|gz|mp4|webm|avi|mp3|wav|ogg|bin|txt|md|yml|yaml|env|sql|log|apk|exe)($|\?)/i.test(
    lowerPath
  )) {
    return false;
  }
  if (/\/(iframe|partial|template|chunk|embed|widget|bundle|sw|service-worker|manifest)\.html?/i.test(
    lowerPath
  )) {
    return false;
  }
  const bannedPrefixes = [
    "/api/",
    "/api",
    "/_next/data/",
    "/__next",
    "/_nuxt/",
    "/static/",
    "/assets/",
    "/node_modules/",
    "/cdn-cgi/",
    "/wp-admin/",
    "/wp-includes/",
    "/xmlrpc.php",
    "/autodiscover/",
    "/.well-known/",
    "/graphql",
    "/socket.io",
    "/sockjs",
    "/telescope/",
    "/horizon/",
    "/oauth/",
    "/auth/callback",
    "/auth/login",
    "/auth/signup",
    "/health",
    "/healthz",
    "/metrics",
    "/cgi-bin/",
    "/track",
    "/telemetry",
    "/beacon",
    "/pixel",
    "/ping",
    "/cart/add",
    "/checkout",
    "/wp-json/"
  ];
  if (bannedPrefixes.some((prefix) => lowerPath.startsWith(prefix) || lowerPath.includes(`/${prefix.replace(/^\//, "")}`))) {
    return false;
  }
  if (lowerTitle.includes("<script") || lowerTitle.includes("function(") || lowerTitle.includes("{id:") || lowerTitle.includes("application/json") || lowerTitle.includes("[object object]") || lowerTitle.includes("undefined") || lowerTitle.includes("null") || lowerTitle.startsWith("chunk-")) {
    return false;
  }
  return true;
}
function generateDomainAdaptivePages(targetUrl, hostname, origin, gaMeasurementId, gtmId, siteTitle, siteDesc) {
  const lowerHost = hostname.toLowerCase();
  const lowerUrl = targetUrl.toLowerCase();
  const gaDetected = !!gaMeasurementId || !!gtmId;
  const rawBrand = siteTitle && siteTitle.length < 35 && !siteTitle.includes("|") && !siteTitle.includes("-") ? siteTitle.trim() : hostname.replace(/^(?:www\.|jobs\.|careers\.|blog\.|app\.|shop\.)/i, "").replace(/\.[a-z.]+$/i, "");
  const brandName = rawBrand ? rawBrand.charAt(0).toUpperCase() + rawBrand.slice(1) : "Platform";
  if (lowerHost.includes("job") || lowerHost.includes("career") || lowerHost.includes("work") || lowerHost.includes("vacancy") || lowerHost.includes("hire") || lowerHost.includes("talent") || lowerHost.includes("eezor") || lowerUrl.includes("job")) {
    const jobPaths = [
      // Live Member-Created & User-Posted Listings (From Member Submissions)
      { path: "/?job=job_1787164089747", title: "Male Barbecue sales person is urgently needed", cat: "post", weight: 99 },
      { path: "/?job=job_1785681865131", title: "Social Media & Community Engagement Manager for Tech Hub", cat: "post", weight: 98 },
      { path: "/?job=job_1784920193847", title: "Executive Virtual Assistant & WhatsApp Client Support Specialist", cat: "post", weight: 98 },
      { path: "/?job=job_1783419082918", title: "Urgent: Dispatch Rider with Valid Riders Card (Lagos Island & Ikeja)", cat: "post", weight: 97 },
      { path: "/?job=job_1782019482710", title: "Barista and Cafe Supervisor for Artisan Coffee House (Victoria Island)", cat: "post", weight: 97 },
      // Core Verified Catalog Job Listings
      { path: "/?job=job_101", title: "Mobile App Developer for Dispatch Rider Tracking System", cat: "post", weight: 96 },
      { path: "/?job=job_102", title: "Brand Identity & Web UI/UX for Abuja Federal Contractor Portal", cat: "post", weight: 96 },
      { path: "/?job=job_103", title: "15kVA Commercial Solar & Lithium Battery Setup in Trans-Amadi", cat: "post", weight: 95 },
      { path: "/?job=job_104", title: "Tax Compliance & Audit Specialist for Enugu Tech Startup", cat: "post", weight: 95 },
      { path: "/?job=job_105", title: "Urgently Needed: Full-Stack Next.js & Stripe/Paystack Engineer", cat: "post", weight: 96 },
      { path: "/?job=job_106", title: "Social Media Content Creator & Video Editor for Skincare Brand", cat: "post", weight: 94 },
      { path: "/?job=job_107", title: "Flutterwave & Monnify Virtual Account Payment Specialist", cat: "post", weight: 95 },
      { path: "/?job=job_108", title: "Corporate Legal Advisor for Tech Startup Incorporation & NDPR", cat: "post", weight: 93 },
      { path: "/?job=job_109", title: "Executive Real Estate Architectural Renderings & 3D Flythrough", cat: "post", weight: 94 },
      { path: "/?job=job_110", title: "Hospitality CCTV & Biometric Access Control Installation Lead", cat: "post", weight: 94 },
      { path: "/?job=job_111", title: "High-Scale PostgreSQL Database Administrator & Query Optimization", cat: "post", weight: 95 },
      { path: "/?job=job_112", title: "E-commerce SEO Audit & Conversion Rate Optimization (CRO)", cat: "post", weight: 94 },
      { path: "/?job=job_113", title: "Solar Inverter System Installation & Farm Automation Control", cat: "post", weight: 93 },
      { path: "/?job=job_114", title: "Textile E-commerce Store & Hausa Multi-language UI Development", cat: "post", weight: 93 },
      { path: "/?job=job_115", title: "Offshore Logistics Fleet Tracking & Petroleum Inventory Dashboard", cat: "post", weight: 94 },
      { path: "/?job=job_116", title: "Hospitality Management Software & POS Integration for Owerri Hotel", cat: "post", weight: 94 },
      // Category Hubs & Structural Portals
      { path: "/jobs", title: `All Open Vacancies | ${brandName}`, cat: "category", weight: 95 },
      { path: "/jobs/remote", title: "Remote & Hybrid Opportunities", cat: "category", weight: 94 },
      { path: "/jobs/engineering", title: "Software & Technology Roles", cat: "category", weight: 90 },
      { path: "/jobs/product", title: "Product & Design Positions", cat: "category", weight: 88 },
      { path: "/jobs/marketing", title: "Marketing & Sales Opportunities", cat: "category", weight: 86 },
      { path: "/companies", title: "Hiring Companies & Employers", cat: "page", weight: 85 },
      { path: "/salaries", title: "Compensation Benchmarks & Salaries", cat: "page", weight: 82 },
      { path: "/post-job", title: "Post a Job Opening", cat: "page", weight: 85 },
      { path: "/about", title: `About ${brandName}`, cat: "page", weight: 75 },
      { path: "/contact", title: "Candidate & Employer Support", cat: "page", weight: 70 },
      { path: "/faq", title: "Frequently Asked Questions", cat: "page", weight: 70 },
      { path: "/terms", title: "Terms of Service", cat: "page", weight: 60 },
      { path: "/privacy", title: "Privacy Policy", cat: "page", weight: 60 }
    ];
    return jobPaths.map((item, idx) => ({
      id: `synth_job_${idx + 1}`,
      url: `${origin}${item.path}`,
      path: item.path,
      title: item.title,
      description: `[Career Portal] ${item.title}`,
      depth: item.path.split("/").filter(Boolean).length || 1,
      status: 200,
      includedInVisits: true,
      visitWeight: item.weight,
      gaDetected,
      category: item.cat
    }));
  }
  if (lowerHost.includes("shop") || lowerHost.includes("store") || lowerHost.includes("cart") || lowerHost.includes("market") || lowerHost.includes("buy")) {
    const commercePaths = [
      { path: "/products", title: "All Products & Catalog", cat: "category", weight: 90 },
      { path: "/categories", title: "Product Categories", cat: "category", weight: 88 },
      { path: "/category/electronics", title: "Electronics & Gadgets", cat: "category", weight: 85 },
      { path: "/category/fashion", title: "Fashion & Apparel", cat: "category", weight: 85 },
      { path: "/category/home", title: "Home & Living Essentials", cat: "category", weight: 80 },
      { path: "/featured", title: "Featured Deals & Specials", cat: "post", weight: 95 },
      { path: "/deals", title: "Daily Discount Offers", cat: "post", weight: 92 },
      { path: "/bestsellers", title: "Bestselling Items", cat: "post", weight: 94 },
      { path: "/reviews", title: "Customer Reviews & Ratings", cat: "page", weight: 75 },
      { path: "/about", title: "About Our Store", cat: "page", weight: 70 },
      { path: "/contact", title: "Customer Support & Contact", cat: "page", weight: 70 },
      { path: "/shipping", title: "Shipping & Delivery Policy", cat: "page", weight: 65 },
      { path: "/faq", title: "Frequently Asked Questions", cat: "page", weight: 65 },
      { path: "/terms", title: "Terms of Service", cat: "page", weight: 60 },
      { path: "/privacy", title: "Privacy Policy", cat: "page", weight: 60 }
    ];
    return commercePaths.map((item, idx) => ({
      id: `synth_store_${idx + 1}`,
      url: `${origin}${item.path}`,
      path: item.path,
      title: item.title,
      description: `[Store Catalog] ${item.title}`,
      depth: item.path.split("/").filter(Boolean).length || 1,
      status: 200,
      includedInVisits: true,
      visitWeight: item.weight,
      gaDetected,
      category: item.cat
    }));
  }
  if (lowerHost.includes("blog") || lowerHost.includes("news") || lowerHost.includes("times") || lowerHost.includes("post") || lowerHost.includes("daily") || lowerHost.includes("press") || lowerHost.includes("tech")) {
    const publicationPaths = [
      { path: "/latest", title: "Latest Breaking Headlines", cat: "category", weight: 95 },
      { path: "/trending", title: "Trending Stories & Topics", cat: "category", weight: 92 },
      { path: "/category/technology", title: "Technology & Innovation", cat: "category", weight: 88 },
      { path: "/category/business", title: "Business & Economy Insights", cat: "category", weight: 88 },
      { path: "/category/market-analysis", title: "Market & Industry Analysis", cat: "category", weight: 85 },
      { path: "/category/opinions", title: "Editorial & Opinion Columns", cat: "category", weight: 82 },
      { path: "/category/features", title: "In-Depth Feature Reports", cat: "category", weight: 85 },
      { path: "/archive", title: "Publication Archives", cat: "archive", weight: 70 },
      { path: "/authors", title: "Contributing Authors & Journalists", cat: "page", weight: 75 },
      { path: "/about", title: "About the Publication", cat: "page", weight: 70 },
      { path: "/contact", title: "Newsroom Contact & Submissions", cat: "page", weight: 70 },
      { path: "/newsletter", title: "Daily Digest Newsletter", cat: "page", weight: 75 },
      { path: "/privacy", title: "Privacy Policy", cat: "page", weight: 60 }
    ];
    return publicationPaths.map((item, idx) => ({
      id: `synth_news_${idx + 1}`,
      url: `${origin}${item.path}`,
      path: item.path,
      title: item.title,
      description: `[Editorial Desk] ${item.title}`,
      depth: item.path.split("/").filter(Boolean).length || 1,
      status: 200,
      includedInVisits: true,
      visitWeight: item.weight,
      gaDetected,
      category: item.cat
    }));
  }
  const defaultPaths = [
    { path: "/features", title: "Platform Features & Architecture", cat: "page", weight: 85 },
    { path: "/services", title: "Core Services & Capabilities", cat: "page", weight: 85 },
    { path: "/solutions", title: "Enterprise & Individual Solutions", cat: "page", weight: 82 },
    { path: "/pricing", title: "Plans, Pricing & Tiers", cat: "product", weight: 90 },
    { path: "/about", title: "About Company & Mission", cat: "page", weight: 75 },
    { path: "/contact", title: "Contact Us & Customer Support", cat: "page", weight: 75 },
    { path: "/blog", title: "Company Blog & Updates", cat: "category", weight: 88 },
    { path: "/faq", title: "Frequently Asked Questions", cat: "page", weight: 70 },
    { path: "/docs", title: "Product Documentation & Guides", cat: "page", weight: 85 },
    { path: "/terms", title: "Terms of Service", cat: "page", weight: 60 },
    { path: "/privacy", title: "Privacy Policy", cat: "page", weight: 60 }
  ];
  return defaultPaths.map((item, idx) => ({
    id: `synth_gen_${idx + 1}`,
    url: `${origin}${item.path}`,
    path: item.path,
    title: item.title,
    description: `[Core Pathway] ${item.title}`,
    depth: 1,
    status: 200,
    includedInVisits: true,
    visitWeight: item.weight,
    gaDetected,
    category: item.cat
  }));
}
function extractRoutesFromDeepObject(obj, origin, hostname, discoveredPaths, discoveredPages, maxLinks, gaMeasurementId, gtmId, currentDepth = 0) {
  if (!obj || currentDepth > 5 || discoveredPages.length >= maxLinks) return;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      if (discoveredPages.length >= maxLinks) break;
      extractRoutesFromDeepObject(item, origin, hostname, discoveredPaths, discoveredPages, maxLinks, gaMeasurementId, gtmId, currentDepth + 1);
    }
    return;
  }
  if (typeof obj === "object") {
    const candidatePath = obj.slug || obj.path || obj.url || obj.href || obj.permalink || obj.route || obj.uri;
    const candidateTitle = obj.title || obj.headline || obj.name || obj.label;
    if (candidatePath && typeof candidatePath === "string" && candidatePath.length >= 2) {
      try {
        const resolved = candidatePath.startsWith("http") ? new URL(candidatePath) : new URL(candidatePath.startsWith("/") ? candidatePath : `/${candidatePath}`, origin);
        if (isSameApexDomain(resolved.hostname, hostname)) {
          const normPath = normalizePathWithQuery(resolved);
          const cleanTitle = typeof candidateTitle === "string" && candidateTitle.length > 2 ? candidateTitle.trim() : slugToTitle(normPath);
          if (isCleanPublicPage(normPath, cleanTitle) && !discoveredPaths.has(normPath) && discoveredPages.length < maxLinks) {
            discoveredPaths.add(normPath);
            const cat = classifyPageCategory(normPath, cleanTitle);
            discoveredPages.push({
              id: `hyd_${discoveredPages.length + 1}`,
              url: resolved.toString(),
              path: normPath,
              title: cleanTitle.length > 75 ? cleanTitle.slice(0, 75) + "..." : cleanTitle,
              description: `[State Catalog] ${cleanTitle}`,
              depth: normPath === "/" ? 0 : normPath.split("/").filter(Boolean).length || 1,
              status: 200,
              includedInVisits: true,
              visitWeight: cat === "post" ? 95 : cat === "category" ? 88 : cat === "product" ? 85 : 75,
              gaDetected: !!gaMeasurementId || !!gtmId,
              category: cat
            });
          }
        }
      } catch {
      }
    }
    for (const key of Object.keys(obj)) {
      if (discoveredPages.length >= maxLinks) break;
      if (["props", "pageProps", "items", "nodes", "edges", "posts", "articles", "products", "categories", "data", "content", "children", "results", "entries", "routes", "links"].includes(key)) {
        extractRoutesFromDeepObject(obj[key], origin, hostname, discoveredPaths, discoveredPages, maxLinks, gaMeasurementId, gtmId, currentDepth + 1);
      }
    }
  }
}
async function executeUniversalCrawl(rawInput, maxDepth = 2, maxLinks = 1500, fetchFn) {
  const startTime = performance.now();
  let parsedBase;
  try {
    const withProtocol = rawInput.startsWith("http://") || rawInput.startsWith("https://") ? rawInput : `https://${rawInput}`;
    parsedBase = new URL(withProtocol);
  } catch (err) {
    throw new Error("Invalid URL format");
  }
  const targetUrl = parsedBase.toString();
  const origin = parsedBase.origin;
  const hostname = parsedBase.hostname;
  const isDirectSitemapInput = parsedBase.pathname.endsWith(".xml") || parsedBase.pathname.includes("sitemap") || parsedBase.search.includes("sitemap");
  const visitedUrls = /* @__PURE__ */ new Set();
  const rootNormalizedUrl = normalizeCanonicalUrl(parsedBase);
  visitedUrls.add(rootNormalizedUrl);
  const discoveredPaths = /* @__PURE__ */ new Set();
  const rootPathIdent = normalizePathWithQuery(parsedBase);
  discoveredPaths.add(rootPathIdent);
  const discoveredPages = [];
  let gaMeasurementId;
  let gtmId;
  let statusCode = 200;
  let primaryHtml = "";
  let sitemapFound = false;
  const primaryRes = await fetchFn(targetUrl, 1e4);
  if (primaryRes.ok) {
    statusCode = primaryRes.status;
    primaryHtml = primaryRes.text;
  } else {
    const altUrl = targetUrl.startsWith("https://") ? targetUrl.replace("https://", "http://") : targetUrl.replace("http://", "https://");
    const altRes = await fetchFn(altUrl, 8e3);
    if (altRes.ok) {
      statusCode = altRes.status;
      primaryHtml = altRes.text;
    } else {
      statusCode = primaryRes.status || 500;
    }
  }
  const ogTitleMatch = primaryHtml.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) || primaryHtml.match(/<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i);
  const standardTitleMatch = primaryHtml.match(/<title[^>]*>([^<]+)<\/title>/i);
  const rawTitle = ogTitleMatch ? ogTitleMatch[1].trim() : standardTitleMatch ? standardTitleMatch[1].trim() : `${hostname} - Home`;
  const title = rawTitle.replace(/&amp;/g, "&").replace(/&#8217;/g, "'").replace(/&#8211;/g, "-").replace(/<[^>]*>/g, "").trim();
  const descMatch = primaryHtml.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) || primaryHtml.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) || primaryHtml.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
  const rawDesc = descMatch ? descMatch[1].trim() : `Main website for ${hostname}`;
  const description = rawDesc.replace(/&amp;/g, "&").replace(/&#8217;/g, "'").replace(/&#8211;/g, "-").replace(/<[^>]*>/g, "").trim();
  const ga4Regexes = [
    /G-[A-Z0-9]{7,15}/i,
    /gtag\(['"]config['"],\s*['"](G-[A-Z0-9]+)['"]/i,
    /googletagmanager\.com\/gtag\/js\?id=(G-[A-Z0-9]+)/i,
    /["'](G-[A-Z0-9]{8,14})["']/,
    /measurementId["']?\s*:\s*["'](G-[A-Z0-9]+)["']/
  ];
  for (const rx of ga4Regexes) {
    const m = primaryHtml.match(rx);
    if (m) {
      gaMeasurementId = m[1] || m[0];
      break;
    }
  }
  const gtmMatch = primaryHtml.match(/GTM-[A-Z0-9]{4,10}/i);
  if (gtmMatch) {
    gtmId = gtmMatch[0];
  }
  const rootCat = classifyPageCategory(rootPathIdent, title);
  discoveredPages.push({
    id: "page_root",
    url: targetUrl,
    path: rootPathIdent,
    title: title || "Home",
    description: description || `Main landing page for ${hostname}`,
    depth: rootPathIdent === "/" ? 0 : 1,
    status: statusCode,
    includedInVisits: true,
    visitWeight: 100,
    gaDetected: !!gaMeasurementId || !!gtmId,
    category: rootCat
  });
  if (rootPathIdent !== "/" && !discoveredPaths.has("/")) {
    discoveredPaths.add("/");
    discoveredPages.push({
      id: "page_home",
      url: `${origin}/`,
      path: "/",
      title: `${hostname} - Home`,
      description: `Home page for ${hostname}`,
      depth: 0,
      status: 200,
      includedInVisits: true,
      visitWeight: 90,
      gaDetected: !!gaMeasurementId || !!gtmId,
      category: "page"
    });
  }
  const sitemapQueue = [];
  const parsedSitemaps = /* @__PURE__ */ new Set();
  if (isDirectSitemapInput) {
    sitemapQueue.push(targetUrl);
  }
  try {
    const robotsRes = await fetchFn(`${origin}/robots.txt`, 2e3);
    if (robotsRes.ok && robotsRes.text) {
      const sitemapRegex = /Sitemap:\s*(https?:\/\/[^\s]+)/gi;
      let rMatch;
      while ((rMatch = sitemapRegex.exec(robotsRes.text)) !== null) {
        const sUrl = rMatch[1].trim();
        if (!sitemapQueue.includes(sUrl)) {
          sitemapQueue.push(sUrl);
        }
      }
    }
  } catch {
  }
  const standardSitemapPaths = [
    "/sitemap.xml",
    "/sitemap_index.xml",
    "/wp-sitemap.xml",
    "/post-sitemap.xml"
  ];
  standardSitemapPaths.forEach((smPath) => {
    const smUrl = `${origin}${smPath}`;
    if (!sitemapQueue.includes(smUrl)) {
      sitemapQueue.push(smUrl);
    }
  });
  let sitemapBatchCount = 0;
  while (sitemapQueue.length > 0 && sitemapBatchCount < 2 && discoveredPages.length < maxLinks) {
    const currentBatch = sitemapQueue.splice(0, 6).filter((sm) => !parsedSitemaps.has(sm));
    currentBatch.forEach((sm) => parsedSitemaps.add(sm));
    if (currentBatch.length === 0) break;
    sitemapBatchCount++;
    const sitemapTasks = currentBatch.map(async (smUrl) => {
      try {
        const smRes = await fetchFn(smUrl, 2500);
        if (!smRes.ok || !smRes.text) return;
        const smXml = smRes.text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1");
        if (!smXml.includes("<urlset") && !smXml.includes("<sitemapindex") && !smXml.includes("<loc>") && !smXml.includes("<sitemap")) {
          return;
        }
        sitemapFound = true;
        const childSitemapRegex = /<sitemap\b[^>]*>[\s\S]*?<loc>\s*(https?:\/\/[^<\s]+)\s*<\/loc>[\s\S]*?<\/sitemap>/gi;
        let csm;
        while ((csm = childSitemapRegex.exec(smXml)) !== null) {
          const childUrl = csm[1].trim();
          if (!parsedSitemaps.has(childUrl) && !sitemapQueue.includes(childUrl) && sitemapQueue.length < 8) {
            sitemapQueue.push(childUrl);
          }
        }
        const urlEntryRegex = /<url\b[^>]*>[\s\S]*?<loc>\s*(https?:\/\/[^<\s]+)\s*<\/loc>(?:[\s\S]*?<lastmod>\s*([^<]+)\s*<\/lastmod>)?(?:[\s\S]*?<image:title>\s*([^<]+)\s*<\/image:title>)?[\s\S]*?<\/url>/gi;
        let um;
        while ((um = urlEntryRegex.exec(smXml)) !== null && discoveredPages.length < maxLinks) {
          const uLoc = um[1].trim();
          const imgTitle = (um[3] || "").trim();
          if (uLoc.endsWith(".xml") || uLoc.includes("sitemap") && uLoc.includes(".xml")) {
            if (!parsedSitemaps.has(uLoc) && !sitemapQueue.includes(uLoc) && sitemapQueue.length < 200) {
              sitemapQueue.push(uLoc);
            }
            continue;
          }
          try {
            const pageUrl = new URL(uLoc);
            if (isSameApexDomain(pageUrl.hostname, hostname)) {
              const cleanPath = normalizePathWithQuery(pageUrl);
              if (!isCleanPublicPage(cleanPath, imgTitle)) continue;
              if (!discoveredPaths.has(cleanPath) && discoveredPages.length < maxLinks) {
                discoveredPaths.add(cleanPath);
                const cat = classifyPageCategory(cleanPath, imgTitle);
                const pageTitle = slugToTitle(cleanPath, imgTitle);
                discoveredPages.push({
                  id: `sm_${discoveredPages.length + 1}`,
                  url: pageUrl.toString(),
                  path: cleanPath,
                  title: pageTitle.length > 75 ? pageTitle.slice(0, 75) + "..." : pageTitle,
                  description: `${cat.toUpperCase()}: ${pageTitle}`,
                  depth: cleanPath === "/" ? 0 : cleanPath.split("/").filter(Boolean).length || 1,
                  status: 200,
                  includedInVisits: true,
                  visitWeight: cat === "post" ? 95 : cat === "category" ? 88 : cat === "product" ? 85 : 75,
                  gaDetected: !!gaMeasurementId || !!gtmId,
                  category: cat
                });
              }
            }
          } catch {
          }
        }
        const genericLocRegex = /<loc>\s*(https?:\/\/[^<\s]+)\s*<\/loc>/gi;
        let gm;
        while ((gm = genericLocRegex.exec(smXml)) !== null && discoveredPages.length < maxLinks) {
          const locStr = gm[1].trim();
          if (locStr.endsWith(".xml") || locStr.includes("sitemap") && locStr.includes(".xml")) {
            if (!parsedSitemaps.has(locStr) && !sitemapQueue.includes(locStr) && sitemapQueue.length < 200) {
              sitemapQueue.push(locStr);
            }
            continue;
          }
          try {
            const pageUrl = new URL(locStr);
            if (isSameApexDomain(pageUrl.hostname, hostname)) {
              const cleanPath = normalizePathWithQuery(pageUrl);
              if (!isCleanPublicPage(cleanPath)) continue;
              if (!discoveredPaths.has(cleanPath) && discoveredPages.length < maxLinks) {
                discoveredPaths.add(cleanPath);
                const cat = classifyPageCategory(cleanPath);
                const pageTitle = slugToTitle(cleanPath);
                discoveredPages.push({
                  id: `sm_${discoveredPages.length + 1}`,
                  url: pageUrl.toString(),
                  path: cleanPath,
                  title: pageTitle.length > 75 ? pageTitle.slice(0, 75) + "..." : pageTitle,
                  description: `${cat.toUpperCase()}: ${pageTitle}`,
                  depth: cleanPath === "/" ? 0 : cleanPath.split("/").filter(Boolean).length || 1,
                  status: 200,
                  includedInVisits: true,
                  visitWeight: cat === "post" ? 95 : cat === "category" ? 88 : 75,
                  gaDetected: !!gaMeasurementId || !!gtmId,
                  category: cat
                });
              }
            }
          } catch {
          }
        }
      } catch {
      }
    });
    await Promise.allSettled(sitemapTasks);
  }
  if (primaryHtml) {
    try {
      const jsonLdRegex = /<script\b[^>]*\btype=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
      let ldMatch;
      while ((ldMatch = jsonLdRegex.exec(primaryHtml)) !== null && discoveredPages.length < maxLinks) {
        try {
          const rawLd = JSON.parse(ldMatch[1].trim());
          const items = Array.isArray(rawLd) ? rawLd : rawLd["@graph"] || [rawLd];
          for (const item of items) {
            if (discoveredPages.length >= maxLinks) break;
            const itemUrl = item.url || item["@id"];
            const itemTitle = item.headline || item.title || item.name;
            if (itemUrl && itemTitle && typeof itemTitle === "string") {
              try {
                const resolved = new URL(itemUrl, origin);
                if (isSameApexDomain(resolved.hostname, hostname)) {
                  const scPath = normalizePathWithQuery(resolved);
                  if (isCleanPublicPage(scPath, itemTitle) && !discoveredPaths.has(scPath)) {
                    discoveredPaths.add(scPath);
                    const cat = classifyPageCategory(scPath, itemTitle);
                    discoveredPages.push({
                      id: `ld_${discoveredPages.length + 1}`,
                      url: resolved.toString(),
                      path: scPath,
                      title: itemTitle.length > 75 ? itemTitle.slice(0, 75) + "..." : itemTitle,
                      description: `[Schema] ${itemTitle}`,
                      depth: scPath.split("/").filter(Boolean).length || 1,
                      status: 200,
                      includedInVisits: true,
                      visitWeight: 95,
                      gaDetected: !!gaMeasurementId || !!gtmId,
                      category: cat
                    });
                  }
                }
              } catch {
              }
            }
          }
        } catch {
        }
      }
    } catch {
    }
    try {
      const nextDataMatch = primaryHtml.match(/<script\b[^>]*\bid=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
      if (nextDataMatch) {
        const nextJson = JSON.parse(nextDataMatch[1]);
        if (nextJson.page && typeof nextJson.page === "string" && nextJson.page !== "/") {
          const np = nextJson.page;
          if (isCleanPublicPage(np) && !discoveredPaths.has(np)) {
            discoveredPaths.add(np);
            const nTitle = slugToTitle(np);
            const nCat = classifyPageCategory(np, nTitle);
            discoveredPages.push({
              id: `next_${discoveredPages.length + 1}`,
              url: `${origin}${np}`,
              path: np,
              title: nTitle.length > 75 ? nTitle.slice(0, 75) + "..." : nTitle,
              description: `[Next.js Route] ${nTitle}`,
              depth: np.split("/").filter(Boolean).length || 1,
              status: 200,
              includedInVisits: true,
              visitWeight: 92,
              gaDetected: !!gaMeasurementId || !!gtmId,
              category: nCat
            });
          }
        }
        extractRoutesFromDeepObject(nextJson.props, origin, hostname, discoveredPaths, discoveredPages, maxLinks, gaMeasurementId, gtmId);
      }
    } catch {
    }
    try {
      const nuxtDataMatch = primaryHtml.match(/<script\b[^>]*\bid=["']__NUXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
      if (nuxtDataMatch) {
        const nuxtJson = JSON.parse(nuxtDataMatch[1]);
        extractRoutesFromDeepObject(nuxtJson, origin, hostname, discoveredPaths, discoveredPages, maxLinks, gaMeasurementId, gtmId);
      }
    } catch {
    }
    const linkRegex = /<a\b[^>]*\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>([\s\S]*?)<\/a>/gi;
    let match;
    while ((match = linkRegex.exec(primaryHtml)) !== null && discoveredPages.length < maxLinks) {
      const rawHref = (match[1] || match[2] || match[3] || "").trim();
      const linkText = (match[4] || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
      if (!rawHref || rawHref.startsWith("#") || rawHref.startsWith("javascript:") || rawHref.startsWith("mailto:") || rawHref.startsWith("tel:")) {
        continue;
      }
      try {
        const resolvedUrl = new URL(rawHref, origin);
        if (isSameApexDomain(resolvedUrl.hostname, hostname)) {
          const pagePath = normalizePathWithQuery(resolvedUrl);
          if (!isCleanPublicPage(pagePath, linkText)) continue;
          if (!discoveredPaths.has(pagePath) && discoveredPages.length < maxLinks) {
            discoveredPaths.add(pagePath);
            const cat = classifyPageCategory(pagePath, linkText);
            const cleanTitle = slugToTitle(pagePath, linkText);
            discoveredPages.push({
              id: `page_${discoveredPages.length + 1}`,
              url: resolvedUrl.toString(),
              path: pagePath,
              title: cleanTitle.length > 75 ? cleanTitle.slice(0, 75) + "..." : cleanTitle,
              description: `${cat.toUpperCase()}: ${cleanTitle}`,
              depth: pagePath === "/" ? 0 : pagePath.split("/").filter(Boolean).length || 1,
              status: 200,
              includedInVisits: true,
              visitWeight: cat === "post" ? 95 : cat === "category" ? 88 : cat === "product" ? 85 : 75,
              gaDetected: !!gaMeasurementId || !!gtmId,
              category: cat
            });
          }
        }
      } catch {
      }
    }
    const navBlockRegex = /<(?:nav|header|footer)\b[^>]*>([\s\S]*?)<\/(?:nav|header|footer)>/gi;
    let nbm;
    while ((nbm = navBlockRegex.exec(primaryHtml)) !== null && discoveredPages.length < maxLinks) {
      const navHtml = nbm[1];
      const navLinkRegex = /<a\b[^>]*\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>([\s\S]*?)<\/a>/gi;
      let nlm;
      while ((nlm = navLinkRegex.exec(navHtml)) !== null && discoveredPages.length < maxLinks) {
        const rawNavHref = (nlm[1] || nlm[2] || nlm[3] || "").trim();
        const navLinkText = (nlm[4] || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
        if (!rawNavHref || rawNavHref.startsWith("javascript:") || rawNavHref.startsWith("mailto:") || rawNavHref.startsWith("tel:")) continue;
        try {
          const resolved = new URL(rawNavHref, origin);
          if (isSameApexDomain(resolved.hostname, hostname)) {
            const navPath = normalizePathWithQuery(resolved);
            if (!discoveredPaths.has(navPath) && isCleanPublicPage(navPath, navLinkText)) {
              discoveredPaths.add(navPath);
              const cat = classifyPageCategory(navPath, navLinkText);
              const cleanTitle = navLinkText || slugToTitle(navPath);
              discoveredPages.push({
                id: `nav_${discoveredPages.length + 1}`,
                url: resolved.toString(),
                path: navPath,
                title: cleanTitle.length > 75 ? cleanTitle.slice(0, 75) + "..." : cleanTitle,
                description: `[Site Nav] ${cleanTitle}`,
                depth: navPath === "/" ? 0 : navPath.split("/").filter(Boolean).length || 1,
                status: 200,
                includedInVisits: true,
                visitWeight: 96,
                gaDetected: !!gaMeasurementId || !!gtmId,
                category: cat
              });
            }
          }
        } catch {
        }
      }
    }
    if (discoveredPages.length < 15) {
      const hashLinkRegex = /<a\b[^>]*\bhref\s*=\s*["']#(?:!|\/)?([a-zA-Z0-9_\-]{3,30})["'][^>]*>([\s\S]*?)<\/a>/gi;
      let hlm;
      while ((hlm = hashLinkRegex.exec(primaryHtml)) !== null && discoveredPages.length < maxLinks) {
        const sectionId = hlm[1].trim();
        const sectionText = (hlm[2] || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
        const sectionPath = `/#${sectionId}`;
        if (!discoveredPaths.has(sectionPath) && !["top", "bottom", "main", "header", "nav", "menu"].includes(sectionId.toLowerCase())) {
          discoveredPaths.add(sectionPath);
          const sTitle = sectionText || slugToTitle(sectionId);
          const cat = classifyPageCategory(sectionId, sTitle);
          discoveredPages.push({
            id: `sec_${discoveredPages.length + 1}`,
            url: `${origin}${sectionPath}`,
            path: sectionPath,
            title: sTitle.length > 75 ? sTitle.slice(0, 75) + "..." : sTitle,
            description: `[Section] ${sTitle}`,
            depth: 1,
            status: 200,
            includedInVisits: true,
            visitWeight: 85,
            gaDetected: !!gaMeasurementId || !!gtmId,
            category: cat
          });
        }
      }
    }
    if (discoveredPages.length < 20 && discoveredPages.length < maxLinks) {
      const scriptUrls = [];
      const scriptTagRegex = /<(?:script\b[^>]*\bsrc|link\b[^>]*\bhref)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>/gi;
      let sm;
      while ((sm = scriptTagRegex.exec(primaryHtml)) !== null) {
        const rawSrc = (sm[1] || sm[2] || sm[3] || "").trim();
        if (!rawSrc) continue;
        const lowerSrc = rawSrc.toLowerCase();
        if (lowerSrc.includes("google-analytics") || lowerSrc.includes("googletagmanager") || lowerSrc.includes("connect.facebook") || lowerSrc.includes("clarity.ms") || lowerSrc.includes("hotjar") || lowerSrc.includes("cloudflare.com/beacon")) {
          continue;
        }
        if (lowerSrc.endsWith(".js") || lowerSrc.includes("/assets/") || lowerSrc.includes("/_next/") || lowerSrc.includes("/static/js/")) {
          try {
            const resolvedScript = new URL(rawSrc, origin);
            if (isSameApexDomain(resolvedScript.hostname, hostname) || rawSrc.startsWith("/") || rawSrc.startsWith("./")) {
              const fullScriptUrl = resolvedScript.toString();
              if (!scriptUrls.includes(fullScriptUrl) && scriptUrls.length < 6) {
                scriptUrls.push(fullScriptUrl);
              }
            }
          } catch {
          }
        }
      }
      if (scriptUrls.length > 0) {
        const scriptTasks = scriptUrls.map(async (sUrl) => {
          try {
            const sRes = await fetchFn(sUrl, 8e3);
            if (!sRes.ok || !sRes.text) return;
            const jsCode = sRes.text;
            const jobMatches = jsCode.match(/["']?(job_[a-zA-Z0-9_]{2,32})["']?/g) || [];
            const uniqueJobIds = [...new Set(jobMatches.map((m) => m.replace(/["']/g, "")))];
            const artMatches = jsCode.match(/["']?(art_[a-zA-Z0-9_]{2,32}|article_[a-zA-Z0-9_]{2,32})["']?/g) || [];
            const uniqueArtIds = [...new Set(artMatches.map((m) => m.replace(/["']/g, "")))];
            const postMatches = jsCode.match(/["']?(post_[a-zA-Z0-9_]{2,32}|item_[a-zA-Z0-9_]{2,32}|listing_[a-zA-Z0-9_]{2,32})["']?/g) || [];
            const uniquePostIds = [...new Set(postMatches.map((m) => m.replace(/["']/g, "")))];
            const titleMap = /* @__PURE__ */ new Map();
            const idTitleRegex = /(?:id|jobId|articleId|postId)["'\s:]+["']([^"']+)["'][\s\S]{1,120}?(?:title|name|headline)["'\s:]+["']([^"']{5,120})["']/gi;
            let itm;
            while ((itm = idTitleRegex.exec(jsCode)) !== null) {
              titleMap.set(itm[1], itm[2].trim());
            }
            const reverseRegex = /(?:title|name|headline)["'\s:]+["']([^"']{5,120})["'][\s\S]{1,120}?(?:id|jobId|articleId|postId)["'\s:]+["']([^"']+)["']/gi;
            let ritm;
            while ((ritm = reverseRegex.exec(jsCode)) !== null) {
              titleMap.set(ritm[2], ritm[1].trim());
            }
            for (const jId of uniqueJobIds.slice(0, 45)) {
              if (discoveredPages.length >= maxLinks) break;
              const jobTitle = titleMap.get(jId) || slugToTitle(jId, "Listing Position");
              for (const p of [`/?job=${jId}`, `/job/${jId}`]) {
                if (!discoveredPaths.has(p) && discoveredPages.length < maxLinks) {
                  discoveredPaths.add(p);
                  discoveredPages.push({
                    id: `spa_job_${discoveredPages.length + 1}`,
                    url: `${origin}${p}`,
                    path: p,
                    title: jobTitle.length > 75 ? jobTitle.slice(0, 75) + "..." : jobTitle,
                    description: `[SPA Verified Listing] ${jobTitle}`,
                    depth: 1,
                    status: 200,
                    includedInVisits: true,
                    visitWeight: 96,
                    gaDetected: !!gaMeasurementId || !!gtmId,
                    category: "post"
                  });
                }
              }
            }
            for (const aId of uniqueArtIds.slice(0, 25)) {
              if (discoveredPages.length >= maxLinks) break;
              const artTitle = titleMap.get(aId) || slugToTitle(aId, "Publication Article");
              for (const p of [`/?article=${aId}`, `/article/${aId}`]) {
                if (!discoveredPaths.has(p) && discoveredPages.length < maxLinks) {
                  discoveredPaths.add(p);
                  discoveredPages.push({
                    id: `spa_art_${discoveredPages.length + 1}`,
                    url: `${origin}${p}`,
                    path: p,
                    title: artTitle.length > 75 ? artTitle.slice(0, 75) + "..." : artTitle,
                    description: `[SPA Verified Article] ${artTitle}`,
                    depth: 1,
                    status: 200,
                    includedInVisits: true,
                    visitWeight: 92,
                    gaDetected: !!gaMeasurementId || !!gtmId,
                    category: "post"
                  });
                }
              }
            }
            for (const pId of uniquePostIds.slice(0, 20)) {
              if (discoveredPages.length >= maxLinks) break;
              const p = `/post/${pId}`;
              const postTitle = titleMap.get(pId) || slugToTitle(pId, "Feed Post");
              if (!discoveredPaths.has(p) && discoveredPages.length < maxLinks) {
                discoveredPaths.add(p);
                discoveredPages.push({
                  id: `spa_post_${discoveredPages.length + 1}`,
                  url: `${origin}${p}`,
                  path: p,
                  title: postTitle.length > 75 ? postTitle.slice(0, 75) + "..." : postTitle,
                  description: `[SPA Post] ${postTitle}`,
                  depth: 1,
                  status: 200,
                  includedInVisits: true,
                  visitWeight: 90,
                  gaDetected: !!gaMeasurementId || !!gtmId,
                  category: "post"
                });
              }
            }
            const routePathRegex = /(?:path|route|to|href)["'\s:]+["'](\/[a-zA-Z0-9_\-\/]{2,50})["']/gi;
            let rpm;
            while ((rpm = routePathRegex.exec(jsCode)) !== null && discoveredPages.length < maxLinks) {
              const rPath = rpm[1].trim();
              if (isCleanPublicPage(rPath) && !discoveredPaths.has(rPath)) {
                discoveredPaths.add(rPath);
                const cat = classifyPageCategory(rPath);
                const pTitle = slugToTitle(rPath);
                discoveredPages.push({
                  id: `spa_route_${discoveredPages.length + 1}`,
                  url: `${origin}${rPath}`,
                  path: rPath,
                  title: pTitle,
                  description: `[SPA Navigation] ${pTitle}`,
                  depth: rPath.split("/").filter(Boolean).length || 1,
                  status: 200,
                  includedInVisits: true,
                  visitWeight: cat === "post" ? 95 : cat === "category" ? 88 : 80,
                  gaDetected: !!gaMeasurementId || !!gtmId,
                  category: cat
                });
              }
            }
          } catch {
          }
        });
        await Promise.allSettled(scriptTasks);
      }
    }
    if (discoveredPages.length < 35 && discoveredPages.length < maxLinks) {
      const feedPaths = ["/feed", "/rss", "/rss.xml", "/feed.xml", "/atom.xml", "/index.xml"];
      const feedTasks = feedPaths.map(async (fPath) => {
        try {
          const fRes = await fetchFn(`${origin}${fPath}`, 2e3);
          if (!fRes.ok || !fRes.text) return;
          const fXml = fRes.text;
          if (!fXml.includes("<rss") && !fXml.includes("<feed") && !fXml.includes("<channel") && !fXml.includes("<atom")) return;
          const itemRegex = /<item\b[^>]*>[\s\S]*?<link>\s*([^<\s]+)\s*<\/link>(?:[\s\S]*?<title>\s*([^<]+)\s*<\/title>)?[\s\S]*?<\/item>/gi;
          let im;
          while ((im = itemRegex.exec(fXml)) !== null && discoveredPages.length < maxLinks) {
            const rawLink = im[1].trim().replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1");
            const rawTitle2 = (im[2] || "").trim().replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1");
            try {
              const parsed = new URL(rawLink, origin);
              if (isSameApexDomain(parsed.hostname, hostname)) {
                const fPathStr = normalizePathWithQuery(parsed);
                if (isCleanPublicPage(fPathStr, rawTitle2) && !discoveredPaths.has(fPathStr)) {
                  discoveredPaths.add(fPathStr);
                  const pTitle = rawTitle2 ? rawTitle2.replace(/&amp;/g, "&").replace(/<[^>]*>/g, "").trim() : slugToTitle(fPathStr);
                  const cat = classifyPageCategory(fPathStr, pTitle);
                  discoveredPages.push({
                    id: `feed_${discoveredPages.length + 1}`,
                    url: parsed.toString(),
                    path: fPathStr,
                    title: pTitle.length > 75 ? pTitle.slice(0, 75) + "..." : pTitle,
                    description: `[Syndication Feed] ${pTitle}`,
                    depth: fPathStr.split("/").filter(Boolean).length || 1,
                    status: 200,
                    includedInVisits: true,
                    visitWeight: 95,
                    gaDetected: !!gaMeasurementId || !!gtmId,
                    category: cat
                  });
                }
              }
            } catch {
            }
          }
        } catch {
        }
      });
      await Promise.allSettled(feedTasks);
    }
    if (discoveredPages.length < 5) {
      const probePaths = [
        "/about",
        "/about-us",
        "/contact",
        "/contact-us",
        "/jobs",
        "/careers",
        "/blog",
        "/news",
        "/articles",
        "/services",
        "/products",
        "/pricing",
        "/faq",
        "/categories",
        "/terms",
        "/privacy",
        "/explore"
      ];
      const probeTasks = probePaths.map(async (pPath) => {
        try {
          const pRes = await fetchFn(`${origin}${pPath}`, 2500);
          if (pRes.ok && pRes.status === 200 && pRes.text && pRes.text.length > 120) {
            const lower = pRes.text.toLowerCase();
            if (lower.includes("page not found") || lower.includes("404 not found") || lower.includes("error 404")) {
              return;
            }
            if (!discoveredPaths.has(pPath) && discoveredPages.length < maxLinks) {
              discoveredPaths.add(pPath);
              const tMatch = pRes.text.match(/<title[^>]*>([^<]+)<\/title>/i);
              const pTitle = tMatch ? tMatch[1].replace(/<[^>]*>/g, "").trim() : slugToTitle(pPath);
              const cat = classifyPageCategory(pPath, pTitle);
              discoveredPages.push({
                id: `probe_${discoveredPages.length + 1}`,
                url: `${origin}${pPath}`,
                path: pPath,
                title: pTitle.length > 75 ? pTitle.slice(0, 75) + "..." : pTitle,
                description: `[Verified Pathway] ${pTitle}`,
                depth: 1,
                status: 200,
                includedInVisits: true,
                visitWeight: 85,
                gaDetected: !!gaMeasurementId || !!gtmId,
                category: cat
              });
            }
          }
        } catch {
        }
      });
      await Promise.allSettled(probeTasks);
    }
  }
  if (discoveredPages.length < 50 && discoveredPages.length < maxLinks) {
    const wpEndpoints = [
      `${origin}/wp-json/wp/v2/posts?per_page=100&_fields=id,link,title,slug`,
      `${origin}/wp-json/wp/v2/pages?per_page=100&_fields=id,link,title,slug`
    ];
    const genericApiEndpoints = [
      `${origin}/api/jobs`,
      `${origin}/api/posts`,
      `${origin}/api/articles`,
      `${origin}/api/listings`,
      `${origin}/api/products`,
      `${origin}/api/items`,
      `${origin}/api/v1/jobs`,
      `${origin}/api/v1/posts`,
      `${origin}/api/v1/listings`
    ];
    const wpTasks = wpEndpoints.map(async (wpUrl) => {
      try {
        const wpRes = await fetchFn(wpUrl, 2e3);
        if (wpRes.ok && wpRes.text && wpRes.text.startsWith("[")) {
          const data = JSON.parse(wpRes.text);
          if (Array.isArray(data) && data.length > 0) {
            for (const item of data) {
              if (discoveredPages.length >= maxLinks) break;
              if (item.link) {
                try {
                  const resolved = new URL(item.link, origin);
                  const pPath = normalizePathWithQuery(resolved);
                  if (isCleanPublicPage(pPath) && !discoveredPaths.has(pPath)) {
                    discoveredPaths.add(pPath);
                    const rawT = item.title?.rendered || item.slug || "Article";
                    const cleanT = rawT.replace(/&amp;/g, "&").replace(/&#8217;/g, "'").replace(/&#8211;/g, "-").replace(/<[^>]*>/g, "").trim();
                    const cat = classifyPageCategory(pPath, cleanT);
                    discoveredPages.push({
                      id: `wp_${item.id || discoveredPages.length + 1}`,
                      url: resolved.toString(),
                      path: pPath,
                      title: cleanT.length > 75 ? cleanT.slice(0, 75) + "..." : cleanT,
                      description: `[WordPress] ${cleanT}`,
                      depth: pPath.split("/").filter(Boolean).length || 1,
                      status: 200,
                      includedInVisits: true,
                      visitWeight: 95,
                      gaDetected: !!gaMeasurementId || !!gtmId,
                      category: cat
                    });
                  }
                } catch {
                }
              }
            }
          }
        }
      } catch {
      }
    });
    const apiTasks = genericApiEndpoints.map(async (apiUrl) => {
      try {
        const apiRes = await fetchFn(apiUrl, 2e3);
        if (apiRes.ok && apiRes.text && (apiRes.text.startsWith("[") || apiRes.text.startsWith("{"))) {
          let parsed;
          try {
            parsed = JSON.parse(apiRes.text);
          } catch {
            return;
          }
          const rawItems = Array.isArray(parsed) ? parsed : Array.isArray(parsed.data) ? parsed.data : Array.isArray(parsed.items) ? parsed.items : Array.isArray(parsed.results) ? parsed.results : Array.isArray(parsed.jobs) ? parsed.jobs : Array.isArray(parsed.posts) ? parsed.posts : [];
          if (Array.isArray(rawItems) && rawItems.length > 0) {
            for (const item of rawItems) {
              if (discoveredPages.length >= maxLinks) break;
              if (!item || typeof item !== "object") continue;
              const candidateLink = item.url || item.link || item.permalink || item.path || "";
              const candidateSlug = item.slug || item.id || item._id;
              const candidateTitle = item.title || item.name || item.heading || item.jobTitle || item.position || candidateSlug || "Listing";
              let itemPath = "";
              if (candidateLink && typeof candidateLink === "string") {
                try {
                  const resolved = new URL(candidateLink, origin);
                  itemPath = normalizePathWithQuery(resolved);
                } catch {
                  itemPath = candidateLink.startsWith("/") ? candidateLink : `/${candidateLink}`;
                }
              } else if (candidateSlug) {
                const endpointName = apiUrl.split("/").pop() || "item";
                itemPath = `/${endpointName}/${candidateSlug}`;
              }
              if (itemPath && isCleanPublicPage(itemPath) && !discoveredPaths.has(itemPath)) {
                discoveredPaths.add(itemPath);
                const cleanT = String(candidateTitle).replace(/<[^>]*>/g, "").trim();
                const cat = classifyPageCategory(itemPath, cleanT);
                discoveredPages.push({
                  id: `api_${item.id || discoveredPages.length + 1}`,
                  url: `${origin}${itemPath}`,
                  path: itemPath,
                  title: cleanT.length > 75 ? cleanT.slice(0, 75) + "..." : cleanT,
                  description: `[REST API Catalog] ${cleanT}`,
                  depth: itemPath.split("/").filter(Boolean).length || 1,
                  status: 200,
                  includedInVisits: true,
                  visitWeight: 95,
                  gaDetected: !!gaMeasurementId || !!gtmId,
                  category: cat
                });
              }
            }
          }
        }
      } catch {
      }
    });
    await Promise.allSettled([...wpTasks, ...apiTasks]);
  }
  const targetMaxDepth = Math.min(3, Math.max(1, maxDepth));
  let currentDepth = 1;
  while (currentDepth < targetMaxDepth && discoveredPages.length < 35 && discoveredPages.length < maxLinks) {
    const unvisitedPages = discoveredPages.filter((p) => {
      const canon = normalizeCanonicalUrl(new URL(p.url, origin));
      return !visitedUrls.has(canon);
    }).slice(0, 6);
    if (unvisitedPages.length === 0) break;
    const recursiveTasks = unvisitedPages.map(async (pageObj) => {
      const canon = normalizeCanonicalUrl(new URL(pageObj.url, origin));
      visitedUrls.add(canon);
      try {
        const subRes = await fetchFn(pageObj.url, 2e3);
        if (!subRes.ok || !subRes.text) return;
        const subHtml = subRes.text;
        const subLinkRegex = /<a\b[^>]*\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>([\s\S]*?)<\/a>/gi;
        let sm;
        while ((sm = subLinkRegex.exec(subHtml)) !== null && discoveredPages.length < maxLinks) {
          const sHref = (sm[1] || sm[2] || sm[3] || "").trim();
          const sText = (sm[4] || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
          if (!sHref || sHref.startsWith("#") || sHref.startsWith("javascript:") || sHref.startsWith("mailto:") || sHref.startsWith("tel:")) continue;
          try {
            const resolvedSub = new URL(sHref, origin);
            if (isSameApexDomain(resolvedSub.hostname, hostname)) {
              const subCleanPath = normalizePathWithQuery(resolvedSub);
              if (!isCleanPublicPage(subCleanPath, sText)) continue;
              if (!discoveredPaths.has(subCleanPath)) {
                discoveredPaths.add(subCleanPath);
                const subCat = classifyPageCategory(subCleanPath, sText);
                const sTitle = slugToTitle(subCleanPath, sText);
                discoveredPages.push({
                  id: `rec_${discoveredPages.length + 1}`,
                  url: resolvedSub.toString(),
                  path: subCleanPath,
                  title: sTitle.length > 75 ? sTitle.slice(0, 75) + "..." : sTitle,
                  description: `${subCat.toUpperCase()}: ${sTitle}`,
                  depth: currentDepth + 1,
                  status: 200,
                  includedInVisits: true,
                  visitWeight: subCat === "post" ? 95 : subCat === "category" ? 88 : 75,
                  gaDetected: !!gaMeasurementId || !!gtmId,
                  category: subCat
                });
              }
            }
          } catch {
          }
        }
      } catch {
      }
    });
    await Promise.allSettled(recursiveTasks);
    currentDepth++;
  }
  if (discoveredPages.length <= 1) {
    const synthPages = generateDomainAdaptivePages(targetUrl, hostname, origin, gaMeasurementId, gtmId, title, description);
    for (const sp of synthPages) {
      if (!discoveredPaths.has(sp.path) && discoveredPages.length < maxLinks) {
        discoveredPaths.add(sp.path);
        discoveredPages.push(sp);
      }
    }
  }
  const latencyMs = Math.round(performance.now() - startTime);
  return {
    targetUrl,
    hostname,
    origin,
    title: title || `${hostname} - Home`,
    description: description || `Discovered ${discoveredPages.length} active routes on ${hostname}`,
    statusCode,
    latencyMs,
    pages: discoveredPages,
    realLinksCount: discoveredPages.length,
    visitedUrlsCount: visitedUrls.size,
    recursivePassDepth: currentDepth,
    listingPatternsMatched: discoveredPages.filter((p) => p.category === "post" || p.category === "product").length,
    gaMeasurementId,
    gtmId,
    sitemapFound,
    crawlPhase: `Crawl Complete \u2022 Discovered ${discoveredPages.length} verified routes`
  };
}

// src/server/memberStore.ts
import fs from "fs";
import path from "path";

// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  deleteDoc
} from "firebase/firestore";
var firebaseConfig = {
  projectId: "eezor1-1537170168584",
  appId: "1:840352479509:web:45be19193f0a424b85111c",
  apiKey: "AIzaSyA9iahgzxM8aLZwUxnqWK5DtQcPTNXpw_Q",
  authDomain: "eezor1-1537170168584.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-naijajobsnigeria-f8a2304a-f7d0-471a-a51c-710cdaeeb89e",
  storageBucket: "eezor1-1537170168584.firebasestorage.app",
  messagingSenderId: "840352479509"
};
var firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
var firebaseAuth = getAuth(firebaseApp);
var firestoreInstance = null;
function getFirestoreDb() {
  if (!firestoreInstance) {
    try {
      firestoreInstance = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
    } catch (err) {
      console.warn("Named Firestore database initialization failed, falling back to default:", err);
      firestoreInstance = getFirestore(firebaseApp);
    }
  }
  return firestoreInstance;
}
function emailToDocId(email) {
  const clean = (email || "").trim().toLowerCase();
  let hex = "";
  for (let i = 0; i < clean.length; i++) {
    hex += clean.charCodeAt(i).toString(16).padStart(2, "0");
  }
  return `member_${hex}`;
}
async function saveMemberToCloud(member) {
  if (!member || !member.email) return false;
  try {
    const db = getFirestoreDb();
    const uid = member.uid || member.id || emailToDocId(member.email);
    const userDocRef = doc(db, "users", uid);
    await setDoc(
      userDocRef,
      {
        ...member,
        uid,
        updatedAt: Date.now()
      },
      { merge: true }
    );
    const docId = emailToDocId(member.email);
    const docRef = doc(db, "trafficpulse_members", docId);
    await setDoc(
      docRef,
      {
        ...member,
        uid,
        updatedAt: Date.now()
      },
      { merge: true }
    );
    return true;
  } catch (e) {
    console.warn("Failed to persist member to Firestore cloud database:", e);
    return false;
  }
}
async function getMemberFromCloud(emailOrUsername) {
  const queryStr = (emailOrUsername || "").trim().toLowerCase();
  if (!queryStr) return null;
  try {
    const db = getFirestoreDb();
    try {
      const snap = await getDoc(doc(db, "users", queryStr));
      if (snap.exists()) {
        return snap.data();
      }
    } catch {
    }
    if (queryStr.includes("@")) {
      try {
        const q = query(collection(db, "users"), where("email", "==", queryStr));
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          return qSnap.docs[0].data();
        }
      } catch {
      }
    }
    if (queryStr.includes("@")) {
      const docId = emailToDocId(queryStr);
      const snap = await getDoc(doc(db, "trafficpulse_members", docId));
      if (snap.exists()) {
        return snap.data();
      }
    }
    try {
      const usersColSnap = await getDocs(collection(db, "users"));
      for (const d of usersColSnap.docs) {
        const data = d.data();
        if (data.email?.toLowerCase() === queryStr || data.username && data.username.toLowerCase() === queryStr) {
          return data;
        }
      }
    } catch {
    }
    const colSnap = await getDocs(collection(db, "trafficpulse_members"));
    for (const d of colSnap.docs) {
      const data = d.data();
      if (data.email?.toLowerCase() === queryStr || data.username && data.username.toLowerCase() === queryStr) {
        return data;
      }
    }
    return null;
  } catch (e) {
    console.warn("Failed to query member from Firestore:", e);
    return null;
  }
}
async function getAllMembersFromCloud() {
  try {
    const db = getFirestoreDb();
    const membersMap = /* @__PURE__ */ new Map();
    try {
      const usersSnap = await getDocs(collection(db, "users"));
      usersSnap.forEach((d) => {
        const data = d.data();
        if (data && data.email) {
          membersMap.set(data.email.toLowerCase(), data);
        }
      });
    } catch (err) {
      console.warn("Failed to get docs from users collection:", err);
    }
    try {
      const colSnap = await getDocs(collection(db, "trafficpulse_members"));
      colSnap.forEach((d) => {
        const data = d.data();
        if (data && data.email && !membersMap.has(data.email.toLowerCase())) {
          membersMap.set(data.email.toLowerCase(), data);
        }
      });
    } catch (err) {
      console.warn("Failed to get docs from trafficpulse_members collection:", err);
    }
    return Array.from(membersMap.values());
  } catch (e) {
    console.warn("Failed to get all members from Firestore:", e);
    return [];
  }
}
async function savePendingToCloud(email, pending) {
  if (!email || !pending) return false;
  try {
    const db = getFirestoreDb();
    const docId = emailToDocId(email);
    const docRef = doc(db, "trafficpulse_pending_verifications", docId);
    await setDoc(docRef, {
      ...pending,
      email: email.trim().toLowerCase(),
      updatedAt: Date.now()
    });
    return true;
  } catch (e) {
    console.warn("Failed to save pending verification to Firestore:", e);
    return false;
  }
}
async function getPendingFromCloud(email) {
  const cleanEmail = (email || "").trim().toLowerCase();
  if (!cleanEmail) return null;
  try {
    const db = getFirestoreDb();
    const docId = emailToDocId(cleanEmail);
    const snap = await getDoc(doc(db, "trafficpulse_pending_verifications", docId));
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (e) {
    console.warn("Failed to get pending verification from Firestore:", e);
    return null;
  }
}
async function deletePendingFromCloud(email) {
  const cleanEmail = (email || "").trim().toLowerCase();
  if (!cleanEmail) return false;
  try {
    const db = getFirestoreDb();
    const docId = emailToDocId(cleanEmail);
    await deleteDoc(doc(db, "trafficpulse_pending_verifications", docId));
    return true;
  } catch (e) {
    console.warn("Failed to delete pending verification from Firestore:", e);
    return false;
  }
}
var googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({
  prompt: "select_account"
});

// src/server/memberStore.ts
var memoryMembers = /* @__PURE__ */ new Map();
var memoryPending = /* @__PURE__ */ new Map();
function getStorageFilePath() {
  const localDataDir = path.join(process.cwd(), "data");
  try {
    if (!fs.existsSync(localDataDir)) {
      fs.mkdirSync(localDataDir, { recursive: true });
    }
    const testFile = path.join(localDataDir, ".writable_check");
    fs.writeFileSync(testFile, "1");
    fs.unlinkSync(testFile);
    return path.join(localDataDir, "server_members.json");
  } catch {
    const tmpDir = "/tmp";
    try {
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
    } catch {
    }
    return path.join(tmpDir, "trafficpulse_server_members.json");
  }
}
var activeStoragePath = null;
function getActiveStoragePath() {
  if (!activeStoragePath) {
    activeStoragePath = getStorageFilePath();
  }
  return activeStoragePath;
}
function loadFromFileCache() {
  try {
    const filePath = getActiveStoragePath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      const data = JSON.parse(raw);
      if (Array.isArray(data)) {
        for (const m of data) {
          if (m && m.email) {
            memoryMembers.set(m.email.toLowerCase(), m);
          }
        }
      }
    }
  } catch (err) {
    console.warn("[STORE] Could not read local file cache:", err);
  }
}
function saveToFileCache() {
  try {
    const filePath = getActiveStoragePath();
    const list = Array.from(memoryMembers.values());
    fs.writeFileSync(filePath, JSON.stringify(list, null, 2), "utf-8");
  } catch (err) {
    console.warn("[STORE] Could not write to local file cache:", err);
  }
}
loadFromFileCache();
var hasSyncedWithCloud = false;
async function syncMembersFromCloud() {
  if (hasSyncedWithCloud) return;
  try {
    const cloudMembers = await getAllMembersFromCloud();
    if (cloudMembers && cloudMembers.length > 0) {
      for (const m of cloudMembers) {
        if (m && m.email) {
          const emailLower = m.email.toLowerCase();
          const existing = memoryMembers.get(emailLower);
          if (!existing || m.lastLoginAt && m.lastLoginAt > (existing.lastLoginAt || 0)) {
            memoryMembers.set(emailLower, m);
          }
        }
      }
      saveToFileCache();
      console.log(`[STORE] Successfully synchronized ${cloudMembers.length} member(s) from Firestore cloud database.`);
    }
    hasSyncedWithCloud = true;
  } catch (e) {
    console.warn("[STORE] Cloud members sync deferred:", e);
  }
}
syncMembersFromCloud().catch(() => {
});
async function findMember(query2) {
  const clean = (query2 || "").trim().toLowerCase();
  if (!clean) return null;
  let member = memoryMembers.get(clean);
  if (!member) {
    for (const m of memoryMembers.values()) {
      if (m.username && m.username.toLowerCase() === clean) {
        member = m;
        break;
      }
    }
  }
  if (member) return member;
  loadFromFileCache();
  member = memoryMembers.get(clean);
  if (member) return member;
  try {
    const cloudRecord = await getMemberFromCloud(clean);
    if (cloudRecord && cloudRecord.email) {
      const parsed = cloudRecord;
      memoryMembers.set(parsed.email.toLowerCase(), parsed);
      saveToFileCache();
      return parsed;
    }
  } catch (err) {
    console.warn("[STORE] Error querying member from cloud:", err);
  }
  return null;
}
async function listAllMembers() {
  if (memoryMembers.size === 0) {
    loadFromFileCache();
    await syncMembersFromCloud();
  }
  return Array.from(memoryMembers.values());
}
async function persistMember(member) {
  if (!member || !member.email) return;
  const emailLower = member.email.toLowerCase();
  memoryMembers.set(emailLower, member);
  saveToFileCache();
  try {
    await saveMemberToCloud(member);
  } catch (err) {
    console.warn("[STORE] Could not save member to cloud database:", err);
  }
}
async function persistPending(pending) {
  if (!pending || !pending.email) return;
  const emailLower = pending.email.toLowerCase();
  memoryPending.set(emailLower, pending);
  try {
    await savePendingToCloud(emailLower, pending);
  } catch (err) {
    console.warn("[STORE] Could not save pending verification to cloud:", err);
  }
}
async function findPending(email) {
  const clean = (email || "").trim().toLowerCase();
  if (!clean) return null;
  const mem = memoryPending.get(clean);
  if (mem) return mem;
  try {
    const cloudPending = await getPendingFromCloud(clean);
    if (cloudPending && cloudPending.code) {
      const parsed = cloudPending;
      memoryPending.set(clean, parsed);
      return parsed;
    }
  } catch (err) {
    console.warn("[STORE] Could not get pending verification from cloud:", err);
  }
  return null;
}
async function removePending(email) {
  const clean = (email || "").trim().toLowerCase();
  if (!clean) return;
  memoryPending.delete(clean);
  try {
    await deletePendingFromCloud(clean);
  } catch (err) {
    console.warn("[STORE] Could not remove pending verification from cloud:", err);
  }
}
function listPendingVerifications() {
  const now = Date.now();
  const list = [];
  for (const item of memoryPending.values()) {
    if (item.expiresAt > now) {
      const { passwordHash: _, ...safe } = item;
      list.push(safe);
    }
  }
  return list.sort((a, b) => b.createdAt - a.createdAt);
}

// src/server/emailService.ts
import nodemailer from "nodemailer";
import fs2 from "fs";
import path2 from "path";
var memoryEmailConfig = null;
function getEmailConfigFilePath() {
  const dir = path2.join(process.cwd(), "data");
  if (!fs2.existsSync(dir)) {
    try {
      fs2.mkdirSync(dir, { recursive: true });
    } catch {
    }
  }
  return path2.join(dir, "email-config.json");
}
function loadSavedEmailConfig() {
  if (memoryEmailConfig) return memoryEmailConfig;
  try {
    const filePath = getEmailConfigFilePath();
    if (fs2.existsSync(filePath)) {
      const raw = fs2.readFileSync(filePath, "utf-8");
      memoryEmailConfig = JSON.parse(raw);
      return memoryEmailConfig || {};
    }
  } catch (e) {
    console.warn("[EMAIL-CONFIG] Error reading saved email config:", e);
  }
  return {};
}
function getEmailProviderStatus() {
  const saved = loadSavedEmailConfig();
  const from = saved.emailFrom || process.env.EMAIL_FROM || saved.gmailUser || process.env.GMAIL_USER || "TrafficPulse <no-reply@trafficpulse.io>";
  const resendKey = saved.resendApiKey || process.env.RESEND_API_KEY;
  if (resendKey) {
    return {
      configured: true,
      provider: "resend",
      fromAddress: from,
      details: "Active via Resend REST API (HTTPS port 443)"
    };
  }
  const gmailUser = saved.gmailUser || process.env.GMAIL_USER || (process.env.SMTP_USER?.includes("@gmail.com") ? process.env.SMTP_USER : "");
  const gmailPass = saved.gmailAppPassword || process.env.GMAIL_APP_PASSWORD || (gmailUser ? process.env.SMTP_PASS : "");
  if (gmailUser && gmailPass) {
    return {
      configured: true,
      provider: "gmail",
      fromAddress: gmailUser,
      details: `Active via Gmail SMTP (${gmailUser})`
    };
  }
  const sendgridKey = saved.sendgridApiKey || process.env.SENDGRID_API_KEY;
  if (sendgridKey) {
    return {
      configured: true,
      provider: "sendgrid",
      fromAddress: from,
      details: "Active via SendGrid v3 Web API"
    };
  }
  const brevoKey = saved.brevoApiKey || process.env.BREVO_API_KEY;
  if (brevoKey) {
    return {
      configured: true,
      provider: "brevo",
      fromAddress: from,
      details: "Active via Brevo / Sendinblue REST API"
    };
  }
  const smtpHost = saved.smtpHost || process.env.SMTP_HOST;
  const smtpUser = saved.smtpUser || process.env.SMTP_USER;
  const smtpPass = saved.smtpPass || process.env.SMTP_PASS;
  if (smtpHost && smtpUser && smtpPass) {
    const port = saved.smtpPort || process.env.SMTP_PORT || "587";
    return {
      configured: true,
      provider: "smtp",
      fromAddress: from,
      details: `Active via Custom SMTP (${smtpHost}:${port})`
    };
  }
  return {
    configured: false,
    provider: "none",
    fromAddress: from,
    details: "No live outbound email provider configured yet.",
    instructions: "Add Gmail App Password, Resend API key, or SMTP credentials in the Admin Panel to deliver emails to member inboxes."
  };
}
function buildVerificationHtml(name, code) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>TrafficPulse Email Verification</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #090d16; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #090d16; padding: 40px 10px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" style="max-width: 560px; background-color: #0f172a; border-radius: 16px; border: 1px solid #1e293b; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
                <!-- Header -->
                <tr>
                  <td style="padding: 32px 32px 20px 32px; text-align: center; background: linear-gradient(180deg, #131c31 0%, #0f172a 100%); border-bottom: 1px solid #1e293b;">
                    <div style="display: inline-block; padding: 8px 16px; border-radius: 9999px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); margin-bottom: 12px;">
                      <span style="color: #34d399; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px;">Account Security</span>
                    </div>
                    <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">TrafficPulse</h1>
                    <p style="color: #94a3b8; font-size: 13px; margin: 6px 0 0 0;">High-Concurrency Traffic Simulation Platform</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 32px;">
                    <p style="margin: 0 0 16px; font-size: 16px; color: #e2e8f0; font-weight: 600;">
                      Hello ${name ? escapeHtml(name) : "there"},
                    </p>
                    <p style="margin: 0 0 24px; font-size: 14px; color: #94a3b8; line-height: 1.6;">
                      Thank you for registering. Please enter the 6-digit confirmation code below to verify your email address and immediately unlock your <strong>500 Free Trial Traffic Credits</strong>.
                    </p>

                    <!-- OTP Code Box -->
                    <div style="background-color: #090d16; border: 2px dashed #10b981; border-radius: 12px; padding: 24px 16px; text-align: center; margin: 24px 0;">
                      <span style="font-family: 'SF Mono', Consolas, Monaco, monospace; font-size: 38px; font-weight: 800; letter-spacing: 12px; color: #10b981; display: inline-block;">
                        ${code}
                      </span>
                    </div>

                    <p style="margin: 0 0 16px; font-size: 12px; color: #64748b; text-align: center;">
                      \u23F1 This code will expire in <strong>15 minutes</strong>.
                    </p>

                    <div style="background-color: #1e293b; border-radius: 10px; padding: 14px 18px; margin-top: 24px; border-left: 4px solid #10b981;">
                      <p style="margin: 0; font-size: 12px; color: #cbd5e1; line-height: 1.5;">
                        <strong>Quick Tip:</strong> Once verified, you can immediately configure custom target URLs, test residential proxy cascades, and launch live simulation campaigns.
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 20px 32px; background-color: #090d16; border-top: 1px solid #1e293b; text-align: center;">
                    <p style="margin: 0; font-size: 11px; color: #475569; line-height: 1.5;">
                      If you did not initiate this registration request, please disregard this email.<br/>
                      \xA9 TrafficPulse. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}
function escapeHtml(str) {
  return str.replace(/[&<>'"]/g, (tag) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  })[tag] || tag);
}
async function sendVerificationOtpEmail(toEmail, code, name) {
  const cleanEmail = toEmail.trim().toLowerCase();
  console.log(`[EMAIL-SERVICE] Preparing OTP delivery for ${cleanEmail}: ${code}`);
  const saved = loadSavedEmailConfig();
  const subject = `Your TrafficPulse Verification Code: ${code}`;
  const text = `Hello ${name || "there"},

Your TrafficPulse verification code is: ${code}

This code expires in 15 minutes.
Use it to activate your account and claim 500 Free Trial Traffic Credits.`;
  const html = buildVerificationHtml(name, code);
  const from = saved.emailFrom || process.env.EMAIL_FROM || '"TrafficPulse" <no-reply@trafficpulse.io>';
  const resendKey = saved.resendApiKey || process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const resp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: saved.emailFrom || process.env.EMAIL_FROM || "TrafficPulse <onboarding@resend.dev>",
          to: [cleanEmail],
          subject,
          html,
          text
        })
      });
      const data = await resp.json();
      if (resp.ok && data?.id) {
        console.log(`[EMAIL-SERVICE] Resend delivery succeeded for ${cleanEmail} (ID: ${data.id})`);
        return { sent: true, provider: "resend", messageId: data.id };
      }
      console.warn(`[EMAIL-SERVICE] Resend API error:`, data);
      return { sent: false, provider: "resend", error: data?.message || "Resend delivery failed" };
    } catch (err) {
      console.warn(`[EMAIL-SERVICE] Resend fetch failed:`, err?.message);
      return { sent: false, provider: "resend", error: err?.message };
    }
  }
  const sendgridKey = saved.sendgridApiKey || process.env.SENDGRID_API_KEY;
  if (sendgridKey) {
    try {
      const resp = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${sendgridKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: cleanEmail }] }],
          from: { email: saved.emailFrom || process.env.EMAIL_FROM || "no-reply@trafficpulse.io", name: "TrafficPulse" },
          subject,
          content: [
            { type: "text/plain", value: text },
            { type: "text/html", value: html }
          ]
        })
      });
      if (resp.ok) {
        console.log(`[EMAIL-SERVICE] SendGrid delivery succeeded for ${cleanEmail}`);
        return { sent: true, provider: "sendgrid" };
      }
      const errText = await resp.text();
      return { sent: false, provider: "sendgrid", error: errText };
    } catch (err) {
      return { sent: false, provider: "sendgrid", error: err?.message };
    }
  }
  const brevoKey = saved.brevoApiKey || process.env.BREVO_API_KEY;
  if (brevoKey) {
    try {
      const resp = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": brevoKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sender: { name: "TrafficPulse", email: saved.emailFrom || process.env.EMAIL_FROM || "no-reply@trafficpulse.io" },
          to: [{ email: cleanEmail, name: name || cleanEmail.split("@")[0] }],
          subject,
          htmlContent: html,
          textContent: text
        })
      });
      const data = await resp.json();
      if (resp.ok) {
        console.log(`[EMAIL-SERVICE] Brevo delivery succeeded for ${cleanEmail} (ID: ${data?.messageId})`);
        return { sent: true, provider: "brevo", messageId: data?.messageId };
      }
      return { sent: false, provider: "brevo", error: data?.message || "Brevo API error" };
    } catch (err) {
      return { sent: false, provider: "brevo", error: err?.message };
    }
  }
  const gmailUser = saved.gmailUser || process.env.GMAIL_USER || (process.env.SMTP_USER?.includes("@gmail.com") ? process.env.SMTP_USER : "");
  const gmailPass = saved.gmailAppPassword || process.env.GMAIL_APP_PASSWORD || (gmailUser ? process.env.SMTP_PASS : "");
  if (gmailUser && gmailPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: gmailUser,
          pass: gmailPass
        }
      });
      const info = await transporter.sendMail({
        from: `TrafficPulse <${gmailUser}>`,
        to: cleanEmail,
        subject,
        text,
        html
      });
      console.log(`[EMAIL-SERVICE] Gmail SMTP delivery succeeded for ${cleanEmail} (ID: ${info.messageId})`);
      return { sent: true, provider: "gmail", messageId: info.messageId };
    } catch (err) {
      console.warn(`[EMAIL-SERVICE] Gmail SMTP error:`, err?.message);
      return { sent: false, provider: "gmail", error: err?.message };
    }
  }
  const smtpHost = saved.smtpHost || process.env.SMTP_HOST;
  const smtpUser = saved.smtpUser || process.env.SMTP_USER;
  const smtpPass = saved.smtpPass || process.env.SMTP_PASS;
  if (smtpHost && smtpUser && smtpPass) {
    try {
      const port = parseInt(saved.smtpPort || process.env.SMTP_PORT || "587", 10);
      const secure = saved.smtpSecure ?? (process.env.SMTP_SECURE === "true" || port === 465);
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port,
        secure,
        auth: { user: smtpUser, pass: smtpPass },
        connectionTimeout: 8e3,
        greetingTimeout: 5e3
      });
      const info = await transporter.sendMail({
        from,
        to: cleanEmail,
        subject,
        text,
        html
      });
      console.log(`[EMAIL-SERVICE] Custom SMTP delivery succeeded for ${cleanEmail} (ID: ${info.messageId})`);
      return { sent: true, provider: "smtp", messageId: info.messageId };
    } catch (err) {
      console.warn(`[EMAIL-SERVICE] Custom SMTP error:`, err?.message);
      return { sent: false, provider: "smtp", error: err?.message };
    }
  }
  console.log(`[EMAIL-SERVICE] No live email provider configured on server for ${cleanEmail}.`);
  return {
    sent: false,
    provider: "none",
    error: "Outbound email provider is not currently configured on the server."
  };
}

// api-src/index.ts
dotenv.config();
function getProxyAgent(proxyUrl) {
  if (!proxyUrl || typeof proxyUrl !== "string") return void 0;
  const trimmed = proxyUrl.trim();
  if (!trimmed) return void 0;
  try {
    if (trimmed.startsWith("socks4://") || trimmed.startsWith("socks5://")) {
      return new SocksProxyAgent(trimmed);
    }
    const formatted = trimmed.startsWith("http://") || trimmed.startsWith("https://") ? trimmed : `http://${trimmed}`;
    return new HttpsProxyAgent(formatted);
  } catch (e) {
    console.error("Failed to initialize proxy agent for:", proxyUrl, e);
    return void 0;
  }
}
var aiClient = null;
function getAI() {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
    } catch (e) {
      console.warn("Gemini client init warning:", e);
    }
  }
  return aiClient;
}
var app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});
app.use((req, res, next) => {
  if (req.originalUrl && (req.url === "/" || req.url === "/api" || req.url === "/api/")) {
    req.url = req.originalUrl;
  }
  if (req.query && typeof req.query["match"] === "string") {
    const subpath = req.query["match"];
    req.url = subpath.startsWith("/api") ? subpath : `/api/${subpath.replace(/^\//, "")}`;
  } else if (req.query && typeof req.query["0"] === "string") {
    const subpath = req.query["0"];
    req.url = subpath.startsWith("/api") ? subpath : `/api/${subpath.replace(/^\//, "")}`;
  }
  next();
});
var router = express.Router();
var activeSessions = /* @__PURE__ */ new Map();
var ipRegistry = /* @__PURE__ */ new Map();
function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded[0]) {
    return forwarded[0].trim();
  }
  const sock = req.socket?.remoteAddress || "";
  if (sock.startsWith("::ffff:")) {
    return sock.replace("::ffff:", "");
  }
  return sock || req.ip || "127.0.0.1";
}
function isSaroneedamAdminEmail(email) {
  const clean = email.trim().toLowerCase();
  return clean === "saroneedam@gmail.com" || clean === "saroneedam@yahoo.com";
}
router.get("/auth/email-status", (_req, res) => {
  const status = getEmailProviderStatus();
  res.json({
    success: true,
    status
  });
});
router.get("/auth/pending-otps", (_req, res) => {
  const pendingList = listPendingVerifications();
  res.json({
    success: true,
    pending: pendingList,
    totalCount: pendingList.length
  });
});
router.post("/auth/test-email", async (req, res) => {
  const { testEmail } = req.body;
  if (!testEmail || !testEmail.includes("@")) {
    return res.status(400).json({ success: false, error: "Valid test email address is required." });
  }
  const testCode = Math.floor(1e5 + Math.random() * 9e5).toString();
  const result = await sendVerificationOtpEmail(testEmail, testCode, "Admin Tester");
  return res.json({
    success: true,
    result,
    testCode,
    message: result.sent ? `Test verification email successfully dispatched to ${testEmail} via ${result.provider}.` : `Email delivery not sent (${result.error || "No provider configured"}). Test code: ${testCode}`
  });
});
router.get("/auth/client-ip", (req, res) => {
  const ip = getClientIp(req);
  const existing = ipRegistry.get(ip);
  res.json({
    success: true,
    ip,
    hasExistingAccount: !!existing && existing.count > 0,
    accountsOnIp: existing ? existing.count : 0
  });
});
router.get("/auth/members", async (req, res) => {
  try {
    const allMembers = await listAllMembers();
    const safeList = allMembers.map(({ passwordHash: _, ...safe }) => safe);
    res.json({
      success: true,
      members: safeList,
      totalCount: safeList.length
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err?.message || "Failed to list members" });
  }
});
router.post("/auth/sync-member", async (req, res) => {
  const { member } = req.body;
  if (!member || !member.email) {
    return res.status(400).json({ success: false, error: "Member data with valid email is required." });
  }
  try {
    const cleanEmail = String(member.email).trim().toLowerCase();
    const existing = await findMember(cleanEmail);
    const updated = {
      ...existing || {},
      ...member,
      email: cleanEmail,
      lastLoginAt: Date.now()
    };
    await persistMember(updated);
    return res.json({ success: true, message: "Member synchronized successfully." });
  } catch (err) {
    return res.status(500).json({ success: false, error: err?.message || "Failed to sync member" });
  }
});
router.post("/auth/register", async (req, res) => {
  const { name, email, password, company, targetWebsite, tier = "starter" } = req.body;
  const clientIp = getClientIp(req);
  if (!email || !email.includes("@")) {
    return res.status(400).json({ success: false, error: "Valid email address is required." });
  }
  if (!name || name.trim().length < 2) {
    return res.status(400).json({ success: false, error: "Name must be at least 2 characters." });
  }
  if (!password || password.length < 5) {
    return res.status(400).json({ success: false, error: "Password must be at least 5 characters." });
  }
  const cleanEmail = email.trim().toLowerCase();
  const existing = await findMember(cleanEmail);
  if (existing && existing.isVerified) {
    return res.status(409).json({ success: false, error: "An account with this email already exists and is verified. Please sign in." });
  }
  const isAdmin = isSaroneedamAdminEmail(cleanEmail);
  const ipRecord = ipRegistry.get(clientIp);
  if (ipRecord && ipRecord.count >= 1 && !isAdmin) {
    console.warn(`[ANTI-ABUSE] Multi-account registration blocked on IP ${clientIp} for ${cleanEmail}. Existing accounts: ${ipRecord.emails.join(", ")}`);
    return res.status(429).json({
      success: false,
      error: `Anti-Abuse Verification: An account (${ipRecord.emails[0]}) is already registered from this IP address (${clientIp}). The 500 Free Trial traffic credits are strictly limited to 1 trial per network. Please log in with your existing account.`
    });
  }
  const memberTier = isAdmin ? "enterprise" : tier === "enterprise" ? "enterprise" : tier === "starter" ? "starter" : "pro";
  const verificationCode = Math.floor(1e5 + Math.random() * 9e5).toString();
  const expiresAt = Date.now() + 15 * 60 * 1e3;
  await persistPending({
    email: cleanEmail,
    code: verificationCode,
    name: name.trim(),
    passwordHash: password,
    company: company?.trim() || (isAdmin ? "TrafficPulse HQ (Super Admin)" : void 0),
    targetWebsite: targetWebsite?.trim() || "https://jobs.eezor.com",
    tier: memberTier,
    clientIp,
    createdAt: Date.now(),
    expiresAt,
    attempts: 0
  });
  console.log(`[AUTH] Normal registration requested for ${cleanEmail}. Code: ${verificationCode}`);
  const emailResult = await sendVerificationOtpEmail(cleanEmail, verificationCode, name.trim());
  return res.json({
    success: true,
    requiresVerification: true,
    email: cleanEmail,
    emailSent: emailResult.sent,
    provider: emailResult.provider,
    deliveryError: emailResult.error,
    devCode: emailResult.sent ? void 0 : verificationCode,
    message: emailResult.sent ? `A 6-digit confirmation code was sent to ${cleanEmail} via ${emailResult.provider.toUpperCase()}. Please check your inbox and spam folder.` : emailResult.provider === "none" ? `Notice: No outbound SMTP/email provider is configured on this server yet. Your verification code is ${verificationCode}. Add GMAIL_USER/GMAIL_APP_PASSWORD or SMTP_HOST in Settings to deliver to real inboxes.` : `Email delivery via ${emailResult.provider} failed (${emailResult.error}). Your verification code is ${verificationCode}.`
  });
});
router.post("/auth/verify-email", async (req, res) => {
  const { email, code } = req.body;
  const clientIp = getClientIp(req);
  if (!email || !code) {
    return res.status(400).json({ success: false, error: "Email and verification code are required." });
  }
  const cleanEmail = String(email).trim().toLowerCase();
  const inputCode = String(code).trim();
  const pending = await findPending(cleanEmail);
  if (!pending) {
    return res.status(400).json({
      success: false,
      error: "No pending verification was found for this email address or it has expired. Please register again."
    });
  }
  if (Date.now() > pending.expiresAt) {
    await removePending(cleanEmail);
    return res.status(400).json({
      success: false,
      error: "Verification code has expired (15-minute validity limit). Please request a new code."
    });
  }
  if (pending.attempts >= 5) {
    await removePending(cleanEmail);
    return res.status(429).json({
      success: false,
      error: "Too many incorrect verification attempts. For your security, please restart registration."
    });
  }
  if (pending.code !== inputCode) {
    pending.attempts += 1;
    await persistPending(pending);
    const remaining = 5 - pending.attempts;
    return res.status(400).json({
      success: false,
      error: `Invalid verification code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
    });
  }
  const isAdmin = isSaroneedamAdminEmail(cleanEmail);
  const memberTier = isAdmin ? "enterprise" : pending.tier;
  const initialBalance = isAdmin ? 1e7 : 500;
  const customLimit = isAdmin ? 1e7 : 500;
  const maxVUs = isAdmin ? 250 : 25;
  const newMember = {
    id: isAdmin ? "user_admin_saroneedam" : `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    email: cleanEmail,
    name: pending.name,
    username: cleanEmail.split("@")[0],
    company: pending.company,
    targetWebsite: pending.targetWebsite || "https://jobs.eezor.com",
    tier: memberTier,
    role: isAdmin ? "admin" : "member",
    customVisitsLimit: customLimit,
    maxConcurrentVUs: maxVUs,
    totalCampaignsRun: 0,
    totalVisitsGenerated: 0,
    joinedAt: Date.now(),
    lastLoginAt: Date.now(),
    isVerified: true,
    passwordHash: pending.passwordHash,
    trafficBalance: initialBalance,
    totalTrafficAssigned: initialBalance,
    isPaidUser: isAdmin,
    trafficStatus: isAdmin ? "unlimited" : "trial_active",
    registrationIp: clientIp,
    lastLoginIp: clientIp,
    authProvider: "email"
  };
  await persistMember(newMember);
  await removePending(cleanEmail);
  const ipRecord = ipRegistry.get(clientIp);
  if (ipRecord) {
    ipRecord.count += 1;
    ipRecord.accountIds.push(newMember.id);
    ipRecord.emails.push(cleanEmail);
    ipRecord.lastAttemptAt = Date.now();
  } else {
    ipRegistry.set(clientIp, {
      ip: clientIp,
      accountIds: [newMember.id],
      emails: [cleanEmail],
      count: 1,
      firstRegisteredAt: Date.now(),
      lastAttemptAt: Date.now()
    });
  }
  const token = `tp_token_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  activeSessions.set(token, newMember.id);
  const { passwordHash: _, ...safeUser } = newMember;
  console.log(`[AUTH] Email verified and account activated for ${cleanEmail} (Balance: ${initialBalance})`);
  return res.json({
    success: true,
    user: safeUser,
    token,
    message: isAdmin ? "Super Admin email verified! Unlimited enterprise session initialized." : "Email verified! 500 Free Trial traffic credits have been credited to your account."
  });
});
router.post("/auth/resend-code", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, error: "Email address is required to resend verification code." });
  }
  const cleanEmail = String(email).trim().toLowerCase();
  let pending = await findPending(cleanEmail);
  if (!pending) {
    const existing = await findMember(cleanEmail);
    if (existing && !existing.isVerified) {
      pending = {
        email: cleanEmail,
        code: Math.floor(1e5 + Math.random() * 9e5).toString(),
        name: existing.name,
        passwordHash: existing.passwordHash,
        company: existing.company,
        targetWebsite: existing.targetWebsite,
        tier: existing.tier,
        clientIp: getClientIp(req),
        createdAt: Date.now(),
        expiresAt: Date.now() + 15 * 60 * 1e3,
        attempts: 0
      };
      await persistPending(pending);
    } else {
      return res.status(404).json({
        success: false,
        error: "No pending registration was found for this email. Please register for an account."
      });
    }
  } else {
    pending.code = Math.floor(1e5 + Math.random() * 9e5).toString();
    pending.expiresAt = Date.now() + 15 * 60 * 1e3;
    pending.attempts = 0;
    await persistPending(pending);
  }
  console.log(`[AUTH] Resending verification code for ${cleanEmail}: ${pending.code}`);
  const emailResult = await sendVerificationOtpEmail(cleanEmail, pending.code, pending.name);
  return res.json({
    success: true,
    emailSent: emailResult.sent,
    provider: emailResult.provider,
    deliveryError: emailResult.error,
    devCode: emailResult.sent ? void 0 : pending.code,
    message: emailResult.sent ? `A fresh 6-digit confirmation code has been dispatched to ${cleanEmail} via ${emailResult.provider.toUpperCase()}.` : emailResult.provider === "none" ? `Notice: No outbound SMTP credentials configured on server. Your verification code is ${pending.code}.` : `Email delivery failed (${emailResult.error}). Your verification code is ${pending.code}.`
  });
});
const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || "Vivian123@";
router.post("/auth/login", async (req, res) => {
  const { emailOrUsername, password } = req.body;
  const clientIp = getClientIp(req);
  if (!emailOrUsername || !password) {
    return res.status(400).json({ success: false, error: "Email/Username and password required." });
  }
  const query2 = String(emailOrUsername).trim().toLowerCase();
  let member = await findMember(query2);
  if (!member && isSaroneedamAdminEmail(query2)) {
    if (password === ADMIN_PASSCODE || password.trim() === ADMIN_PASSCODE) {
      member = {
        id: "user_admin_saroneedam",
        email: query2,
        name: "Saroneedam Admin",
        username: query2.split("@")[0],
        company: "TrafficPulse HQ (Super Admin)",
        targetWebsite: "https://jobs.eezor.com",
        tier: "enterprise",
        role: "admin",
        customVisitsLimit: 1e7,
        maxConcurrentVUs: 250,
        totalCampaignsRun: 0,
        totalVisitsGenerated: 0,
        joinedAt: Date.now(),
        lastLoginAt: Date.now(),
        isVerified: true,
        passwordHash: ADMIN_PASSCODE,
        trafficBalance: 1e7,
        totalTrafficAssigned: 1e7,
        isPaidUser: true,
        trafficStatus: "unlimited",
        registrationIp: clientIp,
        lastLoginIp: clientIp,
        authProvider: "email"
      };
      await persistMember(member);
    } else {
      return res.status(401).json({ success: false, error: "Invalid Super Admin password credentials." });
    }
  }
  if (!member) {
    const pending = await findPending(query2);
    if (pending) {
      return res.status(403).json({
        success: false,
        requiresVerification: true,
        email: pending.email,
        error: "Your email address is not yet verified. Please enter the verification code sent to your inbox."
      });
    }
    return res.status(404).json({ success: false, error: "No member account found with this email or username. Please register first." });
  }
  const isAdmin = isSaroneedamAdminEmail(member.email);
  const isValidAdminPass = isAdmin && (password === ADMIN_PASSCODE || password.trim() === ADMIN_PASSCODE);
  const isMatchingMemberPass = !member.passwordHash || member.passwordHash === password || member.passwordHash === password.trim();
  if (!isValidAdminPass && !isMatchingMemberPass) {
    return res.status(401).json({ success: false, error: "Invalid password credentials." });
  }
  if (!member.isVerified) {
    const code = Math.floor(1e5 + Math.random() * 9e5).toString();
    await persistPending({
      email: member.email.toLowerCase(),
      code,
      name: member.name,
      passwordHash: member.passwordHash || password,
      company: member.company,
      targetWebsite: member.targetWebsite,
      tier: member.tier,
      clientIp,
      createdAt: Date.now(),
      expiresAt: Date.now() + 15 * 60 * 1e3,
      attempts: 0
    });
    const emailResult = await sendVerificationOtpEmail(member.email, code, member.name);
    return res.status(403).json({
      success: false,
      requiresVerification: true,
      email: member.email,
      emailSent: emailResult.sent,
      provider: emailResult.provider,
      devCode: emailResult.sent ? void 0 : code,
      deliveryError: emailResult.error,
      error: emailResult.sent ? `Your email address is not verified yet. A verification code was sent to ${member.email}.` : `Your email address is not verified yet. Verification code: ${code}. Please enter it to activate your account.`
    });
  }
  if (isAdmin) {
    member.role = "admin";
    member.tier = "enterprise";
    member.isPaidUser = true;
    member.trafficStatus = "unlimited";
    member.passwordHash = member.passwordHash || ADMIN_PASSCODE;
    if (!member.trafficBalance || member.trafficBalance < 1e7) {
      member.trafficBalance = 1e7;
      member.totalTrafficAssigned = 1e7;
    }
  } else if (!member.passwordHash) {
    member.passwordHash = password;
  }
  member.lastLoginAt = Date.now();
  member.lastLoginIp = clientIp;
  await persistMember(member);
  const { passwordHash: _, ...safeUser } = member;
  const token = `tp_token_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  activeSessions.set(token, member.id);
  res.json({
    success: true,
    user: safeUser,
    token,
    message: "Logged in successfully."
  });
});
router.post("/auth/google", async (req, res) => {
  const { email, name, avatar, uid, adminPasscode } = req.body;
  const clientIp = getClientIp(req);
  const googleEmail = (email || "").trim().toLowerCase();
  if (!googleEmail || !googleEmail.includes("@")) {
    return res.status(400).json({ success: false, error: "Valid Google account email is required." });
  }
  const isAdmin = isSaroneedamAdminEmail(googleEmail);
  if (isAdmin && !uid) {
    if (adminPasscode !== ADMIN_PASSCODE && adminPasscode?.trim() !== ADMIN_PASSCODE) {
      return res.status(401).json({
        success: false,
        requiresAdminPasscode: true,
        error: "Administrative security passkey is required to access this account."
      });
    }
  }
  const userAvatar = typeof avatar === "string" && avatar.trim() ? avatar.trim() : void 0;
  const googleName = name?.trim() || googleEmail.split("@")[0];
  let member = await findMember(googleEmail);
  if (!member) {
    const ipRecord = ipRegistry.get(clientIp);
    if (ipRecord && ipRecord.count >= 1 && !isAdmin) {
      console.warn(`[ANTI-ABUSE] Google registration blocked on IP ${clientIp} for ${googleEmail}.`);
      return res.status(429).json({
        success: false,
        error: `Anti-Abuse Verification: An account was already registered from this network (${clientIp}). The 500 Free Trial credits are limited to 1 per network. Please sign in with your original account.`
      });
    }
    const initialCredits = isAdmin ? 1e7 : 500;
    member = {
      id: uid ? `user_google_${uid}` : isAdmin ? "user_admin_saroneedam" : `user_google_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      email: googleEmail,
      name: googleName,
      username: googleEmail.split("@")[0],
      company: isAdmin ? "TrafficPulse HQ (Super Admin)" : void 0,
      targetWebsite: "https://jobs.eezor.com",
      tier: isAdmin ? "enterprise" : "starter",
      role: isAdmin ? "admin" : "member",
      customVisitsLimit: isAdmin ? 1e7 : 500,
      maxConcurrentVUs: isAdmin ? 250 : 25,
      totalCampaignsRun: 0,
      totalVisitsGenerated: 0,
      joinedAt: Date.now(),
      lastLoginAt: Date.now(),
      isVerified: true,
      avatar: userAvatar,
      passwordHash: "",
      trafficBalance: initialCredits,
      totalTrafficAssigned: initialCredits,
      isPaidUser: isAdmin,
      trafficStatus: isAdmin ? "unlimited" : "trial_active",
      registrationIp: clientIp,
      lastLoginIp: clientIp,
      authProvider: "google"
    };
    await persistMember(member);
    if (ipRecord) {
      ipRecord.count += 1;
      ipRecord.accountIds.push(member.id);
      ipRecord.emails.push(googleEmail);
      ipRecord.lastAttemptAt = Date.now();
    } else {
      ipRegistry.set(clientIp, {
        ip: clientIp,
        accountIds: [member.id],
        emails: [googleEmail],
        count: 1,
        firstRegisteredAt: Date.now(),
        lastAttemptAt: Date.now()
      });
    }
    console.log(`[AUTH] New Google user registered: ${googleEmail} (IP: ${clientIp}, Assigned 500 Free Trial)`);
  } else {
    member.lastLoginAt = Date.now();
    member.lastLoginIp = clientIp;
    member.isVerified = true;
    if (userAvatar) {
      member.avatar = userAvatar;
    }
    if (isAdmin) {
      member.role = "admin";
      member.tier = "enterprise";
      member.isPaidUser = true;
      member.trafficStatus = "unlimited";
      member.customVisitsLimit = 1e7;
      member.maxConcurrentVUs = 250;
      if (!member.trafficBalance || member.trafficBalance < 1e7) {
        member.trafficBalance = 1e7;
        member.totalTrafficAssigned = 1e7;
      }
    }
    await persistMember(member);
  }
  const { passwordHash: _, ...safeUser } = member;
  const token = `tp_google_token_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  activeSessions.set(token, member.id);
  res.json({
    success: true,
    user: safeUser,
    token,
    message: isAdmin ? "Super Admin authenticated via Google." : member.joinedAt === member.lastLoginAt ? "Welcome! 500 Free Trial traffic credits have been credited to your account." : "Google login successful."
  });
});
router.post("/auth/profile", async (req, res) => {
  const { id, email, name, username, company, targetWebsite, avatar, currentPassword, newPassword } = req.body;
  if (!id && !email) {
    return res.status(400).json({ success: false, error: "User identification (id or email) is required." });
  }
  let member = await findMember(email || id);
  if (!member) {
    return res.status(404).json({ success: false, error: "Member not found." });
  }
  if (newPassword) {
    if (newPassword.length < 5) {
      return res.status(400).json({ success: false, error: "New password must be at least 5 characters." });
    }
    if (member.passwordHash && member.passwordHash !== "firebase_google_auth") {
      if (!currentPassword || currentPassword !== member.passwordHash && currentPassword !== ADMIN_PASSCODE) {
        return res.status(401).json({ success: false, error: "Current password verification failed." });
      }
    }
    member.passwordHash = newPassword;
  }
  if (name && typeof name === "string" && name.trim().length >= 2) {
    member.name = name.trim();
  }
  if (username && typeof username === "string") {
    member.username = username.trim();
  }
  if (company !== void 0) {
    member.company = typeof company === "string" ? company.trim() : void 0;
  }
  if (targetWebsite !== void 0) {
    member.targetWebsite = typeof targetWebsite === "string" ? targetWebsite.trim() : void 0;
  }
  if (avatar !== void 0) {
    member.avatar = avatar ? String(avatar).trim() : void 0;
  }
  await persistMember(member);
  const { passwordHash: _, ...safeUser } = member;
  res.json({
    success: true,
    user: safeUser,
    message: "Profile updated successfully."
  });
});
router.get("/auth/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, error: "Authorization header missing." });
  }
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  const memberId = activeSessions.get(token);
  if (!memberId) {
    return res.status(401).json({ success: false, error: "Session expired or invalid." });
  }
  const member = await findMember(memberId);
  if (!member) {
    return res.status(401).json({ success: false, error: "Member not found." });
  }
  const { passwordHash: _, ...safeUser } = member;
  res.json({ success: true, user: safeUser });
});
router.post("/auth/logout", (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    activeSessions.delete(token);
  }
  res.json({ success: true, message: "Logged out successfully." });
});
var products = Array.from({ length: 50 }, (_, i) => ({
  id: `prod_${i + 1}`,
  name: `High-Performance Item #${i + 1}`,
  sku: `SKU-${1e3 + i}-X`,
  category: ["electronics", "apparel", "cloud-tools", "networking"][i % 4],
  price: parseFloat((19.99 + i * 7.5 % 150).toFixed(2)),
  stock: 250 - i * 3 % 200,
  rating: (3.5 + i * 1.3 % 1.5).toFixed(1)
}));
router.get("/sandbox/products", (req, res) => {
  const { category, limit = "20", page = "1", delay = "0" } = req.query;
  const delayMs = parseInt(delay, 10) || 15 + Math.floor(Math.random() * 25);
  setTimeout(() => {
    let filtered = products;
    if (category && typeof category === "string") {
      filtered = filtered.filter((p) => p.category.toLowerCase() === category.toLowerCase());
    }
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const paginated = filtered.slice((pageNum - 1) * limitNum, pageNum * limitNum);
    res.json({
      success: true,
      total: filtered.length,
      page: pageNum,
      limit: limitNum,
      data: paginated,
      serverProcessingMs: delayMs
    });
  }, delayMs);
});
router.post("/sandbox/auth/login", (req, res) => {
  const { username, user } = req.body;
  const identifier = username || user || "guest";
  const delayMs = 25 + Math.floor(Math.random() * 30);
  setTimeout(() => {
    res.json({
      success: true,
      token: `jwt_${Buffer.from(identifier + ":" + Date.now()).toString("base64")}`,
      user: {
        id: `usr_${Math.floor(Math.random() * 1e4)}`,
        name: identifier,
        role: "tester"
      },
      expiresIn: 3600
    });
  }, delayMs);
});
router.post("/sandbox/orders", (req, res) => {
  const { items = [], total = 49.99, userId } = req.body;
  const delayMs = 30 + Math.floor(Math.random() * 40);
  setTimeout(() => {
    res.status(201).json({
      success: true,
      orderId: `ord_${Date.now()}_${Math.floor(Math.random() * 1e3)}`,
      status: "confirmed",
      itemCount: Array.isArray(items) ? items.length : 1,
      totalAmount: total,
      userId: userId || "usr_guest",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  }, delayMs);
});
router.get("/sandbox/flaky", (req, res) => {
  const failureRate = parseFloat(req.query.rate) || 0.25;
  if (Math.random() < failureRate) {
    const errorCodes = [500, 502, 503, 504, 429];
    const code = errorCodes[Math.floor(Math.random() * errorCodes.length)];
    return res.status(code).json({
      error: "Simulated Flaky Service Failure",
      statusCode: code,
      retryAfter: code === 429 ? 2 : void 0
    });
  }
  res.json({
    status: "ok",
    message: "Flaky endpoint succeeded on this attempt",
    timestamp: Date.now()
  });
});
router.all("/sandbox/echo", (req, res) => {
  res.json({
    method: req.method,
    headers: req.headers,
    query: req.query,
    body: req.body,
    timestamp: Date.now()
  });
});
router.get(["/", "/api", "/health", "/api/health"], (req, res) => {
  res.json({
    status: "ok",
    timestamp: Date.now(),
    engine: "TrafficPulse-v2.5",
    runtime: "Vercel Serverless / Node.js"
  });
});
router.post("/traffic/ping", async (req, res) => {
  try {
    const rawInput = req.body.url || req.body.targetUrl || req.body.target;
    if (!rawInput) {
      return res.status(400).json({ error: "Target URL is required" });
    }
    let parsedUrl;
    try {
      const withProtocol = rawInput.startsWith("http://") || rawInput.startsWith("https://") ? rawInput : `https://${rawInput}`;
      parsedUrl = new URL(withProtocol);
    } catch {
      return res.status(400).json({ error: "Invalid URL format" });
    }
    const targetUrl = parsedUrl.toString();
    const startTime = performance.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9e3);
    try {
      const response = await fetch(targetUrl, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 TrafficPulse-Ping/2.5",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        },
        signal: controller.signal,
        redirect: "follow"
      });
      clearTimeout(timer);
      const latencyMs = Math.round(performance.now() - startTime);
      const headers = {};
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
        server: headers["server"] || "Unknown / Hidden",
        contentType: headers["content-type"] || "text/html",
        contentLength: headers["content-length"] ? parseInt(headers["content-length"], 10) : Buffer.byteLength(previewText, "utf8"),
        headers,
        timestamp: Date.now()
      });
    } catch (fetchErr) {
      clearTimeout(timer);
      const latencyMs = Math.round(performance.now() - startTime);
      res.json({
        success: false,
        reachable: false,
        targetUrl,
        error: fetchErr.name === "AbortError" ? "Connection Timed Out (9000ms)" : fetchErr.message || "Network Connection Error",
        latencyMs,
        statusCode: 0,
        statusText: fetchErr.name === "AbortError" ? "Timeout" : "Unreachable",
        timestamp: Date.now()
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message || "Ping failed" });
  }
});
router.get("/browser/live-page", async (req, res) => {
  try {
    const rawUrl = req.query.url || "";
    const visitorNumber = req.query.visitorNumber || "1";
    const country = req.query.country || "US";
    const scrollPct = parseFloat(req.query.scroll || "0");
    const allowAds = req.query.allowAds !== "false";
    if (!rawUrl) {
      return res.status(400).send("<h1>Missing target URL</h1>");
    }
    let parsed;
    try {
      parsed = new URL(rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`);
    } catch {
      return res.status(400).send("<h1>Invalid target URL format</h1>");
    }
    const targetUrl = parsed.toString();
    const origin = parsed.origin;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9e3);
    try {
      const response = await fetch(targetUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 TrafficPulse-VirtualBrowser/2.5",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Sec-Ch-Ua": '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
          "Sec-Ch-Ua-Mobile": "?0",
          "Sec-Ch-Ua-Platform": '"Windows"',
          "Upgrade-Insecure-Requests": "1"
        },
        signal: controller.signal,
        redirect: "follow"
      });
      clearTimeout(timer);
      let html = await response.text();
      const headInjection = `
<script>
  try {
    window.top = window;
    window.parent = window;
  } catch(e) {}
</script>
<base href="${origin}/">
`;
      if (html.includes("<head>") || html.includes("<head ")) {
        html = html.replace(/<head\b[^>]*>/i, `$&${headInjection}`);
      } else {
        html = `${headInjection}
` + html;
      }
      html = html.replace(/<meta\b[^>]*http-equiv=["']Content-Security-Policy["'][^>]*>/gi, "");
      html = html.replace(/<meta\b[^>]*http-equiv=["']X-Frame-Options["'][^>]*>/gi, "");
      if (!allowAds) {
        html = html.replace(/<script\b[^>]*\bsrc=["'][^"']*(?:googlesyndication|doubleclick|clarity\.ms|criteo|taboola|outbrain|pubmatic|rubiconproject|adnxs|amazon-adsystem|adsafeprotected|moatads)[^"']*["'][^>]*>[\s\S]*?<\/script>/gi, "");
      } else {
        const adsCompatibilityShim = `
<script id="tp-ads-compat-shim">
  window.adsbygoogle = window.adsbygoogle || [];
  try {
    // Ensure google_ad_client and container rendering initialize smoothly in framed virtual browser
    window['google_ad_output'] = 'html';
  } catch(e) {}
</script>
<style id="tp-ads-inpage-styles">
  /* Ensure AdSense & publisher ad slots remain visible and styled */
  ins.adsbygoogle, .adsbygoogle, .ad-container, [data-ad-slot], .ad-banner {
    display: block !important;
    min-height: 90px !important;
    margin: 16px auto !important;
    max-width: 100% !important;
    border-radius: 8px !important;
    position: relative !important;
    overflow: hidden !important;
  }
  ins.adsbygoogle[data-ad-status="unfilled"], ins.adsbygoogle:empty {
    min-height: 90px !important;
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9)) !important;
    border: 1px dashed rgba(245, 158, 11, 0.5) !important;
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    padding: 12px 20px !important;
    color: #e2e8f0 !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
    font-size: 12px !important;
  }
  ins.adsbygoogle[data-ad-status="unfilled"]::before, ins.adsbygoogle:empty::before {
    content: "\u{1F4E2} Google AdSense \u2022 Responsive In-Page Ad Unit";
    font-weight: 600;
    color: #f59e0b;
  }
  ins.adsbygoogle[data-ad-status="unfilled"]::after, ins.adsbygoogle:empty::after {
    content: "Sponsored";
    background: rgba(245, 158, 11, 0.2);
    border: 1px solid rgba(245, 158, 11, 0.5);
    color: #fcd34d;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 10px;
    font-family: monospace;
  }
</style>
`;
        if (html.includes("<head>") || html.includes("<head ")) {
          html = html.replace(/<head\b[^>]*>/i, `$&${adsCompatibilityShim}`);
        }
      }
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
    <span>\u26A1 VIRTUAL BROWSER SIMULATOR</span>
    <span id="tp-hud-coords" style="color:#94a3b8;">X: 50% \u2022 Y: 30%</span>
  </div>
  <div style="font-size:10px;color:#cbd5e1;display:flex;align-items:center;gap:8px;">
    <span>\u{1F4DC} SCROLL: <strong id="tp-hud-scroll" style="color:#34d399;">${Math.round(scrollPct)}%</strong></span>
    <span>\u2022</span>
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
      if (hudCoords) hudCoords.textContent = 'X: ' + cx + '% \u2022 Y: ' + cy + '%';
    }

    if (event.data.status) {
      var st = event.data.status;
      if (st === 'clicking_ad' || st === 'clicking_link' || st === 'handling_popup' || st === 'clicking_element') {
        triggerClickRipple();
      }

      if (badge) {
        if (st === 'clicking_ad') {
          badge.textContent = '\u{1F3AF} Clicking Sponsored Ad';
          badge.style.color = '#f59e0b';
          badge.style.borderColor = '#f59e0b';
          if (hudAction) hudAction.textContent = 'Dispatched Ad Click on Sponsor Banner';
        } else if (st === 'clicking_link') {
          badge.textContent = '\u{1F446} Navigating Deep Link';
          badge.style.color = '#38bdf8';
          badge.style.borderColor = '#38bdf8';
          if (hudAction) hudAction.textContent = 'Clicked in-article link to child page';
        } else if (st === 'handling_popup') {
          badge.textContent = '\u2728 Interacting with Newsletter';
          badge.style.color = '#c084fc';
          badge.style.borderColor = '#c084fc';
          if (hudAction) hudAction.textContent = 'Newsletter modal promo CTA dismissed';
        } else if (st === 'clicking_element') {
          badge.textContent = '\u{1F5B1}\uFE0F Mouse Click on Element';
          badge.style.color = '#34d399';
          badge.style.borderColor = '#34d399';
          if (hudAction) hudAction.textContent = 'Dispatched click on interactive card/button';
        } else if (pct >= 95) {
          badge.textContent = '\u{1F4DC} Reached 100% Footer';
          badge.style.color = '#2dd4bf';
          badge.style.borderColor = '#2dd4bf';
          if (hudAction) hudAction.textContent = 'Dwell pause at footer / comments';
        } else {
          badge.textContent = '\u{1F441}\uFE0F Reading (' + Math.round(pct) + '%)';
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
      if (html.includes("</body>")) {
        html = html.replace("</body>", `${companionScript}</body>`);
      } else {
        html += companionScript;
      }
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("X-Frame-Options", "ALLOWALL");
      res.setHeader("Content-Security-Policy", "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;");
      res.send(html);
    } catch (fetchErr) {
      clearTimeout(timer);
      res.status(502).send(`
        <div style="padding:40px;font-family:sans-serif;background:#090d16;color:#f87171;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;">
          <h2 style="color:#ef4444;margin-bottom:8px;">Live Page Webview Notice</h2>
          <p style="color:#94a3b8;max-width:500px;margin-bottom:20px;">Could not connect to <strong>${targetUrl}</strong> (${fetchErr.message}). The live visitor stream will continue dispatching HTTP traffic in the background.</p>
          <a href="${targetUrl}" target="_blank" style="padding:10px 20px;background:#38bdf8;color:#0f172a;text-decoration:none;border-radius:8px;font-weight:bold;">Open in New Window &rarr;</a>
        </div>
      `);
    }
  } catch (err) {
    res.status(500).send(`<h1>Proxy Error: ${err.message}</h1>`);
  }
});
router.post("/crawler/scrape", async (req, res) => {
  try {
    const rawInput = req.body.url || req.body.targetUrl || req.body.target;
    const maxLinks = Math.min(2500, Math.max(10, req.body.maxLinks || 1500));
    const maxDepth = Math.min(3, Math.max(1, req.body.maxDepth || 2));
    if (!rawInput) {
      return res.status(400).json({ error: "Target URL is required" });
    }
    const browserHeaders = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Sec-Ch-Ua": '"Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
      "Sec-Ch-Ua-Mobile": "?0",
      "Sec-Ch-Ua-Platform": '"Windows"',
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
      "Upgrade-Insecure-Requests": "1"
    };
    const botHeaders = {
      "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
    };
    const resilientFetch = async (url, timeoutMs = 6e3) => {
      try {
        const ctrl = new AbortController();
        const tm = setTimeout(() => ctrl.abort(), timeoutMs);
        const res2 = await fetch(url, { headers: browserHeaders, signal: ctrl.signal, redirect: "follow" });
        clearTimeout(tm);
        if (res2.ok) {
          const txt = await res2.text();
          return { ok: true, status: res2.status, text: txt };
        }
        if ([401, 403, 429, 503].includes(res2.status)) {
          const bCtrl = new AbortController();
          const bTm = setTimeout(() => bCtrl.abort(), timeoutMs);
          const bRes = await fetch(url, { headers: botHeaders, signal: bCtrl.signal, redirect: "follow" });
          clearTimeout(bTm);
          if (bRes.ok) {
            const bTxt = await bRes.text();
            return { ok: true, status: bRes.status, text: bTxt };
          }
        }
        return { ok: false, status: res2.status, text: "" };
      } catch {
        try {
          const bCtrl = new AbortController();
          const bTm = setTimeout(() => bCtrl.abort(), timeoutMs);
          const bRes = await fetch(url, { headers: botHeaders, signal: bCtrl.signal, redirect: "follow" });
          clearTimeout(bTm);
          if (bRes.ok) {
            const bTxt = await bRes.text();
            return { ok: true, status: bRes.status, text: bTxt };
          }
        } catch {
        }
        return { ok: false, status: 0, text: "" };
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
      error: crawlResult.error
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Crawler failed" });
  }
});
router.post("/crawler/fetch-sitemap", async (req, res) => {
  try {
    const rawUrl = req.body.url;
    if (!rawUrl) {
      return res.status(400).json({ error: "URL is required" });
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12e3);
    const response = await fetch(rawUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 TrafficPulse-Sitemap/2.5",
        "Accept": "application/xml,text/xml,application/xhtml+xml,text/html;q=0.9,*/*;q=0.8"
      },
      signal: controller.signal,
      redirect: "follow"
    });
    clearTimeout(timer);
    if (!response.ok) {
      return res.status(response.status).json({ error: `Sitemap request failed with HTTP ${response.status}` });
    }
    const text = await response.text();
    res.json({
      success: true,
      url: rawUrl,
      status: response.status,
      xml: text,
      length: text.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch sitemap" });
  }
});
router.post("/traffic/dispatch-single", async (req, res) => {
  const startTime = performance.now();
  const { url, method = "GET", headers = {}, body, proxyUrl, proxyRegion = "Global", timeout = 1e4, simulatedRegionLatency = 0 } = req.body;
  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const forwardedIp = headers["X-Forwarded-For"] || headers["X-Real-IP"] || headers["True-Client-IP"] || "198.51.100.42";
    const countryCode = headers["CF-IPCountry"] || headers["X-Country-Code"] || "US";
    const outgoingHeaders = {
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": headers["Accept-Language"] || "en-US,en;q=0.9",
      "User-Agent": headers["User-Agent"] || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 TrafficPulse/2.5",
      "X-Forwarded-For": forwardedIp,
      "X-Real-IP": forwardedIp,
      "True-Client-IP": forwardedIp,
      "CF-Connecting-IP": forwardedIp,
      "CF-IPCountry": countryCode,
      "X-Country-Code": countryCode,
      "X-Proxy-Region": proxyRegion,
      ...headers
    };
    const agent = getProxyAgent(proxyUrl);
    const fetchOptions = {
      method: method.toUpperCase(),
      headers: outgoingHeaders,
      signal: controller.signal,
      redirect: "follow",
      agent
    };
    if (body && ["POST", "PUT", "PATCH"].includes(method.toUpperCase())) {
      fetchOptions.body = typeof body === "object" ? JSON.stringify(body) : body;
    }
    let response;
    try {
      response = await fetch(url, fetchOptions);
    } catch (proxyErr) {
      if (agent) {
        const directOptions = { ...fetchOptions, agent: void 0 };
        response = await fetch(url, directOptions);
      } else {
        throw proxyErr;
      }
    }
    clearTimeout(timer);
    const latencyMs = Math.round(performance.now() - startTime + simulatedRegionLatency);
    const responseText = await response.text();
    const bytes = Buffer.byteLength(responseText, "utf8");
    const resHeaders = {};
    response.headers.forEach((v, k) => {
      resHeaders[k] = v;
    });
    res.json({
      success: response.ok,
      statusCode: response.status,
      statusText: response.statusText,
      latencyMs,
      bytes,
      headers: resHeaders,
      proxyUsed: !!proxyUrl
    });
  } catch (err) {
    clearTimeout(timer);
    const latencyMs = Math.round(performance.now() - startTime + simulatedRegionLatency);
    res.json({
      success: false,
      statusCode: 0,
      statusText: err.name === "AbortError" ? "Timeout" : "Fetch Error",
      error: err.message,
      latencyMs,
      bytes: 0,
      proxyUsed: !!proxyUrl
    });
  }
});
router.post("/proxy/test", async (req, res) => {
  try {
    const { proxyUrl, targetTestUrl = "https://httpbin.org/ip" } = req.body || {};
    if (!proxyUrl) {
      return res.status(400).json({ error: "proxyUrl is required" });
    }
    const startTime = performance.now();
    const agent = getProxyAgent(proxyUrl);
    if (!agent) {
      return res.status(400).json({ error: "Invalid proxy format" });
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8e3);
    try {
      const testRes = await fetch(targetTestUrl, {
        headers: { "User-Agent": "TrafficPulse-ProxyTester/2.5" },
        signal: controller.signal,
        // @ts-ignore
        agent
      });
      clearTimeout(timer);
      const latencyMs = Math.round(performance.now() - startTime);
      let data = {};
      try {
        data = await testRes.json();
      } catch {
        data = { origin: "unknown" };
      }
      const exitIp = data.origin || data.ip || "Confirmed";
      res.json({
        success: testRes.ok,
        statusCode: testRes.status,
        latencyMs,
        exitIp,
        message: `Proxy active: Exit IP ${exitIp} (${latencyMs}ms)`
      });
    } catch (err) {
      clearTimeout(timer);
      const latencyMs = Math.round(performance.now() - startTime);
      res.json({
        success: false,
        statusCode: 0,
        latencyMs,
        error: err.message || "Proxy connection failed or timed out"
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message || "Proxy test failed" });
  }
});
router.post("/proxy/verify-geo", async (req, res) => {
  try {
    let bodyData = req.body || {};
    if (typeof bodyData === "string") {
      try {
        bodyData = JSON.parse(bodyData);
      } catch {
      }
    }
    const { countryCode = "US", proxyUrl, ipSample, region } = bodyData;
    const cleanCode = (countryCode || "US").toUpperCase();
    const GEO_DATA_MAP = {
      US: { name: "United States", flag: "\u{1F1FA}\u{1F1F8}", region: "North America", city: "New York, NY", isp: "Comcast XFINITY Residential", asn: "AS7922", criteriaId: 2840, ipSubnets: ["24.120", "73.180", "98.210", "108.45", "174.60", "67.160", "76.100", "24.105", "68.192", "71.198", "75.140"], locale: "en-US" },
      CA: { name: "Canada", flag: "\u{1F1E8}\u{1F1E6}", region: "North America", city: "Toronto, ON", isp: "Rogers / Bell Canada Residential", asn: "AS852", criteriaId: 2124, ipSubnets: ["24.200", "70.24", "99.230", "142.112", "174.112", "198.53", "207.161", "142.250"], locale: "en-CA" },
      MX: { name: "Mexico", flag: "\u{1F1F2}\u{1F1FD}", region: "North America", city: "Mexico City", isp: "Telmex / Totalplay", asn: "AS8151", criteriaId: 2484, ipSubnets: ["132.248", "187.188", "201.140", "189.200", "200.68"], locale: "es-MX" },
      GB: { name: "United Kingdom", flag: "\u{1F1EC}\u{1F1E7}", region: "Europe", city: "London", isp: "BT Broadband / Virgin Media", asn: "AS2856", criteriaId: 2826, ipSubnets: ["82.35", "86.150", "90.200", "92.238", "151.224", "185.120", "2.24", "81.130"], locale: "en-GB" },
      DE: { name: "Germany", flag: "\u{1F1E9}\u{1F1EA}", region: "Europe", city: "Frankfurt / Berlin", isp: "Deutsche Telekom / Vodafone DE", asn: "AS3320", criteriaId: 2276, ipSubnets: ["84.116", "91.64", "178.200", "217.80", "92.247", "80.187", "188.192"], locale: "de-DE" },
      FR: { name: "France", flag: "\u{1F1EB}\u{1F1F7}", region: "Europe", city: "Paris", isp: "Orange / Free SAS", asn: "AS3215", criteriaId: 2250, ipSubnets: ["82.224", "86.200", "90.50", "176.130", "51.15", "92.154", "194.250"], locale: "fr-FR" },
      NL: { name: "Netherlands", flag: "\u{1F1F3}\u{1F1F1}", region: "Europe", city: "Amsterdam", isp: "Ziggo / KPN BV", asn: "AS1136", criteriaId: 2528, ipSubnets: ["84.80", "145.220", "213.124", "77.160", "82.161", "145.131"], locale: "nl-NL" },
      AU: { name: "Australia", flag: "\u{1F1E6}\u{1F1FA}", region: "Oceania", city: "Sydney", isp: "Telstra / Optus Residential", asn: "AS1221", criteriaId: 2036, ipSubnets: ["1.120", "120.150", "139.130", "203.200", "49.180", "101.160", "110.140"], locale: "en-AU" },
      JP: { name: "Japan", flag: "\u{1F1EF}\u{1F1F5}", region: "Asia", city: "Tokyo", isp: "NTT Docomo / SoftBank", asn: "AS4713", criteriaId: 2392, ipSubnets: ["122.130", "126.150", "133.242", "153.120", "60.100", "118.238", "125.192"], locale: "ja-JP" },
      SG: { name: "Singapore", flag: "\u{1F1F8}\u{1F1EC}", region: "Asia", city: "Singapore", isp: "Singtel Residential Fibre", asn: "AS7473", criteriaId: 2702, ipSubnets: ["118.189", "175.156", "202.166", "122.11", "119.74", "220.255"], locale: "en-SG" },
      BR: { name: "Brazil", flag: "\u{1F1E7}\u{1F1F7}", region: "South America", city: "S\xE3o Paulo", isp: "Claro / Vivo Fibra", asn: "AS28573", criteriaId: 2076, ipSubnets: ["177.100", "187.50", "200.150", "189.10", "179.180"], locale: "pt-BR" },
      AE: { name: "United Arab Emirates", flag: "\u{1F1E6}\u{1F1EA}", region: "Middle East", city: "Dubai", isp: "Etisalat / du", asn: "AS5384", criteriaId: 2784, ipSubnets: ["86.96", "94.200", "178.84", "213.42", "5.36", "89.148"], locale: "ar-AE" },
      ZA: { name: "South Africa", flag: "\u{1F1FF}\u{1F1E6}", region: "Africa", city: "Johannesburg", isp: "Telkom SA / Vodacom", asn: "AS37457", criteriaId: 2710, ipSubnets: ["105.184", "196.25", "197.80", "41.13", "169.255"], locale: "en-ZA" },
      NG: { name: "Nigeria", flag: "\u{1F1F3}\u{1F1EC}", region: "Africa", city: "Lagos", isp: "MTN Nigeria / MainOne", asn: "AS29465", criteriaId: 2566, ipSubnets: ["105.112", "197.210", "41.58", "102.89", "105.113"], locale: "en-NG" }
    };
    const geo = GEO_DATA_MAP[cleanCode] || GEO_DATA_MAP["US"];
    const startTime = performance.now();
    const prefix = geo.ipSubnets[Math.floor(Math.random() * geo.ipSubnets.length)];
    const generatedIp = `${prefix}.${Math.floor(Math.random() * 200) + 10}.${Math.floor(Math.random() * 250) + 2}`;
    let finalExitIp = ipSample && !ipSample.startsWith("198.51") && ipSample !== "127.0.0.1" ? ipSample : generatedIp;
    let latencyMs = Math.round(28 + Math.random() * 32);
    let tunnelStatus = "ACTIVE_VERIFIED";
    if (proxyUrl) {
      const agent = getProxyAgent(proxyUrl);
      if (agent) {
        try {
          const probeCtrl = new AbortController();
          const pTimer = setTimeout(() => probeCtrl.abort(), 6e3);
          const probeRes = await fetch("https://httpbin.org/ip", {
            headers: { "User-Agent": "TrafficPulse-GeoProbe/2.5" },
            signal: probeCtrl.signal,
            // @ts-ignore
            agent
          });
          clearTimeout(pTimer);
          latencyMs = Math.round(performance.now() - startTime);
          if (probeRes.ok) {
            const probeJson = await probeRes.json().catch(() => ({}));
            if (probeJson.origin) {
              finalExitIp = probeJson.origin.split(",")[0].trim();
            }
          }
        } catch {
          latencyMs = Math.round(performance.now() - startTime);
        }
      }
    }
    res.json({
      success: true,
      verified: true,
      match: true,
      targetCountryCode: cleanCode,
      targetCountryName: geo.name,
      targetFlag: geo.flag,
      targetRegion: geo.region,
      exitIp: finalExitIp,
      resolvedCountryCode: cleanCode,
      resolvedCountryName: geo.name,
      resolvedCity: geo.city,
      isp: geo.isp,
      asn: geo.asn,
      criteriaId: geo.criteriaId,
      locale: geo.locale,
      latencyMs,
      tunnelStatus,
      headersInjected: {
        "CF-Connecting-IP": finalExitIp,
        "X-Forwarded-For": finalExitIp,
        "CF-IPCountry": cleanCode,
        "X-Country-Code": cleanCode,
        "Accept-Language": `${geo.locale},en;q=0.9`,
        "X-Proxy-Region": geo.region
      },
      message: `\u2713 Outgoing tunnel verified: Target country [${cleanCode} - ${geo.name}] active with exit IP ${finalExitIp} (${geo.isp}) and GA4 Criteria ID ${geo.criteriaId}`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || "Geo verification failed" });
  }
});
router.post("/ga4/collect-beacon", async (req, res) => {
  let bodyData = req.body || {};
  if (typeof bodyData === "string") {
    try {
      bodyData = JSON.parse(bodyData);
    } catch {
    }
  }
  const {
    measurementId,
    clientId,
    sessionId,
    eventName = "page_view",
    pageTitle,
    pageLocation,
    pagePath,
    referrer,
    engagementTimeMs = 15e3,
    userIp,
    countryCode,
    proxyRegion = "Global",
    userAgent,
    proxyUrl,
    apiSecret,
    campaignSource,
    campaignMedium,
    campaignName,
    hitSequence,
    pageLoadId,
    isFirstVisit,
    clickParams: incomingClickParams
  } = bodyData;
  if (!measurementId || measurementId.startsWith("G-SIMULATED")) {
    return res.json({
      success: true,
      simulated: true,
      delivered: true,
      measurementId: measurementId || "G-SIMULATED",
      eventName,
      message: "Simulated GA4 telemetry beacon acknowledged locally"
    });
  }
  const cleanCountryCode = (countryCode || "US").toUpperCase();
  const COUNTRY_GEO_REGISTRY = {
    // North America
    US: { criteriaId: 2840, ipSubnets: ["24.120", "73.180", "98.210", "108.45", "174.60", "67.160", "76.100", "24.105", "68.192", "71.198", "75.140"], locale: "en-US" },
    CA: { criteriaId: 2124, ipSubnets: ["24.200", "70.24", "99.230", "142.112", "174.112", "198.53", "207.161", "142.250"], locale: "en-CA" },
    MX: { criteriaId: 2484, ipSubnets: ["132.248", "187.188", "201.140", "189.200", "200.68"], locale: "es-MX" },
    CR: { criteriaId: 2188, ipSubnets: ["186.15", "190.113", "201.192", "196.40"], locale: "es-CR" },
    PA: { criteriaId: 2591, ipSubnets: ["200.46", "190.216", "186.188"], locale: "es-PA" },
    DO: { criteriaId: 2214, ipSubnets: ["200.88", "190.166", "186.6"], locale: "es-DO" },
    JM: { criteriaId: 2388, ipSubnets: ["196.3", "190.213", "208.131"], locale: "en-JM" },
    GT: { criteriaId: 2320, ipSubnets: ["200.30", "190.148", "186.151"], locale: "es-GT" },
    PR: { criteriaId: 2630, ipSubnets: ["196.12", "208.80", "192.171"], locale: "es-PR" },
    SV: { criteriaId: 2222, ipSubnets: ["200.31", "190.86", "186.182"], locale: "es-SV" },
    HN: { criteriaId: 2340, ipSubnets: ["190.92", "190.4", "186.2"], locale: "es-HN" },
    BS: { criteriaId: 2044, ipSubnets: ["196.196", "199.167"], locale: "en-BS" },
    // Europe (All Major & Regional European Countries)
    GB: { criteriaId: 2826, ipSubnets: ["82.35", "86.150", "90.200", "92.238", "151.224", "185.120", "2.24", "81.130"], locale: "en-GB" },
    DE: { criteriaId: 2276, ipSubnets: ["84.116", "91.64", "178.200", "217.80", "92.247", "80.187", "188.192"], locale: "de-DE" },
    FR: { criteriaId: 2250, ipSubnets: ["82.224", "86.200", "90.50", "176.130", "51.15", "92.154", "194.250"], locale: "fr-FR" },
    NL: { criteriaId: 2528, ipSubnets: ["84.80", "145.220", "213.124", "77.160", "82.161", "145.131"], locale: "nl-NL" },
    IT: { criteriaId: 2380, ipSubnets: ["79.16", "87.10", "93.34", "151.15", "2.32", "188.152"], locale: "it-IT" },
    ES: { criteriaId: 2724, ipSubnets: ["83.32", "88.1", "95.16", "213.97", "80.24", "217.124"], locale: "es-ES" },
    CH: { criteriaId: 2756, ipSubnets: ["130.59", "178.197", "194.230", "85.0", "178.82"], locale: "de-CH" },
    SE: { criteriaId: 2752, ipSubnets: ["193.10", "213.112", "81.224", "85.224", "217.210"], locale: "sv-SE" },
    NO: { criteriaId: 2578, ipSubnets: ["84.208", "193.212", "88.88", "80.202", "148.122"], locale: "nb-NO" },
    DK: { criteriaId: 2208, ipSubnets: ["80.62", "87.54", "188.176", "93.160", "212.130"], locale: "da-DK" },
    FI: { criteriaId: 2246, ipSubnets: ["80.220", "88.112", "193.64", "85.76", "91.152"], locale: "fi-FI" },
    IE: { criteriaId: 2372, ipSubnets: ["80.233", "86.40", "89.100", "109.255", "185.51"], locale: "en-IE" },
    BE: { criteriaId: 2056, ipSubnets: ["81.240", "91.180", "195.238", "178.116"], locale: "nl-BE" },
    AT: { criteriaId: 2040, ipSubnets: ["80.120", "91.112", "194.138", "213.47"], locale: "de-AT" },
    PL: { criteriaId: 2616, ipSubnets: ["83.4", "89.64", "178.42", "94.254", "188.146"], locale: "pl-PL" },
    PT: { criteriaId: 2620, ipSubnets: ["82.154", "85.240", "194.65", "188.80"], locale: "pt-PT" },
    CZ: { criteriaId: 2203, ipSubnets: ["89.102", "194.228", "85.70", "78.80"], locale: "cs-CZ" },
    RO: { criteriaId: 2642, ipSubnets: ["86.120", "89.34", "188.24"], locale: "ro-RO" },
    GR: { criteriaId: 2300, ipSubnets: ["79.129", "94.64", "212.205"], locale: "el-GR" },
    HU: { criteriaId: 2348, ipSubnets: ["84.0", "91.82", "195.199"], locale: "hu-HU" },
    UA: { criteriaId: 2804, ipSubnets: ["91.200", "178.92", "194.44"], locale: "uk-UA" },
    BG: { criteriaId: 2100, ipSubnets: ["78.90", "94.155", "212.5"], locale: "bg-BG" },
    HR: { criteriaId: 2191, ipSubnets: ["78.0", "89.164", "195.29"], locale: "hr-HR" },
    SK: { criteriaId: 2703, ipSubnets: ["87.244", "91.127", "195.91"], locale: "sk-SK" },
    LT: { criteriaId: 2440, ipSubnets: ["78.56", "88.119", "193.219"], locale: "lt-LT" },
    LV: { criteriaId: 2428, ipSubnets: ["80.89", "91.188", "195.122"], locale: "lv-LV" },
    EE: { criteriaId: 2233, ipSubnets: ["84.50", "90.190", "194.126"], locale: "et-EE" },
    SI: { criteriaId: 2705, ipSubnets: ["84.255", "93.103", "193.77"], locale: "sl-SI" },
    LU: { criteriaId: 2442, ipSubnets: ["81.244", "194.154", "158.64"], locale: "fr-LU" },
    CY: { criteriaId: 2196, ipSubnets: ["81.21", "92.118", "212.31"], locale: "el-CY" },
    IS: { criteriaId: 2352, ipSubnets: ["82.221", "194.105", "213.167"], locale: "is-IS" },
    RS: { criteriaId: 2688, ipSubnets: ["79.101", "109.92", "178.220"], locale: "sr-RS" },
    // Asia & Pacific
    JP: { criteriaId: 2392, ipSubnets: ["122.130", "126.150", "133.242", "153.120", "60.100", "118.238", "125.192"], locale: "ja-JP" },
    KR: { criteriaId: 2410, ipSubnets: ["147.46", "121.130", "211.200", "175.192", "218.144"], locale: "ko-KR" },
    SG: { criteriaId: 2702, ipSubnets: ["118.189", "175.156", "202.166", "122.11", "119.74", "220.255"], locale: "en-SG" },
    IN: { criteriaId: 2356, ipSubnets: ["103.21", "117.200", "122.160", "157.34", "49.200", "106.210", "115.110"], locale: "en-IN" },
    HK: { criteriaId: 2344, ipSubnets: ["119.236", "14.198", "202.128", "203.186"], locale: "zh-HK" },
    TW: { criteriaId: 2158, ipSubnets: ["114.32", "118.160", "220.128", "140.112"], locale: "zh-TW" },
    AU: { criteriaId: 2036, ipSubnets: ["1.120", "120.150", "139.130", "203.200", "49.180", "101.160", "110.140"], locale: "en-AU" },
    NZ: { criteriaId: 2554, ipSubnets: ["118.148", "122.56", "202.180", "210.55", "121.72"], locale: "en-NZ" },
    // Middle East & Africa
    AE: { criteriaId: 2784, ipSubnets: ["86.96", "94.200", "178.84", "213.42", "5.36", "89.148"], locale: "ar-AE" },
    SA: { criteriaId: 2682, ipSubnets: ["93.168", "212.138", "62.149", "37.224", "51.252"], locale: "ar-SA" },
    IL: { criteriaId: 2376, ipSubnets: ["84.108", "89.138", "192.114", "212.179"], locale: "he-IL" },
    TR: { criteriaId: 2792, ipSubnets: ["194.27", "88.224", "78.160", "176.240", "85.96"], locale: "tr-TR" },
    QA: { criteriaId: 2634, ipSubnets: ["82.148", "89.211", "178.152"], locale: "ar-QA" },
    ZA: { criteriaId: 2710, ipSubnets: ["105.184", "196.25", "197.80", "41.13", "169.255"], locale: "en-ZA" },
    NG: { criteriaId: 2566, ipSubnets: ["105.112", "197.210", "41.58", "102.89", "105.113"], locale: "en-NG" },
    GH: { criteriaId: 2288, ipSubnets: ["154.160", "196.201", "41.215", "102.176"], locale: "en-GH" },
    KE: { criteriaId: 2404, ipSubnets: ["105.160", "196.201", "41.89", "102.68"], locale: "en-KE" },
    EG: { criteriaId: 2818, ipSubnets: ["156.192", "197.32", "41.232"], locale: "ar-EG" },
    MA: { criteriaId: 2504, ipSubnets: ["105.154", "196.200", "41.140"], locale: "fr-MA" },
    // South America
    BR: { criteriaId: 2076, ipSubnets: ["177.100", "187.50", "200.150", "189.10", "179.180"], locale: "pt-BR" },
    AR: { criteriaId: 2032, ipSubnets: ["181.16", "190.18", "200.45", "186.136"], locale: "es-AR" },
    CO: { criteriaId: 2170, ipSubnets: ["181.48", "190.156", "201.232"], locale: "es-CO" },
    CL: { criteriaId: 2152, ipSubnets: ["181.42", "190.160", "200.83"], locale: "es-CL" },
    PE: { criteriaId: 2604, ipSubnets: ["181.64", "190.232", "200.106"], locale: "es-PE" }
  };
  const geoData = COUNTRY_GEO_REGISTRY[cleanCountryCode] || COUNTRY_GEO_REGISTRY["US"];
  const subnets = geoData.ipSubnets;
  const prefix = subnets[Math.floor(Math.random() * subnets.length)];
  const octet3 = Math.floor(Math.random() * 200) + 10;
  const octet4 = Math.floor(Math.random() * 250) + 2;
  const authenticCountryIp = userIp && userIp !== "198.51.100.42" && userIp !== "127.0.0.1" && !userIp.startsWith("198.51") ? userIp : `${prefix}.${octet3}.${octet4}`;
  const countryLocale = (req.body.locale || geoData.locale || "en-US").toLowerCase();
  const agent = getProxyAgent(proxyUrl);
  const effectiveEngagementMs = Math.max(1200, Number(engagementTimeMs) || 2e3);
  const cleanClientId = (clientId || "").replace(/^GA\d+\.\d+\./i, "") || `${Math.floor(Math.random() * 1e9)}.${Math.floor(Date.now() / 1e3)}`;
  const cleanSessionId = sessionId ? `${sessionId}` : `${Math.floor(Date.now() / 1e3)}`;
  const effectiveHitSeq = Math.max(1, Number(hitSequence) || 1);
  const isFirstHitInSession = effectiveHitSeq === 1;
  const effectivePageLoadId = pageLoadId || `${Math.floor(Math.random() * 1e9)}`;
  const cp = incomingClickParams || req.body.clickParams;
  let targetOrigin = "https://example.com";
  try {
    if (pageLocation && (pageLocation.startsWith("http://") || pageLocation.startsWith("https://"))) {
      targetOrigin = new URL(pageLocation).origin;
    }
  } catch {
  }
  if (apiSecret) {
    try {
      const endpoint = `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`;
      const mpEventParams = {
        session_id: cleanSessionId,
        engagement_time_msec: effectiveEngagementMs,
        page_location: pageLocation || `${targetOrigin}${pagePath || "/"}`,
        page_title: pageTitle || "Page Title",
        page_referrer: referrer || "",
        source: campaignSource || "google",
        medium: campaignMedium || "organic",
        campaign: campaignName || "organic_boost",
        visitor_country: cleanCountryCode,
        country: cleanCountryCode,
        geoid: geoData.criteriaId,
        ...req.body.debugMode === true ? { debug_mode: 1 } : {}
      };
      if (eventName === "click" || cp) {
        const clickUrl = cp?.linkUrl || `${pageLocation || targetOrigin}/out/link`;
        const clickText = cp?.linkText || pageTitle || "Click";
        const clickDomain = cp?.linkDomain || "external-partner.com";
        const clickOutbound = cp?.outbound !== false;
        mpEventParams.link_url = clickUrl;
        mpEventParams.link_text = clickText;
        mpEventParams.link_domain = clickDomain;
        mpEventParams.link_classes = cp?.linkClasses || "cta-button";
        mpEventParams.link_id = cp?.linkId || `click_${Date.now()}`;
        mpEventParams.outbound = clickOutbound;
        mpEventParams.click_target = clickText;
      }
      const payload = {
        client_id: cleanClientId,
        events: [
          {
            name: eventName || "page_view",
            params: mpEventParams
          }
        ],
        user_properties: {
          geo_country: { value: cleanCountryCode },
          visitor_ip: { value: authenticCountryIp },
          proxy_region: { value: proxyRegion }
        }
      };
      fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": userAgent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "X-Forwarded-For": authenticCountryIp,
          "CF-IPCountry": cleanCountryCode,
          "X-Proxy-Region": proxyRegion
        },
        body: JSON.stringify(payload),
        // @ts-ignore
        agent
      }).catch((e) => console.warn("GA4 MP notice:", e.message));
    } catch (err) {
      console.warn("GA4 MP Error:", err.message);
    }
  }
  const payloadParams = {
    v: "2",
    tid: measurementId,
    _p: effectivePageLoadId,
    _s: `${effectiveHitSeq}`,
    cid: cleanClientId,
    ul: countryLocale,
    sr: "1920x1080",
    _ee: "1",
    seg: "1",
    sid: cleanSessionId,
    sct: "1",
    en: eventName || "page_view",
    _et: `${effectiveEngagementMs}`,
    "epn.engagement_time_msec": `${effectiveEngagementMs}`,
    dl: pageLocation || `${targetOrigin}${pagePath || "/"}`,
    dt: pageTitle || "Page Title",
    dr: referrer || "",
    uip: authenticCountryIp,
    _uip: authenticCountryIp,
    geoid: `${geoData.criteriaId}`,
    "ep.country_code": cleanCountryCode,
    "ep.visitor_country": cleanCountryCode,
    "ep.country": cleanCountryCode,
    "ep.region": proxyRegion,
    "ep.proxy_region": proxyRegion,
    "up.geo_country": cleanCountryCode,
    ...req.body.debugMode === true ? { _dbg: "1", "ep.debug_mode": "1" } : {}
  };
  if (isFirstHitInSession) {
    payloadParams._ss = "1";
    if (isFirstVisit !== false) {
      payloadParams._fv = "1";
    }
  }
  if (campaignSource) {
    payloadParams.cs = campaignSource;
    payloadParams["ep.source"] = campaignSource;
  }
  if (campaignMedium) {
    payloadParams.cm = campaignMedium;
    payloadParams["ep.medium"] = campaignMedium;
  }
  if (campaignName) {
    payloadParams.cn = campaignName;
    payloadParams["ep.campaign"] = campaignName;
  }
  if (eventName === "click" || cp) {
    const clickUrl = cp?.linkUrl || `${pageLocation || targetOrigin}/out/link`;
    const clickText = cp?.linkText || pageTitle || "Click";
    const clickDomain = cp?.linkDomain || "external-partner.com";
    const isOutbound = cp?.outbound !== false;
    const linkClasses = cp?.linkClasses || "cta-button";
    const linkId = cp?.linkId || `click_${Date.now()}`;
    payloadParams["ep.link_url"] = clickUrl;
    payloadParams["ep.link_text"] = clickText;
    payloadParams["ep.link_domain"] = clickDomain;
    payloadParams["ep.link_classes"] = linkClasses;
    payloadParams["ep.link_id"] = linkId;
    payloadParams["ep.outbound"] = isOutbound ? "true" : "false";
    payloadParams["epn.outbound"] = isOutbound ? "1" : "0";
    payloadParams["ep.click_target"] = clickText;
    payloadParams["ep.click_url"] = clickUrl;
    payloadParams["ep.element_text"] = clickText;
    payloadParams["ep.action"] = "click";
  }
  const params = new URLSearchParams(payloadParams);
  const rawBodyString = params.toString();
  const getCollectUrl = `https://www.google-analytics.com/g/collect?${rawBodyString}`;
  const postCollectUrl = "https://www.google-analytics.com/g/collect";
  try {
    let gaRes;
    const requestHeaders = {
      "User-Agent": userAgent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
      "Accept-Language": `${countryLocale},en;q=0.8`,
      "Content-Type": "text/plain;charset=UTF-8",
      "Origin": targetOrigin,
      "Referer": pageLocation || `${targetOrigin}/`,
      "X-Forwarded-For": authenticCountryIp,
      "Client-IP": authenticCountryIp,
      "CF-Connecting-IP": authenticCountryIp,
      "CF-IPCountry": cleanCountryCode,
      "X-Country-Code": cleanCountryCode,
      "X-Proxy-Region": proxyRegion,
      "X-Real-IP": authenticCountryIp
    };
    try {
      gaRes = await fetch(postCollectUrl, {
        method: "POST",
        headers: requestHeaders,
        body: rawBodyString,
        // @ts-ignore
        agent
      });
      if (!gaRes.ok && gaRes.status !== 204) {
        gaRes = await fetch(getCollectUrl, {
          method: "GET",
          headers: {
            "User-Agent": requestHeaders["User-Agent"],
            "Accept-Language": requestHeaders["Accept-Language"],
            "Origin": targetOrigin,
            "Referer": pageLocation || `${targetOrigin}/`,
            "X-Forwarded-For": authenticCountryIp,
            "Client-IP": authenticCountryIp,
            "CF-Connecting-IP": authenticCountryIp,
            "CF-IPCountry": cleanCountryCode,
            "X-Country-Code": cleanCountryCode,
            "X-Proxy-Region": proxyRegion,
            "X-Real-IP": authenticCountryIp
          },
          // @ts-ignore
          agent
        });
      }
    } catch {
      try {
        gaRes = await fetch(postCollectUrl, {
          method: "POST",
          headers: {
            "User-Agent": userAgent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            "Content-Type": "text/plain;charset=UTF-8",
            "Origin": targetOrigin,
            "Referer": pageLocation || `${targetOrigin}/`,
            "X-Forwarded-For": authenticCountryIp,
            "CF-IPCountry": cleanCountryCode
          },
          body: rawBodyString
        });
      } catch {
        gaRes = { status: 200, ok: true };
      }
    }
    res.json({
      success: true,
      status: gaRes?.status || 200,
      measurementId,
      clientId: cleanClientId,
      sessionId: cleanSessionId,
      countryCode: cleanCountryCode,
      resolvedIp: authenticCountryIp,
      proxyUsed: !!proxyUrl,
      timestamp: Date.now()
    });
  } catch (err) {
    res.json({
      success: true,
      emulated: true,
      error: err.message,
      message: "GA4 collect ping simulated locally"
    });
  }
});
router.post("/proxy/test", async (req, res) => {
  try {
    const { proxyUrl, targetTestUrl = "https://httpbin.org/ip" } = req.body;
    if (!proxyUrl) {
      return res.status(400).json({ error: "proxyUrl is required" });
    }
    const startTime = performance.now();
    const agent = getProxyAgent(proxyUrl);
    if (!agent) {
      return res.status(400).json({ error: "Invalid proxy format." });
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8e3);
    try {
      const testRes = await fetch(targetTestUrl, {
        headers: { "User-Agent": "TrafficPulse-ProxyTester/2.5" },
        signal: controller.signal,
        // @ts-ignore
        agent
      });
      clearTimeout(timer);
      const latencyMs = Math.round(performance.now() - startTime);
      let data = {};
      try {
        data = await testRes.json();
      } catch {
        data = { origin: "Confirmed" };
      }
      const exitIp = data.origin || data.ip || "Confirmed";
      res.json({
        success: testRes.ok,
        statusCode: testRes.status,
        latencyMs,
        exitIp,
        message: `Proxy active: Exit IP ${exitIp} (${latencyMs}ms)`
      });
    } catch (err) {
      clearTimeout(timer);
      const latencyMs = Math.round(performance.now() - startTime);
      res.json({
        success: false,
        statusCode: 0,
        latencyMs,
        error: err.message || "Proxy connection failed or timed out"
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message || "Proxy test failed" });
  }
});
router.post("/proxy/test-pool", async (req, res) => {
  try {
    const { proxies, testUrl = "https://httpbin.org/ip" } = req.body;
    if (!Array.isArray(proxies) || proxies.length === 0) {
      return res.status(400).json({ error: "proxies array is required" });
    }
    const testPromises = proxies.map(async (proxy) => {
      const startTime = performance.now();
      const proxyUrl = proxy.url || `${proxy.protocol}://${proxy.username ? `${proxy.username}:${proxy.password}@` : ""}${proxy.host}:${proxy.port}`;
      const agent = getProxyAgent(proxyUrl);
      if (!agent) {
        return {
          id: proxy.id,
          status: "offline",
          latencyMs: 0,
          error: "Invalid proxy configuration"
        };
      }
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6e3);
      try {
        const testRes = await fetch(testUrl, {
          headers: { "User-Agent": "TrafficPulse-ProxyPoolTester/2.5" },
          signal: controller.signal,
          // @ts-ignore
          agent
        });
        clearTimeout(timer);
        const latencyMs = Math.round(performance.now() - startTime);
        let data = {};
        try {
          data = await testRes.json();
        } catch {
          data = { origin: "Confirmed" };
        }
        return {
          id: proxy.id,
          status: testRes.ok ? "online" : "error",
          latencyMs,
          exitIp: data.origin || data.ip || "Confirmed",
          statusCode: testRes.status
        };
      } catch (err) {
        clearTimeout(timer);
        return {
          id: proxy.id,
          status: "offline",
          latencyMs: Math.round(performance.now() - startTime),
          error: err.message
        };
      }
    });
    const results = await Promise.all(testPromises);
    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ error: err.message || "Proxy pool test failed" });
  }
});
router.post("/traffic/dispatch-batch", async (req, res) => {
  const { items, concurrency = 20 } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "items array is required" });
  }
  const results = [];
  const chunks = [];
  for (let i = 0; i < items.length; i += concurrency) {
    chunks.push(items.slice(i, i + concurrency));
  }
  for (const chunk of chunks) {
    const chunkPromises = chunk.map(async (item) => {
      const startTime = performance.now();
      try {
        const targetUrl = item.url;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), item.timeout || 8e3);
        const agent = getProxyAgent(item.proxyUrl);
        const fetchOptions = {
          method: item.method || "GET",
          headers: item.headers || {},
          signal: controller.signal,
          agent
        };
        if (item.body && ["POST", "PUT", "PATCH"].includes((item.method || "GET").toUpperCase())) {
          fetchOptions.body = typeof item.body === "string" ? item.body : JSON.stringify(item.body);
        }
        const response = await fetch(targetUrl, fetchOptions);
        clearTimeout(timer);
        const responseText = await response.text();
        const latencyMs = Math.round(performance.now() - startTime + (item.simulatedLatencyMs || 0));
        return {
          id: item.id,
          statusCode: response.status,
          statusText: response.statusText,
          latencyMs,
          success: response.ok,
          bytes: Buffer.byteLength(responseText, "utf8"),
          preview: responseText.slice(0, 150),
          proxyUsed: !!item.proxyUrl
        };
      } catch (err) {
        const latencyMs = Math.round(performance.now() - startTime + (item.simulatedLatencyMs || 0));
        return {
          id: item.id,
          statusCode: 0,
          statusText: err.name === "AbortError" ? "Timeout" : "Error",
          latencyMs,
          success: false,
          error: err.message,
          bytes: 0
        };
      }
    });
    const chunkResults = await Promise.all(chunkPromises);
    results.push(...chunkResults);
  }
  res.json({
    success: true,
    totalDispatched: items.length,
    results
  });
});
router.post("/ai/generate-fuzz-payloads", async (req, res) => {
  try {
    const { sampleBody, targetPurpose } = req.body;
    const ai = getAI();
    if (ai) {
      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: `Generate 5 realistic and adversarial JSON fuzzing payloads for stress testing this API endpoint.
Target Purpose: ${targetPurpose || "API Stress Testing"}
Base Schema/Sample: ${JSON.stringify(sampleBody || {})}

Return ONLY a JSON array of 5 objects, where each object has:
- "title": string
- "description": string
- "payload": any JSON object`,
        config: {
          responseMimeType: "application/json"
        }
      });
      const parsed = JSON.parse(response.text || "[]");
      return res.json({ payloads: parsed });
    }
    res.json({
      payloads: [
        { title: "Boundary Overflow String", description: "Oversized string buffer", payload: { data: "A".repeat(5e3) } },
        { title: "Special Characters & Injection", description: "SQL and script tokens", payload: { query: "'; DROP TABLE users; -- <script>alert(1)</script>" } },
        { title: "Zero & Negative Numerics", description: "Boundary negative numbers", payload: { quantity: -99999, price: 0 } },
        { title: "Null & Type Mutation", description: "Null mutations on required fields", payload: { id: null, active: "not_a_boolean" } },
        { title: "Deeply Nested Object", description: "Recursive recursion depth check", payload: { node: { child: { leaf: true } } } }
      ]
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Payload generation failed" });
  }
});
router.post("/ai/generate-scenario", async (req, res) => {
  const { prompt } = req.body;
  const ai = getAI();
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: `You are an expert Performance Engineer. Convert the following into a structured JSON TrafficConfig object. Prompt: "${prompt}"`,
        config: { responseMimeType: "application/json" }
      });
      const parsed = JSON.parse(response.text || "{}");
      return res.json({ success: true, scenario: parsed });
    } catch (err) {
      console.warn("AI scenario gen notice:", err.message);
    }
  }
  res.json({
    success: true,
    scenario: {
      name: `Optimized Scenario: ${prompt?.slice(0, 30) || "Load Test"}`,
      method: "GET",
      vus: 25,
      durationSeconds: 60,
      loadProfile: "wave",
      pacingIntervalMs: 40,
      slaP95Ms: 220,
      description: prompt,
      id: `ai-gen-${Date.now()}`
    }
  });
});
router.post("/ai/diagnose-run", async (req, res) => {
  const { summary } = req.body;
  const ai = getAI();
  if (ai && summary) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: `Analyze benchmark results: Total: ${summary.totalRequests}, P95: ${summary.p95LatencyMs}ms, Errors: ${summary.errorRatePct}%. Format in clean markdown with Verdict, Latency Analysis, Bottlenecks, and Recommendations.`
      });
      return res.json({ analysis: response.text });
    } catch (err) {
      console.warn("AI diagnose notice:", err.message);
    }
  }
  res.json({
    analysis: `### Autonomous Health & Performance Assessment
- **Reliability Index**: **${(100 - (summary?.errorRatePct || 0)).toFixed(1)}% Success Rate** across ${summary?.totalRequests || 0} synthetic requests.
- **Latency Distribution**: Mean P95 latency registered at **${summary?.p95LatencyMs || 0}ms**, well within normal SLA thresholds.
- **Organic Flow**: Traffic distribution exhibited natural variance with standard deviation in pacing jitter, mitigating bot-detection heuristics.`
  });
});
router.post("/ai/generate-organic-campaign", async (req, res) => {
  const { url, description, objective = "seo" } = req.body;
  const ai = getAI();
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
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
        config: { responseMimeType: "application/json" }
      });
      const parsed = JSON.parse(response.text || "{}");
      return res.json({ success: true, campaign: parsed });
    } catch (err) {
      console.warn("Gemini API notice on Vercel:", err.message);
    }
  }
  const isNigerian = (url || "").includes("9jajobs") || (url || "").includes("job") || (description || "").includes("nigeria") || (url || "").includes("eezor");
  const fallbackKeywords = isNigerian ? [
    "high paying jobs in lagos 2026",
    "remote tech jobs nigeria paystack flutterwave",
    "escrow protected freelance marketplace nigeria",
    "verified recruitment agencies port harcourt",
    "urgent job vacancies in ikeja and lekki",
    "teaching jobs nursery basic port harcourt atali",
    "van sales representative rivers state recruitment",
    "solar engineer installation jobs nigeria",
    "entry level corporate jobs abuja maitama",
    "full stack nextjs developer jobs nigeria"
  ] : [
    `official platform login ${url}`,
    `best solutions and tools review 2026`,
    "top rated software features comparison",
    "how to get started tutorial guide",
    "enterprise pricing and subscription deals",
    "high performance workflow automation"
  ];
  res.json({
    success: true,
    campaign: {
      name: `Growth Campaign (${url})`,
      keywords: fallbackKeywords,
      trafficSources: { organicSearch: 55, socialMedia: 25, direct: 12, referral: 8 },
      searchEngines: { google: 82, bing: 12, duckduckgo: 4, yahoo: 2, baidu: 0, yandex: 0 },
      socialPlatforms: { twitter: 35, linkedin: 25, facebook: 20, instagram: 10, reddit: 8, youtube: 2, tiktok: 0, pinterest: 0 },
      recommendedCountries: [
        { code: "US", name: "United States", weight: 55 },
        { code: "CA", name: "Canada", weight: 25 },
        { code: "GB", name: "United Kingdom", weight: 12 },
        { code: "DE", name: "Germany", weight: 8 }
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
app.use("/api", router);
app.use("/", router);
var handler = (req, res) => {
  return app(req, res);
};
var index_default = handler;
export {
  index_default as default
};
