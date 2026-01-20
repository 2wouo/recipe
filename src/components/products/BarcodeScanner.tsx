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
  const [isScanning, setIsScanning] = useState(false);
  const [permissionError, setPermissionError] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [cameraIndex, setCameraIndex] = useState(0);
  const [availableCameras, setAvailableCameras] = useState<CameraDevice[]>([]);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isMountedRef = useRef(true);
  const readerId = "reader-v3-pro";

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

  const startWithId = useCallback(async (id: string) => {
    await stopScanning();
    // DOM 렌더링 대기
    await new Promise(r => setTimeout(r, 100));
    
    const html5QrCode = new Html5Qrcode(readerId);
    scannerRef.current = html5QrCode;

    try {
      await html5QrCode.start(
        id,
        {
          fps: 15,
          qrbox: (w, h) => {
            const minEdge = Math.min(w, h);
            const size = Math.floor(minEdge * 0.8);
            return { width: size, height: Math.floor(size * 0.5) };
          },
          aspectRatio: 1.0,
        },
        (text) => { stopScanning().then(() => onScanSuccess(text)); },
        () => {}
      );
      setIsScanning(true);
      setIsInitializing(false);
    } catch (err) {
      console.error("Start failed with ID", err);
      // 폴백: 제약 조건으로 시도
      try {
        await html5QrCode.start(
            { facingMode: "environment" },
            { fps: 15, qrbox: { width: 250, height: 150 } },
            (text) => { stopScanning().then(() => onScanSuccess(text)); },
            () => {}
        );
        setIsScanning(true);
        setIsInitializing(false);
      } catch (e) {
        setPermissionError(true);
        setIsInitializing(false);
      }
    }
  }, [onScanSuccess, stopScanning]);

  useEffect(() => {
    isMountedRef.current = true;
    // 스캔 시작 시 네비게이션 숨기기
    document.body.classList.add('scanner-active');
    
    const init = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (!isMountedRef.current) return;

        if (devices && devices.length > 0) {
          const backCameras = devices.filter(d => 
            !d.label.toLowerCase().includes('front') && 
            !d.label.toLowerCase().includes('user') &&
            !d.label.toLowerCase().includes('selfie')
          );

          const sortedDevices = backCameras.length > 0 ? [...backCameras] : devices;
          setAvailableCameras(sortedDevices);
          startWithId(sortedDevices[0].id);
        }
      } catch (err) {
        console.error("Init failed", err);
        setPermissionError(true);
        setIsInitializing(false);
      }
    };

    init();

    return () => {
      isMountedRef.current = false;
      stopScanning();
      // 스캔 종료 시 네비게이션 복구
      document.body.classList.remove('scanner-active');
    };
  }, [startWithId, stopScanning]);

  const toggleCamera = () => {
    const nextIndex = (cameraIndex + 1) % availableCameras.length;
    setCameraIndex(nextIndex);
    startWithId(availableCameras[nextIndex].id);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black backdrop-blur-md animate-in fade-in duration-200 h-[100dvh]">
      <div className="relative w-full max-w-md h-full md:h-auto md:aspect-[3/4] md:rounded-lg bg-zinc-900 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 pt-12 md:pt-4 flex items-center justify-between border-b border-zinc-800 bg-zinc-900/50 shrink-0">
          <h3 className="font-bold text-white flex items-center gap-2 text-sm">
            <Camera className="text-blue-500" size={16} />
            바코드 스캔 {isScanning && "(ON)"}
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
                    <p className="text-xs text-zinc-500">후면 카메라 연결 중...</p>
                </div>
            )}

            {permissionError && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-950 p-8 text-center space-y-4">
                    <AlertCircle className="text-red-500" size={48} />
                    <p className="text-sm text-white">카메라를 사용할 수 없습니다.</p>
                    <button onClick={() => window.location.reload()} className="px-4 py-2 bg-zinc-800 text-white text-xs rounded-sm">새로고침</button>
                </div>
            )}

            {/* Manual Input & Toggle */}
            <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center gap-4 px-4 pb-16 md:pb-10 bg-gradient-to-t from-black/90 to-transparent pt-12">
                <div className="flex gap-2">
                    {availableCameras.length > 1 && (
                        <button 
                            onClick={toggleCamera}
                            className="flex items-center gap-2 bg-zinc-800/90 backdrop-blur px-5 py-3 rounded-full text-xs text-white shadow-xl border border-white/10"
                        >
                            <RefreshCw size={16} />
                            카메라 전환
                        </button>
                    )}
                    <button 
                        onClick={() => { stopScanning(); onManualInput?.(); }}
                        className="flex items-center gap-2 bg-blue-600 px-6 py-3 rounded-full text-xs text-white shadow-xl font-bold active:scale-95"
                    >
                        <Keyboard size={16} />
                        직접 입력
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}