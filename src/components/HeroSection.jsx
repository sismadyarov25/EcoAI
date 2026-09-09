import { Droplet, Zap, TrendingDown, ArrowRight } from 'lucide-react';

export default function HeroSection({ water, electricity, waste, scrollToSection, audienceRef, calculatorRef }) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-8 pt-12 sm:pt-20 pb-16 lg:pb-24">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        
        {/* Left Hero Column */}
        <div className="lg:col-span-6 space-y-6 sm:space-y-8">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/70 border border-emerald-200 text-[#15803D] text-xs font-bold tracking-wider uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-ping" />
            <span>AI-ПЛАТФОРМА ДЛЯ ЭКОЛОГИИ</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
            <span className="text-[#16A34A]">EcoAi</span>
            <br />
            <span className="text-slate-800 font-extrabold">— умная экономия ресурсов</span>
          </h1>

          <p className="text-base sm:text-xl text-slate-600 leading-relaxed max-w-xl font-normal">
            Переводим данные о потреблении воды, электричества и других ресурсов в понятные рекомендации и конкретную денежную выгоду — для дома, школы или организации.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              type="button"
              onClick={() => scrollToSection(audienceRef)}
              className="px-7 py-3.5 rounded-full text-base font-semibold text-white bg-[#22C55E] hover:bg-[#16A34A] shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2.5 cursor-pointer transform hover:-translate-y-0.5"
            >
              <span>Выбрать аудиторию</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => scrollToSection(calculatorRef)}
              className="px-7 py-3.5 rounded-full text-base font-semibold text-slate-700 bg-white border border-slate-200/80 hover:bg-slate-50 shadow-2xs transition-all cursor-pointer"
            >
              Попробовать калькулятор
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-200/60 text-xs sm:text-sm font-medium text-slate-700">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-100/50 text-emerald-900 border border-emerald-200/50">
              <Droplet className="w-4 h-4 text-emerald-600" />
              <span>Вода</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-100/50 text-emerald-900 border border-emerald-200/50">
              <Zap className="w-4 h-4 text-emerald-600" />
              <span>Электричество</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-100/50 text-amber-900 border border-amber-200/50">
              <TrendingDown className="w-4 h-4 text-amber-600" />
              <span>Экономия до 30%</span>
            </div>
          </div>

        </div>

        {/* Right Hero Column: Dashboard Live Card */}
        <div className="lg:col-span-6">
          <div className="relative mx-auto max-w-lg lg:max-w-none">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-3xl blur-2xl opacity-20 pointer-events-none" />

            <div className="relative bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100/90 animate-float space-y-6">
              
              <div className="flex items-center justify-between pb-2">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
                    МОНИТОРИНГ
                  </span>
                  <h3 className="text-xl font-bold text-slate-900">
                    Дашборд EcoAi
                  </h3>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
                  Live
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />
                  <span className="text-[11px] font-medium text-slate-400 block mb-1">Вода</span>
                  <span className="text-base sm:text-lg font-bold text-slate-900 block">{water} м³</span>
                  <span className="text-[11px] font-bold text-emerald-600 mt-1 inline-block">-8%</span>
                </div>

                <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-amber-400" />
                  <span className="text-[11px] font-medium text-slate-400 block mb-1">Свет</span>
                  <span className="text-base sm:text-lg font-bold text-slate-900 block">{electricity} кВт·ч</span>
                  <span className="text-[11px] font-bold text-emerald-600 mt-1 inline-block">-15%</span>
                </div>

                <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
                  <span className="text-[11px] font-medium text-slate-400 block mb-1">Отходы</span>
                  <span className="text-base sm:text-lg font-bold text-slate-900 block">{waste} кг</span>
                  <span className="text-[11px] font-bold text-emerald-600 mt-1 inline-block">-22%</span>
                </div>
              </div>

              <div className="bg-emerald-50/80 border border-emerald-200/60 p-4 rounded-2xl flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-[#22C55E] text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  AI
                </div>
                <div className="flex-1 text-xs sm:text-sm">
                  <span className="font-bold text-slate-900 block mb-0.5">Рекомендация</span>
                  <p className="text-slate-600 leading-snug">
                    Снизьте температуру стирки до 30°C — экономия <strong className="text-amber-700 font-bold">~850 ₸/мес</strong>
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <div className="flex items-end justify-between gap-2 h-16 bg-slate-50/60 p-3 rounded-2xl border border-slate-100">
                  <div className="w-full bg-[#22C55E]/60 h-8 rounded-lg" />
                  <div className="w-full bg-[#22C55E]/80 h-12 rounded-lg" />
                  <div className="w-full bg-[#22C55E]/60 h-7 rounded-lg" />
                  <div className="w-full bg-[#22C55E] h-14 rounded-lg" />
                  <div className="w-full bg-[#22C55E]/75 h-10 rounded-lg" />
                  <div className="w-full bg-[#22C55E]/50 h-6 rounded-lg" />
                  <div className="w-full bg-[#22C55E]/70 h-9 rounded-lg" />
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
