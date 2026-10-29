import { ParseResult, SalesOrder } from '../types';

export const REQUIRED_COLUMNS = [
  'quarter',
  'region',
  'channel',
  'product',
  'units',
  'discount_pct',
  'revenue',
];

/**
 * Standard RFC-4180 compliant CSV line tokenizer that supports quotes,
 * commas inside quotes, and escaped quotes.
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Normalize header names to match standard schema
 */
function normalizeHeaderName(header: string): string {
  const clean = header
    .toLowerCase()
    .trim()
    .replace(/[\s\-_]+/g, '_')
    .replace(/[^a-z0-9_]/g, '');

  if (clean.includes('discount')) return 'discount_pct';
  if (clean.includes('rev')) return 'revenue';
  if (clean.includes('unit')) return 'units';
  if (clean.includes('prod')) return 'product';
  if (clean.includes('reg')) return 'region';
  if (clean.includes('quart') || clean === 'qtr') return 'quarter';
  if (clean.includes('chan')) return 'channel';

  return clean;
}

export function parseSalesCSV(csvContent: string): ParseResult {
  const lines = csvContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return {
      orders: [],
      errors: ['The uploaded CSV file is completely empty.'],
      headersDetected: [],
    };
  }

  const rawHeaders = parseCSVLine(lines[0]);
  const normalizedHeaders = rawHeaders.map(normalizeHeaderName);

  // Check required columns
  const missingColumns = REQUIRED_COLUMNS.filter(
    (col) => !normalizedHeaders.includes(col)
  );

  if (missingColumns.length > 0) {
    return {
      orders: [],
      errors: [
        `Missing required column(s): ${missingColumns.join(', ')}.`,
        `Expected columns: ${REQUIRED_COLUMNS.join(', ')}.`,
        `Found headers: ${rawHeaders.join(', ')}.`,
      ],
      headersDetected: rawHeaders,
    };
  }

  const colIdx = {
    quarter: normalizedHeaders.indexOf('quarter'),
    region: normalizedHeaders.indexOf('region'),
    channel: normalizedHeaders.indexOf('channel'),
    product: normalizedHeaders.indexOf('product'),
    units: normalizedHeaders.indexOf('units'),
    discount_pct: normalizedHeaders.indexOf('discount_pct'),
    revenue: normalizedHeaders.indexOf('revenue'),
  };

  const orders: SalesOrder[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rawTokens = parseCSVLine(lines[i]);
    if (rawTokens.length < rawHeaders.length && rawTokens.every((t) => t === '')) {
      continue; // empty row
    }

    const quarterRaw = (rawTokens[colIdx.quarter] || '').trim().toUpperCase();
    const regionRaw = (rawTokens[colIdx.region] || '').trim();
    const channelRaw = (rawTokens[colIdx.channel] || '').trim();
    const productRaw = (rawTokens[colIdx.product] || '').trim();

    // Clean units
    const unitsStr = (rawTokens[colIdx.units] || '').replace(/[^0-9.-]/g, '');
    const units = parseFloat(unitsStr);

    // Clean discount_pct
    const discountStr = (rawTokens[colIdx.discount_pct] || '').replace(/[^0-9.-]/g, '');
    let discountPct = parseFloat(discountStr);
    if (!isNaN(discountPct)) {
      if (rawTokens[colIdx.discount_pct].includes('%') || discountPct > 1) {
        discountPct = discountPct / 100;
      }
    } else {
      discountPct = 0;
    }

    // Clean revenue
    const revenueStr = (rawTokens[colIdx.revenue] || '').replace(/[^0-9.-]/g, '');
    const revenue = parseFloat(revenueStr);

    if (!quarterRaw || !regionRaw) {
      errors.push(`Row ${i + 1}: Missing Quarter or Region.`);
      continue;
    }

    if (isNaN(revenue)) {
      errors.push(`Row ${i + 1}: Invalid revenue value "${rawTokens[colIdx.revenue]}".`);
      continue;
    }

    // Format quarter to standard Q1, Q2, Q3, Q4 if possible
    let formattedQuarter = quarterRaw;
    const qMatch = quarterRaw.match(/Q(?:UARTER)?\s*([1-4])/i);
    if (qMatch) {
      formattedQuarter = `Q${qMatch[1]}`;
    }

    orders.push({
      quarter: formattedQuarter,
      region: regionRaw,
      channel: channelRaw || 'Standard',
      product: productRaw || 'Standard Product',
      units: isNaN(units) ? 1 : units,
      discount_pct: discountPct,
      revenue: revenue,
    });
  }

  return {
    orders,
    errors: errors.slice(0, 10), // Limit error list
    warning:
      errors.length > 10 ? `And ${errors.length - 10} more row warnings skipped.` : undefined,
    headersDetected: rawHeaders,
  };
}

/**
 * Realistic sample CSV containing sales orders across quarters and regions
 * for instant testing and reference.
 */
export const SAMPLE_CSV_CONTENT = `quarter,region,channel,product,units,discount_pct,revenue
Q1,North America,Direct,Enterprise Cloud Suite,120,0.05,180000.00
Q1,North America,Partner,Security Suite,85,0.10,95000.00
Q1,Europe,Direct,Enterprise Cloud Suite,90,0.08,135000.00
Q1,Europe,Online,Team Workspace,240,0.15,72000.00
Q1,Asia Pacific,Partner,Enterprise Cloud Suite,110,0.10,165000.00
Q1,Asia Pacific,Direct,AI Data Studio,70,0.05,105000.00
Q1,Latin America,Online,Team Workspace,150,0.12,45000.00
Q1,Latin America,Partner,Security Suite,40,0.10,40000.00
Q2,North America,Direct,Enterprise Cloud Suite,160,0.05,240000.00
Q2,North America,Partner,Security Suite,110,0.10,121000.00
Q2,Europe,Direct,Enterprise Cloud Suite,105,0.05,157500.00
Q2,Europe,Online,Team Workspace,260,0.10,78000.00
Q2,Asia Pacific,Partner,Enterprise Cloud Suite,140,0.08,210000.00
Q2,Asia Pacific,Direct,AI Data Studio,95,0.05,142500.00
Q2,Latin America,Online,Team Workspace,180,0.10,54000.00
Q2,Latin America,Partner,Security Suite,55,0.10,55000.00
Q3,North America,Direct,Enterprise Cloud Suite,130,0.10,195000.00
Q3,North America,Partner,Security Suite,90,0.12,99000.00
Q3,Europe,Direct,Enterprise Cloud Suite,175,0.05,262500.00
Q3,Europe,Online,Team Workspace,320,0.08,96000.00
Q3,Asia Pacific,Partner,Enterprise Cloud Suite,150,0.05,225000.00
Q3,Asia Pacific,Direct,AI Data Studio,100,0.05,150000.00
Q3,Latin America,Online,Team Workspace,190,0.10,57000.00
Q3,Latin America,Partner,Security Suite,60,0.10,60000.00
Q4,North America,Direct,Enterprise Cloud Suite,200,0.05,300000.00
Q4,North America,Partner,Security Suite,140,0.10,154000.00
Q4,Europe,Direct,Enterprise Cloud Suite,190,0.05,285000.00
Q4,Europe,Online,Team Workspace,350,0.05,105000.00
Q4,Asia Pacific,Partner,Enterprise Cloud Suite,180,0.05,270000.00
Q4,Asia Pacific,Direct,AI Data Studio,120,0.05,180000.00
Q4,Latin America,Online,Team Workspace,220,0.08,66000.00
Q4,Latin America,Partner,Security Suite,75,0.10,75000.00`;
