import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { educationLevels, phaseClassMap, subjectsByLevel, cpData } from '../constants';
import { Loader2, FileText, List, Printer, AlertTriangle, Lightbulb, Sparkles, Save } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { getWatermarkHtml } from '../utils/print';
import PrintSupportModal from './PrintSupportModal';

export default function BuatSoal() {
  const { profile, consumeToken } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'kisi-kisi' | 'naskah' | 'kunci' | 'kartu'>('kisi-kisi');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printTypeToProceed, setPrintTypeToProceed] = useState<'kisi-kisi' | 'naskah' | 'kunci' | 'kartu' | null>(null);
  
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState<{
    jenjang: string;
    fase: string;
    kelas: string;
    semester: string;
    mapel: string;
    topik: string;
    materi: string;
    indikator: string;
    tipeUjian: string;
    bentukSoal: string[];
    levelKognitif: string[];
    jumlahSoalTotal: number;
    jumlahSoalPerBentuk: Record<string, number>;
    hasInklusi: boolean;
    jumlahInklusi: number;
    abkKategori: string;
  }>({
    jenjang: '',
    fase: '',
    kelas: '',
    semester: '',
    mapel: '',
    topik: '',
    materi: '',
    indikator: '',
    tipeUjian: 'Ujian Biasa',
    bentukSoal: ['Pilihan Ganda'],
    levelKognitif: ['C2', 'C3'],
    jumlahSoalTotal: 10,
    jumlahSoalPerBentuk: { 'Pilihan Ganda': 10 },
    hasInklusi: false,
    jumlahInklusi: 0,
    abkKategori: ''
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

  React.useEffect(() => {
    const saved = localStorage.getItem('BuatSoalData');
    if (saved) {
      try {
        setFormData(prev => ({ ...prev, ...JSON.parse(saved) }));
      } catch (e) {}
    }
  }, []);

  const saveProgress = () => {
    localStorage.setItem('BuatSoalData', JSON.stringify(formData));
    alert('Progress berhasil disimpan!');
  };

  const [resultKisiKisi, setResultKisiKisi] = useState<any>(null);
  const [resultSoal, setResultSoal] = useState<any>(null);

  useEffect(() => {
    const phases = phaseClassMap[formData.jenjang]?.phases || [];
    if (!phases.find(p => p.id === formData.fase)) {
      const firstPhase = phases[0]?.id || '';
      const classes = phaseClassMap[formData.jenjang]?.classes[firstPhase] || [];
      const firstClass = classes[0]?.id || '';
      
      const subjects = subjectsByLevel[formData.jenjang] || [];
      const firstSubject = subjects[0]?.id || '';
      
      setFormData(prev => ({ ...prev, fase: firstPhase, kelas: firstClass, mapel: firstSubject }));
    } else {
      const classes = phaseClassMap[formData.jenjang]?.classes[formData.fase] || [];
      if (!classes.find(c => c.id === formData.kelas)) {
        setFormData(prev => ({ ...prev, kelas: classes[0]?.id || '' }));
      }
    }
  }, [formData.jenjang, formData.fase]);

  const getCP = () => {
    const key = `${formData.jenjang}-${formData.mapel}-${formData.fase}`;
    return cpData[key] || 'Capaian Pembelajaran belum tersedia untuk kombinasi ini.';
  };

  const generateContent = async (type: 'kisi-kisi' | 'soal') => {
    setIsGenerating(true);
    setError('');
    
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('API Key Gemini tidak ditemukan.');
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const jenjangLabel = educationLevels.find(l => l.id === formData.jenjang)?.label || formData.jenjang;
      const mapelLabel = subjectsByLevel[formData.jenjang]?.find(s => s.id === formData.mapel)?.label || formData.mapel;
      const cp = getCP();

      const hasTokens = await consumeToken();
      if (!hasTokens) {
        throw new Error('Token Anda telah habis. Silakan langganan atau top up token untuk fitur ini.');
      }

      let prompt = '';
      let responseSchema: any = {};

      let totalSoal = 0;
      let breakdownSoal = '';
      if (formData.bentukSoal.includes('Kombinasi')) {
         totalSoal = formData.jumlahSoalTotal;
         breakdownSoal = `Jumlah Soal: ${totalSoal} Soal.`;
      } else {
         totalSoal = formData.bentukSoal.reduce((acc, b) => acc + (formData.jumlahSoalPerBentuk[b] || 0), 0);
         breakdownSoal = `Jumlah Soal: ${formData.bentukSoal.map(b => `${b} (${formData.jumlahSoalPerBentuk[b] || 0})`).join(', ')}. Total: ${totalSoal} Soal.`;
      }

      if (type === 'kisi-kisi') {
        prompt = `Buatkan Kisi-kisi Soal untuk:
Mata Pelajaran: ${mapelLabel}
Jenjang: ${jenjangLabel}
Fase/Kelas/Semester: ${formData.fase} / ${formData.kelas} / ${formData.semester}
Tipe Ujian: ${formData.tipeUjian}
Capaian Pembelajaran: ${cp}
Materi Esensial: ${formData.materi}
Indikator Asesmen: ${formData.indikator}
Bentuk Soal: ${formData.bentukSoal.join(', ')}
Level Kognitif: ${formData.levelKognitif.join(', ')}
${breakdownSoal}
${formData.hasInklusi ? `Terdapat Anak Inklusi: Ya, berjumlah ${formData.jumlahInklusi} siswa. Pastikan hasil generate menyediakan adaptasi atau modifikasi untuk anak inklusi.` : ''}

PENTING:
- Selaraskan dengan CP. Tujuan Pembelajaran (TP) diturunkan dari CP.
- Gunakan indikator yang mencerminkan proses berpikir tingkat tinggi (HOTS) jika dipilih.
- Kaitkan soal dengan konteks nyata (meaningful learning).
- Jika Asesmen Nasional/Olimpiade, pastikan kisi-kisi memuat indikator stimulus (literasi/numerasi) dan soal menantang HOTS.

Berikan output dalam format JSON murni:
{
  "tujuanPembelajaran": "...",
  "kisiKisi": [
    {
      "elemen": "...",
      "tujuanPembelajaran": "...",
      "materi": "...",
      "levelKognitif": "...",
      "indikatorSoal": "...",
      "jenisSoal": "...",
      "noSoal": "..."
    }
  ]
}`;
        responseSchema = {
          type: Type.OBJECT,
          properties: {
            tujuanPembelajaran: { type: Type.STRING },
            kisiKisi: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  elemen: { type: Type.STRING },
                  tujuanPembelajaran: { type: Type.STRING },
                  materi: { type: Type.STRING },
                  levelKognitif: { type: Type.STRING },
                  indikatorSoal: { type: Type.STRING },
                  jenisSoal: { type: Type.STRING },
                  noSoal: { type: Type.STRING }
                }
              }
            }
          }
        };
      } else {
        prompt = `Buatkan Soal beserta Kunci Jawabannya untuk:
Mata Pelajaran: ${mapelLabel}
Jenjang: ${jenjangLabel}
Fase/Kelas/Semester: ${formData.fase} / ${formData.kelas} / ${formData.semester}
Tipe Ujian: ${formData.tipeUjian}
Capaian Pembelajaran: ${cp}
Materi Esensial: ${formData.materi}
Indikator Asesmen: ${formData.indikator}
Bentuk Soal: ${formData.bentukSoal.join(', ')}
Level Kognitif: ${formData.levelKognitif.join(', ')}
Rincian Target Reguler: ${breakdownSoal}

PENTING:
- PENCARIAN REAL-TIME & GAMBAR: Kamu harus melampirkan referensi data riil, kasus aktual, atau gambar/ilustrasi pendukung yang sedang tren di search dari 2023 - 2025. Sebutkan bahwa source dukungan berasal dari "Source Nano Banana 2". Kamu bisa menggunakan URL gambar edukasi dari Wikimedia atau gambar simulasi pakai Markdown ![Ilustrasi](url).
- PEMBAGIAN SOAL: Kamu WAJIB memisahkan soal menjadi 2 bagian dalam JSON:
  1. "soalList": Berisi soal Reguler sesuai jumlah target pengunjung.
  2. "soalABKList": Berisi anak inklusi / ABK (Anak Berkebutuhan Khusus). Buatkan modifikasi dari soal reguler (misal: bahasanya disederhanakan, lebih banyak butir visual langsung) MAKSIMAL 20 soal. Semua soal ABK ini dimasukkan ke array "soalABKList".
- Tipe Ujian Asesmen Nasional/Olimpiade wajib pakai stimulus konteks spesifik dari berita real-time kalau memungkinkan.

Berikan output dalam format JSON murni:
{
  "soalList": [
    { 
      "jenisSoal": "Pilihan Ganda / Uraian / dll", 
      "no": "...", 
      "pertanyaan": "...", 
      "opsiTambahan": ["A. ...", "B. ..."], 
      "pasanganMenjodohkan": [{"kiri": "...", "kanan": "..."}],
      "kunci": "...", 
      "pembahasan": "...",
      "skor": "...",
      "materi": "...",
      "indikatorSoal": "...",
      "levelKognitif": "..." 
    }
  ],
  "soalABKList": [
    {
      "jenisSoal": "...", "no": "...", "pertanyaan": "...", "opsiTambahan": [], "pasanganMenjodohkan": [], "kunci": "...", "pembahasan": "...", "skor": "...", "materi": "...", "indikatorSoal": "...", "levelKognitif": "..." 
    }
  ]
}`;
        responseSchema = {
          type: Type.OBJECT,
          properties: {
            soalList: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  jenisSoal: { type: Type.STRING },
                  no: { type: Type.STRING },
                  pertanyaan: { type: Type.STRING },
                  opsiTambahan: { type: Type.ARRAY, items: { type: Type.STRING } },
                  pasanganMenjodohkan: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { kiri: { type: Type.STRING }, kanan: { type: Type.STRING } } } },
                  kunci: { type: Type.STRING },
                  pembahasan: { type: Type.STRING },
                  skor: { type: Type.STRING },
                  materi: { type: Type.STRING },
                  indikatorSoal: { type: Type.STRING },
                  levelKognitif: { type: Type.STRING }
                }
              }
            },
            soalABKList: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  jenisSoal: { type: Type.STRING },
                  no: { type: Type.STRING },
                  pertanyaan: { type: Type.STRING },
                  opsiTambahan: { type: Type.ARRAY, items: { type: Type.STRING } },
                  pasanganMenjodohkan: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { kiri: { type: Type.STRING }, kanan: { type: Type.STRING } } } },
                  kunci: { type: Type.STRING },
                  pembahasan: { type: Type.STRING },
                  skor: { type: Type.STRING },
                  materi: { type: Type.STRING },
                  indikatorSoal: { type: Type.STRING },
                  levelKognitif: { type: Type.STRING }
                }
              }
            }
          }
        };
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        }
      });

      let responseText = response.text || '{}';
      // Clean up markdown formatting if present
      responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      const generatedData = JSON.parse(responseText);

      if (type === 'kisi-kisi') {
        setResultKisiKisi({ ...generatedData, meta: { mapelLabel, jenjangLabel, ...formData } });
      } else {
        setResultSoal({ ...generatedData, meta: { mapelLabel, jenjangLabel, ...formData } });
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan saat menghasilkan konten.');
    } finally {
      setIsGenerating(false);
    }
  };

  const executePrint = (type: 'kisi-kisi' | 'naskah' | 'kunci' | 'kartu') => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let content = '';
    if (type === 'kisi-kisi') content = renderKisiKisiPrint();
    else content = renderSoalPrint(type);

    const docFooter = `
      <div style="margin-top: 40px; display: flex; justify-content: space-between; text-align: center; font-size: 12px; page-break-inside: avoid;">
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
      
      <div style="margin-top: 30px; border-top: 1px solid #ccc; padding-top: 20px; text-align: center; font-size: 11px; color: #666; page-break-inside: avoid;">
        <p>Dokumen ini dihasilkan secara otomatis oleh <b>Generator Soal - Pemuryadi</b></p>
        <p>Maju Pendidikan Indonesia &copy; ${new Date().getFullYear()}</p>
        <br>
        <p><i>"Dukungan Anda sangat berarti bagi kami untuk terus mengembangkan platform ini secara gratis."</i></p>
        <p style="margin-top: 5px;"><b>Saweria: saweria.co/pemuryadi FB/IG/TikTok: @p.e.muryadi</b></p>
      </div>
    `;

    printWindow.document.write(`
      <html>
        <head>
          <title>Cetak ${type.toUpperCase()}</title>
          <style>
            body { font-family: 'Times New Roman', Times, serif; line-height: 1.5; padding: 2cm; color: black; }
            h1, h2, h3 { text-align: center; margin-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid black; padding: 8px; text-align: left; vertical-align: top; }
            th { background-color: #f2f2f2; text-align: center; }
            .header-info { margin-bottom: 20px; }
            .header-info table { border: none; margin-top: 0; }
            .header-info td { border: none; padding: 4px; }
            .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 100px; color: rgba(0,0,0,0.05); z-index: -1; white-space: nowrap; pointer-events: none; }
            .kartu-soal-box { border: 1px solid black; margin-bottom: 30px; page-break-inside: avoid; }
            .kartu-header { text-align: center; font-weight: bold; border-bottom: 1px solid black; padding: 5px; }
            .kartu-body { display: flex; }
            .kartu-left { width: 30%; border-right: 1px solid black; padding: 10px; font-size: 12px; }
            .kartu-right { width: 70%; padding: 10px; font-size: 14px; }
            @media print {
              @page { margin: 1cm; }
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          ${getWatermarkHtml()}
          ${content}
          ${docFooter}
          <script>
            window.onload = () => { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintClick = (type: 'kisi-kisi' | 'naskah' | 'kunci' | 'kartu') => {
    setPrintTypeToProceed(type);
    setShowPrintModal(true);
  };

  const renderKisiKisiPrint = () => {
    if (!resultKisiKisi) return '';
    const { meta, kisiKisi } = resultKisiKisi;
    return `
      <h2>KISI-KISI ${meta.tipeUjian ? meta.tipeUjian.toUpperCase() : 'SOAL'}</h2>
      <div class="header-info">
        <table>
          <tr><td width="150">Mata Pelajaran</td><td>: ${meta.mapelLabel}</td></tr>
          <tr><td>Kelas/Semester</td><td>: ${meta.kelas} / ${meta.semester}</td></tr>
          <tr><td>Fase</td><td>: ${meta.fase}</td></tr>
        </table>
      </div>
      <table>
        <thead>
          <tr>
            <th>No</th>
            <th>Elemen</th>
            <th>Tujuan Pembelajaran</th>
            <th>Materi</th>
            <th>Level Kognitif</th>
            <th>Indikator Soal</th>
            <th>Jenis Soal</th>
            <th>No Soal</th>
          </tr>
        </thead>
        <tbody>
          ${kisiKisi?.map((k: any, i: number) => `
            <tr>
              <td style="text-align: center;">${i + 1}</td>
              <td>${k.elemen || ''}</td>
              <td>${k.tujuanPembelajaran || ''}</td>
              <td>${k.materi || ''}</td>
              <td style="text-align: center;">${k.levelKognitif || ''}</td>
              <td>${k.indikatorSoal || ''}</td>
              <td style="text-align: center;">${k.jenisSoal || ''}</td>
              <td style="text-align: center;">${k.noSoal || ''}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  };

  const renderSoalPrint = (type: 'naskah' | 'kunci' | 'kartu') => {
    if (!resultSoal || (!resultSoal.soalList && !resultSoal.soalABKList)) return '';
    const { meta, soalList = [], soalABKList = [] } = resultSoal;

    const printHeader = `
      <div class="header-info">
        <table>
          <tr><td width="150">Mata Pelajaran</td><td>: ${meta.mapelLabel}</td></tr>
          <tr><td>Kelas/Semester</td><td>: ${meta.kelas} / ${meta.semester}</td></tr>
          <tr><td>Tipe Ujian</td><td>: ${meta.tipeUjian}</td></tr>
        </table>
      </div>
    `;

    if (type === 'kartu') {
      return `
        <h2>KARTU SOAL</h2>
        ${printHeader}
        ${soalList.map((s: any) => `
          <div class="kartu-soal-box">
             <div class="kartu-header">KARTU SOAL NOMOR ${s.no} (REGULER)</div>
             <div class="kartu-body">
                <div class="kartu-left">
                   <strong>Materi:</strong><br/>${s.materi}<br/><br/>
                   <strong>Indikator:</strong><br/>${s.indikatorSoal}<br/><br/>
                   <strong>Level Kognitif:</strong> ${s.levelKognitif}<br/>
                   <strong>Bentuk Soal:</strong> ${s.jenisSoal}
                </div>
                <div class="kartu-right">
                   <strong>Rumusan Soal / Pertanyaan:</strong><br/>
                   <div style="white-space: pre-wrap; margin-bottom: 10px;">${s.pertanyaan}</div>
                   
                   ${s.opsiTambahan && s.opsiTambahan.length > 0 ? `
                     <div style="margin-left: 15px; margin-bottom: 10px;">
                       ${s.opsiTambahan.map((o: string) => `<div>${o}</div>`).join('')}
                     </div>
                   ` : ''}

                   ${s.pasanganMenjodohkan && s.pasanganMenjodohkan.length > 0 ? `
                     <table style="width: 80%; border: none; margin-bottom: 10px;">
                        ${s.pasanganMenjodohkan.map((p: any) => `<tr><td style="border:none;">${p.kiri}</td><td style="border:none;width:30px;text-align:center;">---</td><td style="border:none;">${p.kanan}</td></tr>`).join('')}
                     </table>
                   ` : ''}

                   <div style="margin-top: 15px; border-top: 1px solid #ccc; padding-top: 10px;">
                      <strong>Kunci Jawaban:</strong> <br/>
                      <span style="white-space: pre-wrap;">${s.kunci}</span><br/><br/>
                      <strong>Skor:</strong> ${s.skor}
                   </div>
                </div>
             </div>
          </div>
        `).join('')}
        
        ${soalABKList.length > 0 ? `
          <div style="page-break-before: always;"></div>
          <h2>KARTU SOAL - ADAPTASI ABK (INKLUSI)</h2>
          ${printHeader}
          ${soalABKList.map((s: any) => `
          <div class="kartu-soal-box">
             <div class="kartu-header">KARTU SOAL NOMOR ${s.no} (ABK)</div>
             <div class="kartu-body">
                <div class="kartu-left">
                   <strong>Materi:</strong><br/>${s.materi}<br/><br/>
                   <strong>Indikator:</strong><br/>${s.indikatorSoal}<br/><br/>
                   <strong>Level Kognitif:</strong> ${s.levelKognitif}<br/>
                   <strong>Bentuk Soal:</strong> ${s.jenisSoal}
                </div>
                <div class="kartu-right">
                   <strong>Rumusan Soal / Pertanyaan:</strong><br/>
                   <div style="white-space: pre-wrap; margin-bottom: 10px;">${s.pertanyaan}</div>
                   
                   ${s.opsiTambahan && s.opsiTambahan.length > 0 ? `
                     <div style="margin-left: 15px; margin-bottom: 10px;">
                       ${s.opsiTambahan.map((o: string) => `<div>${o}</div>`).join('')}
                     </div>
                   ` : ''}

                   ${s.pasanganMenjodohkan && s.pasanganMenjodohkan.length > 0 ? `
                     <table style="width: 80%; border: none; margin-bottom: 10px;">
                        ${s.pasanganMenjodohkan.map((p: any) => `<tr><td style="border:none;">${p.kiri}</td><td style="border:none;width:30px;text-align:center;">---</td><td style="border:none;">${p.kanan}</td></tr>`).join('')}
                     </table>
                   ` : ''}

                   <div style="margin-top: 15px; border-top: 1px solid #ccc; padding-top: 10px;">
                      <strong>Kunci Jawaban:</strong> <br/>
                      <span style="white-space: pre-wrap;">${s.kunci}</span><br/><br/>
                      <strong>Skor:</strong> ${s.skor}
                   </div>
                </div>
             </div>
          </div>
          `).join('')}
        ` : ''}
      `;
    }

    if (type === 'kunci') {
      return `
        <h2>KUNCI JAWABAN & PEMBAHASAN</h2>
        ${printHeader}
        <table style="width: 100%;">
          <tr><th style="width: 50px;">No</th><th>Kunci & Pembahasan</th><th style="width: 60px;">Skor</th></tr>
          ${soalList.map((s: any) => `
            <tr>
              <td style="text-align:center;">${s.no}</td>
              <td>
                <strong>Kunci:</strong> <span style="white-space:pre-wrap;">${s.kunci}</span><br/><br/>
                ${s.pembahasan ? `<strong>Pembahasan:</strong><br/><span style="white-space:pre-wrap;">${s.pembahasan}</span>` : ''}
              </td>
              <td style="text-align:center;">${s.skor}</td>
            </tr>
          `).join('')}
        </table>
        
        ${soalABKList.length > 0 ? `
          <h3 style="margin-top: 30px;">KUNCI JAWABAN & PEMBAHASAN - SOAL INKLUSI (ABK)</h3>
          <table style="width: 100%;">
            <tr><th style="width: 50px;">No</th><th>Kunci & Pembahasan</th><th style="width: 60px;">Skor</th></tr>
            ${soalABKList.map((s: any) => `
              <tr>
                <td style="text-align:center;">${s.no}</td>
                <td>
                  <strong>Kunci:</strong> <span style="white-space:pre-wrap;">${s.kunci}</span><br/><br/>
                  ${s.pembahasan ? `<strong>Pembahasan:</strong><br/><span style="white-space:pre-wrap;">${s.pembahasan}</span>` : ''}
                </td>
                <td style="text-align:center;">${s.skor}</td>
              </tr>
            `).join('')}
          </table>
        ` : ''}
      `;
    }

    return `
      <h2>NASKAH SOAL</h2>
      ${printHeader}
      ${soalList.map((s: any) => `
        <div style="margin-bottom: 20px; page-break-inside: avoid;">
          <div style="display: flex;">
            <div style="width: 30px; font-weight: bold;">${s.no}.</div>
            <div style="flex: 1;">
              <div style="white-space: pre-wrap; margin-bottom: 10px;">${s.pertanyaan}</div>
              ${s.opsiTambahan && s.opsiTambahan.length > 0 ? `
                <div style="margin-left: 10px;">
                  ${s.opsiTambahan.map((o: string) => `<div>${o}</div>`).join('')}
                </div>
              ` : ''}
              ${s.pasanganMenjodohkan && s.pasanganMenjodohkan.length > 0 ? `
                <table style="width: 60%; border: none; margin-bottom: 10px;">
                  ${s.pasanganMenjodohkan.map((p: any) => `<tr><td style="border:none;">${p.kiri}</td><td style="border:none;width:30px;text-align:center;">.........</td><td style="border:none;">${p.kanan}</td></tr>`).join('')}
                </table>
              ` : ''}
            </div>
          </div>
        </div>
      `).join('')}
      
      ${soalABKList.length > 0 ? `
        <div style="page-break-before: always;"></div>
        <h2>NASKAH SOAL - ADAPTASI ABK (INKLUSI)</h2>
        ${printHeader}
        ${soalABKList.map((s: any) => `
        <div style="margin-bottom: 20px; page-break-inside: avoid;">
          <div style="display: flex;">
            <div style="width: 30px; font-weight: bold;">${s.no}.</div>
            <div style="flex: 1;">
              <div style="white-space: pre-wrap; margin-bottom: 10px;">${s.pertanyaan}</div>
              ${s.opsiTambahan && s.opsiTambahan.length > 0 ? `
                <div style="margin-left: 10px;">
                  ${s.opsiTambahan.map((o: string) => `<div>${o}</div>`).join('')}
                </div>
              ` : ''}
              ${s.pasanganMenjodohkan && s.pasanganMenjodohkan.length > 0 ? `
                <table style="width: 60%; border: none; margin-bottom: 10px;">
                  ${s.pasanganMenjodohkan.map((p: any) => `<tr><td style="border:none;">${p.kiri}</td><td style="border:none;width:30px;text-align:center;">.........</td><td style="border:none;">${p.kanan}</td></tr>`).join('')}
                </table>
              ` : ''}
            </div>
          </div>
        </div>
        `).join('')}
      ` : ''}
    `;
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200">
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyber-blue/20 rounded-xl flex items-center justify-center text-cyber-blue border border-cyber-blue/30 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
            <FileText size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">Buat Soal & Kisi-kisi</h1>
            <p className="text-sm text-cyber-blue/70">Generator asesmen berbasis Kurikulum Merdeka</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Form Section */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900 rounded-2xl shadow-lg border border-slate-800 p-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyber-blue to-cyber-purple opacity-50"></div>
              <h2 className="font-bold text-white mb-4 flex items-center gap-2">
                <List size={18} className="text-cyber-blue" /> Parameter Soal
              </h2>

              <div className="space-y-4">
                {/* Tipe Ujian */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Tipe Ujian</label>
                  <div className="flex flex-wrap gap-2">
                    {['Ujian Biasa', 'Asesmen Nasional', 'Olimpiade', 'Other'].map(tipe => (
                      <button
                        key={tipe}
                        onClick={() => setFormData({...formData, tipeUjian: tipe})}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${formData.tipeUjian === tipe ? 'bg-cyber-blue text-slate-900 shadow-[0_0_10px_rgba(0,243,255,0.3)]' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-cyber-blue/50'}`}
                      >
                        {tipe}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Jenjang</label>
                  <select 
                    value={formData.jenjang}
                    onChange={e => setFormData({...formData, jenjang: e.target.value})}
                    className="w-full p-2.5 border border-slate-700 rounded-lg text-sm bg-slate-800 text-white focus:bg-slate-800 focus:border-cyber-blue focus:ring-1 focus:ring-cyber-blue outline-none transition-all"
                  >
                    {educationLevels.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Fase</label>
                    <select 
                      value={formData.fase}
                      onChange={e => setFormData({...formData, fase: e.target.value})}
                      className="w-full p-2.5 border border-slate-700 rounded-lg text-sm bg-slate-800 text-white focus:bg-slate-800 focus:border-cyber-blue focus:ring-1 focus:ring-cyber-blue outline-none transition-all"
                    >
                      {phaseClassMap[formData.jenjang]?.phases.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Kelas</label>
                    <select 
                      value={formData.kelas}
                      onChange={e => setFormData({...formData, kelas: e.target.value})}
                      className="w-full p-2.5 border border-slate-700 rounded-lg text-sm bg-slate-800 text-white focus:bg-slate-800 focus:border-cyber-blue focus:ring-1 focus:ring-cyber-blue outline-none transition-all"
                    >
                      {phaseClassMap[formData.jenjang]?.classes[formData.fase]?.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Semester</label>
                    <select 
                      value={formData.semester}
                      onChange={e => setFormData({...formData, semester: e.target.value})}
                      className="w-full p-2.5 border border-slate-700 rounded-lg text-sm bg-slate-800 text-white focus:bg-slate-800 focus:border-cyber-blue focus:ring-1 focus:ring-cyber-blue outline-none transition-all"
                    >
                      <option value="1">Ganjil (1)</option>
                      <option value="2">Genap (2)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Mata Pelajaran</label>
                    <select 
                      value={formData.mapel}
                      onChange={e => setFormData({...formData, mapel: e.target.value})}
                      className="w-full p-2.5 border border-slate-700 rounded-lg text-sm bg-slate-800 text-white focus:bg-slate-800 focus:border-cyber-blue focus:ring-1 focus:ring-cyber-blue outline-none transition-all"
                    >
                      {subjectsByLevel[formData.jenjang]?.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Capaian Pembelajaran (Otomatis)</label>
                  <div className="p-3 bg-slate-800/50 rounded-lg text-xs text-slate-300 h-24 overflow-y-auto border border-slate-700">
                    {getCP()}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Materi Esensial / Konteks</label>
                  <input 
                    type="text"
                    value={formData.materi}
                    onChange={e => setFormData({...formData, materi: e.target.value})}
                    placeholder="Contoh: Pecahan, Ekosistem, dll."
                    className="w-full p-2.5 border border-slate-700 rounded-lg text-sm bg-slate-800 text-white placeholder-slate-500 focus:bg-slate-800 focus:border-cyber-blue focus:ring-1 focus:ring-cyber-blue outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Indikator Asesmen</label>
                  <textarea 
                    value={formData.indikator}
                    onChange={e => setFormData({...formData, indikator: e.target.value})}
                    placeholder="Contoh: Peserta didik dapat menganalisis..."
                    className="w-full p-2.5 border border-slate-700 rounded-lg text-sm bg-slate-800 text-white placeholder-slate-500 focus:bg-slate-800 focus:border-cyber-blue focus:ring-1 focus:ring-cyber-blue outline-none transition-all h-20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Bentuk Soal</label>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                    {['Pilihan Ganda', 'Pilihan Ganda Kompleks', 'Benar Salah', 'Menjodohkan', 'Isian Singkat', 'Uraian', 'Essay', 'Kombinasi'].map(bentuk => (
                      <div key={bentuk} className="flex flex-col gap-1">
                        <label className="flex items-center gap-2 cursor-pointer bg-slate-800/50 p-2 rounded border border-slate-700 hover:border-cyber-blue/30 transition-colors">
                          <input
                            type="checkbox"
                            checked={formData.bentukSoal.includes(bentuk)}
                            onChange={() => handleBentukSoalChange(bentuk)}
                            className="w-4 h-4 rounded border-slate-600 text-cyber-blue focus:ring-cyber-blue focus:ring-offset-slate-900 bg-slate-900"
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
                            className="w-full p-1.5 text-xs border border-slate-700 rounded bg-slate-800 text-white focus:border-cyber-blue focus:ring-1 focus:ring-cyber-blue outline-none transition-all" 
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
                      <label key={lvl} className="flex items-center gap-2 cursor-pointer bg-slate-800/50 p-2 rounded border border-slate-700 hover:border-cyber-blue/30 transition-colors">
                        <input
                          type="checkbox"
                          checked={formData.levelKognitif.includes(lvl)}
                          onChange={() => handleLevelKognitifChange(lvl)}
                          className="w-4 h-4 rounded border-slate-600 text-cyber-blue focus:ring-cyber-blue focus:ring-offset-slate-900 bg-slate-900"
                        />
                        <span className="text-[11px] text-slate-300">{lvl}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {formData.bentukSoal.includes('Kombinasi') && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Total Jumlah Soal (Kombinasi)</label>
                    <input type="number" min="1" max="100" value={formData.jumlahSoalTotal} onChange={e => setFormData({...formData, jumlahSoalTotal: parseInt(e.target.value) || 1})} className="w-full p-2.5 border border-slate-700 rounded-lg text-sm bg-slate-800 text-white focus:border-cyber-blue focus:ring-1 focus:ring-cyber-blue outline-none transition-all" />
                  </div>
                )}

                <div className="space-y-3 pt-2">
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
                      <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Jumlah Siswa Inklusi</label>
                      <input 
                        type="number"
                        min="1"
                        className="w-full p-2.5 border border-slate-700 rounded-lg text-sm bg-slate-800 text-white placeholder-slate-500 focus:bg-slate-800 focus:border-cyber-blue focus:ring-1 focus:ring-cyber-blue outline-none transition-all"
                        placeholder="Masukkan jumlah siswa inklusi..."
                        value={formData.jumlahInklusi === 0 ? '' : formData.jumlahInklusi}
                        onChange={(e) => setFormData({...formData, jumlahInklusi: parseInt(e.target.value) || 0})}
                      />
                    </div>
                  )}
                </div>

              </div>
            </div>

            <div className="bg-cyber-blue/10 rounded-2xl p-4 border border-cyber-blue/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-cyber-blue/20 blur-2xl rounded-full"></div>
              <h3 className="text-sm font-bold text-cyber-blue flex items-center gap-2 mb-2 relative z-10">
                <Lightbulb size={16} /> Tips Menyusun Kisi-Kisi
              </h3>
              <ul className="text-xs text-slate-300 space-y-1.5 pl-4 list-disc relative z-10">
                <li>Selaraskan dengan CP → ATP → TP</li>
                <li>Gunakan indikator yang mencerminkan proses berpikir tingkat tinggi (HOTS)</li>
                <li>Kaitkan soal dengan konteks nyata (meaningful learning)</li>
                <li>Variasikan level kognitif (tidak hanya mengingat)</li>
                <li>Gunakan bahasa yang jelas, kontekstual, dan tidak ambigu</li>
              </ul>
              
              <h3 className="text-sm font-bold text-cyber-pink flex items-center gap-2 mt-5 mb-2 relative z-10">
                <AlertTriangle size={16} /> Kesalahan Umum
              </h3>
              <ul className="text-xs text-slate-300 space-y-1.5 pl-4 list-disc relative z-10">
                <li>Indikator hanya pada level mengingat (C1)</li>
                <li>Tidak mencerminkan pembelajaran kontekstual</li>
                <li>Soal tidak mengukur pemahaman mendalam</li>
                <li>Distribusi level kognitif tidak seimbang</li>
              </ul>
            </div>
          </div>

          {/* Result Section */}
          <div className="lg:col-span-8 flex flex-col h-[800px]">
            <div className="bg-slate-900 rounded-t-2xl border-x border-t border-slate-800 p-2 flex gap-2 relative overflow-hidden flex-wrap">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyber-blue to-cyber-purple opacity-50"></div>
              <button
                onClick={() => setActiveSubTab('kisi-kisi')}
                className={`flex-1 min-w-[120px] py-3 px-2 rounded-xl text-[11px] lg:text-sm font-bold transition-all relative z-10 ${activeSubTab === 'kisi-kisi' ? 'bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/30 shadow-[0_0_10px_rgba(0,240,255,0.1)]' : 'text-slate-400 hover:bg-slate-800'}`}
              >
                Kisi-kisi
              </button>
              <button
                onClick={() => setActiveSubTab('naskah')}
                className={`flex-1 min-w-[120px] py-3 px-2 rounded-xl text-[11px] lg:text-sm font-bold transition-all relative z-10 ${activeSubTab === 'naskah' ? 'bg-cyber-purple/20 text-cyber-purple border border-cyber-purple/30 shadow-[0_0_10px_rgba(188,19,254,0.1)]' : 'text-slate-400 hover:bg-slate-800'}`}
              >
                Naskah Soal
              </button>
              <button
                onClick={() => setActiveSubTab('kunci')}
                className={`flex-1 min-w-[120px] py-3 px-2 rounded-xl text-[11px] lg:text-sm font-bold transition-all relative z-10 ${activeSubTab === 'kunci' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 'text-slate-400 hover:bg-slate-800'}`}
              >
                Kunci & Bahas
              </button>
              <button
                onClick={() => setActiveSubTab('kartu')}
                className={`flex-1 min-w-[120px] py-3 px-2 rounded-xl text-[11px] lg:text-sm font-bold transition-all relative z-10 ${activeSubTab === 'kartu' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.1)]' : 'text-slate-400 hover:bg-slate-800'}`}
              >
                Kartu Soal
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-b-2xl p-6 flex-1 overflow-y-auto relative">
              {error && (
                <div className="mb-4 p-4 bg-red-900/30 text-red-400 rounded-xl text-sm border border-red-900/50 flex items-start gap-3">
                  <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Pratinjau {activeSubTab === 'kisi-kisi' ? 'Kisi-kisi' : activeSubTab === 'naskah' ? 'Naskah Soal' : activeSubTab === 'kunci' ? 'Kunci Jawaban' : 'Kartu Soal'}
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={saveProgress}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-bold transition-all flex items-center gap-2"
                    title="Simpan Progress"
                  >
                    <Save size={16} /> Simpan
                  </button>
                  <button
                    onClick={() => generateContent(activeSubTab === 'kisi-kisi' ? 'kisi-kisi' : 'soal')}
                    disabled={isGenerating}
                    className={`px-4 py-2 text-white rounded-lg text-sm font-bold transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg bg-cyber-blue hover:bg-cyber-blue/80 shadow-cyber-blue/20`}
                  >
                    {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    Generate {activeSubTab === 'kisi-kisi' ? 'Kisi-kisi' : 'Soal'}
                  </button>
                  
                  {((activeSubTab === 'kisi-kisi' && resultKisiKisi) || (activeSubTab !== 'kisi-kisi' && resultSoal)) && (
                    <button
                      onClick={() => handlePrintClick(activeSubTab as 'kisi-kisi' | 'naskah' | 'kunci' | 'kartu')}
                      className="px-4 py-2 bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-sm font-bold hover:bg-slate-700 transition-colors flex items-center gap-2"
                    >
                      <Printer size={16} /> Cetak
                    </button>
                  )}
                </div>
              </div>

              {activeSubTab === 'kisi-kisi' && (
                resultKisiKisi ? (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                      <p className="text-sm font-bold text-cyber-blue mb-1 uppercase tracking-wider">Tujuan Pembelajaran:</p>
                      <p className="text-sm text-slate-300">{resultKisiKisi.tujuanPembelajaran}</p>
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-slate-700">
                      <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-slate-800 text-slate-300">
                          <tr>
                            <th className="border-b border-slate-700 p-3 font-semibold">No</th>
                            <th className="border-b border-slate-700 p-3 font-semibold">Elemen</th>
                            <th className="border-b border-slate-700 p-3 font-semibold">Tujuan Pembelajaran</th>
                            <th className="border-b border-slate-700 p-3 font-semibold">Materi</th>
                            <th className="border-b border-slate-700 p-3 font-semibold text-center">Level Kognitif</th>
                            <th className="border-b border-slate-700 p-3 font-semibold">Indikator Soal</th>
                            <th className="border-b border-slate-700 p-3 font-semibold text-center">Jenis Soal</th>
                            <th className="border-b border-slate-700 p-3 font-semibold text-center">No Soal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {resultKisiKisi.kisiKisi?.map((k: any, i: number) => (
                            <tr key={i} className="hover:bg-slate-800/50 transition-colors">
                              <td className="p-3 text-center text-slate-400">{i + 1}</td>
                              <td className="p-3 text-slate-300">{k.elemen}</td>
                              <td className="p-3 text-slate-300">{k.tujuanPembelajaran}</td>
                              <td className="p-3 text-slate-300">{k.materi}</td>
                              <td className="p-3 text-center text-cyber-blue font-medium">{k.levelKognitif}</td>
                              <td className="p-3 text-slate-300">{k.indikatorSoal}</td>
                              <td className="p-3 text-center text-cyber-purple font-medium">{k.jenisSoal}</td>
                              <td className="p-3 text-center text-slate-400">{k.noSoal}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500">
                    <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-slate-700">
                      <List size={32} className="text-slate-600" />
                    </div>
                    <p className="text-sm">Klik Generate untuk membuat Kisi-kisi Soal</p>
                  </div>
                )
              )}

              {activeSubTab === 'naskah' && (
                resultSoal && resultSoal.soalList ? (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h3 className="font-bold text-cyber-purple text-lg border-b border-cyber-purple/30 pb-2 mb-4 mt-8">A. NASKAH SOAL (REGULER)</h3>
                    {resultSoal.soalList.map((s: any, i: number) => (
                      <div key={i} className="p-5 border border-slate-800 bg-slate-800/30 rounded-xl">
                        <p className="font-medium text-slate-200 mb-4 flex gap-3">
                          <span className="text-slate-500 shrink-0">{s.no}.</span>
                          <span className="whitespace-pre-wrap">{s.pertanyaan}</span>
                        </p>
                        
                        {s.opsiTambahan && s.opsiTambahan.length > 0 && (
                          <div className="pl-8 space-y-2">
                            {s.opsiTambahan.map((o: string, j: number) => (
                              <div key={j} className="text-sm text-slate-400">{o}</div>
                            ))}
                          </div>
                        )}
                        
                        {s.pasanganMenjodohkan && s.pasanganMenjodohkan.length > 0 && (
                          <div className="pl-8 mt-2">
                            <table className="w-full max-w-md text-sm text-slate-300">
                              <tbody>
                                {s.pasanganMenjodohkan.map((p: any, idx: number) => (
                                  <tr key={idx}>
                                    <td className="py-1">{p.kiri}</td>
                                    <td className="py-1 text-center w-8">...</td>
                                    <td className="py-1">{p.kanan}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                        <div className="mt-4 flex justify-end">
                          <span className="text-xs bg-slate-800 border border-slate-700 px-2 py-1 rounded text-slate-500">{s.jenisSoal}</span>
                        </div>
                      </div>
                    ))}

                    {resultSoal.soalABKList && resultSoal.soalABKList.length > 0 && (
                      <div className="mt-12 pt-8 border-t border-slate-700/50">
                        <h3 className="font-bold text-cyber-blue text-lg border-b border-cyber-blue/30 pb-2 mb-4">NASKAH SOAL - ADAPTASI INKLUSI (ABK)</h3>
                        {resultSoal.soalABKList.map((s: any, i: number) => (
                          <div key={i} className="p-5 border border-cyber-blue/20 bg-cyber-blue/5 rounded-xl mb-6">
                            <p className="font-medium text-slate-200 mb-4 flex gap-3">
                              <span className="text-cyber-blue shrink-0">{s.no}.</span>
                              <span className="whitespace-pre-wrap">{s.pertanyaan}</span>
                            </p>
                            
                            {s.opsiTambahan && s.opsiTambahan.length > 0 && (
                              <div className="pl-8 space-y-2">
                                {s.opsiTambahan.map((o: string, j: number) => (
                                  <div key={j} className="text-sm text-slate-400">{o}</div>
                                ))}
                              </div>
                            )}
                            
                            {s.pasanganMenjodohkan && s.pasanganMenjodohkan.length > 0 && (
                              <div className="pl-8 mt-2">
                                <table className="w-full max-w-md text-sm text-slate-300">
                                  <tbody>
                                    {s.pasanganMenjodohkan.map((p: any, idx: number) => (
                                      <tr key={idx}>
                                        <td className="py-1">{p.kiri}</td>
                                        <td className="py-1 text-center w-8">...</td>
                                        <td className="py-1">{p.kanan}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                            <div className="mt-4 flex justify-end">
                              <span className="text-xs bg-slate-800 border border-cyber-blue/30 px-2 py-1 rounded text-cyber-blue/70">{s.jenisSoal}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500">
                    <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-slate-700">
                      <List size={32} className="text-slate-600" />
                    </div>
                    <p className="text-sm">Klik Generate untuk membuat Soal</p>
                  </div>
                )
              )}

              {activeSubTab === 'kunci' && (
                resultSoal && resultSoal.soalList ? (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h3 className="font-bold text-emerald-400 text-lg border-b border-emerald-500/30 pb-2 mb-4 mt-8">B. KUNCI JAWABAN & PEMBAHASAN (REGULER)</h3>
                    {resultSoal.soalList.map((s: any, i: number) => (
                      <div key={i} className="p-5 border border-slate-800 bg-slate-800/30 rounded-xl mb-6">
                        <div className="mb-3 text-sm text-slate-400"><strong>Soal No. {s.no}</strong> ({s.jenisSoal})</div>
                        <p className="text-slate-300 mb-4 italic pl-4 border-l-2 border-slate-700 line-clamp-2">{s.pertanyaan}</p>
                        
                        <div className="bg-emerald-900/20 border border-emerald-900/50 p-4 rounded-lg">
                          <div className="flex gap-2">
                            <span className="text-emerald-500 font-bold">Kunci:</span>
                            <span className="text-emerald-300 whitespace-pre-wrap">{s.kunci}</span>
                          </div>
                          
                          {s.pembahasan && (
                            <div className="mt-3 text-sm">
                              <span className="text-slate-400 font-bold block mb-1">Pembahasan:</span>
                              <span className="text-slate-300 whitespace-pre-wrap">{s.pembahasan}</span>
                            </div>
                          )}
                          
                          <div className="mt-3 text-xs flex justify-end">
                            <span className="bg-emerald-900/50 px-2 py-1 rounded text-emerald-400">Skor: {s.skor}</span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {resultSoal.soalABKList && resultSoal.soalABKList.length > 0 && (
                      <div className="mt-12 pt-8 border-t border-slate-700/50">
                        <h3 className="font-bold text-cyber-blue text-lg border-b border-cyber-blue/30 pb-2 mb-4">KUNCI JAWABAN & PEMBAHASAN (INKLUSI / ABK)</h3>
                        {resultSoal.soalABKList.map((s: any, i: number) => (
                          <div key={i} className="p-5 border border-cyber-blue/20 bg-cyber-blue/5 rounded-xl mb-6">
                            <div className="mb-3 text-sm text-cyber-blue/70"><strong>Soal No. {s.no}</strong> ({s.jenisSoal})</div>
                            <p className="text-slate-300 mb-4 italic pl-4 border-l-2 border-cyber-blue/30 line-clamp-2">{s.pertanyaan}</p>
                            
                            <div className="bg-emerald-900/20 border border-emerald-900/50 p-4 rounded-lg">
                              <div className="flex gap-2">
                                <span className="text-emerald-500 font-bold">Kunci:</span>
                                <span className="text-emerald-300 whitespace-pre-wrap">{s.kunci}</span>
                              </div>
                              
                              {s.pembahasan && (
                                <div className="mt-3 text-sm">
                                  <span className="text-slate-400 font-bold block mb-1">Pembahasan:</span>
                                  <span className="text-slate-300 whitespace-pre-wrap">{s.pembahasan}</span>
                                </div>
                              )}
                              
                              <div className="mt-3 text-xs flex justify-end">
                                <span className="bg-emerald-900/50 px-2 py-1 rounded text-emerald-400">Skor: {s.skor}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500">
                    <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-slate-700">
                      <List size={32} className="text-slate-600" />
                    </div>
                    <p className="text-sm">Klik Generate untuk melihat Kunci & Pembahasan</p>
                  </div>
                )
              )}

              {activeSubTab === 'kartu' && (
                resultSoal && resultSoal.soalList ? (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h3 className="font-bold text-amber-400 text-lg border-b border-amber-500/30 pb-2 mb-4 mt-8">C. KARTU SOAL (REGULER)</h3>
                    {resultSoal.soalList.map((s: any, i: number) => (
                      <div key={i} className="p-0 border border-slate-700 bg-slate-800/80 rounded-xl overflow-hidden mb-8 shadow-lg">
                         <div className="bg-slate-800 border-b border-slate-700 p-4 text-center font-bold text-white tracking-wider flex justify-between items-center">
                           <span>KARTU SOAL NOMOR {s.no}</span>
                           <span className="bg-amber-500 text-slate-900 px-2 py-0.5 rounded text-xs">Level: {s.levelKognitif}</span>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-700">
                           <div className="p-4 space-y-4 md:col-span-1 text-sm">
                             <div>
                               <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Mata Pelajaran</div>
                               <div className="text-slate-300">{resultSoal.meta?.mapelLabel} / Kelas {resultSoal.meta?.kelas}</div>
                             </div>
                             <div>
                               <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Materi</div>
                               <div className="text-slate-300">{s.materi}</div>
                             </div>
                             <div>
                               <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Indikator Soal</div>
                               <div className="text-slate-300">{s.indikatorSoal}</div>
                             </div>
                           </div>
                           
                           <div className="p-4 md:col-span-2 flex flex-col">
                             <div className="text-[10px] text-slate-500 font-bold uppercase mb-2">Buku Sumber / Rumusan Soal:</div>
                             <div className="text-white mb-4 flex-1 whitespace-pre-wrap">{s.pertanyaan}</div>
                             
                             {s.opsiTambahan && s.opsiTambahan.length > 0 && (
                               <div className="space-y-1 mb-4 text-sm text-slate-300">
                                 {s.opsiTambahan.map((o: string, j: number) => (
                                   <div key={j}>{o}</div>
                                 ))}
                               </div>
                             )}

                             {s.pasanganMenjodohkan && s.pasanganMenjodohkan.length > 0 && (
                               <div className="pl-8 mb-4">
                                 <table className="w-full text-sm text-slate-300">
                                   <tbody>
                                     {s.pasanganMenjodohkan.map((p: any, idx: number) => (
                                       <tr key={idx}>
                                         <td className="py-1">{p.kiri}</td>
                                         <td className="py-1 text-center w-8">...</td>
                                         <td className="py-1">{p.kanan}</td>
                                       </tr>
                                     ))}
                                   </tbody>
                                 </table>
                               </div>
                             )}

                             <div className="pt-4 mt-auto border-t border-slate-700 grid grid-cols-2 gap-4">
                               <div>
                                 <div className="text-[10px] text-emerald-500 font-bold uppercase mb-1">Kunci Jawaban</div>
                                 <div className="text-emerald-400 font-medium text-sm whitespace-pre-wrap">{s.kunci}</div>
                               </div>
                               <div>
                                 <div className="text-[10px] text-cyber-blue font-bold uppercase mb-1">Jenis & Skor</div>
                                 <div className="text-cyber-blue text-sm">{s.jenisSoal} | Skor: {s.skor}</div>
                               </div>
                             </div>
                           </div>
                         </div>
                      </div>
                    ))}

                    {resultSoal.soalABKList && resultSoal.soalABKList.length > 0 && (
                      <div className="mt-12 pt-8 border-t border-slate-700/50">
                        <h3 className="font-bold text-cyber-blue text-lg border-b border-cyber-blue/30 pb-2 mb-4">KARTU SOAL - ADAPTASI INKLUSI (ABK)</h3>
                        {resultSoal.soalABKList.map((s: any, i: number) => (
                          <div key={i} className="p-0 border border-cyber-blue/30 bg-slate-800/80 rounded-xl overflow-hidden mb-8 shadow-lg shadow-cyber-blue/5">
                             <div className="bg-slate-800 border-b border-cyber-blue/30 p-4 text-center font-bold text-white tracking-wider flex justify-between items-center">
                               <span className="text-cyber-blue">KARTU SOAL NOMOR {s.no} (ABK)</span>
                               <span className="bg-cyber-blue text-slate-900 px-2 py-0.5 rounded text-xs">Level: {s.levelKognitif}</span>
                             </div>
                             <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-700">
                               <div className="p-4 space-y-4 md:col-span-1 text-sm bg-cyber-blue/5">
                                 <div>
                                   <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Mata Pelajaran</div>
                                   <div className="text-slate-300">{resultSoal.meta?.mapelLabel} / Kelas {resultSoal.meta?.kelas}</div>
                                 </div>
                                 <div>
                                   <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Materi</div>
                                   <div className="text-slate-300">{s.materi}</div>
                                 </div>
                                 <div>
                                   <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Indikator Soal</div>
                                   <div className="text-slate-300">{s.indikatorSoal}</div>
                                 </div>
                               </div>
                               
                               <div className="p-4 md:col-span-2 flex flex-col">
                                 <div className="text-[10px] text-slate-500 font-bold uppercase mb-2">Buku Sumber / Rumusan Soal:</div>
                                 <div className="text-white mb-4 flex-1 whitespace-pre-wrap">{s.pertanyaan}</div>
                                 
                                 {s.opsiTambahan && s.opsiTambahan.length > 0 && (
                                   <div className="space-y-1 mb-4 text-sm text-slate-300">
                                     {s.opsiTambahan.map((o: string, j: number) => (
                                       <div key={j}>{o}</div>
                                     ))}
                                   </div>
                                 )}
    
                                 {s.pasanganMenjodohkan && s.pasanganMenjodohkan.length > 0 && (
                                   <div className="pl-8 mb-4">
                                     <table className="w-full text-sm text-slate-300">
                                       <tbody>
                                         {s.pasanganMenjodohkan.map((p: any, idx: number) => (
                                           <tr key={idx}>
                                             <td className="py-1">{p.kiri}</td>
                                             <td className="py-1 text-center w-8">...</td>
                                             <td className="py-1">{p.kanan}</td>
                                           </tr>
                                         ))}
                                       </tbody>
                                     </table>
                                   </div>
                                 )}
    
                                 <div className="pt-4 mt-auto border-t border-slate-700 grid grid-cols-2 gap-4">
                                   <div>
                                     <div className="text-[10px] text-emerald-500 font-bold uppercase mb-1">Kunci Jawaban</div>
                                     <div className="text-emerald-400 font-medium text-sm whitespace-pre-wrap">{s.kunci}</div>
                                   </div>
                                   <div>
                                     <div className="text-[10px] text-cyber-blue font-bold uppercase mb-1">Jenis & Skor</div>
                                     <div className="text-cyber-blue text-sm">{s.jenisSoal} | Skor: {s.skor}</div>
                                   </div>
                                 </div>
                               </div>
                             </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500">
                     <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-slate-700">
                      <List size={32} className="text-slate-600" />
                    </div>
                    <p className="text-sm">Klik Generate untuk membuat Kartu Soal</p>
                  </div>
                )
              )}

            </div>
          </div>

        </div>
      </div>
      <PrintSupportModal 
        isOpen={showPrintModal} 
        onClose={() => setShowPrintModal(false)}
        onConfirm={() => {
          setShowPrintModal(false);
          if (printTypeToProceed) executePrint(printTypeToProceed);
        }}
      />
    </div>
  );
}
