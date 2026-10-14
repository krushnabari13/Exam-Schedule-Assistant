import React from 'react';
import { useApp } from '../context/AppContext';
import { StudySession, Exam } from '../types';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Timer,
  Info,
  CalendarCheck,
  CheckCircle,
} from 'lucide-react';
import { getDaysDifference } from '../utils/scheduler';

interface DashboardViewProps {
  onOpenAddExam: () => void;
  onOpenFocusTimer: (session: StudySession) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenAddExam,
  onOpenFocusTimer,
}) => {
  const {
    exams,
    studySessions,
    todayDateStr,
    scheduleMeta,
    overloadAnalysis,
    generateSchedule,
    isGenerating,
    toggleSessionCompletion,
    setActiveTab,
    loadDemoData,
  } = useApp();

  // Metrics
  const sortedUpcomingExams = [...exams]
    .filter(e => e.examDate >= todayDateStr)
    .sort((a, b) => a.examDate.localeCompare(b.examDate) || a.examTime.localeCompare(b.examTime));

  const nearestExam = sortedUpcomingExams[0];
  const nearestDays = nearestExam ? getDaysDifference(nearestExam.examDate, todayDateStr) : null;

  // Today's study sessions
  const todaySessions = studySessions.filter(s => s.date === todayDateStr);
  const completedTodaySessions = todaySessions.filter(s => s.completed);

  // Overall syllabus topics calculation
  let totalTopics = 0;
  let completedTopics = 0;
  exams.forEach(e => {
    totalTopics += e.syllabusTopics.length;
    completedTopics += e.syllabusTopics.filter(t => t.completed).length;
  });
  const syllabusPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  // Total study hours
  const totalPlannedHours = Math.round(
    studySessions.reduce((acc, curr) => acc + curr.durationMinutes, 0) / 60
  );
  const totalCompletedHours = Math.round(
    studySessions.filter(s => s.completed).reduce((acc, curr) => acc + curr.durationMinutes, 0) / 60
  );

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Study Command Center
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {exams.length > 0
              ? `You have ${exams.length} active exam${exams.length > 1 ? 's' : ''} queued. Keep up the steady pace!`
              : 'Welcome! Add your exam schedule or load realistic sample data to generate your personalized AI timetable.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {exams.length === 0 ? (
            <button
              onClick={loadDemoData}
              className="px-4 py-2 text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <BookOpen className="w-4 h-4 text-teal-600" />
              <span>Load Sample Exams</span>
            </button>
          ) : (
            <button
              onClick={() => generateSchedule('ai')}
              disabled={isGenerating}
              className="px-4 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 active:scale-95 rounded-xl shadow-xs transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 text-teal-200 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Optimizing Plan...' : 'Regenerate AI Timetable'}</span>
            </button>
          )}

          <button
            onClick={onOpenAddExam}
            className="px-4 py-2 text-xs font-bold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            + Add Exam
          </button>
        </div>
      </div>

      {/* Overload Alert Warning Banner */}
      {overloadAnalysis.isOverloaded && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-amber-950 flex flex-col sm:flex-row items-start gap-3.5 animate-in fade-in">
          <div className="p-2 bg-amber-100 text-amber-800 rounded-xl shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-sm text-amber-900">
              Schedule Overload Detected: Realistic Time Warning
            </h4>
            <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
              {overloadAnalysis.message}
            </p>
            {overloadAnalysis.recommendations.length > 0 && (
              <ul className="mt-2 space-y-1 text-xs text-amber-900 list-disc list-inside">
                {overloadAnalysis.recommendations.slice(0, 2).map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            )}
          </div>
          <button
            onClick={() => setActiveTab('timetable')}
            className="self-start sm:self-center px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shrink-0 transition-colors"
          >
            Adjust Availability
          </button>
        </div>
      )}

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Nearest Exam Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Next Exam
            </span>
            <Calendar className="w-4 h-4 text-teal-600" />
          </div>
          {nearestExam ? (
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 truncate" title={nearestExam.subject}>
                {nearestExam.subject}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                  {nearestDays === 0
                    ? 'TODAY'
                    : nearestDays === 1
                    ? 'TOMORROW'
                    : `In ${nearestDays} days`}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {nearestExam.examDate} @ {nearestExam.examTime}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 mt-2">No upcoming exams added</p>
          )}
        </div>

        {/* Today's Tasks */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Today's Sessions
            </span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {completedTodaySessions.length} / {todaySessions.length}
            </span>
            <span className="text-xs font-semibold text-slate-500">completed</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-300"
              style={{
                width: `${todaySessions.length > 0 ? (completedTodaySessions.length / todaySessions.length) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        {/* Syllabus Completion */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Syllabus Covered
            </span>
            <BookOpen className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{syllabusPercent}%</span>
            <span className="text-xs font-semibold text-slate-500">
              ({completedTopics}/{totalTopics} topics)
            </span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${syllabusPercent}%` }}
            />
          </div>
        </div>

        {/* Study Hours */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Study Volume
            </span>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{totalCompletedHours}h</span>
            <span className="text-xs font-semibold text-slate-500">
              of {totalPlannedHours}h planned
            </span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-amber-600 h-full rounded-full transition-all duration-300"
              style={{
                width: `${totalPlannedHours > 0 ? (totalCompletedHours / totalPlannedHours) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Today's Schedule & Upcoming Exams */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Today's Agenda (2 cols on desktop) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-teal-600" />
                <h2 className="text-base font-bold text-slate-900">Today's Study Agenda</h2>
              </div>
              <button
                onClick={() => setActiveTab('timetable')}
                className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1 transition-colors"
              >
                <span>View Full Timetable</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Session Items */}
            {todaySessions.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-sm text-slate-600 font-medium">
                  No study sessions scheduled for today.
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Generate a timetable or review your upcoming exams.
                </p>
                <button
                  onClick={() => generateSchedule('ai')}
                  disabled={isGenerating || exams.length === 0}
                  className="mt-4 px-4 py-2 text-xs font-bold text-teal-800 bg-teal-100 hover:bg-teal-200 rounded-xl transition-colors"
                >
                  Generate Timetable Now
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {todaySessions.map(session => (
                  <div
                    key={session.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      session.completed
                        ? 'bg-emerald-50/50 border-emerald-200 text-slate-500'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleSessionCompletion(session.id)}
                        className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors"
                        title={session.completed ? 'Mark incomplete' : 'Mark complete'}
                      >
                        {session.completed ? (
                          <CheckCircle className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-slate-300 hover:border-emerald-500 transition-colors" />
                        )}
                      </button>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                              session.completed
                                ? 'bg-slate-200 text-slate-600'
                                : 'bg-slate-900 text-white'
                            }`}
                          >
                            {session.subject}
                          </span>
                          <span className="text-xs font-mono font-medium text-slate-500">
                            {session.startTime} – {session.endTime} ({session.durationMinutes}m)
                          </span>
                          {session.isRevision && (
                            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              Revision
                            </span>
                          )}
                        </div>
                        <h4
                          className={`text-sm font-semibold mt-1 ${
                            session.completed ? 'line-through text-slate-400' : 'text-slate-900'
                          }`}
                        >
                          {session.topic}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <Info className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{session.priorityReason}</span>
                        </p>
                      </div>
                    </div>

                    {!session.completed && (
                      <button
                        onClick={() => onOpenFocusTimer(session)}
                        className="self-end sm:self-center px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
                      >
                        <Timer className="w-3.5 h-3.5 text-teal-600" />
                        <span>Focus Mode</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Upcoming Chronological Exams List */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-slate-700" />
                <h2 className="text-base font-bold text-slate-900">Upcoming Exams</h2>
              </div>
              <button
                onClick={() => setActiveTab('exams')}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                All Exams ({exams.length})
              </button>
            </div>

            {sortedUpcomingExams.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-xs text-slate-500">No upcoming exams in your schedule.</p>
                <button
                  onClick={onOpenAddExam}
                  className="mt-3 px-3 py-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg shadow-xs hover:bg-slate-100 transition-colors"
                >
                  + Add Exam
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedUpcomingExams.map(exam => {
                  const days = getDaysDifference(exam.examDate, todayDateStr);
                  const completedCount = exam.syllabusTopics.filter(t => t.completed).length;
                  const totalCount = exam.syllabusTopics.length;

                  return (
                    <div
                      key={exam.id}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white shadow-xs transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-bold text-sm text-slate-900 truncate">
                          {exam.subject}
                        </span>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                            days <= 1
                              ? 'bg-rose-100 text-rose-800'
                              : days <= 3
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days} days`}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                        <span>
                          {exam.examDate} @ {exam.examTime}
                        </span>
                        <span
                          className={`font-semibold ${
                            exam.difficulty === 'Hard'
                              ? 'text-rose-600'
                              : exam.difficulty === 'Medium'
                              ? 'text-amber-600'
                              : 'text-emerald-600'
                          }`}
                        >
                          {exam.difficulty}
                        </span>
                      </div>

                      {/* Syllabus progress bar */}
                      <div className="mt-2.5">
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                          <span>Syllabus: {completedCount}/{totalCount} topics</span>
                          <span>{totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                          <div
                            className="bg-teal-600 h-full rounded-full"
                            style={{
                              width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Schedule Engine Meta Card */}
          {scheduleMeta && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1.5">
              <div className="flex items-center justify-between font-bold text-slate-800">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  {scheduleMeta.generatorType === 'ai' ? 'Gemini AI Timetable' : 'Deterministic Schedule'}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {new Date(scheduleMeta.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                {scheduleMeta.summary}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
