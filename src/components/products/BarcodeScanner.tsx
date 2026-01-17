'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
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
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerId = "reader-custom";

  // 1. 초기화 및 카메라 목록 가져오기
  useEffect(() => {
    let isMounted = true;

    Html5Qrcode.getCameras().then(devices => {
      if (!isMounted) return;
      
      if (devices && devices.length) {
        setCameras(devices.map(d => ({ id: d.id, label: d.label })));
        
        // [고도화] 후면 카메라(back/environment)를 찾아서 자동으로 선택
        const backCamera = devices.find(d => 
            d.label.toLowerCase().includes('back') || 
            d.label.toLowerCase().includes('rear') ||
            d.label.toLowerCase().includes('environment')
        );
        
        if (backCamera) {
            setSelectedCameraId(backCamera.id);
        } else if (devices.length === 1) {
            setSelectedCameraId(devices[0].id);
        }
      }
    }).catch(err => {
      console.error("Camera access error:", err);
      setPermissionError(true);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. 카메라 선택 시 스캔 시작
  useEffect(() => {
    if (selectedCameraId && !isScanning) {
        startScanning(selectedCameraId);
    }
  }, [selectedCameraId]);

  // 스캔 시작 함수
  const startScanning = async (cameraId: string) => {
    if (scannerRef.current) {
        await stopScanning();
    }

    const html5QrCode = new Html5Qrcode(readerId, {
        verbose: false,
        experimentalFeatures: {
            useBarCodeDetectorIfSupported: true // 하드웨어 가속 사용 (매우 중요)
        }
    });
    scannerRef.current = html5QrCode;

    try {
        await html5QrCode.start(
            cameraId, 
            {
                fps: 20,
                qrbox: (viewfinderWidth, viewfinderHeight) => {
                    // 화면 크기에 맞게 인식 영역을 유동적으로 크게 설정
                    const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                    const size = Math.floor(minEdge * 0.7);
                    return { width: size, height: Math.floor(size * 0.6) };
                },
                aspectRatio: 1.0,
            },
            (decodedText) => {
                stopScanning().then(() => {
                    onScanSuccess(decodedText);
                });
            },
            (errorMessage) => {}
        );
        setIsScanning(true);
    } catch (err) {
        console.error("Failed to start scanner", err);
        setIsScanning(false);
    }
  };

  // 스캔 중지 함수
  const stopScanning = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
        try {
            await scannerRef.current.stop();
            scannerRef.current.clear();
            setIsScanning(false);
        } catch (err) {
            console.error("Failed to stop scanner", err);
        }
    }
  };

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
        if (scannerRef.current && scannerRef.current.isScanning) {
            scannerRef.current.stop().catch(console.error);
            scannerRef.current.clear();
        }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-lg bg-zinc-900 p-6 shadow-2xl border border-zinc-800 flex flex-col max-h-[90vh]">
        <button 
          onClick={() => { stopScanning(); onClose(); }} 
          className="absolute right-4 top-4 text-zinc-400 hover:text-white transition-colors z-10"
        >
          <X size={24} />
        </button>
        
        <div className="mb-4 text-center shrink-0">
          <h3 className="text-xl font-bold text-white flex items-center justify-center gap-2">
            <Camera className="text-blue-500" />
            바코드 스캔
          </h3>
          <p className="text-sm text-zinc-400 mt-1">
            {isScanning ? '바코드를 사각형 안에 맞춰주세요.' : '사용할 카메라를 선택하세요.'}
          </p>
        </div>

        {/* 메인 영역 */}
        <div className="relative flex-1 min-h-[300px] flex flex-col items-center justify-center bg-black rounded-lg border border-zinc-800 overflow-hidden">
            {permissionError ? (
                <div className="text-center p-6 text-zinc-400">
                    <AlertCircle className="mx-auto mb-2 text-red-500" size={32} />
                    <p>카메라 권한이 필요합니다.</p>
                    <p className="text-xs mt-2">브라우저 설정에서 카메라 접근을 허용해주세요.</p>
                </div>
            ) : !selectedCameraId ? (
                // 카메라 선택 목록
                <div className="w-full p-4 space-y-2 overflow-y-auto max-h-[300px]">
                    <p className="text-xs text-zinc-500 mb-2 text-center">감지된 카메라 목록</p>
                    {cameras.length > 0 ? (
                        cameras.map(cam => (
                            <button
                                key={cam.id}
                                onClick={() => setSelectedCameraId(cam.id)}
                                className="w-full flex items-center gap-3 p-3 rounded-sm bg-zinc-800 hover:bg-zinc-700 transition-colors text-left"
                            >
                                <Camera size={16} className="text-zinc-400" />
                                <span className="text-sm truncate">{cam.label || `Camera ${cam.id.slice(0, 5)}...`}</span>
                            </button>
                        ))
                    ) : (
                        <div className="text-center py-10">
                            <RefreshCw className="mx-auto mb-2 animate-spin text-blue-500" size={24} />
                            <p className="text-sm text-zinc-500">카메라를 찾는 중...</p>
                        </div>
                    )}
                </div>
            ) : (
                // 스캔 화면
                <div className="w-full h-full relative">
                     <div id={readerId} className="w-full h-full object-cover rounded-lg overflow-hidden" />
                     
                     {/* 스캔 애니메이션 레이어 */}
                     {isScanning && (
                         <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                             <div className="w-[70%] h-[40%] border-2 border-blue-500/50 rounded-lg relative overflow-hidden bg-blue-500/5">
                                 <div className="absolute top-0 left-0 w-full h-[2px] bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,1)] animate-scan" />
                             </div>
                         </div>
                     )}

                     {/* 카메라 변경 버튼 */}
                     <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                         {cameras.length > 1 && (
                            <button 
                                onClick={() => {
                                    stopScanning();
                                    setSelectedCameraId(null);
                                }}
                                className="flex items-center gap-2 bg-black/60 backdrop-blur border border-white/10 px-3 py-1.5 rounded-full text-xs text-white hover:bg-black/80"
                            >
                                <RefreshCw size={12} />
                                카메라 변경
                            </button>
                         )}
                         
                         {onManualInput && (
                            <button 
                                onClick={() => {
                                    stopScanning();
                                    onManualInput();
                                }}
                                className="flex items-center gap-2 bg-black/60 backdrop-blur border border-white/10 px-3 py-1.5 rounded-full text-xs text-white hover:bg-black/80"
                            >
                                <Keyboard size={12} />
                                번호 직접 입력
                            </button>
                         )}
                     </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
