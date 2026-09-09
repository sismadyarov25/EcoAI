import React, { useEffect, useState } from 'react';
import { User, Activity, Clock, TrendingDown, TrendingUp, AlertCircle } from 'lucide-react';
import Header from '../components/Header';
import { getUserHistory, getUserDynamics } from '../api/ecoService';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const [history, setHistory] = useState([]);
  const [dynamics, setDynamics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const [historyRes, dynamicsRes] = await Promise.all([
          getUserHistory(),
          getUserDynamics()
        ]);
        
        if (historyRes.success) setHistory(historyRes.history);
        if (dynamicsRes.success) setDynamics(dynamicsRes.dynamics);
      } catch (err) {
        setError('Не удалось загрузить данные профиля. Пожалуйста, войдите в систему.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  const renderTrend = (value, unit = '%') => {
    if (value == null) return <span className="text-slate-400">Нет данных</span>;
    const isGood = value <= 0; // Less consumption is good
    return (
      <div className={`flex items-center gap-1 font-bold ${isGood ? 'text-emerald-600' : 'text-red-500'}`}>
        {isGood ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
        <span>{Math.abs(value)}{unit} {isGood ? 'снижение' : 'рост'}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 pt-24">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Профиль пользователя</h1>
            <p className="text-sm font-medium text-slate-500">Ваша экологическая статистика</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 mb-8 font-medium flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-10 text-slate-500">Загрузка данных...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Динамика */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-6 text-emerald-700">
                  <Activity className="w-5 h-5" />
                  <h2 className="font-bold text-lg">Динамика</h2>
                </div>
                
                {dynamics ? (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-400 font-medium mb-2">
                      Сравнение: {dynamics.currentMonth} vs {dynamics.baseMonth}
                    </p>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                      <span className="text-slate-600 font-medium text-sm">Вода</span>
                      {renderTrend(dynamics.waterPercent)}
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                      <span className="text-slate-600 font-medium text-sm">Электричество</span>
                      {renderTrend(dynamics.electricityPercent)}
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                      <span className="text-slate-600 font-medium text-sm">Отходы</span>
                      {renderTrend(dynamics.wastePercent)}
                    </div>
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex justify-between items-center mt-2">
                      <span className="text-emerald-800 font-bold text-sm">CO₂ след</span>
                      {renderTrend(dynamics.co2Percent)}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Недостаточно данных за 2 разных месяца для расчета динамики.</p>
                )}
              </div>
            </div>

            {/* История */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-6 text-emerald-700">
                  <Clock className="w-5 h-5" />
                  <h2 className="font-bold text-lg">История анализов</h2>
                </div>

                {history.length === 0 ? (
                  <p className="text-sm text-slate-500">Вы еще не делали расчетов. Перейдите на главную страницу, чтобы начать.</p>
                ) : (
                  <div className="space-y-4">
                    {history.map((item) => (
                      <div key={item.id} className="p-5 rounded-2xl border border-slate-100 hover:border-emerald-200 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                              {item.type === 'calculate' ? 'Калькулятор' : 'Консультация'}
                            </span>
                            <span className="text-xs font-medium text-slate-400">
                              {new Date(item.createdAt).toLocaleString('ru-RU')}
                            </span>
                          </div>
                          {item.type === 'calculate' && item.data_json?.score && (
                            <span className={`px-2 py-1 rounded-md text-xs font-bold text-white ${item.data_json.score >= 80 ? 'bg-emerald-500' : item.data_json.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}>
                              {item.data_json.score}/100
                            </span>
                          )}
                        </div>
                        
                        <div className="text-sm text-slate-700 mt-2">
                          {item.type === 'calculate' ? (
                            <div className="grid grid-cols-2 gap-2 mt-3">
                              <div><span className="text-slate-400">Вода:</span> {item.data_json.waterAmount} м³</div>
                              <div><span className="text-slate-400">Свет:</span> {item.data_json.electricityKwh} кВт·ч</div>
                              <div><span className="text-slate-400">Мусор:</span> {item.data_json.wasteKg} кг</div>
                              <div className="font-semibold text-emerald-600">Экономия: {item.data_json.savingsKzt} ₸/мес</div>
                            </div>
                          ) : (
                            <div>
                              <p className="font-medium text-slate-800 italic mb-2">"{item.data_json.query}"</p>
                              <p className="text-slate-600 line-clamp-2">{item.data_json.summary}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
