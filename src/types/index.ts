export interface BotConfig {
  telegramBotToken: string;
  geminiModel: string;
  geminiApiKeyOverride?: string;
  botUsername?: string;
  botFirstName?: string;
  isPollingActive: boolean;
  accessMode: 'whitelist_only' | 'passcode_or_whitelist' | 'open';
  secretPasscode: string;
  systemPrompt: string;
  solutionFormat: 'detailed_steps' | 'exam_ready' | 'concise_test';
  mathNotation: 'latex' | 'plain';
  language: 'uk' | 'en';
}

export interface WhitelistUser {
  id: string; // telegram user id
  username?: string;
  firstName?: string;
  lastName?: string;
  role: 'admin' | 'student';
  status: 'approved' | 'pending' | 'blocked';
  addedAt: string;
  lastActiveAt?: string;
  solvedCount: number;
  note?: string;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  subject: string; // e.g., 'Алгебра', 'Геометрія', 'Фізика', 'Хімія', 'Історія', 'Біологія', 'Інше'
  filename: string;
  fileSize: number;
  extractedText: string;
  uploadedAt: string;
  isActive: boolean;
  previewUrl?: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  userId: string;
  username?: string;
  firstName?: string;
  type: 'text' | 'photo' | 'command' | 'auth_attempt';
  query: string;
  responsePreview?: string;
  status: 'success' | 'denied' | 'error';
  executionTimeMs?: number;
}

export interface SolveRequest {
  query: string;
  imageBase64?: string;
  subject?: string;
  knowledgeDocIds?: string[];
  userId?: string;
}

export interface SolveResult {
  solution: string;
  usedDocs: { id: string; title: string; subject: string }[];
  model: string;
  executionTimeMs: number;
}
