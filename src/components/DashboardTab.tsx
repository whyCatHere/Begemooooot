import React from 'react';
import { Bot, Users, BookOpen, CheckCircle, AlertTriangle, ArrowRight, ShieldCheck, Zap, Sparkles, ExternalLink } from 'lucide-react';
import { BotConfig, WhitelistUser, KnowledgeDocument, LogEntry } from '../types';

interface DashboardTabProps {
  config: BotConfig | null;
  users: WhitelistUser[];
  knowledge: KnowledgeDocument[];
  logs: LogEntry[];
  isPollingActive: boolean;
  onNavigate: (tab: string) => void;
  onApproveUser: (userId: string) => void;
  onRejectUser: (userId: string) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  config,
  users,
  knowledge,
  logs,
  isPollingActive,
  onNavigate,
  onApproveUser,
  onRejectUser,
}) => {
  const approvedCount = users.filter((u) => u.status === 'approved').length;
  const pendingUsers = users.filter((u) => u.status === 'pending');
  const activeDocs = knowledge.filter((d) => d.isActive);
  const totalSolved = users.reduce((acc, u) => acc + (u.solvedCount || 0), 0);

  const botSetupDone = Boolean(config?.telegramBotToken);
  const knowledgeAdded = activeDocs.length > 0;
  const accessConfigured = users.length > 0;

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-blue-900/60 via-indigo-900/40 to-slate-900 border border-blue-800/40 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute -right-8 -top-8 w-56 h-56 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Центр керування навчальним Telegram ботом
              </h1>
            </div>
            <p className="text-sm text-slate-300 max-w-2xl">
              Автономний асистент на базі Gemini для вирішення контрольних робіт, тестів, самостійних завантаженими підручниками з персональною системою облікових записів.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {config?.botUsername ? (
              <a
                href={`https://t.me/${config.botUsername}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-600/30"
              >
                <span>Відкрити @{config.botUsername}</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            ) : (
              <button
                onClick={() => onNavigate('bot-setup')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-600/30"
              >
                <span>Підключити бота</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => onNavigate('simulator')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-sm transition-all"
            >
              <span>Тестовий симулятор</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Bot Status */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Статус Телеграм Бота</span>
            <div
              className={`p-2 rounded-lg ${
                isPollingActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
              }`}
            >
              <Bot className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isPollingActive ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
                }`}
              />
              <span className="text-lg font-bold text-white">
                {isPollingActive ? 'Активний онлайн' : botSetupDone ? 'Зупинено' : 'Не налаштовано'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 truncate">
              {config?.botUsername ? `@${config.botUsername}` : 'Потрібен токен від @BotFather'}
            </p>
          </div>
        </div>

        {/* Metric 2: Users & Whitelist */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Доступ & Акаунти</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">{approvedCount}</span>
              <span className="text-xs text-slate-400">дозволених акаунтів</span>
            </div>
            <p className="text-xs text-amber-400 mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{pendingUsers.length} в черзі на схвалення</span>
            </p>
          </div>
        </div>

        {/* Metric 3: Knowledge Base */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">База Підручників</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">{activeDocs.length}</span>
              <span className="text-xs text-slate-400">з {knowledge.length} матеріалів</span>
            </div>
            <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" />
              <span>Підключені до контексту Gemini</span>
            </p>
          </div>
        </div>

        {/* Metric 4: Solved Tasks */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Розв'язано завдань</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">{totalSolved}</span>
              <span className="text-xs text-slate-400">контрольних / тестів</span>
            </div>
            <p className="text-xs text-slate-400 mt-1 truncate">
              Модель: {config?.geminiModel || 'gemini-3.8-flash'}
            </p>
          </div>
        </div>
      </div>

      {/* Pending Access Alert Banner if any */}
      {pendingUsers.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm sm:text-base">
                  Очікують схвалення доступу: {pendingUsers.length} користувач(ів)
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Нові користувачі надіслали запит через Telegram. Чужі люди не зможуть користуватися ботом без вашого дозволу.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {pendingUsers.slice(0, 3).map((u) => (
                    <div
                      key={u.id}
                      className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 flex items-center gap-3 text-xs"
                    >
                      <div>
                        <div className="font-medium text-white">
                          {u.firstName || 'Користувач'} {u.username ? `(@${u.username})` : ''}
                        </div>
                        <div className="text-[11px] text-slate-400">ID: {u.id}</div>
                      </div>
                      <div className="flex items-center gap-1.5 ml-2">
                        <button
                          onClick={() => onApproveUser(u.id)}
                          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[11px] transition-colors"
                        >
                          Схвалити
                        </button>
                        <button
                          onClick={() => onRejectUser(u.id)}
                          className="px-2 py-1 rounded bg-rose-900/60 hover:bg-rose-800 text-rose-300 text-[11px] transition-colors"
                        >
                          Відхилити
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate('access-control')}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium whitespace-nowrap flex items-center gap-1 self-start"
            >
              <span>Всі акаунти</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Two Column Layout: Quick Checklist & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Launch Checklist */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
          <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-blue-400" />
            <span>Готовність системи до роботи</span>
          </h2>
          <div className="space-y-3">
            {/* Step 1 */}
            <div
              onClick={() => onNavigate('bot-setup')}
              className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    botSetupDone ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {botSetupDone ? '✓' : '1'}
                </div>
                <div>
                  <div className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
                    Telegram Bot Token
                  </div>
                  <div className="text-xs text-slate-400">
                    {botSetupDone
                      ? `Підключено: @${config?.botUsername || 'бот'}`
                      : 'Вставте токен, отриманий від @BotFather'}
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
            </div>

            {/* Step 2 */}
            <div
              onClick={() => onNavigate('knowledge')}
              className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    knowledgeAdded ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {knowledgeAdded ? '✓' : '2'}
                </div>
                <div>
                  <div className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
                    База підручників та конспектів
                  </div>
                  <div className="text-xs text-slate-400">
                    {activeDocs.length} активних матеріалів для розв'язання завдань
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
            </div>

            {/* Step 3 */}
            <div
              onClick={() => onNavigate('access-control')}
              className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    accessConfigured ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {accessConfigured ? '✓' : '3'}
                </div>
                <div>
                  <div className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
                    Захист та Секретний код
                  </div>
                  <div className="text-xs text-slate-400">
                    Пароль доступу: <span className="font-mono text-blue-300">{config?.secretPasscode || 'STUDY2026'}</span>
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
            </div>

            {/* Step 4 */}
            <div
              onClick={() => onNavigate('deploy-export')}
              className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-slate-700 text-slate-300">
                  4
                </div>
                <div>
                  <div className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
                    Експорт на GitHub та Хостинг
                  </div>
                  <div className="text-xs text-slate-400">
                    Завантажити готовий ZIP або розгорнути через Docker / Railway
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
            </div>
          </div>
        </div>

        {/* Recent Solved Tasks & Activity */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Останні розв'язані завдання</span>
              </h2>
              <button
                onClick={() => onNavigate('simulator')}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                Випробувати в симуляторі
              </button>
            </div>

            <div className="space-y-2.5">
              {logs.slice(0, 4).map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-lg bg-slate-800/40 border border-slate-800 text-xs flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">
                      {log.firstName || 'Учень'} {log.username ? `(@${log.username})` : ''}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        log.status === 'success'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {log.status === 'success' ? 'Розв\'язано' : 'Відхилено'}
                    </span>
                  </div>
                  <p className="text-slate-400 line-clamp-1 italic">«{log.query}»</p>
                  {log.responsePreview && (
                    <p className="text-slate-300 line-clamp-1 bg-slate-950/60 p-1.5 rounded font-mono text-[11px]">
                      {log.responsePreview}
                    </p>
                  )}
                </div>
              ))}

              {logs.length === 0 && (
                <div className="py-8 text-center text-slate-500 text-xs">
                  Історія запитів поки порожня. Надішліть перше завдання в бот або симулятор!
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 mt-4 flex items-center justify-between text-xs text-slate-400">
            <span>Всього запитів у журналі: {logs.length}</span>
            <button
              onClick={() => onNavigate('simulator')}
              className="text-blue-400 hover:text-blue-300 font-medium"
            >
              Перейти до симулятора →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
