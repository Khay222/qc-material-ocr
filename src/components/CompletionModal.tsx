import React, { useEffect } from 'react';
import { CheckCircle2, Download, PlusCircle, ArrowRight, ShieldCheck, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Batch } from '../types';

interface CompletionModalProps {
  isOpen: boolean;
  batch: Batch | null;
  onDownloadCsv: () => void;
  onStartNewBatch: () => void;
  onClose: () => void;
}

export const CompletionModal: React.FC<CompletionModalProps> = ({
  isOpen,
  batch,
  onDownloadCsv,
  onStartNewBatch,
  onClose,
}) => {
  useEffect(() => {
    if (isOpen) {
      // Fire festive confetti cannon
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FFCC00', '#D40511', '#10B981', '#1A1A1A'],
        });
        setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#FFCC00', '#D40511', '#10B981'],
          });
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#FFCC00', '#D40511', '#10B981'],
          });
        }, 250);
      } catch {
        // ignore if confetti fails in headless env
      }
    }
  }, [isOpen]);

  if (!isOpen || !batch) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-emerald-900 text-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border-4 border-emerald-400 animate-success-glow">
        {/* Celebration Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 px-6 py-6 text-center border-b border-emerald-600/40 relative">
          <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto mb-3 shadow-lg border-2 border-emerald-300">
            <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
          </div>
          <div className="inline-block bg-[#FFCC00] text-[#1A1A1A] text-xs font-black uppercase px-3 py-1 rounded-full mb-2 tracking-wider">
            100% Quality Verified
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            BATCH VALIDATION COMPLETE!
          </h2>
          <p className="text-emerald-200 text-sm mt-1">
            All {batch.targetQty} of {batch.targetQty} material pairs have been inspected and matched successfully.
          </p>
        </div>

        {/* Batch Summary Report Card */}
        <div className="p-6 space-y-5 bg-emerald-950/80">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-black/40 rounded-xl p-3 border border-emerald-700/50">
              <span className="text-[11px] uppercase tracking-wider text-emerald-300 font-bold block mb-0.5">
                Batch Number
              </span>
              <span className="font-mono-code font-bold text-lg text-[#FFCC00]">
                {batch.batchNumber}
              </span>
            </div>

            <div className="bg-black/40 rounded-xl p-3 border border-emerald-700/50">
              <span className="text-[11px] uppercase tracking-wider text-emerald-300 font-bold block mb-0.5">
                Total Validated
              </span>
              <span className="font-mono-code font-bold text-lg text-emerald-400">
                {batch.completedQty} / {batch.targetQty} Units
              </span>
            </div>

            <div className="bg-black/40 rounded-xl p-3 border border-emerald-700/50">
              <span className="text-[11px] uppercase tracking-wider text-emerald-300 font-bold block mb-0.5">
                Quality Officer
              </span>
              <span className="font-semibold text-white truncate block">
                {batch.operatorName}
              </span>
            </div>

            <div className="bg-black/40 rounded-xl p-3 border border-emerald-700/50">
              <span className="text-[11px] uppercase tracking-wider text-emerald-300 font-bold block mb-0.5">
                Discrepancies Caught
              </span>
              <span className="font-mono-code font-bold text-lg text-amber-400">
                {batch.mismatchCount} Intercepted
              </span>
            </div>
          </div>

          <div className="p-3 bg-black/40 rounded-xl border border-emerald-700/40 text-xs text-emerald-200 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-[#FFCC00] shrink-0" />
            <span>Audit record logged and secured in Netlify Database. Ready for logistics dispatch.</span>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={onDownloadCsv}
              className="w-full py-3.5 bg-[#FFCC00] hover:bg-[#E6B800] text-[#1A1A1A] font-extrabold text-sm rounded-xl shadow-md transition-transform active:scale-98 flex items-center justify-center space-x-2"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>DOWNLOAD BATCH CSV REPORT</span>
            </button>

            <button
              type="button"
              onClick={onStartNewBatch}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center space-x-2 border border-emerald-400/40"
            >
              <PlusCircle className="w-4 h-4" />
              <span>START NEXT BATCH</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 text-xs text-emerald-300 hover:text-white transition-colors text-center"
            >
              Review Current Workstation Table
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
