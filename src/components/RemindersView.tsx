import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Exam } from '../types';
import {
  Bell,
  BellRing,
  AlertTriangle,
  Calendar,
  Clock,
  CheckCircle2,
  Volume2,
  VolumeX,
  ShieldAlert,
  Info,
  Sparkles,
} from 'lucide-react';
import { getDaysDifference } from '../utils/scheduler';
import { playNotificationChime } from '../utils/audio';

export const RemindersView: React.FC = () => {
  const {
    exams,
    todayDateStr,
    browserNotificationsEnabled,
    requestNotificationPermission,
    sendTestNotification,
    soundEnabled,
    setSoundEnabled,
  } = useApp();

  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  // Categorize exams by timeframe
  const todayExams: Exam[] = [];
  const tomorrowExams: Exam[] = [];
  const next7DaysExams: Exam[] = [];
  const futureExams: Exam[] = [];

  exams.forEach(exam => {
    const days = getDaysDifference(exam.examDate, todayDateStr);
    if (days === 0) {
      todayExams.push(exam);
    } else if (days === 1) {
      tomorrowExams.push(exam);
    } else if (days >= 2 && days <= 7) {
      next7DaysExams.push(exam);
    } else if (days > 7) {
      futureExams.push(exam);
    }
  });

  const handleDismiss = (examId: string) => {
    setDismissedAlerts(prev => [...prev, examId]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Exam Countdown & Reminders
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Automated notifications for upcoming examinations happening today, tomorrow, and this week.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {browserNotificationsEnabled ? (
            <button
              onClick={sendTestNotification}
              className="px-3.5 py-2 text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <BellRing className="w-3.5 h-3.5 text-teal-600" />
              <span>Send Test Notification</span>
            </button>
          ) : (
            <button
              onClick={() => requestNotificationPermission()}
              className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Bell className="w-3.5 h-3.5 text-teal-400" />
              <span>Enable Browser Notifications</span>
            </button>
          )}

          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) playNotificationChime();
            }}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl border transition-colors flex items-center gap-1.5 ${
              soundEnabled
                ? 'bg-white text-slate-800 border-slate-200'
                : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-teal-600" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>{soundEnabled ? 'Chime Enabled' : 'Chime Muted'}</span>
          </button>
        </div>
      </div>

      {/* Critical Limitation & Disclosure Notice */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
        <Info className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-600 leading-relaxed">
          <strong className="text-slate-900 font-semibold block mb-0.5">
            Important Note on Browser Notifications:
          </strong>
          Standard web browser notifications require active permissions and are not guaranteed to display when your browser tab is closed or device is in battery saver mode. We recommend bookmarking this in-app dashboard as your primary study center and syncing exam dates with your calendar.
        </div>
      </div>

      {/* 1. Happening Today (Urgent) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
          <h2 className="text-base font-extrabold text-slate-900">
            Happening Today ({todayExams.length})
          </h2>
        </div>

        {todayExams.length === 0 ? (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 text-xs text-slate-400">
            No exams scheduled for today. Focus on tomorrow's preparation.
          </div>
        ) : (
          <div className="space-y-3">
            {todayExams.map(exam => (
              <div
                key={exam.id}
                className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 bg-rose-200/80 text-rose-800 rounded-xl shrink-0">
                    <AlertTriangle className="w-6 h-6 animate-bounce" />
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                      TODAY'S EXAM
                    </span>
                    <h3 className="text-lg font-black text-rose-950 mt-1">{exam.subject}</h3>
                    <div className="flex items-center gap-3 text-xs text-rose-800 font-medium mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Starts at {exam.examTime}
                      </span>
                      {exam.roomLocation && <span>• Location: {exam.roomLocation}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-bold text-rose-900 bg-rose-200 px-3 py-1.5 rounded-xl">
                    Prepare Checklist & Hall Ticket
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Happening Tomorrow */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <h2 className="text-base font-extrabold text-slate-900">
            Happening Tomorrow ({tomorrowExams.length})
          </h2>
        </div>

        {tomorrowExams.length === 0 ? (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 text-xs text-slate-400">
            No exams scheduled for tomorrow.
          </div>
        ) : (
          <div className="space-y-3">
            {tomorrowExams.map(exam => (
              <div
                key={exam.id}
                className="bg-amber-50/70 border border-amber-300 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                      Final Revision Window
                    </span>
                    <h3 className="text-base font-bold text-amber-950 mt-1">{exam.subject}</h3>
                    <div className="flex items-center gap-3 text-xs text-amber-900 font-medium mt-1">
                      <span>Date: {exam.examDate} @ {exam.examTime}</span>
                      <span>Difficulty: {exam.difficulty}</span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-amber-900 font-semibold bg-amber-100/80 px-3 py-1.5 rounded-xl self-start md:self-center">
                  Review formulas and summarize weak points
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Within Next 7 Days */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
          <h2 className="text-base font-extrabold text-slate-900">
            This Week (Next 2 to 7 Days) ({next7DaysExams.length})
          </h2>
        </div>

        {next7DaysExams.length === 0 ? (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 text-xs text-slate-400">
            No exams in the 2–7 day window.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {next7DaysExams.map(exam => {
              const days = getDaysDifference(exam.examDate, todayDateStr);
              return (
                <div
                  key={exam.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{exam.subject}</span>
                      <span className="text-xs font-bold px-2 py-0.5 bg-teal-50 text-teal-800 rounded-md border border-teal-200">
                        In {days} days
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-medium block mt-1">
                      {exam.examDate} @ {exam.examTime} • {exam.difficulty}
                    </span>
                  </div>

                  <span className="text-xs text-slate-400 font-mono">
                    {exam.syllabusTopics.filter(t => !t.completed).length} pending
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Beyond 7 Days */}
      {futureExams.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-extrabold text-slate-900">
            Upcoming Exams (Beyond 7 Days) ({futureExams.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {futureExams.map(exam => {
              const days = getDaysDifference(exam.examDate, todayDateStr);
              return (
                <div
                  key={exam.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-sm text-slate-900">{exam.subject}</span>
                    <span className="text-xs text-slate-500 font-medium block mt-0.5">
                      {exam.examDate} (in {days} days)
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                    {exam.difficulty}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
