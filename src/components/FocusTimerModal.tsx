import React, { useState, useEffect } from 'react';
import { StudySession } from '../types';
import { Play, Pause, RotateCcw, CheckCircle2, X, Volume2, Timer } from 'lucide-react';
import { playNotificationChime } from '../utils/audio';

interface FocusTimerModalProps {
  session: StudySession | null;
  onClose: () => void;
  onComplete: (sessionId: string) => void;
  soundEnabled: boolean;
}

export const FocusTimerModal: React.FC<FocusTimerModalProps> = ({
  session,
  onClose,
  onComplete,
  soundEnabled,
}) => {
  if (!session) return null;

  const totalSeconds = session.durationMinutes * 60;
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    setSecondsLeft(session.durationMinutes * 60);
    setIsRunning(false);
  }, [session]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            if (soundEnabled) playNotificationChime();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, secondsLeft, soundEnabled]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const progressPercent = Math.round(((totalSeconds - secondsLeft) / totalSeconds) * 100);

  const handleFinish = () => {
    if (soundEnabled) playNotificationChime();
    onComplete(session.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-teal-400" />
            <span className="font-semibold text-sm tracking-wide uppercase text-slate-300">
              Focus Study Session
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200 mb-2">
            {session.subject}
          </span>
          <h3 className="text-xl font-bold text-slate-900 mb-1 leading-tight">{session.topic}</h3>
          <p className="text-xs text-slate-500 mb-6">
            Planned slot: {session.startTime} – {session.endTime} ({session.durationMinutes} mins)
          </p>

          {/* Timer Display */}
          <div className="relative w-48 h-48 mx-auto my-4 flex items-center justify-center">
            {/* Circular Progress Ring */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="44"
                className="stroke-slate-100"
                strokeWidth="6"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="44"
                className="stroke-teal-600 transition-all duration-300 ease-linear"
                strokeWidth="6"
                strokeDasharray={276.46}
                strokeDashoffset={276.46 - (276.46 * progressPercent) / 100}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-extrabold font-mono text-slate-900 tracking-tight">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </span>
              <span className="text-xs font-medium text-slate-400 mt-1">
                {progressPercent}% completed
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white shadow-sm transition-all ${
                isRunning
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-teal-600 hover:bg-teal-700 active:scale-95'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-5 h-5" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>{secondsLeft === totalSeconds ? 'Start Timer' : 'Resume'}</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                setIsRunning(false);
                setSecondsLeft(totalSeconds);
              }}
              title="Reset Timer"
              className="p-3 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              onClick={handleFinish}
              title="Mark as Done"
              className="flex items-center gap-2 px-4 py-3 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl font-medium transition-colors"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Mark Complete</span>
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5" />
            <span>Audio chime will sound upon completion</span>
          </div>
        </div>
      </div>
    </div>
  );
};
