import React, { useState } from 'react';
import { Shield, ShieldAlert, UserCheck, UserX, UserPlus, Key, Check, Copy, RefreshCw, Trash2, ShieldCheck, Lock } from 'lucide-react';
import { BotConfig, WhitelistUser } from '../types';

interface AccessControlTabProps {
  config: BotConfig | null;
  users: WhitelistUser[];
  onUpdateConfig: (updates: Partial<BotConfig>) => Promise<void>;
  onAddUser: (user: Partial<WhitelistUser>) => Promise<void>;
  onUserAction: (userId: string, action: 'approve' | 'block' | 'delete' | 'update', data?: any) => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const AccessControlTab: React.FC<AccessControlTabProps> = ({
  config,
  users,
  onUpdateConfig,
  onAddUser,
  onUserAction,
  showToast,
}) => {
  const [accessMode, setAccessMode] = useState<BotConfig['accessMode']>(
    config?.accessMode || 'passcode_or_whitelist'
  );
  const [passcode, setPasscode] = useState(config?.secretPasscode || 'STUDY2026');
  const [isCopied, setIsCopied] = useState(false);

  // Manual user modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUserId, setNewUserId] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'student'>('student');
  const [newNote, setNewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'blocked'>('all');

  const pendingUsers = users.filter((u) => u.status === 'pending');
  const approvedUsers = users.filter((u) => u.status === 'approved');

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.firstName?.toLowerCase() || '').includes(searchFilter.toLowerCase()) ||
      (u.username?.toLowerCase() || '').includes(searchFilter.toLowerCase()) ||
      u.id.includes(searchFilter) ||
      (u.note?.toLowerCase() || '').includes(searchFilter.toLowerCase());

    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSaveSecurity = async () => {
    try {
      await onUpdateConfig({
        accessMode,
        secretPasscode: passcode.trim(),
      });
      showToast('Налаштування безпеки успішно оновлено!', 'success');
    } catch (e: any) {
      showToast(e.message || 'Помилка збереження', 'error');
    }
  };

  const handleGeneratePasscode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'EXAM-';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPasscode(code);
  };

  const handleCopyPasscode = () => {
    navigator.clipboard.writeText(passcode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    showToast('Секретний пароль скопійовано!', 'success');
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserId.trim()) {
      showToast('Вкажіть Telegram ID користувача', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddUser({
        id: newUserId.trim(),
        username: newUsername.trim(),
        firstName: newFirstName.trim() || 'Користувач',
        role: newRole,
        status: 'approved',
        note: newNote.trim(),
      });
      showToast('Користувача додано до Whitelist!', 'success');
      setShowAddModal(false);
      setNewUserId('');
      setNewUsername('');
      setNewFirstName('');
      setNewNote('');
    } catch (err: any) {
      showToast(err.message || 'Помилка додавання', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            <span>Система облікових записів та Whitelist</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Керуйте доступом до бота. Сторонні користувачі не зможуть надсилати завдання без вашого дозволу.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-md shadow-blue-600/20 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Додати користувача вручну</span>
        </button>
      </div>

      {/* Security Policies Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-400" />
          <span>Політика авторизації та входу</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Mode 1 */}
          <div
            onClick={() => setAccessMode('passcode_or_whitelist')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              accessMode === 'passcode_or_whitelist'
                ? 'bg-blue-600/10 border-blue-500 text-white ring-1 ring-blue-500'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm">Секретний Код + Whitelist</span>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  accessMode === 'passcode_or_whitelist'
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-slate-600'
                }`}
              >
                {accessMode === 'passcode_or_whitelist' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
              </div>
            </div>
            <p className="text-xs text-slate-400">
              <strong>Рекомендовано:</strong> авторизація за секретним кодом <code>/passcode КОД</code> або ручним схваленням.
            </p>
          </div>

          {/* Mode 2 */}
          <div
            onClick={() => setAccessMode('whitelist_only')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              accessMode === 'whitelist_only'
                ? 'bg-blue-600/10 border-blue-500 text-white ring-1 ring-blue-500'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm">Суворий Whitelist</span>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  accessMode === 'whitelist_only'
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-slate-600'
                }`}
              >
                {accessMode === 'whitelist_only' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
              </div>
            </div>
            <p className="text-xs text-slate-400">
              Тільки користувачі, які особисто схвалені вами в цій адмін-панелі. Коди не приймаються.
            </p>
          </div>

          {/* Mode 3 */}
          <div
            onClick={() => setAccessMode('open')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              accessMode === 'open'
                ? 'bg-amber-600/10 border-amber-500 text-white ring-1 ring-amber-500'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm">Відкритий доступ (Тест)</span>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  accessMode === 'open'
                    ? 'border-amber-500 bg-amber-500'
                    : 'border-slate-600'
                }`}
              >
                {accessMode === 'open' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
              </div>
            </div>
            <p className="text-xs text-slate-400">
              Будь-хто, хто напише боту, автоматично отримує доступ без перевірки.
            </p>
          </div>
        </div>

        {/* Secret Passcode Editor */}
        {accessMode === 'passcode_or_whitelist' && (
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>Секретний пароль для самостійної активації у Telegram</span>
              </label>
              <p className="text-xs text-slate-400">
                Користувач надсилає боту повідомлення:{' '}
                <code className="text-amber-300 bg-slate-900 px-1.5 py-0.5 rounded font-mono">
                  /passcode {passcode}
                </code>{' '}
                і одразу отримує доступ.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white font-mono w-36 text-center tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleGeneratePasscode}
                title="Згенерувати новий пароль"
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleCopyPasscode}
                title="Скопіювати команду"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-medium"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'Скопійовано' : 'Копіювати'}</span>
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSaveSecurity}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs sm:text-sm transition-all shadow-md shadow-blue-600/20"
          >
            Зберегти режим безпеки
          </button>
        </div>
      </div>

      {/* Pending Requests Queue (if any) */}
      {pendingUsers.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white text-sm flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Запити на схвалення доступу ({pendingUsers.length})</span>
            </h3>
            <span className="text-xs text-amber-300">Очікують вашого рішення</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingUsers.map((u) => (
              <div
                key={u.id}
                className="bg-slate-900 border border-slate-700/80 rounded-xl p-3.5 flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">
                      {u.firstName || 'Анонім'} {u.lastName || ''}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                      Очікує
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {u.username ? `@${u.username}` : 'Без юзернейму'} • ID: <code>{u.id}</code>
                  </div>
                  {u.note && <div className="text-[11px] text-slate-400 italic mt-1">{u.note}</div>}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => {
                      onUserAction(u.id, 'approve');
                      showToast(`Доступ для ${u.firstName} схвалено!`, 'success');
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Схвалити</span>
                  </button>
                  <button
                    onClick={() => {
                      onUserAction(u.id, 'block');
                      showToast(`Користувача ${u.firstName} заблоковано!`, 'error');
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-rose-900/40 hover:bg-rose-900/70 text-rose-300 border border-rose-800/40 font-medium text-xs transition-colors"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    <span>Відхилити</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Whitelist Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {/* Table Filters */}
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white text-sm">Список дозволених акаунтів</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {filteredUsers.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="Пошук за ID, ім'ям або @юзернеймом..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 w-full sm:w-56"
            />

            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value="all">Всі статуси</option>
              <option value="approved">Схвалені</option>
              <option value="pending">В черзі</option>
              <option value="blocked">Заблоковані</option>
            </select>
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Користувач / Telegram</th>
                <th className="px-4 py-3">Telegram ID</th>
                <th className="px-4 py-3">Роль</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3">Розв'язано завдань</th>
                <th className="px-4 py-3 text-right">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-white">
                      {u.firstName || 'Користувач'} {u.lastName || ''}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {u.username ? `@${u.username}` : 'Юзернейм не вказано'}
                    </div>
                  </td>

                  <td className="px-4 py-3 font-mono text-slate-300">{u.id}</td>

                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        u.role === 'admin'
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}
                    >
                      {u.role === 'admin' ? 'Адміністратор' : 'Учень'}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                        u.status === 'approved'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : u.status === 'pending'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {u.status === 'approved' && '✓ Дозволено'}
                      {u.status === 'pending' && '⏳ Очікує'}
                      {u.status === 'blocked' && '✕ Заблоковано'}
                    </span>
                  </td>

                  <td className="px-4 py-3 font-medium text-slate-200">
                    {u.solvedCount || 0}
                  </td>

                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {u.status !== 'approved' && (
                        <button
                          onClick={() => {
                            onUserAction(u.id, 'approve');
                            showToast('Користувача схвалено', 'success');
                          }}
                          className="px-2 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[11px]"
                          title="Схвалити доступ"
                        >
                          Схвалити
                        </button>
                      )}

                      {u.status !== 'blocked' ? (
                        <button
                          onClick={() => {
                            onUserAction(u.id, 'block');
                            showToast('Користувача заблоковано', 'error');
                          }}
                          className="px-2 py-1 rounded bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-[11px]"
                          title="Заблокувати"
                        >
                          Блок
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            onUserAction(u.id, 'approve');
                            showToast('Розблоковано', 'success');
                          }}
                          className="px-2 py-1 rounded bg-emerald-600/20 text-emerald-300 text-[11px]"
                        >
                          Розблок
                        </button>
                      )}

                      <button
                        onClick={() => {
                          if (confirm(`Видалити ${u.firstName || u.id} зі списку?`)) {
                            onUserAction(u.id, 'delete');
                            showToast('Користувача видалено', 'success');
                          }
                        }}
                        className="p-1 rounded hover:bg-rose-900/30 text-slate-400 hover:text-rose-400"
                        title="Видалити назавжди"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    Користувачів за такими параметрами не знайдено.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-400" />
                <span>Додати користувача до Whitelist</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Telegram User ID <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="наприклад: 987654321"
                  value={newUserId}
                  onChange={(e) => setNewUserId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Користувач може дізнатися свій ID, надіславши боту /start (або через бот @userinfobot).
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Telegram Username (опціонально)
                </label>
                <div className="flex items-center bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white">
                  <span className="text-slate-500 mr-1">@</span>
                  <input
                    type="text"
                    placeholder="my_student"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="bg-transparent focus:outline-none w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Ім'я та Прізвище</label>
                <input
                  type="text"
                  placeholder="Олександр Петренко"
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Роль користувача</label>
                <select
                  value={newRole}
                  onChange={(e: any) => setNewRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none"
                >
                  <option value="student">Учень / Студент (Доступ до розв'язання)</option>
                  <option value="admin">Адміністратор (Повний доступ)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Примітка</label>
                <input
                  type="text"
                  placeholder="11-Б клас, підготовка до контрольної"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md shadow-blue-600/30"
                >
                  {isSubmitting ? 'Збереження...' : 'Додати до Whitelist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
