import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Scan,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Camera,
  Play,
  Download,
  Lock,
  Unlock,
  Layers,
  Hash,
  Barcode,
  ArrowRight,
  ShieldCheck,
  Check,
  Zap,
} from 'lucide-react';
import { Batch, ScanItem, User } from '../types';
import { playLoudAlarm, playMatchBeep, playSuccessFanfare, stopAlarm } from '../utils/audio';
import { MismatchModal } from './MismatchModal';
import { CompletionModal } from './CompletionModal';
import { CameraScannerModal } from './CameraScannerModal';

interface WorkstationProps {
  currentUser: User | null;
  isMuted: boolean;
  onBatchCompleted?: (batch: Batch) => void;
  onViewHistory?: () => void;
}

export const Workstation: React.FC<WorkstationProps> = ({
  currentUser,
  isMuted,
  onBatchCompleted,
  onViewHistory,
}) => {
  // Batch Setup State
  const [batchNumber, setBatchNumber] = useState<string>('BTH-DHL-9041');
  const [targetQty, setTargetQty] = useState<number>(50);
  const [activeBatch, setActiveBatch] = useState<Batch | null>(null);
  const [isSessionLocked, setIsSessionLocked] = useState<boolean>(false);

  // Scanning Inputs
  const [material1, setMaterial1] = useState<string>('');
  const [material2, setMaterial2] = useState<string>('');
  const [material1Locked, setMaterial1Locked] = useState<boolean>(false);

  // Session Audit Scans
  const [sessionScans, setSessionScans] = useState<ScanItem[]>([]);
  const [mismatchCount, setMismatchCount] = useState<number>(0);

  // Modals
  const [mismatchData, setMismatchData] = useState<{
    isOpen: boolean;
    material1: string;
    material2: string;
    itemIndex: number;
  } | null>(null);
  const [isCompletionOpen, setIsCompletionOpen] = useState<boolean>(false);
  const [cameraModal, setCameraModal] = useState<{
    isOpen: boolean;
    target: 'material1' | 'material2';
  }>({ isOpen: false, target: 'material1' });

  // Input DOM Refs for Auto-Focus & Auto-Advance
  const mat1InputRef = useRef<HTMLInputElement | null>(null);
  const mat2InputRef = useRef<HTMLInputElement | null>(null);

  // Auto-focus Material 1 on initial render or when session starts
  useEffect(() => {
    if (!mismatchData?.isOpen && !isCompletionOpen) {
      if (!material1Locked) {
        mat1InputRef.current?.focus();
      } else {
        mat2InputRef.current?.focus();
      }
    }
  }, [material1Locked, mismatchData?.isOpen, isCompletionOpen]);

  // Generate a realistic DHL batch number
  const handleGenerateBatch = () => {
    if (isSessionLocked) return;
    const randomId = Math.floor(1000 + Math.random() * 9000);
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    setBatchNumber(`BTH-DHL-${dateStr}-${randomId}`);
  };

  // Initialize or resume the batch session
  const startOrResumeBatch = useCallback(async () => {
    if (!batchNumber.trim()) return;

    try {
      const res = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchNumber: batchNumber.trim(),
          targetQty: Number(targetQty) || 50,
          operatorName: currentUser?.name || 'Warehouse Operator',
          operatorEmail: currentUser?.email || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setActiveBatch(data.batch);
      } else {
        throw new Error('API batch create failed');
      }
    } catch {
      // Local fallback if API is starting up
      const mockBatch: Batch = {
        id: Date.now(),
        batchNumber: batchNumber.trim(),
        targetQty: Number(targetQty) || 50,
        completedQty: 0,
        mismatchCount: 0,
        status: 'in_progress',
        operatorName: currentUser?.name || 'Warehouse Operator',
        createdAt: new Date().toISOString(),
      };
      setActiveBatch(mockBatch);
    }

    setIsSessionLocked(true);
    setSessionScans([]);
    setMismatchCount(0);
    setMaterial1('');
    setMaterial2('');
    setMaterial1Locked(false);
    setTimeout(() => {
      mat1InputRef.current?.focus();
    }, 100);
  }, [batchNumber, targetQty, currentUser]);

  // Execute Auto-Validation when Material 2 is scanned
  const handleValidatePair = useCallback(
    async (m1Val: string, m2Val: string) => {
      const clean1 = m1Val.trim();
      const clean2 = m2Val.trim();

      if (!clean1 || !clean2) return;

      const currentCompleted = activeBatch?.completedQty || sessionScans.filter((s) => s.isMatch).length;
      const nextIndex = currentCompleted + 1;
      const isMatch = clean1 === clean2;

      if (!isMatch) {
        // --- MISMATCH FLOW ---
        const newMismatchTotal = mismatchCount + 1;
        setMismatchCount(newMismatchTotal);

        if (!isMuted) {
          playLoudAlarm();
        }

        // Open Red Popup Modal
        setMismatchData({
          isOpen: true,
          material1: clean1,
          material2: clean2,
          itemIndex: nextIndex,
        });

        // Record Mismatch in audit log
        const errorItem: ScanItem = {
          batchId: activeBatch?.id || 1,
          itemIndex: nextIndex,
          material1: clean1,
          material2: clean2,
          isMatch: false,
          scannedAt: new Date().toISOString(),
          errorReason: 'Barcode discrepancy between Material 1 and 2',
        };

        setSessionScans((prev) => [errorItem, ...prev]);

        // Post to backend database
        if (activeBatch?.id) {
          try {
            fetch('/api/scans', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                batchId: activeBatch.id,
                itemIndex: nextIndex,
                material1: clean1,
                material2: clean2,
                isMatch: false,
                errorReason: 'Barcode discrepancy',
              }),
            });
          } catch {
            // Ignore background error
          }
        }
      } else {
        // --- MATCH FLOW ---
        if (!isMuted) {
          playMatchBeep();
        }

        const newCompletedQty = currentCompleted + 1;

        const matchedItem: ScanItem = {
          batchId: activeBatch?.id || 1,
          itemIndex: newCompletedQty,
          material1: clean1,
          material2: clean2,
          isMatch: true,
          scannedAt: new Date().toISOString(),
        };

        setSessionScans((prev) => [matchedItem, ...prev]);

        if (activeBatch) {
          setActiveBatch((prev) =>
            prev ? { ...prev, completedQty: newCompletedQty } : null
          );
        }

        // Post to backend database
        if (activeBatch?.id) {
          try {
            fetch('/api/scans', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                batchId: activeBatch.id,
                itemIndex: newCompletedQty,
                material1: clean1,
                material2: clean2,
                isMatch: true,
              }),
            });
          } catch {
            // Ignore background error
          }
        }

        // Clear scanning fields immediately
        setMaterial1('');
        setMaterial2('');
        setMaterial1Locked(false);

        // Check if Batch reached Target Qty (e.g. 50/50)
        const target = activeBatch?.targetQty || targetQty || 50;
        if (newCompletedQty >= target) {
          if (!isMuted) {
            playSuccessFanfare();
          }

          if (activeBatch) {
            const completedBatchObj: Batch = {
              ...activeBatch,
              completedQty: newCompletedQty,
              status: 'completed',
              completedAt: new Date().toISOString(),
            };
            setActiveBatch(completedBatchObj);
            onBatchCompleted?.(completedBatchObj);

            // Mark batch as completed in database
            fetch('/api/batches', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'update_status',
                batchId: activeBatch.id,
                status: 'completed',
              }),
            });
          }

          setIsCompletionOpen(true);
        } else {
          // Immediately re-focus Material 1 for the next scan pair
          setTimeout(() => {
            mat1InputRef.current?.focus();
          }, 30);
        }
      }
    },
    [activeBatch, sessionScans, mismatchCount, isMuted, targetQty, onBatchCompleted]
  );

  // Keydown / Scanner handler for Material 1 (Auto-Advance to Material 2)
  const handleMaterial1KeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = material1.trim();
      if (!val) return;

      // Lock Material 1 and auto-transfer cursor focus to Material 2
      setMaterial1Locked(true);
      setTimeout(() => {
        mat2InputRef.current?.focus();
      }, 20);
    }
  };

  // Keydown / Scanner handler for Material 2 (Auto-Validate without button click)
  const handleMaterial2KeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = material2.trim();
      if (!val) return;

      handleValidatePair(material1, val);
    }
  };

  // Handle Edit & Re-Scan after Mismatch Alert
  const handleEditRescan = () => {
    stopAlarm();
    setMismatchData(null);
    setMaterial2('');
    // Focus back on Material 1 (or keep Material 1 and focus 2)
    setMaterial1Locked(false);
    setTimeout(() => {
      mat1InputRef.current?.focus();
      mat1InputRef.current?.select();
    }, 50);
  };

  // Simulation Helper for Testing without physical barcode scanner
  const handleSimulateScan = (type: 'match' | 'mismatch') => {
    if (!isSessionLocked) {
      startOrResumeBatch();
    }

    const currentIdx = (activeBatch?.completedQty || 0) + 1;
    const baseCode = `MAT-DHL-${String(currentIdx).padStart(4, '0')}-XYZ`;

    if (type === 'match') {
      setMaterial1(baseCode);
      setMaterial2(baseCode);
      setMaterial1Locked(true);
      setTimeout(() => {
        handleValidatePair(baseCode, baseCode);
      }, 150);
    } else {
      const mismatchCode = `MAT-DHL-${String(currentIdx).padStart(4, '0')}-ERR`;
      setMaterial1(baseCode);
      setMaterial2(mismatchCode);
      setMaterial1Locked(true);
      setTimeout(() => {
        handleValidatePair(baseCode, mismatchCode);
      }, 150);
    }
  };

  // Reset / Start fresh batch
  const handleResetBatch = () => {
    setIsSessionLocked(false);
    setActiveBatch(null);
    setSessionScans([]);
    setMaterial1('');
    setMaterial2('');
    setMaterial1Locked(false);
    setMismatchCount(0);
    handleGenerateBatch();
  };

  // Download CSV for the active batch
  const handleDownloadActiveCsv = () => {
    if (sessionScans.length === 0) return;

    const headers = ['Item #', 'Material 1', 'Material 2', 'Validation Result', 'Error Details', 'Timestamp'];
    const rows = sessionScans.map((s) => [
      s.itemIndex,
      `"${s.material1}"`,
      `"${s.material2}"`,
      s.isMatch ? 'MATCHED' : 'MISMATCH',
      s.errorReason ? `"${s.errorReason}"` : '',
      `"${s.scannedAt}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `dhl_${batchNumber}_scans.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const completed = activeBatch?.completedQty || sessionScans.filter((s) => s.isMatch).length;
  const currentTarget = activeBatch?.targetQty || targetQty || 50;
  const progressPercent = Math.min(100, Math.round((completed / currentTarget) * 100));

  return (
    <div className="space-y-6">
      {/* Station Control & Parameters Bar */}
      <div className="bg-white rounded-2xl shadow-md border-2 border-neutral-200 overflow-hidden">
        {/* Top Header Strip */}
        <div className="bg-[#FFCC00] px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 border-b-2 border-[#D40511]">
          <div className="flex items-center space-x-3">
            <span className="bg-[#D40511] text-white font-black italic px-2.5 py-1 text-sm rounded shadow-sm">
              STATION 01
            </span>
            <div>
              <h1 className="text-base sm:text-lg font-black text-[#1A1A1A] tracking-tight">
                MATERIAL VALIDATION WORKSTATION
              </h1>
              <p className="text-xs text-neutral-800 font-medium">
                Continuous 1-to-1 barcode matching verification
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isSessionLocked ? (
              <div className="flex items-center space-x-2 bg-[#1A1A1A] text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">
                <Lock className="w-3.5 h-3.5 text-[#FFCC00]" />
                <span>Session Active • Fields Locked</span>
                <button
                  type="button"
                  onClick={handleResetBatch}
                  className="ml-2 bg-neutral-700 hover:bg-[#D40511] px-2 py-0.5 rounded text-[10px] text-white uppercase font-bold transition-colors"
                >
                  New Batch
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={startOrResumeBatch}
                className="flex items-center space-x-1.5 bg-[#D40511] hover:bg-[#B0000D] text-white px-4 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider shadow transition-transform active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Lock & Start Batch</span>
              </button>
            )}
          </div>
        </div>

        {/* The 4 Core Parameter Columns: Batch, Qty, Material 1, Material 2 */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
            {/* Column 1: BATCH */}
            <div className="bg-neutral-50 rounded-xl p-4 border-2 border-neutral-200 focus-within:border-[#FFCC00] transition-colors relative">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-neutral-700 flex items-center space-x-1.5">
                  <Hash className="w-3.5 h-3.5 text-[#D40511]" />
                  <span>Batch Number</span>
                </label>
                {!isSessionLocked && (
                  <button
                    type="button"
                    onClick={handleGenerateBatch}
                    className="text-[10px] text-[#D40511] hover:underline font-bold"
                  >
                    Generate
                  </button>
                )}
              </div>
              <input
                type="text"
                disabled={isSessionLocked}
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                placeholder="e.g. BTH-DHL-9041"
                className={`w-full font-mono-code font-bold text-base sm:text-lg bg-white border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#FFCC00] ${
                  isSessionLocked
                    ? 'bg-neutral-100 text-neutral-800 border-neutral-300 cursor-not-allowed select-all'
                    : 'border-neutral-300 text-[#1A1A1A]'
                }`}
              />
              <span className="text-[10px] text-neutral-500 mt-1 block">
                {isSessionLocked ? 'Locked for 50 scans' : 'Enter or generate batch ID'}
              </span>
            </div>

            {/* Column 2: QTY */}
            <div className="bg-neutral-50 rounded-xl p-4 border-2 border-neutral-200 focus-within:border-[#FFCC00] transition-colors relative">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-neutral-700 flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#D40511]" />
                  <span>Target Qty</span>
                </label>
                <span className="text-[10px] bg-neutral-200 text-neutral-700 px-1.5 py-0.5 rounded font-bold">
                  Units
                </span>
              </div>
              <input
                type="number"
                min="1"
                max="1000"
                disabled={isSessionLocked}
                value={targetQty}
                onChange={(e) => setTargetQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className={`w-full font-mono-code font-bold text-base sm:text-lg bg-white border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#FFCC00] ${
                  isSessionLocked
                    ? 'bg-neutral-100 text-neutral-800 border-neutral-300 cursor-not-allowed'
                    : 'border-neutral-300 text-[#1A1A1A]'
                }`}
              />
              <span className="text-[10px] text-neutral-500 mt-1 block">
                Target cycles to validate (e.g. 50)
              </span>
            </div>

            {/* Column 3: MATERIAL 1 */}
            <div
              className={`rounded-xl p-4 border-2 transition-all relative ${
                !material1Locked
                  ? 'bg-amber-50/60 border-[#FFCC00] ring-2 ring-[#FFCC00]/30'
                  : 'bg-emerald-50/50 border-emerald-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-neutral-800 flex items-center space-x-1.5">
                  <Barcode className="w-4 h-4 text-[#D40511]" />
                  <span>Material 1</span>
                </label>
                <div className="flex items-center space-x-1">
                  {material1Locked && (
                    <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-bold flex items-center space-x-0.5">
                      <Check className="w-3 h-3" />
                      <span>Scanned</span>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setCameraModal({ isOpen: true, target: 'material1' })}
                    title="Scan with Camera"
                    className="p-1 text-neutral-600 hover:text-black hover:bg-neutral-200 rounded"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <input
                ref={mat1InputRef}
                type="text"
                autoComplete="off"
                value={material1}
                onChange={(e) => {
                  setMaterial1(e.target.value);
                  if (material1Locked) setMaterial1Locked(false);
                }}
                onKeyDown={handleMaterial1KeyDown}
                placeholder="Scan barcode 1..."
                className="w-full font-mono-code font-bold text-base sm:text-lg bg-white border border-neutral-300 rounded-lg px-3 py-2.5 text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FFCC00] focus:border-[#D40511]"
              />
              <span className="text-[10px] text-neutral-600 mt-1 flex items-center justify-between">
                <span>Scans Auto-Advance on Enter</span>
                {!material1Locked && <span className="font-bold text-[#D40511]">READY TO SCAN</span>}
              </span>
            </div>

            {/* Column 4: MATERIAL 2 */}
            <div
              className={`rounded-xl p-4 border-2 transition-all relative ${
                material1Locked
                  ? 'bg-amber-50/60 border-[#D40511] ring-2 ring-[#D40511]/30'
                  : 'bg-neutral-50 border-neutral-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-neutral-800 flex items-center space-x-1.5">
                  <Barcode className="w-4 h-4 text-[#D40511]" />
                  <span>Material 2</span>
                </label>
                <button
                  type="button"
                  onClick={() => setCameraModal({ isOpen: true, target: 'material2' })}
                  title="Scan with Camera"
                  className="p-1 text-neutral-600 hover:text-black hover:bg-neutral-200 rounded"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                ref={mat2InputRef}
                type="text"
                autoComplete="off"
                value={material2}
                onChange={(e) => setMaterial2(e.target.value)}
                onKeyDown={handleMaterial2KeyDown}
                placeholder="Scan barcode 2..."
                className="w-full font-mono-code font-bold text-base sm:text-lg bg-white border border-neutral-300 rounded-lg px-3 py-2.5 text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FFCC00] focus:border-[#D40511]"
              />
              <span className="text-[10px] text-neutral-600 mt-1 flex items-center justify-between">
                <span>Auto-Validates on Enter</span>
                {material1Locked && <span className="font-bold text-[#D40511]">WAITING FOR MAT 2</span>}
              </span>
            </div>
          </div>

          {/* Quick Simulation & Testing Toolbar */}
          <div className="mt-4 pt-4 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-3 bg-neutral-100/60 p-3 rounded-xl">
            <div className="flex items-center space-x-2 text-xs text-neutral-600">
              <Zap className="w-4 h-4 text-[#D40511]" />
              <span className="font-bold text-neutral-800">Scanner Emulation Tools:</span>
              <span className="hidden sm:inline text-neutral-500">
                (Click to test workflows without a physical barcode scanner gun)
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => handleSimulateScan('match')}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center space-x-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Simulate Matching Scan</span>
              </button>

              <button
                type="button"
                onClick={() => handleSimulateScan('mismatch')}
                className="px-3 py-1.5 bg-[#D40511] hover:bg-[#B0000D] text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center space-x-1"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Simulate Mismatch Alarm</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Progress Bar & Metric Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Main Progress Indicator */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border-2 border-neutral-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider text-neutral-500">
                Batch Validation Progress
              </span>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-black text-[#1A1A1A] font-mono-code">
                  {completed} / {currentTarget}
                </span>
                <span className="text-sm font-bold text-neutral-600">Items Verified</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-[#D40511] font-mono-code">
                {progressPercent}%
              </span>
              <span className="text-[11px] block text-neutral-500 font-semibold">Completed</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-neutral-200 h-4 rounded-full overflow-hidden p-0.5 border border-neutral-300">
            <div
              className="bg-gradient-to-r from-[#FFCC00] to-emerald-500 h-full rounded-full transition-all duration-300 shadow-inner"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-neutral-600 mt-2 font-medium">
            <span>Scan 1 of {currentTarget}</span>
            <span>{Math.max(0, currentTarget - completed)} items remaining</span>
          </div>
        </div>

        {/* Metric 1: Verified Pairs */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border-2 border-neutral-200 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs uppercase font-bold text-neutral-500 block">
              Success Matches
            </span>
            <span className="text-2xl font-black text-emerald-600 font-mono-code">
              {completed}
            </span>
            <span className="text-[10px] text-neutral-500 block">100% QA verified</span>
          </div>
        </div>

        {/* Metric 2: Mismatches Intercepted */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border-2 border-neutral-200 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-red-100 text-[#D40511] flex items-center justify-center shrink-0">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs uppercase font-bold text-neutral-500 block">
              Discrepancies Caught
            </span>
            <span className="text-2xl font-black text-[#D40511] font-mono-code">
              {mismatchCount}
            </span>
            <span className="text-[10px] text-neutral-500 block">Safety stops triggered</span>
          </div>
        </div>
      </div>

      {/* Real-time Session Audit Scans Table */}
      <div className="bg-white rounded-2xl shadow-md border-2 border-neutral-200 overflow-hidden">
        <div className="bg-neutral-50 px-6 py-4 flex items-center justify-between border-b border-neutral-200">
          <div className="flex items-center space-x-2">
            <Scan className="w-5 h-5 text-[#D40511]" />
            <h3 className="font-extrabold text-[#1A1A1A] text-sm sm:text-base">
              Current Session Audit Log ({sessionScans.length} Scans)
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            {sessionScans.length > 0 && (
              <button
                type="button"
                onClick={handleDownloadActiveCsv}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-neutral-200 hover:bg-[#FFCC00] text-[#1A1A1A] text-xs font-bold rounded-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Session CSV</span>
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-neutral-100/80 text-neutral-700 uppercase font-black tracking-wider text-[11px] border-b border-neutral-200">
                <th className="py-3 px-4">Cycle #</th>
                <th className="py-3 px-4">Material 1 Barcode</th>
                <th className="py-3 px-4">Material 2 Barcode</th>
                <th className="py-3 px-4">Validation Status</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {sessionScans.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-neutral-400">
                    <Scan className="w-10 h-10 mx-auto mb-2 text-neutral-300" />
                    <p className="font-medium text-sm text-neutral-500">
                      Workstation is ready. Scan Material 1 and Material 2 to start validating.
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">
                      Batch parameters remain locked during all {currentTarget} scans.
                    </p>
                  </td>
                </tr>
              ) : (
                sessionScans.map((scan, idx) => (
                  <tr
                    key={idx}
                    className={`hover:bg-neutral-50 transition-colors ${
                      !scan.isMatch ? 'bg-red-50/50' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-neutral-700">
                      #{scan.itemIndex}
                    </td>
                    <td className="py-3 px-4 font-mono-code font-bold text-[#1A1A1A]">
                      {scan.material1}
                    </td>
                    <td className="py-3 px-4 font-mono-code font-bold text-[#1A1A1A]">
                      {scan.material2}
                    </td>
                    <td className="py-3 px-4">
                      {scan.isMatch ? (
                        <span className="inline-flex items-center space-x-1 bg-emerald-100 text-emerald-800 text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>MATCHED</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 bg-red-100 text-[#D40511] text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-red-300">
                          <AlertTriangle className="w-3 h-3 text-[#D40511]" />
                          <span>MISMATCH</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-neutral-500 font-mono">
                      {new Date(scan.scannedAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mismatch Alert Red Modal */}
      {mismatchData && (
        <MismatchModal
          isOpen={mismatchData.isOpen}
          material1={mismatchData.material1}
          material2={mismatchData.material2}
          itemIndex={mismatchData.itemIndex}
          batchNumber={batchNumber}
          onEditRescan={handleEditRescan}
        />
      )}

      {/* 50/50 Completion Green Celebration Modal */}
      <CompletionModal
        isOpen={isCompletionOpen}
        batch={activeBatch}
        onDownloadCsv={handleDownloadActiveCsv}
        onStartNewBatch={() => {
          setIsCompletionOpen(false);
          handleResetBatch();
        }}
        onClose={() => setIsCompletionOpen(false)}
      />

      {/* Camera Barcode Scanner Modal */}
      <CameraScannerModal
        isOpen={cameraModal.isOpen}
        targetField={cameraModal.target}
        onClose={() => setCameraModal({ isOpen: false, target: 'material1' })}
        onBarcodeDetected={(barcode) => {
          if (cameraModal.target === 'material1') {
            setMaterial1(barcode);
            setMaterial1Locked(true);
            setTimeout(() => {
              mat2InputRef.current?.focus();
            }, 50);
          } else {
            setMaterial2(barcode);
            setTimeout(() => {
              handleValidatePair(material1, barcode);
            }, 50);
          }
        }}
      />
    </div>
  );
};
