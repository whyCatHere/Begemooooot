import React, { useState } from 'react';
import { Bot, Key, Check, AlertCircle, Play, Square, ExternalLink, RefreshCw, Cpu, HelpCircle } from 'lucide-react';
import { BotConfig } from '../types';

interface BotConfigTabProps {
  config: BotConfig | null;
  onUpdateConfig: (updates: Partial<BotConfig>) => Promise<void>;
  isPollingActive: boolean;
  onTogglePolling: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const BotConfigTab: React.FC<BotConfigTabProps> = ({
  config,
  onUpdateConfig,
  isPollingActive,
  onTogglePolling,
  showToast,
}) => {
  const [token, setToken] = useState(config?.telegramBotToken || '');
  const [geminiKeyOverride, setGeminiKeyOverride] = useState(config?.geminiApiKeyOverride || '');
  const [geminiModel, setGeminiModel] = useState(config?.geminiModel || 'gemini-3.8-flash');
  const [isTestingToken, setIsTestingToken] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleTestToken = async () => {
    if (!token.trim()) {
      showToast('Будь ласка, введіть токен Telegram бота', 'error');
      return;
    }

    setIsTestingToken(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/bot/test-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim() }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setTestResult({ success: true, bot: data.bot });
        showToast(`Успішно підключено до @${data.bot.username}!`, 'success');
        // also save automatically
        await onUpdateConfig({
          telegramBotToken: token.trim(),
          botUsername: data.bot.username,
          botFirstName: data.bot.first_name,
        });
      } else {
        setTestResult({ success: false, error: data.error || 'Недійсний токен' });
        showToast(data.error || 'Помилка перевірки токена', 'error');
      }
    } catch (e: any) {
      setTestResult({ success: false, error: e.message });
      showToast('Помилка підключення до сервера', 'error');
    } finally {
      setIsTestingToken(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onUpdateConfig({
        telegramBotToken: token.trim(),
        geminiApiKeyOverride: geminiKeyOverride.trim(),
        geminiModel,
      });
      showToast('Налаштування бота збережено!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Помилка збереження', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-400" />
          <span>Підключення та налаштування Telegram Бота</span>
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Введіть токен бота від @BotFather для прийому завдань та фотографій з Telegram.
        </p>
      </div>

      {/* Main Bot Token Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
        <form onSubmit={handleSave} className="space-y-5">
          {/* Telegram Token Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Telegram Bot Token (HTTP API)
            </label>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="1234567890:ABCdefGHIjklMNOpqrSTUvwxYZ..."
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
              <button
                type="button"
                onClick={handleTestToken}
                disabled={isTestingToken || !token.trim()}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 font-medium text-xs sm:text-sm transition-all whitespace-nowrap"
              >
                {isTestingToken ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                    <span>Перевірка...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Перевірити токен</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Токен можна створити або скопіювати у офіційному боті Telegram{' '}
              <a
                href="https://t.me/BotFather"
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:underline inline-flex items-center gap-0.5"
              >
                @BotFather <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>

          {/* Test Result Display */}
          {testResult && (
            <div
              className={`p-4 rounded-lg border text-xs sm:text-sm ${
                testResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              {testResult.success ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>
                      З'єднання встановлено! Бот: <strong>{testResult.bot.first_name}</strong> (@
                      {testResult.bot.username})
                    </span>
                  </div>
                  <a
                    href={`https://t.me/${testResult.bot.username}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 underline text-emerald-300 hover:text-emerald-200"
                  >
                    <span>Відкрити в Telegram</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <span>Помилка: {testResult.error}</span>
                </div>
              )}
            </div>
          )}

          {/* Live Runner / Polling Switch */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isPollingActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                  }`}
                />
                <span className="font-semibold text-white text-sm">
                  Живий запуск бота (Long Polling)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {isPollingActive
                  ? 'Бот зараз активний і обробляє повідомлення учнів прямо з цього сервера.'
                  : 'Запустіть бота, щоб він відповідав на повідомлення та фотографії в Telegram.'}
              </p>
            </div>

            <button
              type="button"
              onClick={onTogglePolling}
              disabled={!token.trim()}
              className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all shadow-md ${
                isPollingActive
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white shadow-emerald-600/30'
              }`}
            >
              {isPollingActive ? (
                <>
                  <Square className="w-4 h-4 fill-current" />
                  <span>Зупинити бота</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Запустити бота</span>
                </>
              )}
            </button>
          </div>

          <div className="border-t border-slate-800 pt-5">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" />
              <span>Налаштування Gemini AI Моделі</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Обрана модель Gemini</label>
                <select
                  value={geminiModel}
                  onChange={(e) => setGeminiModel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="gemini-3.8-flash">gemini-3.8-flash (Рекомендована: надшвидка та точна)</option>
                  <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Мінімальна затримка)</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Ідеально розпізнає фотографії зошитів, формул та дрібний шрифт тестів.
                </p>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">
                  Власний Gemini API Key (для стороннього хостингу)
                </label>
                <input
                  type="password"
                  value={geminiKeyOverride}
                  onChange={(e) => setGeminiKeyOverride(e.target.value)}
                  placeholder="За замовчуванням: системний ключ"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Залиште пустим, щоб використовувати вбудований ключ середовища.
                </p>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-600/30"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Збереження...</span>
                </>
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  <span>Зберегти налаштування</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Instructions: How to get Bot Token */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
        <h3 className="font-semibold text-white text-sm mb-3 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-blue-400" />
          <span>Як створити бота у @BotFather за 1 хвилину:</span>
        </h3>
        <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm text-slate-300">
          <li>
            Відкрийте Telegram та знайдіть офіційного бота{' '}
            <a
              href="https://t.me/BotFather"
              target="_blank"
              rel="noreferrer"
              className="text-blue-400 font-semibold hover:underline"
            >
              @BotFather
            </a>
            .
          </li>
          <li>
            Натисніть <strong>/start</strong>, а потім надішліть команду <strong>/newbot</strong>.
          </li>
          <li>
            Введіть назву для бота (наприклад: <em>Мій Помічник для Контрольних</em>).
          </li>
          <li>
            Введіть юзернейм бота, що закінчується на <code>bot</code> (наприклад:{' '}
            <em>my_study_helper_bot</em>).
          </li>
          <li>
            BotFather надішле повідомлення з червоним API токеном вигляду{' '}
            <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300">
              1234567890:AAH...
            </code>
            .
          </li>
          <li>Скопіюйте цей токен та вставте у поле вище. Готово!</li>
        </ol>
      </div>
    </div>
  );
};
