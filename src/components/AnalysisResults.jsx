import { Award, Droplet, Zap, Trash2, CheckCircle2 } from 'lucide-react';

export default function AnalysisResults({ analysisResult }) {
  if (!analysisResult) return null;

  return (
    <div className="mt-8 space-y-6 animate-fade-in">
      
      {/* Top Score Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="z-10 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-bold">
              <Award className="w-3.5 h-3.5" />
              Эко-Score: {analysisResult.score} / 100
            </span>

            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              analysisResult.status === 'ОТЛИЧНЫЙ' || analysisResult.status === 'отличный'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : analysisResult.status === 'КРИТИЧЕСКИЙ' || analysisResult.status === 'требует внимания'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
            }`}>
              Статус: {analysisResult.status}
            </span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
            Заключение ИИ-консультанта
          </h3>
          {analysisResult.summary && (
            <p className="text-slate-300 text-sm max-w-xl leading-relaxed">
              {analysisResult.summary}
            </p>
          )}
        </div>

        {analysisResult.savings && analysisResult.savings.monthly > 0 && (
          <div className="z-10 bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 w-full sm:w-auto shrink-0">
            <span className="text-xs uppercase text-slate-300 font-medium block">
              Потенциальная экономия
            </span>
            <span className="text-3xl sm:text-4xl font-extrabold text-[#22C55E] tracking-tight block">
              ₸ {analysisResult.savings.monthly.toLocaleString('ru-RU')}
            </span>
            <span className="text-xs text-slate-300 font-medium block mt-0.5">
              в месяц (~₸ {analysisResult.savings.yearly.toLocaleString('ru-RU')} в год)
            </span>
          </div>
        )}
      </div>

      {/* CO₂ Breakdown Card */}
      {analysisResult.savings && analysisResult.savings.co2Reduced > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-md">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm mb-3">
            <span className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center text-[10px] font-black">CO₂</span>
            <span>Углеродный след: {analysisResult.savings.co2Reduced} кг CO₂/мес</span>
          </div>
          {analysisResult.co2Breakdown && (
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="bg-sky-50 rounded-xl p-3 text-center border border-sky-100">
                <div className="font-bold text-sky-700">{analysisResult.co2Breakdown.water} кг</div>
                <div className="text-slate-500 mt-0.5">Вода</div>
              </div>
              <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-100">
                <div className="font-bold text-amber-700">{analysisResult.co2Breakdown.electricity} кг</div>
                <div className="text-slate-500 mt-0.5">Электричество</div>
              </div>
              <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100">
                <div className="font-bold text-emerald-700">{analysisResult.co2Breakdown.waste} кг</div>
                <div className="text-slate-500 mt-0.5">Отходы</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Visual Comparisons Metrics Breakdown */}
      {analysisResult.detailedMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Water Analysis Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-md space-y-3">
            <div className="flex items-center gap-2 text-sky-600 font-bold text-sm">
              <Droplet className="w-5 h-5 fill-sky-500/20" />
              <span>Анализ Воды</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              {analysisResult.detailedMetrics.waterAnalysis || `Месячный расход воды равен ${analysisResult.metrics.water} м³.`}
            </p>
          </div>

          {/* Electricity Analysis Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-md space-y-3">
            <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
              <Zap className="w-5 h-5 fill-amber-500/20" />
              <span>Анализ Энергии</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              {analysisResult.detailedMetrics.electricityAnalysis || `Потребление электроэнергии составляет ${analysisResult.metrics.electricity} кВт·ч.`}
            </p>
          </div>

          {/* Waste Analysis Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-md space-y-3">
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
              <Trash2 className="w-5 h-5 fill-emerald-500/20" />
              <span>Анализ Отходов</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              {analysisResult.detailedMetrics.wasteAnalysis || `Объем отходов равен ${analysisResult.metrics.waste} кг в месяц.`}
            </p>
          </div>

        </div>
      )}

      {/* Recommendations Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-lg space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
            AI
          </div>
          <h4 className="text-lg font-bold text-slate-900">3 практических совета по экономии:</h4>
        </div>

        <div className="space-y-3">
          {analysisResult.aiAdvice.map((advice, idx) => (
            <div key={idx} className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-medium text-slate-800">
              <CheckCircle2 className="w-5 h-5 text-[#22C55E] shrink-0 mt-0.5" />
              <span>{advice}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
