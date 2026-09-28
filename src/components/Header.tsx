import React from 'react';
import { Bot, Shield, BookOpen, Sliders, Terminal, Github, Play, Square, Activity, Bell } from 'lucide-react';
import { BotConfig } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  config: BotConfig | null;
  isPollingActive: boolean;
  onTogglePolling: () => void;
  pendingCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  config,
  isPollingActive,
  onTogglePolling,
  pendingCount,
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Головна', icon: Activity },
    { id: 'bot-setup', label: 'Телеграм Бот', icon: Bot },
    {
      id: 'access-control',
      label: 'Система Доступу',
      icon: Shield,
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    { id: 'knowledge', label: 'База Підручників', icon: BookOpen },
    { id: 'prompt-builder', label: 'Налаштування AI', icon: Sliders },
    { id: 'simulator', label: 'Симулятор / Тест', icon: Terminal },
    { id: 'deploy-export', label: 'Гітхаб & Хостинг', icon: Github },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-bold">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white tracking-tight">EduBot Admin</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-medium border border-blue-500/20">
                  Gemini AI
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Контрольні, тести та самостійні за підручниками
              </p>
            </div>
          </div>

          {/* Quick Bot Status & Polling Toggle Button */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700">
              <span
                className={`w-2 h-2 rounded-full ${
                  isPollingActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span className="text-slate-300">
                {isPollingActive
                  ? `Бот онлайн: @${config?.botUsername || 'бот'}`
                  : config?.telegramBotToken
                  ? 'Бот зупинений'
                  : 'Токен не вказано'}
              </span>
            </div>

            {config?.telegramBotToken && (
              <button
                onClick={onTogglePolling}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isPollingActive
                    ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
                title={isPollingActive ? 'Зупинити роботу бота' : 'Запустити прийом повідомлень'}
              >
                {isPollingActive ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Зупинити</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Запустити</span>
                  </>
                )}
              </button>
            )}

            {pendingCount > 0 && (
              <button
                onClick={() => setActiveTab('access-control')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-medium animate-pulse"
                title={`${pendingCount} запитів на доступ очікують схвалення`}
              >
                <Bell className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Запити:</span>
                <span className="bg-amber-500 text-slate-950 font-bold px-1.5 py-0.2 rounded-full text-[10px]">
                  {pendingCount}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 overflow-x-auto py-2 scrollbar-none border-t border-slate-800/60">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`ml-1 text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                      isActive ? 'bg-white text-blue-700' : 'bg-amber-500 text-slate-900'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
