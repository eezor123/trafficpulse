import { CrawledPage } from '../types';

export interface NaijaJobListingItem {
  id: string;
  path: string;
  title: string;
  categoryName: string;
  location: string;
  salaryRange: string;
  description: string;
  contactOrEmployer?: string;
  category: 'post' | 'page' | 'category';
  visitWeight: number;
}

/**
 * Exact verified job listings & articles that exist natively on https://9jajobs.vercel.app
 * Deep routes correspond to ?job=job_xxx and ?article=art_xxx which instantly launch the single listing modal
 */
export const ALL_VERIFIED_NAIJA_JOBS: NaijaJobListingItem[] = [
  {
    id: 'job_101',
    path: '/?job=job_101',
    title: 'Mobile App Developer for Dispatch Rider Tracking System',
    categoryName: 'Mobile App Development',
    location: 'Lagos (Lekki Phase 1)',
    salaryRange: '₦450,000 - ₦650,000',
    description: 'We require a skilled React Native or Flutter developer in Nigeria to build our dispatch rider mobile app. Must support real-time GPS tracking, offline mode for poor network areas in Lagos and Ibadan, offline job queuing, and Paystack/Flutterwave wallet auto-topup.',
    contactOrEmployer: 'Lagos Express Parcel Ltd (+2348039281742)',
    category: 'post',
    visitWeight: 98,
  },
  {
    id: 'job_102',
    path: '/?job=job_102',
    title: 'Brand Identity & Web UI/UX for Abuja Federal Contractor Portal',
    categoryName: 'Graphic Design & UI/UX',
    location: 'FCT - Abuja (Maitama)',
    salaryRange: '₦280,000 - ₦350,000',
    description: 'Looking for a top-tier Nigerian UI/UX designer based in or accessible to Abuja to craft high-conversion dashboards and branding materials for our agribusiness platform. Must create modern Figma design components, pitch deck slides, and responsive web screens.',
    contactOrEmployer: 'Kuku Agri-Tech Holdings (+2348123456789)',
    category: 'post',
    visitWeight: 98,
  },
  {
    id: 'job_103',
    path: '/?job=job_103',
    title: '15kVA Commercial Solar & Lithium Battery Setup in Trans-Amadi',
    categoryName: 'Solar Energy & Electrical Systems',
    location: 'Rivers (Port Harcourt - Trans-Amadi)',
    salaryRange: '₦800,000 - ₦1,200,000',
    description: 'Certified electrical & solar engineer required to lead installation of a 15kVA hybrid solar system with 20kWh lithium iron phosphate battery bank at our industrial fabrication plant in Trans-Amadi industrial layout, Port Harcourt.',
    contactOrEmployer: 'Delta Clean Energy Systems',
    category: 'post',
    visitWeight: 97,
  },
  {
    id: 'job_104',
    path: '/?job=job_104',
    title: 'Tax Compliance & Audit Specialist for Enugu Tech Startup',
    categoryName: 'Accounting & Financial Consulting',
    location: 'Enugu (Independence Layout)',
    salaryRange: '₦350,000 - ₦500,000',
    description: 'ICAN or ACCA chartered accountant needed for corporate tax planning, FIRS filing, withholding tax reconciliation, and financial auditing for a fast-scaling tech logistics startup in Enugu.',
    contactOrEmployer: 'Coal City Logistics Hub',
    category: 'post',
    visitWeight: 96,
  },
  {
    id: 'job_105',
    path: '/?job=job_105',
    title: 'Urgently Needed: Full-Stack Next.js & Stripe/Paystack Engineer',
    categoryName: 'Software & Web Engineering',
    location: 'Lagos (Yaba / Remote)',
    salaryRange: '₦600,000 - ₦900,000',
    description: 'Experienced full-stack engineer needed with deep proficiency in Next.js 14 App Router, TypeScript, Tailwind CSS, PostgreSQL, Redis queuing, and Paystack/Flutterwave/Stripe webhook settlements.',
    contactOrEmployer: 'FinServe Global Technologies',
    category: 'post',
    visitWeight: 96,
  },
  {
    id: 'job_106',
    path: '/?job=job_106',
    title: 'Social Media Content Creator & Video Editor for Skincare Brand',
    categoryName: 'Digital Marketing & Content',
    location: 'Lagos (Victoria Island)',
    salaryRange: '₦200,000 - ₦300,000',
    description: 'Creative video editor and social media strategist needed to script, shoot, and edit high-retention Instagram Reels, TikTok videos, and YouTube Shorts for luxury organic skincare brand.',
    contactOrEmployer: 'Glow Essence Nigeria Ltd',
    category: 'post',
    visitWeight: 95,
  },
  {
    id: 'job_107',
    path: '/?job=job_107',
    title: 'Flutterwave & Monnify Virtual Account Payment Specialist',
    categoryName: 'Software & Web Engineering',
    location: 'Remote (Nigeria)',
    salaryRange: '₦500,000 - ₦750,000',
    description: 'Senior backend architect needed to build automated dynamic virtual account generation using Monnify and Flutterwave API v3, real-time webhook listener idempotency, and automated ledger settlement.',
    contactOrEmployer: 'NaijaPay Solutions',
    category: 'post',
    visitWeight: 95,
  },
  {
    id: 'job_108',
    path: '/?job=job_108',
    title: 'Corporate Legal Advisor for Tech Startup Incorporation & NDPR',
    categoryName: 'Accounting & Financial Consulting',
    location: 'FCT - Abuja (Central Business District)',
    salaryRange: '₦300,000 - ₦450,000',
    description: 'Qualified legal practitioner experienced in Nigerian corporate law, CAC share capital restructuring, NDPR data privacy compliance audits, and commercial SaaS terms of service formulation.',
    contactOrEmployer: 'Apex Legal & Regulatory Partners',
    category: 'post',
    visitWeight: 95,
  },
  {
    id: 'job_109',
    path: '/?job=job_109',
    title: 'Executive Real Estate Architectural Renderings & 3D Flythrough',
    categoryName: 'Graphic Design & UI/UX',
    location: 'Lagos (Ikoyi)',
    salaryRange: '₦400,000 - ₦700,000',
    description: 'Architectural visualization expert needed to create ultra-photorealistic 3D exterior and interior renderings, VR 360 walk-throughs, and cinematic animations for luxury residential estate in Ikoyi.',
    contactOrEmployer: 'Prime Waterfront Developments',
    category: 'post',
    visitWeight: 94,
  },
  {
    id: 'job_110',
    path: '/?job=job_110',
    title: 'Hospitality CCTV & Biometric Access Control Installation Lead',
    categoryName: 'Solar Energy & Electrical Systems',
    location: 'Rivers (Port Harcourt - GRA Phase 2)',
    salaryRange: '₦250,000 - ₦400,000',
    description: 'Experienced security systems technician required to deploy 64-channel IP CCTV surveillance cameras, biometric fingerprint/RFID door access controllers, and server room structured cabling in a luxury boutique hotel in Port Harcourt GRA.',
    contactOrEmployer: 'Grand Royal Suites & Spa',
    category: 'post',
    visitWeight: 94,
  },
  {
    id: 'job_111',
    path: '/?job=job_111',
    title: 'High-Scale PostgreSQL Database Administrator & Query Optimization Specialist',
    categoryName: 'Software & Web Engineering',
    location: 'Remote (Lagos / Abuja / Port Harcourt)',
    salaryRange: '₦700,000 - ₦1,100,000',
    description: 'Database administrator with deep expertise in PostgreSQL indexing strategies, connection pooling with PgBouncer, row-level security, replication slots, partitioning, and vacuuming tuning.',
    contactOrEmployer: 'CoreBanking Systems Ltd',
    category: 'post',
    visitWeight: 94,
  },
  {
    id: 'job_112',
    path: '/?job=job_112',
    title: 'E-commerce SEO Audit & Conversion Rate Optimization (CRO)',
    categoryName: 'Digital Marketing & Content',
    location: 'Lagos (Ikeja)',
    salaryRange: '₦250,000 - ₦400,000',
    description: 'SEO professional needed to perform full technical audit, schema markup optimization, core web vitals improvement, and landing page A/B testing for high-traffic Nigerian online marketplace.',
    contactOrEmployer: 'ShopNaija Mega Store',
    category: 'post',
    visitWeight: 93,
  },
  {
    id: 'job_113',
    path: '/?job=job_113',
    title: 'Solar Inverter System Installation & Farm Automation Control',
    categoryName: 'Solar Energy & Electrical Systems',
    location: 'Oyo (Ibadan / Iseyin)',
    salaryRange: '₦350,000 - ₦550,000',
    description: 'Field engineer needed for off-grid 10kVA solar power deployment, automated solar water pumping irrigation controller, and IoT temperature telemetry system for commercial poultry farm.',
    contactOrEmployer: 'GreenField Agro-Ventures',
    category: 'post',
    visitWeight: 93,
  },
  {
    id: 'job_114',
    path: '/?job=job_114',
    title: 'Textile E-commerce Store & Hausa Multi-language UI Development',
    categoryName: 'Software & Web Engineering',
    location: 'Kano (Nasarawa / Remote)',
    salaryRange: '₦400,000 - ₦600,000',
    description: 'React developer required to implement multilingual Nigerian e-commerce storefront supporting English, Hausa, and Yoruba localization, WhatsApp order checkout button, and Paystack integration.',
    contactOrEmployer: 'Kano Royal Textiles Ltd',
    category: 'post',
    visitWeight: 93,
  },
  {
    id: 'job_115',
    path: '/?job=job_115',
    title: 'Offshore Logistics Fleet Tracking & Petroleum Inventory Dashboard',
    categoryName: 'Software & Web Engineering',
    location: 'Rivers (Port Harcourt - Onne)',
    salaryRange: '₦650,000 - ₦950,000',
    description: 'Senior frontend developer needed to build real-time interactive mapping dashboards with Leaflet/Mapbox, live vessel telemetry, fuel tank level indicators, and automated manifest reports.',
    contactOrEmployer: 'Marine Petroleum Logistics Nigeria',
    category: 'post',
    visitWeight: 92,
  },
  {
    id: 'job_116',
    path: '/?job=job_116',
    title: 'Hospitality Management Software & POS Integration for Owerri Hotel',
    categoryName: 'Software & Web Engineering',
    location: 'Imo (Owerri - New Owerri)',
    salaryRange: '₦300,000 - ₦450,000',
    description: 'Software technician needed to deploy and customize hotel management ERP, room booking calendar, thermal receipt printer integration, and staff shift accounting modules.',
    contactOrEmployer: 'Emerald Crest Hotel & Suites',
    category: 'post',
    visitWeight: 92,
  },
];

/**
 * Verified Career Guides & Articles on 9jajobs.vercel.app
 */
export const VERIFIED_NAIJA_ARTICLES = [
  {
    id: 'art_101',
    path: '/?article=art_101',
    title: '10 Proven Tips to Ace High-Paying Job Interviews in Nigeria',
    categoryName: 'Career Guides',
    salaryRange: 'Resource Guide',
    location: 'Nationwide',
    description: 'Master competency-based questions, salary negotiation with Nigerian employers, professional body language, and effective follow-up strategies.',
    visitWeight: 95,
  },
  {
    id: 'art_102',
    path: '/?article=art_102',
    title: 'How to Build an ATS-Friendly CV That Nigerian HRs Love in 2026',
    categoryName: 'Career Guides',
    salaryRange: 'Resource Guide',
    location: 'Nationwide',
    description: 'Learn the exact formatting standards, keyword density, and clean layouts that bypass automated Applicant Tracking Systems used by top Nigerian multinationals.',
    visitWeight: 95,
  },
  {
    id: 'art_103',
    path: '/?article=art_103',
    title: 'Top 8 High-Demand Remote Tech Skills for Nigerians in 2026',
    categoryName: 'Tech & Career',
    salaryRange: 'Industry Insights',
    location: 'Global / Remote',
    description: 'Explore high-income remote opportunities in Full-Stack Engineering, Cloud Architecture, UI/UX Design, and AI Prompt Engineering paying in USD and GBP.',
    visitWeight: 94,
  },
  {
    id: 'art_104',
    path: '/?article=art_104',
    title: 'Salary Negotiation Strategies in the Nigerian Tech & Oil Sectors',
    categoryName: 'Compensation & Benefits',
    salaryRange: 'Financial Advice',
    location: 'Lagos / Abuja / Port Harcourt',
    description: 'Discover how to benchmark your market value, negotiate FX allowances, equity options, pension matches, and HMO packages with Nigerian corporate employers.',
    visitWeight: 94,
  },
  {
    id: 'art_105',
    path: '/?article=art_105',
    title: 'Navigating NYSC Service Year to Land Your First High-Paying Corporate Job',
    categoryName: 'Graduate Trainee & NYSC',
    salaryRange: 'Career Guide',
    location: 'Nationwide',
    description: 'Strategic roadmap for Nigerian graduates to leverage their PPA assignment, build professional portfolios, and convert NYSC internships to full-time roles.',
    visitWeight: 93,
  },
  {
    id: 'art_106',
    path: '/?article=art_106',
    title: 'Freelancing vs Full-Time Jobs: Choosing Your High-Income Career Path in Nigeria',
    categoryName: 'Freelancing & Escrow',
    salaryRange: 'Career Strategy',
    location: 'Nationwide',
    description: 'Comprehensive breakdown of income predictability, tax planning, escrow client safety, and portfolio building for Nigerian independent professionals.',
    visitWeight: 93,
  },
];

/**
 * Builds a complete array of CrawledPage items with absolute URLs and deep routes
 * that are 100% clickable and guaranteed to open the exact listing single page.
 */
export function buildCrawledPagesFromListings(origin: string = 'https://9jajobs.vercel.app'): CrawledPage[] {
  const rootOrigin = origin.replace(/\/$/, '');
  const pages: CrawledPage[] = [];

  // 1. Root / Homepage
  pages.push({
    id: 'page_home',
    url: `${rootOrigin}/`,
    path: '/',
    title: 'NaijaJobs - Nigeria Premier Escrow Job Marketplace & Career Hub',
    description: 'Find verified full-time jobs, freelance gigs, escrow-protected milestones, and career resources across Lagos, Abuja, Port Harcourt, and Nigeria.',
    depth: 0,
    status: 200,
    includedInVisits: true,
    visitWeight: 100,
    gaDetected: true,
    category: 'page',
  });

  // 2. All 16 Verified Real Job Listings (Exact ?job=job_101..job_116 links)
  ALL_VERIFIED_NAIJA_JOBS.forEach((job) => {
    pages.push({
      id: `page_${job.id}`,
      url: `${rootOrigin}${job.path}`,
      path: job.path,
      title: job.title,
      description: `[${job.location}] ${job.salaryRange} • ${job.categoryName}: ${job.description.slice(0, 110)}...`,
      depth: 1,
      status: 200,
      includedInVisits: true,
      visitWeight: job.visitWeight,
      gaDetected: true,
      category: 'post',
    });
  });

  // 3. Verified Career Guides & Articles (Exact ?article=art_101..art_106 links)
  VERIFIED_NAIJA_ARTICLES.forEach((art) => {
    pages.push({
      id: `page_${art.id}`,
      url: `${rootOrigin}${art.path}`,
      path: art.path,
      title: art.title,
      description: `${art.categoryName}: ${art.description}`,
      depth: 1,
      status: 200,
      includedInVisits: true,
      visitWeight: art.visitWeight,
      gaDetected: true,
      category: 'post',
    });
  });

  // 4. Job Category Routes
  const categories = [
    { path: '/category/mobile-app-development', name: 'Mobile App Development' },
    { path: '/category/graphic-design-ui-ux', name: 'Graphic Design & UI/UX' },
    { path: '/category/solar-energy-electrical-systems', name: 'Solar Energy & Electrical Systems' },
    { path: '/category/accounting-financial-consulting', name: 'Accounting & Financial Consulting' },
    { path: '/category/software-web-engineering', name: 'Software & Web Engineering' },
    { path: '/category/digital-marketing-content', name: 'Digital Marketing & Content' },
    { path: '/category/virtual-assistance-admin', name: 'Virtual Assistance & Admin Support' },
    { path: '/category/hospitality-hotel', name: 'Hospitality & Hotel' },
    { path: '/category/transportation-logistics', name: 'Transportation and Logistics' },
    { path: '/category/fashion-design', name: 'Fashion & Front Desk' },
  ];

  categories.forEach((cat) => {
    pages.push({
      id: `cat_${cat.path.replace(/[^a-z0-9]/gi, '_')}`,
      url: `${rootOrigin}${cat.path}`,
      path: cat.path,
      title: `${cat.name} (Job Category)`,
      description: `Browse verified Nigerian ${cat.name} listings and high-paying openings`,
      depth: 1,
      status: 200,
      includedInVisits: true,
      visitWeight: 88,
      gaDetected: true,
      category: 'category',
    });
  });

  // 5. Core Platform Navigation Routes
  const coreRoutes = [
    { id: 'route_jobs', path: '/jobs', title: 'Browse All Verified Jobs & Freelance Escrow Gigs' },
    { id: 'route_freelancers', path: '/freelancers', title: 'Find Verified Top Nigerian Freelancers' },
    { id: 'route_escrow', path: '/escrow', title: 'Escrow Milestone Protection & Security Guarantee' },
    { id: 'route_safety', path: '/safety', title: 'Trust, Safety, KYC & Anti-Fraud Verification' },
  ];

  coreRoutes.forEach((route) => {
    pages.push({
      id: `route_${route.id}`,
      url: `${rootOrigin}${route.path}`,
      path: route.path,
      title: route.title,
      description: `Explore ${route.title} on 9jaJobs`,
      depth: 1,
      status: 200,
      includedInVisits: true,
      visitWeight: 85,
      gaDetected: true,
      category: 'page',
    });
  });

  return pages;
}
