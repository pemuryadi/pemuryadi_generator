import React, { useState, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Loader2, Printer, Calculator, Settings, FileText, Save } from 'lucide-react';
import PrintSupportModal from './PrintSupportModal';
import { useAuth } from '../AuthContext';
import { getWatermarkHtml } from '../utils/print';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const PROVINSI_LIST = [
  'DKI Jakarta', 'Jawa Barat', 'Jawa Tengah', 'DI Yogyakarta', 'Jawa Timur', 'Banten',
  'Bali', 'Sumatera Utara', 'Sumatera Barat', 'Riau', 'Kepulauan Riau', 'Sumatera Selatan',
  'Kalimantan Barat', 'Kalimantan Tengah', 'Kalimantan Selatan', 'Kalimantan Timur',
  'Sulawesi Selatan', 'Sulawesi Utara', 'Papua', 'Lainnya'
];

export default function AnalisisHariEfektif() {
  const { profile } = useAuth();
  const [formData, setFormData] = useState({
    provinsi: 'DKI Jakarta',
    jenjang: 'SD',
    tahunAjaran: '2026/2027',
    semester: 'Ganjil',
    namaSekolah: '',
    namaGuru: '',
    jenisNipGuru: 'NIP',
    nipGuru: '',
    kepalaSekolah: '',
    jenisNipKepalaSekolah: 'NIP',
    nipKepalaSekolah: '',
    tempatTanggal: 'Jakarta, 15 Juli 2026'
  });

  const [isGenerating, setIsGenerating] = useState(false);

  React.useEffect(() => {
    const saved = localStorage.getItem('AnalisisHariEfektifData');
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const saveProgress = () => {
    localStorage.setItem('AnalisisHariEfektifData', JSON.stringify(formData));
    alert('Progress berhasil disimpan!');
  };

  const [resultHtml, setResultHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const generateAnalisis = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const prompt = `Buatlah Analisis Hari Efektif (Rincian Minggu Efektif) untuk tahun ajaran ${formData.tahunAjaran} Semester ${formData.semester} jenjang ${formData.jenjang} di Provinsi ${formData.provinsi}.
Gunakan sumber yang kredibel dari Dinas Pendidikan Provinsi terkait atau pedoman Kemendikbudristek terbaru untuk tahun 2026.

Buat dalam format HTML lengkap yang siap dicetak (A4).
Gunakan styling CSS inline yang rapi, profesional, dan mudah dibaca.

Struktur Dokumen HTML:
1. Kop Surat/Judul: "RINCIAN MINGGU EFEKTIF"
2. Identitas:
   - Sekolah: ${formData.namaSekolah || '...........................'}
   - Mata Pelajaran: (Kosongkan/Titik-titik)
   - Kelas/Semester: (Kosongkan/Titik-titik) / ${formData.semester}
   - Tahun Pelajaran: ${formData.tahunAjaran}
3. Tabel 1: Perhitungan Alokasi Waktu (Bulan, Jumlah Minggu, Jumlah Minggu Efektif, Jumlah Minggu Tidak Efektif)
4. Tabel 2: Distribusi Alokasi Waktu (Rincian kegiatan tidak efektif seperti Libur Semester, Libur Nasional, Ujian, dll)
5. Perhitungan Total Jam Pelajaran Efektif.
6. Bagian Tanda Tangan di bawah tabel, WAJIB gunakan struktur HTML berikut persis seperti ini:
   <div style="margin-top: 40px; display: flex; justify-content: space-between; text-align: center; font-size: 12px; page-break-inside: avoid;">
     <div style="width: 45%;">
       <p>Mengetahui,</p>
       <p>Kepala Sekolah</p>
       <br><br><br><br>
       <p style="font-weight: bold; text-decoration: underline;">${formData.kepalaSekolah || '................................'}</p>
       <p>${formData.jenisNipKepalaSekolah || 'NIP'}. ${formData.nipKepalaSekolah || '................................'}</p>
     </div>
     <div style="width: 45%;">
       <p>${formData.tempatTanggal || '................., .........................'}</p>
       <p>Guru Mata Pelajaran</p>
       <br><br><br><br>
       <p style="font-weight: bold; text-decoration: underline;">${formData.namaGuru || '................................'}</p>
       <p>${formData.jenisNipGuru || 'NIP'}. ${formData.nipGuru || '................................'}</p>
     </div>
   </div>

OUTPUT HANYA KODE HTML (tanpa tag markdown \`\`\`html). Pastikan menggunakan tag <table> yang di-style dengan border-collapse.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
        config: { temperature: 0.7 }
      });

      let htmlContent = response.text || '';
      if (htmlContent.includes('\`\`\`html')) {
        htmlContent = htmlContent.replace(/\`\`\`html/g, '').replace(/\`\`\`/g, '');
      } else if (htmlContent.includes('\`\`\`')) {
        htmlContent = htmlContent.replace(/\`\`\`/g, '');
      }

      setResultHtml(htmlContent.trim());
    } catch (err: any) {
      console.error(err);
      setError('Terjadi kesalahan saat membuat analisis: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const printDocument = () => {
    const printContent = printRef.current?.innerHTML;
    if (printContent) {
      const printWindow = window.open('', '_blank');
      printWindow?.document.write(`
        <html>
          <head>
            <title>Print Analisis Hari Efektif</title>
            <style>
              body { font-family: 'Times New Roman', Times, serif; padding: 20px; color: black; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              th, td { border: 1px solid black; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .text-center { text-align: center; }
              .font-bold { font-weight: bold; }
              .mb-4 { margin-bottom: 1rem; }
              .mt-8 { margin-top: 2rem; }
              .flex { display: flex; }
              .justify-between { justify-content: space-between; }
              .justify-end { justify-content: flex-end; }
              @media print {
                @page { size: A4; margin: 0; }
                body { -webkit-print-color-adjust: exact; padding: 2cm; }
              }
            </style>
          </head>
          <body>
            ${printContent}
            ${getWatermarkHtml(profile?.role)}
          </body>
        </html>
      `);
      printWindow?.document.close();
      printWindow?.focus();
      setTimeout(() => {
        printWindow?.print();
        printWindow?.close();
      }, 500);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="gen-card bg-slate-900/50 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-2xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Calculator size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Analisis Hari Efektif</h2>
            <p className="text-slate-400 text-sm">Generate Rincian Minggu Efektif (RME) Tahun Ajaran 2026/2027</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="gen-card bg-slate-800/50 p-5 rounded-2xl space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                <Settings size={18} className="text-indigo-400" /> Pengaturan
              </h3>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Tahun Ajaran</label>
                  <input type="text" value={formData.tahunAjaran} onChange={e => setFormData({...formData, tahunAjaran: e.target.value})} className="w-full bg-slate-900/50 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-indigo-500 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Semester</label>
                  <select value={formData.semester} onChange={e => setFormData({...formData, semester: e.target.value})} className="w-full bg-slate-900/50 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-indigo-500 transition-all">
                    <option value="Ganjil">Ganjil</option>
                    <option value="Genap">Genap</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Provinsi</label>
                <select value={formData.provinsi} onChange={e => setFormData({...formData, provinsi: e.target.value})} className="w-full bg-slate-900/50 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-indigo-500 transition-all">
                  {PROVINSI_LIST.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Jenjang</label>
                <select value={formData.jenjang} onChange={e => setFormData({...formData, jenjang: e.target.value})} className="w-full bg-slate-900/50 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-indigo-500 transition-all">
                  <option value="PAUD">PAUD</option>
                  <option value="SD">SD</option>
                  <option value="SMP">SMP</option>
                  <option value="SMA">SMA</option>
                  <option value="SMK">SMK</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Nama Sekolah</label>
                <input type="text" value={formData.namaSekolah} onChange={e => setFormData({...formData, namaSekolah: e.target.value})} className="w-full bg-slate-900/50 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-indigo-500 transition-all" />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Nama Guru</label>
                <input type="text" value={formData.namaGuru} onChange={e => setFormData({...formData, namaGuru: e.target.value})} className="w-full bg-slate-900/50 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-indigo-500 transition-all" />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Nomor Induk Guru</label>
                <div className="flex gap-2">
                  <select value={formData.jenisNipGuru} onChange={e => setFormData({...formData, jenisNipGuru: e.target.value})} className="w-1/3 bg-slate-900/50 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-indigo-500 transition-all">
                    <option value="NIP">NIP</option>
                    <option value="NUPTK">NUPTK</option>
                    <option value="NIY">NIY</option>
                    <option value="NRG">NRG</option>
                    <option value="NPK">NPK</option>
                  </select>
                  <input type="text" value={formData.nipGuru} onChange={e => setFormData({...formData, nipGuru: e.target.value})} className="w-2/3 bg-slate-900/50 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-indigo-500 transition-all" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Kepala Sekolah</label>
                <input type="text" value={formData.kepalaSekolah} onChange={e => setFormData({...formData, kepalaSekolah: e.target.value})} className="w-full bg-slate-900/50 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-indigo-500 transition-all" />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Nomor Induk Kepala Sekolah</label>
                <div className="flex gap-2">
                  <select value={formData.jenisNipKepalaSekolah} onChange={e => setFormData({...formData, jenisNipKepalaSekolah: e.target.value})} className="w-1/3 bg-slate-900/50 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-indigo-500 transition-all">
                    <option value="NIP">NIP</option>
                    <option value="NUPTK">NUPTK</option>
                    <option value="NIY">NIY</option>
                    <option value="NRG">NRG</option>
                    <option value="NPK">NPK</option>
                  </select>
                  <input type="text" value={formData.nipKepalaSekolah} onChange={e => setFormData({...formData, nipKepalaSekolah: e.target.value})} className="w-2/3 bg-slate-900/50 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-indigo-500 transition-all" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Tempat, Tanggal Penetapan</label>
                <input type="text" value={formData.tempatTanggal} onChange={e => setFormData({...formData, tempatTanggal: e.target.value})} className="w-full bg-slate-900/50 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-indigo-500 transition-all" />
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
              onClick={generateAnalisis}
              disabled={isGenerating}
              className="flex-1 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold text-lg shadow-xl shadow-indigo-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2 btn-generate-animated"
            >
              {isGenerating ? <><Loader2 className="animate-spin" /> Menyusun...</> : <><FileText /> Buat Analisis</>}
            </button>
            </div>

            {error && <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>}
          </div>

          <div className="lg:col-span-2">
            <div className="bg-slate-200 rounded-2xl border border-slate-300 h-full min-h-[600px] flex flex-col overflow-hidden relative">
              <div className="bg-slate-300 px-4 py-3 border-b border-slate-400 flex justify-between items-center">
                <span className="text-slate-700 font-medium text-sm flex items-center gap-2">
                  <FileText size={16} /> Preview Dokumen
                </span>
                {resultHtml && (
                  <div className="flex flex-col items-end gap-1">
                    <button onClick={() => setIsPrintModalOpen(true)} className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors">
                      <Printer size={16} /> Cetak A4
                    </button>
                    <p className="text-[9px] text-slate-600 italic text-right">
                      * Gunakan Chrome di Desktop untuk hasil terbaik. Di mobile, gunakan "Simpan sebagai PDF".<br/>
                      * Jangan lupa support saya agar makin berusaha dalam memperbaiki website ini.
                    </p>
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-auto p-8 bg-white text-black">
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4">
                    <Loader2 size={48} className="animate-spin text-indigo-500" />
                    <p>Menyusun Analisis Hari Efektif 2026/2027...</p>
                  </div>
                ) : resultHtml ? (
                  <div ref={printRef} dangerouslySetInnerHTML={{ __html: resultHtml }} className="print-container" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <Calculator size={64} className="mb-4 opacity-20" />
                    <p>Belum ada dokumen. Silakan klik "Buat Analisis".</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <PrintSupportModal isOpen={isPrintModalOpen} onClose={() => setIsPrintModalOpen(false)} onConfirm={printDocument} />
    </div>
  );
}
