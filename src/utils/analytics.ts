import { AnalysisResult, RegionalQuarterSummary, SalesOrder } from '../types';

/**
 * Custom sort for quarters: ensures Q1, Q2, Q3, Q4 appear in proper order,
 * with any other formatted quarters following natural alphanumeric sort.
 */
function sortQuarters(a: string, b: string): number {
  const qA = a.match(/Q([1-4])/i);
  const qB = b.match(/Q([1-4])/i);

  if (qA && qB) {
    return parseInt(qA[1], 10) - parseInt(qB[1], 10);
  }
  if (qA) return -1;
  if (qB) return 1;

  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

export function computeSalesAnalysis(orders: SalesOrder[]): AnalysisResult {
  if (!orders || orders.length === 0) {
    return {
      orders: [],
      quarters: [],
      regions: [],
      regionalSummaries: [],
      quarterTotals: {},
      grandTotalRevenue: 0,
      grandTotalUnits: 0,
      totalQ2: 0,
      totalQ3: 0,
      overallDelta: 0,
      overallPctChange: null,
      maxAbsoluteRegion: null,
      maxPercentageRegion: null,
      hasQ2AndQ3: false,
    };
  }

  const quarterSet = new Set<string>();
  const regionSet = new Set<string>();

  // Aggregation buckets: region -> { quarter -> sum(revenue) }
  const regionQuarterMap = new Map<string, Map<string, number>>();
  const regionUnitsMap = new Map<string, number>();
  const regionOrdersCount = new Map<string, number>();
  const quarterTotals: Record<string, number> = {};

  let grandTotalRevenue = 0;
  let grandTotalUnits = 0;

  for (const order of orders) {
    const { quarter, region, revenue, units } = order;

    quarterSet.add(quarter);
    regionSet.add(region);

    if (!regionQuarterMap.has(region)) {
      regionQuarterMap.set(region, new Map<string, number>());
      regionUnitsMap.set(region, 0);
      regionOrdersCount.set(region, 0);
    }

    const qMap = regionQuarterMap.get(region)!;
    const currentQRev = qMap.get(quarter) || 0;
    qMap.set(quarter, currentQRev + revenue);

    regionUnitsMap.set(region, (regionUnitsMap.get(region) || 0) + units);
    regionOrdersCount.set(region, (regionOrdersCount.get(region) || 0) + 1);

    quarterTotals[quarter] = (quarterTotals[quarter] || 0) + revenue;
    grandTotalRevenue += revenue;
    grandTotalUnits += units;
  }

  const quarters = Array.from(quarterSet).sort(sortQuarters);
  const regions = Array.from(regionSet).sort((a, b) => a.localeCompare(b));

  const hasQ2AndQ3 = quarters.includes('Q2') && quarters.includes('Q3');

  const regionalSummaries: RegionalQuarterSummary[] = [];

  for (const region of regions) {
    const qMap = regionQuarterMap.get(region)!;
    const quarterRevenues: Record<string, number> = {};
    let totalRevenue = 0;

    for (const q of quarters) {
      const rev = qMap.get(q) || 0;
      quarterRevenues[q] = rev;
      totalRevenue += rev;
    }

    const q2Revenue = quarterRevenues['Q2'] || 0;
    const q3Revenue = quarterRevenues['Q3'] || 0;
    const delta = q3Revenue - q2Revenue;
    const absDelta = Math.abs(delta);
    const pctChange = q2Revenue > 0 ? (delta / q2Revenue) * 100 : null;

    regionalSummaries.push({
      region,
      quarterRevenues,
      totalRevenue,
      totalUnits: regionUnitsMap.get(region) || 0,
      orderCount: regionOrdersCount.get(region) || 0,
      q2Revenue,
      q3Revenue,
      q2ToQ3Delta: delta,
      q2ToQ3AbsDelta: absDelta,
      q2ToQ3PctChange: pctChange,
    });
  }

  // Sort regional summaries descending by total revenue initially
  regionalSummaries.sort((a, b) => b.totalRevenue - a.totalRevenue);

  // Portfolio Q2 and Q3 metrics
  const totalQ2 = quarterTotals['Q2'] || 0;
  const totalQ3 = quarterTotals['Q3'] || 0;
  const overallDelta = totalQ3 - totalQ2;
  const overallPctChange = totalQ2 > 0 ? (overallDelta / totalQ2) * 100 : null;

  // Find region with greatest change from Q2 to Q3
  let maxAbsoluteRegion: RegionalQuarterSummary | null = null;
  let maxPercentageRegion: RegionalQuarterSummary | null = null;

  if (hasQ2AndQ3 && regionalSummaries.length > 0) {
    maxAbsoluteRegion = regionalSummaries.reduce((prev, curr) =>
      curr.q2ToQ3AbsDelta > prev.q2ToQ3AbsDelta ? curr : prev
    );

    const validPctRegions = regionalSummaries.filter((r) => r.q2ToQ3PctChange !== null);
    if (validPctRegions.length > 0) {
      maxPercentageRegion = validPctRegions.reduce((prev, curr) =>
        Math.abs(curr.q2ToQ3PctChange!) > Math.abs(prev.q2ToQ3PctChange!) ? curr : prev
      );
    }
  }

  return {
    orders,
    quarters,
    regions,
    regionalSummaries,
    quarterTotals,
    grandTotalRevenue,
    grandTotalUnits,
    totalQ2,
    totalQ3,
    overallDelta,
    overallPctChange,
    maxAbsoluteRegion,
    maxPercentageRegion,
    hasQ2AndQ3,
  };
}
