import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { ExamsView } from './components/ExamsView';
import { TimetableView } from './components/TimetableView';
import { ProgressView } from './components/ProgressView';
import { RemindersView } from './components/RemindersView';
import { SettingsView } from './components/SettingsView';
import { ExamModal } from './components/ExamModal';
import { FocusTimerModal } from './components/FocusTimerModal';
import { Exam, StudySession } from './types';

function MainApp() {
  const { activeTab, addExam, updateExam, toggleSessionCompletion, soundEnabled } = useApp();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [focusSession, setFocusSession] = useState<StudySession | null>(null);

  const handleOpenAddExam = () => {
    setEditingExam(null);
    setIsExamModalOpen(true);
  };

  const handleEditExam = (exam: Exam) => {
    setEditingExam(exam);
    setIsExamModalOpen(true);
  };

  const handleSaveExam = (examData: Omit<Exam, 'id' | 'createdAt'>) => {
    if (editingExam) {
      updateExam(editingExam.id, examData);
    } else {
      addExam(examData);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900 font-sans antialiased selection:bg-teal-100 selection:text-teal-900">
      {/* Sidebar navigation */}
      <Sidebar
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        {/* Sticky Header */}
        <Header
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenAddExam={handleOpenAddExam}
        />

        {/* View Router */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              onOpenAddExam={handleOpenAddExam}
              onOpenFocusTimer={session => setFocusSession(session)}
            />
          )}

          {activeTab === 'exams' && (
            <ExamsView
              onOpenAddExam={handleOpenAddExam}
              onEditExam={handleEditExam}
            />
          )}

          {activeTab === 'timetable' && (
            <TimetableView
              onOpenFocusTimer={session => setFocusSession(session)}
            />
          )}

          {activeTab === 'progress' && <ProgressView />}

          {activeTab === 'reminders' && <RemindersView />}

          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Add / Edit Exam Modal */}
      <ExamModal
        isOpen={isExamModalOpen}
        onClose={() => setIsExamModalOpen(false)}
        onSave={handleSaveExam}
        editingExam={editingExam}
      />

      {/* Focus Timer / Pomodoro Modal */}
      <FocusTimerModal
        session={focusSession}
        onClose={() => setFocusSession(null)}
        onComplete={sessionId => toggleSessionCompletion(sessionId)}
        soundEnabled={soundEnabled}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
