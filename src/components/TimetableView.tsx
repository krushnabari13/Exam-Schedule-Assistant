import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { StudySession, PreferredTimeOfDay } from '../types';
import {
  Calendar,
  Clock,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Timer,
  Sliders,
  Info,
  CalendarDays,
  List,
  Layers,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { addDaysToDateStr, parseLocalDate, formatLocalDate, getDaysDifference } from '../utils/scheduler';

interface TimetableViewProps {
  onOpenFocusTimer: (session: StudySession) => void;
}

export const TimetableView: React.FC<TimetableViewProps> = ({ onOpenFocusTimer }) => {
  const {
    exams,
    studySessions,
    preferences,
    updatePreferences,
    scheduleMeta,
    overloadAnalysis,
    generateSchedule,
    isGenerating,
    scheduleError,
    toggleSessionCompletion,
    todayDateStr,
    subjectPriorities,
  } = useApp();

  const [viewMode, setViewMode] = useState<'day' | 'week' | 'list'>('day');
  const [selectedDate, setSelectedDate] = useState<string>(todayDateStr);
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [showPrefPanel, setShowPrefPanel] = useState<boolean>(false);

  // Group sessions by date
  const sessionsByDate = React.useMemo(() => {
    const map = new Map<string, StudySession[]>();
    for (const session of studySessions) {
      if (filterSubject !== 'all' && session.subject !== filterSubject) continue;
      if (!map.has(session.date)) {
        map.set(session.date, []);
      }
      map.get(session.date)!.push(session);
    }
    // Sort each day's sessions by startTime
    for (const [d, list] of map.entries()) {
      list.sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return map;
  }, [studySessions, filterSubject]);

  // Unique list of dates in the schedule
  const allScheduledDates = Array.from(sessionsByDate.keys()).sort();

  // If selectedDate has no sessions but schedule exists, pick the first available date or today
  const activeDate = allScheduledDates.includes(selectedDate)
    ? selectedDate
    : allScheduledDates[0] || todayDateStr;

  const currentDaySessions = sessionsByDate.get(activeDate) || [];

  // Filtered list for 'list' view
  const allFilteredSessions = studySessions.filter(s => {
    if (filterSubject !== 'all' && s.subject !== filterSubject) return false;
    return true;
  }).sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

  // Week View: Get next 7 days starting from selectedDate or today
  const weekDays = Array.from({ length: 7 }, (_, i) => addDaysToDateStr(todayDateStr, i));

  const handleNextDay = () => {
    setSelectedDate(prev => addDaysToDateStr(prev, 1));
  };

  const handlePrevDay = () => {
    setSelectedDate(prev => addDaysToDateStr(prev, -1));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Schedule Generator & Control */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Study Timetable
            </h1>
            {scheduleMeta && (
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                  scheduleMeta.generatorType === 'ai'
                    ? 'bg-teal-50 border-teal-200 text-teal-800'
                    : 'bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                {scheduleMeta.generatorType === 'ai'
                  ? '🤖 Gemini AI-Optimized'
                  : '⚙️ Deterministic Rule-Based'}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500">
            Personalized daily schedule tailored to your exam deadlines, subject difficulty, and study hours.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowPrefPanel(!showPrefPanel)}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl border transition-colors flex items-center gap-1.5 ${
              showPrefPanel
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Preferences ({preferences.dailyAvailableHours}h/day)</span>
          </button>

          <button
            onClick={() => generateSchedule('ai')}
            disabled={isGenerating || exams.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-teal-700 hover:bg-teal-800 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 text-teal-200 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'AI Generating...' : 'Regenerate with AI'}</span>
          </button>

          <button
            onClick={() => generateSchedule('deterministic')}
            disabled={isGenerating || exams.length === 0}
            title="Generate using strict rule-based priority algorithm without AI"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Rule-Based</span>
          </button>
        </div>
      </div>

      {/* Preferences Drawer / Accordion */}
      {showPrefPanel && (
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Study Availability & Style Settings
            </h3>
            <span className="text-xs text-slate-500">Changes apply on next generation</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Daily hours */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Daily Study Hours ({preferences.dailyAvailableHours}h)
              </label>
              <input
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={preferences.dailyAvailableHours}
                onChange={e => updatePreferences({ dailyAvailableHours: Number(e.target.value) })}
                className="w-full accent-teal-600"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>1h</span>
                <span>5h</span>
                <span>10h</span>
              </div>
            </div>

            {/* Preferred Time */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Preferred Study Time
              </label>
              <select
                value={preferences.preferredStudyTime}
                onChange={e =>
                  updatePreferences({ preferredStudyTime: e.target.value as PreferredTimeOfDay })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-100"
              >
                <option value="morning">Morning (08:00 - 12:00)</option>
                <option value="afternoon">Afternoon (13:00 - 17:00)</option>
                <option value="evening">Evening (17:00 - 21:00)</option>
                <option value="night">Night (20:30 - 00:30)</option>
                <option value="flexible">Flexible / Balanced</option>
              </select>
            </div>

            {/* Session Duration */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Session Length & Breaks
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={preferences.sessionDurationMinutes}
                  onChange={e => updatePreferences({ sessionDurationMinutes: Number(e.target.value) })}
                  className="px-2.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white"
                >
                  <option value="45">45 mins</option>
                  <option value="50">50 mins (Pomodoro)</option>
                  <option value="60">60 mins</option>
                  <option value="90">90 mins</option>
                </select>
                <select
                  value={preferences.breakMinutes}
                  onChange={e => updatePreferences({ breakMinutes: Number(e.target.value) })}
                  className="px-2.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white"
                >
                  <option value="5">5 min break</option>
                  <option value="10">10 min break</option>
                  <option value="15">15 min break</option>
                </select>
              </div>
            </div>

            {/* Weekend Bonus */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Weekend Bonus (+{preferences.weekendBonusHours}h on Sat/Sun)
              </label>
              <select
                value={preferences.weekendBonusHours}
                onChange={e => updatePreferences({ weekendBonusHours: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-100"
              >
                <option value="0">+0 hours (Equal)</option>
                <option value="1">+1 hour / day</option>
                <option value="2">+2 hours / day</option>
                <option value="3">+3 hours / day</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Error or Fallback Notification Banner */}
      {scheduleError && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{scheduleError}</span>
          </div>
        </div>
      )}

      {/* Overload Alert Warning */}
      {overloadAnalysis.isOverloaded && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-amber-950 flex flex-col sm:flex-row items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold text-xs">
              Overloaded Schedule Analysis:
            </span>
            <p className="text-xs text-amber-900 mt-0.5 leading-relaxed">
              {overloadAnalysis.message}
            </p>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              {overloadAnalysis.recommendations.map((rec, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-amber-100 border border-amber-200 rounded-lg text-[11px] font-medium"
                >
                  💡 {rec}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Controls Bar: Subject Filter & View Modes (Day, Week, List) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Subject Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Filter:</span>
          <select
            value={filterSubject}
            onChange={e => setFilterSubject(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 bg-white"
          >
            <option value="all">All Subjects ({exams.length})</option>
            {exams.map(e => (
              <option key={e.id} value={e.subject}>
                {e.subject}
              </option>
            ))}
          </select>
        </div>

        {/* View Switcher: Day / Week / List */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-center">
          <button
            onClick={() => setViewMode('day')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'day'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Day View</span>
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'week'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>7-Day Calendar</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'list'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>All Sessions</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: DAY VIEW */}
      {viewMode === 'day' && (
        <div className="space-y-4">
          {/* Day Navigation Bar */}
          <div className="bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <button
              onClick={handlePrevDay}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              title="Previous Day"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="text-center">
              <span className="text-base font-extrabold text-slate-900">
                {new Intl.DateTimeFormat('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                }).format(parseLocalDate(activeDate))}
              </span>
              {activeDate === todayDateStr && (
                <span className="ml-2 px-2 py-0.5 rounded-md text-[11px] font-bold bg-teal-100 text-teal-800">
                  Today
                </span>
              )}
            </div>

            <button
              onClick={handleNextDay}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              title="Next Day"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Dates Ribbon */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {Array.from({ length: 10 }, (_, i) => addDaysToDateStr(todayDateStr, i)).map(dStr => {
              const dObj = parseLocalDate(dStr);
              const count = (sessionsByDate.get(dStr) || []).length;
              const isSelected = dStr === activeDate;
              return (
                <button
                  key={dStr}
                  onClick={() => setSelectedDate(dStr)}
                  className={`px-3.5 py-2 rounded-xl text-center shrink-0 border transition-all ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="block text-[10px] font-bold uppercase tracking-wider opacity-70">
                    {dObj.toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                  <span className="block text-sm font-black">
                    {dObj.getDate()}
                  </span>
                  <span
                    className={`block text-[10px] font-semibold mt-0.5 ${
                      isSelected ? 'text-teal-400' : 'text-slate-400'
                    }`}
                  >
                    {count} slot{count !== 1 ? 's' : ''}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Current Day Sessions Cards */}
          {currentDaySessions.length === 0 ? (
            <div className="bg-white p-10 text-center rounded-2xl border border-dashed border-slate-200">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800">
                No sessions planned for this day
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                You can rest or select another date from the ribbon above.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentDaySessions.map(session => (
                <div
                  key={session.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    session.completed
                      ? 'bg-emerald-50/40 border-emerald-200 text-slate-500'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <button
                      onClick={() => toggleSessionCompletion(session.id)}
                      className="mt-1 text-slate-400 hover:text-emerald-600 transition-colors shrink-0"
                      title={session.completed ? 'Mark incomplete' : 'Mark completed'}
                    >
                      {session.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-300 hover:text-emerald-500" />
                      )}
                    </button>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                            session.completed ? 'bg-slate-200 text-slate-600' : 'bg-slate-900 text-white'
                          }`}
                        >
                          {session.subject}
                        </span>
                        <span className="text-xs font-mono font-medium text-slate-600">
                          {session.startTime} – {session.endTime} ({session.durationMinutes} mins)
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          Break: {session.breakDurationMinutes}m
                        </span>
                        {session.isRevision && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                            High-Yield Revision
                          </span>
                        )}
                      </div>

                      <h4
                        className={`text-base font-bold mt-1.5 ${
                          session.completed ? 'line-through text-slate-400' : 'text-slate-900'
                        }`}
                      >
                        {session.topic}
                      </h4>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          <strong>Priority Rationale:</strong> {session.priorityReason}
                        </span>
                      </div>
                    </div>
                  </div>

                  {!session.completed && (
                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      <button
                        onClick={() => onOpenFocusTimer(session)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold transition-colors"
                      >
                        <Timer className="w-4 h-4 text-teal-600" />
                        <span>Focus Session</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: 7-DAY CALENDAR VIEW */}
      {viewMode === 'week' && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {weekDays.map(dateStr => {
            const dateObj = parseLocalDate(dateStr);
            const sessionsForDay = sessionsByDate.get(dateStr) || [];
            const isToday = dateStr === todayDateStr;
            const completedCount = sessionsForDay.filter(s => s.completed).length;

            // Check if any exam takes place on this day!
            const examsOnDay = exams.filter(e => e.examDate === dateStr);

            return (
              <div
                key={dateStr}
                className={`rounded-2xl border p-3 flex flex-col justify-between min-h-[220px] transition-all ${
                  isToday
                    ? 'bg-teal-50/50 border-teal-300 ring-1 ring-teal-300'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                    <span className="text-xs font-bold uppercase text-slate-500">
                      {dateObj.toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                    <span
                      className={`text-xs font-black px-1.5 py-0.5 rounded-md ${
                        isToday ? 'bg-teal-600 text-white' : 'text-slate-800'
                      }`}
                    >
                      {dateObj.getDate()}
                    </span>
                  </div>

                  {/* Exam alert marker on that day */}
                  {examsOnDay.map(ex => (
                    <div
                      key={ex.id}
                      className="mb-2 p-1.5 bg-rose-50 border border-rose-200 rounded-lg text-[10px] font-bold text-rose-800"
                    >
                      🏁 EXAM: {ex.subject} ({ex.examTime})
                    </div>
                  ))}

                  {/* Study Slots */}
                  <div className="space-y-1.5">
                    {sessionsForDay.slice(0, 3).map(s => (
                      <div
                        key={s.id}
                        className={`p-1.5 rounded-lg text-[11px] border leading-tight ${
                          s.completed
                            ? 'bg-slate-100 text-slate-400 line-through border-slate-200'
                            : 'bg-white border-slate-200 text-slate-800 shadow-2xs'
                        }`}
                      >
                        <div className="font-bold truncate">{s.subject}</div>
                        <div className="text-[10px] text-slate-500 truncate font-mono">
                          {s.startTime} • {s.topic}
                        </div>
                      </div>
                    ))}
                    {sessionsForDay.length > 3 && (
                      <div className="text-[10px] text-center font-bold text-slate-400">
                        +{sessionsForDay.length - 3} more session(s)
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>
                    {completedCount}/{sessionsForDay.length} done
                  </span>
                  <button
                    onClick={() => {
                      setSelectedDate(dateStr);
                      setViewMode('day');
                    }}
                    className="font-bold text-teal-700 hover:underline"
                  >
                    Open
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 3: ALL SESSIONS LIST VIEW */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-600">
            <span>All Planned Sessions ({allFilteredSessions.length})</span>
            <span className="font-mono">Chronological Timeline</span>
          </div>

          {allFilteredSessions.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No study sessions found matching this filter.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {allFilteredSessions.map(session => (
                <div
                  key={session.id}
                  className={`px-6 py-3.5 flex items-center justify-between gap-4 transition-colors ${
                    session.completed ? 'bg-slate-50/60 text-slate-400' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleSessionCompletion(session.id)}
                      className="text-slate-400 hover:text-emerald-600 transition-colors"
                    >
                      {session.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-300" />
                      )}
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-500">
                          {session.date} ({session.startTime}–{session.endTime})
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800">
                          {session.subject}
                        </span>
                        {session.isRevision && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800">
                            Revision
                          </span>
                        )}
                      </div>
                      <div
                        className={`text-sm font-semibold mt-0.5 ${
                          session.completed ? 'line-through text-slate-400' : 'text-slate-900'
                        }`}
                      >
                        {session.topic}
                      </div>
                    </div>
                  </div>

                  {!session.completed && (
                    <button
                      onClick={() => onOpenFocusTimer(session)}
                      className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shrink-0"
                    >
                      <Timer className="w-3.5 h-3.5" />
                      <span>Timer</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
