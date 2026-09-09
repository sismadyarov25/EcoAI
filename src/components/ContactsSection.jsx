import { Mail, Send, MessageSquare } from 'lucide-react';

export default function ContactsSection({ contactsRef }) {
  return (
    <section ref={contactsRef} className="max-w-5xl mx-auto px-4 sm:px-6 py-16 scroll-mt-24">
      <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-100">
        
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs font-bold text-[#16A34A] uppercase tracking-wider block mb-1">
            СВЯЗАТЬСЯ С НАМИ
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900">
            Есть вопросы или предложения?
          </h2>
          <p className="text-slate-600 mt-2 text-sm">
            Мы всегда открыты к сотрудничеству с жителями, школами и эко-инициативами
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <a 
            href="mailto:sayan0ismadyarov@gmail.com" 
            className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/40 transition-all flex flex-col items-center text-center group"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Mail className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Email</span>
            <span className="text-sm font-bold text-slate-900 group-hover:text-[#16A34A] transition-colors break-all">
              sayan0ismadyarov@gmail.com
            </span>
          </a>

          <a 
            href="https://t.me/S5ayan99" 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-sky-300 hover:bg-sky-50/40 transition-all flex flex-col items-center text-center group"
          >
            <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Send className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Telegram</span>
            <span className="text-sm font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
              @S5ayan99
            </span>
          </a>

          <a 
            href="https://wa.me/77755135423" 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/40 transition-all flex flex-col items-center text-center group"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">WhatsApp</span>
            <span className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
              +7 775 513 5423
            </span>
          </a>

        </div>

      </div>
    </section>
  );
}
