import { Home, GraduationCap, Building2, ArrowRight } from 'lucide-react';

export default function AudienceSelector({ category, setCategory, scrollToSection, calculatorRef, audienceRef }) {
  return (
    <section ref={audienceRef} className="max-w-7xl mx-auto px-4 sm:px-8 py-16 scroll-mt-24">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="text-xs font-bold text-[#16A34A] uppercase tracking-wider block mb-1">
          ДЛЯ КОГО СОЗДАН ECOAI
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
          Решения для любой задачи
        </h2>
        <p className="text-slate-600 mt-3 text-base">
          EcoAi адаптирует свои ИИ-алгоритмы под ваши тарифные ставки и структуру потребления
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        <div 
          onClick={() => { setCategory('households'); scrollToSection(calculatorRef); }}
          className={`p-6 sm:p-8 rounded-3xl border transition-all cursor-pointer group ${
            category === 'households'
              ? 'bg-white border-[#22C55E] shadow-xl ring-2 ring-emerald-500/20'
              : 'bg-white/80 border-slate-200/80 hover:bg-white hover:border-emerald-300 shadow-sm'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
            <Home className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Домохозяйства</h3>
          <p className="text-sm text-slate-600 leading-relaxed mb-4">
            Оптимизация счетов за свет и воду для квартир и частных домов. Быстрый окупаемый эффект.
          </p>
          <span className="text-xs font-bold text-[#16A34A] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Рассчитать для дома <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>

        <div 
          onClick={() => { setCategory('schools'); scrollToSection(calculatorRef); }}
          className={`p-6 sm:p-8 rounded-3xl border transition-all cursor-pointer group ${
            category === 'schools'
              ? 'bg-white border-[#22C55E] shadow-xl ring-2 ring-emerald-500/20'
              : 'bg-white/80 border-slate-200/80 hover:bg-white hover:border-emerald-300 shadow-sm'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Школы и ВУЗы</h3>
          <p className="text-sm text-slate-600 leading-relaxed mb-4">
            Интерактивный эко-контроль ресурсов и экологическое просвещение учащихся.
          </p>
          <span className="text-xs font-bold text-sky-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Рассчитать для школы <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>

        <div 
          onClick={() => { setCategory('business'); scrollToSection(calculatorRef); }}
          className={`p-6 sm:p-8 rounded-3xl border transition-all cursor-pointer group ${
            category === 'business'
              ? 'bg-white border-[#22C55E] shadow-xl ring-2 ring-emerald-500/20'
              : 'bg-white/80 border-slate-200/80 hover:bg-white hover:border-emerald-300 shadow-sm'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Бизнес и Организации</h3>
          <p className="text-sm text-slate-600 leading-relaxed mb-4">
            ESG-мониторинг, снижения пиковых расходов электроэнергии и аудиты для коммерческих объектов.
          </p>
          <span className="text-xs font-bold text-amber-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Рассчитать для бизнеса <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </section>
  );
}
