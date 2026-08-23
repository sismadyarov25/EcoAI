import React, { useState } from 'react';
import { Users, Calendar, Hash, Zap, Banknote } from 'lucide-react';

export default function ElectricityCalculator() {
  const [residents, setResidents] = useState(5);
  // Default to 3 days ago for demo purposes
  const getThreeDaysAgo = () => {
    const d = new Date();
    d.setDate(d.getDate() - 3);
    return d.toISOString().split('T')[0];
  };
  
  const [startDate, setStartDate] = useState(getThreeDaysAgo());
  const [startReading, setStartReading] = useState(46977);
  const [currentReading, setCurrentReading] = useState(47790);
  const [tariff, setTariff] = useState(23.9772);

  const calculateDays = () => {
    const start = new Date(startDate);
    const today = new Date();
    const diffTime = today - start;
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 1;
  };

  const daysPassed = calculateDays();
  const used = Math.max(0, currentReading - startReading);
  const totalCost = used * tariff;
  
  // Норма: примерно 2.5 кВт*ч на человека в день
  const recommended = residents * 2.5 * daysPassed;
  const deviation = used - recommended;
  const isExceeded = deviation > 0;


  return (
    <div className="w-full max-w-md mx-auto font-sans">
      {/* Inputs Card */}
      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 mb-6">
        <div className="space-y-5">
          {/* Residents and Start Date side by side */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center text-[11px] font-semibold text-slate-500 mb-2 uppercase tracking-wider">
                <Users className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                Жильцов
              </label>
              <input
                type="number"
                value={residents}
                onChange={(e) => setResidents(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
            <div>
              <label className="flex items-center text-[11px] font-semibold text-slate-500 mb-2 uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                Период с
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-medium text-sm rounded-xl px-2 py-3 focus:outline-none focus:border-amber-500 transition-colors text-center"
              />
            </div>
          </div>

          <div className="h-px bg-slate-100 w-full my-2"></div>

          {/* 1. Current Reading (Текущие) */}
          <div>
            <label className="flex items-center text-[13px] font-semibold text-slate-500 mb-2">
              <Zap className="w-4 h-4 mr-2 text-amber-500" />
              Текущие показания, кВт*ч
            </label>
            <input
              type="number"
              value={currentReading}
              onChange={(e) => setCurrentReading(Number(e.target.value))}
              className="w-full bg-white border border-slate-200 text-slate-900 text-base rounded-2xl px-4 py-3.5 focus:outline-none focus:border-amber-500 transition-colors font-semibold shadow-sm"
            />
          </div>

          {/* 2. Start Reading (Начальные) */}
          <div>
            <label className="flex items-center text-[13px] font-semibold text-slate-500 mb-2">
              <Hash className="w-4 h-4 mr-2 text-slate-400" />
              Начальные показания, кВт*ч
            </label>
            <input
              type="number"
              value={startReading}
              onChange={(e) => setStartReading(Number(e.target.value))}
              className="w-full bg-white border border-slate-200 text-slate-900 text-base rounded-2xl px-4 py-3.5 focus:outline-none focus:border-amber-500 transition-colors font-semibold shadow-sm"
            />
          </div>

          {/* 3. Volume (Объем) - Inline Result */}
          <div className="flex items-center justify-between bg-slate-50 px-5 py-4 rounded-2xl border border-slate-100 shadow-inner">
            <span className="text-[13px] font-bold text-slate-500">Объем, кВт*ч</span>
            <span className="text-xl font-black text-slate-900">{used}</span>
          </div>

          {/* 4. Tariff (Тариф с НДС) */}
          <div>
            <label className="flex items-center text-[13px] font-semibold text-slate-500 mb-2">
              <Banknote className="w-4 h-4 mr-2 text-emerald-500" />
              Тариф с НДС, ₸/кВт*ч
            </label>
            <input
              type="number"
              step="0.0001"
              value={tariff}
              onChange={(e) => setTariff(Number(e.target.value))}
              className="w-full bg-white border border-slate-200 text-slate-900 text-base rounded-2xl px-4 py-3.5 focus:outline-none focus:border-emerald-500 transition-colors font-semibold shadow-sm"
            />
          </div>

          {/* 5. Cost (Начислено) - Inline Result Highlighted */}
          <div className="flex items-center justify-between bg-emerald-50/80 px-5 py-4 rounded-2xl border border-emerald-100 shadow-inner mt-4">
            <div>
               <span className="text-[13px] font-bold text-emerald-700 block">Начислено</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-emerald-600">{totalCost.toLocaleString('ru-RU', {minimumFractionDigits: 2, maximumFractionDigits: 2})} <span className="text-sm">₸</span></span>
            </div>
          </div>

          <button className="w-full bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-semibold py-4 rounded-2xl transition-colors mt-2 shadow-md">
            Обновить
          </button>
        </div>
      </div>

      {/* Eco Stats Card (Отклонение) */}
      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900">Эко-статистика</h3>
          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${isExceeded ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
            {isExceeded ? 'Есть превышение' : 'В норме'}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-y-6 gap-x-4">
          {/* Deviation from norm */}
          <div>
            <div className="text-[13px] text-slate-500 mb-1">Отклонение</div>
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-black ${isExceeded ? 'text-red-500' : 'text-emerald-500'}`}>
                {isExceeded ? '+' : ''}{deviation.toLocaleString('ru-RU', {minimumFractionDigits: 1, maximumFractionDigits: 1})}
              </span>
              <span className={`text-base font-bold ${isExceeded ? 'text-red-500' : 'text-emerald-500'}`}>кВт*ч</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">{isExceeded ? 'от нормы' : 'экономия'}</div>
          </div>

          {/* Days Passed */}
          <div>
            <div className="text-[13px] text-slate-500 mb-1">Прошло дней</div>
            <div className="text-2xl font-black text-slate-900">{daysPassed}</div>
            <div className="text-[11px] text-slate-400 mt-1">{Math.round((daysPassed / 30) * 100)}% месяца</div>
          </div>
        </div>
      </div>
    </div>
  );
}
