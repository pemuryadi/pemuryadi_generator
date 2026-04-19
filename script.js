const fs = require('fs');
const path = require('path');

const files = [
    'src/components/MengajarHarian.tsx',
    'src/components/KalenderPendidikan.tsx',
    'src/components/AnalisisHariEfektif.tsx',
    'src/components/ProgramTahunan.tsx',
    'src/components/ProgramSemester.tsx',
    'src/components/DeepLearningPlan.tsx',
    'src/components/ModuleGenerator.tsx',
    'src/components/DailyJournal.tsx',
    'src/components/Supervision.tsx',
    'src/components/KKTP.tsx',
    'src/components/ModulKokurikuler.tsx',
    'src/components/BuatSoal.tsx'
];

for (const filepath of files) {
    if (!fs.existsSync(filepath)) {
        console.log(`File not found: ${filepath}`);
        continue;
    }
    
    let content = fs.readFileSync(filepath, 'utf8');
    
    // 1. Add Save to lucide-react imports
    if (content.includes("from 'lucide-react'") && !content.includes("Save")) {
        content = content.replace(/(import \{[^}]+)( \} from 'lucide-react')/, "$1, Save$2");
    }
    
    // 2. Add useEffect and saveProgress
    const componentName = path.basename(filepath, '.tsx');
    const storageKey = `${componentName}Data`;
    
    const hookCode = `
  React.useEffect(() => {
    const saved = localStorage.getItem('${storageKey}');
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const saveProgress = () => {
    localStorage.setItem('${storageKey}', JSON.stringify(formData));
    alert('Progress berhasil disimpan!');
  };
`;
    
    if (!content.includes("saveProgress = () =>")) {
        content = content.replace(/(const \[isGenerating, setIsGenerating\] = useState\(false\);)/, `$1\n${hookCode}`);
    }
    
    // 3. Add Save button
    const buttonPattern = /(<button[^>]*onClick=\{generate[^>]*>[\s\S]*?<\/button>)/;
    
    if (!content.includes("onClick={saveProgress}")) {
        content = content.replace(buttonPattern, (match, btn) => {
            btn = btn.replace("w-full", "flex-1");
            return `<div className="flex gap-2 mt-4 w-full">
              <button 
                onClick={saveProgress}
                className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                title="Simpan Progress"
              >
                <Save size={18} /> Simpan
              </button>
              ${btn}
            </div>`;
        });
    }
    
    fs.writeFileSync(filepath, content);
}
console.log("Done!");
