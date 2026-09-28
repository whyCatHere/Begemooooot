import React, { useState } from 'react';
import { Sliders, Sparkles, Check, RotateCcw, BookOpen, Layers, CheckSquare } from 'lucide-react';
import { BotConfig } from '../types';

interface PromptEditorTabProps {
  config: BotConfig | null;
  onUpdateConfig: (updates: Partial<BotConfig>) => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const PromptEditorTab: React.FC<PromptEditorTabProps> = ({
  config,
  onUpdateConfig,
  showToast,
}) => {
  const [prompt, setPrompt] = useState(config?.systemPrompt || '');
  const [solutionFormat, setSolutionFormat] = useState<BotConfig['solutionFormat']>(
    config?.solutionFormat || 'detailed_steps'
  );
  const [mathNotation, setMathNotation] = useState<BotConfig['mathNotation']>(
    config?.mathNotation || 'latex'
  );
  const [isSaving, setIsSaving] = useState(false);

  const presets = [
    {
      id: 'control_work',
      title: 'Контрольна робота (Повний академічний розв\'язок)',
      description: 'Структура Дано / Знайти / Формули / Покрокове розв\'язання / Відповідь',
      text: `Ти — висококласний академічний викладач та помічник для контрольних робіт.
Твоє завдання:
1. Для кожної задачі обов'язково створи блоки:
   - 📌 **Дано:** (випиши всі величини та переведи в систему СІ за потреби)
   - 🔍 **Знайти:**
   - 📐 **Формули та закони:**
   - ✏️ **Покроковий розв'язок:** (розпиши кожен арифметичний та логічний крок)
   - 🎯 **Відповідь:**
2. Якщо на фото є кілька номерів, розв'яжи кожен окремо з чіткою нумерацією (Завдання 1, Завдання 2...).
3. Використовуй теоретичні правила з наданих у базі підручників.
4. Відповідай українською мовою.`,
    },
    {
      id: 'test_nmt',
      title: 'Тести (НМТ / ЗНО / Шкільні тести)',
      description: 'Миттєве виділення правильної літери А/Б/В/Г + аргументація',
      text: `Ти — експерт зі швидкого та безпомилкового проходження тестів (НМТ, ЗНО, модульні тести).
Твоє завдання:
1. Для кожного тестового завдання:
   - Першим рядком ВИДІЛИ правильний варіант: ✅ **Правильна відповідь: [Варіант]** (наприклад: **Варіант В** або **1-В, 2-А, 3-Г, 4-Б**).
   - Нижче дай коротке, але залізне обґрунтування (2-4 речення), чому саме цей варіант правильний і чому інші хибні.
2. Якщо це завдання на встановлення відповідностей (логічні пари), розпиши відповідність для кожного пункту окремо.
3. Опирайся на точні правила та конспекти з бази знань.`,
    },
    {
      id: 'independent_work',
      title: 'Самостійна робота з чернеткою',
      description: 'Розв\'язок зі швидкими підказками та перевіркою результату',
      text: `Ти — дружній персональний репетитор для самостійних робіт.
Твоє завдання:
1. Надати чіткий розв'язок задачі або вправи.
2. Додатково додати блок «💡 **Порада/Перевірка:**», де вказати, як учень може швидко перевірити себе або як не допустити типової помилки на уроці.
3. Оформлюй математичні та хімічні формули чітко й красиво.`,
    },
  ];

  const handleApplyPreset = (presetText: string) => {
    setPrompt(presetText);
    showToast('Шаблон інструкції застосовано!', 'success');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onUpdateConfig({
        systemPrompt: prompt.trim(),
        solutionFormat,
        mathNotation,
      });
      showToast('Інструкції для Gemini AI успішно збережено!', 'success');
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
          <Sliders className="w-5 h-5 text-indigo-400" />
          <span>Налаштування логіки розв'язання (AI Prompt)</span>
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Тут ви визначаєте, як саме штучний інтелект розв'язує ваші контрольні, тести та задачі.
        </p>
      </div>

      {/* Preset Cards */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Готові шаблони для контрольних та тестів:</span>
        </label>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {presets.map((preset) => (
            <div
              key={preset.id}
              onClick={() => handleApplyPreset(preset.text)}
              className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/60 hover:bg-slate-850 cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div>
                <h4 className="font-semibold text-white text-xs group-hover:text-indigo-300 transition-colors">
                  {preset.title}
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">{preset.description}</p>
              </div>
              <div className="mt-3 flex items-center gap-1 text-[11px] text-indigo-400 font-medium">
                <span>Застосувати шаблон →</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Prompt Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Системний промпт бота (Інструкція для Gemini)
              </label>
              <span className="text-xs text-slate-500 font-mono">
                {prompt.length} символів
              </span>
            </div>
            <textarea
              rows={12}
              required
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-4 text-xs sm:text-sm text-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
            />
          </div>

          {/* Additional Tuning Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                <span>Формат розв'язку</span>
              </label>
              <select
                value={solutionFormat}
                onChange={(e: any) => setSolutionFormat(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none"
              >
                <option value="detailed_steps">Повний покроковий розв'язок (для контрольних)</option>
                <option value="exam_ready">Екзаменаційний (Дано, формула, відповідь)</option>
                <option value="concise_test">Швидкий (відповідь + коротке пояснення)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>Відображення формул</span>
              </label>
              <select
                value={mathNotation}
                onChange={(e: any) => setMathNotation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none"
              >
                <option value="latex">Красивий LaTeX (наприклад: x = (-b ± √D) / (2a))</option>
                <option value="plain">Звичайний текстовий (наприклад: x = (-b +- sqrt(D)) / 2a)</option>
              </select>
            </div>
          </div>

          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-600/30"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'Збереження...' : 'Зберегти інструкції'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
