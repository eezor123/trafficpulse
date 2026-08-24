import { CrawledPage } from '../types';

export interface ParsedJobItem {
  title: string;
  category?: string;
  location?: string;
  salary?: string;
  description?: string;
  contact?: string;
  path: string;
}

/**
 * Parses raw copied text from Nigerian job portals, forums, WhatsApp broadcasts, or CMS feeds
 * into structured job items with clean routes.
 */
export function parseRawJobText(rawText: string, origin: string = 'https://9jajobs.vercel.app'): CrawledPage[] {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  const items: ParsedJobItem[] = [];

  let currentCategory = '';
  let currentLocation = '';
  let currentSalary = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if line is a metadata header line like: "Software & Web Development📍 Lagos (Ikeja)₦150,000 - ₦300,000"
    // or "Virtual Assistance & Admin Support📍 Rivers (Port Harcourt)₦150,000 - ₦300,000"
    if (line.includes('📍') || line.includes('₦') || line.includes('N') && /\b(Lagos|Abuja|Port Harcourt|Rivers|Enugu|Ibadan|Kano|Kaduna|Imo|Delta)\b/i.test(line)) {
      const pinParts = line.split('📍');
      if (pinParts.length > 1) {
        currentCategory = pinParts[0].trim();
        const remainder = pinParts[1].trim();
        // Look for Naira symbol
        const nairaIdx = remainder.search(/[₦#N\d]/);
        if (nairaIdx !== -1) {
          currentLocation = remainder.slice(0, nairaIdx).trim();
          currentSalary = remainder.slice(nairaIdx).trim();
        } else {
          currentLocation = remainder;
          currentSalary = '';
        }
      }
      continue;
    }

    // Check if line looks like a title:
    // Usually shorter than 120 chars, doesn't contain boilerplate headers
    if (
      line.length > 10 && 
      !line.startsWith('Job Listings Management') &&
      !line.startsWith('Edit titles') &&
      !line.startsWith('Looking for') &&
      !line.startsWith('Urgent Recruitment Job Title:')
    ) {
      const title = line.replace(/^Job Title:\s*/i, '').trim();
      let description = '';
      let contact = '';

      // Check if next line is a description or contact
      if (i + 1 < lines.length && !lines[i + 1].includes('📍') && lines[i + 1].length > 15) {
        description = lines[i + 1];
        i++; // consume description line
      }

      // Check for phone/contact in description or title
      const phoneMatch = (title + ' ' + description).match(/\b(?:080|081|090|091|070)\d{8}\b/);
      if (phoneMatch) contact = phoneMatch[0];

      // Generate slug
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 50);

      items.push({
        title,
        category: currentCategory || 'Job Listing',
        location: currentLocation || 'Nigeria',
        salary: currentSalary || 'Negotiable',
        description: description || title,
        contact,
        path: `/?job=${slug || 'job_' + (items.length + 1)}`,
      });
    }
  }

  // Convert to CrawledPage objects
  const rootOrigin = origin.replace(/\/$/, '');
  return items.map((item, idx) => ({
    id: `custom_pasted_${idx + 1}_${Date.now()}`,
    url: `${rootOrigin}${item.path}`,
    path: item.path,
    title: item.title,
    description: `[${item.location}] ${item.salary} • ${item.category}: ${item.description.slice(0, 90)}...`,
    depth: 1,
    status: 200,
    includedInVisits: true,
    visitWeight: 96,
    gaDetected: true,
    category: 'post',
  }));
}
