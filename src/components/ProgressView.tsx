import React from 'react';
import { useApp } from '../context/AppContext';
import {
  CheckCircle2,
  Circle,
  BookOpen,
  Clock,
  TrendingUp,
  Award,
  Calendar,
  AlertCircle,
  BarChart3,
} from 'lucide-react';
import { getDaysDifference } from '../utils/scheduler';

export const ProgressView: React.FC = () => {
  const { exams, studySessions, toggleTopicCompletion, toggleSessionCompletion, todayDateStr } = useApp();

  // Aggregate metrics
  let totalSyllabusTopics = 0;
  let completedSyllabusTopics = 0;
  exams.forEach(e => {
    totalSyllabusTopics += e.syllabusTopics.length;
    completedSyllabusTopics += e.syllabusTopics.filter(t => t.completed).length;
  });

  const syllabusProgressPercent =
    totalSyllabusTopics > 0 ? Math.round((completedSyllabusTopics / totalSyllabusTopics) * 100) : 0;

  const totalSessionsCount = studySessions.length;
  const completedSessionsCount = studySessions.filter(s => s.completed).length;
  const sessionsProgressPercent =
    totalSessionsCount > 0 ? Math.round((completedSessionsCount / totalSessionsCount) * 100) : 0;

  const totalPlannedHours = Math.round(
    studySessions.reduce((acc, curr) => acc + curr.durationMinutes, 0) / 60
  );
  const totalCompletedHours = Math.round(
    studySessions.filter(s => s.completed).reduce((acc, curr) => acc + curr.durationMinutes, 0) / 60
  );

  // Group study sessions by date for the Chart visualizer
  const dateHoursMap = new Map<string, { planned: number; completed: number }>();
  studySessions.forEach(s => {
    if (!dateHoursMap.has(s.date)) {
      dateHoursMap.set(s.date, { planned: 0, completed: 0 });
    }
    const val = dateHoursMap.get(s.date)!;
    val.planned += s.durationMinutes / 60;
    if (s.completed) val.completed += s.durationMinutes / 60;
  });

  const chartDates = Array.from(dateHoursMap.keys()).sort().slice(0, 10);
  const maxHoursInDay = Math.max(
    ...Array.from(dateHoursMap.values()).map(v => Math.max(v.planned, v.completed)),
    6
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Progress & Syllabus Mastery
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time tracking of completed study hours, syllabus topics, and exam readiness.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-teal-50 border border-teal-200 rounded-xl text-teal-800 text-xs font-bold flex items-center gap-2">
            <Award className="w-4 h-4 text-teal-600" />
            <span>Overall Readiness: {syllabusProgressPercent}%</span>
          </div>
        </div>
      </div>

      {/* 3 Metric Progress Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Syllabus Topics Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Syllabus Topics
            </span>
            <BookOpen className="w-4 h-4 text-teal-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {completedSyllabusTopics}
            </span>
            <span className="text-sm font-semibold text-slate-500">
              / {totalSyllabusTopics} mastered
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-teal-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${syllabusProgressPercent}%` }}
            />
          </div>
          <span className="text-xs text-slate-400 mt-2 block font-medium">
            {syllabusProgressPercent}% topics completed
          </span>
        </div>

        {/* Study Sessions Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Study Sessions
            </span>
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {completedSessionsCount}
            </span>
            <span className="text-sm font-semibold text-slate-500">
              / {totalSessionsCount} finished
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${sessionsProgressPercent}%` }}
            />
          </div>
          <span className="text-xs text-slate-400 mt-2 block font-medium">
            {sessionsProgressPercent}% sessions logged
          </span>
        </div>

        {/* Study Hours Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Study Hours
            </span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {totalCompletedHours}h
            </span>
            <span className="text-sm font-semibold text-slate-500">
              / {totalPlannedHours}h total
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-amber-600 h-full rounded-full transition-all duration-300"
              style={{
                width: `${totalPlannedHours > 0 ? (totalCompletedHours / totalPlannedHours) * 100 : 0}%`,
              }}
            />
          </div>
          <span className="text-xs text-slate-400 mt-2 block font-medium">
            {totalPlannedHours - totalCompletedHours}h remaining to exam readiness
          </span>
        </div>
      </div>

      {/* Progress Chart: Planned vs Completed Hours by Date */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-teal-600" />
            <h3 className="text-base font-bold text-slate-900">Daily Study Volume Chart</h3>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-slate-200" />
              <span className="text-slate-600">Planned Hours</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-teal-600" />
              <span className="text-teal-900">Completed Hours</span>
            </div>
          </div>
        </div>

        {chartDates.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">
            No timetable sessions available to chart.
          </p>
        ) : (
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-3">
              {chartDates.map(dateStr => {
                const data = dateHoursMap.get(dateStr) || { planned: 0, completed: 0 };
                const plannedH = Math.round(data.planned * 10) / 10;
                const completedH = Math.round(data.completed * 10) / 10;
                const plannedPercent = Math.min(100, Math.round((plannedH / maxHoursInDay) * 100));
                const completedPercent = Math.min(100, Math.round((completedH / maxHoursInDay) * 100));

                const [_, m, d] = dateStr.split('-');

                return (
                  <div key={dateStr} className="text-center group">
                    <div className="h-32 bg-slate-50 rounded-xl p-1 flex items-end justify-center gap-1 border border-slate-100">
                      {/* Planned Bar */}
                      <div
                        className="w-3 bg-slate-200 rounded-t-sm transition-all"
                        style={{ height: `${Math.max(4, plannedPercent)}%` }}
                        title={`Planned: ${plannedH}h`}
                      />
                      {/* Completed Bar */}
                      <div
                        className="w-3 bg-teal-600 rounded-t-sm transition-all"
                        style={{ height: `${Math.max(0, completedPercent)}%` }}
                        title={`Completed: ${completedH}h`}
                      />
                    </div>
                    <span className="block text-[11px] font-mono text-slate-500 mt-1.5 font-medium">
                      {m}/{d}
                    </span>
                    <span className="block text-[10px] text-slate-400 font-bold">
                      {completedH}h / {plannedH}h
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Subject-Wise Progress Breakdown Cards */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900">Subject-by-Subject Mastery</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exams.map(exam => {
            const daysRemaining = getDaysDifference(exam.examDate, todayDateStr);
            const completedTopics = exam.syllabusTopics.filter(t => t.completed).length;
            const totalTopics = exam.syllabusTopics.length;
            const topicPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

            const examSessions = studySessions.filter(s => s.examId === exam.id);
            const completedSessions = examSessions.filter(s => s.completed).length;
            const sessionPercent =
              examSessions.length > 0 ? Math.round((completedSessions / examSessions.length) * 100) : 0;

            return (
              <div
                key={exam.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-base text-slate-900">{exam.subject}</h4>
                      {exam.courseCode && (
                        <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                          {exam.courseCode}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 font-medium">
                      Exam in {daysRemaining <= 0 ? 'Today' : `${daysRemaining} days`} ({exam.examDate})
                    </span>
                  </div>

                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      exam.difficulty === 'Hard'
                        ? 'bg-rose-100 text-rose-800'
                        : exam.difficulty === 'Medium'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {exam.difficulty}
                  </span>
                </div>

                {/* Progress bars: Topics & Study Sessions */}
                <div className="space-y-2.5">
                  <div>
                    <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                      <span>Syllabus Topics Covered</span>
                      <span className="font-bold">
                        {completedTopics}/{totalTopics} ({topicPercent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-teal-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${topicPercent}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                      <span>Study Sessions Completed</span>
                      <span className="font-bold">
                        {completedSessions}/{examSessions.length} ({sessionPercent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${sessionPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Topic Checklist */}
                <div className="pt-2 border-t border-slate-100">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Check off syllabus topics as you study:
                  </span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {exam.syllabusTopics.map((topic, idx) => (
                      <button
                        key={topic.id}
                        onClick={() => toggleTopicCompletion(exam.id, topic.id)}
                        className={`w-full p-2 rounded-lg text-left text-xs transition-colors flex items-center gap-2 ${
                          topic.completed
                            ? 'bg-emerald-50 text-emerald-800 line-through opacity-75'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-800'
                        }`}
                      >
                        {topic.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                        )}
                        <span className="truncate">
                          {idx + 1}. {topic.title}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
