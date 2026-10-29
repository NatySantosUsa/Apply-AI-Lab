import React, { useState, useMemo, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { UploadSection } from './components/UploadSection';
import { AiSummarySection } from './components/AiSummarySection';
import { MultiLineTrendChart } from './components/MultiLineTrendChart';
import { RegionalPivotTable } from './components/RegionalPivotTable';
import { parseSalesCSV, SAMPLE_CSV_CONTENT } from './utils/csvParser';
import { computeSalesAnalysis } from './utils/analytics';
import { SalesOrder } from './types';
import { BarChart2, Layers, DollarSign, Globe } from 'lucide-react';

export default function App() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [parseWarning, setParseWarning] = useState<string | undefined>();

  // AI Summary State
  const [aiSummary, setAiSummary] = useState<string>('');
  const [summarySource, setSummarySource] = useState<'gemini' | 'calculated'>('calculated');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Compute analytics
  const analysis = useMemo(() => computeSalesAnalysis(orders), [orders]);

  // Compute instantaneous 3-sentence summary using strictly calculated numbers
  const computeImmediateSummary = useCallback((targetAnalysis = analysis) => {
    if (!targetAnalysis.hasQ2AndQ3 || !targetAnalysis.maxAbsoluteRegion) {
      return '';
    }

    const maxR = targetAnalysis.maxAbsoluteRegion;
    const formatC = (v: number) =>
      `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const formatP = (p: number | null) => (p !== null ? `${p > 0 ? '+' : ''}${p.toFixed(1)}%` : '0%');

    // Sentence 1: Region with greatest change
    const sentence1 = `Between Q2 and Q3, ${maxR.region} changed the most in revenue, moving from ${formatC(
      maxR.q2Revenue
    )} to ${formatC(maxR.q3Revenue)} for a net shift of ${
      maxR.q2ToQ3Delta >= 0 ? '+' : ''
    }${formatC(maxR.q2ToQ3Delta)} (${formatP(maxR.q2ToQ3PctChange)}).`;

    // Sentence 2: Contrast against other regions
    const otherRegions = targetAnalysis.regionalSummaries.filter((r) => r.region !== maxR.region);
    let sentence2 = '';
    if (otherRegions.length > 0) {
      const runnerUp = otherRegions[0];
      sentence2 = `This magnitude of change exceeded all other regions, with runner-up ${
        runnerUp.region
      } shifting by ${runnerUp.q2ToQ3Delta >= 0 ? '+' : ''}${formatC(
        runnerUp.q2ToQ3Delta
      )} (${formatP(runnerUp.q2ToQ3PctChange)}).`;
    } else {
      sentence2 = `This variation represented the sole regional shift recorded across the portfolio.`;
    }

    // Sentence 3: Total portfolio impact
    const sentence3 = `Overall portfolio revenue moved from ${formatC(
      targetAnalysis.totalQ2
    )} in Q2 to ${formatC(targetAnalysis.totalQ3)} in Q3, resulting in a net change of ${
      targetAnalysis.overallDelta >= 0 ? '+' : ''
    }${formatC(targetAnalysis.overallDelta)} (${formatP(targetAnalysis.overallPctChange)}).`;

    return `${sentence1} ${sentence2} ${sentence3}`;
  }, [analysis]);

  // Generate AI Summary via server proxy
  const generateSummary = useCallback(
    async (currentAnalysis = analysis) => {
      if (!currentAnalysis.hasQ2AndQ3 || !currentAnalysis.maxAbsoluteRegion) {
        return;
      }

      // Immediately set calculated 3-sentence summary so the UI is instantaneous
      const instantSummary = computeImmediateSummary(currentAnalysis);
      setAiSummary(instantSummary);
      setSummarySource('calculated');

      setIsAiLoading(true);
      setAiError(null);

      const payload = {
        regionalData: currentAnalysis.regionalSummaries.map((r) => ({
          region: r.region,
          q2Revenue: r.q2Revenue,
          q3Revenue: r.q3Revenue,
          delta: r.q2ToQ3Delta,
          pctChange: r.q2ToQ3PctChange,
        })),
        maxChangedRegion: {
          region: currentAnalysis.maxAbsoluteRegion.region,
          q2Revenue: currentAnalysis.maxAbsoluteRegion.q2Revenue,
          q3Revenue: currentAnalysis.maxAbsoluteRegion.q3Revenue,
          delta: currentAnalysis.maxAbsoluteRegion.q2ToQ3Delta,
          pctChange: currentAnalysis.maxAbsoluteRegion.q2ToQ3PctChange,
        },
        totalQ2: currentAnalysis.totalQ2,
        totalQ3: currentAnalysis.totalQ3,
        overallDelta: currentAnalysis.overallDelta,
        overallPctChange: currentAnalysis.overallPctChange,
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      try {
        const response = await fetch('/api/generate-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Server error: ${response.status}`);
        }

        const data = await response.json();
        if (data.summary && data.summary.trim().length > 0) {
          setAiSummary(data.summary);
          setSummarySource('gemini');
        }
      } catch (err: any) {
        clearTimeout(timeoutId);
        console.info('Using calculated analytical summary:', err?.message);
        // Keep the calculated instant summary active!
        setSummarySource('calculated');
      } finally {
        setIsAiLoading(false);
      }
    },
    [analysis, computeImmediateSummary]
  );

  // File Upload Handler
  const handleFileSelect = (file: File) => {
    setFileName(file.name);
    setParseErrors([]);
    setParseWarning(undefined);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) {
        setParseErrors(['Unable to read file content.']);
        return;
      }

      const result = parseSalesCSV(content);
      if (result.errors.length > 0) {
        setParseErrors(result.errors);
        setParseWarning(result.warning);
        return;
      }

      setOrders(result.orders);
      setParseWarning(result.warning);

      const computed = computeSalesAnalysis(result.orders);
      if (computed.hasQ2AndQ3) {
        generateSummary(computed);
      } else {
        setAiSummary('');
      }
    };

    reader.onerror = () => {
      setParseErrors(['Failed to read file from disk.']);
    };

    reader.readAsText(file);
  };

  // 1-Click Sample Dataset Loader
  const handleLoadSample = () => {
    setFileName('sales_orders_sample.csv');
    setParseErrors([]);
    setParseWarning(undefined);

    const result = parseSalesCSV(SAMPLE_CSV_CONTENT);
    setOrders(result.orders);

    const computed = computeSalesAnalysis(result.orders);
    if (computed.hasQ2AndQ3) {
      generateSummary(computed);
    }
  };

  const handleReset = () => {
    setOrders([]);
    setFileName('');
    setParseErrors([]);
    setParseWarning(undefined);
    setAiSummary('');
    setAiError(null);
  };

  const hasData = orders.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar
        onUploadClick={() => {
          const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
          fileInput?.click();
        }}
        onLoadSample={handleLoadSample}
        hasData={hasData}
        fileName={fileName}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* CSV Dropzone / Active File Status Strip */}
        <section>
          <UploadSection
            onFileSelect={handleFileSelect}
            onLoadSample={handleLoadSample}
            hasData={hasData}
            fileName={fileName}
            rowCount={orders.length}
            totalRevenue={analysis.grandTotalRevenue}
            regionsCount={analysis.regions.length}
            quartersCount={analysis.quarters.length}
            parseErrors={parseErrors}
            warning={parseWarning}
            onReset={handleReset}
          />
        </section>

        {hasData ? (
          <>
            {/* KPI Metric Overview */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-medium">Grand Total Revenue</span>
                  <DollarSign className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900">
                  ${analysis.grandTotalRevenue.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Sum of all {orders.length} orders
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-medium">Regions Active</span>
                  <Globe className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900">
                  {analysis.regions.length}
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block truncate">
                  {analysis.regions.join(', ')}
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-medium">Quarters Tracked</span>
                  <Layers className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900">
                  {analysis.quarters.length}
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block font-mono">
                  {analysis.quarters.join(' · ')}
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-medium">Total Units Sold</span>
                  <BarChart2 className="w-4 h-4 text-violet-600" />
                </div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900">
                  {analysis.grandTotalUnits.toLocaleString()}
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Avg revenue/unit: $
                  {analysis.grandTotalUnits > 0
                    ? (analysis.grandTotalRevenue / analysis.grandTotalUnits).toFixed(2)
                    : '0.00'}
                </span>
              </div>
            </section>

            {/* AI Summary Section */}
            <section>
              <AiSummarySection
                analysis={analysis}
                summaryText={aiSummary}
                source={summarySource}
                isLoading={isAiLoading}
                error={aiError}
                onRegenerate={() => generateSummary()}
              />
            </section>

            {/* Multi-Line Trend Chart Section */}
            <section>
              <MultiLineTrendChart analysis={analysis} />
            </section>

            {/* Regional Revenue Pivot Table Section */}
            <section>
              <RegionalPivotTable analysis={analysis} />
            </section>
          </>
        ) : (
          /* Empty Guidance / Feature Explanation */
          <section className="bg-white border border-slate-200 rounded-xl p-8 sm:p-12 text-center shadow-xs">
            <div className="max-w-xl mx-auto space-y-4">
              <h2 className="text-xl font-bold text-slate-900">
                Ready for Sales Orders Analysis
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Upload your sales orders CSV containing columns{' '}
                <span className="font-mono text-xs font-semibold text-slate-800">quarter</span>,{' '}
                <span className="font-mono text-xs font-semibold text-slate-800">region</span>,{' '}
                <span className="font-mono text-xs font-semibold text-slate-800">channel</span>,{' '}
                <span className="font-mono text-xs font-semibold text-slate-800">product</span>,{' '}
                <span className="font-mono text-xs font-semibold text-slate-800">units</span>,{' '}
                <span className="font-mono text-xs font-semibold text-slate-800">discount_pct</span>, and{' '}
                <span className="font-mono text-xs font-semibold text-slate-800">revenue</span> to instantly view:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-left">
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="font-semibold text-slate-900 text-sm mb-1">
                    Multi-Line Chart
                  </div>
                  <p className="text-xs text-slate-500">
                    Quarter-over-quarter trend lines for each region with interactive tooltips and line toggles.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="font-semibold text-slate-900 text-sm mb-1">
                    Pivot Matrix Table
                  </div>
                  <p className="text-xs text-slate-500">
                    Quarter-by-quarter revenue grid with sortable columns, subtotals, and variance calculations.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="font-semibold text-slate-900 text-sm mb-1">
                    AI Regional Shift
                  </div>
                  <p className="text-xs text-slate-500">
                    Strict 3-sentence summary of the biggest Q2-to-Q3 shift using only the calculated figures.
                  </p>
                </div>
              </div>

              <div className="pt-6">
                <button
                  onClick={handleLoadSample}
                  type="button"
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg transition-colors shadow-xs"
                >
                  Explore with Sample Dataset
                </button>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Clean human footer following anti-slop rules */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            Vantage Sales Analytics · Verifiable Regional Revenue Intelligence
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono">RFC-4180 Compliant</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">Gemini 3.8 Flash</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
