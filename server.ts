import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { BotConfig, KnowledgeDocument, WhitelistUser, LogEntry, SolveRequest, SolveResult } from './src/types/index.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Storage file paths
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const KNOWLEDGE_FILE = path.join(DATA_DIR, 'knowledge.json');
const LOGS_FILE = path.join(DATA_DIR, 'logs.json');

// Initial defaults
const DEFAULT_CONFIG: BotConfig = {
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  geminiModel: 'gemini-3.8-flash',
  geminiApiKeyOverride: '',
  isPollingActive: false,
  accessMode: 'passcode_or_whitelist',
  secretPasscode: 'STUDY2026',
  systemPrompt: `Ти — персональний академічний репетитор та експерт з розв'язання тестів, контрольних і самостійних робіт.
Твоє завдання:
1. Швидко, безпомилково і аргументовано розв'язувати надані завдання, контрольні роботи, тести (ЗНО/НМТ, шкільні, університетські) та самостійні роботи.
2. Якщо користувач надсилає тест з варіантами відповідей (A, B, C, D або 1, 2, 3, 4):
   - Першим рядком ЧІТКО виділи правильну відповідь: ✅ **Правильна відповідь: [Варіант / Літера]**.
   - Нижче надай коротке і зрозуміле пояснення/довідку, чому саме цей варіант є правильним.
3. Якщо користувач надсилає задачу (з математики, фізики, хімії тощо):
   - Оформи за стандартом: «Дано:», «Знайти:», «Формули:», «Покроковий розв'язок:», «Відповідь:».
4. Суворо спирайся на завантажені навчальні матеріали, підручники та конспекти, якщо вони надані в контексті.
5. Завжди відповідай чистою, грамотною українською мовою з красивим форматуванням TeX/формул та списків.`,
  solutionFormat: 'detailed_steps',
  mathNotation: 'latex',
  language: 'uk',
};

const DEFAULT_USERS: WhitelistUser[] = [
  {
    id: '100000001',
    username: 'admin_creator',
    firstName: 'Головний',
    lastName: 'Адміністратор',
    role: 'admin',
    status: 'approved',
    addedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    lastActiveAt: new Date().toISOString(),
    solvedCount: 14,
    note: 'Власник бота',
  },
  {
    id: '200000002',
    username: 'student_olena',
    firstName: 'Олена',
    lastName: 'Коваль',
    role: 'student',
    status: 'approved',
    addedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    lastActiveAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    solvedCount: 8,
    note: '11 клас, підготовка до НМТ',
  },
  {
    id: '300000003',
    username: 'guest_denys',
    firstName: 'Денис',
    lastName: 'Кравченко',
    role: 'student',
    status: 'pending',
    addedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    solvedCount: 0,
    note: 'Надіслав запит на доступ через /start',
  },
];

const DEFAULT_KNOWLEDGE: KnowledgeDocument[] = [
  {
    id: 'doc-1',
    title: 'Алгебра 10-11 клас: Формули та властивості',
    subject: 'Алгебра',
    filename: 'algebra_formulas_10_11.txt',
    fileSize: 4200,
    uploadedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    isActive: true,
    extractedText: `Тема: Квадратні рівняння, тригонометрія, похідні та інтеграли.
1. Квадратне рівняння ax^2 + bx + c = 0.
Дискримінант D = b^2 - 4ac.
Якщо D > 0: x1,2 = (-b ± √D) / (2a).
Теорема Вієта: x1 + x2 = -b/a, x1 * x2 = c/a.
2. Основні тригонометричні тотожності:
sin^2(x) + cos^2(x) = 1.
tg(x) = sin(x) / cos(x); ctg(x) = cos(x) / sin(x).
sin(2x) = 2*sin(x)*cos(x); cos(2x) = cos^2(x) - sin^2(x).
3. Таблиця похідних:
(c)' = 0; (x)' = 1; (x^n)' = n * x^(n-1);
(sin x)' = cos x; (cos x)' = -sin x;
(tg x)' = 1 / cos^2 x; (e^x)' = e^x; (ln x)' = 1/x.
4. Первісні та інтеграли:
∫ x^n dx = (x^(n+1))/(n+1) + C (n ≠ -1).
∫ e^x dx = e^x + C; ∫ cos x dx = sin x + C; ∫ sin x dx = -cos x + C.`,
  },
  {
    id: 'doc-2',
    title: 'Фізика: Механіка, термодинаміка та оптика',
    subject: 'Фізика',
    filename: 'physics_handbook_core.txt',
    fileSize: 3800,
    uploadedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    isActive: true,
    extractedText: `Розділ Механіка:
- Швидкість рівномірного руху: v = s / t.
- Рівноприскорений рух: v = v0 + at, s = v0*t + (a*t^2)/2.
- Другий закон Ньютона: F = m*a. Сила тяжіння: F_тяж = m*g (g ≈ 9.8 м/с^2).
- Закон збереження імпульсу: m1*v1 + m2*v2 = const.
- Кінетична енергія: E_k = (m*v^2) / 2. Потенційна енергія: E_p = m*g*h.
Розділ Термодинаміка:
- Кількість теплоти при нагріванні: Q = c*m*ΔT.
- Рівняння стану ідеального газу (Менделєєва-Клапейрона): p*V = (m/M)*R*T (R = 8.31 Дж/(моль*К)).
Розділ Оптика:
- Закон заломлення Снеліуса: sin(α) / sin(β) = n2 / n1.
- Формула тонкої лінзи: 1/F = 1/d + 1/f.`,
  },
  {
    id: 'doc-3',
    title: 'Історія України: Ключові дати та періоди ЗНО/НМТ',
    subject: 'Історія',
    filename: 'history_ukraine_dates.txt',
    fileSize: 2900,
    uploadedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    isActive: true,
    extractedText: `Ключові дати:
988 р. — Хрещення Русі князем Володимиром Великим.
1037 р. — спорудження собору Святої Софії в Києві князем Ярославом Мудрим.
1187 р. — перша літописна згадка назви «Україна».
1569 р. — Люблінська унія, утворення Речі Посполитої.
1596 р. — Берестейська церковна унія, створення УГКЦ.
1648 р. — початок Національно-визвольної війни під проводом Богдана Хмельницького.
1709 р. — Полтавська битва.
1917 р., листопад — проголошення УНР III Універсалом.
1918 р., 22 січня — проголошення незалежності УНР IV Універсалом.
1991 р., 24 серпня — ухвалення Акта проголошення незалежності України.`,
  },
];

const DEFAULT_LOGS: LogEntry[] = [
  {
    id: 'log-1',
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
    userId: '200000002',
    username: 'student_olena',
    firstName: 'Олена',
    type: 'text',
    query: 'Знайди похідну функції f(x) = 3x^4 - sin(x) + 5',
    responsePreview: 'f\'(x) = 12x^3 - cos(x)',
    status: 'success',
    executionTimeMs: 820,
  },
  {
    id: 'log-2',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    userId: '300000003',
    username: 'guest_denys',
    firstName: 'Денис',
    type: 'auth_attempt',
    query: '/start',
    responsePreview: 'Запит на доступ відправлено адміністратору',
    status: 'denied',
    executionTimeMs: 40,
  },
];

// Helper functions for persistent state
function loadData<T>(file: string, fallback: T): T {
  try {
    if (fs.existsSync(file)) {
      const data = fs.readFileSync(file, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error(`Error loading data from ${file}:`, err);
  }
  return fallback;
}

function saveData<T>(file: string, data: T): void {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error saving data to ${file}:`, err);
  }
}

// State in memory
let botConfig: BotConfig = loadData(CONFIG_FILE, DEFAULT_CONFIG);
let usersList: WhitelistUser[] = loadData(USERS_FILE, DEFAULT_USERS);
let knowledgeDocs: KnowledgeDocument[] = loadData(KNOWLEDGE_FILE, DEFAULT_KNOWLEDGE);
let logsList: LogEntry[] = loadData(LOGS_FILE, DEFAULT_LOGS);

// Telegram Polling Controller
let pollingInterval: NodeJS.Timeout | null = null;
let lastUpdateId = 0;
let isPollingRunning = false;

// Initialize Gemini Client
function getGeminiClient() {
  const apiKey = botConfig.geminiApiKeyOverride?.trim() || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key is not configured. Add it in Settings or process.env.GEMINI_API_KEY');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Telegram API Helper
async function callTelegram(token: string, method: string, body?: any) {
  const url = `https://api.telegram.org/bot${token}/${method}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  return data;
}

// Build Context from Knowledge Base
function getKnowledgeContext(subjectFilter?: string): string {
  const activeDocs = knowledgeDocs.filter((d) => d.isActive);
  if (activeDocs.length === 0) return '';

  const relevant = subjectFilter
    ? activeDocs.filter((d) => d.subject.toLowerCase() === subjectFilter.toLowerCase() || d.subject === 'Інше')
    : activeDocs;

  const docsToUse = relevant.length > 0 ? relevant : activeDocs;

  let ctx = '\n\n=== БАЗА ЗНАНЬ ТА ПІДРУЧНИКИ (КОНТЕКСТ ДЛЯ РОЗВ\'ЯЗАННЯ) ===\n';
  docsToUse.forEach((doc, idx) => {
    ctx += `\n[Матеріал #${idx + 1}: ${doc.title} (${doc.subject})]\n${doc.extractedText}\n`;
  });
  ctx += '=== КІНЕЦЬ БАЗИ ЗНАНЬ ===\n\n';
  return ctx;
}

// Core Solver Logic
async function solveProblem(req: SolveRequest): Promise<SolveResult> {
  const startTime = Date.now();
  const ai = getGeminiClient();

  const knowledgeContext = getKnowledgeContext(req.subject);
  const userPrompt = req.query || 'Будь ласка, розв\'яжи всі завдання на фото з детальним поясненням.';

  const fullPrompt = `${botConfig.systemPrompt}
${knowledgeContext}

ЗАВДАННЯ ВІД КОРИСТУВАЧА:
${userPrompt}

Вимоги до формату відповіді:
- Режим: ${botConfig.solutionFormat}
- Математичні формули: ${botConfig.mathNotation}
- Якщо є тестові питання (A/B/C/D), спершу виведи жирним великим шрифтом правильний варіант, а далі розпиши обґрунтування.
- Якщо це задача, розпиши: Дано, Знайти, Формули, Розв'язок, Відповідь.`;

  let contentParts: any[] = [];
  if (req.imageBase64) {
    const mimeMatch = req.imageBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const cleanBase64 = req.imageBase64.replace(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/, '');

    contentParts = [
      {
        inlineData: {
          mimeType,
          data: cleanBase64,
        },
      },
      { text: fullPrompt },
    ];
  } else {
    contentParts = [{ text: fullPrompt }];
  }

  const modelToUse = botConfig.geminiModel || 'gemini-3.8-flash';
  const response = await ai.models.generateContent({
    model: modelToUse,
    contents: { parts: contentParts },
  });

  const solution = response.text || 'Не вдалося згенерувати розв\'язок. Спробуйте ще раз.';
  const executionTimeMs = Date.now() - startTime;

  const usedDocs = knowledgeDocs
    .filter((d) => d.isActive)
    .map((d) => ({ id: d.id, title: d.title, subject: d.subject }));

  return {
    solution,
    usedDocs,
    model: modelToUse,
    executionTimeMs,
  };
}

// User Authorization Check
function checkUserAccess(telegramUser: { id: string | number; username?: string; first_name?: string; last_name?: string }): {
  allowed: boolean;
  status: 'approved' | 'pending' | 'blocked' | 'new';
  userRecord?: WhitelistUser;
} {
  const userIdStr = String(telegramUser.id);
  const found = usersList.find((u) => u.id === userIdStr || (telegramUser.username && u.username === telegramUser.username));

  if (found) {
    found.lastActiveAt = new Date().toISOString();
    saveData(USERS_FILE, usersList);
    return {
      allowed: found.status === 'approved',
      status: found.status,
      userRecord: found,
    };
  }

  if (botConfig.accessMode === 'open') {
    const newUser: WhitelistUser = {
      id: userIdStr,
      username: telegramUser.username,
      firstName: telegramUser.first_name,
      lastName: telegramUser.last_name,
      role: 'student',
      status: 'approved',
      addedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      solvedCount: 0,
      note: 'Автоматично зареєстровано (відкритий доступ)',
    };
    usersList.push(newUser);
    saveData(USERS_FILE, usersList);
    return { allowed: true, status: 'approved', userRecord: newUser };
  }

  // Pending user created
  const pendingUser: WhitelistUser = {
    id: userIdStr,
    username: telegramUser.username,
    firstName: telegramUser.first_name,
    lastName: telegramUser.last_name,
    role: 'student',
    status: 'pending',
    addedAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    solvedCount: 0,
    note: 'Очікує схвалення адміністратора',
  };
  usersList.push(pendingUser);
  saveData(USERS_FILE, usersList);

  return { allowed: false, status: 'pending', userRecord: pendingUser };
}

// Handle Single Telegram Message
async function processTelegramMessage(token: string, message: any) {
  if (!message || !message.from) return;
  const user = message.from;
  const chatId = message.chat.id;
  const text = (message.text || message.caption || '').trim();
  const photos = message.photo;

  console.log(`[TG] Message from ${user.first_name} (@${user.username || user.id}): ${text || '[Photo]'}`);

  // Check /passcode command for quick access
  if (text.startsWith('/passcode') || text.startsWith('/code')) {
    const parts = text.split(' ');
    const code = parts[1]?.trim();
    if (code && code.toLowerCase() === botConfig.secretPasscode.toLowerCase()) {
      let existing = usersList.find((u) => u.id === String(user.id));
      if (!existing) {
        existing = {
          id: String(user.id),
          username: user.username,
          firstName: user.first_name,
          lastName: user.last_name,
          role: 'student',
          status: 'approved',
          addedAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString(),
          solvedCount: 0,
          note: 'Авторизовано через секретний код',
        };
        usersList.push(existing);
      } else {
        existing.status = 'approved';
        existing.note = (existing.note ? existing.note + '; ' : '') + 'Схвалено секретним кодом';
      }
      saveData(USERS_FILE, usersList);

      await callTelegram(token, 'sendMessage', {
        chat_id: chatId,
        text: `🎉 **Успішно! Доступ надано!**\n\nВи ввели правильний секретний код. Тепер ви можете надсилати сюди фото тестів, контрольних або текст задач — я розв'яжу їх за підручниками!`,
        parse_mode: 'Markdown',
      });
      return;
    } else {
      await callTelegram(token, 'sendMessage', {
        chat_id: chatId,
        text: `❌ **Невірний секретний код.**\nПеревірте правильність або зверніться до адміністратора для схвалення доступу.`,
        parse_mode: 'Markdown',
      });
      return;
    }
  }

  // Check access authorization
  const auth = checkUserAccess(user);
  if (!auth.allowed) {
    const isPending = auth.status === 'pending';
    const msg = isPending
      ? `🔒 **Доступ обмежено!**\n\nПривіт, ${user.first_name}! Цей бот призначений для закритих контрольних та тестів.\n\nВаш ID: \`${user.id}\`\nВаш запит надіслано в **панель адміністратора** на схвалення.\n\n💡 Якщо у вас є секретний ключ доступу, напишіть:\n\`/passcode ВАШ_КЛЮЧ\``
      : `⛔ **Ваш акаунт заблоковано адміністратором.**`;

    await callTelegram(token, 'sendMessage', {
      chat_id: chatId,
      text: msg,
      parse_mode: 'Markdown',
    });

    logsList.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: String(user.id),
      username: user.username,
      firstName: user.first_name,
      type: 'auth_attempt',
      query: text || '[Photo]',
      responsePreview: msg,
      status: 'denied',
      executionTimeMs: 10,
    });
    saveData(LOGS_FILE, logsList.slice(0, 500));
    return;
  }

  // Handle standard commands
  if (text === '/start') {
    const welcome = `👋 **Вітаю, ${user.first_name}!**\n\nЯ твій персональний помічник для розв'язання **контрольних робіт, тестів, самостійних завдань** та домашніх робіт за завантаженими підручниками!\n\n📌 **Як користуватися:**\n1. Надішли **фотографію** контрольної або сторінки зошита.\n2. Або напиши умову задачі/тесту текстом.\n3. Я проаналізую завдання, знайду потрібні правила в підручниках і надам покроковий розв'язок!\n\n📚 Переглянути завантажені підручники: /books\n⚙️ Допомога: /help`;
    await callTelegram(token, 'sendMessage', {
      chat_id: chatId,
      text: welcome,
      parse_mode: 'Markdown',
    });
    return;
  }

  if (text === '/help') {
    const helpMsg = `📖 **Інструкція з використання:**\n\n• **Тести з варіантами (A/B/C/D):** сфотографуй тест — я одразу виділю правильний варіант та поясню чому.\n• **Задачі:** розпишу з «Дано», формулами та покроковими розрахунками.\n• **Складні формули:** підтримуються всі символи математики, фізики та хімії.\n• **База знань:** всі розв'язки звіряються із завантаженими книжками та конспектами.\n\nКоманди:\n/books — список активних підручників\n/status — стан вашого профілю`;
    await callTelegram(token, 'sendMessage', {
      chat_id: chatId,
      text: helpMsg,
      parse_mode: 'Markdown',
    });
    return;
  }

  if (text === '/books') {
    const active = knowledgeDocs.filter((d) => d.isActive);
    let msg = `📚 **Завантажені навчальні матеріали (${active.length}):**\n\n`;
    if (active.length === 0) {
      msg += `База знань поки порожня. Адміністратор може завантажити підручники в веб-панелі.`;
    } else {
      active.forEach((doc, idx) => {
        msg += `${idx + 1}. **${doc.title}** (${doc.subject})\n`;
      });
    }
    await callTelegram(token, 'sendMessage', {
      chat_id: chatId,
      text: msg,
      parse_mode: 'Markdown',
    });
    return;
  }

  // Send "typing..." or "upload_photo..." indicator
  await callTelegram(token, 'sendChatAction', {
    chat_id: chatId,
    action: 'typing',
  });

  let imageBase64: string | undefined;

  // Process Photo if present
  if (photos && photos.length > 0) {
    try {
      const bestPhoto = photos[photos.length - 1]; // Highest resolution
      const fileInfo = await callTelegram(token, 'getFile', { file_id: bestPhoto.file_id });
      if (fileInfo.ok && fileInfo.result?.file_path) {
        const fileUrl = `https://api.telegram.org/file/bot${token}/${fileInfo.result.file_path}`;
        const imgRes = await fetch(fileUrl);
        const arrayBuf = await imgRes.arrayBuffer();
        const b64 = Buffer.from(arrayBuf).toString('base64');
        imageBase64 = `data:image/jpeg;base64,${b64}`;
      }
    } catch (photoErr) {
      console.error('Failed to download photo from Telegram:', photoErr);
    }
  }

  // Invoke Solver
  try {
    const result = await solveProblem({
      query: text,
      imageBase64,
      userId: String(user.id),
    });

    // Update user stats
    if (auth.userRecord) {
      auth.userRecord.solvedCount = (auth.userRecord.solvedCount || 0) + 1;
      saveData(USERS_FILE, usersList);
    }

    // Split message if longer than Telegram's 4096 limit
    const MAX_LEN = 3900;
    let remaining = result.solution;

    while (remaining.length > 0) {
      const chunk = remaining.slice(0, MAX_LEN);
      remaining = remaining.slice(MAX_LEN);
      await callTelegram(token, 'sendMessage', {
        chat_id: chatId,
        text: chunk,
        parse_mode: 'Markdown',
      }).catch(async () => {
        // Fallback to plain text if markdown formatting has unmatched tags
        await callTelegram(token, 'sendMessage', {
          chat_id: chatId,
          text: chunk,
        });
      });
    }

    // Record log
    logsList.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: String(user.id),
      username: user.username,
      firstName: user.first_name,
      type: imageBase64 ? 'photo' : 'text',
      query: text || '[Фотографія завдання]',
      responsePreview: result.solution.slice(0, 150) + '...',
      status: 'success',
      executionTimeMs: result.executionTimeMs,
    });
    saveData(LOGS_FILE, logsList.slice(0, 500));
  } catch (err: any) {
    console.error('Error during solving:', err);
    await callTelegram(token, 'sendMessage', {
      chat_id: chatId,
      text: `⚠️ Помилка при розв'язанні: ${err.message || 'Спробуйте надіслати чіткіше фото або умову.'}`,
    });
  }
}

// Telegram Long Polling Runner
async function startTelegramPolling() {
  if (isPollingRunning) return;
  const token = botConfig.telegramBotToken?.trim();
  if (!token) {
    console.log('[TG Polling] No bot token provided, polling not started.');
    return;
  }

  isPollingRunning = true;
  botConfig.isPollingActive = true;
  saveData(CONFIG_FILE, botConfig);
  console.log('[TG Polling] Starting polling loop...');

  // Verify token first
  try {
    const me = await callTelegram(token, 'getMe');
    if (me.ok && me.result) {
      botConfig.botUsername = me.result.username;
      botConfig.botFirstName = me.result.first_name;
      saveData(CONFIG_FILE, botConfig);
      console.log(`[TG Polling] Connected as @${me.result.username} (${me.result.first_name})`);
    } else {
      console.error('[TG Polling] Invalid token:', me);
      isPollingRunning = false;
      botConfig.isPollingActive = false;
      saveData(CONFIG_FILE, botConfig);
      return;
    }
  } catch (e) {
    console.error('[TG Polling] Failed getMe:', e);
    isPollingRunning = false;
    botConfig.isPollingActive = false;
    saveData(CONFIG_FILE, botConfig);
    return;
  }

  // Poll loop
  const poll = async () => {
    if (!isPollingRunning) return;
    try {
      const updates = await callTelegram(token, 'getUpdates', {
        offset: lastUpdateId + 1,
        timeout: 15,
      });

      if (updates.ok && Array.isArray(updates.result)) {
        for (const update of updates.result) {
          lastUpdateId = Math.max(lastUpdateId, update.update_id);
          if (update.message) {
            await processTelegramMessage(token, update.message);
          }
        }
      }
    } catch (pollErr: any) {
      console.error('[TG Polling] Poll tick error:', pollErr.message);
    }

    if (isPollingRunning) {
      pollingInterval = setTimeout(poll, 1000);
    }
  };

  poll();
}

function stopTelegramPolling() {
  isPollingRunning = false;
  botConfig.isPollingActive = false;
  if (pollingInterval) {
    clearTimeout(pollingInterval);
    pollingInterval = null;
  }
  saveData(CONFIG_FILE, botConfig);
  console.log('[TG Polling] Polling stopped.');
}

// Auto-start polling if token was previously active
if (botConfig.isPollingActive && botConfig.telegramBotToken) {
  startTelegramPolling();
}

// Setup Express
const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API ROUTES

// 1. Status & Overview
app.get('/api/status', async (req: Request, res: Response) => {
  res.json({
    isPollingActive: isPollingRunning,
    botUsername: botConfig.botUsername || null,
    botFirstName: botConfig.botFirstName || null,
    hasToken: Boolean(botConfig.telegramBotToken),
    totalUsers: usersList.length,
    approvedUsers: usersList.filter((u) => u.status === 'approved').length,
    pendingUsers: usersList.filter((u) => u.status === 'pending').length,
    totalDocs: knowledgeDocs.length,
    activeDocs: knowledgeDocs.filter((d) => d.isActive).length,
    totalLogs: logsList.length,
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY || botConfig.geminiApiKeyOverride),
  });
});

// 2. Bot Config GET / POST
app.get('/api/config', (req: Request, res: Response) => {
  res.json(botConfig);
});

app.post('/api/config', async (req: Request, res: Response) => {
  const updates: Partial<BotConfig> = req.body;
  const oldToken = botConfig.telegramBotToken;
  botConfig = { ...botConfig, ...updates };

  // If token changed, refresh bot info
  if (updates.telegramBotToken && updates.telegramBotToken !== oldToken) {
    try {
      const me = await callTelegram(updates.telegramBotToken.trim(), 'getMe');
      if (me.ok && me.result) {
        botConfig.botUsername = me.result.username;
        botConfig.botFirstName = me.result.first_name;
      }
    } catch (e) {
      console.error('Failed to verify new token:', e);
    }
  }

  saveData(CONFIG_FILE, botConfig);
  res.json({ success: true, config: botConfig });
});

// 3. Test Bot Token
app.post('/api/bot/test-token', async (req: Request, res: Response) => {
  const token = (req.body.token || botConfig.telegramBotToken || '').trim();
  if (!token) {
    return res.status(400).json({ error: 'Вкажіть токен Telegram бота' });
  }

  try {
    const me = await callTelegram(token, 'getMe');
    if (me.ok && me.result) {
      botConfig.botUsername = me.result.username;
      botConfig.botFirstName = me.result.first_name;
      saveData(CONFIG_FILE, botConfig);
      return res.json({ success: true, bot: me.result });
    } else {
      return res.status(400).json({ error: me.description || 'Недійсний токен Telegram' });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Помилка підключення до Telegram API' });
  }
});

// 4. Toggle Polling (Start/Stop)
app.post('/api/bot/toggle-polling', async (req: Request, res: Response) => {
  const { start } = req.body;
  if (start) {
    if (!botConfig.telegramBotToken) {
      return res.status(400).json({ error: 'Спочатку введіть Telegram Bot Token' });
    }
    await startTelegramPolling();
  } else {
    stopTelegramPolling();
  }
  res.json({ success: true, isPollingActive: isPollingRunning });
});

// 5. Users / Whitelist Management
app.get('/api/users', (req: Request, res: Response) => {
  res.json(usersList);
});

app.post('/api/users', (req: Request, res: Response) => {
  const { id, username, firstName, lastName, role, note, status } = req.body;
  if (!id) {
    return res.status(400).json({ error: 'Вкажіть Telegram User ID' });
  }

  const existingIdx = usersList.findIndex((u) => u.id === String(id));
  const userObj: WhitelistUser = {
    id: String(id),
    username: username ? username.replace('@', '') : undefined,
    firstName: firstName || 'Користувач',
    lastName: lastName || '',
    role: role || 'student',
    status: status || 'approved',
    addedAt: new Date().toISOString(),
    solvedCount: 0,
    note: note || '',
  };

  if (existingIdx >= 0) {
    usersList[existingIdx] = { ...usersList[existingIdx], ...userObj };
  } else {
    usersList.unshift(userObj);
  }

  saveData(USERS_FILE, usersList);
  res.json({ success: true, users: usersList });
});

app.post('/api/users/:id/action', (req: Request, res: Response) => {
  const { id } = req.params;
  const { action, role, note } = req.body; // action: 'approve' | 'block' | 'delete' | 'update'

  const userIdx = usersList.findIndex((u) => u.id === id);
  if (userIdx === -1) {
    return res.status(404).json({ error: 'Користувача не знайдено' });
  }

  if (action === 'delete') {
    usersList.splice(userIdx, 1);
  } else if (action === 'approve') {
    usersList[userIdx].status = 'approved';
  } else if (action === 'block') {
    usersList[userIdx].status = 'blocked';
  } else if (action === 'update') {
    if (role) usersList[userIdx].role = role;
    if (note !== undefined) usersList[userIdx].note = note;
  }

  saveData(USERS_FILE, usersList);
  res.json({ success: true, users: usersList });
});

// 6. Knowledge Base Management
app.get('/api/knowledge', (req: Request, res: Response) => {
  res.json(knowledgeDocs);
});

app.post('/api/knowledge', async (req: Request, res: Response) => {
  const { title, subject, extractedText, filename, fileSize, imageBase64 } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Вкажіть назву навчального матеріалу' });
  }

  let finalContent = extractedText || '';

  // If user uploaded an image of a book or notebook page with no text, we can use Gemini OCR!
  if (!finalContent && imageBase64) {
    try {
      const ai = getGeminiClient();
      const mimeMatch = imageBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const cleanBase64 = imageBase64.replace(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/, '');

      const ocrRes = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [
            { inlineData: { mimeType, data: cleanBase64 } },
            {
              text: 'Зроби точне OCR розпізнавання тексту, формул, таблиць та правил з цієї сторінки підручника/конспекту. Перепиши все максимально детально та структуровано українською мовою для бази знань.',
            },
          ],
        },
      });
      finalContent = ocrRes.text || 'Текст розпізнано частково.';
    } catch (ocrErr: any) {
      console.error('OCR failed:', ocrErr);
      finalContent = 'Помилка OCR розпізнавання. Будь ласка, введіть або відредагуйте текст вручну.';
    }
  }

  const newDoc: KnowledgeDocument = {
    id: `doc-${Date.now()}`,
    title,
    subject: subject || 'Загальні',
    filename: filename || `${title.replace(/\s+/g, '_')}.txt`,
    fileSize: fileSize || Buffer.byteLength(finalContent, 'utf-8'),
    extractedText: finalContent,
    uploadedAt: new Date().toISOString(),
    isActive: true,
  };

  knowledgeDocs.unshift(newDoc);
  saveData(KNOWLEDGE_FILE, knowledgeDocs);
  res.json({ success: true, doc: newDoc, total: knowledgeDocs.length });
});

app.patch('/api/knowledge/:id/toggle', (req: Request, res: Response) => {
  const { id } = req.params;
  const doc = knowledgeDocs.find((d) => d.id === id);
  if (!doc) return res.status(404).json({ error: 'Документ не знайдено' });

  doc.isActive = !doc.isActive;
  saveData(KNOWLEDGE_FILE, knowledgeDocs);
  res.json({ success: true, doc });
});

app.delete('/api/knowledge/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  knowledgeDocs = knowledgeDocs.filter((d) => d.id !== id);
  saveData(KNOWLEDGE_FILE, knowledgeDocs);
  res.json({ success: true, total: knowledgeDocs.length });
});

// 7. Solve Problem Endpoint (used by Web Test Lab / Playground)
app.post('/api/solve', async (req: Request, res: Response) => {
  try {
    const result = await solveProblem(req.body);

    logsList.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: req.body.userId || 'admin_web',
      username: 'web_admin_test',
      firstName: 'Адмін (Веб)',
      type: req.body.imageBase64 ? 'photo' : 'text',
      query: req.body.query || '[Фотографія завдання]',
      responsePreview: result.solution.slice(0, 150) + '...',
      status: 'success',
      executionTimeMs: result.executionTimeMs,
    });
    saveData(LOGS_FILE, logsList.slice(0, 500));

    res.json(result);
  } catch (err: any) {
    console.error('Solve error:', err);
    res.status(500).json({ error: err.message || 'Помилка генерації розв\'язку' });
  }
});

// 8. Telegram Chat Simulator Endpoint
app.post('/api/simulate-chat', async (req: Request, res: Response) => {
  const { userId, username, firstName, text, imageBase64 } = req.body;
  const senderId = userId || '999888777';
  const senderUsername = username || 'simulator_user';
  const senderFirstName = firstName || 'Тестовий Учень';

  const simUser = {
    id: senderId,
    username: senderUsername,
    first_name: senderFirstName,
  };

  // Check /passcode
  if (text && (text.startsWith('/passcode') || text.startsWith('/code'))) {
    const code = text.split(' ')[1]?.trim();
    if (code && code.toLowerCase() === botConfig.secretPasscode.toLowerCase()) {
      let existing = usersList.find((u) => u.id === String(senderId));
      if (!existing) {
        existing = {
          id: String(senderId),
          username: senderUsername,
          firstName: senderFirstName,
          role: 'student',
          status: 'approved',
          addedAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString(),
          solvedCount: 0,
          note: 'Авторизовано через симулятор коду',
        };
        usersList.push(existing);
      } else {
        existing.status = 'approved';
      }
      saveData(USERS_FILE, usersList);
      return res.json({
        reply: `🎉 **Успішно! Доступ надано!**\n\nВи ввели правильний секретний код \`${code}\`. Ваш акаунт тепер у списку дозволених! Спробуйте надіслати задачу або фото.`,
        authorized: true,
      });
    } else {
      return res.json({
        reply: `❌ **Невірний секретний код.**\nСпробуйте ще раз або зверніться до адміністратора.`,
        authorized: false,
      });
    }
  }

  // Check access
  const auth = checkUserAccess(simUser);
  if (!auth.allowed) {
    const msg = `🔒 **Доступ обмежено!**\n\nПривіт, ${senderFirstName}! Цей бот закритий для сторонніх.\nВаш ID: \`${senderId}\`\nЗапит додано в панель керування.\n\nВведіть секретний код: \`/passcode ${botConfig.secretPasscode}\``;
    return res.json({
      reply: msg,
      authorized: false,
    });
  }

  // Handle standard commands
  if (text === '/start') {
    return res.json({
      reply: `👋 **Вітаю, ${senderFirstName}!**\n\nЯ твій навчальний бот для контрольних, тестів і завдань.\nНадішли фотографію або текст запитання!`,
      authorized: true,
    });
  }

  if (text === '/books') {
    const active = knowledgeDocs.filter((d) => d.isActive);
    let msg = `📚 **Активні підручники в базі (${active.length}):**\n\n`;
    active.forEach((d, i) => {
      msg += `${i + 1}. **${d.title}** (${d.subject})\n`;
    });
    return res.json({ reply: msg, authorized: true });
  }

  // Solve problem
  try {
    const result = await solveProblem({
      query: text,
      imageBase64,
      userId: String(senderId),
    });

    if (auth.userRecord) {
      auth.userRecord.solvedCount = (auth.userRecord.solvedCount || 0) + 1;
      saveData(USERS_FILE, usersList);
    }

    res.json({
      reply: result.solution,
      authorized: true,
      usedDocs: result.usedDocs,
      executionTimeMs: result.executionTimeMs,
    });
  } catch (err: any) {
    res.json({
      reply: `⚠️ Помилка обробки: ${err.message}`,
      authorized: true,
    });
  }
});

// 9. Logs
app.get('/api/logs', (req: Request, res: Response) => {
  res.json(logsList);
});

app.delete('/api/logs', (req: Request, res: Response) => {
  logsList = [];
  saveData(LOGS_FILE, logsList);
  res.json({ success: true });
});

// 10. Standalone Deployment Package Generator
app.get('/api/export/package', (req: Request, res: Response) => {
  // Returns complete standalone source code files so user can deploy easily
  const standaloneFiles = {
    'bot.ts': `import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SECRET_PASSCODE = process.env.SECRET_PASSCODE || '${botConfig.secretPasscode}';
const SYSTEM_PROMPT = \`${botConfig.systemPrompt.replace(/`/g, '\\`')}\`;

if (!TELEGRAM_BOT_TOKEN || !GEMINI_API_KEY) {
  console.error('ERROR: TELEGRAM_BOT_TOKEN and GEMINI_API_KEY must be set in .env');
  process.exit(1);
}

const ai = new GoogleGenAI({
  apiKey: GEMINI_API_KEY,
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
});

const allowedUsers = new Set<string>([${usersList.filter((u) => u.status === 'approved').map((u) => `'${u.id}'`).join(', ')}]);
let lastUpdateId = 0;

async function callTelegram(method: string, body?: any) {
  const res = await fetch(\`https://api.telegram.org/bot\${TELEGRAM_BOT_TOKEN}/\${method}\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

async function solveWithGemini(query: string, imageBase64?: string) {
  const parts: any[] = [];
  if (imageBase64) {
    parts.push({
      inlineData: { mimeType: 'image/jpeg', data: imageBase64 }
    });
  }
  parts.push({
    text: \`\${SYSTEM_PROMPT}\\n\\nЗАВДАННЯ ВІД КОРИСТУВАЧА:\\n\${query}\`
  });

  const response = await ai.models.generateContent({
    model: '${botConfig.geminiModel}',
    contents: { parts }
  });
  return response.text || 'Не вдалося розв\\'язати завдання.';
}

async function handleMessage(message: any) {
  const user = message.from;
  const chatId = message.chat.id;
  const text = (message.text || message.caption || '').trim();
  const userId = String(user.id);

  if (text.startsWith('/passcode')) {
    const code = text.split(' ')[1]?.trim();
    if (code === SECRET_PASSCODE) {
      allowedUsers.add(userId);
      await callTelegram('sendMessage', {
        chat_id: chatId,
        text: '🎉 Успішно! Доступ надано. Надсилайте фото контрольних або текст задач!',
      });
      return;
    }
  }

  if (!allowedUsers.has(userId)) {
    await callTelegram('sendMessage', {
      chat_id: chatId,
      text: \`🔒 Доступ обмежено! Ваш ID: \${userId}. Введіть: /passcode \${SECRET_PASSCODE}\`,
    });
    return;
  }

  if (text === '/start') {
    await callTelegram('sendMessage', {
      chat_id: chatId,
      text: \`👋 Вітаю, \${user.first_name}! Надішліть фотографію або текст контрольної / тесту.\`,
    });
    return;
  }

  await callTelegram('sendChatAction', { chat_id: chatId, action: 'typing' });

  let imageB64: string | undefined;
  if (message.photo && message.photo.length > 0) {
    const photo = message.photo[message.photo.length - 1];
    const fileRes = await callTelegram('getFile', { file_id: photo.file_id });
    if (fileRes.ok && fileRes.result?.file_path) {
      const imgRes = await fetch(\`https://api.telegram.org/file/bot\${TELEGRAM_BOT_TOKEN}/\${fileRes.result.file_path}\`);
      const buf = await imgRes.arrayBuffer();
      imageB64 = Buffer.from(buf).toString('base64');
    }
  }

  try {
    const answer = await solveWithGemini(text, imageB64);
    await callTelegram('sendMessage', {
      chat_id: chatId,
      text: answer,
      parse_mode: 'Markdown'
    }).catch(async () => {
      await callTelegram('sendMessage', { chat_id: chatId, text: answer });
    });
  } catch (err: any) {
    await callTelegram('sendMessage', {
      chat_id: chatId,
      text: \`⚠️ Помилка: \${err.message}\`,
    });
  }
}

async function poll() {
  try {
    const res = await callTelegram('getUpdates', { offset: lastUpdateId + 1, timeout: 25 });
    if (res.ok && Array.isArray(res.result)) {
      for (const update of res.result) {
        lastUpdateId = Math.max(lastUpdateId, update.update_id);
        if (update.message) await handleMessage(update.message);
      }
    }
  } catch (e) {
    console.error('Polling error:', e);
  }
  setTimeout(poll, 1000);
}

console.log('🤖 Telegram bot is running...');
poll();
`,
    'package.json': JSON.stringify(
      {
        name: 'edubot-study-solver',
        version: '1.0.0',
        type: 'module',
        scripts: {
          start: 'tsx bot.ts',
        },
        dependencies: {
          '@google/genai': '^2.4.0',
          dotenv: '^17.2.3',
          tsx: '^4.21.0',
          typescript: '^5.0.0',
        },
      },
      null,
      2
    ),
    '.env.example': `TELEGRAM_BOT_TOKEN="${botConfig.telegramBotToken || 'YOUR_BOT_TOKEN_FROM_BOTFATHER'}"
GEMINI_API_KEY="${botConfig.geminiApiKeyOverride || 'YOUR_GEMINI_API_KEY'}"
SECRET_PASSCODE="${botConfig.secretPasscode}"
`,
    'Dockerfile': `FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "start"]
`,
    'docker-compose.yml': `version: '3.8'
services:
  telegram-bot:
    build: .
    restart: always
    env_file:
      - .env
`,
    'README.md': `# 🎓 EduBot Control & Study Solver Telegram Bot

Повнофункціональний Telegram бот для автоматичного розв'язання тестів, контрольних та самостійних робіт з Gemini AI та системою облікових записів.

## 🚀 Швидкий запуск на хостингу / VPS

1. Створіть файл \`.env\` на основі \`.env.example\` та вставте ваші токени:
   - \`TELEGRAM_BOT_TOKEN\` — отримайте у [@BotFather](https://t.me/BotFather)
   - \`GEMINI_API_KEY\` — отримайте у [Google AI Studio](https://aistudio.google.com/)
   - \`SECRET_PASSCODE\` — пароль для швидкої авторизації у боті

2. Запуск через Node.js / Docker:
   \`\`\`bash
   npm install
   npm start
   \`\`\`
   Або через Docker Compose:
   \`\`\`bash
   docker compose up -d --build
   \`\`\`

3. Розгортання на Railway / Render:
   - Завантажте цей репозиторій на GitHub.
   - Створіть новий проект у Railway або Render.
   - Додайте змінні середовища з \`.env\` в панелі хостингу.
`,
  };

  res.json({ files: standaloneFiles });
});

// Serve frontend with Vite in dev, static in production
const PORT = process.env.PORT || 3000;

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`🚀 EduBot Server running on http://localhost:${PORT}`);
  });
}

startServer();
