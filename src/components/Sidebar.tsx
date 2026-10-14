import React from 'react';
import { useApp, ActiveTab } from '../context/AppContext';
import {
  LayoutDashboard,
  GraduationCap,
  CalendarCheck,
  LineChart,
  Bell,
  Settings,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface SidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, setIsMobileOpen }) => {
  const {
    activeTab,
    setActiveTab,
    exams,
    studySessions,
    soundEnabled,
    setSoundEnabled,
    todayDateStr,
  } = useApp();

  // Calculate upcoming alert badges (exams within next 48h)
  const urgentExamsCount = exams.filter(e => {
    const [tY, tM, tD] = e.examDate.split('-').map(Number);
    const [nY, nM, nD] = todayDateStr.split('-').map(Number);
    const target = new Date(tY, tM - 1, tD).getTime();
    const now = new Date(nY, nM - 1, nD).getTime();
    const diffDays = Math.round((target - now) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 2;
  }).length;

  const todaySessionsRemaining = studySessions.filter(
    s => s.date === todayDateStr && !s.completed
  ).length;

  const navItems: { id: ActiveTab; label: string; icon: React.ElementType; badge?: string | number; badgeColor?: string }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'exams',
      label: 'My Exams',
      icon: GraduationCap,
      badge: exams.length > 0 ? exams.length : undefined,
      badgeColor: 'bg-slate-200 text-slate-700',
    },
    {
      id: 'timetable',
      label: 'Study Timetable',
      icon: CalendarCheck,
      badge: todaySessionsRemaining > 0 ? `${todaySessionsRemaining} today` : undefined,
      badgeColor: 'bg-teal-100 text-teal-800',
    },
    {
      id: 'progress',
      label: 'Progress & Analytics',
      icon: LineChart,
    },
    {
      id: 'reminders',
      label: 'Exam Reminders',
      icon: Bell,
      badge: urgentExamsCount > 0 ? urgentExamsCount : undefined,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'settings',
      label: 'Settings & Data',
      icon: Settings,
    },
  ];

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top App Branding */}
        <div>
          <div className="h-18 px-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-teal-400 shadow-sm">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <span className="font-extrabold text-slate-900 text-base tracking-tight block leading-tight">
                  Exam Schedule
                </span>
                <span className="text-[11px] font-semibold text-teal-600 uppercase tracking-wider block">
                  AI Study Planner
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4.5 h-4.5 ${
                        isActive ? 'text-teal-400' : 'text-slate-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : item.badgeColor || 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Utility Controls */}
        <div className="p-4 border-t border-slate-100 space-y-3">
          {/* Quick Sound Toggle */}
          <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-xl text-xs text-slate-600">
            <div className="flex items-center gap-2">
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-teal-600" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-400" />
              )}
              <span className="font-medium">Chime Alerts</span>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`w-9 h-5 rounded-full transition-colors relative ${
                soundEnabled ? 'bg-teal-600' : 'bg-slate-300'
              }`}
              title="Toggle audio chimes"
            >
              <div
                className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${
                  soundEnabled ? 'left-4.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {/* AI Engine Status Card */}
          <div className="p-3 bg-teal-50/70 border border-teal-200/60 rounded-xl text-xs">
            <div className="flex items-center gap-1.5 text-teal-900 font-bold mb-1">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Gemini 3.8 Intelligence</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Timetables prioritize syllabus weight, prep hours, and difficulty.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
