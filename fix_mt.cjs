const fs = require('fs');

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
    if (!fs.existsSync(filepath)) continue;
    let content = fs.readFileSync(filepath, 'utf8');
    
    // Remove mt-6 from the generate button if it's inside the flex gap-2 wrapper
    // The wrapper is <div className="flex gap-2 mt-4 w-full">
    // We can just replace 'flex-1 mt-6' with 'flex-1'
    content = content.replace(/className="([^"]*)flex-1 mt-6([^"]*)"/g, 'className="$1flex-1$2"');
    content = content.replace(/className="([^"]*)flex-1 mt-4([^"]*)"/g, 'className="$1flex-1$2"');
    
    fs.writeFileSync(filepath, content);
}
console.log("Fixed mt-6!");
