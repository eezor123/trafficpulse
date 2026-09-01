import { GeoCountry, OrganicVisitorConfig, ProxyNode, ProxyEngineConfig } from '../types';

export interface RegionPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  countryCodes: string[];
}

export const REGIONS_LIST = [
  { id: 'all', name: 'All Continents', icon: '🌐' },
  { id: 'North America', name: 'North America', icon: '🇺🇸' },
  { id: 'South America', name: 'South America', icon: '🇧🇷' },
  { id: 'Europe', name: 'Europe', icon: '🇪🇺' },
  { id: 'Asia', name: 'Asia', icon: '🌏' },
  { id: 'Middle East', name: 'Middle East', icon: '🕌' },
  { id: 'Africa', name: 'Africa', icon: '🌍' },
  { id: 'Oceania', name: 'Oceania / Pacific', icon: '🇦🇺' },
];

export const REGION_PRESETS: RegionPreset[] = [
  {
    id: 'worldwide',
    name: 'Worldwide (All Continents & 80+ Countries)',
    description: 'Evenly distributed global traffic across North America, South America, Europe, Asia, Africa, Middle East, and Oceania',
    icon: '🌐',
    countryCodes: [], // empty = all
  },
  {
    id: 'north_america',
    name: 'North America (US, CA, MX, CR, PA, DO, JM, GT, PR)',
    description: 'High-value Tier-1 North American residential & commercial traffic',
    icon: '🇺🇸',
    countryCodes: ['US', 'CA', 'MX', 'CR', 'PA', 'DO', 'JM', 'GT', 'PR', 'SV', 'HN', 'BS'],
  },
  {
    id: 'south_america',
    name: 'South America (BR, AR, CO, CL, PE, EC, UY, PY, BO, VE)',
    description: 'Expanding Latin American residential broadband and mobile networks',
    icon: '🇧🇷',
    countryCodes: ['BR', 'AR', 'CO', 'CL', 'PE', 'EC', 'UY', 'PY', 'BO', 'VE'],
  },
  {
    id: 'european_union',
    name: 'Europe (EU, UK, Nordics, Western & Eastern Europe)',
    description: 'Western, Northern, Southern, and Central European residential broadband networks',
    icon: '🇪🇺',
    countryCodes: ['GB', 'DE', 'FR', 'NL', 'IT', 'ES', 'CH', 'SE', 'NO', 'DK', 'FI', 'IE', 'BE', 'AT', 'PL', 'PT', 'CZ', 'RO', 'GR', 'HU', 'UA', 'BG', 'HR', 'SK', 'LT', 'LV', 'EE', 'SI', 'LU', 'CY', 'IS', 'RS'],
  },
  {
    id: 'asia_tech',
    name: 'Asia & Pacific (JP, KR, SG, IN, HK, TW, ID, MY, TH, VN, PH)',
    description: 'High-bandwidth fiber & 5G mobile traffic from Tokyo, Seoul, Singapore, Sydney, and Bangalore',
    icon: '🌏',
    countryCodes: ['JP', 'KR', 'SG', 'IN', 'HK', 'TW', 'ID', 'MY', 'TH', 'VN', 'PH', 'PK', 'BD', 'LK', 'NP', 'KZ', 'UZ', 'GE', 'AM', 'AZ'],
  },
  {
    id: 'middle_east',
    name: 'Middle East (AE, SA, IL, TR, QA, KW, OM, BH, JO, LB)',
    description: 'High-income Gulf & Levant commercial hubs (Dubai, Riyadh, Doha, Tel Aviv, Istanbul)',
    icon: '🕌',
    countryCodes: ['AE', 'SA', 'IL', 'TR', 'QA', 'KW', 'OM', 'BH', 'JO', 'LB'],
  },
  {
    id: 'africa',
    name: 'Africa (ZA, NG, EG, KE, MA, GH, DZ, TN, ET, TZ, UG)',
    description: 'Fastest growing mobile & broadband networks across Sub-Saharan & North Africa',
    icon: '🌍',
    countryCodes: ['ZA', 'NG', 'EG', 'KE', 'MA', 'GH', 'DZ', 'TN', 'ET', 'TZ', 'UG', 'CI', 'SN', 'RW', 'MU'],
  },
  {
    id: 'oceania',
    name: 'Oceania (AU, NZ, FJ, PG, WS)',
    description: 'Australian and Pacific fiber residential internet connections',
    icon: '🇦🇺',
    countryCodes: ['AU', 'NZ', 'FJ', 'PG', 'WS'],
  },
  {
    id: 'tier1_high_cpc',
    name: 'Tier-1 High CPC (US, UK, CA, AU, NZ, DE, FR, CH, NL, SG)',
    description: 'Top-tier highest commercial revenue traffic with maximum conversion rates',
    icon: '💎',
    countryCodes: ['US', 'GB', 'CA', 'AU', 'NZ', 'DE', 'FR', 'CH', 'NL', 'SG', 'IE', 'SE', 'NO', 'DK'],
  }
];

export const DEFAULT_PROXIES: ProxyNode[] = [
  // North America
  { id: 'prx_us_1', protocol: 'http', host: '24.120.45.18', port: 8080, countryCode: 'US', countryName: 'United States', flag: '🇺🇸', countryFlag: '🇺🇸', region: 'North America', city: 'New York, NY', isp: 'Comcast XFINITY Residential', asn: 'AS7922', status: 'active', latencyMs: 38, realExitIp: '24.120.45.18', exitIp: '24.120.45.18', proxyType: 'residential', enabled: true, rotationType: 'sticky' },
  { id: 'prx_us_2', protocol: 'http', host: '104.28.19.4', port: 8080, countryCode: 'US', countryName: 'United States', flag: '🇺🇸', countryFlag: '🇺🇸', region: 'North America', city: 'Los Angeles, CA', isp: 'AT&T Fiber Broadband', asn: 'AS7018', status: 'active', latencyMs: 44, realExitIp: '104.28.19.4', exitIp: '104.28.19.4', proxyType: 'residential', enabled: true, rotationType: 'sticky' },
  { id: 'prx_ca_1', protocol: 'http', host: '142.250.190.46', port: 8080, countryCode: 'CA', countryName: 'Canada', flag: '🇨🇦', countryFlag: '🇨🇦', region: 'North America', city: 'Toronto, ON', isp: 'Rogers Communications', asn: 'AS812', status: 'active', latencyMs: 52, realExitIp: '142.250.190.46', exitIp: '142.250.190.46', proxyType: 'residential', enabled: true, rotationType: 'sticky' },
  { id: 'prx_mx_1', protocol: 'http', host: '132.248.10.5', port: 8080, countryCode: 'MX', countryName: 'Mexico', flag: '🇲🇽', countryFlag: '🇲🇽', region: 'North America', city: 'Mexico City', isp: 'Telmex Infinitum', asn: 'AS8151', status: 'active', latencyMs: 78, realExitIp: '132.248.10.5', exitIp: '132.248.10.5', proxyType: 'residential', enabled: true, rotationType: 'sticky' },

  // South America
  { id: 'prx_br_1', protocol: 'http', host: '177.136.250.1', port: 8080, countryCode: 'BR', countryName: 'Brazil', flag: '🇧🇷', countryFlag: '🇧🇷', region: 'South America', city: 'São Paulo', isp: 'Claro Brasil Vivo Fibra', asn: 'AS28573', status: 'active', latencyMs: 130, realExitIp: '177.136.250.1', exitIp: '177.136.250.1', proxyType: 'residential', enabled: true, rotationType: 'sticky' },
  { id: 'prx_ar_1', protocol: 'http', host: '157.92.1.1', port: 8080, countryCode: 'AR', countryName: 'Argentina', flag: '🇦🇷', countryFlag: '🇦🇷', region: 'South America', city: 'Buenos Aires', isp: 'Telecom Argentina Fibertel', asn: 'AS7303', status: 'active', latencyMs: 145, realExitIp: '157.92.1.1', exitIp: '157.92.1.1', proxyType: 'residential', enabled: true, rotationType: 'sticky' },
  { id: 'prx_co_1', protocol: 'http', host: '168.176.1.1', port: 8080, countryCode: 'CO', countryName: 'Colombia', flag: '🇨🇴', countryFlag: '🇨🇴', region: 'South America', city: 'Bogotá', isp: 'ETB Colombia Hogar', asn: 'AS3816', status: 'active', latencyMs: 135, realExitIp: '168.176.1.1', exitIp: '168.176.1.1', proxyType: 'residential', enabled: true, rotationType: 'sticky' },
  { id: 'prx_cl_1', protocol: 'http', host: '146.83.1.1', port: 8080, countryCode: 'CL', countryName: 'Chile', flag: '🇨🇱', countryFlag: '🇨🇱', region: 'South America', city: 'Santiago', isp: 'VTR Comunicaciones', asn: 'AS22047', status: 'active', latencyMs: 150, realExitIp: '146.83.1.1', exitIp: '146.83.1.1', proxyType: 'residential', enabled: true, rotationType: 'sticky' },

  // Europe
  { id: 'prx_gb_1', protocol: 'http', host: '185.120.45.12', port: 8080, countryCode: 'GB', countryName: 'United Kingdom', flag: '🇬🇧', countryFlag: '🇬🇧', region: 'Europe', city: 'London', isp: 'BT Broadband Residential', asn: 'AS2856', status: 'active', latencyMs: 42, realExitIp: '185.120.45.12', exitIp: '185.120.45.12', proxyType: 'residential', enabled: true, rotationType: 'sticky' },
  { id: 'prx_de_1', protocol: 'http', host: '92.247.181.5', port: 3128, countryCode: 'DE', countryName: 'Germany', flag: '🇩🇪', countryFlag: '🇩🇪', region: 'Europe', city: 'Frankfurt', isp: 'Deutsche Telekom AG', asn: 'AS3320', status: 'active', latencyMs: 46, realExitIp: '92.247.181.5', exitIp: '92.247.181.5', proxyType: 'residential', enabled: true, rotationType: 'sticky' },
  { id: 'prx_fr_1', protocol: 'http', host: '51.15.22.88', port: 8080, countryCode: 'FR', countryName: 'France', flag: '🇫🇷', countryFlag: '🇫🇷', region: 'Europe', city: 'Paris', isp: 'Orange France Telecom', asn: 'AS3215', status: 'active', latencyMs: 49, realExitIp: '51.15.22.88', exitIp: '51.15.22.88', proxyType: 'residential', enabled: true, rotationType: 'sticky' },
  { id: 'prx_nl_1', protocol: 'http', host: '145.220.21.30', port: 8080, countryCode: 'NL', countryName: 'Netherlands', flag: '🇳🇱', countryFlag: '🇳🇱', region: 'Europe', city: 'Amsterdam', isp: 'KPN B.V. Residential', asn: 'AS1136', status: 'active', latencyMs: 39, realExitIp: '145.220.21.30', exitIp: '145.220.21.30', proxyType: 'residential', enabled: true, rotationType: 'sticky' },
  { id: 'prx_ch_1', protocol: 'http', host: '130.59.10.15', port: 8080, countryCode: 'CH', countryName: 'Switzerland', flag: '🇨🇭', countryFlag: '🇨🇭', region: 'Europe', city: 'Zurich', isp: 'Swisscom Residential', asn: 'AS3303', status: 'active', latencyMs: 51, realExitIp: '130.59.10.15', exitIp: '130.59.10.15', proxyType: 'residential', enabled: true, rotationType: 'sticky' },
  { id: 'prx_se_1', protocol: 'http', host: '193.10.252.19', port: 8080, countryCode: 'SE', countryName: 'Sweden', flag: '🇸🇪', countryFlag: '🇸🇪', region: 'Europe', city: 'Stockholm', isp: 'Telia Company AB', asn: 'AS3301', status: 'active', latencyMs: 58, realExitIp: '193.10.252.19', exitIp: '193.10.252.19', proxyType: 'residential', enabled: true, rotationType: 'sticky' },

  // Asia
  { id: 'prx_jp_1', protocol: 'http', host: '133.242.18.90', port: 8080, countryCode: 'JP', countryName: 'Japan', flag: '🇯🇵', countryFlag: '🇯🇵', region: 'Asia', city: 'Tokyo', isp: 'NTT Communications OCN', asn: 'AS4713', status: 'active', latencyMs: 105, realExitIp: '133.242.18.90', exitIp: '133.242.18.90', proxyType: 'residential', enabled: true, rotationType: 'sticky' },
  { id: 'prx_kr_1', protocol: 'http', host: '147.46.10.25', port: 8080, countryCode: 'KR', countryName: 'South Korea', flag: '🇰🇷', countryFlag: '🇰🇷', region: 'Asia', city: 'Seoul', isp: 'KT Telecom Giga Fiber', asn: 'AS4766', status: 'active', latencyMs: 115, realExitIp: '147.46.10.25', exitIp: '147.46.10.25', proxyType: 'residential', enabled: true, rotationType: 'sticky' },
  { id: 'prx_sg_1', protocol: 'http', host: '202.166.192.3', port: 8080, countryCode: 'SG', countryName: 'Singapore', flag: '🇸🇬', countryFlag: '🇸🇬', region: 'Asia', city: 'Singapore', isp: 'Singtel Residential Fiber', asn: 'AS7473', status: 'active', latencyMs: 95, realExitIp: '202.166.192.3', exitIp: '202.166.192.3', proxyType: 'residential', enabled: true, rotationType: 'sticky' },
  { id: 'prx_in_1', protocol: 'http', host: '103.21.244.0', port: 8080, countryCode: 'IN', countryName: 'India', flag: '🇮🇳', countryFlag: '🇮🇳', region: 'Asia', city: 'Mumbai', isp: 'Reliance Jio Fiber', asn: 'AS55836', status: 'active', latencyMs: 118, realExitIp: '103.21.244.0', exitIp: '103.21.244.0', proxyType: 'residential', enabled: true, rotationType: 'sticky' },
  { id: 'prx_hk_1', protocol: 'http', host: '143.89.1.1', port: 8080, countryCode: 'HK', countryName: 'Hong Kong', flag: '🇭🇰', countryFlag: '🇭🇰', region: 'Asia', city: 'Hong Kong', isp: 'HKT Netvigator', asn: 'AS4760', status: 'active', latencyMs: 105, realExitIp: '143.89.1.1', exitIp: '143.89.1.1', proxyType: 'residential', enabled: true, rotationType: 'sticky' },

  // Middle East
  { id: 'prx_ae_1', protocol: 'http', host: '86.96.200.12', port: 8080, countryCode: 'AE', countryName: 'United Arab Emirates', flag: '🇦🇪', countryFlag: '🇦🇪', region: 'Middle East', city: 'Dubai', isp: 'Emirates Telecommunications (Etisalat)', asn: 'AS5384', status: 'active', latencyMs: 90, realExitIp: '86.96.200.12', exitIp: '86.96.200.12', proxyType: 'residential', enabled: true, rotationType: 'sticky' },
  { id: 'prx_sa_1', protocol: 'http', host: '212.138.1.1', port: 8080, countryCode: 'SA', countryName: 'Saudi Arabia', flag: '🇸🇦', countryFlag: '🇸🇦', region: 'Middle East', city: 'Riyadh', isp: 'STC Saudi Telecom', asn: 'AS25019', status: 'active', latencyMs: 98, realExitIp: '212.138.1.1', exitIp: '212.138.1.1', proxyType: 'residential', enabled: true, rotationType: 'sticky' },
  { id: 'prx_il_1', protocol: 'http', host: '192.114.1.1', port: 8080, countryCode: 'IL', countryName: 'Israel', flag: '🇮🇱', countryFlag: '🇮🇱', region: 'Middle East', city: 'Tel Aviv', isp: 'Bezeq The Israel Telecom Corp', asn: 'AS8551', status: 'active', latencyMs: 92, realExitIp: '192.114.1.1', exitIp: '192.114.1.1', proxyType: 'residential', enabled: true, rotationType: 'sticky' },
  { id: 'prx_tr_1', protocol: 'http', host: '194.27.1.1', port: 8080, countryCode: 'TR', countryName: 'Turkey', flag: '🇹🇷', countryFlag: '🇹🇷', region: 'Middle East', city: 'Istanbul', isp: 'Turk Telekomunikasyon', asn: 'AS9121', status: 'active', latencyMs: 72, realExitIp: '194.27.1.1', exitIp: '194.27.1.1', proxyType: 'residential', enabled: true, rotationType: 'sticky' },

  // Africa
  { id: 'prx_za_1', protocol: 'http', host: '196.25.1.1', port: 8080, countryCode: 'ZA', countryName: 'South Africa', flag: '🇿🇦', countryFlag: '🇿🇦', region: 'Africa', city: 'Johannesburg', isp: 'Telkom SA SOC Ltd', asn: 'AS37457', status: 'active', latencyMs: 165, realExitIp: '196.25.1.1', exitIp: '196.25.1.1', proxyType: 'residential', enabled: true, rotationType: 'sticky' },
  { id: 'prx_ng_1', protocol: 'http', host: '197.210.1.1', port: 8080, countryCode: 'NG', countryName: 'Nigeria', flag: '🇳🇬', countryFlag: '🇳🇬', region: 'Africa', city: 'Lagos', isp: 'MTN Nigeria Broadband', asn: 'AS29465', status: 'active', latencyMs: 155, realExitIp: '197.210.1.1', exitIp: '197.210.1.1', proxyType: 'residential', enabled: true, rotationType: 'sticky' },
  { id: 'prx_eg_1', protocol: 'http', host: '193.227.1.1', port: 8080, countryCode: 'EG', countryName: 'Egypt', flag: '🇪🇬', countryFlag: '🇪🇬', region: 'Africa', city: 'Cairo', isp: 'Telecom Egypt TE Data', asn: 'AS8452', status: 'active', latencyMs: 110, realExitIp: '193.227.1.1', exitIp: '193.227.1.1', proxyType: 'residential', enabled: true, rotationType: 'sticky' },
  { id: 'prx_ke_1', protocol: 'http', host: '196.201.214.1', port: 8080, countryCode: 'KE', countryName: 'Kenya', flag: '🇰🇪', countryFlag: '🇰🇪', region: 'Africa', city: 'Nairobi', isp: 'Safaricom Home Fibre', asn: 'AS37061', status: 'active', latencyMs: 140, realExitIp: '196.201.214.1', exitIp: '196.201.214.1', proxyType: 'residential', enabled: true, rotationType: 'sticky' },

  // Oceania
  { id: 'prx_au_1', protocol: 'http', host: '139.130.4.5', port: 8080, countryCode: 'AU', countryName: 'Australia', flag: '🇦🇺', countryFlag: '🇦🇺', region: 'Oceania', city: 'Sydney, NSW', isp: 'Telstra Residential NBN', asn: 'AS1221', status: 'active', latencyMs: 140, realExitIp: '139.130.4.5', exitIp: '139.130.4.5', proxyType: 'residential', enabled: true, rotationType: 'sticky' },
  { id: 'prx_nz_1', protocol: 'http', host: '130.216.1.1', port: 8080, countryCode: 'NZ', countryName: 'New Zealand', flag: '🇳🇿', countryFlag: '🇳🇿', region: 'Oceania', city: 'Auckland', isp: 'Spark New Zealand', asn: 'AS4771', status: 'active', latencyMs: 155, realExitIp: '130.216.1.1', exitIp: '130.216.1.1', proxyType: 'residential', enabled: true, rotationType: 'sticky' },
];

export const DEFAULT_PROXY_ENGINE: ProxyEngineConfig = {
  enabled: true,
  mode: 'country_match',
  rotationStrategy: 'sticky_session', // Keep residential IP sticky for entire user multi-page session to avoid bot fraud detection
  customProxyList: '',
  proxies: DEFAULT_PROXIES,
  autoFetchPublicProxies: true,
  proxyType: 'residential',
  strictGeoMatching: true,
  selectedRegions: ['North America', 'South America', 'Europe', 'Asia', 'Middle East', 'Africa', 'Oceania'],
};

export const GLOBAL_COUNTRIES: GeoCountry[] = [
  // ================= NORTH AMERICA =================
  { code: 'US', name: 'United States', flag: '🇺🇸', weight: 35, locale: 'en-US,en;q=0.9', timezone: 'America/New_York', ipSample: '24.120.45.18', region: 'North America', enabled: true, city: 'New York / Los Angeles / Chicago', isp: 'Comcast / AT&T / Verizon', asn: 'AS7922' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', weight: 15, locale: 'en-CA,en-US;q=0.9,en;q=0.8', timezone: 'America/Toronto', ipSample: '142.250.190.46', region: 'North America', enabled: true, city: 'Toronto / Vancouver', isp: 'Rogers / Bell Canada', asn: 'AS812' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', weight: 8, locale: 'es-MX,es;q=0.9,en;q=0.8', timezone: 'America/Mexico_City', ipSample: '132.248.10.5', region: 'North America', enabled: true, city: 'Mexico City / Monterrey', isp: 'Telmex Infinitum', asn: 'AS8151' },
  { code: 'CR', name: 'Costa Rica', flag: '🇨🇷', weight: 4, locale: 'es-CR,es;q=0.9,en;q=0.8', timezone: 'America/Costa_Rica', ipSample: '196.40.10.1', region: 'North America', enabled: true, city: 'San José', isp: 'ICE Kolbi Costa Rica', asn: 'AS11830' },
  { code: 'PA', name: 'Panama', flag: '🇵🇦', weight: 4, locale: 'es-PA,es;q=0.9,en;q=0.8', timezone: 'America/Panama', ipSample: '200.46.1.1', region: 'North America', enabled: true, city: 'Panama City', isp: 'Cable & Wireless Panama', asn: 'AS11558' },
  { code: 'DO', name: 'Dominican Republic', flag: '🇩🇴', weight: 4, locale: 'es-DO,es;q=0.9,en;q=0.8', timezone: 'America/Santo_Domingo', ipSample: '200.88.1.1', region: 'North America', enabled: true, city: 'Santo Domingo', isp: 'Claro Dominicana', asn: 'AS6420' },
  { code: 'JM', name: 'Jamaica', flag: '🇯🇲', weight: 3, locale: 'en-JM,en;q=0.9', timezone: 'America/Jamaica', ipSample: '196.3.1.1', region: 'North America', enabled: true, city: 'Kingston', isp: 'Flow Jamaica / Digicel', asn: 'AS23520' },
  { code: 'GT', name: 'Guatemala', flag: '🇬🇹', weight: 3, locale: 'es-GT,es;q=0.9,en;q=0.8', timezone: 'America/Guatemala', ipSample: '200.30.1.1', region: 'North America', enabled: true, city: 'Guatemala City', isp: 'Tigo Guatemala', asn: 'AS14754' },
  { code: 'PR', name: 'Puerto Rico', flag: '🇵🇷', weight: 4, locale: 'es-PR,en-US;q=0.9', timezone: 'America/Puerto_Rico', ipSample: '196.12.1.1', region: 'North America', enabled: true, city: 'San Juan', isp: 'Liberty Puerto Rico', asn: 'AS14988' },
  { code: 'SV', name: 'El Salvador', flag: '🇸🇻', weight: 3, locale: 'es-SV,es;q=0.9,en;q=0.8', timezone: 'America/El_Salvador', ipSample: '200.31.1.1', region: 'North America', enabled: true, city: 'San Salvador', isp: 'Claro El Salvador', asn: 'AS11252' },
  { code: 'HN', name: 'Honduras', flag: '🇭🇳', weight: 3, locale: 'es-HN,es;q=0.9,en;q=0.8', timezone: 'America/Tegucigalpa', ipSample: '190.92.1.1', region: 'North America', enabled: true, city: 'Tegucigalpa', isp: 'Tigo Honduras', asn: 'AS27821' },
  { code: 'BS', name: 'Bahamas', flag: '🇧🇸', weight: 2, locale: 'en-BS,en;q=0.9', timezone: 'America/Nassau', ipSample: '196.196.1.1', region: 'North America', enabled: true, city: 'Nassau', isp: 'BTC Bahamas', asn: 'AS11426' },

  // ================= SOUTH AMERICA =================
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', weight: 12, locale: 'pt-BR,pt;q=0.9,en;q=0.8', timezone: 'America/Sao_Paulo', ipSample: '177.18.200.54', region: 'South America', enabled: true, city: 'São Paulo / Rio de Janeiro', isp: 'Claro / Vivo Fibra', asn: 'AS28573' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', weight: 8, locale: 'es-AR,es;q=0.9,en;q=0.8', timezone: 'America/Argentina/Buenos_Aires', ipSample: '157.92.1.1', region: 'South America', enabled: true, city: 'Buenos Aires', isp: 'Telecom Argentina Fibertel', asn: 'AS7303' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱', weight: 6, locale: 'es-CL,es;q=0.9,en;q=0.8', timezone: 'America/Santiago', ipSample: '146.83.1.1', region: 'South America', enabled: true, city: 'Santiago', isp: 'VTR Comunicaciones / Entel', asn: 'AS22047' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴', weight: 7, locale: 'es-CO,es;q=0.9,en;q=0.8', timezone: 'America/Bogota', ipSample: '168.176.1.1', region: 'South America', enabled: true, city: 'Bogotá / Medellín', isp: 'ETB Colombia / Claro', asn: 'AS3816' },
  { code: 'PE', name: 'Peru', flag: '🇵🇪', weight: 5, locale: 'es-PE,es;q=0.9,en;q=0.8', timezone: 'America/Lima', ipSample: '200.62.1.1', region: 'South America', enabled: true, city: 'Lima', isp: 'Telefonica del Peru', asn: 'AS6147' },
  { code: 'EC', name: 'Ecuador', flag: '🇪🇨', weight: 4, locale: 'es-EC,es;q=0.9,en;q=0.8', timezone: 'America/Guayaquil', ipSample: '190.152.1.1', region: 'South America', enabled: true, city: 'Quito / Guayaquil', isp: 'CNT Ecuador', asn: 'AS28006' },
  { code: 'UY', name: 'Uruguay', flag: '🇺🇾', weight: 4, locale: 'es-UY,es;q=0.9,en;q=0.8', timezone: 'America/Montevideo', ipSample: '200.40.1.1', region: 'South America', enabled: true, city: 'Montevideo', isp: 'Antel Uruguay', asn: 'AS6057' },
  { code: 'PY', name: 'Paraguay', flag: '🇵🇾', weight: 3, locale: 'es-PY,es;q=0.9,en;q=0.8', timezone: 'America/Asuncion', ipSample: '190.128.1.1', region: 'South America', enabled: true, city: 'Asunción', isp: 'Personal Paraguay / Tigo', asn: 'AS23201' },
  { code: 'BO', name: 'Bolivia', flag: '🇧🇴', weight: 3, locale: 'es-BO,es;q=0.9,en;q=0.8', timezone: 'America/La_Paz', ipSample: '190.181.1.1', region: 'South America', enabled: true, city: 'La Paz / Santa Cruz', isp: 'Entel Bolivia', asn: 'AS25620' },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪', weight: 3, locale: 'es-VE,es;q=0.9,en;q=0.8', timezone: 'America/Caracas', ipSample: '200.11.1.1', region: 'South America', enabled: true, city: 'Caracas', isp: 'CANTV Venezuela', asn: 'AS8048' },

  // ================= EUROPE =================
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', weight: 20, locale: 'en-GB,en;q=0.9,en-US;q=0.8', timezone: 'Europe/London', ipSample: '185.120.45.12', region: 'Europe', enabled: true, city: 'London / Manchester', isp: 'BT / Virgin Media', asn: 'AS2856' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', weight: 18, locale: 'de-DE,de;q=0.9,en;q=0.8', timezone: 'Europe/Berlin', ipSample: '92.247.181.5', region: 'Europe', enabled: true, city: 'Frankfurt / Berlin / Munich', isp: 'Deutsche Telekom / Vodafone', asn: 'AS3320' },
  { code: 'FR', name: 'France', flag: '🇫🇷', weight: 14, locale: 'fr-FR,fr;q=0.9,en;q=0.8', timezone: 'Europe/Paris', ipSample: '194.199.116.10', region: 'Europe', enabled: true, city: 'Paris / Lyon / Marseille', isp: 'Orange / Free SAS', asn: 'AS3215' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', weight: 12, locale: 'nl-NL,nl;q=0.9,en;q=0.8', timezone: 'Europe/Amsterdam', ipSample: '145.220.21.30', region: 'Europe', enabled: true, city: 'Amsterdam / Rotterdam', isp: 'KPN / Ziggo', asn: 'AS1136' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭', weight: 8, locale: 'de-CH,fr-CH;q=0.9,en;q=0.8', timezone: 'Europe/Zurich', ipSample: '130.59.10.15', region: 'Europe', enabled: true, city: 'Zurich / Geneva', isp: 'Swisscom AG', asn: 'AS3303' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪', weight: 7, locale: 'sv-SE,sv;q=0.9,en;q=0.8', timezone: 'Europe/Stockholm', ipSample: '193.10.252.19', region: 'Europe', enabled: true, city: 'Stockholm / Gothenburg', isp: 'Telia Company', asn: 'AS3301' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴', weight: 6, locale: 'no-NO,nb;q=0.9,en;q=0.8', timezone: 'Europe/Oslo', ipSample: '129.240.2.40', region: 'Europe', enabled: true, city: 'Oslo / Bergen', isp: 'Telenor Norge', asn: 'AS2119' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰', weight: 6, locale: 'da-DK,da;q=0.9,en;q=0.8', timezone: 'Europe/Copenhagen', ipSample: '130.225.1.10', region: 'Europe', enabled: true, city: 'Copenhagen', isp: 'TDC Holding', asn: 'AS3292' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮', weight: 5, locale: 'fi-FI,fi;q=0.9,en;q=0.8', timezone: 'Europe/Helsinki', ipSample: '128.214.1.1', region: 'Europe', enabled: true, city: 'Helsinki', isp: 'Elisa Oyj', asn: 'AS719' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪', weight: 6, locale: 'nl-BE,fr-BE;q=0.9,en;q=0.8', timezone: 'Europe/Brussels', ipSample: '134.58.1.1', region: 'Europe', enabled: true, city: 'Brussels / Antwerp', isp: 'Proximus / Telenet', asn: 'AS5432' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹', weight: 6, locale: 'de-AT,de;q=0.9,en;q=0.8', timezone: 'Europe/Vienna', ipSample: '131.130.1.1', region: 'Europe', enabled: true, city: 'Vienna', isp: 'A1 Telekom Austria', asn: 'AS8447' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪', weight: 8, locale: 'en-IE,en-GB;q=0.9,en;q=0.8', timezone: 'Europe/Dublin', ipSample: '137.43.1.20', region: 'Europe', enabled: true, city: 'Dublin / Cork', isp: 'Eircom / Vodafone IE', asn: 'AS5466' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', weight: 10, locale: 'it-IT,it;q=0.9,en;q=0.8', timezone: 'Europe/Rome', ipSample: '151.100.10.2', region: 'Europe', enabled: true, city: 'Milan / Rome', isp: 'Telecom Italia TIM', asn: 'AS3269' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', weight: 10, locale: 'es-ES,es;q=0.9,en;q=0.8', timezone: 'Europe/Madrid', ipSample: '84.88.10.45', region: 'Europe', enabled: true, city: 'Madrid / Barcelona', isp: 'Telefonica Movistar', asn: 'AS3352' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹', weight: 5, locale: 'pt-PT,pt;q=0.9,en;q=0.8', timezone: 'Europe/Lisbon', ipSample: '193.136.1.1', region: 'Europe', enabled: true, city: 'Lisbon / Porto', isp: 'MEO Portugal Telecom', asn: 'AS2860' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱', weight: 7, locale: 'pl-PL,pl;q=0.9,en;q=0.8', timezone: 'Europe/Warsaw', ipSample: '148.81.10.4', region: 'Europe', enabled: true, city: 'Warsaw / Krakow', isp: 'Orange Polska', asn: 'AS5617' },
  { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿', weight: 5, locale: 'cs-CZ,cs;q=0.9,en;q=0.8', timezone: 'Europe/Prague', ipSample: '147.230.1.1', region: 'Europe', enabled: true, city: 'Prague', isp: 'O2 Czech Republic', asn: 'AS5610' },
  { code: 'RO', name: 'Romania', flag: '🇷🇴', weight: 4, locale: 'ro-RO,ro;q=0.9,en;q=0.8', timezone: 'Europe/Bucharest', ipSample: '193.226.1.1', region: 'Europe', enabled: true, city: 'Bucharest', isp: 'Digi RCS & RDS', asn: 'AS8708' },
  { code: 'GR', name: 'Greece', flag: '🇬🇷', weight: 4, locale: 'el-GR,el;q=0.9,en;q=0.8', timezone: 'Europe/Athens', ipSample: '195.130.1.1', region: 'Europe', enabled: true, city: 'Athens', isp: 'OTE Greece', asn: 'AS6799' },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺', weight: 4, locale: 'hu-HU,hu;q=0.9,en;q=0.8', timezone: 'Europe/Budapest', ipSample: '193.224.1.1', region: 'Europe', enabled: true, city: 'Budapest', isp: 'Magyar Telekom', asn: 'AS5483' },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦', weight: 4, locale: 'uk-UA,uk;q=0.9,en;q=0.8', timezone: 'Europe/Kyiv', ipSample: '194.44.1.1', region: 'Europe', enabled: true, city: 'Kyiv / Lviv', isp: 'Kyivstar / Ukrtelecom', asn: 'AS15895' },
  { code: 'BG', name: 'Bulgaria', flag: '🇧🇬', weight: 3, locale: 'bg-BG,bg;q=0.9,en;q=0.8', timezone: 'Europe/Sofia', ipSample: '194.141.1.1', region: 'Europe', enabled: true, city: 'Sofia', isp: 'Vivacom Bulgaria', asn: 'AS8866' },
  { code: 'HR', name: 'Croatia', flag: '🇭🇷', weight: 3, locale: 'hr-HR,hr;q=0.9,en;q=0.8', timezone: 'Europe/Zagreb', ipSample: '193.198.1.1', region: 'Europe', enabled: true, city: 'Zagreb', isp: 'Hrvatski Telekom', asn: 'AS5391' },
  { code: 'SK', name: 'Slovakia', flag: '🇸🇰', weight: 3, locale: 'sk-SK,sk;q=0.9,en;q=0.8', timezone: 'Europe/Bratislava', ipSample: '147.175.1.1', region: 'Europe', enabled: true, city: 'Bratislava', isp: 'Slovak Telekom', asn: 'AS6855' },
  { code: 'LT', name: 'Lithuania', flag: '🇱🇹', weight: 3, locale: 'lt-LT,lt;q=0.9,en;q=0.8', timezone: 'Europe/Vilnius', ipSample: '193.219.1.1', region: 'Europe', enabled: true, city: 'Vilnius', isp: 'Telia Lietuva', asn: 'AS8764' },
  { code: 'LV', name: 'Latvia', flag: '🇱🇻', weight: 3, locale: 'lv-LV,lv;q=0.9,en;q=0.8', timezone: 'Europe/Riga', ipSample: '195.13.1.1', region: 'Europe', enabled: true, city: 'Riga', isp: 'Tet Latvia', asn: 'AS12578' },
  { code: 'EE', name: 'Estonia', flag: '🇪🇪', weight: 3, locale: 'et-EE,et;q=0.9,en;q=0.8', timezone: 'Europe/Tallinn', ipSample: '193.40.1.1', region: 'Europe', enabled: true, city: 'Tallinn', isp: 'Telia Eesti', asn: 'AS3249' },
  { code: 'SI', name: 'Slovenia', flag: '🇸🇮', weight: 3, locale: 'sl-SI,sl;q=0.9,en;q=0.8', timezone: 'Europe/Ljubljana', ipSample: '193.2.1.1', region: 'Europe', enabled: true, city: 'Ljubljana', isp: 'Telekom Slovenije', asn: 'AS34305' },
  { code: 'LU', name: 'Luxembourg', flag: '🇱🇺', weight: 3, locale: 'fr-LU,de-LU;q=0.9,en;q=0.8', timezone: 'Europe/Luxembourg', ipSample: '158.64.1.1', region: 'Europe', enabled: true, city: 'Luxembourg City', isp: 'POST Luxembourg', asn: 'AS6661' },
  { code: 'CY', name: 'Cyprus', flag: '🇨🇾', weight: 2, locale: 'el-CY,en-GB;q=0.9', timezone: 'Asia/Nicosia', ipSample: '194.42.1.1', region: 'Europe', enabled: true, city: 'Nicosia / Limassol', isp: 'Cyta Broadband', asn: 'AS8612' },
  { code: 'IS', name: 'Iceland', flag: '🇮🇸', weight: 2, locale: 'is-IS,en;q=0.9', timezone: 'Atlantic/Reykjavik', ipSample: '130.208.1.1', region: 'Europe', enabled: true, city: 'Reykjavik', isp: 'Siminn Iceland', asn: 'AS6677' },
  { code: 'RS', name: 'Serbia', flag: '🇷🇸', weight: 3, locale: 'sr-RS,sr;q=0.9,en;q=0.8', timezone: 'Europe/Belgrade', ipSample: '147.91.1.1', region: 'Europe', enabled: true, city: 'Belgrade', isp: 'Telekom Srbija', asn: 'AS8400' },

  // ================= ASIA =================
  { code: 'JP', name: 'Japan', flag: '🇯🇵', weight: 15, locale: 'ja-JP,ja;q=0.9,en-US;q=0.8', timezone: 'Asia/Tokyo', ipSample: '133.242.18.23', region: 'Asia', enabled: true, city: 'Tokyo / Osaka', isp: 'NTT OCN / KDDI au Hikari', asn: 'AS4713' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', weight: 10, locale: 'ko-KR,ko;q=0.9,en;q=0.8', timezone: 'Asia/Seoul', ipSample: '147.46.10.25', region: 'Asia', enabled: true, city: 'Seoul / Busan', isp: 'KT Telecom / SK Broadband', asn: 'AS4766' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', weight: 10, locale: 'en-SG,en;q=0.9,zh-CN;q=0.8', timezone: 'Asia/Singapore', ipSample: '202.166.192.3', region: 'Asia', enabled: true, city: 'Singapore', isp: 'Singtel / StarHub', asn: 'AS7473' },
  { code: 'IN', name: 'India', flag: '🇮🇳', weight: 14, locale: 'en-IN,en;q=0.9,hi;q=0.8', timezone: 'Asia/Kolkata', ipSample: '103.251.168.10', region: 'Asia', enabled: true, city: 'Mumbai / Bangalore / Delhi', isp: 'Reliance Jio / Airtel', asn: 'AS55836' },
  { code: 'HK', name: 'Hong Kong', flag: '🇭🇰', weight: 7, locale: 'zh-HK,zh;q=0.9,en;q=0.8', timezone: 'Asia/Hong_Kong', ipSample: '143.89.1.1', region: 'Asia', enabled: true, city: 'Hong Kong', isp: 'HKT Netvigator', asn: 'AS4760' },
  { code: 'TW', name: 'Taiwan', flag: '🇹🇼', weight: 7, locale: 'zh-TW,zh;q=0.9,en;q=0.8', timezone: 'Asia/Taipei', ipSample: '140.112.1.1', region: 'Asia', enabled: true, city: 'Taipei', isp: 'Chunghwa Telecom', asn: 'AS3462' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩', weight: 8, locale: 'id-ID,id;q=0.9,en;q=0.8', timezone: 'Asia/Jakarta', ipSample: '152.118.1.1', region: 'Asia', enabled: true, city: 'Jakarta / Surabaya', isp: 'Telkom Indonesia (IndiHome)', asn: 'AS7713' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', weight: 6, locale: 'ms-MY,en-MY;q=0.9,en;q=0.8', timezone: 'Asia/Kuala_Lumpur', ipSample: '161.142.1.1', region: 'Asia', enabled: true, city: 'Kuala Lumpur', isp: 'Telekom Malaysia (Unifi)', asn: 'AS4788' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭', weight: 6, locale: 'th-TH,th;q=0.9,en;q=0.8', timezone: 'Asia/Bangkok', ipSample: '161.200.1.1', region: 'Asia', enabled: true, city: 'Bangkok', isp: 'AIS Fibre / True Corp', asn: 'AS133481' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳', weight: 6, locale: 'vi-VN,vi;q=0.9,en;q=0.8', timezone: 'Asia/Ho_Chi_Minh', ipSample: '118.69.1.1', region: 'Asia', enabled: true, city: 'Ho Chi Minh City / Hanoi', isp: 'VNPT / Viettel', asn: 'AS45899' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭', weight: 6, locale: 'en-PH,fil;q=0.9,en;q=0.8', timezone: 'Asia/Manila', ipSample: '121.54.1.1', region: 'Asia', enabled: true, city: 'Manila', isp: 'PLDT Home / Globe', asn: 'AS9299' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰', weight: 5, locale: 'en-PK,ur;q=0.9', timezone: 'Asia/Karachi', ipSample: '111.92.1.1', region: 'Asia', enabled: true, city: 'Karachi / Lahore', isp: 'PTCL Pakistan', asn: 'AS17557' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩', weight: 4, locale: 'bn-BD,en;q=0.9', timezone: 'Asia/Dhaka', ipSample: '103.4.1.1', region: 'Asia', enabled: true, city: 'Dhaka', isp: 'Grameenphone / BTCL', asn: 'AS24389' },
  { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰', weight: 3, locale: 'en-LK,si;q=0.9', timezone: 'Asia/Colombo', ipSample: '192.248.1.1', region: 'Asia', enabled: true, city: 'Colombo', isp: 'Sri Lanka Telecom (SLT)', asn: 'AS9329' },
  { code: 'NP', name: 'Nepal', flag: '🇳🇵', weight: 3, locale: 'ne-NP,en;q=0.9', timezone: 'Asia/Kathmandu', ipSample: '202.45.1.1', region: 'Asia', enabled: true, city: 'Kathmandu', isp: 'WorldLink Nepal', asn: 'AS17501' },
  { code: 'KZ', name: 'Kazakhstan', flag: '🇰🇿', weight: 4, locale: 'ru-KZ,kk;q=0.9', timezone: 'Asia/Almaty', ipSample: '178.88.1.1', region: 'Asia', enabled: true, city: 'Almaty / Astana', isp: 'Kazakhtelecom', asn: 'AS9198' },
  { code: 'UZ', name: 'Uzbekistan', flag: '🇺🇿', weight: 3, locale: 'uz-UZ,ru;q=0.9', timezone: 'Asia/Tashkent', ipSample: '84.54.1.1', region: 'Asia', enabled: true, city: 'Tashkent', isp: 'Uztelecom', asn: 'AS8193' },
  { code: 'GE', name: 'Georgia', flag: '🇬🇪', weight: 3, locale: 'ka-GE,en;q=0.9', timezone: 'Asia/Tbilisi', ipSample: '185.70.1.1', region: 'Asia', enabled: true, city: 'Tbilisi', isp: 'Silknet Georgia', asn: 'AS35805' },
  { code: 'AM', name: 'Armenia', flag: '🇦🇲', weight: 2, locale: 'hy-AM,ru;q=0.9', timezone: 'Asia/Yerevan', ipSample: '185.115.1.1', region: 'Asia', enabled: true, city: 'Yerevan', isp: 'Telecom Armenia Ucom', asn: 'AS44395' },
  { code: 'AZ', name: 'Azerbaijan', flag: '🇦🇿', weight: 3, locale: 'az-AZ,en;q=0.9', timezone: 'Asia/Baku', ipSample: '185.12.1.1', region: 'Asia', enabled: true, city: 'Baku', isp: 'Aztelekom', asn: 'AS29049' },

  // ================= MIDDLE EAST =================
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', weight: 10, locale: 'en-AE,ar-AE;q=0.9,en;q=0.8', timezone: 'Asia/Dubai', ipSample: '86.96.200.12', region: 'Middle East', enabled: true, city: 'Dubai / Abu Dhabi', isp: 'Etisalat / du', asn: 'AS5384' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', weight: 9, locale: 'ar-SA,ar;q=0.9,en;q=0.8', timezone: 'Asia/Riyadh', ipSample: '212.138.1.1', region: 'Middle East', enabled: true, city: 'Riyadh / Jeddah', isp: 'STC Saudi Telecom', asn: 'AS25019' },
  { code: 'IL', name: 'Israel', flag: '🇮🇱', weight: 8, locale: 'he-IL,he;q=0.9,en-US;q=0.8', timezone: 'Asia/Jerusalem', ipSample: '192.114.1.1', region: 'Middle East', enabled: true, city: 'Tel Aviv / Jerusalem', isp: 'Bezeq The Israel Telecom', asn: 'AS8551' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷', weight: 8, locale: 'tr-TR,tr;q=0.9,en;q=0.8', timezone: 'Europe/Istanbul', ipSample: '194.27.1.1', region: 'Middle East', enabled: true, city: 'Istanbul / Ankara', isp: 'Turk Telekom', asn: 'AS9121' },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦', weight: 6, locale: 'en-QA,ar-QA;q=0.9,en;q=0.8', timezone: 'Asia/Qatar', ipSample: '89.211.1.1', region: 'Middle East', enabled: true, city: 'Doha', isp: 'Ooredoo Qatar / Vodafone', asn: 'AS8781' },
  { code: 'KW', name: 'Kuwait', flag: '🇰🇼', weight: 5, locale: 'ar-KW,en;q=0.9', timezone: 'Asia/Kuwait', ipSample: '62.215.1.1', region: 'Middle East', enabled: true, city: 'Kuwait City', isp: 'Zain Kuwait / STC', asn: 'AS9155' },
  { code: 'OM', name: 'Oman', flag: '🇴🇲', weight: 4, locale: 'ar-OM,en;q=0.9', timezone: 'Asia/Muscat', ipSample: '85.154.1.1', region: 'Middle East', enabled: true, city: 'Muscat', isp: 'Omantel', asn: 'AS8529' },
  { code: 'BH', name: 'Bahrain', flag: '🇧🇭', weight: 4, locale: 'ar-BH,en;q=0.9', timezone: 'Asia/Bahrain', ipSample: '178.239.1.1', region: 'Middle East', enabled: true, city: 'Manama', isp: 'Batelco Bahrain', asn: 'AS5416' },
  { code: 'JO', name: 'Jordan', flag: '🇯🇴', weight: 4, locale: 'ar-JO,en;q=0.9', timezone: 'Asia/Amman', ipSample: '82.212.1.1', region: 'Middle East', enabled: true, city: 'Amman', isp: 'Orange Jordan / Zain', asn: 'AS9038' },
  { code: 'LB', name: 'Lebanon', flag: '🇱🇧', weight: 3, locale: 'ar-LB,fr-LB;q=0.9,en;q=0.8', timezone: 'Asia/Beirut', ipSample: '185.13.1.1', region: 'Middle East', enabled: true, city: 'Beirut', isp: 'OGERO Telecom', asn: 'AS42314' },

  // ================= AFRICA =================
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', weight: 8, locale: 'en-ZA,en;q=0.9,af;q=0.8', timezone: 'Africa/Johannesburg', ipSample: '196.25.1.1', region: 'Africa', enabled: true, city: 'Johannesburg / Cape Town', isp: 'Telkom SA / Vodacom', asn: 'AS37457' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', weight: 8, locale: 'en-NG,en;q=0.9', timezone: 'Africa/Lagos', ipSample: '197.210.1.1', region: 'Africa', enabled: true, city: 'Lagos / Abuja', isp: 'MTN Nigeria / MainOne', asn: 'AS29465' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬', weight: 6, locale: 'ar-EG,ar;q=0.9,en;q=0.8', timezone: 'Africa/Cairo', ipSample: '193.227.1.1', region: 'Africa', enabled: true, city: 'Cairo / Alexandria', isp: 'Telecom Egypt TE Data', asn: 'AS8452' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', weight: 6, locale: 'en-KE,sw;q=0.9', timezone: 'Africa/Nairobi', ipSample: '196.201.214.1', region: 'Africa', enabled: true, city: 'Nairobi', isp: 'Safaricom Home Fibre', asn: 'AS37061' },
  { code: 'MA', name: 'Morocco', flag: '🇲🇦', weight: 5, locale: 'fr-MA,ar-MA;q=0.9,en;q=0.8', timezone: 'Africa/Casablanca', ipSample: '196.200.1.1', region: 'Africa', enabled: true, city: 'Casablanca / Rabat', isp: 'Maroc Telecom', asn: 'AS6713' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭', weight: 4, locale: 'en-GH,en;q=0.9', timezone: 'Africa/Accra', ipSample: '196.201.32.1', region: 'Africa', enabled: true, city: 'Accra', isp: 'MTN Ghana / Vodafone', asn: 'AS30987' },
  { code: 'DZ', name: 'Algeria', flag: '🇩🇿', weight: 4, locale: 'fr-DZ,ar-DZ;q=0.9', timezone: 'Africa/Algiers', ipSample: '197.200.1.1', region: 'Africa', enabled: true, city: 'Algiers', isp: 'Algerie Telecom', asn: 'AS36947' },
  { code: 'TN', name: 'Tunisia', flag: '🇹🇳', weight: 4, locale: 'fr-TN,ar-TN;q=0.9', timezone: 'Africa/Tunis', ipSample: '196.203.1.1', region: 'Africa', enabled: true, city: 'Tunis', isp: 'Tunisie Telecom', asn: 'AS2609' },
  { code: 'ET', name: 'Ethiopia', flag: '🇪🇹', weight: 3, locale: 'am-ET,en;q=0.9', timezone: 'Africa/Addis_Ababa', ipSample: '197.156.1.1', region: 'Africa', enabled: true, city: 'Addis Ababa', isp: 'Ethio Telecom', asn: 'AS24757' },
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿', weight: 3, locale: 'en-TZ,sw;q=0.9', timezone: 'Africa/Dar_es_Salaam', ipSample: '196.192.1.1', region: 'Africa', enabled: true, city: 'Dar es Salaam', isp: 'Vodacom Tanzania', asn: 'AS36908' },
  { code: 'UG', name: 'Uganda', flag: '🇺🇬', weight: 3, locale: 'en-UG,en;q=0.9', timezone: 'Africa/Kampala', ipSample: '196.43.1.1', region: 'Africa', enabled: true, city: 'Kampala', isp: 'MTN Uganda', asn: 'AS20294' },
  { code: 'CI', name: 'Ivory Coast', flag: '🇨🇮', weight: 3, locale: 'fr-CI,fr;q=0.9', timezone: 'Africa/Abidjan', ipSample: '196.201.80.1', region: 'Africa', enabled: true, city: 'Abidjan', isp: 'Orange Côte d\'Ivoire', asn: 'AS36924' },
  { code: 'SN', name: 'Senegal', flag: '🇸🇳', weight: 3, locale: 'fr-SN,fr;q=0.9', timezone: 'Africa/Dakar', ipSample: '196.207.1.1', region: 'Africa', enabled: true, city: 'Dakar', isp: 'Sonatel Senegal', asn: 'AS8346' },
  { code: 'RW', name: 'Rwanda', flag: '🇷🇼', weight: 2, locale: 'en-RW,fr;q=0.9', timezone: 'Africa/Kigali', ipSample: '197.243.1.1', region: 'Africa', enabled: true, city: 'Kigali', isp: 'Liquid Telecom Rwanda', asn: 'AS37075' },
  { code: 'MU', name: 'Mauritius', flag: '🇲🇺', weight: 2, locale: 'en-MU,fr;q=0.9', timezone: 'Indian/Mauritius', ipSample: '196.223.1.1', region: 'Africa', enabled: true, city: 'Port Louis', isp: 'Mauritius Telecom', asn: 'AS23889' },

  // ================= OCEANIA =================
  { code: 'AU', name: 'Australia', flag: '🇦🇺', weight: 14, locale: 'en-AU,en-GB;q=0.9,en;q=0.8', timezone: 'Australia/Sydney', ipSample: '139.130.4.5', region: 'Oceania', enabled: true, city: 'Sydney / Melbourne', isp: 'Telstra / Optus Residential', asn: 'AS1221' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', weight: 7, locale: 'en-NZ,en-GB;q=0.9,en;q=0.8', timezone: 'Pacific/Auckland', ipSample: '130.216.1.1', region: 'Oceania', enabled: true, city: 'Auckland / Wellington', isp: 'Spark New Zealand', asn: 'AS4771' },
  { code: 'FJ', name: 'Fiji', flag: '🇫🇯', weight: 2, locale: 'en-FJ,en;q=0.9', timezone: 'Pacific/Fiji', ipSample: '202.62.1.1', region: 'Oceania', enabled: true, city: 'Suva', isp: 'Telecom Fiji / Vodafone', asn: 'AS10143' },
  { code: 'PG', name: 'Papua New Guinea', flag: '🇵🇬', weight: 2, locale: 'en-PG,en;q=0.9', timezone: 'Pacific/Port_Moresby', ipSample: '202.138.1.1', region: 'Oceania', enabled: true, city: 'Port Moresby', isp: 'Telikom PNG', asn: 'AS17839' },
  { code: 'WS', name: 'Samoa', flag: '🇼🇸', weight: 2, locale: 'en-WS,sm;q=0.9', timezone: 'Pacific/Apia', ipSample: '202.175.1.1', region: 'Oceania', enabled: true, city: 'Apia', isp: 'Samoa Telecom', asn: 'AS18105' },
];

export const DEFAULT_ORGANIC_CONFIG: OrganicVisitorConfig = {
  id: 'organic_default',
  name: 'Organic Search & Social Traffic Campaign',
  targetUrl: 'https://9jajobs.vercel.app',
  crawlSettings: {
    maxDepth: 4,
    maxLinks: 500,
  },
  organic: {
    sourceShares: {
      organicSearch: 50,
      socialMedia: 30,
      direct: 15,
      referral: 5,
    },
    searchEngines: {
      google: 75,
      bing: 15,
      duckduckgo: 5,
      yahoo: 3,
      baidu: 1,
      yandex: 1,
    },
    keywords: [
      'best web performance monitoring tools',
      'fast api traffic simulator 2026',
      'modern site reliability testing',
      'how to optimize web vitals score',
      'top load testing software',
      'autonomous website visitor crawler',
      'cloud infrastructure stress benchmark',
      'synthetic user analytics simulation',
      'high concurrency performance metrics',
      'organic search ranking booster'
    ],
    socialNetworks: {
      twitter: 35,
      linkedin: 25,
      reddit: 20,
      facebook: 10,
      instagram: 6,
      youtube: 4,
      tiktok: 0,
      pinterest: 0,
    },
    customReferrers: [
      { id: 'ref_techcrunch', domain: 'techcrunch.com', url: 'https://techcrunch.com/features/cloud-infrastructure-tools', weight: 40 },
      { id: 'ref_newsycombinator', domain: 'news.ycombinator.com', url: 'https://news.ycombinator.com/item?id=38910245', weight: 35 },
      { id: 'ref_medium', domain: 'medium.com', url: 'https://medium.com/better-programming/scale-traffic-testing', weight: 25 }
    ],
    forceGoogleSearchOnAllLinks: true, // Default: Google Search referrer on all posts, pages and sublinks
    googleReferrerMode: 'country_localized', // Default: Localized Google search domain per country (e.g. google.co.uk, google.de, google.fr)
    autoGenerateKeywordFromPageTitle: true, // Auto-derive authentic search queries from post titles & slugs
    utmConfig: {
      enabled: false,
      utmSource: 'organic_boost',
      utmMedium: 'social_referral',
      utmCampaign: 'trafficpulse_launch',
      utmTerm: 'cloud_infra',
      utmContent: 'hero_cta',
    },
  },
  behavior: {
    targetTotalVisits: 0, // 0 = continuous / unlimited
    targetTotalPageViews: 0, // 0 = continuous / unlimited
    minDwellSeconds: 30,
    maxDwellSeconds: 95,
    pauseBetweenPagesSeconds: 4, // 4s reading pause before next page transition
    pauseBetweenVisitsSeconds: 3, // 3s pacing interval between visitor launches
    simulatePageReload: true, // Human page reload (F5 / Refresh)
    pageReloadProbabilityPct: 20, // 20% natural page reload rate
    minPagesPerVisit: 2,
    maxPagesPerVisit: 5,
    bounceRatePct: 20,
    simulateScroll: true,
    scrollMinDepthPct: 50,
    scrollMaxDepthPct: 98,
    scrollToEndOfPage: true, // Scroll all the way to 95%-100% bottom of post
    footerDwellPauseSeconds: 5, // Pause at bottom comments/footer
    simulateRandomClicks: true,
    minClicksPerPage: 1,
    maxClicksPerPage: 4,
    
    // In-Article Post Links (at least 2 links clicked)
    simulateArticleLinks: true,
    minArticleLinksClicked: 2,
    maxArticleLinksClicked: 4,
    articleLinkTypes: {
      inContentHyperlinks: true,
      relatedPostsLinks: true,
      tableOfContentsLinks: true,
      authorCitations: true,
    },

    // Ads Click Engine (Banner Ads, Popup Ads, Native/Sticky)
    simulateAdClicks: true,
    minAdClicksPerPage: 1,
    maxAdClicksPerPage: 2,
    adClickThroughRatePct: 75,
    clickBannerAds: true,
    clickPopupAds: true,
    clickNativeAds: true,
    clickStickyAds: true,
    popupAction: 'click_and_close',

    simulateMouseMovement: true,
    newVsReturningRatio: 75,
    pageRepetitionMode: 'strict_unique', // Strict non-repetition (unique pages) vs Allow repetition
    visitorRetentionMode: 'unique_only', // 100% Unique visitors vs returning user mix
    distinctCatalogTraversal: true, // Traverse full crawled catalog without repetition before looping
    realTimeSpeedMultiplier: 5, // default 5x acceleration for rich telemetry
    activeConcurrentVisitors: 8,
    sessionPacingJitter: 30,
    mobileFirstMode: true, // Enable mobile-first execution mode by default for reliable lightweight delivery
    lightweightPayloads: true, // Compact GA4 query payloads for ultra-low latency mobile delivery
    reduceMobileThreadUsage: true, // Throttles heavy animations to preserve mobile battery & JS execution thread
  },
  fingerprint: {
    enableAntiFingerprint: true,
    geoMode: 'random_worldwide', // Random visit from different region and country
    countryRepetitionMode: 'round_robin_distinct', // Non-repetition country rotation
    countries: GLOBAL_COUNTRIES,
    devices: {
      desktopChromeWin: 38,
      desktopChromeMac: 22,
      desktopSafariMac: 15,
      desktopEdgeWin: 8,
      mobileIosSafari: 10,
      mobileAndroidChrome: 5,
      desktopFirefox: 2,
    },
    randomizeScreenResolutions: true,
    maskCanvasAudioContext: true,
    spoofClientHints: true,
    injectGeoHeaders: true,
    simulateCookiePersistence: true,
    proxyEngine: DEFAULT_PROXY_ENGINE,
  },
  ga4: {
    autoSendMeasurementProtocol: true,
    measurementId: 'G-VFY5E884EH',
    apiSecret: '',
    sendScrollEvents: true,
    sendEngagementEvents: true,
    sendSessionEvents: true,
  },
  durationMinutes: 60,
};

export const ORGANIC_PRESETS: {
  id: string;
  name: string;
  badge: string;
  description: string;
  config: Partial<OrganicVisitorConfig>;
}[] = [
  {
    id: 'seo_high_intent',
    name: 'High-Intent Google Organic Inbound',
    badge: 'Search Focused',
    description: 'High search volume with realistic dwell times (40s-120s), low bounce rate, and natural multi-page content exploration.',
    config: {
      organic: {
        ...DEFAULT_ORGANIC_CONFIG.organic,
        sourceShares: { organicSearch: 75, socialMedia: 15, direct: 8, referral: 2 },
        searchEngines: { google: 85, bing: 10, duckduckgo: 5, yahoo: 0, baidu: 0, yandex: 0 },
      },
      behavior: {
        ...DEFAULT_ORGANIC_CONFIG.behavior,
        minDwellSeconds: 35,
        maxDwellSeconds: 110,
        minPagesPerVisit: 3,
        maxPagesPerVisit: 6,
        bounceRatePct: 18,
      }
    }
  },
  {
    id: 'viral_social_buzz',
    name: 'Viral Social Spike (X, Reddit & LinkedIn)',
    badge: 'Viral Traffic',
    description: 'Heavy social media referral shares with dynamic entry parameters and mobile-heavy device distribution.',
    config: {
      organic: {
        ...DEFAULT_ORGANIC_CONFIG.organic,
        sourceShares: { organicSearch: 20, socialMedia: 65, direct: 10, referral: 5 },
        socialNetworks: { twitter: 45, reddit: 30, linkedin: 15, facebook: 5, instagram: 5, youtube: 0, tiktok: 0, pinterest: 0 },
      },
      behavior: {
        ...DEFAULT_ORGANIC_CONFIG.behavior,
        minDwellSeconds: 20,
        maxDwellSeconds: 65,
        minPagesPerVisit: 2,
        maxPagesPerVisit: 4,
        bounceRatePct: 32,
      },
      fingerprint: {
        ...DEFAULT_ORGANIC_CONFIG.fingerprint,
        devices: {
          desktopChromeWin: 20,
          desktopChromeMac: 15,
          desktopSafariMac: 10,
          desktopEdgeWin: 5,
          mobileIosSafari: 30,
          mobileAndroidChrome: 18,
          desktopFirefox: 2,
        }
      }
    }
  },
  {
    id: 'global_authority_geo',
    name: 'Worldwide Multi-Country Geographic Blend',
    badge: 'Global Geo',
    description: 'Evenly balanced multi-region visitors across North America, Europe, Asia Pacific, and Latin America.',
    config: {
      organic: {
        ...DEFAULT_ORGANIC_CONFIG.organic,
        sourceShares: { organicSearch: 45, socialMedia: 30, direct: 20, referral: 5 },
      },
      fingerprint: {
        ...DEFAULT_ORGANIC_CONFIG.fingerprint,
        countries: GLOBAL_COUNTRIES.map(c => ({ ...c, weight: 10 })),
      }
    }
  },
  {
    id: 'deep_dwell_saas',
    name: 'Deep-Dwell Product & Pricing Exploration',
    badge: 'High Engagement',
    description: 'Extended dwell times (60s-180s per page), 90%+ scroll depth, multiple sub-page traversals, ideal for boosting analytics engagement metrics.',
    config: {
      behavior: {
        ...DEFAULT_ORGANIC_CONFIG.behavior,
        minDwellSeconds: 50,
        maxDwellSeconds: 150,
        minPagesPerVisit: 3,
        maxPagesPerVisit: 7,
        bounceRatePct: 12,
        scrollMinDepthPct: 60,
        scrollMaxDepthPct: 98,
      }
    }
  },
  {
    id: 'article_ad_monetization',
    name: 'Post Article Reader + Ads & In-Article Links Clicker',
    badge: 'Ads & Post Links',
    description: 'Deep article reader that systematically scrolls to 100% footer, clicks at least 2 in-post links, and clicks banners, popup overlays, and native ads.',
    config: {
      behavior: {
        ...DEFAULT_ORGANIC_CONFIG.behavior,
        minDwellSeconds: 45,
        maxDwellSeconds: 120,
        scrollToEndOfPage: true,
        footerDwellPauseSeconds: 6,
        simulateArticleLinks: true,
        minArticleLinksClicked: 2,
        maxArticleLinksClicked: 4,
        simulateAdClicks: true,
        minAdClicksPerPage: 2,
        maxAdClicksPerPage: 3,
        adClickThroughRatePct: 85,
        clickBannerAds: true,
        clickPopupAds: true,
        clickNativeAds: true,
        clickStickyAds: true,
        popupAction: 'click_and_close',
      }
    }
  }
];
