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

function formatCategoryGenitive(category) {
  const labels = {
    home: 'дома',
    school: 'школы',
    business: 'бизнеса',
  };

  return labels[category] || 'дома';
}

const KAZAKHSTAN_BENCHMARKS = {
  home: {
    label: 'Дом',
    basis: 'ориентиром для семьи из 3-4 человек в Казахстане',
    metrics: {
      water: {
        label: 'вода',
        unit: 'м³/мес',
        typicalMin: 10,
        typicalMax: 20,
        high: 25,
        critical: 35,
      },
      electricity: {
        label: 'электроэнергия',
        unit: 'кВт·ч/мес',
        typicalMin: 180,
        typicalMax: 300,
        high: 400,
        critical: 600,
      },
      waste: {
        label: 'отходы',
        unit: 'кг/мес',
        typicalMin: 70,
        typicalMax: 125,
        high: 150,
        critical: 220,
      },
    },
  },
  school: {
    label: 'Школа',
    basis: 'ориентиром для типовой школы на 400-600 учеников и сотрудников',
    metrics: {
      water: {
        label: 'вода',
        unit: 'м³/мес',
        typicalMin: 90,
        typicalMax: 260,
        high: 350,
        critical: 550,
      },
      electricity: {
        label: 'электроэнергия',
        unit: 'кВт·ч/мес',
        typicalMin: 2500,
        typicalMax: 6000,
        high: 8000,
        critical: 12000,
      },
      waste: {
        label: 'отходы',
        unit: 'кг/мес',
        typicalMin: 250,
        typicalMax: 700,
        high: 900,
        critical: 1400,
      },
    },
  },
  business: {
    label: 'Бизнес',
    basis: 'ориентиром для офиса или малого/среднего коммерческого объекта на 30-70 сотрудников',
    metrics: {
      water: {
        label: 'вода',
        unit: 'м³/мес',
        typicalMin: 25,
        typicalMax: 100,
        high: 160,
        critical: 250,
      },
      electricity: {
        label: 'электроэнергия',
        unit: 'кВт·ч/мес',
        typicalMin: 1200,
        typicalMax: 6000,
        high: 9000,
        critical: 15000,
      },
      waste: {
        label: 'отходы',
        unit: 'кг/мес',
        typicalMin: 150,
        typicalMax: 650,
        high: 900,
        critical: 1400,
      },
    },
  },
};

const METRIC_LABELS = {
  water: 'воде',
  electricity: 'электроэнергии',
  waste: 'отходам',
};

function formatNumber(value) {
  return Number(value).toLocaleString('ru-RU', {
    maximumFractionDigits: Number.isInteger(value) ? 0 : 1,
  });
}

function formatTimes(value) {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? `${formatNumber(rounded)} раз` : `${formatNumber(rounded)} раза`;
}

function getBenchmarks(category) {
  return KAZAKHSTAN_BENCHMARKS[category] || KAZAKHSTAN_BENCHMARKS.home;
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
    const perIssueRecommendations = {
      water: {
        home: [
          'Для дома проверьте краны, сливной бачок и трубы: постоянная капля или протечка часто объясняет лишние кубометры за месяц.',
          'Для дома сверяйте показания счетчика по неделям и отдельно отмечайте стирку, полив и долгий душ, чтобы найти главный источник перерасхода.',
          'Для дома замените старые смесители и душевые насадки на экономичные, если вода стабильно выше среднего ориентира по РК.'
        ],
        school: [
          'Для школы проверьте санузлы, умывальники, столовую и полив: именно эти зоны чаще всего дают лишний расход в учебные дни.',
          'Для школы заведите журнал показаний воды по неделям и сравнивайте учебные дни, выходные и каникулы, чтобы быстро находить утечки.',
          'Для школы поставьте экономичные аэраторы и исправную сливную арматуру в местах с большой проходимостью.'
        ],
        business: [
          'Для бизнеса разделите учет воды по зонам: офис, кухня, санузлы, мойка, производство или смены, чтобы не искать перерасход вслепую.',
          'Для бизнеса проверьте ночной расход по счетчику: если объект закрыт, а вода продолжает уходить, вероятна скрытая утечка.',
          'Для бизнеса установите экономичную арматуру и автоматику там, где вода используется часто и повторяемо.'
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
          'Для дома начните с раздельного сбора пластика, бумаги, стекла и металла: это быстрее всего снижает смешанный мусор.',
          'Для дома отдельно собирайте органику, если есть возможность компостирования или вывоза: она сильно увеличивает общий вес отходов.',
          'Для дома уменьшите одноразовую упаковку в покупках и хранении продуктов, чтобы мусор не рос даже при том же составе семьи.'
        ],
        school: [
          'Для школы поставьте отдельные контейнеры в столовой, кабинетах и рекреациях: один общий бак обычно скрывает реальный источник мусора.',
          'Для школы отделяйте пищевые отходы столовой от бумаги и пластика, иначе перерабатываемые материалы быстро становятся непригодными.',
          'Для школы договоритесь с локальными пунктами приема вторсырья о регулярном вывозе, чтобы сортировка не оставалась формальностью.'
        ],
        business: [
          'Для бизнеса разделите отходы по подразделениям и типам сырья, чтобы видеть, где образуется основной объем мусора.',
          'Для бизнеса заключите договор на вывоз вторсырья и фиксируйте вес по месяцам, иначе переработку трудно подтвердить цифрами.',
          'Для бизнеса пересмотрите упаковку, закупки и логистику: часто именно они создают лишние килограммы отходов.'
        ]
      }
    };

    const nextRecommendations = [];

    for (let index = 0; index < 3; index += 1) {
      sortedIssues.forEach((issue) => {
        const issueRecommendations = perIssueRecommendations[issue]?.[category] || [];

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
        detailedMetrics,
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
