import React, { useState, useRef, useEffect } from 'react';
import { 
  Droplet, 
  Zap, 
  Trash2, 
  Sparkles, 
  TrendingDown, 
  Leaf, 
  Award, 
  PhoneCall, 
  ChevronRight, 
  CheckCircle2, 
  Building2, 
  Home, 
  GraduationCap, 
  ArrowRight,
  ArrowUpRight,
  RefreshCw,
  X,
  Lightbulb,
  Flame,
  BarChart3,
  ShieldCheck,
  ZapOff,
  Sliders,
  Mail,
  Send,
  MessageSquare,
  LogIn,
  UserPlus,
  User,
  Lock
} from 'lucide-react';
import { calculateEcoData } from './api/ecoService';
import { registerUser, loginUser } from './api/authService';

export default function App() {
  // ---------------------------------------------------------------------------
  // STATE MANAGEMENT
  // ---------------------------------------------------------------------------
  
  // Category selection state: 'households' | 'schools' | 'business'
  const [category, setCategory] = useState('households');
  const audience = category; // Alias for backward compatibility

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

  // Demo water analysis state
  const [waterPeopleCount, setWaterPeopleCount] = useState(4);
  const [waterDemoUsage, setWaterDemoUsage] = useState('18');

  // Loading and analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);

  // Dynamic hints depending on selected category
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

  const waterDemoPerPersonByCategory = {
    households: 4.5,
    schools: 0.5,
    business: 1.8
  };
  const waterDemoPerPerson = waterDemoPerPersonByCategory[category] || waterDemoPerPersonByCategory.households;
  const waterDemoTarget = Number(waterPeopleCount || 0) * waterDemoPerPerson;
  const waterDemoActual = Number(waterDemoUsage || 0);
  const waterDemoDelta = waterDemoTarget > 0 ? ((waterDemoActual - waterDemoTarget) / waterDemoTarget) * 100 : 0;

  const typicalElectricityByCategory = {
    households: {
      label: 'Дом',
      range: '180–300 кВт·ч/мес',
      note: 'Типичный городской дом или квартира с освещением, техникой, нагревом воды и климатом.',
      example: 'Обычно выходит около 180–300 кВт·ч в месяц на семью, выше 400 кВт·ч уже требует проверки.'
    },
    schools: {
      label: 'Школа',
      range: '2 500–6 000 кВт·ч/мес',
      note: 'Зависит от площади, освещения, лифтов, систем вентиляции и климатического оборудования.',
      example: 'Типовой учебный корпус обычно даёт порядка 2,5–6 тыс. кВт·ч в месяц.'
    },
    business: {
      label: 'Бизнес',
      range: '1 200–6 000 кВт·ч/мес',
      note: 'Офис, магазин, кафе или предприятие с техникой, освещением и оборудованием.',
      example: 'Малый или средний объект обычно тратит примерно 1,2–6 тыс. кВт·ч в месяц.'
    }
  };

  const electricityCategoryEstimate = typicalElectricityByCategory[category] || typicalElectricityByCategory.households;

  const waterCategoryProfiles = {
    households: {
      heading: 'Анализ воды',
      peopleLabel: 'Количество людей в семье',
      usageLabel: 'Месячное потребление воды, м³',
      defaultPeople: 4,
      defaultUsage: '18'
    },
    schools: {
      heading: 'Анализ воды для школы',
      peopleLabel: 'Количество студентов и сотрудников',
      usageLabel: 'Месячное потребление воды, м³',
      defaultPeople: 500,
      defaultUsage: '260'
    },
    business: {
      heading: 'Анализ воды для бизнеса',
      peopleLabel: 'Количество сотрудников / смен',
      usageLabel: 'Месячное потребление воды, м³',
      defaultPeople: 50,
      defaultUsage: '80'
    }
  };

  const activeWaterProfile = waterCategoryProfiles[category] || waterCategoryProfiles.households;

  const categoryAdviceProfile = {
    households: {
      heading: 'Газ и электричество',
      gasTitle: 'Советы по газу',
      gasBullets: [
        'Не оставлять горелку включённой без необходимости.',
        'Готовить на подходящей мощности, а не на максимальной.',
        'Закрывать посуду крышкой при приготовлении.',
        'Не использовать газовое оборудование дольше, чем необходимо.',
        'Если расход неожиданно резко вырос — проверить показания счётчика и обратиться к специалисту, а не пытаться самостоятельно ремонтировать газовое оборудование.'
      ],
      electricityTitle: 'Советы по электричеству',
      electricityBullets: [
        'Выключать свет в пустых комнатах.',
        'Отключать приборы, которыми сейчас не пользуются.',
        'Не оставлять телевизор, компьютер и приставки включёнными без необходимости.',
        'Использовать естественный свет днём.',
        'Стиральную и посудомоечную машину запускать при полной загрузке.',
        'Следить за холодильником и не оставлять его дверцу открытой.',
        'Использовать экономичные режимы бытовой техники.'
      ],
      gasStyle: 'bg-amber-50 border border-amber-200',
      electricStyle: 'bg-emerald-50 border border-emerald-200',
      gasText: 'text-amber-900',
      electricText: 'text-emerald-900'
    },
    schools: {
      heading: 'Энергоэффективность школы',
      gasTitle: 'Советы по газу для школы',
      gasBullets: [
        'Не оставлять газовые горелки и оборудование включёнными без необходимости в столовой и лабораториях.',
        'Поддерживать оптимальную мощность нагрева, а не использовать максимальный режим без необходимости.',
        'Закрывать кастрюли и ёмкости крышками во время приготовления пищи и нагрева воды.',
        'Сокращать время работы газового оборудования до реального периода использования.',
        'Если расход газа резко увеличился — сверить показания счётчиков и вызвать специалиста, а не устранять проблему самостоятельно.'
      ],
      electricityTitle: 'Советы по электричеству для школы',
      electricityBullets: [
        'Выключать свет в пустых кабинетах, коридорах и аудиториях.',
        'Отключать технику и освещение в помещениях, которые сейчас не используются.',
        'Не оставлять компьютеры, проекторы и приставки в режиме ожидания без необходимости.',
        'Использовать дневной свет и снижать искусственное освещение в ясную погоду.',
        'Планировать загрузку прачечной и кухонного оборудования по расписанию.',
        'Следить за состоянием холодильников, морозильных камер и дверцами.',
        'Включать экономичные режимы на технике и системах вентиляции.'
      ],
      gasStyle: 'bg-orange-50 border border-orange-200',
      electricStyle: 'bg-teal-50 border border-teal-200',
      gasText: 'text-orange-900',
      electricText: 'text-teal-900'
    },
    business: {
      heading: 'Энергоэффективность бизнеса',
      gasTitle: 'Советы по газу для бизнеса',
      gasBullets: [
        'Не держать газовые горелки и нагреватели включёнными дольше, чем необходимо для технологического цикла.',
        'Использовать оптимальный режим пламени и избегать работы на максимальной мощности без реальной потребности.',
        'Закрывать посуду и технологические ёмкости крышками, чтобы сократить потери тепла и газа.',
        'Планировать загрузку производственного и кухонного оборудования по фактическому объёму работ.',
        'При резком росте расхода газа сверять показания счётчиков и привлекать специалиста, а не ремонтировать оборудование самостоятельно.'
      ],
      electricityTitle: 'Советы по электричеству для бизнеса',
      electricityBullets: [
        'Выключать освещение в пустых офисах, коридорах и производственных зонах.',
        'Отключать оборудование, которое не используется в текущий период работы.',
        'Не оставлять компьютеры, мониторы, серверы, панели и приставки в активном режиме без необходимости.',
        'Использовать естественное освещение в дневное время, особенно в офисных помещениях.',
        'Запускать стиральные и посудомоечные машины, технику и системы нагрева только при полной загрузке.',
        'Следить за состоянием холодильных камер и не держать двери открытыми.',
        'Использовать энергосберегающие режимы на производственном и бытовом оборудовании.'
      ],
      gasStyle: 'bg-yellow-50 border border-yellow-200',
      electricStyle: 'bg-emerald-50 border border-emerald-200',
      gasText: 'text-yellow-900',
      electricText: 'text-emerald-900'
    }
  };

  const activeAdviceProfile = categoryAdviceProfile[category] || categoryAdviceProfile.households;

  useEffect(() => {
    const defaults = {
      households: { people: 4, usage: '18' },
      schools: { people: 500, usage: '260' },
      business: { people: 50, usage: '80' }
    };

    const nextDefaults = defaults[category] || defaults.households;
    setWaterPeopleCount(nextDefaults.people);
    setWaterDemoUsage(nextDefaults.usage);
  }, [category]);

  let waterDemoStatus = {
    label: 'Потребление воды в норме',
    tone: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    accent: 'text-emerald-600',
    recommendation: 'Поддерживайте текущий режим: следите за расходом и избегайте лишнего полива и длинных водных процедур.'
  };

  if (waterDemoActual > waterDemoTarget && waterDemoDelta <= 20) {
    waterDemoStatus = {
      label: 'Стоит обратить внимание на расход воды',
      tone: 'bg-amber-50 text-amber-700 border border-amber-200',
      accent: 'text-amber-600',
      recommendation: 'Проверьте краны, сливные бачки и полив, чтобы сократить расход без потери удобства.'
    };
  } else if (waterDemoActual > waterDemoTarget * 1.2) {
    waterDemoStatus = {
      label: 'Высокий расход воды',
      tone: 'bg-red-50 text-red-700 border border-red-200',
      accent: 'text-red-600',
      recommendation: 'Сократите расход: проверьте утечки, замените старую арматуру и уменьшите лишний полив.'
    };
  }

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
        recycledPercent: 20
      });
      
      if (result.success) {
        const co2ReducedKg = Math.round((eVal * 0.85) + (wVal * 0.45) + (wstVal * 1.1));
        
        const resolvedScore = Number(result?.data?.score ?? 0);
        const resolvedStatus = result?.data?.status ?? 'НОРМАЛЬНЫЙ';

        const detailedMetrics = result?.data?.detailedMetrics || {
          waterAnalysis: `Расход воды составляет ${wVal} м³/мес для выбранной категории. Показатель нужно оценивать относительно среднего уровня по Казахстану.`,
          electricityAnalysis: `Потребление электроэнергии составляет ${eVal} кВт·ч/мес. Для выбранной категории этот показатель следует сравнивать с типичным уровнем по РК.`,
          wasteAnalysis: `Объем отходов составляет ${wstVal} кг/мес. Для оценки важно смотреть на уровень сортировки и переработки по категории.`
        };

        setAnalysisResult({
          metrics: { water: wVal, electricity: eVal, waste: wstVal },
          savings: {
            monthly: result.data.totalSavingsKzt || 0,
            yearly: (result.data.totalSavingsKzt || 0) * 12,
            co2Reduced: co2ReducedKg,
            ecoScore: resolvedScore
          },
          summary: result.data.summary,
          score: resolvedScore,
          status: resolvedStatus,
          detailedMetrics,
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

      {/* --------------------------------------------------------------------- */}
      {/* HEADER NAVBAR                                                          */}
      {/* --------------------------------------------------------------------- */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-emerald-100/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between gap-6">
          
          {/* Logo */}
          <div 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-100/90 border border-emerald-300/60 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
              <Leaf className="w-5.5 h-5.5 fill-emerald-500/20 text-emerald-600" />
            </div>
            <span className="text-2xl font-black tracking-tight text-[#16A34A]">
              EcoAi
            </span>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-600">
            <button 
              type="button"
              onClick={() => scrollToSection(audienceRef)}
              className="hover:text-[#16A34A] transition-colors cursor-pointer"
            >
              Для кого
            </button>

            <button 
              type="button"
              onClick={() => scrollToSection(featuresRef)}
              className="hover:text-[#16A34A] transition-colors cursor-pointer"
            >
              Возможности
            </button>

            <button 
              type="button"
              onClick={() => scrollToSection(howItWorksRef)}
              className="hover:text-[#16A34A] transition-colors cursor-pointer"
            >
              Как это работает
            </button>

            <button 
              type="button"
              onClick={() => scrollToSection(calculatorRef)}
              className="hover:text-[#16A34A] transition-colors cursor-pointer"
            >
              Калькулятор
            </button>

            <button 
              type="button"
              onClick={() => {
                setShowContactModal(true);
                scrollToSection(contactsRef);
              }}
              className="hover:text-[#16A34A] transition-colors cursor-pointer"
            >
              Контакты
            </button>
          </nav>

          {/* Action Header Buttons & Auth */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {userLoggedIn ? (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold">
                <User className="w-4 h-4 text-emerald-600" />
                <span>{userName || 'Пользователь'}</span>
                <button
                  type="button"
                  onClick={() => {
                    setUserLoggedIn(false);
                    setUserName('');
                    localStorage.removeItem('ecoaiUser');
                  }}
                  className="ml-1 text-xs text-slate-400 hover:text-red-500 cursor-pointer"
                >
                  (Выйти)
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setIsAuthOpen(true);
                  }}
                  className="px-4 py-2 rounded-full text-xs sm:text-sm font-semibold text-slate-700 hover:text-emerald-600 hover:bg-emerald-50/60 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Войти</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setIsAuthOpen(true);
                  }}
                  className="px-4 py-2 rounded-full text-xs sm:text-sm font-semibold text-white bg-[#22C55E] hover:bg-[#16A34A] shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Зарегистрироваться</span>
                </button>
              </>
            )}
          </div>

        </div>
      </header>

      {/* --------------------------------------------------------------------- */}
      {/* HERO SECTION                                                          */}
      {/* --------------------------------------------------------------------- */}
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

      {/* --------------------------------------------------------------------- */}
      {/* AUDIENCE SELECTOR SECTION ("ДЛЯ КОГО")                                 */}
      {/* --------------------------------------------------------------------- */}
      <section ref={audienceRef} className="max-w-7xl mx-auto px-4 sm:px-8 py-16 scroll-mt-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-[#16A34A] uppercase tracking-wider block mb-1">
            ДЛЯ КОГО СОЗДАН ECOAI
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Решения для любой задачи
          </h2>
          <p className="text-slate-600 mt-3 text-base">
            EcoAi адаптирует свои ИИ-алгоритмы под ваши тарифные ставки и структуру потребления
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div 
            onClick={() => { setCategory('households'); scrollToSection(calculatorRef); }}
            className={`p-6 sm:p-8 rounded-3xl border transition-all cursor-pointer group ${
              category === 'households'
                ? 'bg-white border-[#22C55E] shadow-xl ring-2 ring-emerald-500/20'
                : 'bg-white/80 border-slate-200/80 hover:bg-white hover:border-emerald-300 shadow-sm'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Home className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Домохозяйства</h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              Оптимизация счетов за свет и воду для квартир и частных домов. Быстрый окупаемый эффект.
            </p>
            <span className="text-xs font-bold text-[#16A34A] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Рассчитать для дома <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          <div 
            onClick={() => { setCategory('schools'); scrollToSection(calculatorRef); }}
            className={`p-6 sm:p-8 rounded-3xl border transition-all cursor-pointer group ${
              category === 'schools'
                ? 'bg-white border-[#22C55E] shadow-xl ring-2 ring-emerald-500/20'
                : 'bg-white/80 border-slate-200/80 hover:bg-white hover:border-emerald-300 shadow-sm'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Школы и ВУЗы</h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              Интерактивный эко-контроль ресурсов и экологическое просвещение учащихся.
            </p>
            <span className="text-xs font-bold text-sky-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Рассчитать для школы <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          <div 
            onClick={() => { setCategory('business'); scrollToSection(calculatorRef); }}
            className={`p-6 sm:p-8 rounded-3xl border transition-all cursor-pointer group ${
              category === 'business'
                ? 'bg-white border-[#22C55E] shadow-xl ring-2 ring-emerald-500/20'
                : 'bg-white/80 border-slate-200/80 hover:bg-white hover:border-emerald-300 shadow-sm'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Бизнес и Организации</h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              ESG-мониторинг, снижения пиковых расходов электроэнергии и аудиты для коммерческих объектов.
            </p>
            <span className="text-xs font-bold text-amber-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Рассчитать для бизнеса <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* FEATURES SECTION ("ВОЗМОЖНОСТИ")                                     */}
      {/* --------------------------------------------------------------------- */}
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

      {/* --------------------------------------------------------------------- */}
      {/* HOW IT WORKS SECTION ("КАК ЭТО РАБОТАЕТ")                             */}
      {/* --------------------------------------------------------------------- */}
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

      {/* --------------------------------------------------------------------- */}
      {/* CALCULATOR SECTION ("КАЛЬКУЛЯТОР")                                    */}
      {/* --------------------------------------------------------------------- */}
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
                <Home className="w-3.5 h-3.5" />
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
              
              {/* Water Input with Dynamic Category Hint */}
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

              {/* Electricity Input with Dynamic Category Hint */}
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

              {/* Waste Input with Dynamic Category Hint */}
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

        <div className="mt-8 bg-white/80 border border-slate-200/80 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700">
              <Droplet className="w-5 h-5" />
            </div>
            <h3 className="text-2xl font-black text-slate-900">{activeWaterProfile.heading}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                {activeWaterProfile.peopleLabel}
              </label>
              <input
                type="number"
                min="1"
                max={category === 'schools' ? '2000' : category === 'business' ? '5000' : '20'}
                value={waterPeopleCount}
                onChange={(e) => setWaterPeopleCount(Math.max(1, Number(e.target.value || 1)))}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-lg font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                {activeWaterProfile.usageLabel}
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={waterDemoUsage}
                onChange={(e) => setWaterDemoUsage(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-lg font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className={`inline-flex items-center px-3.5 py-2 rounded-full text-sm font-bold ${waterDemoStatus.tone}`}>
            {waterDemoStatus.label}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-5">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Фактическое</div>
              <div className="text-2xl font-black text-slate-900">{waterDemoActual.toFixed(1)} м³</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Ориентир</div>
              <div className="text-2xl font-black text-slate-900">{waterDemoTarget.toFixed(1)} м³</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Превышение</div>
              <div className={`text-2xl font-black ${waterDemoStatus.accent}`}>
                {waterDemoTarget > 0 ? `${Math.max(0, waterDemoDelta).toFixed(1)}%` : '0.0%'}
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Рекомендация</div>
              <div className="text-sm font-semibold text-slate-700 leading-relaxed">
                {waterDemoStatus.recommendation}
              </div>
            </div>
          </div>

          <p className="mt-5 text-xs text-slate-500 leading-relaxed">
            Эти значения являются демонстрационными ориентирами: ориентир основан на 150 л/сутки на человека, что примерно равно 4,5 м³ на человека в месяц. В дальнейшем эти данные будут заменены на подтверждённые показатели для Казахстана.
          </p>
        </div>

        <div className="mt-8 bg-white/80 border border-slate-200/80 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700">
              <Flame className="w-5 h-5" />
            </div>
            <h3 className="text-2xl font-black text-slate-900">{activeAdviceProfile.heading}</h3>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <div className={`${activeAdviceProfile.gasStyle} rounded-2xl p-5`}>
              <div className="flex items-center gap-2 mb-4">
                <Flame className="w-5 h-5 text-amber-600" />
                <h4 className="text-lg font-black text-amber-800">{activeAdviceProfile.gasTitle}</h4>
              </div>
              <ul className={`space-y-3 text-sm leading-relaxed ${activeAdviceProfile.gasText}`}>
                {activeAdviceProfile.gasBullets.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>

            <div className={`${activeAdviceProfile.electricStyle} rounded-2xl p-5`}>
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-emerald-600" />
                <h4 className="text-lg font-black text-emerald-800">{activeAdviceProfile.electricityTitle}</h4>
              </div>
              <ul className={`space-y-3 text-sm leading-relaxed ${activeAdviceProfile.electricText}`}>
                {activeAdviceProfile.electricityBullets.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-amber-600" />
              <h4 className="text-lg font-black text-slate-900">Примерно сколько выходит электроэнергии</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.values(typicalElectricityByCategory).map((item) => (
                <div
                  key={item.label}
                  className={`rounded-2xl border p-4 ${
                    item.label === electricityCategoryEstimate.label
                      ? 'border-emerald-300 bg-emerald-50'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="text-sm font-bold text-slate-500 mb-2">{item.label}</div>
                  <div className="text-2xl font-black text-slate-900 mb-2">{item.range}</div>
                  <p className="text-sm text-slate-600 leading-relaxed">{item.note}</p>
                  <p className="mt-3 text-xs font-semibold text-emerald-700">{item.example}</p>
                </div>
              ))}
            </div>

            <p className="mt-4 text-sm text-slate-600 leading-relaxed">
              Для текущей категории <span className="font-bold text-slate-900">{electricityCategoryEstimate.label}</span> типичный ориентир составляет примерно <span className="font-bold text-emerald-700">{electricityCategoryEstimate.range}</span> в месяц. Это оценка для демонстрации, а не официальный норматив.
            </p>
          </div>
        </div>

        {analysisResult && (
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
        )}
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* CONTACTS SECTION ("КОНТАКТЫ")                                         */}
      {/* --------------------------------------------------------------------- */}
      <section ref={contactsRef} className="max-w-5xl mx-auto px-4 sm:px-6 py-16 scroll-mt-24">
        <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-100">
          
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-xs font-bold text-[#16A34A] uppercase tracking-wider block mb-1">
              СВЯЗАТЬСЯ С НАМИ
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900">
              Есть вопросы или предложения?
            </h2>
            <p className="text-slate-600 mt-2 text-sm">
              Мы всегда открыты к сотрудничеству с жителями, школами и эко-инициативами
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <a 
              href="mailto:sayan0ismadyarov@gmail.com" 
              className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/40 transition-all flex flex-col items-center text-center group"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Mail className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Email</span>
              <span className="text-sm font-bold text-slate-900 group-hover:text-[#16A34A] transition-colors break-all">
                sayan0ismadyarov@gmail.com
              </span>
            </a>

            <a 
              href="https://t.me/S5ayan99" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-sky-300 hover:bg-sky-50/40 transition-all flex flex-col items-center text-center group"
            >
              <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Send className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Telegram</span>
              <span className="text-sm font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                @S5ayan99
              </span>
            </a>

            <a 
              href="https://wa.me/77755135423" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/40 transition-all flex flex-col items-center text-center group"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">WhatsApp</span>
              <span className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                +7 775 513 5423
              </span>
            </a>

          </div>

        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* AUTH MODAL (LOGIN / REGISTER)                                          */}
      {/* --------------------------------------------------------------------- */}
      {isAuthOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6">
            
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsAuthOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Title */}
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <Leaf className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-black text-slate-900">
                {authMode === 'login' ? 'Вход в EcoAi' : 'Регистрация в EcoAi'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {authMode === 'login' ? 'Войдите для сохранения истории расчетов' : 'Создайте аккаунт для эко-мониторинга'}
              </p>
            </div>

            {/* Auth Mode Toggle Tabs */}
            <div className="bg-slate-100 p-1 rounded-2xl flex items-center text-xs font-bold">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`w-full py-2.5 rounded-xl transition-all cursor-pointer ${
                  authMode === 'login' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Вход
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className={`w-full py-2.5 rounded-xl transition-all cursor-pointer ${
                  authMode === 'register' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Регистрация
              </button>
            </div>

            {authError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {authError}
              </div>
            )}

            {/* Form */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setAuthError('');

                try {
                  const payload = authMode === 'register'
                    ? {
                        name: authName.trim(),
                        email: authEmail.trim(),
                        password: authPassword,
                      }
                    : {
                        email: authEmail.trim(),
                        password: authPassword,
                      };

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
              }}
              className="space-y-4"
            >
              {authMode === 'register' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Ваше имя</label>
                  <div className="relative flex items-center">
                    <User className="w-4 h-4 absolute left-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Алихан"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      required
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Email</label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 absolute left-3 text-slate-400" />
                  <input
                    type="email"
                    placeholder="example@ecoai.kz"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    required
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Пароль</label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 absolute left-3 text-slate-400" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    required
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer mt-2"
              >
                {authMode === 'login' ? 'Войти в аккаунт' : 'Зарегистрироваться'}
              </button>
            </form>

          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* QUICK CONTACT MODAL                                                   */}
      {/* --------------------------------------------------------------------- */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6">
            <button
              type="button"
              onClick={() => setShowContactModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <PhoneCall className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-black text-slate-900">
                Контакты EcoAi
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Свяжитесь с командой разработчиков проекта
              </p>
            </div>

            <div className="space-y-3">
              <a 
                href="mailto:sayan0ismadyarov@gmail.com"
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3 hover:border-emerald-300 transition-all"
              >
                <Mail className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="text-xs overflow-hidden text-ellipsis">
                  <span className="text-slate-400 block font-semibold">Email</span>
                  <span className="font-bold text-slate-800">sayan0ismadyarov@gmail.com</span>
                </div>
              </a>

              <a 
                href="https://t.me/S5ayan99"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3 hover:border-sky-300 transition-all"
              >
                <Send className="w-5 h-5 text-sky-500 shrink-0" />
                <div className="text-xs">
                  <span className="text-slate-400 block font-semibold">Telegram</span>
                  <span className="font-bold text-slate-800">@S5ayan99</span>
                </div>
              </a>

              <a 
                href="https://wa.me/77755135423"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3 hover:border-emerald-300 transition-all"
              >
                <MessageSquare className="w-5 h-5 text-emerald-500 shrink-0" />
                <div className="text-xs">
                  <span className="text-slate-400 block font-semibold">WhatsApp</span>
                  <span className="font-bold text-slate-800">+7 775 513 5423</span>
                </div>
              </a>
            </div>

            <button
              type="button"
              onClick={() => setShowContactModal(false)}
              className="w-full py-3 bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold rounded-xl transition-all cursor-pointer"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-200/60 py-8 text-center text-xs text-slate-500">
        <p>© 2026 EcoAi — Казахстанский эко-трек. Все права защищены.</p>
      </footer>

    </div>
  );
}
