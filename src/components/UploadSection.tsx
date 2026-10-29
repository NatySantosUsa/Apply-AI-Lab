import React, { useRef, useState } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { REQUIRED_COLUMNS, SAMPLE_CSV_CONTENT } from '../utils/csvParser';

interface UploadSectionProps {
  onFileSelect: (file: File) => void;
  onLoadSample: () => void;
  hasData: boolean;
  fileName?: string;
  rowCount?: number;
  totalRevenue?: number;
  regionsCount?: number;
  quartersCount?: number;
  parseErrors: string[];
  warning?: string;
  onReset: () => void;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  onFileSelect,
  onLoadSample,
  hasData,
  fileName,
  rowCount,
  totalRevenue,
  regionsCount,
  quartersCount,
  parseErrors,
  warning,
  onReset,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handleDownloadSample = () => {
    const blob = new Blob([SAMPLE_CSV_CONTENT], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sales_orders_sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // If data is already loaded and no blocking error, show high-density summary strip
  if (hasData && parseErrors.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900 text-sm">{fileName || 'Active Dataset'}</h3>
                <span className="text-xs text-slate-500 font-mono">({rowCount} orders parsed)</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span>{regionsCount} Regions</span>
                <span aria-hidden="true">·</span>
                <span>{quartersCount} Quarters</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono font-medium text-slate-700">
                  ${totalRevenue?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Total Revenue
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Different CSV
            </button>
            <button
              onClick={handleDownloadSample}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download Template
            </button>
            <button
              onClick={onReset}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
              title="Clear current data"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear
            </button>
          </div>
        </div>

        {warning && (
          <div className="mt-3 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>{warning}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".csv,text/csv"
        onChange={handleFileChange}
        className="hidden"
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
          isDragging
            ? 'border-indigo-600 bg-indigo-50/60 scale-[0.99]'
            : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50'
        }`}
      >
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4 shadow-2xs">
          <Upload className="w-7 h-7" />
        </div>

        <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-1">
          Upload Sales Orders CSV
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mb-4">
          Drag and drop your sales orders file here, or click to browse. The app will calculate regional totals, quarter momentum, and trigger AI variance analysis.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
          >
            Select CSV File
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onLoadSample();
            }}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-2xs"
          >
            Load Sample Dataset
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDownloadSample();
            }}
            className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Download CSV Template
          </button>
        </div>
      </div>

      {/* Required Schema Specification Section */}
      <div id="data-specs" className="mt-6 pt-6 border-t border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <span className="text-xs font-semibold text-slate-700 tracking-wide uppercase">
            Required CSV Column Schema
          </span>
          <span className="text-xs text-slate-500">
            Case-insensitive headers supported
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {REQUIRED_COLUMNS.map((col) => (
            <div
              key={col}
              className="px-2.5 py-1.5 rounded-md bg-slate-100/80 border border-slate-200/80 text-center"
            >
              <div className="font-mono text-xs font-medium text-slate-800">{col}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {col === 'quarter' && 'Q1, Q2, Q3, Q4'}
                {col === 'region' && 'Text name'}
                {col === 'channel' && 'Sales channel'}
                {col === 'product' && 'Item SKU'}
                {col === 'units' && 'Numeric count'}
                {col === 'discount_pct' && '0.10 or 10%'}
                {col === 'revenue' && 'Numeric ($)'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Parse Errors Display */}
      {parseErrors.length > 0 && (
        <div className="mt-5 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs">
          <div className="flex items-center gap-2 font-semibold text-sm mb-2 text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>CSV Parsing Error</span>
          </div>
          <ul className="list-disc pl-5 space-y-1">
            {parseErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
