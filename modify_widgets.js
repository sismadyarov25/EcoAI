import fs from 'fs';

let content = fs.readFileSync('src/App.jsx', 'utf8');

const importStr = "import WaterCalculator from './WaterCalculator';\nimport ElectricityCalculator from './ElectricityCalculator';";
if (!content.includes('WaterCalculator')) {
    content = content.replace(
        "import { registerUser, loginUser } from './api/authService';",
        "import { registerUser, loginUser } from './api/authService';\n" + importStr
    );
}

const startStr = '        <div className="mt-8 bg-white/80 border border-slate-200/80 rounded-3xl p-6 shadow-sm">\n          <div className="flex items-center gap-3 mb-5">\n            <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700">\n              <Droplet className="w-5 h-5" />';
const startIdx = content.indexOf(startStr);

const endStr = '      </section>\n\n      {/* --------------------------------------------------------------------- */}\n      {/* CONTACTS SECTION ("КОНТАКТЫ")';
const endIdx = content.indexOf(endStr);

if (startIdx !== -1 && endIdx !== -1) {
    const replacement = `        <div className="mt-12 grid grid-cols-1 xl:grid-cols-2 gap-8">
          <WaterCalculator />
          <ElectricityCalculator />
        </div>\n\n`;
    content = content.substring(0, startIdx) + replacement + content.substring(endIdx);
    fs.writeFileSync('src/App.jsx', content);
    console.log("Widgets replaced successfully!");
} else {
    console.log("Could not find start or end index.");
    if (startIdx === -1) console.log("Start string not found");
    if (endIdx === -1) console.log("End string not found");
}
