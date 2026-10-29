import React, { useState, useMemo } from 'react';
import { AnalysisResult } from '../types';
import { Eye, EyeOff } from 'lucide-react';

interface MultiLineTrendChartProps {
  analysis: AnalysisResult;
}

const REGION_COLORS = [
  '#4F46E5', // Indigo
  '#059669', // Emerald
  '#D97706', // Amber
  '#E11D48', // Rose
  '#7C3AED', // Violet
  '#0284C7', // Sky
  '#0D9488', // Teal
  '#EA580C', // Orange
];

export const MultiLineTrendChart: React.FC<MultiLineTrendChartProps> = ({ analysis }) => {
  const { quarters, regions, regionalSummaries, quarterTotals } = analysis;

  // Active visible regions
  const [hiddenRegions, setHiddenRegions] = useState<Set<string>>(new Set());
  const [hoveredPoint, setHoveredPoint] = useState<{
    region: string;
    quarter: string;
    revenue: number;
    x: number;
    y: number;
  } | null>(null);

  // Region color mapping
  const regionColorMap = useMemo(() => {
    const map = new Map<string, string>();
    regions.forEach((region, idx) => {
      map.set(region, REGION_COLORS[idx % REGION_COLORS.length]);
    });
    return map;
  }, [regions]);

  const toggleRegion = (region: string) => {
    setHiddenRegions((prev) => {
      const next = new Set(prev);
      if (next.has(region)) {
        next.delete(region);
      } else {
        // Prevent hiding all regions
        if (next.size < regions.length - 1) {
          next.add(region);
        }
      }
      return next;
    });
  };

  const showAllRegions = () => setHiddenRegions(new Set());

  // Dimensions & bounds
  const width = 840;
  const height = 340;
  const padding = { top: 30, right: 40, bottom: 45, left: 75 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate maximum revenue across visible regions
  const maxRevenue = useMemo(() => {
    let max = 0;
    for (const r of regionalSummaries) {
      if (hiddenRegions.has(r.region)) continue;
      for (const q of quarters) {
        const val = r.quarterRevenues[q] || 0;
        if (val > max) max = val;
      }
    }
    // Round up to nice number
    if (max === 0) return 100000;
    const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
    return Math.ceil((max * 1.15) / magnitude) * magnitude;
  }, [regionalSummaries, quarters, hiddenRegions]);

  // Coordinate scales
  const getX = (quarterIdx: number) => {
    if (quarters.length <= 1) return padding.left + chartWidth / 2;
    return padding.left + (quarterIdx / (quarters.length - 1)) * chartWidth;
  };

  const getY = (value: number) => {
    if (maxRevenue === 0) return padding.top + chartHeight;
    return padding.top + chartHeight - (value / maxRevenue) * chartHeight;
  };

  // Y-axis ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((pct) => pct * maxRevenue);

  const formatCurrency = (val: number) => {
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}k`;
    return `$${val}`;
  };

  if (quarters.length === 0 || regions.length === 0) {
    return null;
  }

  return (
    <div id="trend-chart" className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Total Revenue by Region & Quarter
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
            <span>Multi-Line Progression</span>
            <span aria-hidden="true">·</span>
            <span>Hover points for detail</span>
            <span aria-hidden="true">·</span>
            <span>Click legend items to toggle</span>
          </div>
        </div>

        {hiddenRegions.size > 0 && (
          <button
            onClick={showAllRegions}
            type="button"
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium self-start sm:self-auto"
          >
            Show All Lines ({hiddenRegions.size} hidden)
          </button>
        )}
      </div>

      {/* Interactive Legend Bar */}
      <div className="flex flex-wrap items-center gap-2 mb-4 pb-3 border-b border-slate-100">
        {regions.map((region) => {
          const isHidden = hiddenRegions.has(region);
          const color = regionColorMap.get(region) || '#4F46E5';

          return (
            <button
              key={region}
              type="button"
              onClick={() => toggleRegion(region)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                isHidden
                  ? 'bg-slate-100 text-slate-400 line-through opacity-60'
                  : 'bg-slate-50 text-slate-800 hover:bg-slate-100 border border-slate-200/80 shadow-2xs'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: isHidden ? '#94A3B8' : color }}
              />
              <span>{region}</span>
              {isHidden ? (
                <EyeOff className="w-3 h-3 text-slate-400 ml-0.5" />
              ) : (
                <Eye className="w-3 h-3 text-slate-400 ml-0.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* SVG Chart Container */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          style={{ maxHeight: '380px' }}
        >
          {/* Horizontal Grid Lines & Y Ticks */}
          {yTicks.map((tickVal, i) => {
            const yPos = getY(tickVal);
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={yPos}
                  x2={width - padding.right}
                  y2={yPos}
                  stroke="#F1F5F9"
                  strokeWidth="1.5"
                />
                <text
                  x={padding.left - 10}
                  y={yPos + 4}
                  textAnchor="end"
                  className="text-[11px] font-mono fill-slate-400 font-medium"
                >
                  {formatCurrency(tickVal)}
                </text>
              </g>
            );
          })}

          {/* Vertical Guides & X Axis Ticks */}
          {quarters.map((q, idx) => {
            const xPos = getX(idx);
            return (
              <g key={q}>
                <line
                  x1={xPos}
                  y1={padding.top}
                  x2={xPos}
                  y2={height - padding.bottom}
                  stroke="#F8FAFC"
                  strokeWidth="1"
                />
                <text
                  x={xPos}
                  y={height - padding.bottom + 22}
                  textAnchor="middle"
                  className="text-xs font-semibold fill-slate-700"
                >
                  {q}
                </text>
                <text
                  x={xPos}
                  y={height - padding.bottom + 36}
                  textAnchor="middle"
                  className="text-[10px] font-mono fill-slate-400"
                >
                  Total: {formatCurrency(quarterTotals[q] || 0)}
                </text>
              </g>
            );
          })}

          {/* Region Lines */}
          {regionalSummaries.map((r) => {
            if (hiddenRegions.has(r.region)) return null;

            const color = regionColorMap.get(r.region) || '#4F46E5';

            // Generate path points
            const points = quarters.map((q, idx) => ({
              x: getX(idx),
              y: getY(r.quarterRevenues[q] || 0),
              quarter: q,
              revenue: r.quarterRevenues[q] || 0,
            }));

            // Construct path string
            const pathD = points.reduce((acc, pt, idx) => {
              return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
            }, '');

            return (
              <g key={r.region}>
                {/* Line Path */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-200"
                />

                {/* Data Points */}
                {points.map((pt) => {
                  const isHovered =
                    hoveredPoint?.region === r.region &&
                    hoveredPoint?.quarter === pt.quarter;

                  return (
                    <circle
                      key={pt.quarter}
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 6 : 4}
                      fill={isHovered ? '#FFFFFF' : color}
                      stroke={color}
                      strokeWidth={isHovered ? 3 : 2}
                      className="cursor-pointer transition-all duration-150"
                      onMouseEnter={() =>
                        setHoveredPoint({
                          region: r.region,
                          quarter: pt.quarter,
                          revenue: pt.revenue,
                          x: pt.x,
                          y: pt.y,
                        })
                      }
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  );
                })}
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip */}
        {hoveredPoint && (
          <div
            className="absolute pointer-events-none z-20 bg-slate-900 text-white text-xs rounded-lg py-2 px-3 shadow-lg -translate-x-1/2 -translate-y-full mb-3"
            style={{
              left: `${(hoveredPoint.x / width) * 100}%`,
              top: `${(hoveredPoint.y / height) * 100}%`,
            }}
          >
            <div className="font-semibold flex items-center gap-1.5 mb-0.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: regionColorMap.get(hoveredPoint.region) || '#4F46E5',
                }}
              />
              <span>{hoveredPoint.region}</span>
              <span className="text-slate-400 font-normal">· {hoveredPoint.quarter}</span>
            </div>
            <div className="font-mono text-emerald-400 font-bold text-sm">
              ${hoveredPoint.revenue.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            {quarterTotals[hoveredPoint.quarter] && (
              <div className="text-[10px] text-slate-400 mt-0.5">
                {(
                  (hoveredPoint.revenue / quarterTotals[hoveredPoint.quarter]) *
                  100
                ).toFixed(1)}
                % of {hoveredPoint.quarter} total
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
