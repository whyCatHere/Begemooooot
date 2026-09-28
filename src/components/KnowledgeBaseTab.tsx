import React, { useState, useRef } from 'react';
import { BookOpen, Upload, FileText, Image as ImageIcon, Trash2, CheckCircle2, Eye, Plus, Sparkles, Filter, RefreshCw } from 'lucide-react';
import { KnowledgeDocument } from '../types';

interface KnowledgeBaseTabProps {
  documents: KnowledgeDocument[];
  onUploadDoc: (data: {
    title: string;
    subject: string;
    extractedText?: string;
    imageBase64?: string;
    filename?: string;
    fileSize?: number;
  }) => Promise<void>;
  onToggleDoc: (id: string) => Promise<void>;
  onDeleteDoc: (id: string) => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const KnowledgeBaseTab: React.FC<KnowledgeBaseTabProps> = ({
  documents,
  onUploadDoc,
  onToggleDoc,
  onDeleteDoc,
  showToast,
}) => {
  const [activeSubject, setActiveSubject] = useState<string>('Всі');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [viewDoc, setViewDoc] = useState<KnowledgeDocument | null>(null);

  // Upload Form State
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Алгебра');
  const [manualText, setManualText] = useState('');
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const subjects = ['Всі', 'Алгебра', 'Геометрія', 'Фізика', 'Хімія', 'Історія', 'Біологія', 'Загальні'];

  const filteredDocs = documents.filter((doc) => {
    if (activeSubject === 'Всі') return true;
    return doc.subject === activeSubject;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setFileSize(file.size);
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '));
    }

    const reader = new FileReader();

    if (file.type.startsWith('image/')) {
      reader.onload = () => {
        setFileBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      // Text file
      reader.onload = () => {
        setManualText(reader.result as string);
        setFileBase64(null);
      };
      reader.readAsText(file);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Введіть назву навчального матеріалу', 'error');
      return;
    }
    if (!manualText.trim() && !fileBase64) {
      showToast('Додайте текст конспекту або завантажте файл/фото', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      await onUploadDoc({
        title: title.trim(),
        subject,
        extractedText: manualText.trim(),
        imageBase64: fileBase64 || undefined,
        filename: fileName || `${title.trim()}.txt`,
        fileSize,
      });

      showToast('Матеріал успішно додано до бази знань!', 'success');
      setShowUploadModal(false);
      setTitle('');
      setManualText('');
      setFileBase64(null);
      setFileName('');
    } catch (err: any) {
      showToast(err.message || 'Помилка завантаження', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <span>База Підручників, Конспектів та Зошитів</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Завантажуйте книжки, формули, правила та фото сторінок зошитів. Бот використовуватиме їх для точного розв'язання.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-md shadow-blue-600/20 self-start sm:self-auto"
        >
          <Upload className="w-4 h-4" />
          <span>Завантажити книгу / конспект</span>
        </button>
      </div>

      {/* Subject Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        <Filter className="w-4 h-4 text-slate-500 mr-1 shrink-0" />
        {subjects.map((sub) => (
          <button
            key={sub}
            onClick={() => setActiveSubject(sub)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeSubject === sub
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
            }`}
          >
            {sub}
          </button>
        ))}
      </div>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.map((doc) => (
          <div
            key={doc.id}
            className={`bg-slate-900 border rounded-xl p-4 flex flex-col justify-between transition-all ${
              doc.isActive
                ? 'border-indigo-500/40 shadow-sm shadow-indigo-500/10'
                : 'border-slate-800 opacity-60'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {doc.subject}
                </span>

                <button
                  onClick={() => onToggleDoc(doc.id)}
                  title={doc.isActive ? 'Вимкнути з контексту' : 'Увімкнути для розв\'язків'}
                  className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${
                    doc.isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {doc.isActive ? '● Активний' : '○ Вимкнено'}
                </button>
              </div>

              <h3 className="font-bold text-white text-sm mt-2 line-clamp-2">{doc.title}</h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-3 font-mono bg-slate-950/60 p-2 rounded">
                {doc.extractedText || 'Текст розпізнається...'}
              </p>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>{Math.round((doc.fileSize || 1000) / 1024)} KB</span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setViewDoc(doc)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                  title="Переглянути вміст"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Видалити «${doc.title}» з бази знань?`)) {
                      onDeleteDoc(doc.id);
                      showToast('Матеріал видалено', 'success');
                    }
                  }}
                  className="p-1.5 rounded-lg hover:bg-rose-950/40 text-slate-400 hover:text-rose-400"
                  title="Видалити"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredDocs.length === 0 && (
          <div className="col-span-full py-12 text-center bg-slate-900/40 border border-slate-800 rounded-xl">
            <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400 text-sm font-medium">
              Немає матеріалів у категорії «{activeSubject}»
            </p>
            <p className="text-slate-500 text-xs mt-1">
              Натисніть «Завантажити книгу / конспект», щоб додати навчальні файли.
            </p>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-400" />
                <span>Додати навчальний матеріал або підручник</span>
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Назва матеріалу <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="наприклад: Підручник з геометрії 11 клас (Мерзляк)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Предмет</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="Алгебра">Алгебра</option>
                    <option value="Геометрія">Геометрія</option>
                    <option value="Фізика">Фізика</option>
                    <option value="Хімія">Хімія</option>
                    <option value="Історія">Історія України</option>
                    <option value="Біологія">Біологія</option>
                    <option value="Загальні">Загальні матеріали</option>
                  </select>
                </div>
              </div>

              {/* File Dropzone */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Завантажити файл або фото сторінки (TXT, MD, JPG, PNG)
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-blue-500/80 bg-slate-950/60 rounded-xl p-4 text-center cursor-pointer transition-colors"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.md,.json,.pdf,.jpg,.jpeg,.png,.webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {fileBase64 ? (
                    <div className="flex items-center justify-center gap-3">
                      <img
                        src={fileBase64}
                        alt="Preview"
                        className="w-16 h-16 object-cover rounded-lg border border-slate-700"
                      />
                      <div className="text-left">
                        <div className="text-white font-medium">{fileName}</div>
                        <div className="text-indigo-400 text-[11px] flex items-center gap-1 mt-0.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Gemini автоматично виконає OCR розпізнавання тексту та формул</span>
                        </div>
                      </div>
                    </div>
                  ) : fileName ? (
                    <div className="flex items-center justify-center gap-2 text-slate-200">
                      <FileText className="w-5 h-5 text-blue-400" />
                      <span>{fileName}</span>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-6 h-6 text-slate-500 mx-auto mb-1" />
                      <span className="text-slate-300 font-medium">
                        Натисніть для вибору файлу підручника або фото конспекту
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Підтримуються текстові документи та фотографії рукописних зошитів
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Manual text / excerpt */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Вміст або витяг формул/правил (текст для контексту)
                </label>
                <textarea
                  rows={6}
                  placeholder="Вставте сюди формули, теореми, дати або правила з книги..."
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md shadow-blue-600/30"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Обробка OCR...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Зберегти в базу знань</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {viewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[11px] font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  {viewDoc.subject}
                </span>
                <h3 className="font-bold text-white text-base mt-1">{viewDoc.title}</h3>
              </div>
              <button
                onClick={() => setViewDoc(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto my-4 bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
              {viewDoc.extractedText}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setViewDoc(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
              >
                Закрити
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
