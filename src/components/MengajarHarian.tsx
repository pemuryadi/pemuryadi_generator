import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { BookOpen, FileText, Download, Printer, Info, AlertCircle, Presentation, Map, Image as ImageIcon, CheckSquare, Star, Activity, Plus, Save } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import PrintSupportModal from './PrintSupportModal';
import AIVisualGenerator from './AIVisualGenerator';
import PDFRemixUpload from './PDFRemixUpload';
import { useAuth } from '../AuthContext';
import { getWatermarkHtml, getSignatureHtml } from '../utils/print';

const JENJANG_OPTIONS = ['SD/MI', 'SMP/MTs', 'SMA/MA', 'SMK/MAK'];
const FASE_OPTIONS = ['Fase A', 'Fase B', 'Fase C', 'Fase D', 'Fase E', 'Fase F'];
const KELAS_OPTIONS = {
  'Fase A': ['Kelas I', 'Kelas II'],
  'Fase B': ['Kelas III', 'Kelas IV'],
  'Fase C': ['Kelas V', 'Kelas VI'],
  'Fase D': ['Kelas VII', 'Kelas VIII', 'Kelas IX'],
  'Fase E': ['Kelas X'],
  'Fase F': ['Kelas XI', 'Kelas XII']
};

const MAPEL_UMUM = [
  'Pendidikan Agama dan Budi Pekerti',
  'Pendidikan Pancasila',
  'Bahasa Indonesia',
  'Matematika',
  'Ilmu Pengetahuan Alam (IPA)',
  'Ilmu Pengetahuan Sosial (IPS)',
  'Ilmu Pengetahuan Alam dan Sosial (IPAS)',
  'Bahasa Inggris',
  'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
  'Informatika',
  'Seni Budaya (Musik/Rupa/Teater/Tari)',
  'Prakarya / Kewirausahaan',
  'Sejarah',
  'Geografi',
  'Sosiologi',
  'Ekonomi',
  'Fisika',
  'Kimia',
  'Biologi',
  'Mata Pelajaran Kejuruan',
  'Muatan Lokal'
];

export default function MengajarHarian() {
  const [formData, setFormData] = useState({
    jenisGuru: 'Guru Kelas',
    semester: 'Ganjil (1)',
    jenjang: 'SD/MI',
    fase: 'Fase A',
    kelas: 'Kelas I',
    mataPelajaran: '',
    customMapel: '',
    topikMateri: '',
    remixText: '',
    hasInklusi: false,
    jumlahInklusi: ''
  });

  const [selectedFeatures, setSelectedFeatures] = useState({
    ringkasan: true,
    slide: true,
    petaPikiran: true,
    infographic: true,
    asesmen: true,
    rubrikSikap: true,
    rubrikHarian: true
  });

  const [isGenerating, setIsGenerating] = useState(false);

  React.useEffect(() => {
    const saved = localStorage.getItem('MengajarHarianData');
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const saveProgress = () => {
    localStorage.setItem('MengajarHarianData', JSON.stringify(formData));
    alert('Progress berhasil disimpan!');
  };

  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const { profile } = useAuth();

  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        jenjang: profile.jenjang || prev.jenjang
      }));
    }
  }, [profile]);

  const handleFeatureToggle = (feature: keyof typeof selectedFeatures) => {
    setSelectedFeatures(prev => ({ ...prev, [feature]: !prev[feature] }));
  };

  const generateContent = async () => {
    if (!formData.topikMateri) {
      setError('Mohon isi Topik/Materi terlebih dahulu.');
      return;
    }

    const mapel = formData.mataPelajaran === 'Lainnya' ? formData.customMapel : formData.mataPelajaran;
    if (formData.jenisGuru === 'Guru Mapel' && !mapel) {
      setError('Mohon pilih atau isi Mata Pelajaran.');
      return;
    }

    setIsGenerating(true);
    setError('');
    setResult(null);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error('API Key Gemini tidak ditemukan.');

      const ai = new GoogleGenAI({ apiKey });

      const requestedFeatures = Object.entries(selectedFeatures)
        .filter(([_, isSelected]) => isSelected)
        .map(([key]) => key);

      if (requestedFeatures.length === 0) {
        throw new Error('Pilih minimal satu fitur untuk di-generate.');
      }

      const prompt = `Buatkan perangkat mengajar harian dengan detail berikut:
Informasi Umum:
- Jenis Guru: ${formData.jenisGuru}
- Semester: ${formData.semester}
- Jenjang: ${formData.jenjang}
- Fase: ${formData.fase}
- Kelas: ${formData.kelas}
${formData.jenisGuru === 'Guru Mapel' ? `- Mata Pelajaran: ${mapel}` : ''}
- Topik/Materi: ${formData.topikMateri}
${formData.hasInklusi ? `- Terdapat Anak Inklusi: Ya, berjumlah ${formData.jumlahInklusi} siswa. Pastikan hasil generate menyediakan adaptasi atau modifikasi untuk anak inklusi.` : ''}

${formData.remixText ? `INSTRUKSI REMIX:
Gunakan teks referensi berikut sebagai dasar utama pembuatan konten. Remix dan kembangkan konten ini agar sesuai dengan kurikulum merdeka dan target audiens di atas:
---
${formData.remixText}
---` : ''}

Tolong buatkan konten untuk bagian-bagian berikut yang diminta (berikan dalam format JSON terstruktur):
${selectedFeatures.ringkasan ? '- "ringkasan": Ringkasan Materi Ajar yang komprehensif (format teks markdown biasa).' : ''}
${selectedFeatures.slide ? '- "slide": Array objek berisi "title" dan "content" (array of string) untuk setiap slide.' : ''}
${selectedFeatures.petaPikiran ? '- "petaPikiran": Array objek berisi "topic" (topik utama) dan "subtopics" (array of string) untuk mind map.' : ''}
${selectedFeatures.infographic ? '- "infographic": Array objek berisi "section" (judul bagian) dan "content" (penjelasan) untuk infografis.' : ''}
${selectedFeatures.asesmen ? '- "asesmen": Objek berisi "questions" (array soal dengan "number", "text", dan "options" jika pilihan ganda) dan "answers" (array jawaban dengan "number" dan "text").' : ''}
${selectedFeatures.rubrikSikap ? '- "rubrikSikap": Objek berisi "headers" (array string untuk kolom tabel) dan "rows" (array objek dengan "aspect" dan "criteria" array string sesuai header).' : ''}
${selectedFeatures.rubrikHarian ? '- "rubrikHarian": Objek berisi "headers" (array string untuk kolom tabel) dan "rows" (array objek dengan "aspect" dan "criteria" array string sesuai header).' : ''}
- "outOfTopic": Array string berisi ide-ide Out Of Topic (ice breakers, intermezzo, atau selingan) yang benar-benar efektif dan relevan untuk menyegarkan suasana kelas.

Pastikan hanya mengembalikan properti JSON untuk fitur yang diminta. PASTIKAN JSON VALID.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              ringkasan: { type: Type.STRING },
              slide: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    content: { type: Type.ARRAY, items: { type: Type.STRING } }
                  }
                }
              },
              petaPikiran: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    topic: { type: Type.STRING },
                    subtopics: { type: Type.ARRAY, items: { type: Type.STRING } }
                  }
                }
              },
              infographic: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    section: { type: Type.STRING },
                    content: { type: Type.STRING }
                  }
                }
              },
              asesmen: {
                type: Type.OBJECT,
                properties: {
                  questions: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        number: { type: Type.INTEGER },
                        text: { type: Type.STRING },
                        options: { type: Type.ARRAY, items: { type: Type.STRING } }
                      }
                    }
                  },
                  answers: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        number: { type: Type.INTEGER },
                        text: { type: Type.STRING }
                      }
                    }
                  }
                }
              },
              rubrikSikap: {
                type: Type.OBJECT,
                properties: {
                  headers: { type: Type.ARRAY, items: { type: Type.STRING } },
                  rows: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        aspect: { type: Type.STRING },
                        criteria: { type: Type.ARRAY, items: { type: Type.STRING } }
                      }
                    }
                  }
                }
              },
              rubrikHarian: {
                type: Type.OBJECT,
                properties: {
                  headers: { type: Type.ARRAY, items: { type: Type.STRING } },
                  rows: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        aspect: { type: Type.STRING },
                        criteria: { type: Type.ARRAY, items: { type: Type.STRING } }
                      }
                    }
                  }
                }
              },
              outOfTopic: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            }
          }
        }
      });

      if (response.text) {
        setResult(JSON.parse(response.text));
      } else {
        throw new Error('Gagal menghasilkan konten.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan saat menghasilkan konten.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    setIsPrintModalOpen(true);
  };

  const executePrint = () => {
    const printContent = document.getElementById('print-content');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;
      
      const watermark = getWatermarkHtml(profile?.role);
      const signature = getSignatureHtml(profile);
      
      printWindow.document.write(`
        <html>
          <head>
            <title>Print - Mengajar Harian</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #000; background: #fff; padding: 20px; position: relative; }
              h1, h2, h3 { color: #111; }
              .markdown-body { font-size: 12pt; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              @page { margin: 0; }
              @media print {
                body { padding: 2cm; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .no-print { display: none; }
                .page-break { page-break-before: always; }
              }
            </style>
          </head>
          <body>
            ${watermark}
            <div style="position: relative; z-index: 1;">
              ${printContent.innerHTML}
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
            </div>
            <script>
              window.onload = () => { window.print(); window.close(); }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
    setIsPrintModalOpen(false);
  };

  const renderMarkdown = (text: string) => {
    if (!text) return null;
    return (
      <div className="markdown-body prose prose-invert max-w-none text-slate-300">
        <ReactMarkdown>{text}</ReactMarkdown>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <BookOpen className="text-cyber-blue" size={28} />
            Mengajar Harian
          </h2>
          <p className="text-slate-400 text-sm mt-1">Generate perangkat mengajar harian lengkap dengan AI.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="cyber-card p-6 rounded-2xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Info size={18} className="text-cyber-blue" />
              Informasi Umum
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Jenis Guru</label>
                  <select 
                    className="w-full bg-slate-900/50 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-cyber-blue transition-all outline-none"
                    value={formData.jenisGuru}
                    onChange={(e) => setFormData({...formData, jenisGuru: e.target.value})}
                  >
                    <option className="bg-slate-900 text-white" value="Guru Kelas">Guru Kelas</option>
                    <option className="bg-slate-900 text-white" value="Guru Mapel">Guru Mapel</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Semester</label>
                  <select 
                    className="w-full bg-slate-900/50 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-cyber-blue transition-all outline-none"
                    value={formData.semester}
                    onChange={(e) => setFormData({...formData, semester: e.target.value})}
                  >
                    <option className="bg-slate-900 text-white" value="Ganjil (1)">Ganjil (1)</option>
                    <option className="bg-slate-900 text-white" value="Genap (2)">Genap (2)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Jenjang</label>
                  <select 
                    className="w-full bg-slate-900/50 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-cyber-blue transition-all outline-none"
                    value={formData.jenjang}
                    onChange={(e) => setFormData({...formData, jenjang: e.target.value, fase: 'Fase A', kelas: 'Kelas I'})}
                  >
                    {JENJANG_OPTIONS.map(j => <option className="bg-slate-900 text-white" key={j} value={j}>{j}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Fase</label>
                  <select 
                    className="w-full bg-slate-900/50 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-cyber-blue transition-all outline-none"
                    value={formData.fase}
                    onChange={(e) => setFormData({...formData, fase: e.target.value, kelas: KELAS_OPTIONS[e.target.value as keyof typeof KELAS_OPTIONS][0]})}
                  >
                    {FASE_OPTIONS.map(f => <option className="bg-slate-900 text-white" key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Kelas</label>
                <select 
                  className="w-full bg-slate-900/50 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-cyber-blue transition-all outline-none"
                  value={formData.kelas}
                  onChange={(e) => setFormData({...formData, kelas: e.target.value})}
                >
                  {(KELAS_OPTIONS[formData.fase as keyof typeof KELAS_OPTIONS] || []).map(k => (
                    <option className="bg-slate-900 text-white" key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>

              {formData.jenisGuru === 'Guru Mapel' && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Mata Pelajaran</label>
                  <select 
                    className="w-full bg-slate-900/50 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-cyber-blue transition-all outline-none mb-2"
                    value={formData.mataPelajaran}
                    onChange={(e) => setFormData({...formData, mataPelajaran: e.target.value})}
                  >
                    <option className="bg-slate-900 text-white" value="">-- Pilih Mata Pelajaran --</option>
                    {MAPEL_UMUM.map(m => <option className="bg-slate-900 text-white" key={m} value={m}>{m}</option>)}
                    <option className="bg-slate-900 text-white" value="Lainnya">+ Tambah Mapel Lainnya</option>
                  </select>
                  {formData.mataPelajaran === 'Lainnya' && (
                    <input 
                      type="text"
                      className="w-full bg-slate-900/50 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-cyber-blue transition-all outline-none"
                      placeholder="Masukkan nama mata pelajaran..."
                      value={formData.customMapel}
                      onChange={(e) => setFormData({...formData, customMapel: e.target.value})}
                    />
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Topik/Materi</label>
                <input 
                  type="text"
                  className="w-full bg-slate-900/50 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-cyber-blue transition-all outline-none"
                  placeholder="Contoh: Teks Deskripsi, Fotosintesis..."
                  value={formData.topikMateri}
                  onChange={(e) => setFormData({...formData, topikMateri: e.target.value})}
                />
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.hasInklusi}
                    onChange={(e) => setFormData({...formData, hasInklusi: e.target.checked})}
                    className="w-4 h-4 rounded border-slate-600 text-cyber-blue focus:ring-cyber-blue focus:ring-offset-slate-900 bg-slate-900"
                  />
                  <span className="text-sm font-medium text-slate-300">Terdapat Anak Inklusi</span>
                </label>
                
                {formData.hasInklusi && (
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Jumlah Siswa Inklusi</label>
                    <input 
                      type="number"
                      min="1"
                      className="w-full bg-slate-900/50 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-cyber-blue transition-all outline-none"
                      placeholder="Masukkan jumlah siswa inklusi..."
                      value={formData.jumlahInklusi}
                      onChange={(e) => setFormData({...formData, jumlahInklusi: e.target.value})}
                    />
                  </div>
                )}
              </div>

              <PDFRemixUpload 
                onTextExtracted={(text) => setFormData(prev => ({ ...prev, remixText: text }))}
                label="Remix dari PDF (Opsional)"
              />
            </div>
          </div>

          <div className="cyber-card p-6 rounded-2xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <CheckSquare size={18} className="text-cyber-purple" />
              Pilih Fitur Generate
            </h3>
            <div className="space-y-3">
              {[
                { id: 'ringkasan', label: 'Ringkasan Materi Ajar', icon: FileText, color: 'text-blue-400' },
                { id: 'slide', label: 'Slide Presentasi', icon: Presentation, color: 'text-orange-400' },
                { id: 'petaPikiran', label: 'Peta Pikiran (Mind Map)', icon: Map, color: 'text-green-400' },
                { id: 'infographic', label: 'InfoGraphic', icon: ImageIcon, color: 'text-pink-400' },
                { id: 'asesmen', label: 'Asesmen & Kunci Jawaban', icon: CheckSquare, color: 'text-red-400' },
                { id: 'rubrikSikap', label: 'Rubrik Penilaian Sikap', icon: Star, color: 'text-yellow-400' },
                { id: 'rubrikHarian', label: 'Rubrik Penilaian Harian', icon: Activity, color: 'text-purple-400' },
              ].map((feature) => (
                <label key={feature.id} className="flex items-center gap-3 p-3 rounded-lg border border-white/5 hover:bg-white/5 cursor-pointer transition-colors">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-slate-600 text-cyber-purple focus:ring-cyber-purple bg-slate-800"
                    checked={selectedFeatures[feature.id as keyof typeof selectedFeatures]}
                    onChange={() => handleFeatureToggle(feature.id as keyof typeof selectedFeatures)}
                  />
                  <feature.icon size={16} className={feature.color} />
                  <span className="text-sm text-slate-300">{feature.label}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-2 mt-4 w-full">
              <button 
                onClick={saveProgress}
                className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                title="Simpan Progress"
              >
                <Save size={18} /> Simpan
              </button>
              <button 
              onClick={generateContent}
              disabled={isGenerating}
              className="cyber-button btn-generate-animated flex-1 py-3 flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  <span>MEMPROSES...</span>
                </>
              ) : (
                <>
                  <Activity size={18} />
                  <span>GENERATE PERANGKAT</span>
                </>
              )}
            </button>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-3">
                <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {result ? (
            <>
              <AIVisualGenerator 
                context={{
                  subject: formData.mataPelajaran === 'Lainnya' ? formData.customMapel : formData.mataPelajaran,
                  topic: formData.topikMateri,
                  level: formData.jenjang,
                  phase: formData.fase,
                  class: formData.kelas,
                }}
              />
              <div className="cyber-card p-6 md:p-8 rounded-2xl relative">
              <div className="absolute top-6 right-6 flex gap-2 no-print">
                <button onClick={handlePrint} className="p-2 rounded-lg bg-cyber-blue/10 text-cyber-blue hover:bg-cyber-blue hover:text-black transition-colors">
                  <Printer size={20} />
                </button>
              </div>

              <div id="print-content" className="space-y-8">
                <div className="text-center border-b border-white/10 pb-6">
                  <h1 className="text-2xl md:text-3xl font-black text-white mb-2">Perangkat Mengajar Harian: {formData.topikMateri}</h1>
                  <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-400">
                    <span><strong>Jenis:</strong> {formData.jenisGuru}</span>
                    {formData.jenisGuru === 'Guru Mapel' && <span><strong>Mapel:</strong> {formData.mataPelajaran === 'Lainnya' ? formData.customMapel : formData.mataPelajaran}</span>}
                    <span><strong>Fase/Kelas:</strong> {formData.fase} / {formData.kelas}</span>
                    <span><strong>Semester:</strong> {formData.semester}</span>
                  </div>
                </div>

                {result.ringkasan && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold text-cyber-blue flex items-center gap-2 border-b border-cyber-blue/30 pb-2">
                      <FileText size={20} /> Ringkasan Materi Ajar
                    </h2>
                    {renderMarkdown(result.ringkasan)}
                  </div>
                )}

                {result.outOfTopic && Array.isArray(result.outOfTopic) && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold text-cyber-yellow flex items-center gap-2 border-b border-cyber-yellow/30 pb-2">
                      <Star size={20} /> Ide Out Of Topic (Ice Breaker / Intermezzo)
                    </h2>
                    <ul className="list-disc pl-5 space-y-2 text-slate-300">
                      {result.outOfTopic.map((idea: string, i: number) => (
                        <li key={i}>{idea}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.slide && Array.isArray(result.slide) && (
                  <div className="space-y-4 page-break">
                    <h2 className="text-xl font-bold text-orange-400 flex items-center gap-2 border-b border-orange-400/30 pb-2">
                      <Presentation size={20} /> Slide Presentasi
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {result.slide.map((s: any, i: number) => (
                        <div key={i} className="gen-card bg-slate-800/50 rounded-xl p-5 shadow-lg">
                          <h3 className="text-lg font-bold text-white mb-3 border-b border-slate-600 pb-2">Slide {i + 1}: {s.title}</h3>
                          <ul className="list-disc pl-5 space-y-1 text-slate-300 text-sm">
                            {s.content.map((c: string, j: number) => <li key={j}>{c}</li>)}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.petaPikiran && Array.isArray(result.petaPikiran) && (
                  <div className="space-y-4 page-break">
                    <h2 className="text-xl font-bold text-green-400 flex items-center gap-2 border-b border-green-400/30 pb-2">
                      <Map size={20} /> Peta Pikiran (Mind Map)
                    </h2>
                    <div className="gen-card bg-slate-900/50 p-6 rounded-xl">
                      <div className="flex flex-col space-y-6">
                        {result.petaPikiran.map((node: any, i: number) => (
                          <div key={i} className="relative pl-8">
                            {/* Vertical Line */}
                            <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-green-500/30"></div>
                            {/* Node Dot */}
                            <div className="absolute left-[9px] top-2 w-3 h-3 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]"></div>
                            
                            <h3 className="text-lg font-bold text-green-300 mb-2">{node.topic}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {node.subtopics.map((sub: string, j: number) => (
                                <div key={j} className="gen-card bg-slate-800/80 px-4 py-2 rounded-lg text-sm text-slate-300 flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-green-500/50"></div>
                                  {sub}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {result.infographic && Array.isArray(result.infographic) && (
                  <div className="space-y-4 page-break">
                    <h2 className="text-xl font-bold text-pink-400 flex items-center gap-2 border-b border-pink-400/30 pb-2">
                      <ImageIcon size={20} /> InfoGraphic
                    </h2>
                    <div className="flex flex-col gap-4">
                      {result.infographic.map((info: any, i: number) => (
                        <div key={i} className="gen-card flex flex-col md:flex-row gap-4 bg-slate-800/40 rounded-xl p-4 /20">
                          <div className="md:w-1/3">
                            <div className="bg-pink-500/10 text-pink-400 font-bold px-4 py-2 rounded-lg inline-block border border-pink-500/30">
                              {info.section}
                            </div>
                          </div>
                          <div className="md:w-2/3 text-slate-300 text-sm flex items-center">
                            {info.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.asesmen && result.asesmen.questions && (
                  <div className="space-y-4 page-break">
                    <h2 className="text-xl font-bold text-red-400 flex items-center gap-2 border-b border-red-400/30 pb-2">
                      <CheckSquare size={20} /> Asesmen & Kunci Jawaban
                    </h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Kolom Soal */}
                      <div className="gen-card bg-slate-800/30 rounded-xl p-5">
                        <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-600 pb-2">Soal Latihan</h3>
                        <div className="space-y-4">
                          {result.asesmen.questions.map((q: any, i: number) => (
                            <div key={i} className="text-sm">
                              <p className="text-slate-200 font-medium mb-2">{q.number}. {q.text}</p>
                              {q.options && q.options.length > 0 && (
                                <ul className="space-y-1 pl-4">
                                  {q.options.map((opt: string, j: number) => (
                                    <li key={j} className="text-slate-400">{String.fromCharCode(65 + j)}. {opt}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Kolom Jawaban */}
                      <div className="gen-card bg-slate-800/30 rounded-xl p-5">
                        <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-600 pb-2">Kunci Jawaban</h3>
                        <div className="space-y-2">
                          {result.asesmen.answers.map((a: any, i: number) => (
                            <div key={i} className="flex gap-3 text-sm border-b border-slate-700/50 pb-2 last:border-0">
                              <span className="font-bold text-red-400 w-6">{a.number}.</span>
                              <span className="text-slate-300">{a.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {result.rubrikSikap && result.rubrikSikap.headers && (
                  <div className="space-y-4 page-break">
                    <h2 className="text-xl font-bold text-yellow-400 flex items-center gap-2 border-b border-yellow-400/30 pb-2">
                      <Star size={20} /> Rubrik Penilaian Sikap
                    </h2>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left text-slate-300">
                        <thead className="text-xs text-white uppercase bg-slate-800/80 border-b border-slate-600">
                          <tr>
                            <th className="px-4 py-3">Aspek</th>
                            {result.rubrikSikap.headers.map((h: string, i: number) => <th key={i} className="px-4 py-3">{h}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {result.rubrikSikap.rows.map((row: any, i: number) => (
                            <tr key={i} className="bg-slate-900/30 border-b border-slate-700/50 hover:bg-slate-800/50">
                              <td className="px-4 py-3 font-medium text-white">{row.aspect}</td>
                              {row.criteria.map((c: string, j: number) => <td key={j} className="px-4 py-3">{c}</td>)}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {result.rubrikHarian && result.rubrikHarian.headers && (
                  <div className="space-y-4 page-break">
                    <h2 className="text-xl font-bold text-purple-400 flex items-center gap-2 border-b border-purple-400/30 pb-2">
                      <Activity size={20} /> Rubrik Penilaian Harian
                    </h2>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left text-slate-300">
                        <thead className="text-xs text-white uppercase bg-slate-800/80 border-b border-slate-600">
                          <tr>
                            <th className="px-4 py-3">Aspek</th>
                            {result.rubrikHarian.headers.map((h: string, i: number) => <th key={i} className="px-4 py-3">{h}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {result.rubrikHarian.rows.map((row: any, i: number) => (
                            <tr key={i} className="bg-slate-900/30 border-b border-slate-700/50 hover:bg-slate-800/50">
                              <td className="px-4 py-3 font-medium text-white">{row.aspect}</td>
                              {row.criteria.map((c: string, j: number) => <td key={j} className="px-4 py-3">{c}</td>)}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
            <div className="cyber-card p-12 rounded-2xl flex flex-col items-center justify-center text-center h-full min-h-[400px]">
              <div className="w-20 h-20 rounded-full bg-cyber-blue/10 flex items-center justify-center mb-6">
                <BookOpen size={40} className="text-cyber-blue opacity-50" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Belum Ada Perangkat</h3>
              <p className="text-slate-400 max-w-md">
                Isi informasi umum di samping, pilih fitur yang ingin di-generate, lalu klik tombol "Generate Perangkat" untuk membuat perangkat mengajar harian Anda.
              </p>
            </div>
          )}
        </div>
      </div>

      <PrintSupportModal 
        isOpen={isPrintModalOpen} 
        onClose={() => setIsPrintModalOpen(false)} 
        onConfirm={executePrint} 
      />
    </div>
  );
}
