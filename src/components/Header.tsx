import React from 'react';
import { useApp } from '../context/AppContext';
import { Menu, Plus, Sparkles, Clock, AlertTriangle, Bell } from 'lucide-react';
import { getDaysDifference } from '../utils/scheduler';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  onOpenAddExam: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu, onOpenAddExam }) => {
  const {
    exams,
    todayDateStr,
    generateSchedule,
    isGenerating,
    setActiveTab,
    browserNotificationsEnabled,
    requestNotificationPermission,
  } = useApp();

  // Find nearest upcoming exam
  const sortedUpcoming = [...exams]
    .filter(e => e.examDate >= todayDateStr)
    .sort((a, b) => a.examDate.localeCompare(b.examDate) || a.examTime.localeCompare(b.examTime));

  const nearestExam = sortedUpcoming[0];
  const daysToNearest = nearestExam ? getDaysDifference(nearestExam.examDate, todayDateStr) : null;

  // Format today's date for header
  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 lg:px-8 py-3.5">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger + Date */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl lg:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Academic Dashboard
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="text-xs font-mono font-medium text-slate-600">{todayFormatted}</span>
            </div>
          </div>
        </div>

        {/* Center / Right: Nearest Exam countdown badge & Quick Actions */}
        <div className="flex items-center gap-2.5">
          {nearestExam && daysToNearest !== null && (
            <div
              onClick={() => setActiveTab('reminders')}
              className={`cursor-pointer hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                daysToNearest <= 1
                  ? 'bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100'
                  : daysToNearest <= 3
                  ? 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {daysToNearest <= 1 ? (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
              ) : (
                <Clock className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span>
                <strong>{nearestExam.subject}</strong>:{' '}
                {daysToNearest === 0
                  ? 'Today!'
                  : daysToNearest === 1
                  ? 'Tomorrow'
                  : `in ${daysToNearest} days`}
              </span>
            </div>
          )}

          {!browserNotificationsEnabled && (
            <button
              onClick={() => requestNotificationPermission()}
              title="Enable browser notifications"
              className="p-2 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-xl transition-colors border border-transparent hover:border-teal-200"
            >
              <Bell className="w-4.5 h-4.5" />
            </button>
          )}

          {/* AI Plan Quick button */}
          <button
            onClick={() => generateSchedule('ai')}
            disabled={isGenerating || exams.length === 0}
            className="hidden md:flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition-all disabled:opacity-50"
            title="Generate AI Study Timetable"
          >
            <Sparkles className={`w-3.5 h-3.5 text-teal-600 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Optimizing...' : 'AI Timetable'}</span>
          </button>

          {/* Add Exam Primary Button */}
          <button
            onClick={onOpenAddExam}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
          >
            <Plus className="w-4 h-4 text-teal-400" />
            <span>Add Exam</span>
          </button>
        </div>
      </div>
    </header>
  );
};
