import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  Exam,
  StudySession,
  StudyPreferences,
  ScheduleGenerationResult,
  AppNotification,
  SubjectPriority,
  OverloadAnalysis,
} from '../types';
import {
  formatLocalDate,
  calculateSubjectPriorities,
  analyzeOverload,
  generateDeterministicSchedule,
  getDaysDifference,
} from '../utils/scheduler';
import { getSampleExams, defaultPreferences } from '../utils/demoData';
import { playNotificationChime } from '../utils/audio';

const STORAGE_KEY_EXAMS = 'exam_planner_exams_v1';
const STORAGE_KEY_SESSIONS = 'exam_planner_sessions_v1';
const STORAGE_KEY_PREFS = 'exam_planner_prefs_v1';
const STORAGE_KEY_META = 'exam_planner_schedule_meta_v1';
const STORAGE_KEY_SOUND = 'exam_planner_sound_v1';
const STORAGE_KEY_NOTIFIED = 'exam_planner_notified_v1';

export type ActiveTab = 'dashboard' | 'exams' | 'timetable' | 'progress' | 'reminders' | 'settings';

interface AppContextType {
  exams: Exam[];
  studySessions: StudySession[];
  preferences: StudyPreferences;
  scheduleMeta: {
    generatorType: 'ai' | 'deterministic';
    generatedAt: string;
    summary: string;
    isOverloaded: boolean;
    overloadDetails?: OverloadAnalysis;
  } | null;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isGenerating: boolean;
  scheduleError: string | null;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  browserNotificationsEnabled: boolean;
  requestNotificationPermission: () => Promise<boolean>;
  sendTestNotification: () => void;
  
  // Computed helpers
  subjectPriorities: SubjectPriority[];
  overloadAnalysis: OverloadAnalysis;
  todayDateStr: string;
  
  // Actions
  addExam: (examData: Omit<Exam, 'id' | 'createdAt'>) => void;
  updateExam: (id: string, updates: Partial<Exam>) => void;
  deleteExam: (id: string) => void;
  toggleTopicCompletion: (examId: string, topicId: string) => void;
  toggleSessionCompletion: (sessionId: string) => void;
  generateSchedule: (mode: 'ai' | 'deterministic') => Promise<void>;
  updatePreferences: (updates: Partial<StudyPreferences>) => void;
  loadDemoData: () => void;
  clearAllData: () => void;
  exportDataJson: () => string;
  importDataJson: (json: string) => { success: boolean; error?: string };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const todayDateStr = useMemo(() => formatLocalDate(new Date()), []);

  // State initialization with localStorage fallback
  const [exams, setExams] = useState<Exam[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_EXAMS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load exams from localStorage', e);
    }
    // Initial start: load demo data so applet is ready to test immediately!
    return getSampleExams();
  });

  const [studySessions, setStudySessions] = useState<StudySession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SESSIONS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load study sessions from localStorage', e);
    }
    return [];
  });

  const [preferences, setPreferences] = useState<StudyPreferences>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load preferences from localStorage', e);
    }
    return defaultPreferences;
  });

  const [scheduleMeta, setScheduleMeta] = useState<AppContextType['scheduleMeta']>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_META);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load schedule meta', e);
    }
    return null;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isGenerating, setIsGenerating] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SOUND);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState<boolean>(() => {
    return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
  });

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_EXAMS, JSON.stringify(exams));
    } catch (e) {
      console.warn('Failed to save exams', e);
    }
  }, [exams]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(studySessions));
    } catch (e) {
      console.warn('Failed to save study sessions', e);
    }
  }, [studySessions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(preferences));
    } catch (e) {
      console.warn('Failed to save preferences', e);
    }
  }, [preferences]);

  useEffect(() => {
    try {
      if (scheduleMeta) {
        localStorage.setItem(STORAGE_KEY_META, JSON.stringify(scheduleMeta));
      } else {
        localStorage.removeItem(STORAGE_KEY_META);
      }
    } catch (e) {
      console.warn('Failed to save schedule meta', e);
    }
  }, [scheduleMeta]);

  const setSoundEnabled = (enabled: boolean) => {
    setSoundEnabledState(enabled);
    try {
      localStorage.setItem(STORAGE_KEY_SOUND, JSON.stringify(enabled));
    } catch {}
  };

  // If no sessions yet and exams exist on initial load, generate initial deterministic schedule so dashboard is rich
  useEffect(() => {
    if (studySessions.length === 0 && exams.length > 0 && !scheduleMeta) {
      const initial = generateDeterministicSchedule(exams, preferences, todayDateStr);
      setStudySessions(initial.sessions);
      setScheduleMeta({
        generatorType: 'deterministic',
        generatedAt: initial.generatedAt,
        summary: 'Initial baseline schedule generated automatically based on your exam syllabus and availability.',
        isOverloaded: initial.isOverloaded,
        overloadDetails: initial.overloadDetails,
      });
    }
  }, []);

  // Computed metrics
  const subjectPriorities = useMemo(() => {
    return calculateSubjectPriorities(exams, todayDateStr);
  }, [exams, todayDateStr]);

  const overloadAnalysis = useMemo(() => {
    return analyzeOverload(exams, preferences, todayDateStr);
  }, [exams, preferences, todayDateStr]);

  // Request browser notification permission
  const requestNotificationPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notifications.');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      setBrowserNotificationsEnabled(granted);
      if (granted) {
        new Notification('Exam Schedule Assistant', {
          body: 'Notifications enabled! You will receive timely exam countdown alerts.',
          icon: '/favicon.ico',
        });
        if (soundEnabled) playNotificationChime();
      }
      return granted;
    } catch (e) {
      console.error('Error requesting notification permission', e);
      return false;
    }
  };

  const sendTestNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Upcoming Exam Reminder (Test)', {
        body: 'Distributed Systems & Cloud Computing exam starts in 2 days at 09:30 AM.',
        icon: '/favicon.ico',
      });
      if (soundEnabled) playNotificationChime();
    } else {
      requestNotificationPermission();
    }
  };

  // Exam actions
  const addExam = (examData: Omit<Exam, 'id' | 'createdAt'>) => {
    const newExam: Exam = {
      ...examData,
      id: `exam-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    setExams(prev => [...prev, newExam].sort((a, b) => a.examDate.localeCompare(b.examDate)));
    if (soundEnabled) playNotificationChime();
  };

  const updateExam = (id: string, updates: Partial<Exam>) => {
    setExams(prev =>
      prev
        .map(e => (e.id === id ? { ...e, ...updates } : e))
        .sort((a, b) => a.examDate.localeCompare(b.examDate))
    );
    // Also update subject name in sessions if changed
    if (updates.subject) {
      setStudySessions(prev =>
        prev.map(s => (s.examId === id ? { ...s, subject: updates.subject! } : s))
      );
    }
  };

  const deleteExam = (id: string) => {
    setExams(prev => prev.filter(e => e.id !== id));
    setStudySessions(prev => prev.filter(s => s.examId !== id));
  };

  const toggleTopicCompletion = (examId: string, topicId: string) => {
    setExams(prev =>
      prev.map(exam => {
        if (exam.id !== examId) return exam;
        return {
          ...exam,
          syllabusTopics: exam.syllabusTopics.map(topic => {
            if (topic.id !== topicId) return topic;
            const updated = !topic.completed;
            if (updated && soundEnabled) playNotificationChime();
            return { ...topic, completed: updated };
          }),
        };
      })
    );
  };

  const toggleSessionCompletion = (sessionId: string) => {
    setStudySessions(prev =>
      prev.map(session => {
        if (session.id !== sessionId) return session;
        const willComplete = !session.completed;
        if (willComplete && soundEnabled) playNotificationChime();

        // Also if topic matches an incomplete syllabus topic in that exam, mark it complete!
        if (willComplete) {
          setExams(currExams =>
            currExams.map(ex => {
              if (ex.id !== session.examId) return ex;
              return {
                ...ex,
                syllabusTopics: ex.syllabusTopics.map(top =>
                  top.title.toLowerCase().trim() === session.topic.toLowerCase().trim()
                    ? { ...top, completed: true }
                    : top
                ),
              };
            })
          );
        }

        return {
          ...session,
          completed: willComplete,
          completedAt: willComplete ? new Date().toISOString() : undefined,
        };
      })
    );
  };

  const updatePreferences = (updates: Partial<StudyPreferences>) => {
    setPreferences(prev => ({ ...prev, ...updates }));
  };

  const generateSchedule = async (mode: 'ai' | 'deterministic') => {
    if (exams.length === 0) {
      setScheduleError('Please add at least one exam before generating a timetable.');
      return;
    }

    setIsGenerating(true);
    setScheduleError(null);

    try {
      if (mode === 'deterministic') {
        const result = generateDeterministicSchedule(exams, preferences, todayDateStr);
        setStudySessions(result.sessions);
        setScheduleMeta({
          generatorType: 'deterministic',
          generatedAt: result.generatedAt,
          summary: result.summary,
          isOverloaded: result.isOverloaded,
          overloadDetails: result.overloadDetails,
        });
        if (soundEnabled) playNotificationChime();
        return;
      }

      // AI Mode
      const response = await fetch('/api/generate-ai-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exams,
          preferences,
          currentDate: todayDateStr,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      if (!data.success || !data.schedule) {
        throw new Error(data.error || 'Failed to generate timetable');
      }

      const schedule: ScheduleGenerationResult = data.schedule;
      setStudySessions(schedule.sessions);
      setScheduleMeta({
        generatorType: schedule.generatorType,
        generatedAt: schedule.generatedAt,
        summary: schedule.summary,
        isOverloaded: schedule.isOverloaded,
        overloadDetails: schedule.overloadDetails,
      });

      if (data.errorFallback) {
        setScheduleError(
          `AI service encountered an issue; fallback to deterministic scheduler was applied. (${data.originalError || ''})`
        );
      }

      if (soundEnabled) playNotificationChime();
    } catch (err: unknown) {
      console.warn('AI schedule generation failed, applying deterministic fallback:', err);
      // Seamless fallback
      const fallback = generateDeterministicSchedule(exams, preferences, todayDateStr);
      setStudySessions(fallback.sessions);
      setScheduleMeta({
        generatorType: 'deterministic',
        generatedAt: fallback.generatedAt,
        summary: 'Generated using deterministic fallback (AI request was unavailable).',
        isOverloaded: fallback.isOverloaded,
        overloadDetails: fallback.overloadDetails,
      });
      setScheduleError(
        'Could not reach AI optimization service. Generated rule-based deterministic timetable instead.'
      );
      if (soundEnabled) playNotificationChime();
    } finally {
      setIsGenerating(false);
    }
  };

  const loadDemoData = () => {
    const demo = getSampleExams();
    setExams(demo);
    const result = generateDeterministicSchedule(demo, preferences, todayDateStr);
    setStudySessions(result.sessions);
    setScheduleMeta({
      generatorType: 'deterministic',
      generatedAt: result.generatedAt,
      summary: 'Loaded sample university curriculum with pre-generated timetable.',
      isOverloaded: result.isOverloaded,
      overloadDetails: result.overloadDetails,
    });
    setScheduleError(null);
    if (soundEnabled) playNotificationChime();
  };

  const clearAllData = () => {
    setExams([]);
    setStudySessions([]);
    setScheduleMeta(null);
    setScheduleError(null);
    try {
      localStorage.removeItem(STORAGE_KEY_EXAMS);
      localStorage.removeItem(STORAGE_KEY_SESSIONS);
      localStorage.removeItem(STORAGE_KEY_META);
    } catch {}
  };

  const exportDataJson = (): string => {
    return JSON.stringify(
      {
        version: 1,
        exportedAt: new Date().toISOString(),
        exams,
        studySessions,
        preferences,
        scheduleMeta,
      },
      null,
      2
    );
  };

  const importDataJson = (json: string): { success: boolean; error?: string } => {
    try {
      const parsed = JSON.parse(json);
      if (!parsed.exams || !Array.isArray(parsed.exams)) {
        return { success: false, error: 'Invalid JSON: missing exams array.' };
      }
      setExams(parsed.exams);
      if (Array.isArray(parsed.studySessions)) {
        setStudySessions(parsed.studySessions);
      }
      if (parsed.preferences) {
        setPreferences(parsed.preferences);
      }
      if (parsed.scheduleMeta) {
        setScheduleMeta(parsed.scheduleMeta);
      }
      if (soundEnabled) playNotificationChime();
      return { success: true };
    } catch (e) {
      return { success: false, error: 'Malformed JSON syntax.' };
    }
  };

  return (
    <AppContext.Provider
      value={{
        exams,
        studySessions,
        preferences,
        scheduleMeta,
        activeTab,
        setActiveTab,
        isGenerating,
        scheduleError,
        soundEnabled,
        setSoundEnabled,
        browserNotificationsEnabled,
        requestNotificationPermission,
        sendTestNotification,
        subjectPriorities,
        overloadAnalysis,
        todayDateStr,
        addExam,
        updateExam,
        deleteExam,
        toggleTopicCompletion,
        toggleSessionCompletion,
        generateSchedule,
        updatePreferences,
        loadDemoData,
        clearAllData,
        exportDataJson,
        importDataJson,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
