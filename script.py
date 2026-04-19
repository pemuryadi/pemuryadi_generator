import os
import re

files = [
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
]

for filepath in files:
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        continue
        
    with open(filepath, 'r') as f:
        content = f.read()
        
    # 1. Add Save to lucide-react imports
    if "from 'lucide-react'" in content and "Save" not in content:
        content = re.sub(r"(import \{[^}]+)( \}) from 'lucide-react'", r"\1, Save\2 from 'lucide-react'", content)
    elif "from 'lucide-react'" in content and "Save," not in content:
        # If it's like import { X, Y } from 'lucide-react';
        content = re.sub(r"(import \{)([^}]+)(\} from 'lucide-react')", r"\1 Save, \2\3", content)
        
    # 2. Add useEffect and saveProgress
    component_name = filepath.split('/')[-1].replace('.tsx', '')
    storage_key = f"{component_name}Data"
    
    hook_code = f"""
  React.useEffect(() => {{
    const saved = localStorage.getItem('{storage_key}');
    if (saved) {{
      try {{
        setFormData(JSON.parse(saved));
      }} catch (e) {{}}
    }}
  }}, []);

  const saveProgress = () => {{
    localStorage.setItem('{storage_key}', JSON.stringify(formData));
    alert('Progress berhasil disimpan!');
  }};
"""
    
    if "saveProgress = () =>" not in content:
        # Insert after const [isGenerating, setIsGenerating] = useState(false);
        content = re.sub(r"(const \[isGenerating, setIsGenerating\] = useState\(false\);)", r"\1\n" + hook_code, content)
        
    # 3. Add Save button
    # Find the button with onClick={generate...}
    # It usually looks like: <button onClick={generateSomething} ...> ... </button>
    # We want to wrap it in a flex container and add the save button before it.
    
    # We can use a regex to find the button tag that has onClick={generate
    button_pattern = r"(<button[^>]*onClick=\{generate[^>]*>[\s\S]*?</button>)"
    
    def replace_button(match):
        btn = match.group(1)
        # If the button is already wrapped or has w-full, we might want to adjust it.
        # Let's just wrap it in a flex gap-2
        # And change w-full to flex-1 if it has w-full
        btn = btn.replace("w-full", "flex-1")
        
        save_btn = f"""<div className="flex gap-2 mt-4 w-full">
              <button 
                onClick={{saveProgress}}
                className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                title="Simpan Progress"
              >
                <Save size={{18}} /> Simpan
              </button>
              {btn}
            </div>"""
        return save_btn

    if "onClick={saveProgress}" not in content:
        content = re.sub(button_pattern, replace_button, content, count=1)
        
    with open(filepath, 'w') as f:
        f.write(content)
        
print("Done!")
