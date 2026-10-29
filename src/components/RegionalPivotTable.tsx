import React, { useState, useMemo } from 'react';
import { AnalysisResult, RegionalQuarterSummary } from '../types';
import { ArrowUpDown, Download, Search, TrendingUp, TrendingDown } from 'lucide-react';

interface RegionalPivotTableProps {
  analysis: AnalysisResult;
}

type SortField = 'region' | 'totalRevenue' | 'delta' | 'pctChange' | string;

export const RegionalPivotTable: React.FC<RegionalPivotTableProps> = ({ analysis }) => {
  const {
    quarters,
    regionalSummaries,
    quarterTotals,
    grandTotalRevenue,
    hasQ2AndQ3,
    totalQ2,
    totalQ3,
    overallDelta,
    overallPctChange,
  } = analysis;

  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('totalRevenue');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'region' ? 'asc' : 'desc');
    }
  };

  const filteredAndSortedRows = useMemo(() => {
    let rows = [...regionalSummaries];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      rows = rows.filter((r) => r.region.toLowerCase().includes(q));
    }

    rows.sort((a, b) => {
      let valA: number | string = 0;
      let valB: number | string = 0;

      if (sortField === 'region') {
        valA = a.region.toLowerCase();
        valB = b.region.toLowerCase();
        return sortDirection === 'asc'
          ? (valA as string).localeCompare(valB as string)
          : (valB as string).localeCompare(valA as string);
      }

      if (sortField === 'totalRevenue') {
        valA = a.totalRevenue;
        valB = b.totalRevenue;
      } else if (sortField === 'delta') {
        valA = a.q2ToQ3Delta;
        valB = b.q2ToQ3Delta;
      } else if (sortField === 'pctChange') {
        valA = a.q2ToQ3PctChange ?? -Infinity;
        valB = b.q2ToQ3PctChange ?? -Infinity;
      } else if (quarters.includes(sortField)) {
        valA = a.quarterRevenues[sortField] || 0;
        valB = b.quarterRevenues[sortField] || 0;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return rows;
  }, [regionalSummaries, searchTerm, sortField, sortDirection, quarters]);

  const formatCurrency = (val: number) =>
    `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatPercent = (pct: number | null) =>
    pct !== null ? `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%` : '—';

  const exportTableCSV = () => {
    const headers = ['Region', ...quarters, 'Total Revenue'];
    if (hasQ2AndQ3) {
      headers.push('Q2 Revenue', 'Q3 Revenue', 'Q2->Q3 Delta ($)', 'Q2->Q3 Change (%)');
    }

    const rows = filteredAndSortedRows.map((r) => {
      const row = [
        `"${r.region}"`,
        ...quarters.map((q) => (r.quarterRevenues[q] || 0).toFixed(2)),
        r.totalRevenue.toFixed(2),
      ];
      if (hasQ2AndQ3) {
        row.push(
          r.q2Revenue.toFixed(2),
          r.q3Revenue.toFixed(2),
          r.q2ToQ3Delta.toFixed(2),
          r.q2ToQ3PctChange !== null ? r.q2ToQ3PctChange.toFixed(2) + '%' : 'N/A'
        );
      }
      return row.join(',');
    });

    const csvData = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'regional_quarterly_revenue_pivot.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div id="pivot-table" className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Regional Revenue Pivot Breakdown
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
            <span>Quarterly Totals</span>
            <span aria-hidden="true">·</span>
            <span>Deterministic Metrics</span>
            <span aria-hidden="true">·</span>
            <span>Sortable Columns</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search region..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 w-36 sm:w-44 text-slate-800"
            />
          </div>

          <button
            onClick={exportTableCSV}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
            title="Export filtered matrix to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            Export Pivot
          </button>
        </div>
      </div>

      {/* High-Density Data Grid */}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100/90 text-slate-700 border-b border-slate-200 select-none">
              <th
                onClick={() => handleSort('region')}
                className="py-3 px-4 font-semibold cursor-pointer hover:bg-slate-200/70 transition-colors whitespace-nowrap"
              >
                <div className="flex items-center gap-1.5">
                  <span>Region</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              {quarters.map((q) => (
                <th
                  key={q}
                  onClick={() => handleSort(q)}
                  className="py-3 px-3 font-semibold text-right cursor-pointer hover:bg-slate-200/70 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>{q} Revenue</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
              ))}

              <th
                onClick={() => handleSort('totalRevenue')}
                className="py-3 px-4 font-semibold text-right cursor-pointer hover:bg-slate-200/70 transition-colors whitespace-nowrap"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Total Revenue</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              {hasQ2AndQ3 && (
                <>
                  <th
                    onClick={() => handleSort('delta')}
                    className="py-3 px-4 font-semibold text-right cursor-pointer hover:bg-slate-200/70 transition-colors whitespace-nowrap bg-indigo-50/50"
                  >
                    <div className="flex items-center justify-end gap-1 text-indigo-900">
                      <span>Q2 → Q3 Shift ($)</span>
                      <ArrowUpDown className="w-3 h-3 text-indigo-500" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('pctChange')}
                    className="py-3 px-4 font-semibold text-right cursor-pointer hover:bg-slate-200/70 transition-colors whitespace-nowrap bg-indigo-50/50"
                  >
                    <div className="flex items-center justify-end gap-1 text-indigo-900">
                      <span>Q2 → Q3 Change (%)</span>
                      <ArrowUpDown className="w-3 h-3 text-indigo-500" />
                    </div>
                  </th>
                </>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredAndSortedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={quarters.length + (hasQ2AndQ3 ? 4 : 2)}
                  className="py-8 text-center text-slate-500 italic"
                >
                  No regions found matching "{searchTerm}"
                </td>
              </tr>
            ) : (
              filteredAndSortedRows.map((row) => (
                <tr key={row.region} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-4 font-medium text-slate-900 whitespace-nowrap">
                    {row.region}
                  </td>

                  {quarters.map((q) => (
                    <td
                      key={q}
                      className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700 whitespace-nowrap"
                    >
                      {formatCurrency(row.quarterRevenues[q] || 0)}
                    </td>
                  ))}

                  <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                    {formatCurrency(row.totalRevenue)}
                  </td>

                  {hasQ2AndQ3 && (
                    <>
                      <td
                        className={`py-2.5 px-4 text-right font-mono tabular-nums font-medium whitespace-nowrap bg-slate-50/40 ${
                          row.q2ToQ3Delta >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        <span className="inline-flex items-center gap-0.5 justify-end">
                          {row.q2ToQ3Delta >= 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {row.q2ToQ3Delta >= 0 ? '+' : ''}
                          {formatCurrency(row.q2ToQ3Delta)}
                        </span>
                      </td>
                      <td
                        className={`py-2.5 px-4 text-right font-mono tabular-nums font-semibold whitespace-nowrap bg-slate-50/40 ${
                          (row.q2ToQ3PctChange ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {formatPercent(row.q2ToQ3PctChange)}
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>

          {/* Sticky Total Footer */}
          <tfoot>
            <tr className="bg-slate-100 font-semibold text-slate-900 border-t-2 border-slate-300">
              <td className="py-3 px-4">
                Total Portfolio ({regionalSummaries.length} regions)
              </td>

              {quarters.map((q) => (
                <td key={q} className="py-3 px-3 text-right font-mono tabular-nums">
                  {formatCurrency(quarterTotals[q] || 0)}
                </td>
              ))}

              <td className="py-3 px-4 text-right font-mono tabular-nums text-indigo-700">
                {formatCurrency(grandTotalRevenue)}
              </td>

              {hasQ2AndQ3 && (
                <>
                  <td
                    className={`py-3 px-4 text-right font-mono tabular-nums bg-indigo-100/40 ${
                      overallDelta >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {overallDelta >= 0 ? '+' : ''}
                    {formatCurrency(overallDelta)}
                  </td>
                  <td
                    className={`py-3 px-4 text-right font-mono tabular-nums bg-indigo-100/40 ${
                      (overallPctChange ?? 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {formatPercent(overallPctChange)}
                  </td>
                </>
              )}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
