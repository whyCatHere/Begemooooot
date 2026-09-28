import React, { useState, useRef } from 'react';
import { Send, Image as ImageIcon, Bot, User, Sparkles, BookOpen, AlertCircle, RefreshCw, CheckCircle, ShieldCheck } from 'lucide-react';
import { BotConfig } from '../types';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  imageBase64?: string;
  timestamp: string;
  usedDocs?: { id: string; title: string; subject: string }[];
  executionTimeMs?: number;
}

interface SimulatorTabProps {
  config: BotConfig | null;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const SimulatorTab: React.FC<SimulatorTabProps> = ({ config, showToast }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      sender: 'bot',
      text: `👋 **Привіт! Я твій помічник для контрольних та тестів.**\n\nЯ працюю в режимі захисту акаунтів. Якщо ти авторизований — надішли фото завдання або текст. Якщо ні — введи команду \`/passcode ${
        config?.secretPasscode || 'STUDY2026'
      }\``,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [simUserRole, setSimUserRole] = useState<'admin' | 'guest' | 'student'>('student');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSend = async (customText?: string) => {
    const textToSend = (customText || input).trim();
    if (!textToSend && !selectedImage) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      imageBase64: selectedImage || undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    const curImage = selectedImage;
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/simulate-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: simUserRole === 'guest' ? '999111222' : '200000002',
          username: simUserRole === 'guest' ? 'guest_new' : 'student_olena',
          firstName: simUserRole === 'guest' ? 'Гість' : 'Олена',
          text: textToSend,
          imageBase64: curImage || undefined,
        }),
      });

      const data = await res.json();

      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: data.reply || 'Немає відповіді.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        usedDocs: data.usedDocs,
        executionTimeMs: data.executionTimeMs,
      };

      setMessages((prev) => [...prev, botMessage]);
      setTimeout(scrollToBottom, 100);
    } catch (err: any) {
      showToast('Помилка надсилання в симулятор', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (promptText: string) => {
    setInput(promptText);
    handleSend(promptText);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-400" />
            <span>Інтерактивний симулятор Telegram бота</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Перевірте розв'язання тестів та систему захисту акаунтів прямо в браузері.
          </p>
        </div>

        {/* User Role Switcher for Testing Whitelist */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Симулювати як:</span>
          <select
            value={simUserRole}
            onChange={(e: any) => setSimUserRole(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
          >
            <option value="student">Олена (Авторизований учень)</option>
            <option value="guest">Новий гість (Без доступу / перевірка коду)</option>
          </select>
        </div>
      </div>

      {/* Quick Test Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
        <span className="text-slate-500 shrink-0 font-medium">Швидкі тести:</span>
        <button
          onClick={() =>
            handleQuickPrompt(
              'Розв\'яжи тест з алгебри: sin^2(x) + cos^2(x) = ? Варіанти: А) 0, Б) 1, В) 2, Г) tg(x)'
            )
          }
          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 whitespace-nowrap"
        >
          📐 Тест з тригонометрії
        </button>
        <button
          onClick={() =>
            handleQuickPrompt(
              'Задача з фізики: Яка сила діє на тіло масою 5 кг, що рухається з прискоренням 2 м/с²?'
            )
          }
          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 whitespace-nowrap"
        >
          ⚡ Задача з фізики
        </button>
        <button
          onClick={() =>
            handleQuickPrompt('Тест з історії: В якому році відбулося хрещення Русі Володимиром Великим?')
          }
          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 whitespace-nowrap"
        >
          📜 Тест з історії України
        </button>
        <button
          onClick={() => handleQuickPrompt(`/passcode ${config?.secretPasscode || 'STUDY2026'}`)}
          className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 whitespace-nowrap font-mono"
        >
          🔑 /passcode {config?.secretPasscode || 'STUDY2026'}
        </button>
      </div>

      {/* Telegram Chat Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col h-[560px]">
        {/* Chat Header */}
        <div className="bg-slate-950/80 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
              🤖
            </div>
            <div>
              <div className="font-semibold text-white text-xs sm:text-sm">
                {config?.botFirstName || 'EduBot Study Solver'}
              </div>
              <div className="text-[11px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>готовий до розв'язання</span>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-500 font-mono">
            {config?.geminiModel || 'gemini-3.8-flash'}
          </div>
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-slate-950/40 to-slate-900/60">
          {messages.map((m) => {
            const isUser = m.sender === 'user';
            return (
              <div
                key={m.id}
                className={`flex gap-2.5 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                    isUser ? 'bg-indigo-600 text-white' : 'bg-blue-600 text-white'
                  }`}
                >
                  {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                <div
                  className={`rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-sm ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700/80'
                  }`}
                >
                  {m.imageBase64 && (
                    <div className="mb-2.5">
                      <img
                        src={m.imageBase64}
                        alt="Task Preview"
                        className="rounded-lg max-h-52 w-auto object-contain border border-slate-700"
                      />
                    </div>
                  )}

                  <div className="whitespace-pre-wrap">{m.text}</div>

                  {m.usedDocs && m.usedDocs.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-slate-700/60 flex flex-wrap items-center gap-1.5 text-[11px] text-indigo-300">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>База знань:</span>
                      {m.usedDocs.map((d) => (
                        <span
                          key={d.id}
                          className="bg-indigo-950/80 border border-indigo-500/30 px-1.5 py-0.5 rounded text-[10px]"
                        >
                          {d.title}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-1.5 text-right text-[10px] text-slate-400">
                    {m.timestamp}
                    {m.executionTimeMs && ` • ${(m.executionTimeMs / 1000).toFixed(2)}с`}
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-2.5 max-w-[85%]">
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center shrink-0 text-white text-xs">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="rounded-2xl rounded-tl-none p-3.5 bg-slate-800 border border-slate-700 text-slate-300 text-xs flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
                <span>Аналізую завдання та звіряю з підручниками...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Selected Image Preview Pill */}
        {selectedImage && (
          <div className="bg-slate-950 border-t border-slate-800 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src={selectedImage}
                alt="Selected"
                className="w-10 h-10 object-cover rounded-lg border border-slate-700"
              />
              <span className="text-xs text-slate-300 font-medium">Фото завдання прикріплено</span>
            </div>
            <button
              onClick={() => setSelectedImage(null)}
              className="text-slate-400 hover:text-rose-400 text-xs"
            >
              Видалити
            </button>
          </div>
        )}

        {/* Input Bar */}
        <div className="bg-slate-950 border-t border-slate-800 p-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title="Прикріпити фото контрольної або тесту"
            >
              <ImageIcon className="w-4 h-4 text-blue-400" />
            </button>

            <input
              type="text"
              placeholder="Напишіть умову контрольної, номер тесту або /start..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              type="submit"
              disabled={isLoading || (!input.trim() && !selectedImage)}
              className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium shadow-md shadow-blue-600/30 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
