export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

export interface SyllabusTopic {
  id: string;
  title: string;
  completed: boolean;
}

export interface Exam {
  id: string;
  subject: string;
  courseCode?: string;
  examDate: string; // YYYY-MM-DD
  examTime: string; // HH:mm (24-hour format)
  difficulty: DifficultyLevel;
  syllabusTopics: SyllabusTopic[];
  estimatedPrepHours: number;
  notes?: string;
  roomLocation?: string;
  color: string;
  createdAt: string;
}

export type ActivityType = 'deep_study' | 'practice_problems' | 'revision' | 'mock_exam';

export interface StudySession {
  id: string;
  examId: string;
  subject: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationMinutes: number;
  topic: string;
  activityType: ActivityType;
  breakDurationMinutes: number;
  priorityReason: string;
  completed: boolean;
  completedAt?: string;
  isRevision: boolean;
}

export type PreferredTimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night' | 'flexible';

export interface StudyPreferences {
  dailyAvailableHours: number;
  preferredStudyTime: PreferredTimeOfDay;
  sessionDurationMinutes: number; // e.g. 45, 60
  breakMinutes: number; // e.g. 10, 15
  weekendBonusHours: number; // additional hours on Sat/Sun
  focusStyle: 'pomodoro' | 'deep_block' | 'spaced_repetition';
}

export interface SubjectPriority {
  examId: string;
  subject: string;
  priorityScore: number; // 1 - 100
  priorityLevel: 'Critical' | 'High' | 'Medium' | 'Low';
  reason: string;
  daysRemaining: number;
  pendingTopicsCount: number;
  requiredPrepHours: number;
}

export interface OverloadAnalysis {
  isOverloaded: boolean;
  totalRequiredHours: number;
  totalAvailableHours: number;
  shortageHours: number;
  daysUntilLastExam: number;
  dailyDeficitHours: number;
  message: string;
  recommendations: string[];
}

export interface ScheduleGenerationResult {
  sessions: StudySession[];
  generatorType: 'ai' | 'deterministic';
  generatedAt: string;
  isOverloaded: boolean;
  overloadDetails?: OverloadAnalysis;
  subjectPriorities: SubjectPriority[];
  summary: string;
}

export type NotificationType = 'today_exam' | 'tomorrow_exam' | 'upcoming_exam' | 'study_reminder' | 'overload_warning';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: string;
  examId?: string;
  read: boolean;
}
