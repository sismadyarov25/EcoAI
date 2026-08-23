const fs = require('fs');
const file = 'src/App.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add familySize state
if (!content.includes('const [familySize')) {
    content = content.replace(
        "const [waste, setWaste] = useState('32');         // кг",
        "const [waste, setWaste] = useState('32');         // кг\n  const [familySize, setFamilySize] = useState('4'); // чел"
    );
}

// 2. Add peopleCount to calculateEcoData
if (!content.includes('peopleCount: parseInt(familySize)')) {
    content = content.replace(
        "wasteKg: wstVal,",
        "wasteKg: wstVal,\n        peopleCount: parseInt(familySize) || 4,"
    );
}

// 3. Change grid cols
content = content.replace(
    '<div className="grid grid-cols-1 md:grid-cols-3 gap-6">',
    '<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">'
);

// 4. Add Family Size input box right after the waste input block
const wasteInputEndStr = `</p>\n              </div>\n\n            </div>`;
const newPeopleInput = `</p>\n              </div>\n\n              {/* Family Size Input */}\n              <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 transition-all focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 flex flex-col justify-between">\n                <div>\n                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between mb-2">\n                    <span className="flex items-center gap-1.5">\n                      <User className="w-4 h-4 text-indigo-500" />\n                      Людей\n                    </span>\n                    <span className="text-[10px] text-slate-400 font-normal">в семье</span>\n                  </label>\n                  <div className="relative flex items-center">\n                    <input\n                      type="number"\n                      min="1"\n                      step="1"\n                      value={familySize}\n                      onChange={(e) => setFamilySize(e.target.value)}\n                      required\n                      className="w-full bg-transparent text-2xl font-bold text-slate-900 focus:outline-none pr-10"\n                    />\n                    <span className="absolute right-0 text-sm font-semibold text-slate-400">чел</span>\n                  </div>\n                </div>\n                <p className="text-[11px] font-medium text-slate-500 mt-3 pt-2 border-t border-slate-200/60">\n                  💡 Учитывается для расчета норм\n                </p>\n              </div>\n\n            </div>`;

if (!content.includes('Family Size Input')) {
    content = content.replace(wasteInputEndStr, newPeopleInput);
}

// 5. Move analysisResult block to right after form
// Find start of analysisResult block
const analysisResultStart = content.indexOf('{analysisResult && (');
if (analysisResultStart > -1) {
    // Find the end of it. The block starts at `        {analysisResult && (` and goes down to the end of its div.
    // Let's count braces or look for a unique string after it to split.
    // It is followed by `<div className="text-center mt-16 pt-8 border-t border-slate-200/60">` near the end.
    // Let's just find `        {analysisResult && (` and slice until `          </div>\n        )}\n\n        {/* AI Analytics Pro */}` 
    const aiAnalyticsProIndex = content.indexOf('{/* AI Analytics Pro */}');
    const endOfAnalysisResult = content.indexOf(')}', analysisResultStart);
    
    // Actually, let's use a simpler regex or split trick. 
    // Wait, the analysis block is huge.
    // Better way:
    // Split by `{analysisResult && (`
    const parts = content.split('        {analysisResult && (');
    if (parts.length === 2) {
        // Find where this block ends.
        const blockEndIndex = parts[1].indexOf('\n        <div className="text-center mt-16 pt-8 border-t border-slate-200/60">');
        
        if (blockEndIndex !== -1) {
            const analysisBlock = '        {analysisResult && (' + parts[1].substring(0, blockEndIndex);
            const remainder = parts[1].substring(blockEndIndex);
            
            // Now remove it from its original place.
            content = parts[0] + remainder;
            
            // Insert it after `</form>\n        </div>`
            const formEndString = `            {analysisError && (\n              <div className="mt-4 p-4 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100 flex items-center justify-center gap-2">\n                <X className="w-5 h-5" />\n                <span>{analysisError}</span>\n              </div>\n            )}\n          </form>\n        </div>`;
            
            content = content.replace(formEndString, formEndString + '\n\n' + analysisBlock);
        } else {
            console.error("Could not find end of analysisResult");
        }
    }
}

fs.writeFileSync(file, content);
console.log('App.jsx updated successfully.');
