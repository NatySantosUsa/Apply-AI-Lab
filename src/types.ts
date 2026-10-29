export interface SalesOrder {
  quarter: string;
  region: string;
  channel: string;
  product: string;
  units: number;
  discount_pct: number;
  revenue: number;
}

export interface RegionalQuarterSummary {
  region: string;
  quarterRevenues: Record<string, number>;
  totalRevenue: number;
  totalUnits: number;
  orderCount: number;
  q2Revenue: number;
  q3Revenue: number;
  q2ToQ3Delta: number;
  q2ToQ3AbsDelta: number;
  q2ToQ3PctChange: number | null;
}

export interface AnalysisResult {
  orders: SalesOrder[];
  quarters: string[];
  regions: string[];
  regionalSummaries: RegionalQuarterSummary[];
  quarterTotals: Record<string, number>;
  grandTotalRevenue: number;
  grandTotalUnits: number;
  totalQ2: number;
  totalQ3: number;
  overallDelta: number;
  overallPctChange: number | null;
  maxAbsoluteRegion: RegionalQuarterSummary | null;
  maxPercentageRegion: RegionalQuarterSummary | null;
  hasQ2AndQ3: boolean;
}

export interface ParseResult {
  orders: SalesOrder[];
  errors: string[];
  warning?: string;
  headersDetected: string[];
}
