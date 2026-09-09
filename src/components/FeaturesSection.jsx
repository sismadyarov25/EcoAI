import { Sparkles, BarChart3, Leaf, ShieldCheck } from 'lucide-react';

export default function FeaturesSection({ featuresRef }) {
  return (
    <section ref={featuresRef} className="max-w-7xl mx-auto px-4 sm:px-8 py-16 scroll-mt-24">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="text-xs font-bold text-[#16A34A] uppercase tracking-wider block mb-1">
          ВОЗМОЖНОСТИ СИСТЕМЫ
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
          Платформа умной эко-аналитики
        </h2>
        <p className="text-slate-600 mt-3 text-base">
          Полный набор инструментов для контроля потребления и оптимизации бюджета
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#16A34A] flex items-center justify-center mb-4">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">ИИ-Анализ расходов</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Алгоритмы выявляют утечки, неэффективное использование ресурсов и аномалии потребления.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4">
            <BarChart3 className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Расчет в тенге (₸)</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Каждая рекомендация выражена в конкретной финансовой экономии по тарифам Республики Казахстан.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
            <Leaf className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Эко-Score и CO₂</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Оценка углеродного следа и рекомендации по его сокращению для ESG-отчетности.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Безопасность данных</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Конфиденциальное хранение сведений о потреблении и коммунальных объектах.
          </p>
        </div>

      </div>
    </section>
  );
}
