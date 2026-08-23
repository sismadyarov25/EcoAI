import React, { useState } from 'react';
import { CalendarRange, CheckCircle2, Flame, Lightbulb, Save, Users, Wallet } from 'lucide-react';

export default function GasCalculator() {
  const [residents, setResidents] = useState(5);
  const [period, setPeriod] = useState('2026-05');
  const [previousReading, setPreviousReading] = useState(3856);
  const [currentReading, setCurrentReading] = useState(4073);
  const [tariff, setTariff] = useState(20.73);
  const [savedAt, setSavedAt] = useState(null);
  const [saveError, setSaveError] = useState('');
  const [aiAdvice, setAiAdvice] = useState(null);

  const used = Math.max(0, currentReading - previousReading);
  const liters = used * 1000;
  const totalCost = used * tariff;
  const hasReadingError = currentReading < previousReading;

  const normPerPerson = 43.4;
  const totalNorm = residents * normPerPerson;
  const isWithinNorm = used <= totalNorm;
  const progress = totalNorm > 0 ? Math.min(100, Math.max(0, (used / totalNorm) * 100)) : 0;
  const deviation = used - totalNorm;
  const deviationText = `${deviation > 0 ? '+' : ''}${deviation.toLocaleString('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })}`;

  const getAiAdvice = () => {
    if (hasReadingError) {
      return [
        'Проверьте ввод: текущее показание газа не должно быть меньше предыдущего.',
        'Если счётчик заменили, начните расчёт с показаний нового счётчика.',
        'Не ремонтируйте газовое оборудование самостоятельно: при подозрении на проблему вызывайте специалиста.'
      ];
    }

    if (!isWithinNorm) {
      return [
        'Проверьте, не работает ли газовое оборудование дольше фактической необходимости.',
        'Готовьте на подходящей мощности и закрывайте посуду крышкой, чтобы сократить потери тепла.',
        'При резком росте расхода сверьте показания и обратитесь к специалисту для проверки оборудования.'
      ];
    }

    return [
      'Потребление газа в норме: продолжайте ежемесячно фиксировать показания.',
      'Используйте средний режим пламени вместо максимального там, где это возможно.',
      'Следите, чтобы горелки не работали без посуды или без реальной необходимости.'
    ];
  };

  const handleSave = () => {
    setSaveError('');
    setAiAdvice(getAiAdvice());

    const result = {
      type: 'gas',
      period,
      residents,
      previousReading,
      currentReading,
      used,
      totalCost,
      status: isWithinNorm ? 'В норме' : 'Есть превышение',
      savedAt: new Date().toISOString()
    };

    try {
      const history = JSON.parse(localStorage.getItem('ecoaiCalculatorHistory') || '[]');
      localStorage.setItem('ecoaiCalculatorHistory', JSON.stringify([result, ...history].slice(0, 20)));
      setSavedAt(new Date());
    } catch {
      setSaveError('Не удалось сохранить результат в браузере. Проверьте доступ к локальному хранилищу.');
    }
  };

  const resetAiAdvice = () => {
    setAiAdvice(null);
    setSavedAt(null);
    setSaveError('');
  };

  return (
    <div className="w-full max-w-md mx-auto font-sans">
      <div className="bg-white rounded-[28px] p-6 shadow-sm border border-slate-100 mb-6">
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center text-[12px] font-semibold text-slate-500 mb-2 uppercase tracking-wider">
                <Users className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                Жильцов
              </label>
              <input
                type="number"
                value={residents}
                onChange={(e) => {
                  setResidents(Number(e.target.value) || 0);
                  resetAiAdvice();
                }}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-base rounded-2xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors font-semibold"
              />
            </div>

            <div>
              <label className="flex items-center text-[12px] font-semibold text-slate-500 mb-2 uppercase tracking-wider">
                <CalendarRange className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                Период
              </label>
              <input
                type="month"
                value={period}
                onChange={(e) => {
                  setPeriod(e.target.value);
                  resetAiAdvice();
                }}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-base rounded-2xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-slate-500 mb-2">
              Предыдущее показание, м³
            </label>
            <input
              type="number"
              value={previousReading}
              onChange={(e) => {
                setPreviousReading(Number(e.target.value));
                resetAiAdvice();
              }}
              className="w-full bg-white border border-slate-200 text-slate-900 text-lg rounded-2xl px-4 py-3.5 focus:outline-none focus:border-emerald-500 transition-colors font-semibold shadow-sm"
            />
          </div>

          <div>
            <label className="flex items-center text-[13px] font-semibold text-slate-500 mb-2">
              <Flame className="w-4 h-4 mr-2 text-emerald-600" />
              Текущее показание, м³
            </label>
            <input
              type="number"
              value={currentReading}
              onChange={(e) => {
                setCurrentReading(Number(e.target.value));
                resetAiAdvice();
              }}
              className="w-full bg-white border border-slate-200 text-slate-900 text-lg rounded-2xl px-4 py-3.5 focus:outline-none focus:border-emerald-500 transition-colors font-semibold shadow-sm"
            />
          </div>

          <div>
            <label className="flex items-center text-[13px] font-semibold text-slate-500 mb-2">
              <Wallet className="w-4 h-4 mr-2 text-emerald-600" />
              Тариф, ₸/м³
            </label>
            <input
              type="number"
              step="0.01"
              value={tariff}
              onChange={(e) => {
                setTariff(Number(e.target.value));
                resetAiAdvice();
              }}
              className="w-full bg-white border border-slate-200 text-slate-900 text-lg rounded-2xl px-4 py-3.5 focus:outline-none focus:border-emerald-500 transition-colors font-semibold shadow-sm"
            />
          </div>

          <div className="bg-slate-100 rounded-2xl px-5 py-4 border border-slate-200">
            <div className="text-[13px] font-medium text-slate-500 mb-1">Расход газа</div>
            <div className="text-4xl font-black text-slate-900 leading-none">
              {used.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} <span className="text-[26px] align-top">м³</span>
            </div>
            <div className="mt-2 text-[15px] text-slate-500">{liters.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} литров</div>
          </div>

          <div className="bg-slate-100 rounded-2xl px-5 py-4 border border-slate-200">
            <div className="text-[13px] font-medium text-slate-500 mb-2">Ориентировочное начисление</div>
            <div className="text-4xl font-black text-slate-900 leading-none">
              {totalCost.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[26px] align-top">₸</span>
            </div>
          </div>

          <div className="flex items-center gap-3 px-1 pt-2">
            <div className={`w-5 h-5 rounded-full border-2 shadow-sm ${
              isWithinNorm ? 'bg-emerald-500 border-emerald-200' : 'bg-red-500 border-red-200'
            }`} />
            <div>
              <div className="text-[16px] font-black text-slate-900">
                {isWithinNorm ? 'Потребление в норме' : 'Есть превышение'}
              </div>
              <div className="text-[15px] text-slate-500">{normPerPerson.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} м³ на человека</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[28px] p-6 shadow-sm border border-slate-100">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h3 className="text-[18px] font-black text-slate-900 leading-tight">Эко-статистика</h3>
          <div className={`inline-flex items-center min-h-[42px] px-4 py-2 rounded-full text-[13px] font-semibold shadow-sm ${
            isWithinNorm ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'
          }`}>
            {isWithinNorm ? 'В норме' : 'Есть превышение'}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="bg-slate-100 rounded-2xl p-3 border border-slate-200">
            <div className="text-[13px] text-slate-500 mb-1">Отклонение</div>
            <div className="text-[18px] sm:text-[22px] font-black leading-none">
              <span className={isWithinNorm ? 'text-emerald-500' : 'text-red-500'}>{deviationText}</span>
              <span className={`${isWithinNorm ? 'text-emerald-500' : 'text-red-500'} text-[14px] ml-1`}>м³</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">{isWithinNorm ? 'экономия' : 'от нормы'}</div>
          </div>

          <div className="bg-slate-100 rounded-2xl p-3 border border-slate-200">
            <div className="text-[13px] text-slate-500 mb-1">Прошло дней</div>
            <div className="text-[18px] sm:text-[22px] font-black leading-none text-slate-900">4</div>
            <div className="text-[11px] text-slate-400 mt-1">13% месяца</div>
          </div>
        </div>

        <div className="mb-6">
          <div className="text-[13px] text-slate-500 mb-2">Цель — снизить расход в следующем месяце</div>
          <div className="h-3 rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
        </div>

        {aiAdvice && (
          <div className="mb-6 bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-[15px] font-black text-slate-900">AI-совет по газу</h4>
                <p className="text-[12px] text-slate-500">Безопасные пути снижения расхода</p>
              </div>
            </div>

            <div className="space-y-2.5">
              {aiAdvice.map((advice) => (
                <div key={advice} className="flex items-start gap-2.5 text-[12px] leading-relaxed text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{advice}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!aiAdvice && (
          <div className="mb-4 text-center text-[12px] font-semibold text-slate-400">
            Нажмите «Сохранить результат», чтобы получить AI-совет и поручения.
          </div>
        )}

        <button
          type="button"
          onClick={handleSave}
          className="w-full bg-[#f5a623] hover:bg-[#e79a0a] active:bg-[#d88d00] text-white font-black text-[18px] py-4 rounded-2xl transition-colors shadow-md flex items-center justify-center gap-2"
        >
          <Save className="w-5 h-5" />
          Сохранить результат
        </button>

        {savedAt && (
          <div className="mt-3 text-center text-[12px] font-semibold text-emerald-600">
            Результат сохранён в {savedAt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}

        {saveError && (
          <div className="mt-3 text-center text-[12px] font-semibold text-red-500">
            {saveError}
          </div>
        )}
      </div>
    </div>
  );
}
