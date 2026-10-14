import { Exam, StudyPreferences } from '../types';
import { addDaysToDateStr, formatLocalDate } from './scheduler';

export function getSampleExams(baseDateStr?: string): Exam[] {
  const base = baseDateStr || formatLocalDate(new Date());

  return [
    {
      id: 'demo-exam-1',
      subject: 'Distributed Systems & Cloud Computing',
      courseCode: 'CS440',
      examDate: addDaysToDateStr(base, 2),
      examTime: '09:30',
      difficulty: 'Hard',
      estimatedPrepHours: 14,
      notes: 'Final examination in Hall B. Bring student ID and non-programmable calculator.',
      roomLocation: 'Science Building, Hall 204',
      color: '#0284c7', // Sky / Blue
      createdAt: new Date().toISOString(),
      syllabusTopics: [
        { id: 'top-1-1', title: 'Consensus Algorithms (Raft & Paxos)', completed: true },
        { id: 'top-1-2', title: 'Vector Clocks & Logical Time', completed: false },
        { id: 'top-1-3', title: 'CAP Theorem & Eventual Consistency', completed: false },
        { id: 'top-1-4', title: 'Distributed Transactions & 2PC', completed: false },
        { id: 'top-1-5', title: 'Fault Tolerance & Leader Election', completed: false },
      ],
    },
    {
      id: 'demo-exam-2',
      subject: 'Machine Learning & Pattern Recognition',
      courseCode: 'AI310',
      examDate: addDaysToDateStr(base, 5),
      examTime: '13:30',
      difficulty: 'Hard',
      estimatedPrepHours: 18,
      notes: 'Comprehensive exam covering supervised, unsupervised, and deep architectures.',
      roomLocation: 'Turing Lecture Theatre',
      color: '#6366f1', // Indigo
      createdAt: new Date().toISOString(),
      syllabusTopics: [
        { id: 'top-2-1', title: 'Backpropagation & Gradient Descent Optimizers', completed: true },
        { id: 'top-2-2', title: 'Convolutional Neural Networks (CNN) Architectures', completed: true },
        { id: 'top-2-3', title: 'Attention Mechanisms & Transformers', completed: false },
        { id: 'top-2-4', title: 'Regularization: Dropout, Batch Normalization, Weight Decay', completed: false },
        { id: 'top-2-5', title: 'Support Vector Machines & Kernel Trick', completed: false },
        { id: 'top-2-6', title: 'Evaluation Metrics: ROC-AUC, F1-Score, Confusion Matrices', completed: false },
      ],
    },
    {
      id: 'demo-exam-3',
      subject: 'Computer Networks & Cybersecurity',
      courseCode: 'NET205',
      examDate: addDaysToDateStr(base, 8),
      examTime: '10:00',
      difficulty: 'Medium',
      estimatedPrepHours: 12,
      notes: 'Covers OSI layers 3 to 7 with routing protocol simulations.',
      roomLocation: 'Engineering Wing 102',
      color: '#0d9488', // Teal
      createdAt: new Date().toISOString(),
      syllabusTopics: [
        { id: 'top-3-1', title: 'TCP Flow & Congestion Control (Tahoe vs Reno)', completed: false },
        { id: 'top-3-2', title: 'BGP & OSPF Routing Protocols', completed: false },
        { id: 'top-3-3', title: 'TLS Handshake & Public Key Infrastructure (PKI)', completed: false },
        { id: 'top-3-4', title: 'DNS Security & Firewall Rule Policies', completed: false },
      ],
    },
    {
      id: 'demo-exam-4',
      subject: 'Software Architecture & Design Patterns',
      courseCode: 'SE302',
      examDate: addDaysToDateStr(base, 12),
      examTime: '15:00',
      difficulty: 'Easy',
      estimatedPrepHours: 8,
      notes: 'Multiple choice plus 2 system design case study questions.',
      roomLocation: 'Main Auditorium',
      color: '#f59e0b', // Amber
      createdAt: new Date().toISOString(),
      syllabusTopics: [
        { id: 'top-4-1', title: 'Creational Patterns: Factory, Builder, Singleton', completed: true },
        { id: 'top-4-2', title: 'Structural Patterns: Adapter, Facade, Decorator', completed: false },
        { id: 'top-4-3', title: 'Microservices vs Monolith Trade-offs', completed: false },
        { id: 'top-4-4', title: 'SOLID Principles in Clean Code', completed: false },
      ],
    },
  ];
}

export const defaultPreferences: StudyPreferences = {
  dailyAvailableHours: 4,
  preferredStudyTime: 'morning',
  sessionDurationMinutes: 50,
  breakMinutes: 10,
  weekendBonusHours: 2,
  focusStyle: 'pomodoro',
};
