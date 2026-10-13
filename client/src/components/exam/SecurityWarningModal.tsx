import React from 'react';
import { ShieldAlert, AlertTriangle, Maximize2 } from 'lucide-react';

interface SecurityWarningModalProps {
  isOpen: boolean;
  onAcknowledge: () => void;
  type: 'TAB_SWITCH' | 'FULLSCREEN_EXIT' | 'LIMIT_EXCEEDED';
  currentCount: number;
  limit: number;
}

export const SecurityWarningModal: React.FC<SecurityWarningModalProps> = ({
  isOpen,
  onAcknowledge,
  type,
  currentCount,
  limit,
}) => {
  if (!isOpen) return null;

  const isLimitExceeded = currentCount >= limit;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-amber-400 max-w-md w-full p-6 text-center animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200 shadow-xs">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h3 className="text-xl font-bold text-navy-900 mb-2">
          {type === 'TAB_SWITCH'
            ? 'Security Alert: Tab Switch Detected'
            : type === 'FULLSCREEN_EXIT'
            ? 'Fullscreen Mode Interrupted'
            : 'Security Notice'}
        </h3>

        <p className="text-xs text-slate-600 mb-4 leading-relaxed">
          {type === 'TAB_SWITCH' && (
            <>
              You navigated away from the examination window. This action has been timestamped and
              logged into your examination audit report for instructor review.
            </>
          )}
          {type === 'FULLSCREEN_EXIT' && (
            <>
              The examination requires active fullscreen mode to prevent external distractions and
              maintain exam integrity.
            </>
          )}
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-600">Recorded Security Warnings:</span>
            <span
              className={`font-bold px-2 py-0.5 rounded-md ${
                isLimitExceeded
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {currentCount} of {limit} Allowed
            </span>
          </div>
          {isLimitExceeded && (
            <p className="text-[11px] text-rose-600 font-semibold mt-2 text-left flex items-start">
              <AlertTriangle className="w-3.5 h-3.5 mr-1 flex-shrink-0 mt-0.5" />
              Threshold exceeded. Continued tab switches will be flagged for priority faculty review.
            </p>
          )}
        </div>

        <button
          onClick={onAcknowledge}
          className="w-full py-3 bg-navy-900 hover:bg-royal-600 text-white rounded-xl font-semibold text-sm shadow-md transition flex items-center justify-center space-x-2"
        >
          <Maximize2 className="w-4 h-4 text-royal-300" />
          <span>I Understand & Resume Fullscreen</span>
        </button>
      </div>
    </div>
  );
};
