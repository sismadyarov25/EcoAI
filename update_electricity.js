import fs from 'fs';

let content = fs.readFileSync('src/ElectricityCalculator.jsx', 'utf8');

// Add OUM state
if (!content.includes('const [oum')) {
    content = content.replace(
        "const [tariff, setTariff] = useState(23.9772);",
        "const [tariff, setTariff] = useState(23.9772);\n  const [oum, setOum] = useState(11);"
    );
}

// Update logic
content = content.replace(
    "const totalCost = used * tariff;",
    "const oumCost = oum * tariff;\n  const totalCost = (used * tariff) + oumCost;"
);

// Add OUM input right after tariff
const tariffBlockEnd = `onChange={(e) => setTariff(Number(e.target.value))}
              className="w-full bg-white border border-slate-200 text-slate-900 text-base rounded-2xl px-4 py-3.5 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>`;

const oumBlock = `onChange={(e) => setTariff(Number(e.target.value))}
              className="w-full bg-white border border-slate-200 text-slate-900 text-base rounded-2xl px-4 py-3.5 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* OUM */}
          <div>
            <label className="flex items-center text-[13px] font-semibold text-slate-500 mb-2">
              <Zap className="w-4 h-4 mr-2 text-slate-400" />
              Объем ОУМ (общедомовые), кВт*ч
            </label>
            <input
              type="number"
              value={oum}
              onChange={(e) => setOum(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-base rounded-2xl px-4 py-3.5 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>`;

if (!content.includes('Объем ОУМ')) {
    content = content.replace(tariffBlockEnd, oumBlock);
}

// Update the display of volume to include OUM, or keep separate?
// Better keep "Объем" as the main one, and we can show OUM in the subtext.
content = content.replace(
    '<span className="text-2xl font-black text-slate-900">{used}</span>',
    '<span className="text-2xl font-black text-slate-900">{used}</span>'
);

content = content.replace(
    '<div className="text-[11px] text-slate-400 mt-1">за {daysPassed} дня</div>',
    '<div className="text-[11px] text-slate-400 mt-1">+{oum} ОУМ • за {daysPassed} дня</div>'
);

content = content.replace(
    '<div className="text-[11px] text-slate-400 mt-1">по тарифу {tariff} ₸</div>',
    '<div className="text-[11px] text-slate-400 mt-1">включая ОУМ ({(oum * tariff).toLocaleString(\'ru-RU\', {minimumFractionDigits: 2, maximumFractionDigits: 2})} ₸)</div>'
);

fs.writeFileSync('src/ElectricityCalculator.jsx', content);
