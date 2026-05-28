import React, { useState, useEffect } from 'react';
import { educationLevels, phaseClassMap, subjectsByLevel, anSubjects, olympiadSubjectsByLevel, mapelDescriptions } from '../constants';
import { GoogleGenAI, Type } from '@google/genai';
import Markdown from 'react-markdown';
import PrintSupportModal from './PrintSupportModal';
import PDFRemixUpload from './PDFRemixUpload';
import { useAuth } from '../AuthContext';
import { getWatermarkHtml, getSignatureHtml } from '../utils/print';

const INFOGRAPHIC_BASE_PROMPT = `
Create a vertical worksheet, portrait orientation, optimized to fit entirely on a single A4 page.
Style: modern, eye-catching, vibrant, professional educational worksheet.
Typography: compact and readable (use text-sm or text-xs for questions) to ensure everything fits on one page.

🧱 STRUKTUR GRID & LAYOUT (STRICT — FOLLOW EXACTLY)
MAIN GRID: Asymmetrical 2-column composition or top-bottom layout:
- If using a side illustration, make it SMALL (max 15-20% width). YOU MUST INCLUDE an actual HTML <img> tag with src="https://picsum.photos/seed/education/200/400" alt="Illustration" class="w-full h-auto object-cover rounded-xl shadow-sm". DO NOT make the illustration take up too much space like a giant sidebar.
- Content area (Header, Intro, Questions) should take up the majority of the space (80-85%).

Rules:
- Use compact margins and padding (e.g., p-2, p-3, gap-2) to save space.
- Ensure the layout is tight enough to fit all questions on a single A4 page.
- Each question panel should be compact.

🔝 PANEL 1 — HEADER UTAMA
- Main Headline: [TOPIC_TITLE] (Eye-catching, bold)
- Subheadline: [TOPIC_SUBTITLE]
- Identity Info: ONLY include Nama Siswa, Kelas, Tanggal, and Nama Sekolah. DO NOT put Nama Guru or Kepala Sekolah in the header!

🟨 PANEL 2 — INTI WORKSHEET (SOAL)
- Main content: [WORKSHEET_QUESTIONS_AND_TASKS]
- Presented as compact vertical stacked cards or a clean list. Use checkboxes or small input lines.

🎨 VISUAL STYLE & COLOR
- Vibrant, eye-catching, engaging colors for students.
- Clean, breathable but compact composition.
`;

export default function WorksheetGenerator() {
  const { profile } = useAuth();
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [formData, setFormData] = useState<{
    jenjang: string;
    fase: string;
    kelas: string;
    tipeUjian: string;
    mapel: string;
    topik: string;
    bentukSoal: string[];
    levelKognitif: string[];
    jumlahSoalTotal: number;
    jumlahSoalPerBentuk: Record<string, number>;
    instruksiTambahan: string;
    gayaDesain: string;
    namaGuru: string;
    jenisNipGuru: string;
    nipGuru: string;
    namaSekolah: string;
    jenisSekolah: string;
    kepalaSekolah: string;
    jenisNipKepalaSekolah: string;
    nipKepalaSekolah: string;
    remixText: string;
    remixData: { type: 'text' | 'inline', content: string, mimeType?: string } | null;
  }>({
    jenjang: 'sd',
    fase: 'A',
    kelas: '1',
    tipeUjian: 'Ujian Biasa',
    mapel: 'bahasa-indonesia',
    topik: '',
    bentukSoal: ['Pilihan Ganda'],
    jumlahSoalTotal: 5,
    jumlahSoalPerBentuk: { 'Pilihan Ganda': 5 },
    levelKognitif: ['C2', 'C3'],
    instruksiTambahan: '',
    gayaDesain: 'Minimalis',
    namaGuru: '',
    jenisNipGuru: 'NIP',
    nipGuru: '',
    namaSekolah: '',
    jenisSekolah: 'Negeri',
    kepalaSekolah: '',
    jenisNipKepalaSekolah: 'NIP',
    nipKepalaSekolah: '',
    remixText: '',
    remixData: null
  });

  const handleBentukSoalChange = (bentuk: string) => {
    let current = [...formData.bentukSoal];
    if (bentuk === 'Kombinasi') { current = ['Kombinasi']; }
    else {
      current = current.filter(c => c !== 'Kombinasi');
      if (current.includes(bentuk)) current = current.filter(c => c !== bentuk);
      else current.push(bentuk);
    }
    if (current.length === 0) current = ['Pilihan Ganda'];
    setFormData({ ...formData, bentukSoal: current });
  };

  const handleLevelKognitifChange = (lvl: string) => {
    let current = [...formData.levelKognitif];
    if (lvl === 'Kombinasi') { current = ['Kombinasi']; }
    else {
      current = current.filter(c => c !== 'Kombinasi');
      if (current.includes(lvl)) current = current.filter(c => c !== lvl);
      else current.push(lvl);
    }
    if (current.length === 0) current = ['C1'];
    setFormData({ ...formData, levelKognitif: current });
  };

  const [result, setResult] = useState<string | null>(null);

  const getSubjectList = () => {
    if (formData.tipeUjian === 'Asesmen Nasional') return anSubjects;
    if (formData.tipeUjian === 'Olimpiade') return olympiadSubjectsByLevel[formData.jenjang] || [];
    return subjectsByLevel[formData.jenjang] || [];
  };

  useEffect(() => {
    const list = getSubjectList();
    if (list.length > 0 && !list.find(s => s.id === formData.mapel)) {
      setFormData(prev => ({ ...prev, mapel: list[0].id }));
    }
  }, [formData.tipeUjian, formData.jenjang]);

  const designPrompts: Record<string, string> = {
    'Minimalis': 'Use mostly white space, thin lines, soft gray and navy colors. Clean layout, no clutter, very clear structure.',
    'Colorful': 'Use bright but balanced colors (blue, yellow, green, orange). Add soft gradient highlights, icons, and friendly shapes.',
    'Playful': 'Add cute icons, rounded shapes, doodle elements, and soft colorful highlights. Friendly and engaging.',
    'Modern': 'Use clean grid layout, bold typography, subtle gradients, glassmorphism or soft shadow effects.',
    'Vintage': 'Use soft beige, brown, and muted tones. Add paper texture, classic typography, and subtle decorative lines.'
  };

  useEffect(() => {
    const phases = phaseClassMap[formData.jenjang]?.phases || [];
    if (!phases.find(p => p.id === formData.fase)) {
      const firstPhase = phases[0]?.id || '';
      const classes = phaseClassMap[formData.jenjang]?.classes[firstPhase] || [];
      const firstClass = classes[0]?.id || '';
      
      const list = getSubjectList();
      const firstSubject = list[0]?.id || '';
      
      setFormData(prev => ({ ...prev, fase: firstPhase, kelas: firstClass, mapel: firstSubject }));
    } else {
      const classes = phaseClassMap[formData.jenjang]?.classes[formData.fase] || [];
      if (!classes.find(c => c.id === formData.kelas)) {
        setFormData(prev => ({ ...prev, kelas: classes[0]?.id || '' }));
      }
    }
  }, [formData.jenjang, formData.fase]);

  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        namaGuru: profile.displayName || prev.namaGuru,
        nipGuru: profile.nip || prev.nipGuru,
        namaSekolah: profile.namaSekolah || prev.namaSekolah,
        jenjang: profile.jenjang?.toLowerCase() || prev.jenjang
      }));
    }
  }, [profile]);

  const generateWorksheet = async () => {
    if (!formData.topik) {
      setError('Topik/Materi harus diisi.');
      return;
    }

    setIsGenerating(true);
    setError('');
    
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('API Key Gemini tidak ditemukan. Pastikan sudah diatur di environment.');
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const allSubjects = [...(subjectsByLevel[formData.jenjang] || []), ...anSubjects, ...(olympiadSubjectsByLevel[formData.jenjang] || [])];
      const subjectLabel = allSubjects.find(s => s.id === formData.mapel)?.label || formData.mapel;
      const faseLabel = phaseClassMap[formData.jenjang]?.phases.find(p => p.id === formData.fase)?.label || formData.fase;
      const kelasLabel = phaseClassMap[formData.jenjang]?.classes[formData.fase]?.find(c => c.id === formData.kelas)?.label || formData.kelas;
      const jenjangLabel = educationLevels.find(l => l.id === formData.jenjang)?.label || formData.jenjang;
      const mapelDescription = mapelDescriptions[formData.mapel] || '';

      const detailSoalInfo = formData.bentukSoal.includes('Kombinasi') 
        ? `Bentuk Soal: Kombinasi (${formData.jumlahSoalTotal} soal total)` 
        : `Bentuk Soal: ${formData.bentukSoal.map(b => `${b} (${formData.jumlahSoalPerBentuk[b] || 0} soal)`).join(', ')}`;

      const prompt = `Buatkan Lembar Kerja Peserta Didik (LKPD) / Worksheet edukatif untuk:
Jenjang: ${jenjangLabel}
Fase/Kelas: ${faseLabel} / ${kelasLabel}
Mata Pelajaran: ${subjectLabel}
Deskripsi Mapel: ${mapelDescription}
Tipe Ujian: ${formData.tipeUjian}
Topik/Materi: ${formData.topik}
${detailSoalInfo}
Level Kognitif: ${formData.levelKognitif.join(', ')}
Instruksi Tambahan: ${formData.instruksiTambahan || 'Tidak ada'}

${formData.remixData?.type === 'text' ? `INSTRUKSI REMIX:
Gunakan teks referensi berikut sebagai dasar utama pembuatan Worksheet. Remix dan kembangkan konten ini agar sesuai dengan kurikulum merdeka dan target audiens di atas:
---
${formData.remixData.content}
---` : ''}

Konteks Kurikulum Merdeka & Pedagogi:
1. Taksonomi Bloom:
   - Fokus HOTS: Kurikulum Merdeka mendorong keseimbangan antara LOTS (C1-C2) dan HOTS (C4-C6), dengan penekanan lebih pada tingkat tinggi.
   - Dimensi Pengetahuan: Selain proses kognitif, target juga mencakup dimensi pengetahuan: Faktual, Konseptual, Prosedural, dan Metakognitif.
   - Kata Kerja Operasional (KKO): Gunakan KKO yang spesifik untuk merumuskan soal agar dapat diukur.
   - Fleksibilitas: Tingkat kognitif disesuaikan dengan fase perkembangan peserta didik.
   - JANGAN tampilkan label (C1, C2, dll) pada hasil akhir, cukup gunakan KKO yang tepat.
2. Tujuan Pembelajaran (ABCD): Jika memungkinkan, formulasikan instruksi/tujuan dengan prinsip Audience (Peserta didik), Behavior (Perilaku/KKO), Condition (Kondisi pembelajaran), dan Degree (Kriteria keberhasilan).
3. TPACK & STEAM: Integrasikan pendekatan Technological Pedagogical Content Knowledge (TPACK) dan Science, Technology, Engineering, Art, Mathematics (STEAM) dalam rancangan kegiatan atau soal jika relevan.
4. KELENGKAPAN WORKSHEET (PENTING):
   Di bagian paling akhir worksheet, tambahkan bagian-bagian berikut (sebaiknya berikan page break atau pemisah yang jelas agar bisa dipisah oleh guru):
   a. Kunci Jawaban (Sesuai dengan bentuk soal dan level kognitif).
   b. Pedoman/Skor Penilaian (Rubrik penilaian rinci untuk setiap soal dan total skor).
   c. Program Remedial (Aktivitas atau soal tambahan untuk siswa yang belum mencapai Kriteria Ketercapaian Tujuan Pembelajaran).
   d. Program Pengayaan (Aktivitas atau materi pendalaman untuk siswa yang sudah melampaui capaian pembelajaran).
   Gunakan source referensi atau teks remix yang ada sesuai dengan mata pelajaran dan topik untuk membuat bagian-bagian ini secara terintegrasi.

Instruksi Desain (SANGAT PENTING - GUNAKAN STRUKTUR INFOGRAFIK INI):
${INFOGRAPHIC_BASE_PROMPT}

Sentuhan Gaya Visual Tambahan:
${designPrompts[formData.gayaDesain]}

Berikan hasil HANYA dalam format kode HTML lengkap (hanya bagian dalam <body>, tanpa tag <html>, <head>, atau <body>) yang menggunakan Tailwind CSS classes untuk styling.
Pastikan desainnya sangat menarik, interaktif, dan mengikuti struktur grid 40/60 (kiri visual, kanan teks) sesuai instruksi di atas.
Gunakan elemen HTML seperti <input type="text"> untuk isian, <input type="radio"> untuk pilihan ganda, dll.
Jangan gunakan markdown \`\`\`html, langsung kembalikan string HTML-nya saja tanpa embel-embel teks lain.`;

      const contentsParts: any[] = [{ text: prompt }];

      if (formData.remixData && formData.remixData.type === 'inline') {
        contentsParts.push({
          inlineData: {
            data: formData.remixData.content,
            mimeType: formData.remixData.mimeType
          }
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: contentsParts,
      });

      let htmlContent = response.text || '';
      // Clean up markdown code blocks if AI still includes them
      htmlContent = htmlContent.replace(/^```html\n?/, '').replace(/\n?```$/, '');

      setResult(htmlContent);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan saat menghasilkan worksheet.');
    } finally {
      setIsGenerating(false);
    }
  };

  const printWorksheet = () => {
    if (!result) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>Worksheet - ${formData.topik}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
              @page {
                size: A4 portrait;
                margin: 2.54cm !important;
              }
              body {
                font-family: Arial, sans-serif;
                color: #000;
              }
              @media print {
                
                html, body {
                  width: 100% !important;
                  max-width: 100% !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  overflow-x: hidden !important;
                }
                
                html, body {
                  width: 100% !important;
                  max-width: 100% !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  overflow-x: hidden !important;
                }
                body { -webkit-print-color-adjust: exact !important; 
                  print-color-adjust: exact !important; 
                  padding: 0 !important; 
                  margin: 0 !important; 
                  width: 100% !important;
                  max-width: 100% !important;
                }
                .no-print { display: none !important; } 

                /* Advanced Table Printing Resets */
                table, table * {
                  white-space: normal !important;
                }
                [class*="min-w-"], [class*="w-max"], [class*="whitespace-nowrap"] {
                  min-width: 0 !important;
                  white-space: normal !important;
                }
                .whitespace-nowrap {
                  white-space: normal !important;
                }
  
                
                table {
                  width: 100% !important;
                  max-width: 100% !important;
                  table-layout: fixed !important;
                  page-break-inside: auto !important;
                  border-collapse: collapse !important;

                  width: 100% !important;
                  max-width: 100% !important;
                  table-layout: fixed !important;
                  page-break-inside: auto !important;
                  border-collapse: collapse !important;

                  width: 100% !important;
                  max-width: 100% !important;
                  min-width: 0 !important;
                  border-collapse: collapse !important;
                  table-layout: fixed !important;
                  page-break-inside: auto !important;
                }
                tr {
                  page-break-inside: avoid !important;
                  page-break-after: auto !important;
                }
                th, td { word-wrap: break-word !important; border: 1px solid #777 !important; padding: 10px !important;
                  word-break: break-word !important;
                  overflow-wrap: break-word !important;
                  white-space: normal !important;
                }
                th { width: 25% !important; }
                
                /* Reset tailwind's overflow properties which cut off content */
                .overflow-x-auto, .overflow-y-auto, .overflow-auto {
                  overflow: visible !important;
                  min-width: 0 !important;
                }

                .min-w-\[800px\] {
                  min-width: 0 !important;
                }
                
                img {
                  max-width: 100% !important;
                  height: auto !important;
                }
                
                pre, code, p {
                  white-space: pre-wrap !important;
                  word-break: break-word !important;
                }
              }
            </style>
      </head>
      <body>
          <div class="watermark">PEMURYADI - MAJU PENDIDIKAN INDONESIA</div>
          <div class="content-wrapper">
              ${result}
              <div style="margin-top: 40px; display: flex; justify-content: space-between; text-align: center; font-size: 12px;">
                  <div style="width: 45%;">
                      <p>Mengetahui,</p>
                      <p>Kepala Sekolah</p>
                      <br><br><br><br>
                      <p style="font-weight: bold; text-decoration: underline;">${profile?.kepalaSekolah || '................................'}</p>
                      <p>${profile?.jenisNipKepalaSekolah || 'NIP'}. ${profile?.nipKepalaSekolah || '................................'}</p>
                  </div>
                  <div style="width: 45%;">
                      <p>Dibuat pada, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      <p>Guru Pengampu</p>
                      <br><br><br><br>
                      <p style="font-weight: bold; text-decoration: underline;">${profile?.nama || '................................'}</p>
                      <p>${profile?.jenisNipGuru || 'NIP'}. ${profile?.nip || '................................'}</p>
                  </div>
              </div>
              
              <div class="support-footer">
                  <p>Dokumen ini dihasilkan secara otomatis oleh <strong>Worksheet Generator - Pemuryadi</strong></p>
                  <p>Maju Pendidikan Indonesia @2026</p>
                  <p style="margin-top: 10px; font-style: italic;">"Dukungan Anda sangat berarti bagi kami untuk terus mengembangkan platform ini secara gratis."</p>
                  <div class="support-links">
                      <span>Saweria: saweria.co/pemuryadi</span>
                      <span>FB/IG/TikTok: @p.e.muryadi</span>
                  </div>
              </div>
          </div>
          ${getWatermarkHtml(profile?.role)}
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
              }, 500);
            };
          </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="gen-card rounded-2xl p-6 md:p-8 bg-gradient-to-br from-slate-800 to-slate-900 shadow-xl">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-2xl shadow-lg">
          📝
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white">AI Worksheet Generator</h3>
          <p className="text-slate-400">Buat Lembar Kerja Peserta Didik (LKPD) interaktif dengan AI</p>
        </div>
      </div>
      
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6 h-[700px] overflow-y-auto pr-2 custom-scrollbar">
          
          <div className="gen-card bg-slate-800/50 rounded-xl p-5 shadow-sm">
            <h4 className="font-semibold text-blue-400 mb-4 flex items-center gap-2">⚙️ Pengaturan Worksheet</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-slate-300 mb-2">Jenjang</label>
                <select value={formData.jenjang} onChange={e => setFormData({...formData, jenjang: e.target.value})} className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white focus:border-blue-500 transition-all">
                  {educationLevels.map(level => (
                    <option key={level.id} value={level.id}>{level.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-slate-300 mb-2">Fase</label>
                <select value={formData.fase} onChange={e => setFormData({...formData, fase: e.target.value})} className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white focus:border-blue-500 transition-all">
                  {phaseClassMap[formData.jenjang]?.phases.map(p => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-slate-300 mb-2">Kelas</label>
                <select value={formData.kelas} onChange={e => setFormData({...formData, kelas: e.target.value})} className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white focus:border-blue-500 transition-all">
                  {phaseClassMap[formData.jenjang]?.classes[formData.fase]?.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-slate-300 mb-2">Tipe Ujian</label>
                <select value={formData.tipeUjian} onChange={e => setFormData({...formData, tipeUjian: e.target.value})} className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white focus:border-blue-500 transition-all">
                  <option value="Ujian Biasa">Ujian Biasa</option>
                  <option value="Asesmen Nasional">Asesmen Nasional</option>
                  <option value="Olimpiade">Olimpiade</option>
                </select>
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-slate-300 mb-2">Mata Pelajaran</label>
                <select value={formData.mapel} onChange={e => setFormData({...formData, mapel: e.target.value})} className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white focus:border-blue-500 transition-all">
                  {getSubjectList().map(s => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
                {mapelDescriptions[formData.mapel] && (
                  <p className="mt-1 text-[10px] text-blue-400/80 italic leading-tight">
                    {mapelDescriptions[formData.mapel]}
                  </p>
                )}
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">Topik / Materi Pembelajaran</label>
                <input type="text" placeholder="Contoh: Sistem Pencernaan Manusia" value={formData.topik} onChange={e => setFormData({...formData, topik: e.target.value})} className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-blue-500 transition-all" />
              </div>
            </div>
          </div>

          <div className="gen-card bg-slate-800/50 rounded-xl p-5 shadow-sm">
            <h4 className="font-semibold text-blue-400 mb-4 flex items-center gap-2">📝 Detail Soal</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Bentuk Soal</label>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                  {['Pilihan Ganda', 'Pilihan Ganda Kompleks', 'Benar Salah', 'Menjodohkan', 'Isian Singkat', 'Uraian', 'Essay', 'Kombinasi'].map(bentuk => (
                    <div key={bentuk} className="flex flex-col gap-1">
                      <label className="flex items-center gap-2 cursor-pointer bg-slate-800/50 p-2 rounded border border-slate-700 hover:border-blue-500/30 transition-colors">
                        <input
                          type="checkbox"
                          checked={formData.bentukSoal.includes(bentuk)}
                          onChange={() => handleBentukSoalChange(bentuk)}
                          className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 bg-slate-900"
                        />
                        <span className="text-[11px] text-slate-300">{bentuk}</span>
                      </label>
                      {formData.bentukSoal.includes(bentuk) && bentuk !== 'Kombinasi' && (
                        <input 
                          type="number" 
                          min="1" 
                          value={formData.jumlahSoalPerBentuk[bentuk] || ''} 
                          onChange={e => setFormData({...formData, jumlahSoalPerBentuk: {...formData.jumlahSoalPerBentuk, [bentuk]: parseInt(e.target.value) || 0}})} 
                          placeholder="Jumlah Soal"
                          className="w-full p-1.5 text-xs border border-slate-700 rounded bg-slate-800 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" 
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Level Kognitif</label>
                <div className="grid grid-cols-3 lg:grid-cols-4 gap-2">
                  {['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'HOTS', 'Kombinasi'].map(lvl => (
                    <label key={lvl} className="flex items-center gap-2 cursor-pointer bg-slate-800/50 p-2 rounded border border-slate-700 hover:border-blue-500/30 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.levelKognitif.includes(lvl)}
                        onChange={() => handleLevelKognitifChange(lvl)}
                        className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 bg-slate-900"
                      />
                      <span className="text-[11px] text-slate-300">{lvl}</span>
                    </label>
                  ))}
                </div>
              </div>

              {formData.bentukSoal.includes('Kombinasi') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Total Jumlah Soal (Kombinasi)</label>
                  <input type="number" min="1" max="100" value={formData.jumlahSoalTotal} onChange={e => setFormData({...formData, jumlahSoalTotal: parseInt(e.target.value) || 1})} className="w-full p-2.5 border border-slate-700 rounded-lg text-sm bg-slate-800 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 mt-4">Instruksi Tambahan (Opsional)</label>
                <textarea rows={2} placeholder="Contoh: Buat soal yang berkaitan dengan kehidupan sehari-hari siswa di daerah pesisir." value={formData.instruksiTambahan} onChange={e => setFormData({...formData, instruksiTambahan: e.target.value})} className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-blue-500 transition-all" />
              </div>

              <div>
                <PDFRemixUpload 
                  onDataExtracted={(data) => setFormData(prev => ({ ...prev, remixData: data }))}
                  label="Remix dari Dokumen (Opsional)"
                />
              </div>
            </div>
          </div>
          
          <div className="gen-card bg-slate-800/50 rounded-xl p-5 shadow-sm">
            <h4 className="font-semibold text-blue-400 mb-4 flex items-center gap-2">🎨 Gaya Desain</h4>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Pilih Gaya Desain Worksheet</label>
                <select value={formData.gayaDesain} onChange={e => setFormData({...formData, gayaDesain: e.target.value})} className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white focus:border-blue-500 transition-all">
                  {Object.keys(designPrompts).map(style => (
                    <option key={style} value={style}>{style}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-4 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button 
            onClick={generateWorksheet} 
            disabled={isGenerating}
            className={`w-full py-4 rounded-xl font-bold text-lg text-white transition-all flex items-center justify-center gap-2 shadow-lg btn-generate-animated ${
              isGenerating 
                ? 'bg-slate-600 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 hover:shadow-blue-500/25'
            }`}
          >
            {isGenerating ? (
              <>
                <span className="animate-spin text-2xl">⏳</span>
                <span>Menyusun Worksheet...</span>
              </>
            ) : (
              <>
                <span>✨</span> Generate Worksheet
              </>
            )}
          </button>
        </div>
        
        <div className="gen-card bg-slate-800/30 rounded-xl p-4 h-[700px] overflow-y-auto custom-scrollbar">
          {result ? (
            <div className="space-y-6 text-sm">
              <div className="flex flex-col items-end gap-2">
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsFullscreen(true)}
                    className="px-6 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold transition-all shadow-lg flex items-center gap-2"
                  >
                    <span>🖥️</span> Fullscreen
                  </button>
                  <button 
                    onClick={() => setIsPrintModalOpen(true)}
                    className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-lg flex items-center gap-2"
                  >
                    <span>🖨️</span> Print Worksheet
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 italic text-right">
                  * Gunakan Chrome di Desktop untuk hasil terbaik. Di mobile, gunakan "Simpan sebagai PDF".<br/>
                  * Jangan lupa support saya agar makin berusaha dalam memperbaiki website ini.
                </p>
              </div>
              <div 
                className="bg-white rounded-xl overflow-hidden shadow-inner min-h-[500px]"
                dangerouslySetInnerHTML={{ __html: result }}
              />
            </div>
          ) : (
            <div className="text-center text-slate-500 h-full flex flex-col items-center justify-center">
              <div className="text-6xl mb-4 opacity-50">📝</div>
              <p>Worksheet yang dihasilkan akan muncul di sini</p>
            </div>
          )}
        </div>
      </div>

      <PrintSupportModal 
        isOpen={isPrintModalOpen} 
        onClose={() => setIsPrintModalOpen(false)} 
        onConfirm={printWorksheet} 
      />

      {isFullscreen && result && (
        <div className="fixed inset-0 z-50 bg-slate-900/95 flex flex-col p-4 overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white">Worksheet Preview</h3>
            <div className="flex gap-2">
              <button 
                onClick={() => setIsPrintModalOpen(true)}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-lg flex items-center gap-2"
              >
                <span>🖨️</span> Print
              </button>
              <button 
                onClick={() => setIsFullscreen(false)}
                className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold transition-all shadow-lg flex items-center gap-2"
              >
                <span>❌</span> Tutup
              </button>
            </div>
          </div>
          <div className="flex-1 bg-white rounded-xl overflow-y-auto shadow-inner p-8 custom-scrollbar">
            <div dangerouslySetInnerHTML={{ __html: result }} className="max-w-[21cm] mx-auto bg-white min-h-[29.7cm] shadow-sm" />
          </div>
        </div>
      )}
    </div>
  );
}
