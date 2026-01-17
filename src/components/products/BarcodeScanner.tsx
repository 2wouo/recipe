'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, RefreshCw, AlertCircle, Keyboard } from 'lucide-react';

interface BarcodeScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
  onManualInput?: () => void;
}

interface CameraDevice {
  id: string;
  label: string;
}

export default function BarcodeScanner({ onScanSuccess, onClose, onManualInput }: BarcodeScannerProps) {
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [permissionError, setPermissionError] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerId = "reader-custom-v2";

  const stopScanning = useCallback(async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        setIsScanning(false);
      } catch (err) {
        console.error("Failed to stop scanner", err);
      }
    }
  }, []);

  const startScanning = useCallback(async (cameraId: string) => {
    // 1. Cleanup previous instance
    await stopScanning();

    // 2. Wait for DOM element to be surely present
    setTimeout(async () => {
      const html5QrCode = new Html5Qrcode(readerId);
      scannerRef.current = html5QrCode;

      try {
        await html5QrCode.start(
          cameraId,
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
            stopScanning().then(() => {
              onScanSuccess(decodedText);
            });
          },
          () => {} // error ignore
        );
        setIsScanning(true);
      } catch (err) {
        console.error("Failed to start scanner with ID:", cameraId, err);
        // If ID fails, fallback to environment facingMode
        try {
            await html5QrCode.start(
                { facingMode: "environment" },
                { fps: 15, qrbox: { width: 250, height: 150 } },
                (decodedText) => {
                    stopScanning().then(() => onScanSuccess(decodedText));
                },
                () => {}
            );
            setIsScanning(true);
        } catch (fallbackErr) {
            console.error("Fallback scanning failed", fallbackErr);
            setIsScanning(false);
        }
      }
    }, 100);
  }, [onScanSuccess, stopScanning]);

  // 1. Initial Camera Setup
  useEffect(() => {
    let isMounted = true;

    Html5Qrcode.getCameras().then(devices => {
      if (!isMounted) return;
      setIsInitializing(false);
      
      if (devices && devices.length) {
        const mapped = devices.map(d => ({ id: d.id, label: d.label }));
        setCameras(mapped);
        
        // Find best back camera
        // Modern phones have multiple 'back' cameras. The first one is usually the main wide.
        const backCams = mapped.filter(d => 
            d.label.toLowerCase().includes('back') || 
            d.label.toLowerCase().includes('rear') ||
            d.label.toLowerCase().includes('0')
        );

        const targetId = backCams.length > 0 ? backCams[0].id : devices[0].id;
        setSelectedCameraId(targetId);
      }
    }).catch(err => {
      console.error("Camera list error:", err);
      setIsInitializing(false);
      setPermissionError(true);
    });

    return () => {
      isMounted = false;
      stopScanning();
    };
  }, [stopScanning]);

  // 2. Start scanning when ID is selected
  useEffect(() => {
    if (selectedCameraId) {
      startScanning(selectedCameraId);
    }
  }, [selectedCameraId, startScanning]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md h-full md:h-auto md:max-h-[90vh] md:rounded-lg bg-zinc-900 shadow-2xl border border-zinc-800 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-zinc-800 bg-zinc-900/50 shrink-0">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Camera className="text-blue-500" size={18} />
            바코드 스캔
          </h3>
          <button onClick={() => { stopScanning(); onClose(); }} className="text-zinc-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Viewfinder Area */}
        <div className="relative flex-1 bg-black flex flex-col items-center justify-center overflow-hidden">
            {isInitializing ? (
                <div className="text-center space-y-3">
                    <RefreshCw className="mx-auto animate-spin text-blue-500" size={32} />
                    <p className="text-sm text-zinc-500">카메라 준비 중...</p>
                </div>
            ) : permissionError ? (
                <div className="text-center p-8 space-y-4">
                    <AlertCircle className="mx-auto text-red-500" size={48} />
                    <div className="space-y-2">
                        <p className="font-bold text-white">카메라 권한 거부됨</p>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                            브라우저 설정에서 카메라 권한을 허용하신 후 다시 시도해 주세요. <br/>
                            (iOS: 설정 - Safari - 카메라 허용)
                        </p>
                    </div>
                </div>
            ) : (
                <div className="w-full h-full relative">
                    <div id={readerId} className="w-full h-full" />
                    
                    {/* Visual Overlay */}
                    {isScanning && (
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                            <div className="w-[80%] h-[30%] border-2 border-blue-500/40 rounded-lg relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-[2px] bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,1)] animate-scan" />
                            </div>
                            <p className="absolute bottom-[20%] text-[10px] text-zinc-500 font-medium tracking-widest">
                                SCANNING BARCODE...
                            </p>
                        </div>
                    )}

                    {/* Camera Switcher / Manual Input Float */}
                    <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-3 px-4">
                        {cameras.length > 1 && (
                            <button 
                                onClick={() => setSelectedCameraId(null)}
                                className="flex items-center gap-2 bg-zinc-900/80 backdrop-blur border border-white/10 px-4 py-2 rounded-full text-xs text-white shadow-lg"
                            >
                                <RefreshCw size={14} />
                                카메라 변경
                            </button>
                        )}
                        <button 
                            onClick={() => { stopScanning(); onManualInput?.(); }}
                            className="flex items-center gap-2 bg-blue-600/90 backdrop-blur px-4 py-2 rounded-full text-xs text-white shadow-lg font-bold"
                        >
                            <Keyboard size={14} />
                            번호 직접 입력
                        </button>
                    </div>
                </div>
            )}

            {/* Camera Selection Grid (Only if explicit change requested) */}
            {!isInitializing && !permissionError && !selectedCameraId && (
                <div className="absolute inset-0 bg-zinc-950 p-6 overflow-y-auto">
                    <p className="text-xs font-bold text-zinc-500 mb-4 uppercase tracking-wider">사용 가능한 카메라</p>
                    <div className="grid gap-2">
                        {cameras.map(cam => (
                            <button
                                key={cam.id}
                                onClick={() => setSelectedCameraId(cam.id)}
                                className="w-full flex items-center gap-4 p-4 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-blue-500 transition-all text-left"
                            >
                                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                                    <Camera size={20} className="text-zinc-400" />
                                </div>
                                <span className="text-sm font-medium text-zinc-200">{cam.label || `Camera ${cam.id.slice(0, 5)}`}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}