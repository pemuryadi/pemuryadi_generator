import React, { useState, useEffect } from 'react';
import { supervisionIndicators, educationLevels, phaseClassMap, subjectsByLevel } from '../constants';
import { GoogleGenAI, Type } from '@google/genai';
import PrintSupportModal from './PrintSupportModal';
import { useAuth } from '../AuthContext';
import { getWatermarkHtml, getSignatureHtml } from '../utils/print';
import { Sparkles, FileText, BookOpen, Layout, AlertCircle, Loader2, Save } from 'lucide-react';

export default function Supervision() {
  const { profile } = useAuth();
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  React.useEffect(() => {
    const saved = localStorage.getItem('SupervisionData');
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const saveProgress = () => {
    localStorage.setItem('SupervisionData', JSON.stringify(formData));
    alert('Progress berhasil disimpan!');
  };

  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    guru: '', nipGuru: '', jenisNipGuru: 'NIP', 
    supervisor: '', nipSupervisor: '', jenisNipSupervisor: 'NIP',
    sekolah: '', tanggal: new Date().toISOString().split('T')[0], catatan: ''
  });

  const [sources, setSources] = useState({
    rpm: '',
    modulAjar: '',
    modulKokurikuler: ''
  });
  
  const [eduLevel, setEduLevel] = useState('sd');
  const [fase, setFase] = useState('A');
  const [kelas, setKelas] = useState('1');
  const [subject, setSubject] = useState('bahasa-indonesia');
  
  const [scores, setScores] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{total: number, grade: string, plan: number, exec: number, ass: number, ref: number} | null>(null);

  // Sync profile data
  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        guru: profile.displayName || prev.guru,
        nipGuru: profile.nip || prev.nipGuru,
        sekolah: profile.namaSekolah || prev.sekolah
      }));
      const level = profile.jenjang?.toLowerCase() || 'sd';
      if (['sd', 'smp', 'sma', 'paud'].includes(level)) {
        setEduLevel(level as any);
      }
    }
  }, [profile]);

  // Update fase, kelas, and subject when eduLevel changes
  useEffect(() => {
    const phases = phaseClassMap[eduLevel]?.phases || [];
    const firstPhase = phases[0]?.id || '';
    setFase(firstPhase);
    
    const classes = phaseClassMap[eduLevel]?.classes[firstPhase] || [];
    setKelas(classes[0]?.id || '');

    const subjects = subjectsByLevel[eduLevel] || [];
    setSubject(subjects[0]?.id || '');
  }, [eduLevel]);

  // Update kelas when fase changes
  useEffect(() => {
    const classes = phaseClassMap[eduLevel]?.classes[fase] || [];
    setKelas(classes[0]?.id || '');
  }, [fase, eduLevel]);

  const handleScoreChange = (section: string, index: number, value: number) => {
    setScores(prev => ({ ...prev, [`${section}_${index}`]: value }));
  };

  const calculateScore = () => {
    const sections = ['planning', 'execution', 'assessment', 'reflection'];
    const weights: Record<string, number> = { planning: 25, execution: 35, assessment: 25, reflection: 15 };
    
    let totalWeighted = 0;
    const sectionScores: Record<string, number> = {};

    sections.forEach(section => {
      let sectionTotal = 0;
      const items = supervisionIndicators[section as keyof typeof supervisionIndicators];
      const itemCount = items.length;
      const maxScore = itemCount * 4;

      for (let i = 0; i < itemCount; i++) {
        sectionTotal += scores[`${section}_${i}`] || 0;
      }

      const sectionPercentage = maxScore > 0 ? (sectionTotal / maxScore) * 100 : 0;
      sectionScores[section] = sectionPercentage;
      totalWeighted += (sectionPercentage * weights[section]) / 100;
    });

    const finalScore = Math.round(totalWeighted);
    
    let grade = 'D (Kurang)';
    if (finalScore >= 90) grade = 'A (Amat Baik)';
    else if (finalScore >= 80) grade = 'B (Baik)';
    else if (finalScore >= 70) grade = 'C (Cukup)';

    setResult({
      total: finalScore,
      grade,
      plan: sectionScores.planning,
      exec: sectionScores.execution,
      ass: sectionScores.assessment,
      ref: sectionScores.reflection
    });
  };

  const generateWithAI = async () => {
    if (!sources.rpm && !sources.modulAjar && !sources.modulKokurikuler) {
      setError('Silakan masukkan setidaknya satu sumber data (RPM, Modul Ajar, atau Modul Kokurikuler) untuk dianalisis oleh AI.');
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
      
      const prompt = `
        Anda adalah seorang Supervisor Pendidikan ahli. Tugas Anda adalah melakukan analisis supervisi pembelajaran berdasarkan dokumen yang disediakan.
        
        SUMBER DATA:
        1. Alur RPM: ${sources.rpm || 'Tidak disediakan'}
        2. Modul Ajar: ${sources.modulAjar || 'Tidak disediakan'}
        3. Modul Kokurikuler: ${sources.modulKokurikuler || 'Tidak disediakan'}

        INSTRUMEN SUPERVISI (Poin-poin yang harus dinilai):
        A. Perencanaan: ${supervisionIndicators.planning.join(', ')}
        B. Pelaksanaan: ${supervisionIndicators.execution.join(', ')}
        C. Asesmen: ${supervisionIndicators.assessment.join(', ')}
        D. Refleksi: ${supervisionIndicators.reflection.join(', ')}

        TUGAS ANDA:
        1. Berikan skor (1-4) untuk setiap poin instrumen di atas berdasarkan analisis dokumen.
           Skor 4: Sangat Baik/Lengkap
           Skor 3: Baik/Cukup Lengkap
           Skor 2: Kurang/Perlu Perbaikan
           Skor 1: Tidak Ada/Sangat Kurang
        2. Berikan "Catatan Supervisor" yang berisi kesimpulan, saran, dan rekomendasi tindak lanjut yang konkret.

        FORMAT OUTPUT (JSON):
        {
          "scores": {
            "planning": [skor_poin_1, skor_poin_2, ...],
            "execution": [skor_poin_1, skor_poin_2, ...],
            "assessment": [skor_poin_1, skor_poin_2, ...],
            "reflection": [skor_poin_1, skor_poin_2, ...]
          },
          "catatan": "Teks catatan supervisor..."
        }
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        }
      });

      const aiResult = JSON.parse(response.text || '{}');

      const newScores: Record<string, number> = {};
      
      ['planning', 'execution', 'assessment', 'reflection'].forEach(section => {
        const sectionScores = aiResult.scores[section];
        if (Array.isArray(sectionScores)) {
          sectionScores.forEach((score, index) => {
            newScores[`${section}_${index}`] = Number(score);
          });
        }
      });

      setScores(newScores);
      setFormData(prev => ({ ...prev, catatan: aiResult.catatan }));
      
      // Trigger calculation after state update
      setTimeout(() => {
        const sections = ['planning', 'execution', 'assessment', 'reflection'];
        const weights: Record<string, number> = { planning: 25, execution: 35, assessment: 25, reflection: 15 };
        
        let totalWeighted = 0;
        const sectionScores: Record<string, number> = {};

        sections.forEach(section => {
          let sectionTotal = 0;
          const items = supervisionIndicators[section as keyof typeof supervisionIndicators];
          const itemCount = items.length;
          const maxScore = itemCount * 4;

          for (let i = 0; i < itemCount; i++) {
            sectionTotal += newScores[`${section}_${i}`] || 0;
          }

          const sectionPercentage = maxScore > 0 ? (sectionTotal / maxScore) * 100 : 0;
          sectionScores[section] = sectionPercentage;
          totalWeighted += (sectionPercentage * weights[section]) / 100;
        });

        const finalScore = Math.round(totalWeighted);
        
        let grade = 'D (Kurang)';
        if (finalScore >= 90) grade = 'A (Amat Baik)';
        else if (finalScore >= 80) grade = 'B (Baik)';
        else if (finalScore >= 70) grade = 'C (Cukup)';

        setResult({
          total: finalScore,
          grade,
          plan: sectionScores.planning,
          exec: sectionScores.execution,
          ass: sectionScores.assessment,
          ref: sectionScores.reflection
        });
      }, 100);

    } catch (err: any) {
      console.error(err);
      setError('Gagal menghasilkan analisis AI. Pastikan API Key valid dan format dokumen benar.');
    } finally {
      setIsGenerating(false);
    }
  };

  const printSupervision = () => {
    if (!result) return;
    
    const subjectLabel = subjectsByLevel[eduLevel]?.find(s => s.id === subject)?.label || subject;
    const levelLabel = educationLevels.find(l => l.id === eduLevel)?.label || eduLevel;
    const faseLabel = phaseClassMap[eduLevel]?.phases.find(p => p.id === fase)?.label || fase;
    const kelasLabel = phaseClassMap[eduLevel]?.classes[fase]?.find(c => c.id === kelas)?.label || kelas;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>Instrumen Supervisi Pembelajaran</title>
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
              <div class="header">
                  <h1 style="margin: 0; font-size: 20px;">INSTRUMEN SUPERVISI PEMBELAJARAN</h1>
                  <p style="margin: 5px 0 0 0; font-size: 12px;">Permendikdasmen No. 1 Tahun 2026</p>
              </div>

              <h3 style="font-size: 14px; text-align: left; border-bottom: 2px solid #1e40af; padding-bottom: 5px;">I. DATA UMUM</h3>
              <div class="row"><div class="label">Nama Sekolah:</div><div class="value">${formData.sekolah || '-'}</div></div>
              <div class="row"><div class="label">Nama Guru:</div><div class="value">${formData.guru || '-'}</div></div>
              <div class="row"><div class="label">NIP/NUPTK/NIY/NRG/NPK Guru:</div><div class="value">${formData.nipGuru || '-'}</div></div>
              <div class="row"><div class="label">Mata Pelajaran:</div><div class="value">${subjectLabel}</div></div>
              <div class="row"><div class="label">Jenjang / Kelas / Fase:</div><div class="value">${levelLabel} / ${kelasLabel} / ${faseLabel}</div></div>
              <div class="row"><div class="label">Nama Supervisor:</div><div class="value">${formData.supervisor || '-'}</div></div>
              <div class="row"><div class="label">Tanggal Supervisi:</div><div class="value">${formData.tanggal || new Date().toLocaleDateString('id-ID')}</div></div>

              <h3 style="font-size: 14px; text-align: left; border-bottom: 2px solid #1e40af; padding-bottom: 5px; margin-top: 20px;">II. HASIL SUPERVISI</h3>
              <div class="score-section">
                  <table>
                      <tr><th>Aspek Penilaian</th><th>Skor (%)</th><th>Bobot</th><th>Nilai Terbobot</th></tr>
                      <tr><td>A. Perencanaan Pembelajaran</td><td>${result.plan.toFixed(1)}</td><td>25%</td><td>${(result.plan * 0.25).toFixed(1)}</td></tr>
                      <tr><td>B. Pelaksanaan Pembelajaran</td><td>${result.exec.toFixed(1)}</td><td>35%</td><td>${(result.exec * 0.35).toFixed(1)}</td></tr>
                      <tr><td>C. Asesmen dan Evaluasi</td><td>${result.ass.toFixed(1)}</td><td>25%</td><td>${(result.ass * 0.25).toFixed(1)}</td></tr>
                      <tr><td>D. Refleksi dan Tindak Lanjut</td><td>${result.ref.toFixed(1)}</td><td>15%</td><td>${(result.ref * 0.15).toFixed(1)}</td></tr>
                      <tr style="background: #f0f0f0; font-weight: bold;"><td colspan="3">NILAI TOTAL</td><td>${result.total}</td></tr>
                  </table>
              </div>

              <div class="score-section" style="margin-top: 10px;">
                  <div class="row"><div class="label">Nilai Akhir:</div><div class="value"><strong>${result.total} / 100</strong></div></div>
                  <div class="row"><div class="label">Grade:</div><div class="value"><strong>${result.grade}</strong></div></div>
              </div>

              <h3 style="font-size: 14px; text-align: left; border-bottom: 2px solid #1e40af; padding-bottom: 5px; margin-top: 20px;">III. CATATAN SUPERVISOR</h3>
              <div style="border: 1px solid #ddd; padding: 10px; min-height: 60px; white-space: pre-wrap; font-size: 12px;">${formData.catatan || '-'}</div>

              <div style="margin-top: 40px; display: flex; justify-content: space-between; text-align: center; font-size: 12px;">
                  <div style="width: 45%;">
                      <p>Guru yang Disupervisi,</p>
                      <br><br><br><br>
                      <p style="font-weight: bold; text-decoration: underline;">${formData.guru || '...........................................'}</p>
                      <p>${formData.jenisNipGuru || 'NIP'}. ${formData.nipGuru || '...........................................'}</p>
                  </div>
                  <div style="width: 45%;">
                      <p>${formData.tanggal || new Date().toLocaleDateString('id-ID')}</p>
                      <p>Supervisor,</p>
                      <br><br><br><br>
                      <p style="font-weight: bold; text-decoration: underline;">${formData.supervisor || '...........................................'}</p>
                      <p>${formData.jenisNipSupervisor || 'NIP'}. ${formData.nipSupervisor || '...........................................'}</p>
                  </div>
              </div>

              <div class="support-footer">
                  <p>Dokumen ini dihasilkan secara otomatis oleh <strong>Supervisi Generator - Pemuryadi</strong></p>
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

  const renderSection = (title: string, id: string, items: string[]) => (
    <div className="gen-card bg-slate-800/50 rounded-xl p-5 mb-4 shadow-sm">
      <h3 className="flex items-center gap-2 text-blue-400 font-semibold mb-4">{title}</h3>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="gen-card flex items-start gap-3 p-3 bg-slate-800/80 rounded-lg hover:/30 transition-colors">
            <span className="text-slate-500 text-sm font-medium w-6">{index + 1}.</span>
            <div className="flex-1">
              <p className="text-sm text-slate-300 mb-3 leading-relaxed">{item}</p>
              <div className="flex gap-4">
                {[4, 3, 2, 1].map(val => (
                  <label key={val} className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="radio" 
                      name={`${id}_${index}`} 
                      value={val}
                      checked={scores[`${id}_${index}`] === val}
                      onChange={() => handleScoreChange(id, index, val)}
                      className="w-4 h-4 text-blue-500 bg-slate-700 border-slate-600 focus:ring-blue-500 focus:ring-offset-slate-800"
                    />
                    <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors">{val}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="gen-card rounded-2xl p-6 md:p-8 bg-gradient-to-br from-slate-800 to-slate-900 shadow-xl">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-2xl shadow-lg">
          📋
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white">Instrumen Supervisi Pembelajaran</h3>
          <p className="text-slate-400">Berdasarkan Permendikdasmen No. 1 Tahun 2026</p>
        </div>
      </div>
      
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="gen-card bg-slate-800/50 rounded-xl p-5 mb-4 shadow-sm">
            <h3 className="flex items-center gap-2 text-blue-400 font-semibold mb-4">📝 Data Umum</h3>
            
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <input type="text" placeholder="Nama Sekolah" value={formData.sekolah} onChange={e => setFormData({...formData, sekolah: e.target.value})} className="bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:border-blue-500 transition-all md:col-span-2" />
              
              <input type="text" placeholder="Nama Guru" value={formData.guru} onChange={e => setFormData({...formData, guru: e.target.value})} className="bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:border-blue-500 transition-all" />
              <input type="text" placeholder="NIP/NUPTK/NIY/NRG/NPK Guru" value={formData.nipGuru} onChange={e => setFormData({...formData, nipGuru: e.target.value})} className="bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:border-blue-500 transition-all" />
              
              <input type="text" placeholder="Nama Supervisor" value={formData.supervisor} onChange={e => setFormData({...formData, supervisor: e.target.value})} className="bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:border-blue-500 transition-all" />
              <input type="text" placeholder="NIP/NUPTK/NIY/NRG/NPK Supervisor" value={formData.nipSupervisor} onChange={e => setFormData({...formData, nipSupervisor: e.target.value})} className="bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:border-blue-500 transition-all" />
              
              <select 
                value={eduLevel}
                onChange={(e) => setEduLevel(e.target.value)}
                className="bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:border-blue-500 transition-all"
              >
                {educationLevels.map(level => (
                  <option key={level.id} value={level.id}>{level.label}</option>
                ))}
              </select>
              
              <div className="grid grid-cols-2 gap-2">
                <select 
                  value={fase}
                  onChange={(e) => setFase(e.target.value)}
                  className="bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:border-blue-500 transition-all"
                >
                  {phaseClassMap[eduLevel]?.phases.map(p => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
                <select 
                  value={kelas}
                  onChange={(e) => setKelas(e.target.value)}
                  className="bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:border-blue-500 transition-all"
                >
                  {phaseClassMap[eduLevel]?.classes[fase]?.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              <select 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:border-blue-500 transition-all"
              >
                {subjectsByLevel[eduLevel]?.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.label}</option>
                ))}
              </select>

              <input type="date" value={formData.tanggal} onChange={e => setFormData({...formData, tanggal: e.target.value})} className="bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:border-blue-500 transition-all" />
            </div>
          </div>

          <div className="gen-card bg-slate-800/50 rounded-xl p-5 mb-4 shadow-sm border border-blue-500/20">
            <h3 className="flex items-center gap-2 text-blue-400 font-semibold mb-4">
              <Sparkles className="w-5 h-5 text-amber-400" />
              AI Supervision Generator (Sumber Data)
            </h3>
            <p className="text-xs text-slate-400 mb-4 italic">
              Masukkan konten dokumen Anda di bawah ini agar AI dapat menganalisis dan mengisi instrumen secara otomatis.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
                  <Layout className="w-3 h-3" /> Alur RPM (Deep Learning Plan)
                </label>
                <textarea 
                  rows={2}
                  value={sources.rpm}
                  onChange={e => setSources({...sources, rpm: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:border-blue-500 transition-all"
                  placeholder="Paste konten RPM di sini..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
                  <BookOpen className="w-3 h-3" /> Modul Ajar
                </label>
                <textarea 
                  rows={2}
                  value={sources.modulAjar}
                  onChange={e => setSources({...sources, modulAjar: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:border-blue-500 transition-all"
                  placeholder="Paste konten Modul Ajar di sini..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Modul Kokurikuler
                </label>
                <textarea 
                  rows={2}
                  value={sources.modulKokurikuler}
                  onChange={e => setSources({...sources, modulKokurikuler: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:border-blue-500 transition-all"
                  placeholder="Paste konten Modul Kokurikuler di sini..."
                />
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
                onClick={generateWithAI}
                disabled={isGenerating}
                className="flex-1 py-3 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 font-bold text-white hover:opacity-90 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Menganalisis Dokumen...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Analisis Supervisi (AI)
                  </>
                )}
              </button>
            </div>
            </div>
          </div>

          {renderSection('📚 A. Perencanaan Pembelajaran (Modul Ajar/RPP)', 'planning', supervisionIndicators.planning)}
          {renderSection('🎯 B. Pelaksanaan Pembelajaran', 'execution', supervisionIndicators.execution)}
          {renderSection('📊 C. Asesmen dan Evaluasi', 'assessment', supervisionIndicators.assessment)}
          {renderSection('💭 D. Refleksi dan Tindak Lanjut', 'reflection', supervisionIndicators.reflection)}

          <div className="gen-card bg-slate-800/50 rounded-xl p-5 mb-4 shadow-sm">
            <h3 className="flex items-center gap-2 text-blue-400 font-semibold mb-4">📝 Catatan Supervisor</h3>
            <textarea 
              rows={4} 
              value={formData.catatan}
              onChange={e => setFormData({...formData, catatan: e.target.value})}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:border-blue-500 transition-all" 
              placeholder="Catatan, saran, dan rekomendasi..."
            />
          </div>
          
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <button onClick={calculateScore} className="flex-1 py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 font-bold text-lg text-white hover:opacity-90 transition-all shadow-lg hover:shadow-indigo-500/25 btn-generate-animated">
                📊 Hitung Nilai
              </button>
              <button onClick={() => setIsPrintModalOpen(true)} disabled={!result} className="flex-1 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-lg text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">
                🖨️ Print
              </button>
            </div>
            <p className="text-[10px] text-slate-500 italic text-center">
              * Gunakan Chrome di Desktop untuk hasil terbaik. Di mobile, gunakan "Simpan sebagai PDF".<br/>
              * Jangan lupa support saya agar makin berusaha dalam memperbaiki website ini.
            </p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="gen-card bg-slate-800/80 rounded-xl p-6 sticky top-24 shadow-xl">
            <h4 className="text-lg font-semibold mb-6 text-center text-white">📊 Hasil Supervisi</h4>
            
            <div className="flex justify-center mb-8">
              <div 
                className="w-[140px] h-[140px] rounded-full flex flex-col items-center justify-center relative shadow-inner"
                style={{ background: `conic-gradient(#3b82f6 ${result ? result.total * 3.6 : 0}deg, #1e293b 0)` }}
              >
                <div className="w-[120px] h-[120px] rounded-full bg-slate-900 flex flex-col items-center justify-center absolute shadow-lg">
                  <span className="text-4xl font-bold text-white">{result ? result.total : 0}</span>
                  <span className="text-xs text-slate-400 mt-1">dari 100</span>
                </div>
              </div>
            </div>
            
            <div className={`text-center text-2xl font-bold mb-6 ${result ? (result.total >= 90 ? 'text-green-500' : result.total >= 80 ? 'text-blue-500' : result.total >= 70 ? 'text-yellow-500' : 'text-red-500') : 'text-slate-500'}`}>
              {result ? result.grade : '-'}
            </div>
            
            <div className="gen-card space-y-3 text-sm bg-slate-900/50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Perencanaan:</span>
                <span className="font-semibold text-white bg-slate-800 px-2 py-1 rounded">{result ? result.plan.toFixed(1) : 0}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Pelaksanaan:</span>
                <span className="font-semibold text-white bg-slate-800 px-2 py-1 rounded">{result ? result.exec.toFixed(1) : 0}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Asesmen:</span>
                <span className="font-semibold text-white bg-slate-800 px-2 py-1 rounded">{result ? result.ass.toFixed(1) : 0}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Refleksi:</span>
                <span className="font-semibold text-white bg-slate-800 px-2 py-1 rounded">{result ? result.ref.toFixed(1) : 0}%</span>
              </div>
            </div>
            
            <div className="gen-card mt-6 p-4 bg-slate-800 rounded-lg text-xs text-slate-400">
              <p className="font-semibold text-slate-300 mb-2">Keterangan Nilai:</p>
              <ul className="space-y-1">
                <li className="flex justify-between"><span className="text-green-400">A (Amat Baik)</span> <span>90-100</span></li>
                <li className="flex justify-between"><span className="text-blue-400">B (Baik)</span> <span>80-89</span></li>
                <li className="flex justify-between"><span className="text-yellow-400">C (Cukup)</span> <span>70-79</span></li>
                <li className="flex justify-between"><span className="text-red-400">D (Kurang)</span> <span>&lt;70</span></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <PrintSupportModal 
        isOpen={isPrintModalOpen} 
        onClose={() => setIsPrintModalOpen(false)} 
        onConfirm={printSupervision} 
      />
    </div>
  );
}
