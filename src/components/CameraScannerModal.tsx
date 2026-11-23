import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, Check, RefreshCw, AlertCircle } from 'lucide-react';

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetField: 'material1' | 'material2';
  onBarcodeDetected: (barcode: string) => void;
}

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  isOpen,
  onClose,
  targetField,
  onBarcodeDetected,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    if (isOpen) {
      setError(null);
      navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'environment' } })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play();
            setCameraActive(true);
          }
        })
        .catch((err) => {
          console.warn('Camera access unavailable:', err);
          setError('Camera access not available on this device or permission was denied. You can still use physical handheld scanner or manual input.');
          setCameraActive(false);
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      setCameraActive(false);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border-2 border-[#FFCC00]">
        <div className="bg-[#FFCC00] px-4 py-3 flex items-center justify-between border-b-2 border-[#D40511]">
          <div className="flex items-center space-x-2">
            <Camera className="w-5 h-5 text-[#D40511]" />
            <h3 className="font-extrabold text-[#1A1A1A] text-sm sm:text-base">
              Camera Scanner • Targeting {targetField === 'material1' ? 'Material 1' : 'Material 2'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-700 hover:text-black p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="relative aspect-4/3 bg-black rounded-lg overflow-hidden flex items-center justify-center border-2 border-dashed border-[#FFCC00]">
            <video
              ref={videoRef}
              className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
              playsInline
              muted
            />

            {/* Target Reticle Overlay */}
            {cameraActive && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-28 border-2 border-[#FFCC00] rounded-lg shadow-lg relative">
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#D40511] opacity-75 animate-pulse" />
                </div>
              </div>
            )}

            {!cameraActive && (
              <div className="p-6 text-center text-neutral-400">
                <Camera className="w-12 h-12 mx-auto mb-2 text-neutral-600" />
                <p className="text-xs text-neutral-300">
                  {error || 'Align barcode inside viewfinder'}
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-200">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 block mb-2">
              Sample Barcodes for Quick Testing:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {['DHL-PKG-98214', 'DHL-PKG-98215', 'MAT-8849-B2', 'SKU-00492-X'].map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => {
                    onBarcodeDetected(sample);
                    onClose();
                  }}
                  className="px-2.5 py-1 bg-neutral-100 hover:bg-[#FFCC00] text-xs font-mono font-semibold rounded border border-neutral-300 transition-colors"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
