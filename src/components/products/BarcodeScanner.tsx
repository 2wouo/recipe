'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, RefreshCw, AlertCircle, Keyboard } from 'lucide-react';

interface BarcodeScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
  onManualInput?: () => void;
}

export default function BarcodeScanner({ onScanSuccess, onClose, onManualInput }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [permissionError, setPermissionError] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerId = "reader-final";

  const stopScanning = useCallback(async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        setIsScanning(false);
      } catch (err) {
        console.error("Stop failed", err);
      }
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const start = async () => {
      // 컴포넌트가 확실히 마운트된 후 실행
      await new Promise(resolve => setTimeout(resolve, 300));
      if (!isMounted) return;

      const html5QrCode = new Html5Qrcode(readerId);
      scannerRef.current = html5QrCode;

      try {
        await html5QrCode.start(
          { facingMode: "environment" }, // 후면 카메라 강제 요청
          {
            fps: 15,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
              const size = Math.floor(minEdge * 0.8);
              return { width: size, height: Math.floor(size * 0.5) };
            },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            stopScanning().then(() => onScanSuccess(decodedText));
          },
          () => {} // 스캔 중 오류 무시
        );
        if (isMounted) {
          setIsScanning(true);
          setIsInitializing(false);
        }
      } catch (err) {
        console.error("Camera start failed", err);
        if (isMounted) {
          setPermissionError(true);
          setIsInitializing(false);
        }
      }
    };

    start();

    return () => {
      isMounted = false;
      stopScanning();
    };
  }, [onScanSuccess, stopScanning]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md h-full md:h-auto md:aspect-[3/4] md:rounded-lg bg-zinc-900 shadow-2xl border border-zinc-800 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-zinc-800 bg-zinc-900/50 shrink-0">
          <h3 className="font-bold text-white flex items-center gap-2 text-sm">
            <Camera className="text-blue-500" size={16} />
            바코드 스캔
          </h3>
          <button onClick={() => { stopScanning(); onClose(); }} className="text-zinc-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Viewfinder Area */}
        <div className="relative flex-1 bg-black flex flex-col items-center justify-center overflow-hidden">
            <div id={readerId} className="w-full h-full" />
            
            {isInitializing && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950 space-y-3">
                    <RefreshCw className="animate-spin text-blue-500" size={32} />
                    <p className="text-xs text-zinc-500">카메라를 연결하는 중...</p>
                </div>
            )}

            {permissionError && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-950 p-8 text-center space-y-4">
                    <AlertCircle className="text-red-500" size={48} />
                    <div className="space-y-2">
                        <p className="font-bold text-white text-sm">카메라를 켤 수 없습니다</p>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                            카메라 권한이 거부되었거나 지원하지 않는 기기입니다. <br/>
                            브라우저 설정에서 권한을 확인해 주세요.
                        </p>
                    </div>
                    <button 
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-zinc-800 text-white text-xs rounded-sm"
                    >
                        새로고침
                    </button>
                </div>
            )}

            {/* Scanning Overlay */}
            {isScanning && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-[80%] h-[25%] border border-blue-500/30 rounded-lg relative overflow-hidden bg-blue-500/5">
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-blue-500 shadow-[0_0_10px_rgba(37,99,235,1)] animate-scan" />
                    </div>
                </div>
            )}

            {/* Manual Input Float */}
            <div className="absolute bottom-10 left-0 right-0 flex justify-center px-4">
                <button 
                    onClick={() => { stopScanning(); onManualInput?.(); }}
                    className="flex items-center gap-2 bg-blue-600 px-6 py-3 rounded-full text-xs text-white shadow-xl font-bold active:scale-95 transition-transform"
                >
                    <Keyboard size={16} />
                    바코드 번호 직접 입력
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}
