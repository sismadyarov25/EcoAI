import React, { useState, useRef, useEffect } from 'react';
import { 
  Droplet, 
  Zap, 
  Trash2, 
  Sparkles, 
  ChevronRight, 
  Home as HomeIcon, 
  GraduationCap, 
  Building2,
  RefreshCw,
  X,
  User
} from 'lucide-react';
import { calculateEcoData } from '../api/ecoService';
import { registerUser, loginUser } from '../api/authService';
import WaterCalculator from '../WaterCalculator';
import ElectricityCalculator from '../ElectricityCalculator';
import GasCalculator from '../GasCalculator';
import Header from '../components/Header';
import HeroSection from '../components/HeroSection';
import AudienceSelector from '../components/AudienceSelector';
import FeaturesSection from '../components/FeaturesSection';
import HowItWorks from '../components/HowItWorks';
import AnalysisResults from '../components/AnalysisResults';
import ContactsSection from '../components/ContactsSection';
import AuthModal from '../components/AuthModal';
import ContactModal from '../components/ContactModal';

// ---------------------------------------------------------------------------
// CATEGORY CONFIGURATION
// ---------------------------------------------------------------------------
const CATEGORY_HINTS = {
  households: {
    water: 'Расход воды на семью (м³)',
    electricity: 'Электроэнергия на жилье (кВт·ч)',
    waste: 'Бытовые отходы семьи (кг)'
  },
  schools: {
    water: 'Расход воды на учебный корпус (м³)',
    electricity: 'Электроэнергия на классы и корпус (кВт·ч)',
    waste: 'Отходы школы и столовой (кг)'
  },
  business: {
    water: 'Расход воды на офис / предприятие (м³)',
    electricity: 'Электроэнергия на коммерческий объект (кВт·ч)',
    waste: 'Производственные / офисные отходы (кг)'
  }
};

export default function Home() {
  // ---------------------------------------------------------------------------
  // STATE MANAGEMENT
  // ---------------------------------------------------------------------------
  
  // Category selection state: 'households' | 'schools' | 'business'
  const [category, setCategory] = useState('households');

  // Auth modal state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState('');
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');

  // Input parameters state for monthly consumption
  const [water, setWater] = useState('12.4');       // м³
  const [electricity, setElectricity] = useState('248'); // кВт·ч
  const [waste, setWaste] = useState('32');         // кг
  const [familySize, setFamilySize] = useState('4'); // чел

  // Loading and analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);

  // Refs for navigation scrolling
  const audienceRef = useRef(null);
  const featuresRef = useRef(null);
  const howItWorksRef = useRef(null);
  const calculatorRef = useRef(null);
  const contactsRef = useRef(null);

  const scrollToSection = (ref) => {
    if (ref && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Restore auth from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('ecoaiUser');

    if (!savedUser) {
      return;
    }

    try {
      const parsedUser = JSON.parse(savedUser);
      if (parsedUser?.name) {
        setUserLoggedIn(true);
        setUserName(parsedUser.name);
      }
    } catch {
      localStorage.removeItem('ecoaiUser');
    }
  }, []);

  // ---------------------------------------------------------------------------
  // AUTH HANDLERS
  // ---------------------------------------------------------------------------
  const handleLogout = () => {
    setUserLoggedIn(false);
    setUserName('');
    localStorage.removeItem('ecoaiUser');
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');

    try {
      const payload = authMode === 'register'
        ? { name: authName.trim(), email: authEmail.trim(), password: authPassword }
        : { email: authEmail.trim(), password: authPassword };

      const response = authMode === 'register'
        ? await registerUser(payload)
        : await loginUser(payload);

      const nextName = response.user?.name || authName || (authEmail || 'Пользователь').split('@')[0];

      setUserLoggedIn(true);
      setUserName(nextName);
      localStorage.setItem('ecoaiUser', JSON.stringify({ name: nextName, email: response.user?.email || authEmail.trim() }));
      setAuthEmail('');
      setAuthPassword('');
      setAuthName('');
      setIsAuthOpen(false);
    } catch (error) {
      setAuthError(error.message || 'Ошибка авторизации');
    }
  };

  // ---------------------------------------------------------------------------
  // GENERATE AI ANALYSIS (API INTEGRATION)
  // ---------------------------------------------------------------------------
  const handleGenerateAnalysis = async (e) => {
    if (e) e.preventDefault();
    setIsAnalyzing(true);
    setAnalysisError(null);

    const wVal = parseFloat(water) || 0;
    const eVal = parseFloat(electricity) || 0;
    const wstVal = parseFloat(waste) || 0;

    const categoryMap = {
      households: 'home',
      schools: 'school',
      business: 'business'
    };

    try {
      const result = await calculateEcoData({
        category: categoryMap[category] || 'home',
        waterAmount: wVal,
        electricityKwh: eVal,
        wasteKg: wstVal,
        peopleCount: parseInt(familySize) || 4,
        recycledPercent: 20
      });
      
      if (result.success) {
        const resolvedScore = Number(result?.data?.score ?? 0);
        const resolvedStatus = result?.data?.status ?? 'НОРМАЛЬНЫЙ';

        const detailedMetrics = result?.data?.detailedMetrics || {
          waterAnalysis: `Расход воды составляет ${wVal} м³/мес для выбранной категории. Показатель нужно оценивать относительно среднего уровня по Казахстану.`,
          electricityAnalysis: `Потребление электроэнергии составляет ${eVal} кВт·ч/мес. Для выбранной категории этот показатель следует сравнивать с типичным уровнем по РК.`,
          wasteAnalysis: `Объем отходов составляет ${wstVal} кг/мес. Для оценки важно смотреть на уровень сортировки и переработки по категории.`
        };

        const savingsMonthly = result.data.totalSavingsKzt || 0;
        const co2ReducedKg = result.data.co2ReductionKg || Math.round((eVal * 0.85) + (wVal * 0.45) + (wstVal * 1.1));

        setAnalysisResult({
          metrics: { water: wVal, electricity: eVal, waste: wstVal },
          savings: {
            monthly: savingsMonthly,
            yearly: savingsMonthly * 12,
            co2Reduced: co2ReducedKg,
            ecoScore: resolvedScore
          },
          summary: result.data.summary,
          score: resolvedScore,
          status: resolvedStatus,
          detailedMetrics,
          co2Breakdown: result.data.co2Breakdown || null,
          aiAdvice: result.data.recommendations && result.data.recommendations.length > 0
            ? result.data.recommendations
            : (result.data.recommendationsList || [result.data.aiRecommendation]),
          timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
        });

        setTimeout(() => {
          if (calculatorRef.current) {
            calculatorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      } else {
        throw new Error(result.message || 'Ошибка обработки данных');
      }
    } catch (err) {
      console.error("AI Error:", err);
      setAnalysisError(err.message || 'Произошла непредвиденная ошибка соединения');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6FAF7] bg-grid-pattern text-slate-800 font-sans relative selection:bg-emerald-200 selection:text-emerald-900 pb-20 overflow-x-hidden">
      
      {/* Background Soft Glow Orbs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-200/40 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-20 left-0 w-[400px] h-[400px] bg-teal-200/30 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* HEADER */}
      <Header
        userLoggedIn={userLoggedIn}
        userName={userName}
        onLogout={handleLogout}
        onLogin={() => { setAuthMode('login'); setIsAuthOpen(true); }}
        onRegister={() => { setAuthMode('register'); setIsAuthOpen(true); }}
        scrollToSection={scrollToSection}
        audienceRef={audienceRef}
        featuresRef={featuresRef}
        howItWorksRef={howItWorksRef}
        calculatorRef={calculatorRef}
        onShowContact={() => { setShowContactModal(true); scrollToSection(contactsRef); }}
      />

      {/* HERO */}
      <HeroSection
        water={water}
        electricity={electricity}
        waste={waste}
        scrollToSection={scrollToSection}
        audienceRef={audienceRef}
        calculatorRef={calculatorRef}
      />

      {/* AUDIENCE SELECTOR */}
      <AudienceSelector
        category={category}
        setCategory={setCategory}
        scrollToSection={scrollToSection}
        calculatorRef={calculatorRef}
        audienceRef={audienceRef}
      />

      {/* FEATURES */}
      <FeaturesSection featuresRef={featuresRef} />

      {/* HOW IT WORKS */}
      <HowItWorks howItWorksRef={howItWorksRef} />

      {/* CALCULATOR SECTION */}
      <section ref={calculatorRef} className="max-w-5xl mx-auto px-4 sm:px-6 py-12 scroll-mt-24">
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-100">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold text-[#16A34A] uppercase tracking-wider block mb-1">
                КАЛЬКУЛЯТОР ВЫГОДЫ
              </span>
              <h2 className="text-2xl font-bold text-slate-900">
                Введите показатели потребления за 1 месяц
              </h2>
            </div>

            {/* Category Selector Tabs */}
            <div className="bg-slate-100/90 p-1.5 rounded-2xl flex items-center gap-1 self-start md:self-auto border border-slate-200/60 shadow-inner">
              <button
                type="button"
                onClick={() => setCategory('households')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  category === 'households'
                    ? 'bg-white text-emerald-700 shadow-sm border border-emerald-100'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <HomeIcon className="w-3.5 h-3.5" />
                <span>Дом</span>
              </button>
              <button
                type="button"
                onClick={() => setCategory('schools')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  category === 'schools'
                    ? 'bg-white text-emerald-700 shadow-sm border border-emerald-100'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Школа</span>
              </button>
              <button
                type="button"
                onClick={() => setCategory('business')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  category === 'business'
                    ? 'bg-white text-emerald-700 shadow-sm border border-emerald-100'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Бизнес</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleGenerateAnalysis} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Water Input */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 transition-all focus-within:border-sky-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-sky-100 flex flex-col justify-between">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between mb-2">
                    <span className="flex items-center gap-1.5">
                      <Droplet className="w-4 h-4 text-sky-500" />
                      Вода
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">м³ / месяц</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={water}
                      onChange={(e) => setWater(e.target.value)}
                      required
                      className="w-full bg-transparent text-2xl font-bold text-slate-900 focus:outline-none pr-10"
                    />
                    <span className="absolute right-0 text-sm font-semibold text-slate-400">м³</span>
                  </div>
                </div>
                <p className="text-[11px] font-medium text-slate-500 mt-3 pt-2 border-t border-slate-200/60">
                  💡 {CATEGORY_HINTS[category].water}
                </p>
              </div>

              {/* Electricity Input */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 transition-all focus-within:border-amber-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-100 flex flex-col justify-between">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between mb-2">
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-500" />
                      Электричество
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">кВт·ч / месяц</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={electricity}
                      onChange={(e) => setElectricity(e.target.value)}
                      required
                      className="w-full bg-transparent text-2xl font-bold text-slate-900 focus:outline-none pr-14"
                    />
                    <span className="absolute right-0 text-sm font-semibold text-slate-400">кВт·ч</span>
                  </div>
                </div>
                <p className="text-[11px] font-medium text-slate-500 mt-3 pt-2 border-t border-slate-200/60">
                  💡 {CATEGORY_HINTS[category].electricity}
                </p>
              </div>

              {/* Waste Input */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 transition-all focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-100 flex flex-col justify-between">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between mb-2">
                    <span className="flex items-center gap-1.5">
                      <Trash2 className="w-4 h-4 text-emerald-500" />
                      Отходы
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">кг / месяц</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={waste}
                      onChange={(e) => setWaste(e.target.value)}
                      required
                      className="w-full bg-transparent text-2xl font-bold text-slate-900 focus:outline-none pr-10"
                    />
                    <span className="absolute right-0 text-sm font-semibold text-slate-400">кг</span>
                  </div>
                </div>
                <p className="text-[11px] font-medium text-slate-500 mt-3 pt-2 border-t border-slate-200/60">
                  💡 {CATEGORY_HINTS[category].waste}
                </p>
              </div>

              {/* Family Size Input */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 transition-all focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 flex flex-col justify-between">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between mb-2">
                    <span className="flex items-center gap-1.5">
                      <User className="w-4 h-4 text-indigo-500" />
                      Семья
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">человек</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={familySize}
                      onChange={(e) => setFamilySize(e.target.value)}
                      required
                      className="w-full bg-transparent text-2xl font-bold text-slate-900 focus:outline-none pr-10"
                    />
                    <span className="absolute right-0 text-sm font-semibold text-slate-400">чел</span>
                  </div>
                </div>
                <p className="text-[11px] font-medium text-slate-500 mt-3 pt-2 border-t border-slate-200/60">
                  💡 Учитывается для расчета норм
                </p>
              </div>

            </div>

            <div className="flex justify-center">
              <button
                type="submit"
                disabled={isAnalyzing}
                className="px-8 py-4 bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold text-base rounded-full shadow-lg shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-3 disabled:opacity-75 cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin text-white" />
                    <span>ИИ вычисляет экономию...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Сгенерировать AI-анализ</span>
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>

            {analysisError && (
              <div className="mt-4 p-4 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100 flex items-center justify-center gap-2">
                <X className="w-5 h-5" />
                <span>{analysisError}</span>
              </div>
            )}
          </form>
        </div>

        {/* ANALYSIS RESULTS */}
        <AnalysisResults analysisResult={analysisResult} />

        {/* INDIVIDUAL CALCULATORS */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 items-stretch">
          <div className="flex flex-col gap-3">
            <div className="text-2xl font-black text-slate-900">Вода</div>
            <WaterCalculator onApply={(val) => { setWater(val.toString()); scrollToSection(calculatorRef); }} />
          </div>
          <div className="flex flex-col gap-3">
            <div className="text-2xl font-black text-slate-900">Электричество</div>
            <ElectricityCalculator onApply={(val) => { setElectricity(val.toString()); scrollToSection(calculatorRef); }} />
          </div>
          <div className="flex flex-col gap-3">
            <div className="text-2xl font-black text-slate-900">Газ</div>
            <GasCalculator />
          </div>
        </div>

      </section>

      {/* CONTACTS */}
      <ContactsSection contactsRef={contactsRef} />

      {/* AUTH MODAL */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        authMode={authMode}
        setAuthMode={setAuthMode}
        authEmail={authEmail}
        setAuthEmail={setAuthEmail}
        authPassword={authPassword}
        setAuthPassword={setAuthPassword}
        authName={authName}
        setAuthName={setAuthName}
        authError={authError}
        onSubmit={handleAuthSubmit}
      />

      {/* CONTACT MODAL */}
      <ContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
      />

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-200/60 py-8 text-center text-xs text-slate-500">
        <p>© 2026 EcoAi — Казахстанский эко-трек. Все права защищены.</p>
      </footer>

    </div>
  );
}
