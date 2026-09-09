import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import OpenAI from 'openai';
import pkg from 'pg';
const { Pool } = pkg;

import {
  ALLOWED_CATEGORIES,
  KAZAKHSTAN_BENCHMARKS,
  METRIC_LABELS,
  RECOMMENDATIONS,
  clamp,
  normalizeStatus,
  formatCategory,
  formatCategoryGenitive,
  getBenchmarks,
  formatNumber,
  formatTimes,
  calculateSavingsKzt,
  calculateCo2 as calculateCo2Reduction,
} from '../shared/benchmarks.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5002;
const DEFAULT_ALLOWED_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];
const EXTRA_ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const VITE_ALLOWED_ORIGINS = [...new Set([...DEFAULT_ALLOWED_ORIGINS, ...EXTRA_ALLOWED_ORIGINS])];

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

await pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    "passwordHash" VARCHAR(255),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS analyses (
    id VARCHAR(255) PRIMARY KEY,
    "userId" VARCHAR(255),
    type VARCHAR(50),
    category VARCHAR(50),
    data_json TEXT,
    month_key VARCHAR(10),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`);

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

app.use(express.json({ limit: '1mb' }));

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

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }
  const token = authHeader.substring(7);
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [token]);
    req.user = rows[0] || null;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    req.user = null;
    next();
  }
}

function normalizeStatusValue(status) {
  const normalized = String(status || '').trim().toLowerCase();

  if (normalized === 'отличный' || normalized === 'excellent' || normalized === 'отлично') return 'ОТЛИЧНЫЙ';
  if (normalized === 'нормальный' || normalized === 'normal' || normalized === 'норм') return 'НОРМАЛЬНЫЙ';
  if (normalized === 'критический' || normalized === 'critical' || normalized === 'warning' || normalized === 'требует внимания' || normalized === 'требуетвнимания') return 'КРИТИЧЕСКИЙ';

  return 'НОРМАЛЬНЫЙ';
}

function getPayloadMetricValue(values, metricKey) {
  const valueMap = {
    water: values.waterAmount,
    electricity: values.electricityKwh,
    waste: values.wasteKg,
  };

  return valueMap[metricKey] ?? 0;
}

function calculateMetricScore(value, benchmark, metricKey, recycledPercent) {
  if (value <= 0) {
    return 35;
  }

  let score;

  if (value <= benchmark.typicalMin) {
    score = 98;
  } else if (value <= benchmark.typicalMax) {
    const position = (value - benchmark.typicalMin) / (benchmark.typicalMax - benchmark.typicalMin || 1);
    score = 98 - position * 8;
  } else if (value <= benchmark.high) {
    const position = (value - benchmark.typicalMax) / (benchmark.high - benchmark.typicalMax || 1);
    score = 89 - position * 29;
  } else if (value <= benchmark.critical) {
    const position = (value - benchmark.high) / (benchmark.critical - benchmark.high || 1);
    score = 59 - position * 34;
  } else {
    const overCriticalRatio = value / benchmark.critical;
    score = 24 / overCriticalRatio;
  }

  if (metricKey === 'waste') {
    score += Math.min(20, recycledPercent * 0.25);

    if (value > benchmark.critical) {
      score = Math.min(score, 45);
    } else if (value > benchmark.high) {
      score = Math.min(score, 65);
    } else if (value > benchmark.typicalMax) {
      score = Math.min(score, 82);
    }
  }

  return clamp(Math.round(score), 1, 100);
}

function buildMetricComparison(metricKey, value, benchmark) {
  const formattedValue = `${formatNumber(value)} ${benchmark.unit}`;
  const typicalRange = `${formatNumber(benchmark.typicalMin)}-${formatNumber(benchmark.typicalMax)} ${benchmark.unit}`;

  if (value <= 0) {
    return {
      severity: 'missing',
      isIssue: true,
      text: `${formattedValue}: нулевое значение не похоже на реальный месячный расход. Проверьте ввод или счетчики; честный рейтинг снижает балл, потому что данных недостаточно.`,
      summary: `${METRIC_LABELS[metricKey]} нет достоверных данных`,
    };
  }

  if (value > benchmark.critical) {
    const ratio = value / benchmark.typicalMax;
    return {
      severity: 'critical',
      isIssue: true,
      text: `${formattedValue}: критически выше среднего ориентира по РК (${typicalRange}) примерно в ${formatTimes(ratio)}. Это уже не "норма": возможны утечки, неучтенные зоны потребления или неверный режим эксплуатации.`,
      summary: `${METRIC_LABELS[metricKey]} критическое превышение`,
    };
  }

  if (value > benchmark.high) {
    const percent = Math.round(((value / benchmark.typicalMax) - 1) * 100);
    return {
      severity: 'high',
      isIssue: true,
      text: `${formattedValue}: высокий расход, выше верхней границы среднего ориентира по РК (${typicalRange}) на ${percent}%. Нужна проверка причин, иначе расходы будут стабильно завышены.`,
      summary: `${METRIC_LABELS[metricKey]} высокий расход`,
    };
  }

  if (value > benchmark.typicalMax) {
    const percent = Math.round(((value / benchmark.typicalMax) - 1) * 100);
    return {
      severity: 'above',
      isIssue: true,
      text: `${formattedValue}: выше среднего ориентира по РК (${typicalRange}) на ${percent}%. Это еще не аварийный уровень, но рейтинг честно снижает балл за перерасход.`,
      summary: `${METRIC_LABELS[metricKey]} есть перерасход`,
    };
  }

  if (value < benchmark.typicalMin) {
    const percent = Math.round((1 - value / benchmark.typicalMin) * 100);
    return {
      severity: 'ok',
      isIssue: false,
      text: `${formattedValue}: ниже среднего ориентира по РК (${typicalRange}) на ${percent}%. Показатель выглядит экономным, если данные введены за полный месяц.`,
      summary: `${METRIC_LABELS[metricKey]} экономный уровень`,
    };
  }

  return {
    severity: 'ok',
    isIssue: false,
    text: `${formattedValue}: в среднем диапазоне по РК (${typicalRange}). Это нормальный уровень для выбранной категории без явного перерасхода.`,
    summary: `${METRIC_LABELS[metricKey]} норма`,
  };
}

function rankMetricAssessments(assessments) {
  const severityWeight = {
    missing: 4,
    critical: 3,
    high: 2,
    above: 1,
    ok: 0,
  };

  return assessments
    .filter((assessment) => assessment.isIssue)
    .sort((a, b) => severityWeight[b.severity] - severityWeight[a.severity] || a.score - b.score);
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
  const categoryBenchmark = getBenchmarks(category);
  const assessments = Object.entries(categoryBenchmark.metrics).map(([metricKey, benchmark]) => {
    const value = getPayloadMetricValue(values, metricKey);
    const comparison = buildMetricComparison(metricKey, value, benchmark);
    const score = calculateMetricScore(value, benchmark, metricKey, values.recycledPercent);

    return {
      key: metricKey,
      benchmark,
      value,
      score,
      ...comparison,
    };
  });

  const waterScore = assessments.find((item) => item.key === 'water')?.score ?? 50;
  const electricityScore = assessments.find((item) => item.key === 'electricity')?.score ?? 50;
  const wasteScore = assessments.find((item) => item.key === 'waste')?.score ?? 50;
  const rawScore = (waterScore * 0.35) + (electricityScore * 0.35) + (wasteScore * 0.3);
  const issueAssessments = rankMetricAssessments(assessments);
  const hasMissingData = issueAssessments.some((item) => item.severity === 'missing');
  const hasCriticalIssue = issueAssessments.some((item) => item.severity === 'critical');
  const hasHighIssue = issueAssessments.some((item) => item.severity === 'high');
  const hasAboveIssue = issueAssessments.some((item) => item.severity === 'above');

  let scoreCap = 100;

  if (hasMissingData) {
    scoreCap = 55;
  } else if (hasCriticalIssue) {
    scoreCap = 49;
  } else if (hasHighIssue) {
    scoreCap = 74;
  } else if (hasAboveIssue) {
    scoreCap = 89;
  }

  const score = clamp(Math.round(Math.min(rawScore, scoreCap)), 1, 100);
  const status = normalizeStatus(score);

  const metrics = {
    water: assessments.find((item) => item.key === 'water')?.text || '',
    electricity: assessments.find((item) => item.key === 'electricity')?.text || '',
    waste: assessments.find((item) => item.key === 'waste')?.text || '',
  };

  const issueSummary = issueAssessments.length > 0
    ? issueAssessments.map((item) => item.summary).join(', ')
    : 'перерасход не найден';

  const summary = issueAssessments.length > 0
    ? `Честный рейтинг: ${score}/100, потому что ${issueSummary}. Сравнение идет с ${categoryBenchmark.basis}; если объект сильно больше или меньше типового, данные лучше нормировать по людям, площади или сменам.`
    : `Честный рейтинг: ${score}/100 — показатели выглядят экономно или в среднем диапазоне по РК. Сравнение идет с ${categoryBenchmark.basis}; явного перерасхода по воде, электричеству и отходам не найдено.`;

  let recommendations = [
    'Совет не требуется: показатели уже находятся в оптимальном диапазоне по РК.',
    'Совет не требуется: текущий уровень эффективности соответствует устойчивым нормам потребления в Казахстане.',
    'Совет не требуется: дальнейшие улучшения рассматриваются только как добровольное повышение эффективности.'
  ];

  if (issueAssessments.length > 0) {
    const sortedIssues = issueAssessments.map((item) => item.key).slice(0, 3);
    const nextRecommendations = [];

    for (let index = 0; index < 3; index += 1) {
      sortedIssues.forEach((issue) => {
        const issueRecommendations = RECOMMENDATIONS[issue]?.[category] || [];

        if (issueRecommendations[index] && nextRecommendations.length < 3) {
          nextRecommendations.push(issueRecommendations[index]);
        }
      });
    }

    recommendations = nextRecommendations;
  }

  return {
    score,
    status,
    summary,
    metrics,
    recommendations,
  };
}

function mergeAiResultWithBenchmark(benchmarkResult, aiResult) {
  if (!aiResult) {
    return benchmarkResult;
  }

  const recommendations = normalizeRecommendationList(aiResult.recommendations);

  return {
    ...benchmarkResult,
    recommendations: recommendations.length === 3 ? recommendations : benchmarkResult.recommendations,
  };
}

function buildDetailedMetricAnalysis(category, values) {
  const result = buildFallbackResult(category, values);

  return {
    waterAnalysis: result.metrics.water,
    electricityAnalysis: result.metrics.electricity,
    wasteAnalysis: result.metrics.waste,
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

function normalizeRecommendationList(list) {
  if (!Array.isArray(list)) {
    return [];
  }

  return list
    .map((item) => String(item).trim())
    .filter((item) => item.length > 0)
    .slice(0, 3);
}

function normalizeAiResult(payload) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const score = Number(payload.score);
  const status = normalizeStatusValue(payload.status || normalizeStatus(Number.isFinite(score) ? score : 50));

  const metrics = payload.metrics && typeof payload.metrics === 'object'
    ? {
        water: String(payload.metrics.water ?? '').trim(),
        electricity: String(payload.metrics.electricity ?? '').trim(),
        waste: String(payload.metrics.waste ?? '').trim(),
      }
    : null;

  const recommendations = normalizeRecommendationList(payload.recommendations);

  if (!payload.summary || typeof payload.summary !== 'string' || !payload.summary.trim()) {
    return null;
  }

  if (!metrics || !metrics.water || !metrics.electricity || !metrics.waste) {
    return null;
  }

  if (recommendations.length === 0) {
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

  const summary = `Для категории "${categoryLabel}" показатели находятся в оптимальном диапазоне по Казахстану. Дополнительный совет не требуется: текущий уровень эффективности уже соответствует высоким стандартам ресурсоэффективности.`;

  return {
    ...result,
    status: 'ОТЛИЧНЫЙ',
    summary,
    recommendations: [
      `Совет не требуется: для ${formatCategoryGenitive(category)} показатели уже находятся в оптимальном диапазоне по РК.`,
      `Совет не требуется: текущий уровень эффективности соответствует устойчивым нормам потребления в Казахстане.`,
      `Совет не требуется: дальнейшие улучшения можно рассматривать только как добровольное повышение эффективности, но они не обязательны.`
    ],
  };
}

async function generateAiInsight(category, values) {
  if (!openai) {
    return null;
  }

  const benchmarkForPrompt = getBenchmarks(category);
  const systemPrompt = `Ты — строгий эко-аудитор сервиса EcoAI в Казахстане. Твоя задача — динамически проанализировать переданные цифры и выявить аномалии относительно норм и средних значений по РК.

БЕНЧМАРКИ ДЛЯ СРАВНЕНИЯ:
${JSON.stringify(benchmarkForPrompt, null, 2)}

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
    } catch {
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

app.post('/api/consult', authMiddleware, async (req, res) => {
  const { query, context, image } = req.body;

  if (!query) {
    return res.status(400).json({ success: false, message: 'Запрос обязателен.' });
  }

  if (!openai) {
    return res.status(503).json({ success: false, message: 'OpenAI API не настроен.' });
  }

  const systemPrompt = `Ты — аналитическое ядро ИИ эко-сервиса EcoAI. 
Твоя задача — принимать историю потребления авторизованного пользователя (вход через Gmail), рассчитывать точную динамику в процентах, объяснять прогресс и выдавать структурированные рекомендации для фронтенда.

### ВХОДНЫЕ ДАННЫЕ:
Ты получаешь данные пользователя в формате:
- Email пользователя (Gmail)
- Текущая запись и история предыдущих замеров:
  * Июнь: 160 л (базовый расход)
  * Июль: 130 л (текущий расход)

### ПРАВИЛА РАСЧЕТА И ЛОГИКА:
1. **Расчет динамики:**
   - Формула: ((Текущий_месяц - Прошлый_месяц) / Прошлый_месяц) * 100%
   - Пример: ((130 - 160) / 160) * 100% = -18.75% (фиксируется как снижение на 18%).
2. **Связка с презентацией:**
   - Подтверждай цифру «-18%» как доказанный результат сокращения потребления воды между июнем и июлем.
3. **Хранение и контекст:**
   - Формируй массив истории, чтобы фронтенд мог сразу построить график динамики (Июнь 160 -> Июль 130).

### ФОРМАТ ВЫВОДА (ТОЛЬКО JSON):
Отвечай строго в формате JSON, без вводных слов и разметки:

{
  "user_email": "user@gmail.com",
  "history": [
    { "month": "Июнь", "value": 160, "unit": "л" },
    { "month": "Июль", "value": 130, "unit": "л" }
  ],
  "analytics": {
    "difference_value": -30,
    "percentage_change": -18.75,
    "display_percentage": "-18%",
    "status": "Успешная оптимизация потребления",
    "explanation_for_presentation": "Снижение расхода со 160 л в июне до 130 л в июле составляет -18% (экономия 30 л)."
  },
  "recommendations": {
    "item_1": "Продолжать использовать насадки-аэраторы для удержания расхода до 130 л.",
    "item_2": "Контролировать пиковые часы потребления воды.",
    "item_3": "Цель на август: закрепить результат на уровне 119-120 л."
  }
}`;

  try {
    const userMessageContent = [];
    userMessageContent.push({
      type: 'text',
      text: `Контекст: ${JSON.stringify(context || {})}\nЗапрос: ${query}`
    });

    if (image) {
      userMessageContent.push({
        type: 'image_url',
        image_url: {
          url: image
        }
      });
    }

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessageContent },
      ],
      temperature: 0.5,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices?.[0]?.message?.content;
    const parsed = JSON.parse(sanitizeAiResponse(raw));

    const responseData = parsed; // The entire response is now structured and returned.

    if (req.user) {
      try {
        const monthKey = new Date().toISOString().slice(0, 7); // e.g., '2026-09'
        await pool.query(
          'INSERT INTO analyses (id, "userId", type, category, data_json, month_key) VALUES ($1, $2, $3, $4, $5, $6)',
          [
            crypto.randomUUID(),
            req.user.id,
            'consult',
            context?.category || 'unknown',
            JSON.stringify({ context, query, ...responseData }),
            monthKey
          ]
        );
      } catch (err) {
        console.error('Ошибка сохранения консультации:', err);
      }
    }

    return res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Ошибка в /api/consult:', error);
    return res.status(500).json({ success: false, message: 'Внутренняя ошибка AI-консультанта.' });
  }
});

app.post('/api/vision/stub', (req, res) => {
  // Stub для будущей фичи Photo Vision
  return res.json({
    success: true,
    message: 'Photo Vision API (stub). В будущем здесь будет OCR-распознавание счетчиков.',
    extractedData: {
      resourceType: 'electricity',
      reading: 47790,
      confidence: 0.95
    }
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

  const checkUser = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
  if (checkUser) {
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

  const insertUser = db.prepare('INSERT INTO users (id, name, email, passwordHash) VALUES (?, ?, ?, ?)');
  insertUser.run(user.id, user.name, user.email, user.passwordHash);

  // Возвращаем email в качестве простого токена для демо-целей
  return res.status(201).json({
    success: true,
    token: user.email,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  const normalizedEmail = normalizeEmail(email);
  const cleanPassword = String(password || '');

  if (!normalizedEmail || !cleanPassword) {
    return res.status(400).json({
      success: false,
      message: 'Email и пароль обязательны.',
    });
  }

  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);
    const user = rows[0];

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
      token: user.email,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Ошибка при входе' });
  }
});

app.get('/api/user/history', authMiddleware, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Требуется авторизация.' });
  }
  
  try {
    const { rows: history } = await pool.query('SELECT * FROM analyses WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT 50', [req.user.id]);
    const parsedHistory = history.map(item => ({
      ...item,
      data_json: JSON.parse(item.data_json)
    }));
    return res.json({ success: true, history: parsedHistory });
  } catch (err) {
    console.error('History Error:', err);
    return res.status(500).json({ success: false, message: 'Ошибка при получении истории.' });
  }
});

app.get('/api/user/dynamics', authMiddleware, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Требуется авторизация.' });
  }

  try {
    // Получаем последние 2 месяца
    const { rows: monthQuery } = await pool.query('SELECT DISTINCT month_key FROM analyses WHERE "userId" = $1 AND type = $2 ORDER BY month_key DESC LIMIT 2', [req.user.id, 'calculate']);
    
    if (monthQuery.length < 2) {
      return res.json({ 
        success: true, 
        message: 'Недостаточно данных для сравнения. Нужны расчеты за 2 разных месяца.',
        dynamics: null 
      });
    }

    const currentMonth = monthQuery[0].month_key;
    const baseMonth = monthQuery[1].month_key;

    // Получаем последние расчеты за эти месяцы
    const { rows: currentRows } = await pool.query('SELECT data_json FROM analyses WHERE "userId" = $1 AND type = $2 AND month_key = $3 ORDER BY "createdAt" DESC LIMIT 1', [req.user.id, 'calculate', currentMonth]);
    const { rows: baseRows } = await pool.query('SELECT data_json FROM analyses WHERE "userId" = $1 AND type = $2 AND month_key = $3 ORDER BY "createdAt" DESC LIMIT 1', [req.user.id, 'calculate', baseMonth]);

    const currentAnalysisRow = currentRows[0];
    const baseAnalysisRow = baseRows[0];

    const currentData = currentAnalysisRow ? JSON.parse(currentAnalysisRow.data_json) : {};
    const baseData = baseAnalysisRow ? JSON.parse(baseAnalysisRow.data_json) : {};

    // Формула: ((текущий - базовый) / базовый) × 100%
    const calcTrend = (current, base) => {
      if (!base || base === 0) return 0;
      return Number((((current - base) / base) * 100).toFixed(1));
    };

    const dynamics = {
      waterPercent: calcTrend(currentData.metrics?.water?.value, baseData.metrics?.water?.value),
      electricityPercent: calcTrend(currentData.metrics?.electricity?.value, baseData.metrics?.electricity?.value),
      wastePercent: calcTrend(currentData.metrics?.waste?.value, baseData.metrics?.waste?.value),
      co2Percent: calcTrend(currentData.co2ReductionKg, baseData.co2ReductionKg),
      currentMonth,
      baseMonth
    };

    return res.json({ success: true, dynamics });
  } catch (err) {
    console.error('Dynamics Error:', err);
    return res.status(500).json({ success: false, message: 'Ошибка при вычислении динамики.' });
  }
});

app.post('/api/calculate', authMiddleware, async (req, res, next) => {
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

    const benchmarkResult = buildFallbackResult(normalizedCategory, {
      waterAmount,
      electricityKwh,
      wasteKg,
      recycledPercent,
    });

    const aiResult = process.env.USE_OPENAI_NARRATIVE === 'true'
      ? await generateAiInsight(normalizedCategory, {
          waterAmount,
          electricityKwh,
          wasteKg,
          recycledPercent,
        })
      : null;

    const finalResult = enforceHighScoreNoAdvice(
      mergeAiResultWithBenchmark(benchmarkResult, aiResult),
      normalizedCategory
    );

    const detailedMetrics = buildDetailedMetricAnalysis(normalizedCategory, {
      waterAmount,
      electricityKwh,
      wasteKg,
      recycledPercent,
    });

    const totalSavingsKzt = calculateSavingsKzt(normalizedCategory, {
      waterAmount,
      electricityKwh,
      wasteKg,
    });

    const co2 = calculateCo2Reduction({
      waterAmount,
      electricityKwh,
      wasteKg,
    });

    const responseData = {
      score: finalResult.score,
      status: finalResult.status,
      summary: finalResult.summary,
      metrics: {
        water: finalResult.metrics.water,
        electricity: finalResult.metrics.electricity,
        waste: finalResult.metrics.waste,
      },
      detailedMetrics,
      recommendations: finalResult.recommendations,
      totalSavingsKzt,
      co2ReductionKg: co2.totalCo2Kg,
      co2Breakdown: co2.breakdown,
    };

    if (req.user) {
      try {
        const monthKey = new Date().toISOString().slice(0, 7); // e.g., '2026-09'
        await pool.query(
          'INSERT INTO analyses (id, "userId", type, category, data_json, month_key) VALUES ($1, $2, $3, $4, $5, $6)',
          [
            crypto.randomUUID(),
            req.user.id,
            'calculate',
            normalizedCategory,
            JSON.stringify(responseData),
            monthKey
          ]
        );
      } catch (err) {
        console.error('Ошибка сохранения расчета:', err);
      }
    }

    return res.status(200).json({
      success: true,
      data: responseData,
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

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`EcoAI backend is running on http://localhost:${PORT}`);
  });
}

export default app;
