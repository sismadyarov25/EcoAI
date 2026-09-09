// ---------------------------------------------------------------------------
// SHARED BENCHMARKS & CONSTANTS FOR ECOAI
// Single source of truth used by both backend/server.js and api/calculate.js
//
// Источники: тарифы акиматов, Бюро национальной статистики АСПиР РК (2025-2026)
// ---------------------------------------------------------------------------

export const ALLOWED_CATEGORIES = new Set(['home', 'school', 'business']);

export const KAZAKHSTAN_BENCHMARKS = {
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

export const METRIC_LABELS = {
  water: 'воде',
  electricity: 'электроэнергии',
  waste: 'отходам',
};

// Тарифы Казахстана (средние по регионам)
export const KAZAKHSTAN_TARIFFS = {
  water: { pricePerUnit: 149.18, unit: 'м³' },
  electricity: { pricePerUnit: 23.98, unit: 'кВт·ч' },
  waste: { pricePerUnit: 45.0, unit: 'кг' },
};

// CO₂ коэффициенты (кг CO₂ на единицу ресурса)
// Электричество: энергомикс РК ~70% уголь → 0.85 кг CO₂/кВт·ч (IPCC)
// Вода: водоподготовка + очистка ~ 0.45 кг CO₂/м³
// Отходы: разложение на полигоне ~ 1.1 кг CO₂/кг (метан + транспорт)
export const CO2_FACTORS = {
  water: 0.45,
  electricity: 0.85,
  waste: 1.1,
};

// Recommendations by resource type and category
export const RECOMMENDATIONS = {
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

// ---------------------------------------------------------------------------
// HELPER FUNCTIONS
// ---------------------------------------------------------------------------

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function formatCategory(category) {
  return KAZAKHSTAN_BENCHMARKS[category]?.label || 'Дом';
}

export function formatCategoryGenitive(category) {
  const labels = { home: 'дома', school: 'школы', business: 'бизнеса' };
  return labels[category] || 'дома';
}

export function getBenchmarks(category) {
  return KAZAKHSTAN_BENCHMARKS[category] || KAZAKHSTAN_BENCHMARKS.home;
}

export function normalizeStatus(score) {
  if (score >= 80) return 'ОТЛИЧНЫЙ';
  if (score >= 50) return 'НОРМАЛЬНЫЙ';
  return 'КРИТИЧЕСКИЙ';
}

export function formatNumber(value) {
  return Number(value).toLocaleString('ru-RU', {
    maximumFractionDigits: Number.isInteger(value) ? 0 : 1,
  });
}

export function formatTimes(value) {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? `${formatNumber(rounded)} раз` : `${formatNumber(rounded)} раза`;
}

export function calculateSavingsKzt(category, values) {
  const benchmark = getBenchmarks(category);
  let totalSavings = 0;

  const metricMap = {
    water: { value: values.waterAmount, tariff: KAZAKHSTAN_TARIFFS.water.pricePerUnit },
    electricity: { value: values.electricityKwh, tariff: KAZAKHSTAN_TARIFFS.electricity.pricePerUnit },
    waste: { value: values.wasteKg, tariff: KAZAKHSTAN_TARIFFS.waste.pricePerUnit },
  };

  for (const [key, { value, tariff }] of Object.entries(metricMap)) {
    const bm = benchmark.metrics[key];
    const target = bm.typicalMax;

    if (value > target) {
      const savableUnits = value - target;
      totalSavings += savableUnits * 0.6 * tariff;
    }
  }

  return Math.round(totalSavings);
}

export function calculateCo2(values) {
  const w = (values.waterAmount || 0) * CO2_FACTORS.water;
  const e = (values.electricityKwh || 0) * CO2_FACTORS.electricity;
  const wst = (values.wasteKg || 0) * CO2_FACTORS.waste;

  return {
    totalCo2Kg: Math.round(w + e + wst),
    breakdown: {
      water: Math.round(w * 10) / 10,
      electricity: Math.round(e * 10) / 10,
      waste: Math.round(wst * 10) / 10,
    },
  };
}
