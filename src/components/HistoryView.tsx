import React, { useState, useEffect } from 'react';
import {
  History,
  Download,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  FileSpreadsheet,
  Layers,
} from 'lucide-react';
import { Batch, ScanItem } from '../types';

export const HistoryView: React.FC = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'in_progress'>('all');
  const [expandedBatchId, setExpandedBatchId] = useState<number | null>(null);
  const [batchItems, setBatchItems] = useState<Record<number, ScanItem[]>>({});
  const [loadingItems, setLoadingItems] = useState<Record<number, boolean>>({});

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/batches');
      if (res.ok) {
        const data = await res.json();
        setBatches(data.batches || []);
      }
    } catch (err) {
      console.warn('Failed to fetch batches from server:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const toggleExpandBatch = async (batchId: number) => {
    if (expandedBatchId === batchId) {
      setExpandedBatchId(null);
      return;
    }

    setExpandedBatchId(batchId);
    if (!batchItems[batchId]) {
      setLoadingItems((prev) => ({ ...prev, [batchId]: true }));
      try {
        const res = await fetch(`/api/batches/${batchId}`);
        if (res.ok) {
          const data = await res.json();
          setBatchItems((prev) => ({ ...prev, [batchId]: data.items || [] }));
        }
      } catch (err) {
        console.warn('Failed to fetch batch items:', err);
      } finally {
        setLoadingItems((prev) => ({ ...prev, [batchId]: false }));
      }
    }
  };

  const downloadAllCsv = () => {
    window.location.href = '/api/export-csv';
  };

  const downloadBatchCsv = (batchId: number, batchNumber: string) => {
    window.location.href = `/api/export-csv?batchId=${batchId}`;
  };

  const filteredBatches = batches.filter((b) => {
    const matchesSearch =
      b.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.operatorName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ? true : b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner and Export Hub */}
      <div className="bg-white rounded-2xl shadow-md border-2 border-neutral-200 overflow-hidden">
        <div className="bg-[#FFCC00] px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b-2 border-[#D40511]">
          <div className="flex items-center space-x-3">
            <span className="bg-[#D40511] text-white font-black italic px-2.5 py-1 text-sm rounded shadow-sm">
              AUDIT ARCHIVE
            </span>
            <div>
              <h1 className="text-base sm:text-lg font-black text-[#1A1A1A] tracking-tight">
                MATERIAL VALIDATION HISTORY & CSV EXPORT
              </h1>
              <p className="text-xs text-neutral-800 font-medium">
                Comprehensive database records of all scanned batches and items
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={fetchBatches}
              className="p-2 bg-white text-neutral-700 hover:text-black rounded-lg text-xs font-bold shadow-xs transition-colors"
              title="Refresh Records"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              onClick={downloadAllCsv}
              className="flex items-center space-x-1.5 bg-[#D40511] hover:bg-[#B0000D] text-white px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider shadow transition-transform active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Download All Batches CSV</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 sm:p-6 bg-neutral-50 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by batch number or operator..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCC00] focus:border-[#D40511]"
            />
          </div>

          {/* Status Filters */}
          <div className="flex items-center space-x-1.5 text-xs font-bold">
            <Filter className="w-3.5 h-3.5 text-neutral-500 mr-1" />
            {(['all', 'completed', 'in_progress'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1.5 rounded-md capitalize transition-colors ${
                  statusFilter === filter
                    ? 'bg-[#1A1A1A] text-[#FFCC00]'
                    : 'bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                {filter === 'in_progress' ? 'In Progress' : filter}
              </button>
            ))}
          </div>
        </div>

        {/* Batches Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-neutral-100/90 text-neutral-700 uppercase font-black tracking-wider text-[11px] border-b border-neutral-200">
                <th className="py-3 px-4 w-10"></th>
                <th className="py-3 px-4">Batch Number</th>
                <th className="py-3 px-4">Target Qty</th>
                <th className="py-3 px-4">Completed Qty</th>
                <th className="py-3 px-4">Discrepancies</th>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-neutral-400">
                    <History className="w-10 h-10 mx-auto mb-2 text-neutral-300" />
                    <p className="font-semibold text-neutral-600">No batches match the criteria</p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Completed validation batches in the workstation will automatically show up here.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredBatches.map((batch) => {
                  const isExpanded = expandedBatchId === batch.id;
                  const items = batchItems[batch.id] || [];
                  const isLoadingThis = loadingItems[batch.id];

                  return (
                    <React.Fragment key={batch.id}>
                      <tr className={`hover:bg-neutral-50 transition-colors ${isExpanded ? 'bg-amber-50/40' : ''}`}>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => toggleExpandBatch(batch.id)}
                            className="p-1 text-neutral-500 hover:text-black rounded"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-[#D40511]" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-4 font-mono-code font-bold text-[#1A1A1A]">
                          {batch.batchNumber}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-neutral-700">
                          {batch.targetQty} Units
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-600">
                          {batch.completedQty} / {batch.targetQty}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-[#D40511]">
                          {batch.mismatchCount}
                        </td>
                        <td className="py-3 px-4 font-medium text-neutral-800">
                          {batch.operatorName}
                        </td>
                        <td className="py-3 px-4">
                          {batch.status === 'completed' ? (
                            <span className="inline-flex items-center space-x-1 bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>COMPLETED</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 bg-amber-100 text-amber-900 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-300">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>IN PROGRESS</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs text-neutral-500 font-mono">
                          {new Date(batch.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => downloadBatchCsv(batch.id, batch.batchNumber)}
                            className="inline-flex items-center space-x-1 bg-neutral-100 hover:bg-[#FFCC00] text-[#1A1A1A] px-2.5 py-1.5 rounded-md font-bold text-xs border border-neutral-300 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Export CSV</span>
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Scan Items Drawer */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={9} className="p-0 bg-neutral-100 border-y border-neutral-300">
                            <div className="p-4 sm:p-6 bg-white mx-4 my-3 rounded-xl border border-neutral-300 shadow-inner space-y-3">
                              <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                                <span className="font-extrabold text-xs uppercase tracking-wider text-neutral-700">
                                  Items Breakdown for Batch: {batch.batchNumber}
                                </span>
                                <span className="text-xs text-neutral-500 font-mono">
                                  {items.length} records logged
                                </span>
                              </div>

                              {isLoadingThis ? (
                                <div className="py-6 text-center text-xs text-neutral-500">
                                  <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1 text-neutral-400" />
                                  Loading detailed scan breakdown...
                                </div>
                              ) : items.length === 0 ? (
                                <p className="text-xs text-neutral-500 italic py-2">
                                  No scans recorded for this batch yet.
                                </p>
                              ) : (
                                <div className="overflow-x-auto max-h-60 overflow-y-auto">
                                  <table className="w-full text-left text-xs">
                                    <thead>
                                      <tr className="bg-neutral-100 text-neutral-600 uppercase font-bold text-[10px]">
                                        <th className="py-2 px-3">Item #</th>
                                        <th className="py-2 px-3">Material 1</th>
                                        <th className="py-2 px-3">Material 2</th>
                                        <th className="py-2 px-3">Result</th>
                                        <th className="py-2 px-3">Timestamp</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-200">
                                      {items.map((it, idx) => (
                                        <tr key={idx} className={!it.isMatch ? 'bg-red-50' : ''}>
                                          <td className="py-1.5 px-3 font-mono font-bold text-neutral-700">
                                            #{it.itemIndex}
                                          </td>
                                          <td className="py-1.5 px-3 font-mono-code font-bold text-[#1A1A1A]">
                                            {it.material1}
                                          </td>
                                          <td className="py-1.5 px-3 font-mono-code font-bold text-[#1A1A1A]">
                                            {it.material2}
                                          </td>
                                          <td className="py-1.5 px-3">
                                            {it.isMatch ? (
                                              <span className="text-emerald-700 font-bold">MATCHED</span>
                                            ) : (
                                              <span className="text-[#D40511] font-bold">MISMATCH</span>
                                            )}
                                          </td>
                                          <td className="py-1.5 px-3 text-neutral-500 font-mono">
                                            {new Date(it.scannedAt).toLocaleTimeString()}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
