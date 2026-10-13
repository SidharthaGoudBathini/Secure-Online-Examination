import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface CountdownTimerProps {
  expiresAt: string;
  onExpire: () => void;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ expiresAt, onExpire }) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    const target = new Date(expiresAt).getTime();
    const now = new Date().getTime();
    return Math.max(0, Math.floor((target - now) / 1000));
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const target = new Date(expiresAt).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, Math.floor((target - now) / 1000));

      setSecondsRemaining(diff);

      if (diff <= 0) {
        clearInterval(interval);
        onExpire();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const hours = Math.floor(secondsRemaining / 3600);
  const minutes = Math.floor((secondsRemaining % 3600) / 60);
  const seconds = secondsRemaining % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  // Urgency states:
  // < 60s -> critical red pulsing
  // < 300s (5m) -> warning orange
  // else -> normal blue/navy
  const isCritical = secondsRemaining < 60;
  const isWarning = secondsRemaining < 300 && !isCritical;

  let timerStyles = 'bg-slate-100 text-navy-900 border-slate-200';
  if (isWarning) {
    timerStyles = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (isCritical) {
    timerStyles = 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse';
  }

  return (
    <div
      className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl border text-sm font-mono font-bold tracking-wider ${timerStyles} transition duration-300 shadow-2xs`}
    >
      {isCritical ? (
        <AlertTriangle className="w-4 h-4 text-rose-600 animate-bounce" />
      ) : (
        <Clock className={`w-4 h-4 ${isWarning ? 'text-amber-600' : 'text-royal-500'}`} />
      )}
      <span>
        {hours > 0 ? `${pad(hours)}:` : ''}
        {pad(minutes)}:{pad(seconds)}
      </span>
      {isCritical && (
        <span className="text-[10px] uppercase font-sans font-extrabold text-rose-600 tracking-normal hidden sm:inline">
          Final Minute!
        </span>
      )}
    </div>
  );
};
