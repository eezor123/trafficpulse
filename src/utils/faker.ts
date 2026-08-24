import { DeviceDistribution } from '../types';

export const USER_AGENTS = {
  desktopChrome: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  ],
  desktopSafari: [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_3_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3.1 Safari/605.1.15',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Safari/605.1.15'
  ],
  mobileIos: [
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_7_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148'
  ],
  mobileAndroid: [
    'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.64 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.6167.143 Mobile Safari/537.36'
  ],
  botCrawler: [
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
    'curl/8.4.0',
    'python-requests/2.31.0'
  ]
};

const FIRST_NAMES = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Sam', 'Chris', 'Pat', 'Avery'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Wilson', 'Anderson', 'Taylor'];
const CITIES = ['New York', 'London', 'Tokyo', 'San Francisco', 'Berlin', 'Paris', 'Singapore', 'Sydney', 'Toronto', 'Amsterdam'];
const SEARCH_QUERIES = ['wireless earbuds', 'laptop stand', 'mechanical keyboard', 'usb-c hub', 'standing desk', '4k monitor', 'ergonomic mouse'];

export function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

export function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateRandomIp(): string {
  return `${getRandomInt(11, 220)}.${getRandomInt(1, 254)}.${getRandomInt(1, 254)}.${getRandomInt(1, 254)}`;
}

export function generateUserAgent(distribution: DeviceDistribution): string {
  const total =
    distribution.desktopChrome +
    distribution.desktopSafari +
    distribution.mobileIos +
    distribution.mobileAndroid +
    distribution.botCrawler;

  if (total === 0) return USER_AGENTS.desktopChrome[0];

  const rand = Math.random() * total;
  let running = 0;

  running += distribution.desktopChrome;
  if (rand < running) return getRandomElement(USER_AGENTS.desktopChrome);

  running += distribution.desktopSafari;
  if (rand < running) return getRandomElement(USER_AGENTS.desktopSafari);

  running += distribution.mobileIos;
  if (rand < running) return getRandomElement(USER_AGENTS.mobileIos);

  running += distribution.mobileAndroid;
  if (rand < running) return getRandomElement(USER_AGENTS.mobileAndroid);

  return getRandomElement(USER_AGENTS.botCrawler);
}

export function substituteTemplateVariables(template: string, customContext: Record<string, string> = {}): string {
  if (!template) return '';

  let output = template;

  // Substitute custom context variables first
  for (const [key, value] of Object.entries(customContext)) {
    const reg = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    output = output.replace(reg, value);
  }

  // Built-in generators
  output = output.replace(/{{\s*uuid\s*}}/gi, () => crypto.randomUUID());
  output = output.replace(/{{\s*timestamp\s*}}/gi, () => Date.now().toString());
  output = output.replace(/{{\s*iso_date\s*}}/gi, () => new Date().toISOString());
  output = output.replace(/{{\s*random_email\s*}}/gi, () => {
    const fn = getRandomElement(FIRST_NAMES).toLowerCase();
    const ln = getRandomElement(LAST_NAMES).toLowerCase();
    const num = getRandomInt(10, 999);
    return `${fn}.${ln}${num}@example.com`;
  });
  output = output.replace(/{{\s*random_name\s*}}/gi, () => `${getRandomElement(FIRST_NAMES)} ${getRandomElement(LAST_NAMES)}`);
  output = output.replace(/{{\s*random_city\s*}}/gi, () => getRandomElement(CITIES));
  output = output.replace(/{{\s*random_search\s*}}/gi, () => getRandomElement(SEARCH_QUERIES));
  output = output.replace(/{{\s*random_sku\s*}}/gi, () => `SKU-${getRandomInt(1000, 9999)}-${getRandomElement(['A', 'B', 'X', 'Z'])}`);
  output = output.replace(/{{\s*random_ip\s*}}/gi, () => generateRandomIp());

  // Pattern: {{random_int_MIN_MAX}} e.g. {{random_int_1_100}} or {{random_int}}
  output = output.replace(/{{\s*random_int(?:_(\d+)_(\d+))?\s*}}/gi, (_, minStr, maxStr) => {
    const min = minStr ? parseInt(minStr, 10) : 1;
    const max = maxStr ? parseInt(maxStr, 10) : 1000;
    return getRandomInt(min, max).toString();
  });

  // Pattern: {{random_choice:opt1|opt2|opt3}}
  output = output.replace(/{{\s*random_choice:\s*([^}]+)\s*}}/gi, (_, choicesStr) => {
    const choices = choicesStr.split('|').map((s: string) => s.trim());
    return getRandomElement(choices);
  });

  return output;
}
