import { PhoneCall, X, Mail, Send, MessageSquare } from 'lucide-react';

export default function ContactModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <PhoneCall className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-black text-slate-900">
            Контакты EcoAi
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Свяжитесь с командой разработчиков проекта
          </p>
        </div>

        <div className="space-y-3">
          <a 
            href="mailto:sayan0ismadyarov@gmail.com"
            className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3 hover:border-emerald-300 transition-all"
          >
            <Mail className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="text-xs overflow-hidden text-ellipsis">
              <span className="text-slate-400 block font-semibold">Email</span>
              <span className="font-bold text-slate-800">sayan0ismadyarov@gmail.com</span>
            </div>
          </a>

          <a 
            href="https://t.me/S5ayan99"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3 hover:border-sky-300 transition-all"
          >
            <Send className="w-5 h-5 text-sky-500 shrink-0" />
            <div className="text-xs">
              <span className="text-slate-400 block font-semibold">Telegram</span>
              <span className="font-bold text-slate-800">@S5ayan99</span>
            </div>
          </a>

          <a 
            href="https://wa.me/77755135423"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3 hover:border-emerald-300 transition-all"
          >
            <MessageSquare className="w-5 h-5 text-emerald-500 shrink-0" />
            <div className="text-xs">
              <span className="text-slate-400 block font-semibold">WhatsApp</span>
              <span className="font-bold text-slate-800">+7 775 513 5423</span>
            </div>
          </a>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold rounded-xl transition-all cursor-pointer"
        >
          Закрыть
        </button>
      </div>
    </div>
  );
}
