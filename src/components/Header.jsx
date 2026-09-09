import { Leaf, LogIn, UserPlus, User, X, Sparkles } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function Header({
  userLoggedIn,
  userName,
  onLogout,
  onLogin,
  onRegister,
  scrollToSection,
  audienceRef,
  featuresRef,
  howItWorksRef,
  calculatorRef,
  onShowContact,
}) {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-emerald-100/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between gap-6">
        
        {/* Logo */}
        <Link 
          to="/"
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-100/90 border border-emerald-300/60 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
            <Leaf className="w-5.5 h-5.5 fill-emerald-500/20 text-emerald-600" />
          </div>
          <span className="text-2xl font-black tracking-tight text-[#16A34A]">
            EcoAi
          </span>
        </Link>

        {/* Center Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-sm font-medium text-slate-600">
          <Link
            to="/consultant"
            className="flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 font-bold transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            AI Консультант
          </Link>

          <button 
            type="button"
            onClick={() => scrollToSection && scrollToSection(audienceRef)}
            className="hover:text-[#16A34A] transition-colors cursor-pointer"
          >
            Для кого
          </button>

          <button 
            type="button"
            onClick={() => scrollToSection && scrollToSection(featuresRef)}
            className="hover:text-[#16A34A] transition-colors cursor-pointer"
          >
            Возможности
          </button>

          <button 
            type="button"
            onClick={() => scrollToSection && scrollToSection(howItWorksRef)}
            className="hover:text-[#16A34A] transition-colors cursor-pointer"
          >
            Как это работает
          </button>

          <button 
            type="button"
            onClick={() => scrollToSection && scrollToSection(calculatorRef)}
            className="hover:text-[#16A34A] transition-colors cursor-pointer"
          >
            Калькулятор
          </button>

          <button 
            type="button"
            onClick={() => onShowContact && onShowContact()}
            className="hover:text-[#16A34A] transition-colors cursor-pointer"
          >
            Контакты
          </button>
        </nav>

        {/* Action Header Buttons & Auth */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {userLoggedIn ? (
            <div className="flex items-center gap-2">
              <Link 
                to="/profile"
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold hover:bg-emerald-100 transition-colors"
              >
                <User className="w-4 h-4 text-emerald-600" />
                <span>{userName || 'Пользователь'}</span>
              </Link>
              <button
                type="button"
                onClick={onLogout}
                className="text-xs text-slate-400 hover:text-red-500 cursor-pointer"
              >
                (Выйти)
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={onLogin}
                className="px-4 py-2 rounded-full text-xs sm:text-sm font-semibold text-slate-700 hover:text-emerald-600 hover:bg-emerald-50/60 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Войти</span>
              </button>

              <button
                type="button"
                onClick={onRegister}
                className="px-4 py-2 rounded-full text-xs sm:text-sm font-semibold text-white bg-[#22C55E] hover:bg-[#16A34A] shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Зарегистрироваться</span>
              </button>
            </>
          )}
        </div>

      </div>
    </header>
  );
}
