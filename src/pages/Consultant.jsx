import React, { useState } from 'react';
import { Bot, Send, Zap, Loader2, Image as ImageIcon, TrendingDown, TrendingUp, Mic, Lightbulb, CheckCircle2 } from 'lucide-react';
import Header from '../components/Header';

export default function Consultant() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const token = localStorage.getItem('ecoaiUser') ? JSON.parse(localStorage.getItem('ecoaiUser')).email : localStorage.getItem('ecoaiToken');
      const headers = {
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/consult', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query,
          image: imagePreview, // base64 string
          context: {
            category: 'home',
            waterAmount: 15,
            electricityKwh: 250,
            wasteKg: 100
          }
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Ошибка сервера');

      setResponse(data.data);
    } catch (err) {
      setError(err.message || 'Не удалось получить ответ от AI-консультанта');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Файл слишком большой. Максимальный размер 5MB.');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 lg:p-8 pt-24">
        <div className="bg-white rounded-[32px] p-6 sm:p-10 shadow-sm border border-slate-100 mb-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">AI-консультант</h1>
              <p className="text-sm font-medium text-slate-500">Задайте любой вопрос по экономии ресурсов</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Например: Как мне сэкономить на воде, если счетчик мотает слишком быстро?"
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl p-4 min-h-[120px] focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all resize-none"
              />
            </div>
            
            {imagePreview && (
              <div className="relative inline-block mt-2">
                <img src={imagePreview} alt="Preview" className="h-24 w-24 object-cover rounded-xl border border-slate-200 shadow-sm" />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            )}
            
            <div className="flex items-center justify-between gap-4">
              <label
                className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                title="Загрузить фото счетчика"
              >
                <ImageIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Прикрепить фото</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange} 
                  className="hidden" 
                />
              </label>

              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-md shadow-emerald-500/20"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                Отправить
              </button>
            </div>
          </form>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 mb-8 font-medium">
            {error}
          </div>
        )}

        {response && (
          <div className="bg-white rounded-[32px] p-6 sm:p-10 shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Ответ EcoAI:</h2>
            
            <div className="space-y-6">
              {/* История (График/Список) */}
              {response.history && response.history.length > 0 && (
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
                    <Zap className="w-4 h-4" /> История потребления
                  </h3>
                  <div className="flex flex-wrap gap-4">
                    {response.history.map((entry, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex-1 min-w-[120px]">
                        <p className="text-xs text-slate-400 font-medium mb-1">{entry.month}</p>
                        <p className="text-xl font-bold text-slate-800">{entry.value} <span className="text-sm font-normal text-slate-500">{entry.unit}</span></p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Аналитика */}
              {response.analytics && (
                <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-emerald-800 uppercase tracking-wider mb-4">
                    <TrendingDown className="w-4 h-4" /> Аналитика и прогресс
                  </h3>
                  
                  <div className="flex items-center justify-between mb-4 bg-white p-4 rounded-xl border border-emerald-100/50 shadow-sm">
                    <div>
                      <p className="text-xs text-slate-400 font-medium mb-1">Разница</p>
                      <p className="text-lg font-bold text-slate-800">{response.analytics.difference_value > 0 ? '+' : ''}{response.analytics.difference_value}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400 font-medium mb-1">Динамика</p>
                      <span className={`inline-flex items-center font-bold px-2 py-1 rounded-md text-sm ${response.analytics.percentage_change <= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {response.analytics.display_percentage}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-white/60 p-3 rounded-xl border border-emerald-100/50">
                      <p className="text-xs font-bold text-emerald-600/80 mb-1">СТАТУС</p>
                      <p className="text-sm text-emerald-900 font-medium flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        {response.analytics.status}
                      </p>
                    </div>
                    
                    <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                      <p className="text-xs font-bold text-indigo-500 mb-1 flex items-center gap-1">
                        <Mic className="w-3 h-3" /> ДЛЯ ПРЕЗЕНТАЦИИ (ЖЮРИ)
                      </p>
                      <p className="text-sm text-indigo-900 font-medium">
                        {response.analytics.explanation_for_presentation}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Практические рекомендации */}
              {response.recommendations && (
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-bold text-slate-600 uppercase tracking-wider mb-4 mt-8">
                    <Lightbulb className="w-4 h-4 text-amber-500" /> Рекомендации
                  </h3>
                  <div className="space-y-3">
                    {Object.values(response.recommendations).filter(Boolean).map((step, index) => (
                      <div key={index} className="flex items-start gap-4 p-4 rounded-2xl border border-slate-100 bg-white hover:border-emerald-200 transition-colors shadow-sm">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 font-bold flex items-center justify-center shrink-0 text-sm border border-emerald-100">
                          {index + 1}
                        </div>
                        <p className="text-slate-700 leading-relaxed pt-1 text-sm">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
