import React, { useEffect } from 'react';
import { AlertTriangle, RotateCcw, XCircle, ArrowRight } from 'lucide-react';
import { stopAlarm } from '../utils/audio';

interface MismatchModalProps {
  isOpen: boolean;
  material1: string;
  material2: string;
  itemIndex: number;
  batchNumber: string;
  onEditRescan: () => void;
}

export const MismatchModal: React.FC<MismatchModalProps> = ({
  isOpen,
  material1,
  material2,
  itemIndex,
  batchNumber,
  onEditRescan,
}) => {
  // Listen for Enter or Escape to immediately dismiss and re-scan
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'Escape' || e.key === 'F2') {
        e.preventDefault();
        stopAlarm();
        onEditRescan();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onEditRescan]);

  if (!isOpen) return null;

  // Highlight character differences
  const maxLen = Math.max(material1.length, material2.length);
  const diffChars1 = [];
  const diffChars2 = [];

  for (let i = 0; i < maxLen; i++) {
    const c1 = material1[i] || '';
    const c2 = material2[i] || '';
    const isDiff = c1 !== c2;

    diffChars1.push(
      <span
        key={i}
        className={isDiff ? 'bg-red-900 text-white font-bold px-0.5 rounded underline decoration-yellow-400' : ''}
      >
        {c1 || '␣'}
      </span>
    );
    diffChars2.push(
      <span
        key={i}
        className={isDiff ? 'bg-red-900 text-white font-bold px-0.5 rounded underline decoration-yellow-400' : ''}
      >
        {c2 || '␣'}
      </span>
    );
  }

  const handleAction = () => {
    stopAlarm();
    onEditRescan();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#D40511] text-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border-4 border-[#FFCC00] animate-alarm-pulse">
        {/* Top Hazard Warning Banner */}
        <div className="bg-black/30 px-6 py-4 flex items-center justify-between border-b border-red-400/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-white text-[#D40511] flex items-center justify-center shrink-0 shadow-md animate-bounce">
              <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-xs uppercase font-extrabold tracking-widest text-yellow-300">
                QA Discrepancy Alert • Item #{itemIndex}
              </span>
              <h2 className="text-xl font-black tracking-tight leading-tight">
                MATERIAL MISMATCH DETECTED!
              </h2>
            </div>
          </div>
          <span className="bg-black/50 text-[#FFCC00] text-xs font-mono font-bold px-2 py-1 rounded">
            Batch: {batchNumber}
          </span>
        </div>

        {/* Comparison Section */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-red-100 font-medium">
            The scanned barcode for <strong className="text-white">Material 2</strong> does not match{' '}
            <strong className="text-white">Material 1</strong>. Batch verification halted for safety.
          </p>

          <div className="grid grid-cols-1 gap-3">
            {/* Material 1 Box */}
            <div className="bg-black/40 rounded-xl p-3.5 border border-red-300/30">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-yellow-300">
                  Material 1 (Primary Scan)
                </span>
                <span className="text-[10px] text-neutral-300 font-mono">
                  Length: {material1.length}
                </span>
              </div>
              <div className="font-mono-code text-lg sm:text-xl font-bold tracking-wider text-white bg-black/60 px-3 py-2 rounded-lg border border-neutral-700 break-all select-all">
                {diffChars1}
              </div>
            </div>

            {/* Material 2 Box */}
            <div className="bg-black/40 rounded-xl p-3.5 border border-red-300/30">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-red-200">
                  Material 2 (Mismatch Scan)
                </span>
                <span className="text-[10px] text-neutral-300 font-mono">
                  Length: {material2.length}
                </span>
              </div>
              <div className="font-mono-code text-lg sm:text-xl font-bold tracking-wider text-yellow-300 bg-black/60 px-3 py-2 rounded-lg border border-neutral-700 break-all select-all">
                {diffChars2}
              </div>
            </div>
          </div>

          <div className="bg-red-950/60 rounded-lg p-3 text-xs text-red-200 flex items-center justify-between border border-red-800">
            <span className="font-semibold">
              Action Required: Re-scan correct item to proceed.
            </span>
            <kbd className="hidden sm:inline bg-black/50 text-yellow-300 px-2 py-0.5 rounded font-mono text-[11px] border border-neutral-700">
              Press [Enter]
            </kbd>
          </div>

          {/* Action Button: Edit & Re-scan */}
          <button
            type="button"
            onClick={handleAction}
            className="w-full py-4 bg-[#FFCC00] hover:bg-[#E6B800] text-[#1A1A1A] font-extrabold text-base rounded-xl shadow-lg transition-transform active:scale-98 flex items-center justify-center space-x-2.5 cursor-pointer"
          >
            <RotateCcw className="w-5 h-5 stroke-[2.5]" />
            <span>EDIT & RE-SCAN PAIR</span>
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};
