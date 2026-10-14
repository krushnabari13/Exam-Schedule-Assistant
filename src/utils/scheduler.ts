import {
  Exam,
  StudyPreferences,
  StudySession,
  SubjectPriority,
  OverloadAnalysis,
  ScheduleGenerationResult,
  ActivityType,
} from '../types';

/**
 * Returns difference in days between two YYYY-MM-DD date strings.
 * E.g. target - current. Can be fractional if time is factored in.
 */
export function getDaysDifference(targetDateStr: string, fromDateStr: string): number {
  const [tY, tM, tD] = targetDateStr.split('-').map(Number);
  const [fY, fM, fD] = fromDateStr.split('-').map(Number);
  
  const target = new Date(tY, tM - 1, tD).getTime();
  const from = new Date(fY, fM - 1, fD).getTime();
  
  return Math.round((target - from) / (1000 * 60 * 60 * 24));
}

/**
 * Format a Date object to YYYY-MM-DD in local time
 */
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse YYYY-MM-DD to a local Date object at 00:00:00
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

/**
 * Add days to YYYY-MM-DD string
 */
export function addDaysToDateStr(dateStr: string, days: number): string {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + days);
  return formatLocalDate(d);
}

/**
 * Calculate subject priority scores and explanations
 */
export function calculateSubjectPriorities(
  exams: Exam[],
  currentDateStr: string
): SubjectPriority[] {
  if (!exams || exams.length === 0) return [];

  const difficultyWeights: Record<string, number> = {
    Hard: 1.8,
    Medium: 1.3,
    Easy: 1.0,
  };

  const rawScores: { exam: Exam; rawScore: number; days: number; pendingCount: number }[] = [];

  for (const exam of exams) {
    const days = getDaysDifference(exam.examDate, currentDateStr);
    const effectiveDays = Math.max(days, 0.5);
    const weight = difficultyWeights[exam.difficulty] || 1.2;
    const pendingCount = exam.syllabusTopics.filter(t => !t.completed).length;
    const totalCount = exam.syllabusTopics.length || 1;
    const incompleteRatio = pendingCount / totalCount;
    const hours = Math.max(exam.estimatedPrepHours, 1);

    // High urgency formula: (prep hours * difficulty * topic ratio) / days remaining
    const rawScore = (hours * weight * (0.5 + incompleteRatio * 0.5)) / Math.pow(effectiveDays, 0.85);

    rawScores.push({
      exam,
      rawScore,
      days,
      pendingCount,
    });
  }

  // Normalize scores to 1 - 100
  const maxRaw = Math.max(...rawScores.map(r => r.rawScore), 1);

  return rawScores.map(({ exam, rawScore, days, pendingCount }) => {
    const normalized = Math.min(100, Math.max(10, Math.round((rawScore / maxRaw) * 100)));

    let priorityLevel: 'Critical' | 'High' | 'Medium' | 'Low' = 'Medium';
    if (days <= 2 || normalized >= 75) {
      priorityLevel = 'Critical';
    } else if (days <= 5 || normalized >= 55) {
      priorityLevel = 'High';
    } else if (days <= 10 || normalized >= 35) {
      priorityLevel = 'Medium';
    } else {
      priorityLevel = 'Low';
    }

    const dayText = days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`;
    const reason = `${exam.difficulty} difficulty exam ${dayText}. Requires ~${exam.estimatedPrepHours}h prep with ${pendingCount} pending syllabus topics.`;

    return {
      examId: exam.id,
      subject: exam.subject,
      priorityScore: normalized,
      priorityLevel,
      reason,
      daysRemaining: days,
      pendingTopicsCount: pendingCount,
      requiredPrepHours: exam.estimatedPrepHours,
    };
  }).sort((a, b) => b.priorityScore - a.priorityScore);
}

/**
 * Analyze if the student's available hours can satisfy the required prep hours before each exam
 */
export function analyzeOverload(
  exams: Exam[],
  preferences: StudyPreferences,
  currentDateStr: string
): OverloadAnalysis {
  if (!exams || exams.length === 0) {
    return {
      isOverloaded: false,
      totalRequiredHours: 0,
      totalAvailableHours: 0,
      shortageHours: 0,
      daysUntilLastExam: 0,
      dailyDeficitHours: 0,
      message: 'No upcoming exams to analyze.',
      recommendations: [],
    };
  }

  // Sort exams by date ascending
  const sortedExams = [...exams].sort((a, b) => a.examDate.localeCompare(b.examDate));
  const lastExamDate = sortedExams[sortedExams.length - 1].examDate;
  const totalDays = Math.max(1, getDaysDifference(lastExamDate, currentDateStr) + 1);

  // Calculate total available hours up to the last exam
  let totalAvailableHours = 0;
  for (let i = 0; i < totalDays; i++) {
    const d = parseLocalDate(addDaysToDateStr(currentDateStr, i));
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    totalAvailableHours += preferences.dailyAvailableHours + (isWeekend ? preferences.weekendBonusHours : 0);
  }

  // Total required prep hours
  const totalRequiredHours = exams.reduce((acc, curr) => acc + curr.estimatedPrepHours, 0);

  // Check cumulative bottlenecks: for each exam deadline, can we fit its and earlier exams' needed hours?
  let bottleneckExam: Exam | null = null;
  let bottleneckShortage = 0;
  let runningRequiredHours = 0;

  for (const exam of sortedExams) {
    runningRequiredHours += exam.estimatedPrepHours;
    const daysToExam = Math.max(1, getDaysDifference(exam.examDate, currentDateStr));
    let availableUpToExam = 0;
    for (let i = 0; i < daysToExam; i++) {
      const d = parseLocalDate(addDaysToDateStr(currentDateStr, i));
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      availableUpToExam += preferences.dailyAvailableHours + (isWeekend ? preferences.weekendBonusHours : 0);
    }

    if (runningRequiredHours > availableUpToExam) {
      const diff = runningRequiredHours - availableUpToExam;
      if (diff > bottleneckShortage) {
        bottleneckShortage = diff;
        bottleneckExam = exam;
      }
    }
  }

  const isOverloaded = bottleneckShortage > 0 || totalRequiredHours > totalAvailableHours;
  const primaryShortage = Math.max(bottleneckShortage, totalRequiredHours - totalAvailableHours);
  const dailyDeficitHours = Math.round((primaryShortage / totalDays) * 10) / 10;

  const recommendations: string[] = [];
  if (isOverloaded) {
    if (bottleneckExam) {
      recommendations.push(
        `Critical bottleneck before "${bottleneckExam.subject}" on ${bottleneckExam.examDate}: Short by ~${Math.round(bottleneckShortage)} hours.`
      );
    }
    recommendations.push(
      `Increase your daily study time by at least ${dailyDeficitHours || 1} hour(s) per day.`
    );
    recommendations.push(
      `Prioritize "Hard" topics and condense review time for "Easy" concepts.`
    );
    recommendations.push(
      `Take advantage of weekend bonus study blocks to close the preparation gap.`
    );
  } else {
    recommendations.push(
      `Your schedule is balanced. You have a comfortable buffer of ${(totalAvailableHours - totalRequiredHours).toFixed(1)} study hours.`
    );
    recommendations.push(`Use spare time for comprehensive revision and timed practice tests.`);
  }

  const message = isOverloaded
    ? `Schedule Overloaded: You have planned ${totalRequiredHours}h of prep across ${totalDays} days, but only ${totalAvailableHours.toFixed(1)}h are available with your current daily goal. Shortage: ${primaryShortage.toFixed(1)}h.`
    : `Optimal Study Capacity: ${totalAvailableHours.toFixed(1)}h available across ${totalDays} days for ${totalRequiredHours}h required prep.`;

  return {
    isOverloaded,
    totalRequiredHours,
    totalAvailableHours: Math.round(totalAvailableHours * 10) / 10,
    shortageHours: Math.round(primaryShortage * 10) / 10,
    daysUntilLastExam: totalDays,
    dailyDeficitHours,
    message,
    recommendations,
  };
}

/**
 * Generate preferred start times based on student's preferred study time of day
 */
function getSlotsForTimeOfDay(
  preference: StudyPreferences['preferredStudyTime'],
  sessionCount: number,
  sessionLengthMin: number
): { start: string; end: string }[] {
  let baseHour = 9; // default 09:00 AM

  switch (preference) {
    case 'morning':
      baseHour = 8;
      break;
    case 'afternoon':
      baseHour = 13;
      break;
    case 'evening':
      baseHour = 17;
      break;
    case 'night':
      baseHour = 20;
      break;
    case 'flexible':
    default:
      baseHour = 10;
      break;
  }

  const slots: { start: string; end: string }[] = [];
  let currentMinuteOffset = baseHour * 60;

  for (let i = 0; i < sessionCount; i++) {
    // Break after each session: 15 min or user's break
    const startH = Math.floor(currentMinuteOffset / 60) % 24;
    const startM = currentMinuteOffset % 60;

    const endOffset = currentMinuteOffset + sessionLengthMin;
    const endH = Math.floor(endOffset / 60) % 24;
    const endM = endOffset % 60;

    slots.push({
      start: `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`,
      end: `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`,
    });

    currentMinuteOffset = endOffset + 15; // 15 min break between slots
  }

  return slots;
}

/**
 * Deterministic scheduling fallback algorithm
 * Respects strict deadline constraint: NEVER schedules after an exam date/time!
 */
export function generateDeterministicSchedule(
  exams: Exam[],
  preferences: StudyPreferences,
  currentDateStr: string
): ScheduleGenerationResult {
  const priorities = calculateSubjectPriorities(exams, currentDateStr);
  const overloadAnalysis = analyzeOverload(exams, preferences, currentDateStr);

  if (!exams || exams.length === 0) {
    return {
      sessions: [],
      generatorType: 'deterministic',
      generatedAt: new Date().toISOString(),
      isOverloaded: false,
      overloadDetails: overloadAnalysis,
      subjectPriorities: [],
      summary: 'No exams to schedule.',
    };
  }

  const sessions: StudySession[] = [];
  const sessionLengthMin = preferences.sessionDurationMinutes || 50;
  const breakMin = preferences.breakMinutes || 10;

  // Map each exam to track remaining prep minutes and unassigned topics
  const examStateMap = new Map<
    string,
    {
      exam: Exam;
      remainingMinutes: number;
      pendingTopics: string[];
      priority: SubjectPriority;
    }
  >();

  for (const exam of exams) {
    const pri = priorities.find(p => p.examId === exam.id) || {
      examId: exam.id,
      subject: exam.subject,
      priorityScore: 50,
      priorityLevel: 'Medium',
      reason: 'Standard review',
      daysRemaining: getDaysDifference(exam.examDate, currentDateStr),
      pendingTopicsCount: exam.syllabusTopics.length,
      requiredPrepHours: exam.estimatedPrepHours,
    };

    const pending = exam.syllabusTopics.filter(t => !t.completed).map(t => t.title);
    examStateMap.set(exam.id, {
      exam,
      remainingMinutes: Math.round(exam.estimatedPrepHours * 60),
      pendingTopics: pending.length > 0 ? [...pending] : ['Comprehensive Revision & Practice'],
      priority: pri,
    });
  }

  // Determine span of days from current to last exam
  const sortedExams = [...exams].sort((a, b) => a.examDate.localeCompare(b.examDate));
  const lastExamDate = sortedExams[sortedExams.length - 1].examDate;
  const totalDays = Math.max(1, getDaysDifference(lastExamDate, currentDateStr) + 1);

  // Iterate day by day
  for (let dayOffset = 0; dayOffset < totalDays; dayOffset++) {
    const dayDateStr = addDaysToDateStr(currentDateStr, dayOffset);
    const dayDateObj = parseLocalDate(dayDateStr);
    const isWeekend = dayDateObj.getDay() === 0 || dayDateObj.getDay() === 6;

    const availableHoursToday = preferences.dailyAvailableHours + (isWeekend ? preferences.weekendBonusHours : 0);
    const maxSessionsToday = Math.max(1, Math.floor((availableHoursToday * 60) / (sessionLengthMin + breakMin)));

    // Find exams that have NOT yet occurred on or before this day
    // IMPORTANT: NEVER schedule on or after an exam's date/time
    // Specifically: if dayDateStr > exam.examDate, exam is over.
    // If dayDateStr === exam.examDate, we do NOT schedule heavy sessions unless it's early morning before examTime.
    const eligibleExams = exams.filter(e => {
      const daysUntil = getDaysDifference(e.examDate, dayDateStr);
      // Strictly before exam date (daysUntil > 0)
      return daysUntil > 0;
    });

    if (eligibleExams.length === 0) continue;

    // Sort eligible exams by current day's dynamic priority:
    // Urgency increases as daysUntil decreases
    const sortedEligible = eligibleExams
      .map(e => {
        const state = examStateMap.get(e.id)!;
        const daysUntil = getDaysDifference(e.examDate, dayDateStr);
        const dynamicScore = (state.remainingMinutes * (e.difficulty === 'Hard' ? 1.8 : e.difficulty === 'Medium' ? 1.3 : 1.0)) / Math.max(daysUntil, 0.5);
        return { exam: e, state, daysUntil, dynamicScore };
      })
      .sort((a, b) => b.dynamicScore - a.dynamicScore);

    const timeSlots = getSlotsForTimeOfDay(
      preferences.preferredStudyTime,
      maxSessionsToday,
      sessionLengthMin
    );

    let slotIdx = 0;
    let eligibleIdx = 0;

    while (slotIdx < maxSessionsToday && sortedEligible.length > 0) {
      const candidate = sortedEligible[eligibleIdx % sortedEligible.length];
      const { exam, state, daysUntil } = candidate;

      // Select topic
      let topic = 'Core Subject Review';
      let activityType: ActivityType = 'deep_study';
      let isRevision = false;

      if (daysUntil === 1) {
        // Final day before exam: high-yield revision or mock test
        activityType = 'revision';
        isRevision = true;
        topic = `Final Pre-Exam Review: High-Yield Concepts & Formulas`;
      } else if (daysUntil === 2) {
        activityType = 'mock_exam';
        topic = `Timed Practice Questions & Past Papers`;
      } else if (state.pendingTopics.length > 0) {
        topic = state.pendingTopics.shift()!;
        activityType = exam.difficulty === 'Hard' ? 'deep_study' : 'practice_problems';
      } else {
        topic = `Spaced Repetition & Weak Areas Reinforcement`;
        activityType = 'revision';
        isRevision = true;
      }

      const slot = timeSlots[slotIdx] || {
        start: '10:00',
        end: '10:50',
      };

      const reason = daysUntil === 1
        ? `Critical Revision: Exam is tomorrow! Focusing on high-yield recall.`
        : daysUntil <= 3
        ? `High Priority: Exam in ${daysUntil} days (${exam.difficulty} difficulty).`
        : `Balanced Prep: Building syllabus foundation with ${state.pendingTopics.length} topics queued.`;

      sessions.push({
        id: `sess-${dayDateStr}-${exam.id}-${slotIdx}-${Math.random().toString(36).substring(2, 6)}`,
        examId: exam.id,
        subject: exam.subject,
        date: dayDateStr,
        startTime: slot.start,
        endTime: slot.end,
        durationMinutes: sessionLengthMin,
        topic,
        activityType,
        breakDurationMinutes: breakMin,
        priorityReason: reason,
        completed: false,
        isRevision,
      });

      state.remainingMinutes = Math.max(0, state.remainingMinutes - sessionLengthMin);
      slotIdx++;
      eligibleIdx++;
    }
  }

  return {
    sessions,
    generatorType: 'deterministic',
    generatedAt: new Date().toISOString(),
    isOverloaded: overloadAnalysis.isOverloaded,
    overloadDetails: overloadAnalysis,
    subjectPriorities: priorities,
    summary: `Generated ${sessions.length} study sessions across ${totalDays} days using deterministic priority balancing.`,
  };
}

/**
 * Validate schedule sessions against exam deadlines and rules
 */
export function validateSchedule(sessions: StudySession[], exams: Exam[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const examMap = new Map<string, Exam>(exams.map(e => [e.id, e]));

  for (const session of sessions) {
    const exam = examMap.get(session.examId);
    if (!exam) {
      errors.push(`Session references unknown exam ID: ${session.examId}`);
      continue;
    }

    // Check date constraint: session date must not be after exam date
    if (session.date > exam.examDate) {
      errors.push(
        `Violation: Session for "${session.subject}" scheduled on ${session.date}, which is AFTER exam date ${exam.examDate}.`
      );
    } else if (session.date === exam.examDate) {
      // If same date, check time
      if (session.startTime >= exam.examTime) {
        errors.push(
          `Violation: Session for "${session.subject}" starts at ${session.startTime}, which is AFTER or at exam time ${exam.examTime} on exam day.`
        );
      }
    }

    if (session.durationMinutes <= 0) {
      errors.push(`Invalid session duration: ${session.durationMinutes} min.`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
