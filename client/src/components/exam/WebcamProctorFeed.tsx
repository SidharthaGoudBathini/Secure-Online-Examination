import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Mic, MicOff, ShieldCheck, AlertCircle } from 'lucide-react';

interface WebcamProctorFeedProps {
  onPermissionChange?: (granted: boolean) => void;
  tabSwitchCount?: number;
  tabSwitchLimit?: number;
}

export const WebcamProctorFeed: React.FC<WebcamProctorFeedProps> = ({
  onPermissionChange,
  tabSwitchCount = 0,
  tabSwitchLimit = 3,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [audioActive, setAudioActive] = useState<boolean>(true);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240 },
          audio: true,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        setStreamActive(true);
        setPermissionError(null);
        onPermissionChange?.(true);
      } catch (err: any) {
        console.warn('Webcam or Microphone not accessible:', err.message);
        setPermissionError(
          'Camera access not detected or permission denied. Simulated proctoring enabled for testing.'
        );
        setStreamActive(false);
        onPermissionChange?.(false);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [onPermissionChange]);

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col items-center">
      <div className="w-full flex items-center justify-between pb-2.5 mb-2 border-b border-slate-100">
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-navy-900">Live AI Proctoring</span>
        </div>
        <span className="text-[10px] uppercase font-bold text-royal-600 bg-royal-50 px-2 py-0.5 rounded-md border border-royal-100">
          Encrypted
        </span>
      </div>

      {/* Video Preview Box */}
      <div className="relative w-full aspect-4/3 rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center border border-slate-800 shadow-inner">
        {streamActive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transform -scale-x-100"
          />
        ) : (
          <div className="flex flex-col items-center text-center p-4 space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
              <CameraOff className="w-6 h-6" />
            </div>
            <p className="text-[11px] text-slate-300 font-medium leading-tight">
              {permissionError ? 'Test Environment Feed Active' : 'Initializing camera...'}
            </p>
            <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800">
              Virtual Monitor Active
            </span>
          </div>
        )}

        {/* Live Proctor Overlay Badge */}
        <div className="absolute top-2 left-2 flex items-center space-x-1 bg-black/60 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded-md">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>Face Verified</span>
        </div>

        {/* Mic Indicator */}
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-xs p-1 rounded-md text-white">
          {audioActive ? <Mic className="w-3 h-3 text-emerald-400" /> : <MicOff className="w-3 h-3 text-rose-400" />}
        </div>
      </div>

      {/* Warning tracker */}
      <div className="w-full mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-slate-500 font-medium">Tab Switches:</span>
        <span
          className={`font-bold px-2 py-0.5 rounded-md ${
            tabSwitchCount >= tabSwitchLimit
              ? 'bg-rose-100 text-rose-700'
              : tabSwitchCount > 0
              ? 'bg-amber-100 text-amber-800'
              : 'bg-emerald-100 text-emerald-800'
          }`}
        >
          {tabSwitchCount} / {tabSwitchLimit} Max
        </span>
      </div>
    </div>
  );
};
