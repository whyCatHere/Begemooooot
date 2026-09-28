import React, { useState, useEffect } from 'react';
import { Github, Download, Copy, Check, Server, Terminal, Cloud, Shield, FileCode, ExternalLink, RefreshCw } from 'lucide-react';
import JSZip from 'jszip';
import { BotConfig } from '../types';

interface DeployExportTabProps {
  config: BotConfig | null;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const DeployExportTab: React.FC<DeployExportTabProps> = ({ config, showToast }) => {
  const [files, setFiles] = useState<Record<string, string>>({});
  const [activeFile, setActiveFile] = useState<string>('bot.ts');
  const [isCopied, setIsCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);

  useEffect(() => {
    fetch('/api/export/package')
      .then((res) => res.json())
      .then((data) => {
        if (data.files) {
          setFiles(data.files);
        }
      })
      .catch((err) => console.error('Failed to load export files:', err))
      .finally(() => setIsLoadingFiles(false));
  }, [config]);

  const handleCopyCode = () => {
    if (!files[activeFile]) return;
    navigator.clipboard.writeText(files[activeFile]);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    showToast(`Файл ${activeFile} скопійовано в буфер обміну!`, 'success');
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      Object.entries(files).forEach(([filename, content]) => {
        zip.file(filename, content);
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'edubot-study-solver.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast('Архів edubot-study-solver.zip успішно завантажено!', 'success');
    } catch (err: any) {
      showToast('Помилка створення ZIP архіву', 'error');
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Github className="w-5 h-5 text-purple-400" />
            <span>Експорт репозиторію та деплой на хостинг</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Завантажте готовий автономний проєкт для публікації на GitHub, запуску в Docker або на хостингах Railway / Render / VPS.
          </p>
        </div>

        <button
          onClick={handleDownloadZip}
          disabled={isZipping || isLoadingFiles}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-lg shadow-purple-600/30 self-start sm:self-auto"
        >
          {isZipping ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Пакування ZIP...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Завантажити повний ZIP архів</span>
            </>
          )}
        </button>
      </div>

      {/* Hosting Deployment Steps Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Option 1: GitHub */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3">
              <Github className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white text-sm">1. Завантаження на GitHub</h3>
            <p className="text-xs text-slate-400 mt-1">
              Розпакуйте завантажений ZIP архів, відкрийте термінал у папці та запустіть:
            </p>
            <div className="mt-3 bg-slate-950 p-2.5 rounded-lg font-mono text-[11px] text-purple-300 space-y-1">
              <div>git init</div>
              <div>git add .</div>
              <div>git commit -m "Initial EduBot"</div>
              <div>git push origin main</div>
            </div>
          </div>
        </div>

        {/* Option 2: Railway / Render */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3">
              <Cloud className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white text-sm">2. Хмарний хостинг (Railway / Render)</h3>
            <p className="text-xs text-slate-400 mt-1">
              Підключіть ваш репозиторій з GitHub у 2 кліки та додайте змінні оточення (Environment Variables):
            </p>
            <div className="mt-3 bg-slate-950 p-2.5 rounded-lg font-mono text-[10px] text-blue-300 space-y-1">
              <div>TELEGRAM_BOT_TOKEN=...</div>
              <div>GEMINI_API_KEY=...</div>
              <div>SECRET_PASSCODE={config?.secretPasscode || 'STUDY2026'}</div>
            </div>
          </div>
        </div>

        {/* Option 3: Docker / VPS */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
              <Server className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white text-sm">3. Власний сервер або VPS (Docker)</h3>
            <p className="text-xs text-slate-400 mt-1">
              Готовий <code>Dockerfile</code> та <code>docker-compose.yml</code> для роботи 24/7 без зупинок:
            </p>
            <div className="mt-3 bg-slate-950 p-2.5 rounded-lg font-mono text-[11px] text-emerald-300 space-y-1">
              <div>docker compose up -d --build</div>
              <div className="text-slate-500"># Бот працює у фоні</div>
            </div>
          </div>
        </div>
      </div>

      {/* Code Inspector */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {/* File Tabs */}
        <div className="bg-slate-950/80 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            {Object.keys(files).map((fileName) => (
              <button
                key={fileName}
                onClick={() => setActiveFile(fileName)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                  activeFile === fileName
                    ? 'bg-slate-800 text-purple-300 font-semibold border border-purple-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>{fileName}</span>
              </button>
            ))}
          </div>

          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{isCopied ? 'Скопійовано' : 'Копіювати код'}</span>
          </button>
        </div>

        {/* Code Content */}
        <div className="p-4 bg-slate-950 overflow-x-auto max-h-[460px]">
          <pre className="font-mono text-xs text-slate-300 leading-relaxed whitespace-pre">
            {files[activeFile] || 'Завантаження файлу...'}
          </pre>
        </div>
      </div>
    </div>
  );
};
