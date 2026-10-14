import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Database,
  Download,
  Upload,
  Trash2,
  HelpCircle,
  Volume2,
  CheckCircle2,
  AlertTriangle,
  Server,
  Cloud,
  FileText,
  Shield,
  Sparkles,
} from 'lucide-react';
import { playNotificationChime } from '../utils/audio';

export const SettingsView: React.FC = () => {
  const {
    exams,
    studySessions,
    preferences,
    exportDataJson,
    importDataJson,
    clearAllData,
    loadDemoData,
    soundEnabled,
    setSoundEnabled,
  } = useApp();

  const [importText, setImportText] = useState('');
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Estimate storage usage in KB
  const totalJson = exportDataJson();
  const storageKb = (new Blob([totalJson]).size / 1024).toFixed(2);

  const handleExportFile = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(totalJson);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `exam_schedule_backup_${new Date().toISOString().split('T')[0]}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportSubmit = () => {
    if (!importText.trim()) return;
    const res = importDataJson(importText);
    if (res.success) {
      setImportStatus({ success: true, message: 'Backup successfully restored!' });
      setImportText('');
    } else {
      setImportStatus({ success: false, message: res.error || 'Failed to import JSON.' });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (content) {
        const res = importDataJson(content);
        if (res.success) {
          setImportStatus({ success: true, message: `Restored from file: ${file.name}` });
        } else {
          setImportStatus({ success: false, message: res.error || 'Invalid file contents.' });
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Settings, Storage & Deployment Guide
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Data persistence transparency, backup restoration, and instructions for running and deploying.
        </p>
      </div>

      {/* Storage Architecture & Transparency Box */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-teal-600" />
          <h2 className="text-base font-bold text-slate-900">
            Data Storage Architecture & Limitations
          </h2>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2 leading-relaxed">
          <p>
            <strong>Storage Model:</strong> This prototype uses browser-side{' '}
            <code className="text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded font-mono">
              localStorage
            </code>{' '}
            for high responsiveness and offline availability. All your exam entries, syllabus items,
            study sessions, and preferences are saved locally on your device.
          </p>
          <p>
            <strong>Current Limitations to Note:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-500">
            <li>
              <strong>Browser Scope:</strong> Data is saved per-browser. Opening the app in an incognito window or another browser will start with a fresh state.
            </li>
            <li>
              <strong>Cache Clearing:</strong> Clearing browser cookies/cache or site data will erase local storage.
            </li>
            <li>
              <strong>Recommendation:</strong> Use the <em>Export Backup JSON</em> button below to save your study data regularly or before switching devices.
            </li>
          </ul>

          <div className="pt-2 flex items-center justify-between text-slate-500 font-mono text-[11px]">
            <span>Current LocalStorage Usage:</span>
            <span className="font-bold text-slate-800">~{storageKb} KB ({exams.length} exams, {studySessions.length} sessions)</span>
          </div>
        </div>
      </div>

      {/* Backup & Restore Panel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Backup & Restore</h2>
          </div>
        </div>

        {importStatus && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              importStatus.success
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {importStatus.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            )}
            <span>{importStatus.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Export Box */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Export Data File
              </h3>
              <p className="text-xs text-slate-500">
                Download a clean JSON archive containing all exams, syllabus progress, and study timetables.
              </p>
            </div>
            <button
              onClick={handleExportFile}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4 text-teal-400" />
              <span>Download Backup (.json)</span>
            </button>
          </div>

          {/* Import Box */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Import from Backup File
              </h3>
              <p className="text-xs text-slate-500">
                Upload a previously saved <code className="font-mono">.json</code> file to restore your full timetable.
              </p>
            </div>
            <label className="w-full py-2.5 px-4 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer">
              <Upload className="w-4 h-4 text-slate-600" />
              <span>Select Backup File</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Or Paste JSON Text */}
        <div className="pt-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Or Paste Backup JSON Directly:
          </label>
          <textarea
            rows={2}
            value={importText}
            onChange={e => setImportText(e.target.value)}
            placeholder='Paste {"version": 1, "exams": [...]} here'
            className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 bg-white"
          />
          {importText && (
            <button
              onClick={handleImportSubmit}
              className="mt-2 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl"
            >
              Apply Pasted Backup
            </button>
          )}
        </div>
      </div>

      {/* Guide: Preview, Run, Export & Deploy */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-teal-600" />
          <h2 className="text-base font-bold text-slate-900">
            Guide: How to Run, Test, and Deploy this App
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
              <Server className="w-4 h-4 text-teal-600" />
              1. Local Development & Preview
            </h3>
            <p>
              To run the application locally on port 3000:
            </p>
            <pre className="p-2 bg-slate-900 text-teal-300 rounded-lg font-mono text-[11px] overflow-x-auto">
              npm install{'\n'}npm run dev
            </pre>
            <p>
              This boots the Express backend on <code className="font-mono">http://localhost:3000</code> with Vite middleware mounted in dev mode.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
              <Cloud className="w-4 h-4 text-indigo-600" />
              2. Production Build & Deployment
            </h3>
            <p>
              Build the frontend and start the production server:
            </p>
            <pre className="p-2 bg-slate-900 text-teal-300 rounded-lg font-mono text-[11px] overflow-x-auto">
              npm run build{'\n'}npm start
            </pre>
            <p>
              The server serves the compiled static assets from <code className="font-mono">dist/</code> and proxies Gemini AI requests safely without exposing keys.
            </p>
          </div>
        </div>
      </div>

      {/* Reset & Demo Data Actions */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Manage Stored Data</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Reset to sample university curriculum or erase all saved exams.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadDemoData}
            className="px-4 py-2 text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition-colors"
          >
            Reload Sample Data
          </button>

          <button
            onClick={() => setShowClearConfirm(true)}
            className="px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Clear All Data</span>
          </button>
        </div>
      </div>

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full p-6 text-center animate-in fade-in">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Erase All Data?</h3>
            <p className="text-xs text-slate-500 mt-1">
              This will clear all exams, study sessions, and progress from your browser storage.
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  clearAllData();
                  setShowClearConfirm(false);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl"
              >
                Confirm Erase
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
