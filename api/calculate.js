const ALLOWED_CATEGORIES = new Set(['home', 'school', 'business']);

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizeStatus(score) {
  if (score >= 80) return 'ОТЛИЧНЫЙ';
  if (score >= 50) return 'НОРМАЛЬНЫЙ';
  return 'КРИТИЧЕСКИЙ';
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
    basis: 'ориентиром для семьи из 3-4 человек в Казахстане',
    metrics: {
      water: { unit: 'м³/мес', typicalMin: 10, typicalMax: 20, high: 25, critical: 35 },
      electricity: { unit: 'кВт·ч/мес', typicalMin: 180, typicalMax: 300, high: 400, critical: 600 },
      waste: { unit: 'кг/мес', typicalMin: 70, typicalMax: 125, high: 150, critical: 220 },
    },
  },
  school: {
    basis: 'ориентиром для типовой школы на 400-600 учеников и сотрудников',
    metrics: {
      water: { unit: 'м³/мес', typicalMin: 90, typicalMax: 260, high: 350, critical: 550 },
      electricity: { unit: 'кВт·ч/мес', typicalMin: 2500, typicalMax: 6000, high: 8000, critical: 12000 },
      waste: { unit: 'кг/мес', typicalMin: 250, typicalMax: 700, high: 900, critical: 1400 },
    },
  },
  business: {
    basis: 'ориентиром для офиса или малого/среднего коммерческого объекта на 30-70 сотрудников',
    metrics: {
      water: { unit: 'м³/мес', typicalMin: 25, typicalMax: 100, high: 160, critical: 250 },
      electricity: { unit: 'кВт·ч/мес', typicalMin: 1200, typicalMax: 6000, high: 9000, critical: 15000 },
      waste: { unit: 'кг/мес', typicalMin: 150, typicalMax: 650, high: 900, critical: 1400 },
    },
  },
};

const METRIC_LABELS = {
  water: 'воде',
  electricity: 'электроэнергии',
  waste: 'отходам',
};

const RECOMMENDATIONS = {
  water: {
    home: [
      'Для дома проверьте краны, сливной бачок и трубы: постоянная капля или протечка часто объясняет лишние кубометры за месяц.',
      'Для дома сверяйте показания счетчика по неделям и отдельно отмечайте стирку, полив и долгий душ, чтобы найти главный источник перерасхода.',
      'Для дома замените старые смесители и душевые насадки на экономичные, если вода стабильно выше среднего ориентира по РК.',
    ],
    school: [
      'Для школы проверьте санузлы, умывальники, столовую и полив: именно эти зоны чаще всего дают лишний расход в учебные дни.',
      'Для школы заведите журнал показаний воды по неделям и сравнивайте учебные дни, выходные и каникулы, чтобы быстро находить утечки.',
      'Для школы поставьте экономичные аэраторы и исправную сливную арматуру в местах с большой проходимостью.',
    ],
    business: [
      'Для бизнеса разделите учет воды по зонам: офис, кухня, санузлы, мойка, производство или смены, чтобы не искать перерасход вслепую.',
      'Для бизнеса проверьте ночной расход по счетчику: если объект закрыт, а вода продолжает уходить, вероятна скрытая утечка.',
      'Для бизнеса установите экономичную арматуру и автоматику там, где вода используется часто и повторяемо.',
    ],
  },
  electricity: {
    home: [
      'Для дома отключайте неиспользуемые приборы от розетки и переведите освещение на LED, чтобы сократить бытовое потребление электроэнергии.',
      'Для дома подключите таймеры и умные розетки для техники и обогревателей, чтобы уменьшить нагрузку в ночное время и при отсутствии людей дома.',
      'Для дома проверьте кондиционеры, бойлеры и электроплиты на режимы экономии, чтобы снизить расход летом и в холодный сезон.',
    ],
    school: [
      'Для школы переведите освещение в аудиториях, коридорах и спортзале на LED и настройте автоматическое отключение по расписанию.',
      'Для школы проверьте работу климатических систем и освещения по классам, чтобы сократить лишнюю нагрузку во время перерывов и каникул.',
      'Для школы внедрите мониторинг потребления по корпусам и аудиториям, чтобы быстро находить зоны с повышенным расходом энергии.',
    ],
    business: [
      'Для бизнеса переведите офисы и производство на LED-освещение и автоматические режимы энергосбережения по сменам.',
      'Для бизнеса настройте мониторинг потребления по цехам и отделам, чтобы видеть зоны перегруза и снижать затраты на электроэнергию.',
      'Для бизнеса оптимизируйте работу климатических систем, насосов и производственного оборудования, чтобы сократить нагрузку в пиковые часы.',
    ],
  },
  waste: {
    home: [
      'Для дома начните с раздельного сбора пластика, бумаги, стекла и металла: это быстрее всего снижает смешанный мусор.',
      'Для дома отдельно собирайте органику, если есть возможность компостирования или вывоза: она сильно увеличивает общий вес отходов.',
      'Для дома уменьшите одноразовую упаковку в покупках и хранении продуктов, чтобы мусор не рос даже при том же составе семьи.',
    ],
    school: [
      'Для школы поставьте отдельные контейнеры в столовой, кабинетах и рекреациях: один общий бак обычно скрывает реальный источник мусора.',
      'Для школы отделяйте пищевые отходы столовой от бумаги и пластика, иначе перерабатываемые материалы быстро становятся непригодными.',
      'Для школы договоритесь с локальными пунктами приема вторсырья о регулярном вывозе, чтобы сортировка не оставалась формальностью.',
    ],
    business: [
      'Для бизнеса разделите отходы по подразделениям и типам сырья, чтобы видеть, где образуется основной объем мусора.',
      'Для бизнеса заключите договор на вывоз вторсырья и фиксируйте вес по месяцам, иначе переработку трудно подтвердить цифрами.',
      'Для бизнеса пересмотрите упаковку, закупки и логистику: часто именно они создают лишние килограммы отходов.',
    ],
  },
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

function getPayloadMetricValue(values, metricKey) {
  const valueMap = {
    water: values.waterAmount,
    electricity: values.electricityKwh,
    waste: values.wasteKg,
  };

  return valueMap[metricKey] ?? 0;
}

function calculateMetricScore(value, benchmark, metricKey, recycledPercent) {
  if (value <= 0) return 35;

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
    score = 24 / (value / benchmark.critical);
  }

  if (metricKey === 'waste') {
    score += Math.min(20, recycledPercent * 0.25);

    if (value > benchmark.critical) score = Math.min(score, 45);
    else if (value > benchmark.high) score = Math.min(score, 65);
    else if (value > benchmark.typicalMax) score = Math.min(score, 82);
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
    return {
      severity: 'critical',
      isIssue: true,
      text: `${formattedValue}: критически выше среднего ориентира по РК (${typicalRange}) примерно в ${formatTimes(value / benchmark.typicalMax)}. Это уже не "норма": возможны утечки, неучтенные зоны потребления или неверный режим эксплуатации.`,
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

function validatePayload(payload) {
  const errors = [];
  const category = String(payload?.category || '').trim().toLowerCase();
  const values = {
    category,
    waterAmount: Number(payload?.waterAmount),
    electricityKwh: Number(payload?.electricityKwh),
    wasteKg: Number(payload?.wasteKg),
    recycledPercent: Number(payload?.recycledPercent),
  };

  if (!ALLOWED_CATEGORIES.has(category)) errors.push('category должен быть одним из: home, school, business');
  if (!Number.isFinite(values.waterAmount)) errors.push('waterAmount должен быть числом');
  if (!Number.isFinite(values.electricityKwh)) errors.push('electricityKwh должен быть числом');
  if (!Number.isFinite(values.wasteKg)) errors.push('wasteKg должен быть числом');
  if (!Number.isFinite(values.recycledPercent)) errors.push('recycledPercent должен быть числом');
  if (values.waterAmount < 0) errors.push('waterAmount не может быть отрицательным');
  if (values.electricityKwh < 0) errors.push('electricityKwh не может быть отрицательным');
  if (values.wasteKg < 0) errors.push('wasteKg не может быть отрицательным');
  if (values.recycledPercent < 0 || values.recycledPercent > 100) {
    errors.push('recycledPercent должен быть в диапазоне от 0 до 100');
  }

  return { isValid: errors.length === 0, errors, values };
}

function buildResult(category, values) {
  const categoryBenchmark = KAZAKHSTAN_BENCHMARKS[category] || KAZAKHSTAN_BENCHMARKS.home;
  const assessments = Object.entries(categoryBenchmark.metrics).map(([metricKey, benchmark]) => {
    const value = getPayloadMetricValue(values, metricKey);
    return {
      key: metricKey,
      score: calculateMetricScore(value, benchmark, metricKey, values.recycledPercent),
      ...buildMetricComparison(metricKey, value, benchmark),
    };
  });

  const scoreByKey = Object.fromEntries(assessments.map((item) => [item.key, item.score]));
  const rawScore = (scoreByKey.water * 0.35) + (scoreByKey.electricity * 0.35) + (scoreByKey.waste * 0.3);
  const severityWeight = { missing: 4, critical: 3, high: 2, above: 1, ok: 0 };
  const issueAssessments = assessments
    .filter((assessment) => assessment.isIssue)
    .sort((a, b) => severityWeight[b.severity] - severityWeight[a.severity] || a.score - b.score);

  let scoreCap = 100;
  if (issueAssessments.some((item) => item.severity === 'missing')) scoreCap = 55;
  else if (issueAssessments.some((item) => item.severity === 'critical')) scoreCap = 49;
  else if (issueAssessments.some((item) => item.severity === 'high')) scoreCap = 74;
  else if (issueAssessments.some((item) => item.severity === 'above')) scoreCap = 89;

  const score = clamp(Math.round(Math.min(rawScore, scoreCap)), 1, 100);
  const metrics = Object.fromEntries(assessments.map((item) => [item.key, item.text]));

  const summary = issueAssessments.length > 0
    ? `Честный рейтинг: ${score}/100, потому что ${issueAssessments.map((item) => item.summary).join(', ')}. Сравнение идет с ${categoryBenchmark.basis}; если объект сильно больше или меньше типового, данные лучше нормировать по людям, площади или сменам.`
    : `Честный рейтинг: ${score}/100 — показатели выглядят экономно или в среднем диапазоне по РК. Сравнение идет с ${categoryBenchmark.basis}; явного перерасхода по воде, электричеству и отходам не найдено.`;

  let recommendations = [
    `Совет не требуется: для ${formatCategoryGenitive(category)} показатели уже находятся в оптимальном диапазоне по РК.`,
    'Совет не требуется: текущий уровень эффективности соответствует устойчивым нормам потребления в Казахстане.',
    'Совет не требуется: дальнейшие улучшения можно рассматривать только как добровольное повышение эффективности.',
  ];

  if (issueAssessments.length > 0) {
    const issueKeys = issueAssessments.map((item) => item.key).slice(0, 3);
    const nextRecommendations = [];

    for (let index = 0; index < 3; index += 1) {
      issueKeys.forEach((issue) => {
        const text = RECOMMENDATIONS[issue]?.[category]?.[index];
        if (text && nextRecommendations.length < 3) nextRecommendations.push(text);
      });
    }

    recommendations = nextRecommendations;
  }

  return {
    score,
    status: normalizeStatus(score),
    summary: score >= 90
      ? `Для категории "${formatCategory(category)}" показатели находятся в оптимальном диапазоне по Казахстану. Дополнительный совет не требуется: текущий уровень эффективности уже соответствует высоким стандартам ресурсоэффективности.`
      : summary,
    metrics,
    detailedMetrics: {
      waterAnalysis: metrics.water,
      electricityAnalysis: metrics.electricity,
      wasteAnalysis: metrics.waste,
    },
    recommendations,
  };
}

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Use POST /api/calculate with category, waterAmount, electricityKwh, wasteKg, recycledPercent.',
    });
  }

  const validation = validatePayload(req.body ?? {});

  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Некорректные данные запроса.',
      details: validation.errors,
    });
  }

  return res.status(200).json({
    success: true,
    data: buildResult(validation.values.category, validation.values),
  });
}
