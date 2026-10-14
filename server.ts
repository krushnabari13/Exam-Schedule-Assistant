import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import {
  generateDeterministicSchedule,
  analyzeOverload,
  calculateSubjectPriorities,
  validateSchedule,
  getDaysDifference,
} from './src/utils/scheduler';
import { Exam, StudyPreferences, StudySession, ScheduleGenerationResult } from './src/types';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '10mb' }));

  // Initialize GoogleGenAI SDK
  const apiKey = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      hasApiKey: !!apiKey,
      timestamp: new Date().toISOString(),
    });
  });

  // Deterministic schedule generation endpoint
  app.post('/api/generate-deterministic-schedule', (req: Request, res: Response) => {
    try {
      const { exams, preferences, currentDate } = req.body as {
        exams: Exam[];
        preferences: StudyPreferences;
        currentDate: string;
      };

      if (!exams || !Array.isArray(exams) || exams.length === 0) {
        res.status(400).json({ error: 'Exams list is required.' });
        return;
      }

      const schedule = generateDeterministicSchedule(exams, preferences, currentDate || new Date().toISOString().split('T')[0]);
      res.json({ success: true, schedule });
    } catch (err: unknown) {
      console.error('Deterministic scheduler error:', err);
      const message = err instanceof Error ? err.message : 'Unknown scheduling error';
      res.status(500).json({ error: message });
    }
  });

  // Gemini AI Schedule Generation Endpoint
  app.post('/api/generate-ai-schedule', async (req: Request, res: Response) => {
    try {
      const { exams, preferences, currentDate } = req.body as {
        exams: Exam[];
        preferences: StudyPreferences;
        currentDate: string;
      };

      if (!exams || !Array.isArray(exams) || exams.length === 0) {
        res.status(400).json({ error: 'Exams list is required.' });
        return;
      }

      const todayStr = currentDate || new Date().toISOString().split('T')[0];
      const priorities = calculateSubjectPriorities(exams, todayStr);
      const overload = analyzeOverload(exams, preferences, todayStr);

      // If no API key configured, use deterministic fallback gracefully
      if (!ai || !apiKey) {
        console.warn('GEMINI_API_KEY missing, using deterministic fallback scheduler.');
        const fallback = generateDeterministicSchedule(exams, preferences, todayStr);
        res.json({
          success: true,
          schedule: {
            ...fallback,
            summary: 'Deterministic schedule generated (Gemini API key not configured on server).',
          },
        });
        return;
      }

      // Prepare context for Gemini
      const examsSummary = exams.map(e => ({
        id: e.id,
        subject: e.subject,
        examDate: e.examDate,
        examTime: e.examTime,
        difficulty: e.difficulty,
        daysUntilExam: getDaysDifference(e.examDate, todayStr),
        estimatedPrepHours: e.estimatedPrepHours,
        pendingTopics: e.syllabusTopics.filter(t => !t.completed).map(t => t.title),
      }));

      const systemPrompt = `You are an expert academic timetable strategist.
Your task is to generate a personalized, balanced study timetable for a student preparing for upcoming exams.
Today's reference date is: ${todayStr}.

CRITICAL SCHEDULING RULES:
1. STRICT DEADLINE CONSTRAINT: You must NEVER schedule any study session for an exam on or after that exam's date and time. Every session for an exam MUST happen strictly BEFORE that exam occurs!
2. DAILY LIMIT: The student can study up to ${preferences.dailyAvailableHours} hours/day (plus ${preferences.weekendBonusHours}h on weekends). Do not overload any single day.
3. SUBJECT BALANCING: Allocate more time to "Hard" difficulty exams and exams happening sooner (within 3-5 days). Do not ignore exams further away; provide steady spaced study.
4. SESSION BREAKDOWN: Divide study into sessions of ~${preferences.sessionDurationMinutes} minutes each with ~${preferences.breakMinutes} minute breaks.
5. PREFERRED TIME: Student preferred time of day is: ${preferences.preferredStudyTime}.
6. TOPIC COVERAGE: Match sessions with actual pending syllabus topics provided.
7. REVISION & MOCKS: Schedule a dedicated 'revision' or 'mock_exam' in the 24-48 hours immediately prior to each exam.
8. EXPLAIN PRIORITY: In 'priorityReason', explicitly state why that subject and topic was prioritized for that time.
9. OVERLOAD DIAGNOSIS: If the total preparation hours exceed the available time before exams, set isOverloaded to true and provide clear student advice.`;

      const userPrompt = JSON.stringify({
        currentDate: todayStr,
        preferences,
        exams: examsSummary,
        calculatedPriorities: priorities,
        overloadAnalysis: overload,
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\nStudent Data:\n${userPrompt}` }] }
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: {
                type: Type.STRING,
                description: 'Executive summary and strategy breakdown for the student.',
              },
              isOverloaded: {
                type: Type.BOOLEAN,
                description: 'True if requested prep hours exceed student daily availability before deadlines.',
              },
              overloadAdvice: {
                type: Type.STRING,
                description: 'Actionable explanation if overloaded, or reassurance if balanced.',
              },
              sessions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    examId: { type: Type.STRING },
                    subject: { type: Type.STRING },
                    date: { type: Type.STRING, description: 'YYYY-MM-DD format strictly <= examDate' },
                    startTime: { type: Type.STRING, description: 'HH:mm 24-hour format' },
                    endTime: { type: Type.STRING, description: 'HH:mm 24-hour format' },
                    durationMinutes: { type: Type.INTEGER },
                    topic: { type: Type.STRING },
                    activityType: {
                      type: Type.STRING,
                      description: 'One of: deep_study, practice_problems, revision, mock_exam',
                    },
                    breakDurationMinutes: { type: Type.INTEGER },
                    priorityReason: { type: Type.STRING, description: 'Why this subject and topic was assigned here' },
                    isRevision: { type: Type.BOOLEAN },
                  },
                  required: [
                    'examId',
                    'subject',
                    'date',
                    'startTime',
                    'endTime',
                    'durationMinutes',
                    'topic',
                    'activityType',
                    'priorityReason',
                  ],
                },
              },
            },
            required: ['summary', 'isOverloaded', 'sessions'],
          },
        },
      });

      const rawJson = response.text ? response.text.trim() : '{}';
      const parsed = JSON.parse(rawJson);

      // Validate AI response against strict deadline constraints
      const rawSessions: StudySession[] = (parsed.sessions || []).map((s: any, idx: number) => ({
        id: s.id || `ai-sess-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        examId: s.examId,
        subject: s.subject,
        date: s.date,
        startTime: s.startTime || '09:00',
        endTime: s.endTime || '09:50',
        durationMinutes: s.durationMinutes || preferences.sessionDurationMinutes,
        topic: s.topic || 'Subject Review',
        activityType: ['deep_study', 'practice_problems', 'revision', 'mock_exam'].includes(s.activityType)
          ? s.activityType
          : 'deep_study',
        breakDurationMinutes: s.breakDurationMinutes || preferences.breakMinutes,
        priorityReason: s.priorityReason || 'AI optimized study slot',
        completed: false,
        isRevision: !!s.isRevision,
      }));

      // Validate
      const validation = validateSchedule(rawSessions, exams);

      // Filter out any invalid sessions that may have violated the deadline constraint
      const validSessions = rawSessions.filter(session => {
        const exam = exams.find(e => e.id === session.examId);
        if (!exam) return false;
        if (session.date > exam.examDate) return false;
        if (session.date === exam.examDate && session.startTime >= exam.examTime) return false;
        return true;
      });

      // If AI produced too few sessions or invalid schedule, use deterministic fallback
      if (validSessions.length === 0 && exams.length > 0) {
        console.warn('AI generated 0 valid sessions or violated constraints, using fallback:', validation.errors);
        const fallback = generateDeterministicSchedule(exams, preferences, todayStr);
        res.json({
          success: true,
          schedule: {
            ...fallback,
            summary: 'Deterministic schedule generated (AI schedule was adjusted for strict exam deadline integrity).',
          },
        });
        return;
      }

      const scheduleResult: ScheduleGenerationResult = {
        sessions: validSessions,
        generatorType: 'ai',
        generatedAt: new Date().toISOString(),
        isOverloaded: !!parsed.isOverloaded || overload.isOverloaded,
        overloadDetails: {
          ...overload,
          message: parsed.overloadAdvice || overload.message,
        },
        subjectPriorities: priorities,
        summary: parsed.summary || `AI generated ${validSessions.length} sessions optimized for your upcoming exams.`,
      };

      res.json({ success: true, schedule: scheduleResult });
    } catch (err: unknown) {
      console.error('Gemini AI scheduling error:', err);
      // Fallback to deterministic schedule on any AI failure
      try {
        const { exams, preferences, currentDate } = req.body as {
          exams: Exam[];
          preferences: StudyPreferences;
          currentDate: string;
        };
        const todayStr = currentDate || new Date().toISOString().split('T')[0];
        const fallback = generateDeterministicSchedule(exams, preferences, todayStr);
        res.json({
          success: true,
          schedule: {
            ...fallback,
            summary: 'Deterministic schedule generated (AI service was unavailable or encountered an error).',
          },
          errorFallback: true,
          originalError: err instanceof Error ? err.message : String(err),
        });
      } catch (fallbackErr) {
        res.status(500).json({ error: 'Failed to generate study timetable.' });
      }
    }
  });

  // Serve frontend
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server started on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
