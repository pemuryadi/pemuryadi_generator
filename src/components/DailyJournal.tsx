import React, { useState, useEffect } from 'react';
import { mapelNames, cpData, atpData, educationLevels, phaseClassMap, subjectsByLevel, topicsBySubject } from '../constants';
import PrintSupportModal from './PrintSupportModal';
import { useAuth } from '../AuthContext';
import { getWatermarkHtml } from '../utils/print';
import { Save } from 'lucide-react';

export default function DailyJournal() {
  const { profile } = useAuth();
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    namaGuru: '', jenisNipGuru: 'NIP', nip: '', namaSekolah: '', jenisSekolah: 'Negeri', kepalaSekolah: '', jenisNipKepalaSekolah: 'NIP', nipKepalaSekolah: '', jenjang: 'sd', kelas: '1', fase: 'A',
    semester: '1', tahunAjaran: '', mapel: 'bahasa-indonesia', topik: '', isCustomTopik: false, tanggal: new Date().toISOString().split('T')[0], jam: '',
    cp: '', atp: '', catatan: '', refleksi: '', ttdGuru: '', ttdKS: ''
  });
  
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem('DailyJournalData');
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const saveProgress = () => {
    localStorage.setItem('DailyJournalData', JSON.stringify(formData));
    alert('Progress berhasil disimpan!');
  };

  useEffect(() => {
    const now = new Date();
    const currentJam = now.toTimeString().slice(0, 5);
    setFormData(prev => ({ ...prev, jam: currentJam }));
  }, []);

  useEffect(() => {
    const defaultCp = cpData[formData.mapel]?.[formData.fase] || '';
    const defaultAtp = atpData[formData.mapel]?.[formData.fase] || '';
    const topics = topicsBySubject[formData.mapel] || topicsBySubject['default'];
    setFormData(prev => ({ ...prev, cp: defaultCp, atp: defaultAtp, topik: topics[0] || '', isCustomTopik: false }));
  }, [formData.mapel, formData.fase]);

  useEffect(() => {
    const phases = phaseClassMap[formData.jenjang]?.phases || [];
    if (!phases.find(p => p.id === formData.fase)) {
      const firstPhase = phases[0]?.id || '';
      const classes = phaseClassMap[formData.jenjang]?.classes[firstPhase] || [];
      const firstClass = classes[0]?.id || '';
      
      const subjects = subjectsByLevel[formData.jenjang] || [];
      const firstSubject = subjects[0]?.id || '';
      
      const topics = topicsBySubject[firstSubject] || topicsBySubject['default'];
      const firstTopic = topics[0] || '';
      
      setFormData(prev => ({ ...prev, fase: firstPhase, kelas: firstClass, mapel: firstSubject, topik: firstTopic, isCustomTopik: false }));
    } else {
      const classes = phaseClassMap[formData.jenjang]?.classes[formData.fase] || [];
      if (!classes.find(c => c.id === formData.kelas)) {
        setFormData(prev => ({ ...prev, kelas: classes[0]?.id || '' }));
      }
    }
  }, [formData.jenjang, formData.fase]);

  const generateJurnal = () => {
    const tanggalObj = new Date(formData.tanggal || new Date());
    const tanggalFormat = tanggalObj.toLocaleDateString('id-ID', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });

    const jenjangLabel = educationLevels.find(l => l.id === formData.jenjang)?.label || formData.jenjang.toUpperCase();
    const faseLabel = phaseClassMap[formData.jenjang]?.phases.find(p => p.id === formData.fase)?.label || formData.fase;
    const kelasLabel = phaseClassMap[formData.jenjang]?.classes[formData.fase]?.find(c => c.id === formData.kelas)?.label || formData.kelas;
    const mapelLabel = subjectsByLevel[formData.jenjang]?.find(s => s.id === formData.mapel)?.label || mapelNames[formData.mapel] || formData.mapel;

    setResult({ 
      ...formData, 
      tanggalFormat, 
      jenjangLabel,
      faseLabel,
      kelasLabel,
      mapelName: mapelLabel 
    });
  };

  const printJurnal = () => {
    if (!result) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>Jurnal Harian Pembelajaran</title>
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
              <h1>JURNAL HARIAN PEMBELAJARAN</h1>
              <p style="text-align: center; margin-bottom: 20px;">Kurikulum Merdeka</p>

              <div class="section">
                  <div class="section-title">A. IDENTITAS GURU & SEKOLAH</div>
                  <table>
                      <tr><td width="25%"><b>Nama Guru</b></td><td>${result.namaGuru || '-'}</td></tr>
                      <tr><td><b>${result.jenisNipGuru || 'NIP'} Guru</b></td><td>${result.nip || '-'}</td></tr>
                      <tr><td><b>Kepala Sekolah</b></td><td>${result.kepalaSekolah || '-'}</td></tr>
                      <tr><td><b>${result.jenisNipKepalaSekolah || 'NIP'} Kepsek</b></td><td>${result.nipKepalaSekolah || '-'}</td></tr>
                      <tr><td><b>Nama Sekolah</b></td><td>${result.namaSekolah || '-'} (${result.jenisSekolah || 'Negeri'})</td></tr>
                  </table>
              </div>

              <div class="section">
                  <div class="section-title">B. DATA PEMBELAJARAN</div>
                  <table>
                      <tr><td width="25%"><b>Mata Pelajaran</b></td><td>${result.mapelName || '-'}</td></tr>
                      <tr><td><b>Topik/Materi</b></td><td>${result.topik || '-'}</td></tr>
                      <tr><td><b>Jenjang / Kelas / Fase</b></td><td>${result.jenjangLabel || '-'} / ${result.kelasLabel || '-'} / ${result.faseLabel || '-'}</td></tr>
                      <tr><td><b>Semester</b></td><td>${result.semester || '-'}</td></tr>
                      <tr><td><b>Tanggal / Jam</b></td><td>${result.tanggalFormat} / ${result.jam || '-'}</td></tr>
                  </table>
              </div>

              <div class="section">
                  <div class="section-title">C. CAPAIAN PEMBELAJARAN (CP)</div>
                  <div class="content"><p>${(result.cp || '-').replace(/\n/g, '<br>')}</p></div>
              </div>

              <div class="section">
                  <div class="section-title">D. ALUR TUJUAN PEMBELAJARAN (ATP)</div>
                  <div class="content"><p>${(result.atp || '-').replace(/\n/g, '<br>')}</p></div>
              </div>

              <div class="section">
                  <div class="section-title">E. CATATAN PEMBELAJARAN</div>
                  <div class="content"><p>${(result.catatan || '-').replace(/\n/g, '<br>')}</p></div>
              </div>

              <div class="section">
                  <div class="section-title">F. REFLEKSI & EVALUASI</div>
                  <div class="content"><p>${(result.refleksi || '-').replace(/\n/g, '<br>')}</p></div>
              </div>

              <div style="margin-top: 40px; display: flex; justify-content: space-between; text-align: center; font-size: 12px; page-break-inside: avoid;">
                  <div style="width: 45%;">
                      <p>Mengetahui,</p>
                      <p>Kepala Sekolah</p>
                      <br><br><br><br>
                      <p style="font-weight: bold; text-decoration: underline;">${result.kepalaSekolah || result.ttdKS || '................................'}</p>
                      <p>${result.jenisNipKepalaSekolah || 'NIP'}. ${result.nipKepalaSekolah || '................................'}</p>
                  </div>
                  <div style="width: 45%;">
                      <p>Dibuat pada, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      <p>Guru Mata Pelajaran</p>
                      <br><br><br><br>
                      <p style="font-weight: bold; text-decoration: underline;">${result.namaGuru || result.ttdGuru || '................................'}</p>
                      <p>${result.jenisNipGuru || 'NIP'}. ${result.nip || '................................'}</p>
                  </div>
              </div>
              <div class="support-footer">
                  <p>Dokumen ini dihasilkan secara otomatis oleh <strong>Daily Journal - Pemuryadi</strong></p>
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
    <div className="gen-card rounded-2xl p-6 md:p-8 bg-gradient-to-br from-slate-800 to-slate-900 shadow-xl">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-2xl shadow-lg">
          📔
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white">Jurnal Harian Pembelajaran</h3>
          <p className="text-slate-400">Terintegrasi dengan Modul Ajar & Sesuai Kurikulum Merdeka</p>
        </div>
      </div>
      
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="gen-card bg-slate-800/50 rounded-xl p-5 shadow-sm">
            <h4 className="font-semibold text-amber-400 mb-4 flex items-center gap-2">👨‍🏫 Data Guru</h4>
            <div className="space-y-3">
              <input type="text" placeholder="Nama Guru" value={formData.namaGuru} onChange={e => setFormData({...formData, namaGuru: e.target.value})} className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-amber-500 transition-all" />
              <div className="flex gap-2">
                <select value={formData.jenisNipGuru} onChange={e => setFormData({...formData, jenisNipGuru: e.target.value})} className="w-1/3 bg-slate-800 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-amber-500 transition-all">
                  <option value="NIP">NIP</option>
                  <option value="NUPTK">NUPTK</option>
                  <option value="NIY">NIY</option>
                  <option value="NRG">NRG</option>
                  <option value="NPK">NPK</option>
                </select>
                <input type="text" placeholder="Nomor Induk Guru" value={formData.nip} onChange={e => setFormData({...formData, nip: e.target.value})} className="w-2/3 bg-slate-800 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-amber-500 transition-all" />
              </div>
              <input type="text" placeholder="Nama Sekolah" value={formData.namaSekolah} onChange={e => setFormData({...formData, namaSekolah: e.target.value})} className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-amber-500 transition-all" />
              <select value={formData.jenisSekolah} onChange={e => setFormData({...formData, jenisSekolah: e.target.value})} className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-amber-500 transition-all">
                <option value="Negeri">Negeri</option>
                <option value="Swasta">Swasta</option>
                <option value="Islam Terpadu">Islam Terpadu</option>
              </select>
              <input type="text" placeholder="Nama Kepala Sekolah" value={formData.kepalaSekolah} onChange={e => setFormData({...formData, kepalaSekolah: e.target.value})} className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-amber-500 transition-all" />
              <div className="flex gap-2">
                <select value={formData.jenisNipKepalaSekolah} onChange={e => setFormData({...formData, jenisNipKepalaSekolah: e.target.value})} className="w-1/3 bg-slate-800 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-amber-500 transition-all">
                  <option value="NIP">NIP</option>
                  <option value="NUPTK">NUPTK</option>
                  <option value="NIY">NIY</option>
                  <option value="NRG">NRG</option>
                  <option value="NPK">NPK</option>
                </select>
                <input type="text" placeholder="Nomor Induk Kepala Sekolah" value={formData.nipKepalaSekolah} onChange={e => setFormData({...formData, nipKepalaSekolah: e.target.value})} className="w-2/3 bg-slate-800 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-amber-500 transition-all" />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Jenjang</label>
              <select value={formData.jenjang} onChange={e => setFormData({...formData, jenjang: e.target.value})} className="w-full bg-slate-800/50 border border-slate-600 rounded-xl p-3 text-white focus:border-amber-500 transition-all">
                {educationLevels.map(level => (
                  <option key={level.id} value={level.id}>{level.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Fase</label>
              <select value={formData.fase} onChange={e => setFormData({...formData, fase: e.target.value})} className="w-full bg-slate-800/50 border border-slate-600 rounded-xl p-3 text-white focus:border-amber-500 transition-all">
                {phaseClassMap[formData.jenjang]?.phases.map(p => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Kelas / Semester</label>
              <div className="flex gap-2">
                <select value={formData.kelas} onChange={e => setFormData({...formData, kelas: e.target.value})} className="w-1/2 bg-slate-800/50 border border-slate-600 rounded-xl p-3 text-white focus:border-amber-500 transition-all">
                  {phaseClassMap[formData.jenjang]?.classes[formData.fase]?.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
                <select value={formData.semester} onChange={e => setFormData({...formData, semester: e.target.value})} className="w-1/2 bg-slate-800/50 border border-slate-600 rounded-xl p-3 text-white focus:border-amber-500 transition-all">
                  <option value="1">Semester 1</option><option value="2">Semester 2</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Mata Pelajaran</label>
              <select value={formData.mapel} onChange={e => setFormData({...formData, mapel: e.target.value})} className="w-full bg-slate-800/50 border border-slate-600 rounded-xl p-3 text-white focus:border-amber-500 transition-all">
                {subjectsByLevel[formData.jenjang]?.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Topik/Materi</label>
              <select 
                value={formData.isCustomTopik ? 'lainnya' : formData.topik} 
                onChange={e => {
                  const val = e.target.value;
                  if (val === 'lainnya') {
                    setFormData({...formData, isCustomTopik: true, topik: ''});
                  } else {
                    setFormData({...formData, isCustomTopik: false, topik: val});
                  }
                }} 
                className="w-full bg-slate-800/50 border border-slate-600 rounded-xl p-3 text-white focus:border-amber-500 transition-all"
              >
                {(topicsBySubject[formData.mapel] || topicsBySubject['default']).map((topic, idx) => (
                  <option key={idx} value={topic}>{topic}</option>
                ))}
                <option value="lainnya">Lainnya (+)</option>
              </select>
              {formData.isCustomTopik && (
                <input 
                  type="text" 
                  placeholder="Masukkan Topik/Materi secara manual..." 
                  value={formData.topik} 
                  onChange={e => setFormData({...formData, topik: e.target.value})} 
                  className="w-full bg-slate-800/50 border border-slate-600 rounded-xl p-3 text-white focus:border-amber-500 transition-all mt-3" 
                />
              )}
            </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Tanggal</label>
              <input type="date" value={formData.tanggal} onChange={e => setFormData({...formData, tanggal: e.target.value})} className="w-full bg-slate-800/50 border border-slate-600 rounded-xl p-3 text-white focus:border-amber-500 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Jam</label>
              <input type="time" value={formData.jam} onChange={e => setFormData({...formData, jam: e.target.value})} className="w-full bg-slate-800/50 border border-slate-600 rounded-xl p-3 text-white focus:border-amber-500 transition-all" />
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">🎯 Capaian Pembelajaran (CP)</label>
              <textarea rows={2} value={formData.cp} onChange={e => setFormData({...formData, cp: e.target.value})} className="w-full bg-slate-800/50 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-amber-500 transition-all" placeholder="Capaian pembelajaran..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">📌 Alur Tujuan Pembelajaran (ATP)</label>
              <textarea rows={2} value={formData.atp} onChange={e => setFormData({...formData, atp: e.target.value})} className="w-full bg-slate-800/50 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-amber-500 transition-all" placeholder="Alur tujuan pembelajaran..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">📝 Catatan Pembelajaran</label>
              <textarea rows={3} value={formData.catatan} onChange={e => setFormData({...formData, catatan: e.target.value})} className="w-full bg-slate-800/50 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-amber-500 transition-all" placeholder="Catatan pelaksanaan..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">🔍 Refleksi & Evaluasi</label>
              <textarea rows={3} value={formData.refleksi} onChange={e => setFormData({...formData, refleksi: e.target.value})} className="w-full bg-slate-800/50 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-amber-500 transition-all" placeholder="Refleksi..." />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Nama Kepala Sekolah</label>
              <input type="text" value={formData.ttdKS} onChange={e => setFormData({...formData, ttdKS: e.target.value})} className="w-full bg-slate-800/50 border border-slate-600 rounded-xl p-3 text-white focus:border-amber-500 transition-all" placeholder="Nama Kepala Sekolah" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Nama Guru (Tanda Tangan)</label>
              <input type="text" value={formData.ttdGuru} onChange={e => setFormData({...formData, ttdGuru: e.target.value})} className="w-full bg-slate-800/50 border border-slate-600 rounded-xl p-3 text-white focus:border-amber-500 transition-all" placeholder="Nama Guru" />
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="flex gap-2 mt-4 w-full">
              <button 
                onClick={saveProgress}
                className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                title="Simpan Progress"
              >
                <Save size={18} /> Simpan
              </button>
              <button onClick={generateJurnal} className="flex-1 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 font-bold text-lg text-white hover:opacity-90 transition-all shadow-lg hover:shadow-amber-500/25 btn-generate-animated">
              📔 Generate Jurnal
            </button>
            </div>
            <button 
              onClick={() => setIsPrintModalOpen(true)} 
              disabled={!result} 
              className="flex-1 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-lg text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              🖨️ Print
            </button>
          </div>
          <p className="text-[10px] text-slate-500 italic text-center mt-2">
            * Gunakan Chrome di Desktop untuk hasil terbaik. Di mobile, gunakan "Simpan sebagai PDF".<br/>
            * Jangan lupa support saya agar makin berusaha dalam memperbaiki website ini.
          </p>
        </div>
        
        <div className="gen-card bg-slate-800/30 rounded-xl p-4 min-h-[600px] overflow-auto">
          {result ? (
            <div className="space-y-4 text-sm">
              <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl p-6 border border-amber-500/30 text-center shadow-inner">
                <h3 className="text-xl font-bold text-white mb-2 tracking-wide">JURNAL HARIAN PEMBELAJARAN</h3>
                <h4 className="text-amber-400 font-medium">Kurikulum Merdeka</h4>
              </div>

              <div className="gen-card bg-slate-800/80 rounded-xl p-5 shadow-sm">
                <h4 className="font-semibold text-blue-400 mb-4 flex items-center gap-2">👨‍🏫 IDENTITAS</h4>
                <div className="grid grid-cols-2 gap-y-3 text-slate-300 text-sm">
                  <p><span className="text-slate-500 block text-xs mb-1">Nama Guru</span> <span className="font-medium text-white">{result.namaGuru || '-'}</span></p>
                  <p><span className="text-slate-500 block text-xs mb-1">{result.jenisNipGuru || 'NIP'} Guru</span> <span className="font-medium text-white">{result.nip || '-'}</span></p>
                  <p><span className="text-slate-500 block text-xs mb-1">Kepala Sekolah</span> <span className="font-medium text-white">{result.kepalaSekolah || '-'}</span></p>
                  <p><span className="text-slate-500 block text-xs mb-1">{result.jenisNipKepalaSekolah || 'NIP'} Kepsek</span> <span className="font-medium text-white">{result.nipKepalaSekolah || '-'}</span></p>
                  <p className="col-span-2"><span className="text-slate-500 block text-xs mb-1">Sekolah</span> <span className="font-medium text-white">{result.namaSekolah || '-'} ({result.jenisSekolah || 'Negeri'})</span></p>
                </div>
              </div>

              <div className="gen-card bg-slate-800/80 rounded-xl p-5 shadow-sm">
                <h4 className="font-semibold text-green-400 mb-3 flex items-center gap-2">📝 CATATAN & REFLEKSI</h4>
                <div className="space-y-4">
                  <div>
                    <h5 className="text-xs text-slate-500 mb-1">Catatan Pembelajaran</h5>
                    <p className="text-slate-300 bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">{result.catatan || '-'}</p>
                  </div>
                  <div>
                    <h5 className="text-xs text-slate-500 mb-1">Refleksi & Evaluasi</h5>
                    <p className="text-slate-300 bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">{result.refleksi || '-'}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-500 py-16 h-full flex flex-col items-center justify-center">
              <div className="text-6xl mb-4 opacity-50">📔</div>
              <p>Jurnal Harian akan muncul di sini</p>
            </div>
          )}
        </div>
      </div>

      <PrintSupportModal 
        isOpen={isPrintModalOpen} 
        onClose={() => setIsPrintModalOpen(false)} 
        onConfirm={printJurnal} 
      />
    </div>
  );
}
