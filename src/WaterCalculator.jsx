import React, { useState } from 'react';
import { Banknote, CheckCircle2, Droplet, Lightbulb } from 'lucide-react';

export default function WaterCalculator() {
  const [startReading, setStartReading] = useState(67.300);
  const [currentReading, setCurrentReading] = useState(221.207);
  const [tariff, setTariff] = useState(149.18);
  const [calculatedAt, setCalculatedAt] = useState(null);
  const [aiAdvice, setAiAdvice] = useState(null);

  // Автоматические расчёты
  const difference = Math.max(0, currentReading - startReading);   // разница в м³
  const liters = difference * 1000;                                 // расход в литрах
  const totalCost = difference * tariff;                            // начислено ₸
  const hasReadingError = currentReading < startReading;

  const getAiAdvice = () => {
    if (hasReadingError) {
      return [
        'Проверьте ввод: текущее показание не может быть меньше начального.',
        'Если счётчик был заменён, начните новый расчёт с показания нового счётчика.',
        'Сохраните фото показаний, чтобы легче сверить данные с квитанцией.'
      ];
    }

    if (difference > 20) {
      return [
        'Проверьте краны, душ и сливной бачок: незаметная утечка часто даёт большой перерасход.',
        'Поставьте аэраторы на смесители и сократите напор там, где сильный поток не нужен.',
        'Перенесите стирку и уборку на полную загрузку, чтобы снизить расход без потери комфорта.'
      ];
    }

    if (difference > 12) {
      return [
        'Расход умеренный, но есть запас для экономии: начните с душа на 1-2 минуты короче.',
        'Проверяйте счётчик раз в неделю, чтобы быстро заметить необычный рост.',
        'Для полива используйте утреннее или вечернее время, когда вода меньше испаряется.'
      ];
    }

    return [
      'Потребление выглядит аккуратно: продолжайте фиксировать показания каждый месяц.',
      'Держите привычку закрывать воду во время чистки зубов и намыливания посуды.',
      'Если расход внезапно вырастет, первым делом проверьте утечки и бытовую технику.'
    ];
  };

  const handleCalculate = () => {
    setAiAdvice(getAiAdvice());
    setCalculatedAt(new Date());
  };

  const resetAiAdvice = () => {
    setAiAdvice(null);
    setCalculatedAt(null);
  };

  return (
    <div className="w-full max-w-md mx-auto font-sans">
      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100">
        {/* Header */}
        <h2 className="text-xl font-bold text-slate-900 mb-1">Калькулятор воды</h2>
        <p className="text-[13px] text-slate-400 mb-6">
          Введите показания счётчика и тариф — EcoAI автоматически рассчитает расход и стоимость.
        </p>

        <div className="space-y-5">
          {/* 1. Начальное показание */}
          <div>
            <label className="text-[13px] font-semibold text-slate-500 mb-2 block">
              Начальное показание, м³
            </label>
            <input
              type="number"
              step="0.001"
              value={startReading}
              onChange={(e) => {
                setStartReading(Number(e.target.value));
                resetAiAdvice();
              }}
              className="w-full bg-white border border-slate-200 text-slate-900 text-lg rounded-2xl px-4 py-3.5 focus:outline-none focus:border-sky-500 transition-colors font-semibold"
            />
          </div>

          {/* 2. Текущее показание */}
          <div>
            <label className="flex items-center text-[13px] font-semibold text-slate-500 mb-2">
              <Droplet className="w-4 h-4 mr-1.5 text-sky-400" />
              Текущее показание, м³
            </label>
            <input
              type="number"
              step="0.001"
              value={currentReading}
              onChange={(e) => {
                setCurrentReading(Number(e.target.value));
                resetAiAdvice();
              }}
              className="w-full bg-white border border-slate-200 text-slate-900 text-lg rounded-2xl px-4 py-3.5 focus:outline-none focus:border-sky-500 transition-colors font-semibold"
            />
          </div>

          {/* 3. Тариф */}
          <div>
            <label className="flex items-center text-[13px] font-semibold text-sky-600 mb-1">
              <Banknote className="w-4 h-4 mr-1.5" />
              Тариф
            </label>
            <span className="text-[11px] text-slate-400 block mb-2">Тариф за 1 м³, ₸</span>
            <input
              type="number"
              step="0.01"
              value={tariff}
              onChange={(e) => {
                setTariff(Number(e.target.value));
                resetAiAdvice();
              }}
              className="w-full bg-white border border-slate-200 text-slate-900 text-lg rounded-2xl px-4 py-3.5 focus:outline-none focus:border-sky-500 transition-colors font-semibold"
            />
          </div>

          <div className="h-px bg-slate-100 w-full"></div>

          {/* 4. Разница показаний (авто) */}
          <div className="flex items-center justify-between bg-slate-50 px-5 py-4 rounded-2xl border border-slate-100">
            <span className="text-[13px] font-semibold text-slate-500">Разница показаний</span>
            <span className="text-lg font-black text-slate-900">
              {difference.toLocaleString('ru-RU', {minimumFractionDigits: 3, maximumFractionDigits: 3})} м³
            </span>
          </div>

          {/* 5. Расход воды в литрах (авто) */}
          <div className="flex items-center justify-between bg-slate-50 px-5 py-4 rounded-2xl border border-slate-100">
            <span className="text-[13px] font-semibold text-slate-500">Расход воды в литрах</span>
            <span className="text-lg font-black text-slate-900">
              {liters.toLocaleString('ru-RU', {minimumFractionDigits: 0, maximumFractionDigits: 0})} л
            </span>
          </div>

          {/* 6. Начислено (авто, выделено) */}
          <div className="flex items-center justify-between bg-emerald-50/80 px-5 py-4 rounded-2xl border border-emerald-100">
            <span className="text-[13px] font-bold text-emerald-700">Начислено</span>
            <span className="text-2xl font-black text-emerald-600">
              {totalCost.toLocaleString('ru-RU', {minimumFractionDigits: 2, maximumFractionDigits: 2})} <span className="text-sm">₸</span>
            </span>
          </div>

          {/* Кнопка */}
          <button
            type="button"
            onClick={handleCalculate}
            className="w-full bg-[#1877F2] hover:bg-blue-600 active:bg-blue-700 text-white font-semibold py-4 rounded-2xl transition-colors mt-2 shadow-md"
          >
            Рассчитать
          </button>

          {calculatedAt && (
            <div className="text-center text-[12px] font-semibold text-emerald-600">
              Расчёт обновлён в {calculatedAt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}

          {!aiAdvice && (
            <div className="text-center text-[12px] font-semibold text-slate-400">
              Нажмите «Рассчитать», чтобы получить AI-совет и поручения.
            </div>
          )}
        </div>

        {aiAdvice && (
          <div className="mt-6 bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">AI-совет по воде</h4>
                <p className="text-[11px] text-slate-500">Пути решения по вашему расходу</p>
              </div>
            </div>

            <div className="space-y-2">
              {aiAdvice.map((advice) => (
                <div key={advice} className="flex items-start gap-2 text-[12px] leading-relaxed text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{advice}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Пояснение */}
        <div className="mt-6 bg-slate-50 rounded-2xl p-4 border border-slate-100">
          <h4 className="text-sm font-bold text-slate-700 mb-2">Как работает калькулятор:</h4>
          <p className="text-[12px] text-slate-500 leading-relaxed">
            Текущее показание – начальное показание = расход в м³<br />
            Расход в м³ × 1 000 = расход в литрах<br />
            Расход в м³ × тариф = начислено (₸)
          </p>
        </div>
      </div>
    </div>
  );
}
