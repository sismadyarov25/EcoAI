import fs from 'fs';

let content = fs.readFileSync('src/ElectricityCalculator.jsx', 'utf8');

// 1. Remove state
content = content.replace("  const [oum, setOum] = useState(11);\n", "");

// 2. Fix cost calculation
content = content.replace("  const oumCost = oum * tariff;\n  const totalCost = (used * tariff) + oumCost;", "  const totalCost = used * tariff;");

// 3. Remove OUM input block
const oumRegex = /\s*\{\/\* 4\.5 OUM \(ОУМ\) \*\/\}\s*<div>\s*<label[\s\S]*?Объем ОУМ[\s\S]*?<\/label>\s*<input[\s\S]*?value=\{oum\}[\s\S]*?<\/div>\n/;
content = content.replace(oumRegex, "\n");

// 4. Remove OUM display text in "Начислено"
const oumDisplayRegex = /\s*\{oum > 0 && <span className="text-\[10px\].*?Вкл\. ОУМ.*?<\/span>\}/;
content = content.replace(oumDisplayRegex, "");

fs.writeFileSync('src/ElectricityCalculator.jsx', content);
console.log("OUM removed successfully.");
