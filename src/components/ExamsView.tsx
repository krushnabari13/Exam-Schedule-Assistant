import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Exam } from '../types';
import {
  Calendar,
  Clock,
  BookOpen,
  Edit2,
  Trash2,
  Plus,
  CheckCircle2,
  Circle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  MapPin,
  Sparkles,
  BarChart2,
} from 'lucide-react';
import { getDaysDifference } from '../utils/scheduler';

interface ExamsViewProps {
  onOpenAddExam: () => void;
  onEditExam: (exam: Exam) => void;
}

export const ExamsView: React.FC<ExamsViewProps> = ({ onOpenAddExam, onEditExam }) => {
  const {
    exams,
    deleteExam,
    toggleTopicCompletion,
    todayDateStr,
    subjectPriorities,
    loadDemoData,
  } = useApp();

  const [expandedExamId, setExpandedExamId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');

  // Sorted chronologically
  const sortedExams = [...exams].sort(
    (a, b) => a.examDate.localeCompare(b.examDate) || a.examTime.localeCompare(b.examTime)
  );

  const filteredExams = sortedExams.filter(exam => {
    if (filterDifficulty === 'all') return true;
    return exam.difficulty === filterDifficulty;
  });

  const toggleExpand = (id: string) => {
    setExpandedExamId(prev => (prev === id ? null : id));
  };

  const handleDelete = (id: string) => {
    deleteExam(id);
    setDeleteConfirmId(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Exam Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Organize all your tests, track syllabus completion, and monitor urgency priority weights.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {exams.length === 0 && (
            <button
              onClick={loadDemoData}
              className="px-4 py-2 text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition-colors"
            >
              Load Sample Exams
            </button>
          )}

          <button
            onClick={onOpenAddExam}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 text-teal-400" />
            <span>Add Exam</span>
          </button>
        </div>
      </div>

      {/* Filter and Priority Rationale Strip */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Filter Difficulty:</span>
          {['all', 'Hard', 'Medium', 'Easy'].map(diff => (
            <button
              key={diff}
              onClick={() => setFilterDifficulty(diff)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                filterDifficulty === diff
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {diff === 'all' ? 'All Exams' : diff}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-400 font-medium">
          Showing {filteredExams.length} of {exams.length} exams in chronological order
        </span>
      </div>

      {/* Exams List */}
      {filteredExams.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-200">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No exams match your criteria</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {exams.length === 0
              ? 'Get started by creating your upcoming exams with their syllabus and dates.'
              : 'Try clearing the difficulty filter to see all your exams.'}
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            {exams.length === 0 && (
              <button
                onClick={loadDemoData}
                className="px-4 py-2 text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl"
              >
                Load Sample Data
              </button>
            )}
            <button
              onClick={onOpenAddExam}
              className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl"
            >
              + Add First Exam
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredExams.map(exam => {
            const daysRemaining = getDaysDifference(exam.examDate, todayDateStr);
            const priorityInfo = subjectPriorities.find(p => p.examId === exam.id);
            const completedCount = exam.syllabusTopics.filter(t => t.completed).length;
            const totalCount = exam.syllabusTopics.length;
            const completionPercent =
              totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
            const isExpanded = expandedExamId === exam.id;

            return (
              <div
                key={exam.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all overflow-hidden"
              >
                {/* Exam Card Main Row */}
                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {/* Color indicator accent */}
                    <div
                      className="w-3.5 h-14 rounded-full shrink-0 mt-0.5"
                      style={{ backgroundColor: exam.color || '#0284c7' }}
                    />

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-lg font-bold text-slate-900">{exam.subject}</span>
                        {exam.courseCode && (
                          <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                            {exam.courseCode}
                          </span>
                        )}
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                            exam.difficulty === 'Hard'
                              ? 'bg-rose-100 text-rose-800'
                              : exam.difficulty === 'Medium'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {exam.difficulty} Difficulty
                        </span>
                      </div>

                      {/* Details row */}
                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-2 flex-wrap font-medium">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{exam.examDate}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{exam.examTime}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <BarChart2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>~{exam.estimatedPrepHours}h prep required</span>
                        </div>
                        {exam.roomLocation && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{exam.roomLocation}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right side: Urgency countdown & Actions */}
                  <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                    <div className="text-right">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
                          daysRemaining <= 1
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : daysRemaining <= 3
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-800 border border-slate-200'
                        }`}
                      >
                        {daysRemaining === 0
                          ? 'Today!'
                          : daysRemaining === 1
                          ? 'Tomorrow'
                          : `${daysRemaining} days left`}
                      </span>
                      {priorityInfo && (
                        <div className="text-[11px] font-semibold text-slate-400 mt-0.5">
                          Priority Score: {priorityInfo.priorityScore}/100
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 border-l border-slate-200 pl-3">
                      <button
                        onClick={() => onEditExam(exam)}
                        className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit exam"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(exam.id)}
                        className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete exam"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleExpand(exam.id)}
                        className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        title={isExpanded ? 'Hide topics' : 'Show syllabus topics'}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Progress bar preview */}
                <div className="px-5 pb-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>
                      Syllabus Mastery: {completedCount} of {totalCount} topics completed
                    </span>
                    <span className="font-semibold text-slate-700">{completionPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-teal-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${completionPercent}%` }}
                    />
                  </div>
                </div>

                {/* Priority Rationale & Syllabus Expanded Content */}
                {isExpanded && (
                  <div className="p-5 bg-slate-50/70 border-t border-slate-200 space-y-4 animate-in fade-in">
                    {/* Priority Rationale Box */}
                    {priorityInfo && (
                      <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-start gap-2.5">
                        <Sparkles className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-xs text-slate-900">
                            Scheduling Priority: {priorityInfo.priorityLevel} ({priorityInfo.priorityScore}/100)
                          </span>
                          <p className="text-xs text-slate-600 mt-0.5">{priorityInfo.reason}</p>
                        </div>
                      </div>
                    )}

                    {exam.notes && (
                      <div className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200">
                        <strong className="text-slate-800">Notes:</strong> {exam.notes}
                      </div>
                    )}

                    {/* Syllabus Check-off List */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                        Syllabus Checklist (Click to toggle completion)
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {exam.syllabusTopics.map((topic, i) => (
                          <button
                            key={topic.id}
                            onClick={() => toggleTopicCompletion(exam.id, topic.id)}
                            className={`w-full p-2.5 rounded-xl border text-left text-xs font-medium transition-all flex items-center justify-between gap-2 ${
                              topic.completed
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              {topic.completed ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              ) : (
                                <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                              )}
                              <span className={topic.completed ? 'line-through text-slate-400' : ''}>
                                {i + 1}. {topic.title}
                              </span>
                            </div>
                            <span className="text-[10px] uppercase font-bold text-slate-400">
                              {topic.completed ? 'Done' : 'Pending'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full p-6 text-center animate-in fade-in">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Delete this Exam?</h3>
            <p className="text-xs text-slate-500 mt-1">
              This will remove the exam and any associated study sessions from your timetable. This action cannot be undone.
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
