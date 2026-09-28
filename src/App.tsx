/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { DashboardTab } from './components/DashboardTab';
import { BotConfigTab } from './components/BotConfigTab';
import { AccessControlTab } from './components/AccessControlTab';
import { KnowledgeBaseTab } from './components/KnowledgeBaseTab';
import { PromptEditorTab } from './components/PromptEditorTab';
import { SimulatorTab } from './components/SimulatorTab';
import { DeployExportTab } from './components/DeployExportTab';
import { BotConfig, WhitelistUser, KnowledgeDocument, LogEntry } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [config, setConfig] = useState<BotConfig | null>(null);
  const [users, setUsers] = useState<WhitelistUser[]>([]);
  const [knowledge, setKnowledge] = useState<KnowledgeDocument[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isPollingActive, setIsPollingActive] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  }, []);

  // Fetch all initial data
  const loadAllData = useCallback(async () => {
    try {
      const [configRes, usersRes, knowledgeRes, logsRes, statusRes] = await Promise.all([
        fetch('/api/config').then((r) => r.json()),
        fetch('/api/users').then((r) => r.json()),
        fetch('/api/knowledge').then((r) => r.json()),
        fetch('/api/logs').then((r) => r.json()),
        fetch('/api/status').then((r) => r.json()),
      ]);

      setConfig(configRes);
      setUsers(usersRes);
      setKnowledge(knowledgeRes);
      setLogs(logsRes);
      setIsPollingActive(statusRes.isPollingActive);
    } catch (err) {
      console.error('Failed to load system data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
    // Poll updates every 6 seconds to show real-time user requests and activity
    const interval = setInterval(loadAllData, 6000);
    return () => clearInterval(interval);
  }, [loadAllData]);

  // Handlers
  const handleUpdateConfig = async (updates: Partial<BotConfig>) => {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (res.ok && data.config) {
      setConfig(data.config);
    } else {
      throw new Error(data.error || 'Помилка оновлення налаштувань');
    }
  };

  const handleTogglePolling = async () => {
    try {
      const res = await fetch('/api/bot/toggle-polling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start: !isPollingActive }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsPollingActive(data.isPollingActive);
        showToast(
          data.isPollingActive ? 'Telegram бота успішно запущено!' : 'Telegram бота зупинено',
          'success'
        );
      } else {
        showToast(data.error || 'Помилка зміни статусу бота', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Помилка підключення', 'error');
    }
  };

  const handleAddUser = async (user: Partial<WhitelistUser>) => {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    const data = await res.json();
    if (res.ok && data.users) {
      setUsers(data.users);
    } else {
      throw new Error(data.error || 'Помилка додавання користувача');
    }
  };

  const handleUserAction = async (
    userId: string,
    action: 'approve' | 'block' | 'delete' | 'update',
    actionData?: any
  ) => {
    const res = await fetch(`/api/users/${userId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...actionData }),
    });
    const data = await res.json();
    if (res.ok && data.users) {
      setUsers(data.users);
    } else {
      throw new Error(data.error || 'Помилка оновлення статусу користувача');
    }
  };

  const handleUploadDoc = async (docData: {
    title: string;
    subject: string;
    extractedText?: string;
    imageBase64?: string;
    filename?: string;
    fileSize?: number;
  }) => {
    const res = await fetch('/api/knowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(docData),
    });
    const data = await res.json();
    if (res.ok && data.doc) {
      setKnowledge((prev) => [data.doc, ...prev]);
    } else {
      throw new Error(data.error || 'Помилка завантаження матеріалу');
    }
  };

  const handleToggleDoc = async (id: string) => {
    const res = await fetch(`/api/knowledge/${id}/toggle`, { method: 'PATCH' });
    const data = await res.json();
    if (res.ok && data.doc) {
      setKnowledge((prev) => prev.map((d) => (d.id === id ? data.doc : d)));
      showToast(
        data.doc.isActive
          ? `«${data.doc.title}» підключено до контексту`
          : `«${data.doc.title}» вимкнено`,
        'success'
      );
    }
  };

  const handleDeleteDoc = async (id: string) => {
    const res = await fetch(`/api/knowledge/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setKnowledge((prev) => prev.filter((d) => d.id !== id));
    }
  };

  const pendingCount = users.filter((u) => u.status === 'pending').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs sm:text-sm font-medium border animate-in fade-in slide-in-from-bottom-5 transition-all ${
            toast.type === 'error'
              ? 'bg-rose-950 border-rose-800 text-rose-200'
              : 'bg-emerald-950 border-emerald-800 text-emerald-200'
          }`}
        >
          <span>{toast.type === 'error' ? '⚠️' : '✅'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        config={config}
        isPollingActive={isPollingActive}
        onTogglePolling={handleTogglePolling}
        pendingCount={pendingCount}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="py-24 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Завантаження панелі керування...</span>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardTab
                config={config}
                users={users}
                knowledge={knowledge}
                logs={logs}
                isPollingActive={isPollingActive}
                onNavigate={(tab) => setActiveTab(tab)}
                onApproveUser={(userId) => handleUserAction(userId, 'approve')}
                onRejectUser={(userId) => handleUserAction(userId, 'block')}
              />
            )}

            {activeTab === 'bot-setup' && (
              <BotConfigTab
                config={config}
                onUpdateConfig={handleUpdateConfig}
                isPollingActive={isPollingActive}
                onTogglePolling={handleTogglePolling}
                showToast={showToast}
              />
            )}

            {activeTab === 'access-control' && (
              <AccessControlTab
                config={config}
                users={users}
                onUpdateConfig={handleUpdateConfig}
                onAddUser={handleAddUser}
                onUserAction={handleUserAction}
                showToast={showToast}
              />
            )}

            {activeTab === 'knowledge' && (
              <KnowledgeBaseTab
                documents={knowledge}
                onUploadDoc={handleUploadDoc}
                onToggleDoc={handleToggleDoc}
                onDeleteDoc={handleDeleteDoc}
                showToast={showToast}
              />
            )}

            {activeTab === 'prompt-builder' && (
              <PromptEditorTab
                config={config}
                onUpdateConfig={handleUpdateConfig}
                showToast={showToast}
              />
            )}

            {activeTab === 'simulator' && (
              <SimulatorTab config={config} showToast={showToast} />
            )}

            {activeTab === 'deploy-export' && (
              <DeployExportTab config={config} showToast={showToast} />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-4 text-center text-xs text-slate-500">
        EduBot Control Center • Розв'язання контрольних та тестів на базі Gemini AI • Захищена система доступу
      </footer>
    </div>
  );
}
