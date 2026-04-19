import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Play, Loader2, Trophy, Users, BookOpen, Settings } from 'lucide-react';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const GAME_TYPES = [
  { id: 'action', name: 'Action & Shooter (FPS/TPS)', desc: 'Menekankan aksi cepat dan ketangkasan' },
  { id: 'rpg', name: 'Role-Playing Game (RPG)', desc: 'Pemain memerankan karakter dan membangun cerita' },
  { id: 'battleroyale', name: 'Battle Royale', desc: 'Bertahan hidup hingga menjadi yang terakhir' },
  { id: 'strategy', name: 'Strategi (RTS/TBS)', desc: 'Memerlukan perencanaan dan manajemen sumber daya' },
  { id: 'simulation', name: 'Simulasi', desc: 'Meniru aktivitas kehidupan nyata' },
  { id: 'adventure', name: 'Adventure', desc: 'Berfokus pada cerita, eksplorasi, dan pemecahan teka-teki' },
  { id: 'puzzle', name: 'Puzzle', desc: 'Mengasah otak dengan menyusun atau memecahkan masalah' },
  { id: 'sandbox', name: 'Sandbox', desc: 'Memberikan kebebasan mutlak kepada pemain untuk berkreasi' },
  { id: 'sports', name: 'Sports/Racing', desc: 'Simulasi olahraga atau balap' }
];

const JENJANG = ['PAUD', 'SD', 'SMP', 'SMA'];
const DIFFICULTY_LEVELS = [
  { id: 'easy', name: 'Mudah', color: 'text-green-400' },
  { id: 'medium', name: 'Sedang', color: 'text-yellow-400' },
  { id: 'hard', name: 'Sulit', color: 'text-red-400' },
  { id: 'expert', name: 'Ahli', color: 'text-purple-400' }
];

export default function GameIFP() {
  const [formData, setFormData] = useState({
    topik: '',
    jenjang: 'SD',
    jenisGame: 'puzzle',
    difficulty: 'medium',
    jumlahPemain: 2,
    pemain1: 'Pemain 1',
    pemain2: 'Pemain 2',
    pemain3: 'Pemain 3',
    pemain4: 'Pemain 4',
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [gameHtml, setGameHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateGame = async () => {
    if (!formData.topik) {
      setError('Silakan isi topik pembelajaran terlebih dahulu.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGameHtml(null);

    try {
      const pemainList = [formData.pemain1, formData.pemain2, formData.pemain3, formData.pemain4]
        .slice(0, formData.jumlahPemain)
        .join(', ');

      const selectedGameType = GAME_TYPES.find(g => g.id === formData.jenisGame);

      const prompt = `Buatlah sebuah game edukatif berbasis web (HTML, CSS, JS dalam satu file) yang interaktif dan dapat dimainkan langsung di browser.

Spesifikasi Game:
- Topik Pembelajaran: ${formData.topik}
- Target Audiens: Anak sekolah jenjang ${formData.jenjang}
- Tingkat Kesulitan: ${DIFFICULTY_LEVELS.find(d => d.id === formData.difficulty)?.name}
- Genre Game: ${selectedGameType?.name} (${selectedGameType?.desc})
- Mode: Multiplayer Lokal (Bergantian / Hotseat / Split-screen)
- Jumlah Pemain: ${formData.jumlahPemain} orang
- Nama Pemain: ${pemainList}

Persyaratan Wajib:
1. Game harus memiliki antarmuka pengguna (UI) yang menarik, berwarna, dan ramah anak (user-friendly).
2. Gunakan elemen visual. Jika butuh gambar, gunakan URL gambar placeholder gratis seperti \`https://picsum.photos/seed/game/200/200\` atau avatar dari \`https://api.dicebear.com/7.x/avataaars/svg?seed=NamaPemain\`.
3. Mekanik game harus menggabungkan genre yang dipilih dengan pertanyaan/tantangan edukatif terkait topik "${formData.topik}". (Misal: Jika RPG, pemain menyerang monster dengan menjawab soal. Jika Simulasi, buatlah simulasi sederhana yang interaktif di mana pemain membuat keputusan berbasis materi).
4. Tingkat kesulitan "${DIFFICULTY_LEVELS.find(d => d.id === formData.difficulty)?.name}" harus tercermin dalam kompleksitas soal, kecepatan permainan, atau rintangan yang ada.
5. WAJIB ada sistem Leaderboard (Papan Peringkat) yang terus diperbarui selama game berjalan dan ditampilkan di akhir permainan, menunjukkan skor masing-masing siswa.
6. Kode harus lengkap dalam satu file HTML (menggunakan tag <style> dan <script>). Tidak boleh ada file eksternal selain font/gambar dari CDN publik. Pastikan kode JavaScript bebas dari error sintaks, terutama pada game Simulasi yang kompleks.
7. Pastikan game responsif dan bisa dimainkan dengan mouse/touch.

Output HANYA kode HTML lengkap (dimulai dengan <!DOCTYPE html> dan diakhiri dengan </html>). Jangan berikan penjelasan atau teks markdown lainnya.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
        config: {
          temperature: 0.7,
        }
      });

      let htmlContent = response.text || '';
      
      // Bersihkan markdown jika ada
      if (htmlContent.includes('\`\`\`html')) {
        htmlContent = htmlContent.replace(/\`\`\`html/g, '').replace(/\`\`\`/g, '');
      } else if (htmlContent.includes('\`\`\`')) {
        htmlContent = htmlContent.replace(/\`\`\`/g, '');
      }
      
      setGameHtml(htmlContent.trim());
    } catch (err: any) {
      console.error(err);
      setError('Terjadi kesalahan saat membuat game: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="gen-card bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 rounded-3xl p-6 md:p-8 shadow-2xl /30 relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

        <div className="relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/30 mb-4">
              <Play size={32} className="text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Game IFP Generator</h2>
            <p className="text-indigo-200 max-w-2xl mx-auto">
              Buat game edukatif interaktif multiplayer dengan berbagai genre untuk Interactive Flat Panel (IFP) di kelas Anda.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Form Section */}
            <div className="lg:col-span-1 space-y-6">
              <div className="gen-card bg-slate-800/50 backdrop-blur-sm p-5 rounded-2xl">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Settings size={18} className="text-indigo-400" /> Pengaturan Game
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Topik Pembelajaran</label>
                    <input 
                      type="text" 
                      placeholder="Contoh: Tata Surya, Pecahan, Sejarah Kemerdekaan..." 
                      value={formData.topik}
                      onChange={e => setFormData({...formData, topik: e.target.value})}
                      className="w-full bg-slate-900/50 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Jenjang Sekolah</label>
                    <select 
                      value={formData.jenjang}
                      onChange={e => setFormData({...formData, jenjang: e.target.value})}
                      className="w-full bg-slate-900/50 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    >
                      {JENJANG.map(j => <option key={j} value={j}>{j}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Jenis Game</label>
                    <select 
                      value={formData.jenisGame}
                      onChange={e => setFormData({...formData, jenisGame: e.target.value})}
                      className="w-full bg-slate-900/50 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    >
                      {GAME_TYPES.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-indigo-300 mt-1">
                      {GAME_TYPES.find(g => g.id === formData.jenisGame)?.desc}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Tingkat Kesulitan</label>
                    <div className="grid grid-cols-2 gap-2">
                      {DIFFICULTY_LEVELS.map(level => (
                        <button
                          key={level.id}
                          onClick={() => setFormData({...formData, difficulty: level.id})}
                          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                            formData.difficulty === level.id 
                              ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.2)]' 
                              : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-500'
                          }`}
                        >
                          <span className={level.color}>{level.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="gen-card bg-slate-800/50 backdrop-blur-sm p-5 rounded-2xl">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Users size={18} className="text-indigo-400" /> Pengaturan Pemain
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Jumlah Pemain (Maks 4)</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4].map(num => (
                        <button
                          key={num}
                          onClick={() => setFormData({...formData, jumlahPemain: num})}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                            formData.jumlahPemain === num 
                              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                              : 'bg-slate-900/50 text-slate-400 hover:bg-slate-700'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-slate-400 mb-1">Nama Pemain</label>
                    {Array.from({ length: formData.jumlahPemain }).map((_, i) => (
                      <input 
                        key={i}
                        type="text" 
                        placeholder={`Nama Pemain ${i + 1}`}
                        value={(formData as any)[`pemain${i + 1}`]}
                        onChange={e => setFormData({...formData, [`pemain${i + 1}`]: e.target.value})}
                        className="w-full bg-slate-900/50 border border-slate-600 rounded-xl p-2.5 text-white text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-3 text-center">
                <p className="text-xs text-indigo-200">
                  💡 Suka dengan fitur ini? Dukung pengembangan aplikasi ini melalui <a href="https://saweria.co/pemuryadi" target="_blank" rel="noopener noreferrer" className="text-amber-400 font-bold hover:underline">Saweria</a>
                </p>
              </div>

              <button 
                onClick={generateGame}
                disabled={isGenerating}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold text-lg shadow-xl shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 btn-generate-animated"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="animate-spin" size={24} />
                    Merakit Game...
                  </>
                ) : (
                  <>
                    <Play size={24} />
                    Generate Game
                  </>
                )}
              </button>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}
            </div>

            {/* Preview Section */}
            <div className="lg:col-span-2">
              <div className="bg-slate-950 rounded-2xl border border-slate-700/50 h-full min-h-[600px] flex flex-col overflow-hidden relative shadow-inner">
                {/* Browser Chrome */}
                <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                  </div>
                  <div className="mx-auto bg-slate-950 px-4 py-1 rounded-md text-xs text-slate-500 font-mono flex items-center gap-2">
                    <Trophy size={12} className="text-amber-400" />
                    IFP EduGame Player
                  </div>
                </div>

                {/* Game Container */}
                <div className="flex-1 relative bg-black flex items-center justify-center">
                  {isGenerating ? (
                    <div className="text-center">
                      <div className="w-20 h-20 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-indigo-300 font-medium animate-pulse">AI sedang memprogram game Anda...</p>
                      <p className="text-slate-500 text-sm mt-2">Ini mungkin memakan waktu hingga 1 menit.</p>
                    </div>
                  ) : gameHtml ? (
                    <iframe 
                      srcDoc={gameHtml} 
                      className="w-full h-full border-0 bg-white"
                      title="Generated Game"
                      sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
                    />
                  ) : (
                    <div className="text-center p-8">
                      <div className="gen-card w-24 h-24 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Play size={40} className="text-slate-600" />
                      </div>
                      <h4 className="text-xl font-bold text-slate-400 mb-2">Layar Game Kosong</h4>
                      <p className="text-slate-500 max-w-sm mx-auto">
                        Isi pengaturan di sebelah kiri dan klik "Generate Game" untuk membuat game edukatif kustom Anda.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
