import React, { useState, useEffect } from 'react';
import { BookOpen, CheckCircle, Sparkles, Printer, Loader2, Save } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { marked } from 'marked';
import PrintSupportModal from './PrintSupportModal';
import AIVisualGenerator from './AIVisualGenerator';
import PDFRemixUpload from './PDFRemixUpload';
import { educationLevels, phaseClassMap, subjectsByLevel, topicsBySubject } from '../constants';
import { useAuth } from '../AuthContext';
import { getWatermarkHtml } from '../utils/print';

const TEMA_OPTIONS = [
  "Literasi dan Numerasi",
  "Kesehatan dan Gaya Hidup Sehat",
  "Lingkungan Hidup dan Keberlanjutan",
  "Kewirausahaan",
  "Kewargaan dan Kebhinekaan",
  "Digital Safety dan Literasi Digital",
  "Kreativitas dan Inovasi",
  "Kepemimpinan dan Kolaborasi",
  "Budaya dan Kearifan Lokal",
  "Pencegahan Perundungan dan Kekerasan",
  "Keselamatan dan Mitigasi Bencana",
  "Penguatan Karakter dan Etika Sosial",
  "Generasi sehat dan bugar",
  "Peduli dan berbagi",
  "Aku cinta Indonesia",
  "Hidup hemat dan produktif",
  "Berkarya untuk sesama dan bangsa"
];

const SUBTEMA_OPTIONS: Record<string, string[]> = {
  keimanan: ["peduli dan berbagi", "Aku dan Sang Pencipta", "kegiatan keagamaan", "jurnal ibadah", "catatan syukur"],
  kewargaan: ["Hidup bersama dalam keberagaman", "Aku bagian dari bangsa ini", "Diskusi toleransi", "Simulasi pemilu mini", "Kegiatan gotong royong"],
  penalaranKritis: ["Menyelesaikan masalah", "Fakta dan opini", "Aku berpikir", "Proyek mini riset", "Analisis berita", "Eksperimen sederhana"],
  kreativitas: ["Aku bisa berkarya", "Inovasi untuk sekitar", "Karya seni", "Pameran ide", "Karya tulis kreatif", "Desain poster"],
  kolaborasi: ["Kerja tim itu asyik", "Bersama kita bisa", "Proyek kelompok", "Games kerja sama", "Forum diskusi"],
  kemandirian: ["Mengatur waktuku", "Aku bertanggung jawab", "Jurnal manajemen waktu", "Tantangan pribadi harian", "Penjadwalan mingguan"],
  kesehatan: ["Hidup sehat", "Aku sayang tubuhku", "Jadwal olahraga bersama", "Pojok sehat", "Kampanye gizi"],
  komunikasi: ["Bicara yang baik", "Aku bisa menyampaikan pendapat", "Debat kelompok", "Kegiatan presentasi", "Cerita pengalaman"]
};

export default function ModulKokurikuler() {
  const { profile } = useAuth();
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [tema, setTema] = useState('');
  const [praktik, setPraktik] = useState('');
  const [lingkungan, setLingkungan] = useState('');
  const [namaGuru, setNamaGuru] = useState('');
  const [jenisNipGuru, setJenisNipGuru] = useState('NIP');
  const [nipGuru, setNipGuru] = useState('');
  const [namaSekolah, setNamaSekolah] = useState('');
  const [jenisSekolah, setJenisSekolah] = useState('Negeri');
  const [kepalaSekolah, setKepalaSekolah] = useState('');
  const [jenisNipKepalaSekolah, setJenisNipKepalaSekolah] = useState('NIP');
  const [nipKepalaSekolah, setNipKepalaSekolah] = useState('');
  const [eduLevel, setEduLevel] = useState('sd');
  const [fase, setFase] = useState('A');
  const [kelas, setKelas] = useState('1');
  const [tahunAjaran, setTahunAjaran] = useState('2024/2025');
  const [mapel, setMapel] = useState('bahasa-indonesia');
  const [topikMateri, setTopikMateri] = useState('');
  const [isCustomTopik, setIsCustomTopik] = useState(false);
  const [tingkatanKognitif, setTingkatanKognitif] = useState('Campuran (Sesuai Kurikulum Merdeka)');
  
  const [dimensiProfil, setDimensiProfil] = useState({
    keimanan: false,
    kewargaan: false,
    penalaranKritis: false,
    kreativitas: false,
    kolaborasi: false,
    kemandirian: false,
    kesehatan: false,
    komunikasi: false
  });

  const [subtema, setSubtema] = useState('');
  const [isCustomSubtema, setIsCustomSubtema] = useState(false);
  const [pemanfaatanDigital, setPemanfaatanDigital] = useState('');

  const [gerakan7Kaih, setGerakan7Kaih] = useState({
    beribadah: false,
    berolahraga: false,
    bermasyarakat: false,
    gemarBelajar: false,
    bangunPagi: false,
    tidurTepatWaktu: false,
    makanSehat: false
  });

  const [kemitraan, setKemitraan] = useState({
    satuanPendidikan: false,
    keluarga: false,
    masyarakat: false
  });

  const [activeAsesmenTab, setActiveAsesmenTab] = useState('formatif');
  
  const [teknikFormatif, setTeknikFormatif] = useState({
    observasi: false,
    checklist: false
  });

  const [teknikSumatif, setTeknikSumatif] = useState('');
  const [isCustomSumatif, setIsCustomSumatif] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);

  React.useEffect(() => {
    const saved = localStorage.getItem('ModulKokurikulerData');
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const saveProgress = () => {
    localStorage.setItem('ModulKokurikulerData', JSON.stringify(formData));
    alert('Progress berhasil disimpan!');
  };

  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [remixText, setRemixText] = useState('');
  const [hasInklusi, setHasInklusi] = useState(false);
  const [jumlahInklusi, setJumlahInklusi] = useState('');

  useEffect(() => {
    const phases = phaseClassMap[eduLevel]?.phases || [];
    const firstPhase = phases[0]?.id || '';
    
    const classes = phaseClassMap[eduLevel]?.classes[firstPhase] || [];
    const firstClass = classes[0]?.id || '';

    const subjects = subjectsByLevel[eduLevel] || [];
    const firstSubject = subjects[0]?.id || '';
    
    const topics = topicsBySubject[firstSubject] || topicsBySubject['default'];
    const firstTopic = topics[0] || '';

    setFase(firstPhase);
    setKelas(firstClass);
    setMapel(firstSubject);
    setTopikMateri(firstTopic);
    setIsCustomTopik(false);
  }, [eduLevel]);

  useEffect(() => {
    const classes = phaseClassMap[eduLevel]?.classes[fase] || [];
    setKelas(classes[0]?.id || '');
  }, [fase, eduLevel]);

  useEffect(() => {
    const topics = topicsBySubject[mapel] || topicsBySubject['default'];
    setTopikMateri(topics[0] || '');
    setIsCustomTopik(false);
  }, [mapel]);

  const handleKemitraanChange = (key: keyof typeof kemitraan) => {
    setKemitraan(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDimensiChange = (key: keyof typeof dimensiProfil) => {
    setDimensiProfil(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleGerakanChange = (key: keyof typeof gerakan7Kaih) => {
    setGerakan7Kaih(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleTeknikChange = (key: keyof typeof teknikFormatif) => {
    setTeknikFormatif(prev => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    if (profile) {
      setNamaGuru(profile.displayName || '');
      setNipGuru(profile.nip || '');
      setEduLevel(profile.jenjang?.toLowerCase() || 'sd');
    }
  }, [profile]);

  const generateModul = async () => {
    if (!tema) {
      setError('Silakan pilih tema terlebih dahulu.');
      return;
    }

    setIsGenerating(true);
    setError('');
    setResult(null);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error('API Key Gemini tidak ditemukan.');

      const ai = new GoogleGenAI({ apiKey });
      
      const subjectLabel = subjectsByLevel[eduLevel]?.find(s => s.id === mapel)?.label || mapel;
      const faseLabel = phaseClassMap[eduLevel]?.phases.find(p => p.id === fase)?.label || fase;
      const kelasLabel = phaseClassMap[eduLevel]?.classes[fase]?.find(c => c.id === kelas)?.label || kelas;
      const jenjangLabel = educationLevels.find(l => l.id === eduLevel)?.label || eduLevel;

      const prompt = `Buatkan Modul Kokurikuler yang komprehensif berdasarkan data berikut. Ikuti format dan struktur sesuai dengan Panduan Kokurikuler 2025 terbaru dari Kemendikbudristek (seperti yang tercantum dalam panduan resmi). Pastikan semua bagian terisi secara otomatis dan komprehensif sesuai dengan kriteria pilihan pengunjung.

Data pengunjung:
Tema: ${tema}
Subtema: ${subtema}
Dimensi Profil Lulusan: ${Object.entries(dimensiProfil).filter(([_, v]) => v).map(([k]) => k).join(', ')}
Mata Pelajaran: ${subjectLabel}
Topik/Materi: ${topikMateri}
Fase/Kelas: ${faseLabel} / ${kelasLabel}
Jenjang: ${jenjangLabel}
Praktik Pedagogis: ${praktik}
Kondisi Lingkungan: ${lingkungan}
Pemanfaatan Digital: ${pemanfaatanDigital}
Gerakan 7 KAIH: ${Object.entries(gerakan7Kaih).filter(([_, v]) => v).map(([k]) => k).join(', ')}
Nama Guru: ${namaGuru}
${jenisNipGuru} Guru: ${nipGuru}
Sekolah: ${namaSekolah} (${jenisSekolah})
Kepala Sekolah: ${kepalaSekolah}
${jenisNipKepalaSekolah} Kepala Sekolah: ${nipKepalaSekolah}
Tahun Ajaran: ${tahunAjaran}
${hasInklusi ? `Terdapat Anak Inklusi: Ya, berjumlah ${jumlahInklusi} siswa. Pastikan hasil generate menyediakan adaptasi atau modifikasi untuk anak inklusi.` : ''}
Kemitraan: ${Object.entries(kemitraan).filter(([_, v]) => v).map(([k]) => k).join(', ')}
Asesmen Formatif: ${Object.entries(teknikFormatif).filter(([_, v]) => v).map(([k]) => k).join(', ')}
Asesmen Sumatif: ${teknikSumatif}

${remixText ? `INSTRUKSI REMIX:
Gunakan teks referensi berikut sebagai dasar utama pembuatan Modul Kokurikuler. Remix dan kembangkan konten ini agar sesuai dengan kurikulum merdeka dan target audiens di atas:
---
${remixText}
---` : ''}

Konteks Kurikulum Merdeka & Pedagogi (SANGAT PENTING):
1. Tingkatan Kognitif (Taksonomi Bloom): Target utama adalah ${tingkatanKognitif}. 
   - Seimbangkan LOTS (C1-C2) dan HOTS (C4-C6) sesuai target.
   - Integrasikan Dimensi Pengetahuan: Faktual, Konseptual, Prosedural, dan Metakognitif.
   - PENTING: JANGAN tampilkan label "C1", "C2", dll. secara eksplisit pada hasil akhir, cukup terapkan dalam kata kerja operasional dan aktivitas.
2. Tujuan Pembelajaran: Rumuskan tujuan pembelajaran secara otomatis berdasarkan pilihan pengunjung. JANGAN mencantumkan label (ABCD) pada hasil akhir.

Struktur Modul Kokurikuler 2025 harus mencakup bagian-bagian berikut secara berurutan:
A. IDENTITAS (Nama Satuan Pendidikan, Jenjang, Kelas/Fase, Semester, Tahun Ajaran, Bentuk Kokurikuler, Tema Kegiatan, Alokasi Waktu, Mata Pelajaran Terintegrasi, Lokasi Kegiatan)
B. ANALISIS SATUAN PENDIDIKAN (Kebutuhan Belajar Murid, Sumber Daya yang Dimiliki, Kondisi Kontekstual & Sosial, Rasional Pemilihan Dimensi Profil Lulusan)
C. DIMENSI PROFIL LULUSAN YANG DIPERKUAT (Tabel: No, Dimensi, Alasan Pemilihan Dimensi)
D. TUJUAN PEMBELAJARAN
E. RANGKAIAN KEGIATAN (Tabel: No, Kegiatan, JP)
F. PRAKTIK PEDAGOGIS (Model, Strategi, Pendekatan, Berkesadaran, Bermakna, Menggembirakan)
G. LINGKUNGAN BELAJAR (Fisik, Sosial, Psikologis, Akademik)
H. KEMITRAAN PEMBELAJARAN (Tabel: Mitra, Pihak yang Terlibat, Peran)
I. PEMANFAATAN TEKNOLOGI DIGITAL
J. ASESMEN (Jenis Asesmen Formatif, Contoh Format Anekdotal, Contoh Format Jurnal Harian, Jenis Asesmen Sumatif, Pelaporan Rapor)
K. LKPD JURNAL HARIAN & INSTRUMEN REFLEKSI (Lembar Kerja Peserta Didik, Jurnal Harian, Target Kebiasaan, Refleksi Mingguan, Lembar Rencana Aksi, Lembar Sesi Bercerita, Lembar Catatan Outbond, Refleksi Akhir Semester, Kesepakatan Aksi Nyata)
L. INSTRUMEN REFLEKSI GURU (Refleksi Umum Kegiatan, Refleksi Berdasarkan Prinsip Pembelajaran, Refleksi Perkembangan Dimensi Profil Lulusan, Evaluasi Kelengkapan Jurnal Harian, Rekomendasi untuk Semester Mendatang)

Gunakan format Markdown yang rapi dan profesional. Buat tabel menggunakan sintaks Markdown.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      setResult(response.text || '');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal menghasilkan modul.');
    } finally {
      setIsGenerating(false);
    }
  };

  const printModul = () => {
    if (!result) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>Modul Kokurikuler - ${tema}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
              @page {
                size: A4;
                margin: 0;
              }
              @media print {
                  body { 
                    -webkit-print-color-adjust: exact; 
                    print-color-adjust: exact; 
                    margin: 0;
                    padding: 10mm;
                  }
                  .no-print { display: none; }
                  .content-wrapper {
                    max-width: 100% !important;
                    padding: 5mm !important;
                    margin: 0 !important;
                  }
              }
              body {
                font-family: 'Inter', sans-serif;
                background: white;
                position: relative;
                min-height: 100vh;
                margin: 0;
                padding: 0;
              }
              .watermark {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(-45deg);
                font-size: 5vw;
                color: rgba(0, 0, 0, 0.05);
                white-space: nowrap;
                pointer-events: none;
                z-index: -1;
                font-weight: bold;
                text-transform: uppercase;
              }
              .content-wrapper {
                width: 100%;
                max-width: 210mm;
                margin: 0 auto;
                padding: 15mm;
                box-sizing: border-box;
              }
              .markdown-body h1 { font-size: 24px; font-weight: bold; margin-bottom: 16px; color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 8px; text-align: center; }
              .markdown-body h2 { font-size: 20px; font-weight: bold; margin-top: 24px; margin-bottom: 12px; color: #1e40af; background: #eff6ff; padding: 8px; border-radius: 4px; }
              .markdown-body h3 { font-size: 18px; font-weight: bold; margin-top: 16px; margin-bottom: 8px; color: #1e3a8a; }
              .markdown-body p { margin-bottom: 12px; line-height: 1.6; }
              .markdown-body ul, .markdown-body ol { margin-bottom: 16px; padding-left: 24px; }
              .markdown-body li { margin-bottom: 4px; }
              .markdown-body table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
              .markdown-body th, .markdown-body td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
              .markdown-body th { background: #f1f5f9; }
              .support-footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 2px solid #eee;
                text-align: center;
                font-size: 11px;
                color: #666;
              }
              .support-links {
                margin-top: 8px;
                display: center;
                justify-content: center;
                gap: 15px;
                font-weight: bold;
                color: #2563eb;
              }
          </style>
      </head>
      <body>
          <div class="watermark">PEMURYADI - MAJU PENDIDIKAN INDONESIA</div>
          <div class="content-wrapper">
              <div class="markdown-body">
                  ${marked.parse(result)}
              </div>

              <div style="margin-top: 40px; display: flex; justify-content: space-between; text-align: center; font-size: 12px; page-break-inside: avoid;">
                  <div style="width: 45%;">
                      <p>Mengetahui,</p>
                      <p>Kepala Sekolah</p>
                      <br><br><br><br>
                      <p style="font-weight: bold; text-decoration: underline;">${kepalaSekolah || '................................'}</p>
                      <p>${jenisNipKepalaSekolah || 'NIP'}. ${nipKepalaSekolah || '................................'}</p>
                  </div>
                  <div style="width: 45%;">
                      <p>Dibuat pada, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      <p>Guru Pengampu</p>
                      <br><br><br><br>
                      <p style="font-weight: bold; text-decoration: underline;">${namaGuru || '................................'}</p>
                      <p>${jenisNipGuru || 'NIP'}. ${nipGuru || '................................'}</p>
                  </div>
              </div>
              
              <div class="support-footer">
                  <p>Dokumen ini dihasilkan secara otomatis oleh <strong>Modul Kokurikuler - Pemuryadi</strong></p>
                  <p>Maju Pendidikan Indonesia &copy; ${new Date().getFullYear()}</p>
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="gen-card bg-slate-800/50 backdrop-blur-xl p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-500/20 rounded-xl">
            <BookOpen className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Modul Kokurikuler</h2>
            <p className="text-sm text-slate-400">Buat modul kokurikuler dengan bantuan AI</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Identitas */}
          <div className="gen-card bg-slate-800/50 rounded-xl p-5 shadow-sm">
            <h4 className="font-semibold text-amber-400 mb-4 flex items-center gap-2">👨‍🏫 Data Guru & Sekolah</h4>
            <div className="space-y-3">
              <input type="text" placeholder="Nama Guru" value={namaGuru} onChange={e => setNamaGuru(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-amber-500 transition-all" />
              <div className="flex gap-2">
                <select value={jenisNipGuru} onChange={e => setJenisNipGuru(e.target.value)} className="w-1/3 bg-slate-800 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-amber-500 transition-all">
                  <option value="NIP">NIP</option>
                  <option value="NUPTK">NUPTK</option>
                  <option value="NIY">NIY</option>
                  <option value="NRG">NRG</option>
                  <option value="NPK">NPK</option>
                </select>
                <input type="text" placeholder="Nomor Induk Guru" value={nipGuru} onChange={e => setNipGuru(e.target.value)} className="w-2/3 bg-slate-800 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-amber-500 transition-all" />
              </div>
              <input type="text" placeholder="Nama Sekolah" value={namaSekolah} onChange={e => setNamaSekolah(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-amber-500 transition-all" />
              <select value={jenisSekolah} onChange={e => setJenisSekolah(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-amber-500 transition-all">
                <option value="Negeri">Negeri</option>
                <option value="Swasta">Swasta</option>
                <option value="Islam Terpadu">Islam Terpadu</option>
              </select>
              <input type="text" placeholder="Nama Kepala Sekolah" value={kepalaSekolah} onChange={e => setKepalaSekolah(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-amber-500 transition-all" />
              <div className="flex gap-2">
                <select value={jenisNipKepalaSekolah} onChange={e => setJenisNipKepalaSekolah(e.target.value)} className="w-1/3 bg-slate-800 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-amber-500 transition-all">
                  <option value="NIP">NIP</option>
                  <option value="NUPTK">NUPTK</option>
                  <option value="NIY">NIY</option>
                  <option value="NRG">NRG</option>
                  <option value="NPK">NPK</option>
                </select>
                <input type="text" placeholder="Nomor Induk Kepala Sekolah" value={nipKepalaSekolah} onChange={e => setNipKepalaSekolah(e.target.value)} className="w-2/3 bg-slate-800 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-amber-500 transition-all" />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Jenjang</label>
                  <select value={eduLevel} onChange={e => setEduLevel(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-amber-500 transition-all">
                    {educationLevels.map(level => (
                      <option key={level.id} value={level.id}>{level.label}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Fase</label>
                    <select value={fase} onChange={e => setFase(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-amber-500 transition-all">
                      {phaseClassMap[eduLevel]?.phases.map(p => (
                        <option key={p.id} value={p.id}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Kelas</label>
                    <select value={kelas} onChange={e => setKelas(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-amber-500 transition-all">
                      {phaseClassMap[eduLevel]?.classes[fase]?.map(c => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-xs font-medium text-slate-400 mb-1">Tahun Ajaran</label>
                <select value={tahunAjaran} onChange={e => setTahunAjaran(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-amber-500 transition-all">
                  <option value="2023/2024">2023/2024</option>
                  <option value="2024/2025">2024/2025</option>
                  <option value="2025/2026">2025/2026</option>
                  <option value="2026/2027">2026/2027</option>
                </select>
              </div>

              <div className="mt-4">
                <label className="block text-xs font-medium text-slate-400 mb-1">Mata Pelajaran</label>
                <select value={mapel} onChange={e => setMapel(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-amber-500 transition-all">
                  {subjectsByLevel[eduLevel]?.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="mt-4">
                <label className="block text-xs font-medium text-slate-400 mb-1">Topik/Materi</label>
                <select 
                  value={isCustomTopik ? 'lainnya' : topikMateri} 
                  onChange={e => {
                    const val = e.target.value;
                    if (val === 'lainnya') {
                      setIsCustomTopik(true);
                      setTopikMateri('');
                    } else {
                      setIsCustomTopik(false);
                      setTopikMateri(val);
                    }
                  }} 
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-amber-500 transition-all"
                >
                  {(topicsBySubject[mapel] || topicsBySubject['default']).map((topic, idx) => (
                    <option key={idx} value={topic}>{topic}</option>
                  ))}
                  <option value="lainnya">Lainnya (+)</option>
                </select>
                {isCustomTopik && (
                  <input 
                    type="text" 
                    placeholder="Masukkan Topik/Materi secara manual..." 
                    value={topikMateri} 
                    onChange={e => setTopikMateri(e.target.value)} 
                    className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-amber-500 transition-all mt-3" 
                  />
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Tingkatan Kognitif (Taksonomi Bloom)</label>
                <select value={tingkatanKognitif} onChange={e => setTingkatanKognitif(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-amber-500 transition-all">
                  <option value="C1: Mengingat (Remembering)">C1: Mengingat (Remembering)</option>
                  <option value="C2: Memahami (Understanding)">C2: Memahami (Understanding)</option>
                  <option value="C3: Menerapkan (Applying)">C3: Menerapkan (Applying)</option>
                  <option value="C4: Menganalisis (Analyzing)">C4: Menganalisis (Analyzing)</option>
                  <option value="C5: Mengevaluasi (Evaluating)">C5: Mengevaluasi (Evaluating)</option>
                  <option value="C6: Menciptakan (Creating)">C6: Menciptakan (Creating)</option>
                  <option value="Campuran (Sesuai Kurikulum Merdeka)">Campuran (Sesuai Kurikulum Merdeka)</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={hasInklusi}
                    onChange={(e) => setHasInklusi(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-600 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-900 bg-slate-900"
                  />
                  <span className="text-sm font-medium text-slate-300">Terdapat Anak Inklusi</span>
                </label>
                
                {hasInklusi && (
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Jumlah Siswa Inklusi</label>
                    <input 
                      type="number"
                      min="1"
                      className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-amber-500 transition-all"
                      placeholder="Masukkan jumlah siswa inklusi..."
                      value={jumlahInklusi}
                      onChange={(e) => setJumlahInklusi(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <PDFRemixUpload 
                onTextExtracted={(text) => setRemixText(text)}
                label="Remix dari PDF (Opsional)"
              />
            </div>
          </div>

          {/* Konten Modul */}
          <div className="gen-card bg-slate-800/50 rounded-xl p-5 shadow-sm">
            <h4 className="font-semibold text-amber-400 mb-4 flex items-center gap-2">🏕️ Konten Modul</h4>
            <div className="space-y-4">
              {/* Tema */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Pilih tema</label>
                <select 
                  value={tema}
                  onChange={(e) => setTema(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">Pilih tema</option>
                  {TEMA_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {/* Dimensi Profil Lulusan */}
              <div className="border border-slate-700 rounded-xl p-4 bg-slate-800/30">
                <label className="block text-sm font-medium text-slate-300 mb-3">Dimensi Profil Lulusan</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { id: 'keimanan', label: 'Keimanan dan ketakwaan terhadap Tuhan YME' },
                    { id: 'kewargaan', label: 'Kewargaan' },
                    { id: 'penalaranKritis', label: 'Penalaran Kritis' },
                    { id: 'kreativitas', label: 'Kreativitas' },
                    { id: 'kolaborasi', label: 'Kolaborasi' },
                    { id: 'kemandirian', label: 'Kemandirian' },
                    { id: 'kesehatan', label: 'Kesehatan' },
                    { id: 'komunikasi', label: 'Komunikasi' }
                  ].map(item => (
                    <label key={item.id} className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input 
                          type="checkbox" 
                          checked={dimensiProfil[item.id as keyof typeof dimensiProfil]}
                          onChange={() => handleDimensiChange(item.id as keyof typeof dimensiProfil)}
                          className="peer sr-only" 
                        />
                        <div className="w-5 h-5 border-2 border-slate-500 rounded bg-slate-900/50 peer-checked:bg-blue-500 peer-checked:border-blue-500 transition-all"></div>
                        <CheckCircle className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                      </div>
                      <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Subtema */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Pilih Subtema</label>
                <select 
                  value={isCustomSubtema ? 'lainnya' : subtema}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'lainnya') {
                      setIsCustomSubtema(true);
                      setSubtema('');
                    } else {
                      setIsCustomSubtema(false);
                      setSubtema(val);
                    }
                  }}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">Pilih subtema</option>
                  {Array.from(new Set(
                    Object.entries(dimensiProfil)
                      .filter(([_, isSelected]) => isSelected)
                      .flatMap(([key]) => SUBTEMA_OPTIONS[key] || [])
                  )).map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                  <option value="lainnya">Lainnya (+)</option>
                </select>
                {isCustomSubtema && (
                  <input 
                    type="text" 
                    placeholder="Masukkan Subtema secara manual..." 
                    value={subtema} 
                    onChange={e => setSubtema(e.target.value)} 
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all mt-3" 
                  />
                )}
              </div>

              {/* Gerakan 7 KAIH */}
              <div className="border border-slate-700 rounded-xl p-4 bg-slate-800/30">
                <label className="block text-sm font-medium text-slate-300 mb-3">Gerakan 7 KAIH</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { id: 'beribadah', label: 'Beribadah' },
                    { id: 'berolahraga', label: 'Berolahraga' },
                    { id: 'bermasyarakat', label: 'Bermasyarakat' },
                    { id: 'gemarBelajar', label: 'Gemar Belajar' },
                    { id: 'bangunPagi', label: 'Bangun Pagi' },
                    { id: 'tidurTepatWaktu', label: 'Tidur Tepat Waktu' },
                    { id: 'makanSehat', label: 'Makan Sehat dan Bergizi' }
                  ].map(item => (
                    <label key={item.id} className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input 
                          type="checkbox" 
                          checked={gerakan7Kaih[item.id as keyof typeof gerakan7Kaih]}
                          onChange={() => handleGerakanChange(item.id as keyof typeof gerakan7Kaih)}
                          className="peer sr-only" 
                        />
                        <div className="w-5 h-5 border-2 border-slate-500 rounded bg-slate-900/50 peer-checked:bg-blue-500 peer-checked:border-blue-500 transition-all"></div>
                        <CheckCircle className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                      </div>
                      <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Pemanfaatan Digital */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Pemanfaatan Digital</label>
                <input 
                  type="text" 
                  placeholder="Contoh: Penggunaan Canva untuk poster, Google Forms untuk survei..." 
                  value={pemanfaatanDigital} 
                  onChange={e => setPemanfaatanDigital(e.target.value)} 
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                />
              </div>
            </div>
          </div>

          {/* Strategi & Lingkungan */}
          <div className="gen-card bg-slate-800/50 rounded-xl p-5 shadow-sm">
            <h4 className="font-semibold text-amber-400 mb-4 flex items-center gap-2">⚙️ Strategi & Lingkungan</h4>
            <div className="space-y-4">
              {/* Praktik Pedagogis */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Praktik Pedagogis</label>
                <select 
                  value={praktik}
                  onChange={(e) => setPraktik(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">Pilih praktik</option>
                  <option value="Pembelajaran Berbasis Proyek (PjBL)">Pembelajaran Berbasis Proyek (PjBL)</option>
                  <option value="Pembelajaran Berbasis Masalah (PBL)">Pembelajaran Berbasis Masalah (PBL)</option>
                  <option value="Inkuiri">Inkuiri</option>
                  <option value="Diskusi Kelompok">Diskusi Kelompok</option>
                  <option value="Bermain Peran (Role Play)">Bermain Peran (Role Play)</option>
                </select>
              </div>

              {/* Kondisi Lingkungan */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Kondisi Lingkungan</label>
                <select 
                  value={lingkungan}
                  onChange={(e) => setLingkungan(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">Pilih lingkungan</option>
                  <option value="Dalam Ruangan (Indoor)">Dalam Ruangan (Indoor)</option>
                  <option value="Luar Ruangan (Outdoor)">Luar Ruangan (Outdoor)</option>
                  <option value="Daring (Online)">Daring (Online)</option>
                  <option value="Campuran (Blended)">Campuran (Blended)</option>
                </select>
              </div>

              {/* Kemitraan Pembelajaran */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">Kemitraan Pembelajaran</label>
                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input 
                        type="checkbox" 
                        checked={kemitraan.satuanPendidikan}
                        onChange={() => handleKemitraanChange('satuanPendidikan')}
                        className="peer sr-only" 
                      />
                      <div className="w-5 h-5 border-2 border-slate-500 rounded bg-slate-900/50 peer-checked:bg-blue-500 peer-checked:border-blue-500 transition-all"></div>
                      <CheckCircle className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-slate-300 group-hover:text-white transition-colors">Satuan Pendidikan</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input 
                        type="checkbox" 
                        checked={kemitraan.keluarga}
                        onChange={() => handleKemitraanChange('keluarga')}
                        className="peer sr-only" 
                      />
                      <div className="w-5 h-5 border-2 border-slate-500 rounded bg-slate-900/50 peer-checked:bg-blue-500 peer-checked:border-blue-500 transition-all"></div>
                      <CheckCircle className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-slate-300 group-hover:text-white transition-colors">Keluarga</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input 
                        type="checkbox" 
                        checked={kemitraan.masyarakat}
                        onChange={() => handleKemitraanChange('masyarakat')}
                        className="peer sr-only" 
                      />
                      <div className="w-5 h-5 border-2 border-slate-500 rounded bg-slate-900/50 peer-checked:bg-blue-500 peer-checked:border-blue-500 transition-all"></div>
                      <CheckCircle className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-slate-300 group-hover:text-white transition-colors">Masyarakat</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Konfigurasi Asesmen */}
          <div className="border border-slate-700 rounded-xl overflow-hidden bg-slate-800/30">
            <div className="p-4 border-b border-slate-700 bg-slate-800/50">
              <h3 className="text-lg font-medium text-white">Konfigurasi Asesmen</h3>
            </div>
            
            <div className="flex border-b border-slate-700">
              <button 
                onClick={() => setActiveAsesmenTab('formatif')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${activeAsesmenTab === 'formatif' ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/5' : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/30'}`}
              >
                Asesmen Formatif
              </button>
              <button 
                onClick={() => setActiveAsesmenTab('sumatif')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${activeAsesmenTab === 'sumatif' ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/5' : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/30'}`}
              >
                Asesmen Sumatif
              </button>
            </div>

            <div className="p-5">
              {activeAsesmenTab === 'formatif' && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-300 mb-3">Pilih Teknik Asesmen Formatif</p>
                  
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input 
                          type="checkbox" 
                          checked={teknikFormatif.observasi}
                          onChange={() => handleTeknikChange('observasi')}
                          className="peer sr-only" 
                        />
                        <div className="w-5 h-5 border-2 border-slate-500 rounded bg-slate-900/50 peer-checked:bg-blue-500 peer-checked:border-blue-500 transition-all"></div>
                        <CheckCircle className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                      </div>
                      <span className="text-slate-300 group-hover:text-white transition-colors">Teknik observasi (Catatan Anekdotal)</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input 
                          type="checkbox" 
                          checked={teknikFormatif.checklist}
                          onChange={() => handleTeknikChange('checklist')}
                          className="peer sr-only" 
                        />
                        <div className="w-5 h-5 border-2 border-slate-500 rounded bg-slate-900/50 peer-checked:bg-blue-500 peer-checked:border-blue-500 transition-all"></div>
                        <CheckCircle className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                      </div>
                      <span className="text-slate-300 group-hover:text-white transition-colors">Instrumen checklist (Daftar Periksa)</span>
                    </label>
                  </div>

                  {(teknikFormatif.observasi || teknikFormatif.checklist) && (
                    <div className="mt-6 space-y-4">
                      <p className="text-sm text-slate-300">Pratinjau Instrumen</p>
                      
                      {teknikFormatif.observasi && (
                        <div className="border border-slate-700 rounded-lg overflow-hidden">
                          <div className="bg-slate-800 px-4 py-2 border-b border-slate-700">
                            <span className="text-xs font-medium text-slate-300">Teknik Observasi (Catatan Anekdotal)</span>
                          </div>
                          <div className="bg-slate-900/50 p-4">
                            <div className="grid grid-cols-2 gap-4 text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                              <div>Nama Murid</div>
                              <div>Catatan Guru</div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm text-slate-300">
                              <div className="italic">[Nama Siswa]</div>
                              <div className="italic">[Guru mencatat observasi spesifik di sini...]</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {teknikFormatif.checklist && (
                        <div className="border border-slate-700 rounded-lg overflow-hidden">
                          <div className="bg-slate-800 px-4 py-2 border-b border-slate-700">
                            <span className="text-xs font-medium text-slate-300">Instrumen Checklist (Daftar Periksa)</span>
                          </div>
                          <div className="bg-slate-900/50 p-4">
                            <div className="grid grid-cols-3 gap-4 text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                              <div>Nama Murid</div>
                              <div>Hasil Pengamatan (Checklist)</div>
                              <div>Catatan Guru</div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-sm text-slate-300">
                              <div className="italic">[Nama Siswa]</div>
                              <div className="italic">[Daftar periksa yang dibuat AI akan muncul di sini]</div>
                              <div className="italic">[Catatan tambahan guru...]</div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <p className="text-xs text-slate-500 mt-2">Pilih teknik asesmen formatif. Instrumen detail akan dibuat di modul yang dihasilkan.</p>
                    </div>
                  )}
                </div>
              )}
              
              {activeAsesmenTab === 'sumatif' && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-300 mb-3">Pilih Teknik Asesmen Sumatif</p>
                  <select 
                    value={isCustomSumatif ? 'lainnya' : teknikSumatif}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'lainnya') {
                        setIsCustomSumatif(true);
                        setTeknikSumatif('');
                      } else {
                        setIsCustomSumatif(false);
                        setTeknikSumatif(val);
                      }
                    }}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="">Pilih teknik asesmen sumatif</option>
                    <option value="Poster kampanye yang dibuat murid dalam proyek kolaboratif">Poster kampanye yang dibuat murid dalam proyek kolaboratif</option>
                    <option value="Presentasi akhir proyek kokurikuler">Presentasi akhir proyek kokurikuler</option>
                    <option value="Laporan pengamatan atau refleksi tertulis">Laporan pengamatan atau refleksi tertulis</option>
                    <option value="Produk berbasis kebudayaan lokal (dalam bentuk karya seni, video, atau pertunjukan)">Produk berbasis kebudayaan lokal (dalam bentuk karya seni, video, atau pertunjukan)</option>
                    <option value="Lembar penilaian kebiasaan (dalam G7KAIH) berdasarkan catatan harian">Lembar penilaian kebiasaan (dalam G7KAIH) berdasarkan catatan harian</option>
                    <option value="lainnya">Bentuk penilaian lainnya (+)</option>
                  </select>
                  {isCustomSumatif && (
                    <input 
                      type="text" 
                      placeholder="Masukkan bentuk penilaian lainnya..." 
                      value={teknikSumatif} 
                      onChange={e => setTeknikSumatif(e.target.value)} 
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all mt-3" 
                    />
                  )}
                  <p className="text-xs text-slate-500 mt-2">Instrumen detail akan dibuat di modul yang dihasilkan.</p>
                </div>
              )}
            </div>
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
            onClick={generateModul}
            disabled={isGenerating}
            className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2 btn-generate-animated"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Menghasilkan Modul...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Buat Modul</span>
              </>
            )}
          </button>
            </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-8 space-y-6">
            <AIVisualGenerator 
              context={{
                subject: subjectsByLevel[eduLevel]?.find(s => s.id === mapel)?.label || mapel,
                topic: topikMateri,
                level: educationLevels.find(l => l.id === eduLevel)?.label || eduLevel,
                phase: phaseClassMap[eduLevel]?.phases.find(p => p.id === fase)?.label || fase,
                class: phaseClassMap[eduLevel]?.classes[fase]?.find(c => c.id === kelas)?.label || kelas,
              }}
            />
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Hasil Modul</h3>
              <div className="flex flex-col items-end gap-2">
                <button 
                  onClick={() => setIsPrintModalOpen(true)}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold transition-all shadow-lg"
                >
                  <Printer className="w-4 h-4" />
                  Print Modul
                </button>
                <p className="text-[10px] text-slate-500 italic text-right">
                  * Gunakan Chrome di Desktop untuk hasil terbaik. Di mobile, gunakan "Simpan sebagai PDF".<br/>
                  * Jangan lupa support saya agar makin berusaha dalam memperbaiki website ini.
                </p>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-inner overflow-auto max-h-[800px] prose prose-slate max-w-none">
              <Markdown remarkPlugins={[remarkGfm]}>{result}</Markdown>
            </div>
          </div>
        )}
      </div>

      <PrintSupportModal 
        isOpen={isPrintModalOpen} 
        onClose={() => setIsPrintModalOpen(false)} 
        onConfirm={printModul} 
      />
    </div>
  );
}
