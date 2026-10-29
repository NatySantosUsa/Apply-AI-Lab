import React from 'react';
import { BarChart3, Upload, FileSpreadsheet } from 'lucide-react';

interface NavbarProps {
  onUploadClick: () => void;
  onLoadSample: () => void;
  hasData: boolean;
  fileName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onUploadClick,
  onLoadSample,
  hasData,
  fileName,
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-6 py-4 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
          <BarChart3 className="w-5 h-5" />
        </div>
        <span className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
          Vantage Sales Analytics
        </span>
      </div>

      {/* Zone 2: 4 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
        <a
          href="#executive-summary"
          className="hover:text-indigo-600 transition-colors whitespace-nowrap shrink-0"
        >
          Executive Summary
        </a>
        <a
          href="#trend-chart"
          className="hover:text-indigo-600 transition-colors whitespace-nowrap shrink-0"
        >
          Quarterly Trends
        </a>
        <a
          href="#pivot-table"
          className="hover:text-indigo-600 transition-colors whitespace-nowrap shrink-0"
        >
          Regional Pivot
        </a>
        <a
          href="#data-specs"
          className="hover:text-indigo-600 transition-colors whitespace-nowrap shrink-0"
        >
          Schema Specs
        </a>
      </nav>

      {/* Zone 3: Primary action button(s) */}
      <div className="flex items-center gap-3 shrink-0">
        {!hasData && (
          <button
            onClick={onLoadSample}
            type="button"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
            Load Sample CSV
          </button>
        )}
        <button
          onClick={onUploadClick}
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg transition-colors shadow-xs whitespace-nowrap shrink-0"
        >
          <Upload className="w-3.5 h-3.5" />
          {hasData ? (fileName ? `Change CSV (${fileName})` : 'Upload New CSV') : 'Upload CSV'}
        </button>
      </div>
    </header>
  );
};
