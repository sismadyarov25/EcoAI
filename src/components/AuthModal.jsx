import { X, Leaf, User, Mail, Lock } from 'lucide-react';

export default function AuthModal({
  isOpen,
  onClose,
  authMode,
  setAuthMode,
  authEmail,
  setAuthEmail,
  authPassword,
  setAuthPassword,
  authName,
  setAuthName,
  authError,
  onSubmit,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <Leaf className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-black text-slate-900">
            {authMode === 'login' ? 'Вход в EcoAi' : 'Регистрация в EcoAi'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {authMode === 'login' ? 'Войдите для сохранения истории расчетов' : 'Создайте аккаунт для эко-мониторинга'}
          </p>
        </div>

        {/* Auth Mode Toggle Tabs */}
        <div className="bg-slate-100 p-1 rounded-2xl flex items-center text-xs font-bold">
          <button
            type="button"
            onClick={() => setAuthMode('login')}
            className={`w-full py-2.5 rounded-xl transition-all cursor-pointer ${
              authMode === 'login' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Вход
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('register')}
            className={`w-full py-2.5 rounded-xl transition-all cursor-pointer ${
              authMode === 'register' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Регистрация
          </button>
        </div>

        {authError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {authError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-4">
          {authMode === 'register' && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Ваше имя</label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 absolute left-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Алихан"
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  required
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600">Email</label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 absolute left-3 text-slate-400" />
              <input
                type="email"
                placeholder="example@ecoai.kz"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                required
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600">Пароль</label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 absolute left-3 text-slate-400" />
              <input
                type="password"
                placeholder="••••••••"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                required
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer mt-2"
          >
            {authMode === 'login' ? 'Войти в аккаунт' : 'Зарегистрироваться'}
          </button>
        </form>

      </div>
    </div>
  );
}
