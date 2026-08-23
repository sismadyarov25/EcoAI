import fs from 'fs';

let content = fs.readFileSync('src/App.jsx', 'utf8');

// 1. add familySize
if (!content.includes('const [familySize, setFamilySize]')) {
    content = content.replace(
        "const [waste, setWaste] = useState('32');         // кг",
        "const [waste, setWaste] = useState('32');         // кг\n  const [familySize, setFamilySize] = useState('4'); // чел"
    );
}

// 2. update calculateEcoData
if (!content.includes('peopleCount: parseInt(familySize)')) {
    content = content.replace(
        "wasteKg: wstVal,",
        "wasteKg: wstVal,\n        peopleCount: parseInt(familySize) || 4,"
    );
}

// 3. update grid to 4 cols
content = content.replace(
    '<div className="grid grid-cols-1 md:grid-cols-3 gap-6">',
    '<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">'
);

// 4. Add the family size widget
const wasteWidgetEnd = `</p>
              </div>

            </div>`;
            
const familyWidget = `</p>
              </div>

              {/* Family Size Input */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 transition-all focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 flex flex-col justify-between">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between mb-2">
                    <span className="flex items-center gap-1.5">
                      <User className="w-4 h-4 text-indigo-500" />
                      Семья
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">человек</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={familySize}
                      onChange={(e) => setFamilySize(e.target.value)}
                      required
                      className="w-full bg-transparent text-2xl font-bold text-slate-900 focus:outline-none pr-10"
                    />
                    <span className="absolute right-0 text-sm font-semibold text-slate-400">чел</span>
                  </div>
                </div>
                <p className="text-[11px] font-medium text-slate-500 mt-3 pt-2 border-t border-slate-200/60">
                  💡 Учитывается для расчета норм
                </p>
              </div>

            </div>`;

if (!content.includes('Family Size Input')) {
    content = content.replace(wasteWidgetEnd, familyWidget);
}

// 5. Move analysisResult block
const analysisBlockStart = '        {analysisResult && (';
const parts = content.split(analysisBlockStart);

if (parts.length >= 2) {
    // parts[1] contains the block and everything after it.
    // The block ends at `        )}\n      </section>`
    const endStr = '        )}\n      </section>';
    const parts2 = parts[1].split(endStr);
    
    if (parts2.length >= 2) {
        const blockInner = parts2[0];
        const blockComplete = analysisBlockStart + blockInner + '        )}\n';
        
        // Remove the block from the original content
        let newContent = parts[0] + '      </section>' + parts2.slice(1).join(endStr);
        
        // Insert after the form ends
        const insertAfterStr = `            {analysisError && (\n              <div className="mt-4 p-4 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100 flex items-center justify-center gap-2">\n                <X className="w-5 h-5" />\n                <span>{analysisError}</span>\n              </div>\n            )}\n          </form>\n        </div>`;
        
        const insertIdx = newContent.indexOf(insertAfterStr);
        if (insertIdx !== -1) {
            newContent = newContent.substring(0, insertIdx + insertAfterStr.length) + '\n\n' + blockComplete + newContent.substring(insertIdx + insertAfterStr.length);
            fs.writeFileSync('src/App.jsx', newContent);
            console.log("App.jsx updated successfully!");
        } else {
            console.log("Could not find the insertion point.");
        }
    } else {
        console.log("Could not find the end of the analysis block.");
    }
} else {
    console.log("Could not find the start of the analysis block.");
}
