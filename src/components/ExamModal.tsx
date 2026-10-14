import React, { useState, useEffect } from 'react';
import { Exam, DifficultyLevel, SyllabusTopic } from '../types';
import { X, Plus, Trash2, Calendar, Clock, BookOpen, AlertCircle, Sparkles } from 'lucide-react';
import { formatLocalDate } from '../utils/scheduler';

interface ExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (examData: Omit<Exam, 'id' | 'createdAt'>) => void;
  editingExam?: Exam | null;
}

const COLOR_OPTIONS = [
  { label: 'Ocean Blue', value: '#0284c7' },
  { label: 'Deep Teal', value: '#0d9488' },
  { label: 'Indigo', value: '#6366f1' },
  { label: 'Amber Bronze', value: '#d97706' },
  { label: 'Rose Wine', value: '#e11d48' },
  { label: 'Emerald Forest', value: '#059669' },
];

export const ExamModal: React.FC<ExamModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingExam,
}) => {
  const todayStr = formatLocalDate(new Date());

  const [subject, setSubject] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [examDate, setExamDate] = useState('');
  const [examTime, setExamTime] = useState('09:00');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('Medium');
  const [estimatedPrepHours, setEstimatedPrepHours] = useState<number>(12);
  const [roomLocation, setRoomLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [color, setColor] = useState(COLOR_OPTIONS[0].value);
  const [topics, setTopics] = useState<SyllabusTopic[]>([]);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingExam) {
      setSubject(editingExam.subject);
      setCourseCode(editingExam.courseCode || '');
      setExamDate(editingExam.examDate);
      setExamTime(editingExam.examTime);
      setDifficulty(editingExam.difficulty);
      setEstimatedPrepHours(editingExam.estimatedPrepHours);
      setRoomLocation(editingExam.roomLocation || '');
      setNotes(editingExam.notes || '');
      setColor(editingExam.color || COLOR_OPTIONS[0].value);
      setTopics(editingExam.syllabusTopics || []);
    } else {
      // Default to 5 days from now
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 5);
      setSubject('');
      setCourseCode('');
      setExamDate(formatLocalDate(defaultDate));
      setExamTime('09:30');
      setDifficulty('Medium');
      setEstimatedPrepHours(14);
      setRoomLocation('');
      setNotes('');
      setColor(COLOR_OPTIONS[0].value);
      setTopics([
        { id: `top-${Date.now()}-1`, title: 'Chapter 1: Foundations & Core Concepts', completed: false },
        { id: `top-${Date.now()}-2`, title: 'Chapter 2: Advanced Mechanics & Applications', completed: false },
      ]);
    }
    setErrors({});
  }, [editingExam, isOpen]);

  if (!isOpen) return null;

  const handleAddTopic = () => {
    const trimmed = newTopicTitle.trim();
    if (!trimmed) return;
    setTopics(prev => [
      ...prev,
      {
        id: `topic-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        title: trimmed,
        completed: false,
      },
    ]);
    setNewTopicTitle('');
  };

  const handleRemoveTopic = (id: string) => {
    setTopics(prev => prev.filter(t => t.id !== id));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!subject.trim()) {
      newErrors.subject = 'Subject name is required.';
    } else if (subject.trim().length < 2) {
      newErrors.subject = 'Subject name must be at least 2 characters.';
    }

    if (!examDate) {
      newErrors.examDate = 'Exam date is required.';
    } else if (examDate < todayStr && !editingExam) {
      newErrors.examDate = 'Exam date cannot be in the past.';
    }

    if (!examTime) {
      newErrors.examTime = 'Exam time is required.';
    }

    if (!estimatedPrepHours || estimatedPrepHours <= 0) {
      newErrors.estimatedPrepHours = 'Preparation hours must be greater than 0.';
    } else if (estimatedPrepHours > 200) {
      newErrors.estimatedPrepHours = 'Please enter realistic hours (<= 200h).';
    }

    if (topics.length === 0) {
      newErrors.topics = 'Please add at least one syllabus topic to plan study sessions.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      subject: subject.trim(),
      courseCode: courseCode.trim() || undefined,
      examDate,
      examTime,
      difficulty,
      estimatedPrepHours: Number(estimatedPrepHours),
      syllabusTopics: topics,
      notes: notes.trim() || undefined,
      roomLocation: roomLocation.trim() || undefined,
      color,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-teal-400" />
            <h2 className="text-lg font-bold">
              {editingExam ? 'Edit Exam' : 'Add New Exam'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Subject & Course Code */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Subject Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="e.g. Distributed Systems"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 ${
                  errors.subject
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-300 focus:border-teal-600 focus:ring-teal-100'
                }`}
              />
              {errors.subject && (
                <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.subject}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Course Code
              </label>
              <input
                type="text"
                value={courseCode}
                onChange={e => setCourseCode(e.target.value)}
                placeholder="e.g. CS440"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              />
            </div>
          </div>

          {/* Date, Time, Difficulty */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Exam Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={examDate}
                onChange={e => setExamDate(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 ${
                  errors.examDate
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-300 focus:border-teal-600 focus:ring-teal-100'
                }`}
              />
              {errors.examDate && (
                <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.examDate}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Exam Time <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                value={examTime}
                onChange={e => setExamTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={e => setDifficulty(e.target.value as DifficultyLevel)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              >
                <option value="Easy">Easy (1.0x)</option>
                <option value="Medium">Medium (1.3x)</option>
                <option value="Hard">Hard (1.8x)</option>
              </select>
            </div>
          </div>

          {/* Estimated Prep Hours & Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Estimated Prep Hours <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={estimatedPrepHours}
                  onChange={e => setEstimatedPrepHours(Number(e.target.value))}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 ${
                    errors.estimatedPrepHours
                      ? 'border-rose-400 focus:ring-rose-200'
                      : 'border-slate-300 focus:border-teal-600 focus:ring-teal-100'
                  }`}
                />
                <span className="absolute right-3.5 top-2.5 text-xs font-medium text-slate-400">
                  hours total
                </span>
              </div>
              {errors.estimatedPrepHours && (
                <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.estimatedPrepHours}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Room / Venue Location
              </label>
              <input
                type="text"
                value={roomLocation}
                onChange={e => setRoomLocation(e.target.value)}
                placeholder="e.g. Science Block, Hall 101"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              />
            </div>
          </div>

          {/* Color theme selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Subject Color Accent
            </label>
            <div className="flex items-center gap-2.5 flex-wrap">
              {COLOR_OPTIONS.map(c => (
                <button
                  type="button"
                  key={c.value}
                  onClick={() => setColor(c.value)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform ${
                    color === c.value ? 'scale-115 border-slate-900 shadow-sm' : 'border-white opacity-85 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* Syllabus Topics Section */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Syllabus Topics <span className="text-rose-500">*</span>
              </label>
              <span className="text-xs text-slate-500">{topics.length} topics added</span>
            </div>

            {/* Topic Input */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newTopicTitle}
                onChange={e => setNewTopicTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTopic();
                  }
                }}
                placeholder="Add topic (e.g. Unit 3: Dynamic Programming) & press Enter"
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              />
              <button
                type="button"
                onClick={handleAddTopic}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-medium rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>

            {errors.topics && (
              <p className="text-xs text-rose-600 mb-2 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.topics}
              </p>
            )}

            {/* Topic List */}
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {topics.map((t, idx) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm group"
                >
                  <div className="flex items-center gap-2 overflow-hidden text-ellipsis">
                    <span className="text-xs font-mono text-slate-400 w-5">{idx + 1}.</span>
                    <span className={`text-slate-800 ${t.completed ? 'line-through text-slate-400' : ''}`}>
                      {t.title}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveTopic(t.id)}
                    className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                    title="Remove topic"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Exam Notes & Guidelines
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Allowed 1 sheet of handwritten notes. Bring calculator."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition-all active:scale-95"
            >
              {editingExam ? 'Save Changes' : 'Create Exam'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
