export default function HowItWorks({ howItWorksRef }) {
  return (
    <section ref={howItWorksRef} className="max-w-7xl mx-auto px-4 sm:px-8 py-16 scroll-mt-24">
      <div className="bg-emerald-950 text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-2xl">
        
        <div className="max-w-2xl mb-12">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-1">
            ПРОСТОЙ ПРОЦЕСС
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Как работает EcoAi
          </h2>
          <p className="text-emerald-200/80 mt-2 text-sm sm:text-base">
            Всего 3 простых шага для перехода к осознанной экономии
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
          
          <div className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10">
            <div className="w-10 h-10 rounded-xl bg-[#22C55E] text-white font-black text-sm flex items-center justify-center mb-4">
              01
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Внесите данные</h3>
            <p className="text-xs sm:text-sm text-emerald-200/70 leading-relaxed">
              Введите ежемесячное потребление воды, электричества и объем отходов в калькуляторе.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10">
            <div className="w-10 h-10 rounded-xl bg-[#22C55E] text-white font-black text-sm flex items-center justify-center mb-4">
              02
            </div>
            <h3 className="text-lg font-bold text-white mb-2">ИИ-анализ потребления</h3>
            <p className="text-xs sm:text-sm text-emerald-200/70 leading-relaxed">
              Нейросеть EcoAi сравнивает показатели с нормами и рассчитывает потенциал экономии.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10">
            <div className="w-10 h-10 rounded-xl bg-[#22C55E] text-white font-black text-sm flex items-center justify-center mb-4">
              03
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Получите выгоду в ₸</h3>
            <p className="text-xs sm:text-sm text-emerald-200/70 leading-relaxed">
              Используйте персонализированный список шагов для снижения счетов и сохранения ресурсов.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
}
