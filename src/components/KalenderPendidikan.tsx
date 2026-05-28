import React, { useState, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Loader2, Printer, Calendar, Settings, FileText, Save } from 'lucide-react';
import PrintSupportModal from './PrintSupportModal';
import DocumentUpload, { UploadedFile } from './DocumentUpload';
import { useAuth } from '../AuthContext';
import { getWatermarkHtml } from '../utils/print';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const PROVINSI_LIST = [
  'DKI Jakarta', 'Jawa Barat', 'Jawa Tengah', 'DI Yogyakarta', 'Jawa Timur', 'Banten',
  'Bali', 'Sumatera Utara', 'Sumatera Barat', 'Riau', 'Kepulauan Riau', 'Sumatera Selatan',
  'Kalimantan Barat', 'Kalimantan Tengah', 'Kalimantan Selatan', 'Kalimantan Timur',
  'Sulawesi Selatan', 'Sulawesi Utara', 'Papua', 'Lainnya'
];

export default function KalenderPendidikan() {
  const { profile } = useAuth();
  const [formData, setFormData] = useState({
    provinsi: 'DKI Jakarta',
    jenjang: 'SD',
    tahunAjaran: '2026/2027',
    namaSekolah: '',
    kepalaSekolah: '',
    jenisNipKepalaSekolah: 'NIP',
    nipKepalaSekolah: '',
    tempatTanggal: 'Jakarta, 15 Juli 2026'
  });

  const [isGenerating, setIsGenerating] = useState(false);

  React.useEffect(() => {
    const saved = localStorage.getItem('KalenderPendidikanData');
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const saveProgress = () => {
    localStorage.setItem('KalenderPendidikanData', JSON.stringify(formData));
    alert('Progress berhasil disimpan!');
  };

  const [resultHtml, setResultHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const generateKalender = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const prompt = `Buatlah Kalender Pendidikan resmi untuk tahun ajaran ${formData.tahunAjaran} jenjang ${formData.jenjang} di Provinsi ${formData.provinsi}.
Gunakan sumber yang kredibel dari Dinas Pendidikan Provinsi terkait atau pedoman Kemendikbudristek terbaru untuk tahun 2026.
${uploadedFile ? '\nPerhatikan dokumen referensi yang dilampirkan untuk menyesuaikan dengan kalender pendidikan yang dikeluarkan kementerian, pemerintah provinsi, atau pemerintah kota.' : ''}

Buat dalam format HTML lengkap yang siap dicetak (A4).
Gunakan styling CSS inline yang rapi, profesional, dan mudah dibaca.

Struktur Dokumen HTML:
1. Kop Surat/Judul: "KALENDER PENDIDIKAN TAHUN AJARAN ${formData.tahunAjaran}"
2. Sub Judul: "Jenjang ${formData.jenjang} - Provinsi ${formData.provinsi}"
3. Nama Sekolah: "${formData.namaSekolah || '...........................'}"
4. Tabel Kalender per Bulan (Juli 2026 s.d. Juni 2027):
   - Buat tabel ringkas yang menampilkan bulan, jumlah hari efektif, dan keterangan kegiatan penting (Hari Libur Nasional, Perkiraan Ujian, Pembagian Rapor, Libur Semester).
5. Keterangan/Legenda di bawah tabel.
6. Bagian Tanda Tangan di kanan bawah, WAJIB gunakan struktur HTML berikut persis seperti ini:
   <div style="margin-top: 40px; display: flex; justify-content: flex-end; text-align: center; font-size: 12px; page-break-inside: avoid;">
     <div style="width: 45%;">
       <p>${formData.tempatTanggal || '................., .........................'}</p>
       <p>Kepala Sekolah</p>
       <br><br><br><br>
       <p style="font-weight: bold; text-decoration: underline;">${formData.kepalaSekolah || '................................'}</p>
       <p>${formData.jenisNipKepalaSekolah || 'NIP'}. ${formData.nipKepalaSekolah || '................................'}</p>
     </div>
   </div>

OUTPUT HANYA KODE HTML (tanpa tag markdown \`\`\`html). Pastikan menggunakan tag <table> yang di-style dengan border-collapse.`;

      const contents: any[] = [
        {
          role: 'user',
          parts: [
            { text: prompt }
          ]
        }
      ];

      if (uploadedFile) {
        contents[0].parts.push({
          inlineData: {
            data: uploadedFile.data,
            mimeType: uploadedFile.mimeType
          }
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: contents,
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
      setError('Terjadi kesalahan saat membuat kalender: ' + err.message);
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
            <title>Print Kalender Pendidikan</title>
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
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Calendar size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Kalender Pendidikan</h2>
            <p className="text-slate-400 text-sm">Generate Kalender Pendidikan Tahun Ajaran 2026/2027</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="gen-card bg-slate-800/50 p-5 rounded-2xl space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                <Settings size={18} className="text-blue-400" /> Pengaturan
              </h3>
              
              <div className="mb-4">
                <DocumentUpload 
                  onFileUploaded={setUploadedFile} 
                  label="Upload Kalender Referensi (Opsional)" 
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Tahun Ajaran</label>
                <input type="text" value={formData.tahunAjaran} onChange={e => setFormData({...formData, tahunAjaran: e.target.value})} className="w-full bg-slate-900/50 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-blue-500 transition-all" />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Provinsi</label>
                <select value={formData.provinsi} onChange={e => setFormData({...formData, provinsi: e.target.value})} className="w-full bg-slate-900/50 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-blue-500 transition-all">
                  {PROVINSI_LIST.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Jenjang</label>
                <select value={formData.jenjang} onChange={e => setFormData({...formData, jenjang: e.target.value})} className="w-full bg-slate-900/50 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-blue-500 transition-all">
                  <option value="PAUD">PAUD</option>
                  <option value="SD">SD</option>
                  <option value="SMP">SMP</option>
                  <option value="SMA">SMA</option>
                  <option value="SMK">SMK</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Nama Sekolah</label>
                <input type="text" value={formData.namaSekolah} onChange={e => setFormData({...formData, namaSekolah: e.target.value})} className="w-full bg-slate-900/50 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-blue-500 transition-all" />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Kepala Sekolah</label>
                <input type="text" value={formData.kepalaSekolah} onChange={e => setFormData({...formData, kepalaSekolah: e.target.value})} className="w-full bg-slate-900/50 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-blue-500 transition-all" />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Nomor Induk Kepala Sekolah</label>
                <div className="flex gap-2">
                  <select value={formData.jenisNipKepalaSekolah} onChange={e => setFormData({...formData, jenisNipKepalaSekolah: e.target.value})} className="w-1/3 bg-slate-900/50 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-blue-500 transition-all">
                    <option value="NIP">NIP</option>
                    <option value="NUPTK">NUPTK</option>
                    <option value="NIY">NIY</option>
                    <option value="NRG">NRG</option>
                    <option value="NPK">NPK</option>
                  </select>
                  <input type="text" value={formData.nipKepalaSekolah} onChange={e => setFormData({...formData, nipKepalaSekolah: e.target.value})} className="w-2/3 bg-slate-900/50 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-blue-500 transition-all" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Tempat, Tanggal Penetapan</label>
                <input type="text" value={formData.tempatTanggal} onChange={e => setFormData({...formData, tempatTanggal: e.target.value})} className="w-full bg-slate-900/50 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-blue-500 transition-all" />
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
              onClick={generateKalender}
              disabled={isGenerating}
              className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl font-bold text-lg shadow-xl shadow-blue-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2 btn-generate-animated"
            >
              {isGenerating ? <><Loader2 className="animate-spin" /> Menyusun...</> : <><FileText /> Buat Kalender</>}
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
                    <button onClick={() => setIsPrintModalOpen(true)} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors">
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
                    <Loader2 size={48} className="animate-spin text-blue-500" />
                    <p>Menyusun Kalender Pendidikan 2026/2027...</p>
                  </div>
                ) : resultHtml ? (
                  <div ref={printRef} dangerouslySetInnerHTML={{ __html: resultHtml }} className="print-container" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <Calendar size={64} className="mb-4 opacity-20" />
                    <p>Belum ada dokumen. Silakan klik "Buat Kalender".</p>
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
