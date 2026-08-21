import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import OpenAI from 'openai';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5001;
const ALLOWED_CATEGORIES = new Set(['home', 'school', 'business']);
const DEFAULT_ALLOWED_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];
const EXTRA_ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const VITE_ALLOWED_ORIGINS = [...new Set([...DEFAULT_ALLOWED_ORIGINS, ...EXTRA_ALLOWED_ORIGINS])];
const users = new Map();

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

app.disable('x-powered-by');
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || VITE_ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Origin not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derivedKey}`;
}

function verifyPassword(password, passwordHash) {
  const [salt, storedHash] = String(passwordHash).split(':');

  if (!salt || !storedHash) {
    return false;
  }

  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  const storedBuffer = Buffer.from(storedHash, 'hex');
  const derivedBuffer = Buffer.from(derivedKey, 'hex');

  return storedBuffer.length === derivedBuffer.length && crypto.timingSafeEqual(storedBuffer, derivedBuffer);
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function normalizeStatus(score) {
  if (score >= 80) return 'ОТЛИЧНЫЙ';
  if (score >= 50) return 'НОРМАЛЬНЫЙ';
  return 'КРИТИЧЕСКИЙ';
}

function normalizeStatusValue(status) {
  const normalized = String(status || '').trim().toLowerCase();

  if (normalized === 'отличный' || normalized === 'excellent' || normalized === 'отлично') return 'ОТЛИЧНЫЙ';
  if (normalized === 'нормальный' || normalized === 'normal' || normalized === 'норм') return 'НОРМАЛЬНЫЙ';
  if (normalized === 'критический' || normalized === 'critical' || normalized === 'warning' || normalized === 'требует внимания' || normalized === 'требуетвнимания') return 'КРИТИЧЕСКИЙ';

  return 'НОРМАЛЬНЫЙ';
}

function formatCategory(category) {
  const labels = {
    home: 'Дом',
    school: 'Школа',
    business: 'Бизнес',
  };

  return labels[category] || 'Дом';
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function validatePayload(payload) {
  const errors = [];
  const { category, waterAmount, electricityKwh, wasteKg, recycledPercent } = payload;

  if (typeof category !== 'string' || !ALLOWED_CATEGORIES.has(category)) {
    errors.push('category должен быть одним из: home, school, business');
  }

  if (!isFiniteNumber(Number(waterAmount))) {
    errors.push('waterAmount должен быть числом');
  }

  if (!isFiniteNumber(Number(electricityKwh))) {
    errors.push('electricityKwh должен быть числом');
  }

  if (!isFiniteNumber(Number(wasteKg))) {
    errors.push('wasteKg должен быть числом');
  }

  if (!isFiniteNumber(Number(recycledPercent))) {
    errors.push('recycledPercent должен быть числом');
  }

  const numericValues = {
    waterAmount: Number(waterAmount),
    electricityKwh: Number(electricityKwh),
    wasteKg: Number(wasteKg),
    recycledPercent: Number(recycledPercent),
  };

  if (numericValues.waterAmount < 0) errors.push('waterAmount не может быть отрицательным');
  if (numericValues.electricityKwh < 0) errors.push('electricityKwh не может быть отрицательным');
  if (numericValues.wasteKg < 0) errors.push('wasteKg не может быть отрицательным');
  if (numericValues.recycledPercent < 0 || numericValues.recycledPercent > 100) {
    errors.push('recycledPercent должен быть в диапазоне от 0 до 100');
  }

  return {
    isValid: errors.length === 0,
    errors,
    values: {
      category: String(category).trim().toLowerCase(),
      waterAmount: Number(waterAmount),
      electricityKwh: Number(electricityKwh),
      wasteKg: Number(wasteKg),
      recycledPercent: Number(recycledPercent),
    },
  };
}

function buildFallbackResult(category, values) {
  const categoryBenchmarks = {
    home: { water: 15, electricity: 300, waste: 40 },
    school: { water: 200, electricity: 4000, waste: 140 },
    business: { water: 500, electricity: 7000, waste: 330 },
  };

  const baseline = categoryBenchmarks[category] || categoryBenchmarks.home;
  const waterScore = clamp(Math.round(100 - ((values.waterAmount / baseline.water) - 1) * 100), 0, 100);
  const electricityScore = clamp(Math.round(100 - ((values.electricityKwh / baseline.electricity) - 1) * 100), 0, 100);
  const wasteScore = clamp(
    Math.round(100 - ((values.wasteKg / baseline.waste) - 1) * 100 + values.recycledPercent * 0.45),
    0,
    100
  );

  const score = clamp(
    Math.round((waterScore + electricityScore + wasteScore) / 3 + values.recycledPercent * 0.15),
    1,
    100
  );

  const status = normalizeStatus(score);
  const bathsCount = Math.max(1, Math.round((values.waterAmount * 1000) / 150));
  const bulbHours = Math.max(1, Math.round((values.electricityKwh * 1000) / 10));
  const wasteBags = Math.max(1, Math.round(values.wasteKg / 8));

  const comparisonWater = values.waterAmount <= baseline.water
    ? `ниже среднего по РК для ${formatCategory(category).toLowerCase()} на ${Math.max(1, Math.round((1 - values.waterAmount / baseline.water) * 100))}%`
    : `выше среднего по РК для ${formatCategory(category).toLowerCase()} на ${Math.max(1, Math.round(((values.waterAmount / baseline.water) - 1) * 100))}%`;

  const comparisonElectricity = values.electricityKwh <= baseline.electricity
    ? `ниже типичного уровня по РК на ${Math.max(1, Math.round((1 - values.electricityKwh / baseline.electricity) * 100))}%`
    : `выше типичного уровня по РК на ${Math.max(1, Math.round(((values.electricityKwh / baseline.electricity) - 1) * 100))}%`;

  const comparisonWaste = values.wasteKg <= baseline.waste
    ? `соответствует или ниже среднего по РК для ${formatCategory(category).toLowerCase()}`
    : `выше среднего по РК для ${formatCategory(category).toLowerCase()} на ${Math.max(1, Math.round(((values.wasteKg / baseline.waste) - 1) * 100))}%`;

  const summary = `Для категории "${formatCategory(category)}" показатели находятся в оценке "${status}" относительно средних норм по Казахстану. По воде это ${comparisonWater}, по электроэнергии — ${comparisonElectricity}, а по отходам — ${comparisonWaste}, поэтому есть потенциал для экономии и повышения сортировки.`;

  const metrics = {
    water: `Расход воды находится ${comparisonWater}; это примерно эквивалентно ${bathsCount} полным ваннам воды, что помогает оценить реальный уровень потребления в условиях РК.`,
    electricity: `Электропотребление ${comparisonElectricity}; это примерно ${bulbHours.toLocaleString('ru-RU')} часов работы LED-лампочки мощностью 10 Вт, что важно для сезонной нагрузки летом и в отопительный период.`,
    waste: `Объем отходов ${comparisonWaste}; это примерно ${wasteBags} мешков по 8 кг, а уровень переработки ${values.recycledPercent}% показывает, насколько эффективно действует инфраструктура сортировки в Казахстане.`,
  };

  const issueMap = {
    water: values.waterAmount > baseline.water,
    electricity: values.electricityKwh > baseline.electricity,
    waste: values.wasteKg > baseline.waste,
  };

  const activeIssues = Object.entries(issueMap)
    .filter(([, isActive]) => isActive)
    .map(([key]) => key);

  let recommendations = [
    'Совет не требуется: показатели уже находятся в оптимальном диапазоне по РК.',
    'Совет не требуется: текущий уровень эффективности соответствует устойчивым нормам потребления в Казахстане.',
    'Совет не требуется: дальнейшие улучшения рассматриваются только как добровольное повышение эффективности.'
  ];

  if (activeIssues.length > 0) {
    const sortedIssues = activeIssues.slice(0, 3);
    const perIssueRecommendations = {
      water: {
        home: [
          'Для дома проверьте и устраните утечки в кранах, toilet flush и трубах: даже небольшая капельная утечка в РК заметно повышает месячный расход воды.',
          'Для дома подключите счетчики воды по комнатам и настройте таймеры на полив/стирку, чтобы снизить нецелевое потребление.',
          'Для дома замените старую сантехнику на экономичные смесители и душевые насадки, чтобы сократить водопотребление без потери комфорта.'
        ],
        school: [
          'Для школы проверьте сантехнику в туалетах, умывальниках и системах полива: высокая нагрузка на дневные часы часто вызывает лишний расход воды.',
          'Для школы задайте график обслуживания кранов, сливов и систем полива, чтобы снизить утечки в учебном корпусе и на дворе.',
          'Для школы модернизируйте санитарные узлы и душевые точки на экономичную арматуру, чтобы уменьшить расход воды во время пиковых нагрузок.'
        ],
        business: [
          'Для бизнеса проверьте утечки на производственных участках, в кухнях и санитарных узлах: даже небольшие потери воды резко повышают коммунальные расходы.',
          'Для бизнеса объедините учет воды по цехам и сменам, чтобы быстро выявлять зоны с лишними расходами и сократить потери в реальные сроки.',
          'Для бизнеса установите экономичные смесители и системы автоматики на водоснабжение, чтобы снизить расход без потери производительности.'
        ]
      },
      electricity: {
        home: [
          'Для дома отключайте неиспользуемые приборы от розетки и переведите освещение на LED, чтобы сократить бытовое потребление электроэнергии.',
          'Для дома подключите таймеры и умные розетки для техники и обогревателей, чтобы уменьшить нагрузку в ночное время и при отсутствии людей дома.',
          'Для дома проверьте кондиционеры, бойлеры и электроплиты на режимы экономии, чтобы снизить расход летом и в холодный сезон.'
        ],
        school: [
          'Для школы переведите освещение в аудиториях, коридорах и спортзале на LED и настройте автоматическое отключение по расписанию.',
          'Для школы проверьте работу климатических систем и освещения по классам, чтобы сократить лишнюю нагрузку во время перерывов и каникул.',
          'Для школы внедрите мониторинг потребления по корпусам и аудиториям, чтобы быстро находить зоны с повышенным расходом энергии.'
        ],
        business: [
          'Для бизнеса переведите офисы и производство на LED-освещение и автоматические режимы энергосбережения по сменам.',
          'Для бизнеса настройте мониторинг потребления по цехам и отделам, чтобы видеть зоны перегруза и снижать затраты на электроэнергию.',
          'Для бизнеса оптимизируйте работу климатических систем, насосов и производственного оборудования, чтобы сократить нагрузку в пиковые часы.'
        ]
      },
      waste: {
        home: [
          'Для дома организуйте раздельный сбор бумаги, пластика и стекла и сдавайте вторсырье в местные пункты приема, чтобы сократить бытовой мусор.',
          'Для дома уменьшите объем органических отходов через компостирование и правильное хранение, чтобы снизить общий вес мусора и повысить переработку.',
          'Для дома используйте многоразовую упаковку и контейнеры, чтобы постепенно сократить количество одноразового мусора и улучшить сортировку.'
        ],
        school: [
          'Для школы организуйте раздельный сбор отходов в столовой, кабинетах и рекреационных зонах, чтобы уменьшить объем мусора и вовлечь учеников в экологическую культуру.',
          'Для школы наладьте контейнеры для пластика, бумаги и стекла в удобных местах, чтобы повысить сортировку и снизить вывоз мусора.',
          'Для школы договоритесь с локальными пунктами приема вторсырья, чтобы обеспечить регулярный вывоз перерабатываемых материалов и уменьшить нагрузку на свалки.'
        ],
        business: [
          'Для бизнеса внедрите раздельный сбор по типам сырья и заключите договор с локальными приемными пунктами, чтобы сократить объем отходов и повысить переработку.',
          'Для бизнеса организуйте отдельные контейнеры для пластика, бумаги и стекла по каждому подразделению, чтобы поднять качество сортировки и уменьшить вывоз мусора.',
          'Для бизнеса пересмотрите упаковку и схемы логистики, чтобы уменьшить количество отходов на производстве и в офисных процессах.'
        ]
      }
    };

    recommendations = [];

    sortedIssues.forEach((issue) => {
      recommendations.push(...perIssueRecommendations[issue][category]);
    });

    recommendations = recommendations.slice(0, 3);
  }

  return {
    score,
    status,
    summary,
    metrics,
    recommendations,
  };
}

function sanitizeAiResponse(raw) {
  if (typeof raw !== 'string') {
    return null;
  }

  let cleaned = raw.trim().replace(/^\uFEFF/, '');

  cleaned = cleaned.replace(/```json\s*/gi, '').replace(/```/g, '').trim();

  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');

  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.slice(start, end + 1);
  }

  return cleaned;
}

function normalizeAiResult(payload) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const score = Number(payload.score);
  const status = normalizeStatusValue(payload.status);

  const metrics = payload.metrics && typeof payload.metrics === 'object'
    ? {
        water: String(payload.metrics.water || '').trim(),
        electricity: String(payload.metrics.electricity || '').trim(),
        waste: String(payload.metrics.waste || '').trim(),
      }
    : null;

  const recommendations = Array.isArray(payload.recommendations)
    ? payload.recommendations
        .map((item) => String(item).trim())
        .filter((item) => item.length > 0)
        .slice(0, 3)
    : [];

  if (!payload.summary || typeof payload.summary !== 'string' || !payload.summary.trim()) {
    return null;
  }

  if (!metrics || !metrics.water || !metrics.electricity || !metrics.waste) {
    return null;
  }

  if (recommendations.length < 3) {
    return null;
  }

  if (!Number.isFinite(score)) {
    return null;
  }

  return {
    score: clamp(Math.round(score), 1, 100),
    status,
    summary: payload.summary.trim(),
    metrics,
    recommendations,
  };
}

function enforceHighScoreNoAdvice(result, category) {
  if (!result || !Number.isFinite(result.score) || result.score < 90) {
    return result;
  }

  const categoryLabel = formatCategory(category);

  return {
    ...result,
    status: 'ОТЛИЧНЫЙ',
    summary: `Для категории "${categoryLabel}" показатели находятся в оптимальном диапазоне по Казахстану. Дополнительный совет не требуется: текущий уровень эффективности уже соответствует высоким стандартам ресурсоэффективности.`,
    recommendations: [
      `Совет не требуется: для ${categoryLabel.toLowerCase()} показатели уже находятся в оптимальном диапазоне по РК.`,
      `Совет не требуется: текущий уровень эффективности соответствует устойчивым нормам потребления в Казахстане.`,
      `Совет не требуется: дальнейшие улучшения можно рассматривать только как добровольное повышение эффективности, но они не обязательны.`
    ],
  };
}

async function generateAiInsight(category, values) {
  if (!openai) {
    return null;
  }

  const systemPrompt = `Ты — строгий эко-аудитор сервиса EcoAI в Казахстане. Твоя задача — динамически проанализировать переданные цифры и выявить аномалии относительно норм и средних значений по РК.

БЕНЧМАРКИ ДЛЯ СРАВНЕНИЯ:
1. Дом (home):
   - Вода: норма 5–15 м³/мес. Если >20 м³ — аномалия, возможна утечка.
   - Свет: норма 150–300 кВт·ч/мес. Если >400 кВт·ч — высокий расход.
   - Мусор: норма 20–40 кг/мес.
2. Школа (school):
   - Вода: норма 80–200 м³/мес.
   - Свет: норма 1500–4000 кВт·ч/мес.
3. Бизнес (business):
   - Оценивай по пропорциям: офис/сфера/производство, но всегда сравнивай с типичными коммерческими объектами РК.

СТРОГИЕ ПРАВИЛА:
1. Запрещено писать сухие шаблоны вроде «Месячный расход воды равен X м³».
2. В каждом блоке metrics.water, metrics.electricity, metrics.waste обязателен динамический анализ относительно нормы и аномалии.
3. Должны быть конкретные сравнения, например: «Расход 110 м³ превышает норму для дома в 8 раз! Возможна утечка в системе» или «200 кВт·ч — отличный показатель экономного потребления».
4. ВАЖНО: recommendations должны быть уникальными и строго привязаны к category. Нельзя повторять одинаковые советы для home, school и business.
5. Для category = home: советы должны быть про бытовые утечки, счетчики, домашнюю технику, ЖКХ, хозяйственные привычки и раздельный сбор мусора.
6. Для category = school: советы должны быть про школьную сантехнику, освещение классов, столовую, график нагрузок, режимы работы и сортировку отходов в учебном учреждении.
7. Для category = business: советы должны быть про коммерческое потребление, цеха/офисы, технический учет, энергоуправление, автоматизацию и переработку в рамках бизнеса.
8. Нельзя использовать общие фразы вроде «проверьте счетчики» для всех категорий. Для дома это бытовые счетчики и утечки, для школы — образовательный корпус и столовая, для бизнеса — зоны, смены, оборудование и коммерческие системы.
9. Если показатель воды критический, 2 из 3 советов должны быть про сантехнику, утечки, счетчики, смесители, ремонт и экономию воды.
10. Если показатель электричества критический, 2 из 3 советов должны быть про энергосбережение, LED, таймеры, нагрузку, автоматизацию и управление оборудованием.
11. Если показатель отходов критический, 2 из 3 советов должны быть про сортировку, вторсырье, контейнеры и локальные пункты приема в Казахстане.
12. Если score >= 90, то summary должен прямо указывать: «Дополнительный совет не требуется: показатели находятся на очень высоком уровне и соответствуют экономному уровню по РК».
13. Если score >= 90, то recommendations должны быть не про экономию, а явно содержать фразу: «Совет не требуется: показатели уже находятся в оптимальном диапазоне по РК».
14. Если score < 90, то рекомендации должны быть привязаны только к реальным проблемным зонам. Не давай советы по воде, если вода в норме; не давай советы по электричеству, если свет в норме; не давай советы по отходам, если мусор в норме.
15. Если вода и свет в норме, а отходы выше нормы, в recommendations должны быть только советы про отходы и сортировку.
16. Если вода выше нормы, а электричество и отходы в норме, в recommendations должны быть только советы про воду.
17. Если электричество выше нормы, а вода и отходы в норме, в recommendations должны быть только советы про электричество.
18. Дай 3 конкретных совета, строго привязанных к горячей проблеме и к category. Но если score >= 90, вместо обычных рекомендаций используй именно фразы с указанием, что совет не нужен.
19. Категория обязательно должна звучать в советах: для дома — «Для дома», для школы — «Для школы», для бизнеса — «Для бизнеса».
20. Возвращай только JSON без markdown и без текста до/после него.
21. status — только одно из: "ОТЛИЧНЫЙ", "НОРМАЛЬНЫЙ", "КРИТИЧЕСКИЙ".
22. summary — 2 предложения, динамический вывод о главных проблемах.
23. metrics — объект с ключами water, electricity, waste.
24. recommendations — массив из 3 строк.
25. При оценке учитывай климат и инфраструктуру Казахстана: летняя жара, кондиционирование, отопительный сезон, местные пункты вторичной переработки, энергоэффективность и бухгалтерский учет по расходам.`;

  const userPrompt = JSON.stringify({
    category: formatCategory(category),
    waterAmount: values.waterAmount,
    electricityKwh: values.electricityKwh,
    wasteKg: values.wasteKg,
    recycledPercent: values.recycledPercent,
  });

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices?.[0]?.message?.content;
    const cleaned = sanitizeAiResponse(raw);

    if (!cleaned) {
      return null;
    }

    try {
      const parsed = JSON.parse(cleaned);
      const normalized = normalizeAiResult(parsed);
      return normalized;
    } catch (parseError) {
      const match = cleaned.match(/\{[\s\S]*\}/);

      if (!match) {
        return null;
      }

      try {
        const parsed = JSON.parse(match[0]);
        return normalizeAiResult(parsed);
      } catch {
        return null;
      }
    }
  } catch (error) {
    console.warn('OpenAI model request failed:', error.message);
    return null;
  }
}

app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'EcoAI backend is running.',
    endpoints: {
      health: '/api/health',
      calculate: 'POST /api/calculate',
    },
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'API is healthy' });
});

app.get('/api/calculate', (_req, res) => {
  res.json({
    success: true,
    message: 'Use POST /api/calculate with category, waterAmount, electricityKwh, wasteKg, recycledPercent.',
  });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body ?? {};
  const cleanName = String(name || '').trim();
  const normalizedEmail = normalizeEmail(email);
  const cleanPassword = String(password || '');

  if (!cleanName || cleanName.length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Имя должно содержать минимум 2 символа.',
    });
  }

  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({
      success: false,
      message: 'Введите корректный email.',
    });
  }

  if (cleanPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Пароль должен содержать минимум 6 символов.',
    });
  }

  if (users.has(normalizedEmail)) {
    return res.status(409).json({
      success: false,
      message: 'Пользователь с таким email уже зарегистрирован.',
    });
  }

  const user = {
    id: crypto.randomUUID(),
    name: cleanName,
    email: normalizedEmail,
    passwordHash: hashPassword(cleanPassword),
  };

  users.set(normalizedEmail, user);

  return res.status(201).json({
    success: true,
    token: generateToken(),
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body ?? {};
  const normalizedEmail = normalizeEmail(email);
  const cleanPassword = String(password || '');

  if (!normalizedEmail || !cleanPassword) {
    return res.status(400).json({
      success: false,
      message: 'Email и пароль обязательны.',
    });
  }

  const user = users.get(normalizedEmail);

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Пользователь не найден. Проверьте email или зарегистрируйтесь.',
    });
  }

  if (!verifyPassword(cleanPassword, user.passwordHash)) {
    return res.status(401).json({
      success: false,
      message: 'Неверный пароль.',
    });
  }

  return res.json({
    success: true,
    token: generateToken(),
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });
});

app.post('/api/calculate', async (req, res, next) => {
  try {
    const payload = req.body ?? {};
    const validation = validatePayload(payload);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Некорректные данные запроса.',
        details: validation.errors,
      });
    }

    const { category, waterAmount, electricityKwh, wasteKg, recycledPercent } = validation.values;
    const normalizedCategory = category;

    const aiResult = await generateAiInsight(normalizedCategory, {
      waterAmount,
      electricityKwh,
      wasteKg,
      recycledPercent,
    });

    const finalResult = enforceHighScoreNoAdvice(
      aiResult || buildFallbackResult(normalizedCategory, {
        waterAmount,
        electricityKwh,
        wasteKg,
        recycledPercent,
      }),
      normalizedCategory
    );

    return res.status(200).json({
      success: true,
      data: {
        score: finalResult.score,
        status: finalResult.status,
        summary: finalResult.summary,
        metrics: {
          water: finalResult.metrics.water,
          electricity: finalResult.metrics.electricity,
          waste: finalResult.metrics.waste,
        },
        recommendations: finalResult.recommendations,
      },
    });
  } catch (error) {
    next(error);
  }
});

app.use((err, _req, res, _next) => {
  console.error('Unhandled server error:', err);

  const statusCode = err.statusCode || 500;
  const message = statusCode === 500
    ? 'Произошла внутренняя ошибка сервера.'
    : err.message || 'Ошибка запроса.';

  res.status(statusCode).json({
    success: false,
    error: statusCode === 500 ? 'Internal Server Error' : 'Bad Request',
    message,
  });
});

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: 'Запрашиваемый endpoint не найден.',
  });
});

app.listen(PORT, () => {
  console.log(`EcoAI backend is running on http://localhost:${PORT}`);
});
