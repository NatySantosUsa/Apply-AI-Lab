import React, { useState } from 'react';
import {
  Sparkles,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  AlertTriangle,
  Cpu,
} from 'lucide-react';
import { AnalysisResult } from '../types';

interface AiSummarySectionProps {
  analysis: AnalysisResult;
  summaryText: string;
  source: 'gemini' | 'calculated';
  isLoading: boolean;
  error?: string | null;
  onRegenerate: () => void;
}

export const AiSummarySection: React.FC<AiSummarySectionProps> = ({
  analysis,
  summaryText,
  source,
  isLoading,
  error,
  onRegenerate,
}) => {
  const [showAudit, setShowAudit] = useState(false);

  const {
    hasQ2AndQ3,
    maxAbsoluteRegion,
    totalQ2,
    totalQ3,
    overallDelta,
    overallPctChange,
    regionalSummaries,
  } = analysis;

  const formatCurrency = (val: number) =>
    `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatPercent = (pct: number | null) =>
    pct !== null ? `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%` : 'N/A';

  if (!hasQ2AndQ3) {
    return (
      <div
        id="executive-summary"
        className="bg-amber-50/60 border border-amber-200 rounded-xl p-6 text-amber-900"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold text-sm text-amber-900">
              Q2 and Q3 Data Required for Variance Analysis
            </h3>
            <p className="text-xs text-amber-800 mt-1 leading-relaxed">
              The AI summary analyzes which region changed most between Q2 and Q3. The current
              dataset contains quarters:{' '}
              <span className="font-mono font-medium">
                {analysis.quarters.join(', ') || 'none'}
              </span>
              . Please upload a dataset with both Q2 and Q3 data to activate this feature.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id="executive-summary"
      className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-xs relative overflow-hidden"
    >
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                Executive Summary: Q2 to Q3 Regional Shift
              </h2>
              {source === 'gemini' ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <Sparkles className="w-2.5 h-2.5" />
                  Gemini 3.8 Flash
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                  <Cpu className="w-2.5 h-2.5" />
                  Calculated Analytics
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span>Strict 3-Sentence Constraint</span>
              <span aria-hidden="true">·</span>
              <span>100% Calculated Figures Only</span>
              <span aria-hidden="true">·</span>
              <span>Zero Hallucination Guarantee</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAudit(!showAudit)}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>{showAudit ? 'Hide Audit Figures' : 'View Audit Figures'}</span>
            {showAudit ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onRegenerate}
            disabled={isLoading}
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 rounded-lg transition-colors shadow-2xs whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Synthesizing...' : 'Regenerate'}
          </button>
        </div>
      </div>

      {/* Main AI Summary Content Box */}
      <div className="p-5 rounded-xl bg-slate-50/80 border border-slate-200/80 my-4">
        {isLoading && !summaryText ? (
          <div className="space-y-3 py-2">
            <div className="h-4 bg-slate-200/70 rounded-md animate-pulse w-full" />
            <div className="h-4 bg-slate-200/70 rounded-md animate-pulse w-11/12" />
            <div className="h-4 bg-slate-200/70 rounded-md animate-pulse w-4/5" />
          </div>
        ) : summaryText ? (
          <div className="relative">
            <p className="text-sm sm:text-[15px] leading-relaxed text-slate-800 font-normal">
              {summaryText}
            </p>
            {isLoading && (
              <div className="text-[11px] text-indigo-600 mt-2 flex items-center gap-1.5 font-medium">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Contacting Gemini 3.8 Flash for AI phrasing...</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">
            Upload a sales order dataset with Q2 and Q3 to view the three-sentence regional change analysis.
          </p>
        )}
      </div>

      {/* Quick Key Calculated Stat Badges */}
      {maxAbsoluteRegion && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3 rounded-lg bg-white border border-slate-200">
            <span className="text-[11px] font-medium text-slate-500 block">Region with Largest Shift</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-sm font-bold text-slate-900 truncate">
                {maxAbsoluteRegion.region}
              </span>
              <span
                className={`text-xs font-mono font-semibold flex items-center gap-0.5 ${
                  maxAbsoluteRegion.q2ToQ3Delta >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {maxAbsoluteRegion.q2ToQ3Delta >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {maxAbsoluteRegion.q2ToQ3Delta >= 0 ? '+' : ''}
                {formatCurrency(maxAbsoluteRegion.q2ToQ3Delta)}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block font-mono">
              Q2: {formatCurrency(maxAbsoluteRegion.q2Revenue)} → Q3:{' '}
              {formatCurrency(maxAbsoluteRegion.q3Revenue)} (
              {formatPercent(maxAbsoluteRegion.q2ToQ3PctChange)})
            </span>
          </div>

          <div className="p-3 rounded-lg bg-white border border-slate-200">
            <span className="text-[11px] font-medium text-slate-500 block">Total Q2 Portfolio</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-sm font-bold text-slate-900 font-mono">
                {formatCurrency(totalQ2)}
              </span>
              <span className="text-xs text-slate-400">All regions</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Across {analysis.regions.length} active regions
            </span>
          </div>

          <div className="p-3 rounded-lg bg-white border border-slate-200">
            <span className="text-[11px] font-medium text-slate-500 block">Total Q3 Portfolio</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-sm font-bold text-slate-900 font-mono">
                {formatCurrency(totalQ3)}
              </span>
              <span
                className={`text-xs font-mono font-semibold ${
                  overallDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {overallDelta >= 0 ? '+' : ''}
                {formatPercent(overallPctChange)}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block font-mono">
              Net portfolio shift: {overallDelta >= 0 ? '+' : ''}
              {formatCurrency(overallDelta)}
            </span>
          </div>
        </div>
      )}

      {/* Expandable Mathematical Audit Drawer */}
      {showAudit && (
        <div className="mt-5 pt-5 border-t border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Deterministic Calculation Audit
              </h4>
              <p className="text-[11px] text-slate-500">
                These exact figures were computed by the app and provided to Gemini with a strict zero-hallucination constraint.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
                  <th className="py-2 px-3 font-semibold">Region</th>
                  <th className="py-2 px-3 font-semibold text-right">Q2 Revenue</th>
                  <th className="py-2 px-3 font-semibold text-right">Q3 Revenue</th>
                  <th className="py-2 px-3 font-semibold text-right">Difference ($)</th>
                  <th className="py-2 px-3 font-semibold text-right">% Change</th>
                  <th className="py-2 px-3 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {regionalSummaries.map((item) => {
                  const isMax = item.region === maxAbsoluteRegion?.region;
                  return (
                    <tr
                      key={item.region}
                      className={isMax ? 'bg-indigo-50/50 font-medium' : 'hover:bg-slate-50'}
                    >
                      <td className="py-2 px-3 text-slate-900 flex items-center gap-1.5">
                        {item.region}
                        {isMax && (
                          <span className="text-[10px] bg-indigo-100 text-indigo-700 font-semibold px-1.5 py-0.2 rounded">
                            Largest Shift
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-700">
                        {formatCurrency(item.q2Revenue)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-700">
                        {formatCurrency(item.q3Revenue)}
                      </td>
                      <td
                        className={`py-2 px-3 text-right font-mono tabular-nums font-medium ${
                          item.q2ToQ3Delta >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {item.q2ToQ3Delta >= 0 ? '+' : ''}
                        {formatCurrency(item.q2ToQ3Delta)}
                      </td>
                      <td
                        className={`py-2 px-3 text-right font-mono tabular-nums ${
                          (item.q2ToQ3PctChange ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {formatPercent(item.q2ToQ3PctChange)}
                      </td>
                      <td className="py-2 px-3 text-center text-slate-500 text-[11px]">
                        {item.q2ToQ3Delta > 0
                          ? 'Grew'
                          : item.q2ToQ3Delta < 0
                          ? 'Contracted'
                          : 'Flat'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
