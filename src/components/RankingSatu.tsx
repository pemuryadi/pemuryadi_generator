import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { educationLevels, phaseClassMap, subjectsByLevel } from '../constants';
import { Loader2, Play, Users, Phone, ShieldHalf, Volume2, VolumeX, CheckCircle, XCircle } from 'lucide-react';

const PRIZE_TREE = [
  'Rp 100.000', 'Rp 200.000', 'Rp 300.000', 'Rp 500.000', 'Rp 1.000.000', // Safe Haven 1
  'Rp 2.000.000', 'Rp 4.000.000', 'Rp 8.000.000', 'Rp 16.000.000', 'Rp 32.000.000', // Safe Haven 2
  'Rp 64.000.000', 'Rp 125.000.000', 'Rp 250.000.000', 'Rp 500.000.000', 'Rp 1.000.000.000'
];

type Question = {
  q: string;
  options: string[];
  a: string; // The correct option exactly as in options
  explanation: string;
};

export default function RankingSatu() {
  const [eduLevel, setEduLevel] = useState('sd');
  const [fase, setFase] = useState('A');
  const [kelas, setKelas] = useState('1');
  const [subject, setSubject] = useState('matematika');
  const [customTopic, setCustomTopic] = useState('');
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  
  // Game state
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  
  // Lifelines
  const [used5050, setUsed5050] = useState(false);
  const [usedAskAudience, setUsedAskAudience] = useState(false);
  const [usedPhoneFriend, setUsedPhoneFriend] = useState(false);
  const [hiddenOptions, setHiddenOptions] = useState<number[]>([]);
  const [audienceVotes, setAudienceVotes] = useState<number[]>([]);
  const [friendAdvice, setFriendAdvice] = useState<string | null>(null);
  
  // Audio state
  const [soundEnabled, setSoundEnabled] = useState(true);
  const mainThemeAudioRef = useRef<HTMLAudioElement | null>(null);
  const suspenseAudioRef = useRef<HTMLAudioElement | null>(null);
  const correctAudioRef = useRef<HTMLAudioElement | null>(null);
  const wrongAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Setup Audio
    mainThemeAudioRef.current = new Audio('https://www.myinstants.com/media/sounds/who-wants-to-be-a-millionaire-theme-song.mp3');
    mainThemeAudioRef.current.loop = true;
    
    suspenseAudioRef.current = new Audio('https://www.myinstants.com/media/sounds/millionaire-suspense.mp3');
    suspenseAudioRef.current.loop = true;

    correctAudioRef.current = new Audio('https://www.myinstants.com/media/sounds/correct-answer-millionaire.mp3');
    wrongAudioRef.current = new Audio('https://www.myinstants.com/media/sounds/wrong-answer-millionaire.mp3');

    return () => {
      stopAllAudio();
    };
  }, []);

  useEffect(() => {
    const phases = phaseClassMap[eduLevel]?.phases || [];
    const firstPhase = phases[0]?.id || '';
    setFase(firstPhase);
    
    const classes = phaseClassMap[eduLevel]?.classes[firstPhase] || [];
    setKelas(classes[0]?.id || '');

    const subjects = subjectsByLevel[eduLevel] || [];
    setSubject(subjects[0]?.id || '');
  }, [eduLevel]);

  useEffect(() => {
    const classes = phaseClassMap[eduLevel]?.classes[fase] || [];
    setKelas(classes[0]?.id || '');
  }, [fase, eduLevel]);

  const stopAllAudio = () => {
    if (mainThemeAudioRef.current) { mainThemeAudioRef.current.pause(); mainThemeAudioRef.current.currentTime = 0; }
    if (suspenseAudioRef.current) { suspenseAudioRef.current.pause(); suspenseAudioRef.current.currentTime = 0; }
    if (correctAudioRef.current) { correctAudioRef.current.pause(); correctAudioRef.current.currentTime = 0; }
    if (wrongAudioRef.current) { wrongAudioRef.current.pause(); wrongAudioRef.current.currentTime = 0; }
  };

  const playAudio = (audioRef: React.MutableRefObject<HTMLAudioElement | null>) => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch(e => console.log('Audio play protected', e));
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError('');
    
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error('API key tidak ditemukan');

      const ai = new GoogleGenAI({ apiKey });
      
      const jenjangLabel = educationLevels.find(l => l.id === eduLevel)?.label || eduLevel;
      const faseLabel = phaseClassMap[eduLevel]?.phases.find(p => p.id === fase)?.label || fase;
      const kelasLabel = phaseClassMap[eduLevel]?.classes[fase]?.find(c => c.id === kelas)?.label || kelas;
      const subjectLabel = subjectsByLevel[eduLevel]?.find(s => s.id === subject)?.label || subject;

      const prompt = `Buatkan 15 pertanyaan edukatif pilihan ganda untuk kuis "Ranking #1" ala Who Wants To Be A Millionaire.
Tingkat kesulitan harus meningkat secara progresif dari soal 1 ke 15.

Jenjang: ${jenjangLabel}
Fase: ${faseLabel}
Kelas: ${kelasLabel}
Mata Pelajaran: ${subjectLabel}
Topik Spesifik: ${customTopic || 'Campuran materi penting di kelas ini'}

PENTING: 
1. Pertanyaan harus mengukur kemampuan berpikir dan menantang.
2. Gunakan output HANYA dalam format JSON array of objects. Tiap object berisi "q", "options" (tepat 4 string), "a" (jawaban benar, string persis sama dengan salah satu opsi), dan "explanation" (penjelasan singkat kenapa benar).

[
  {
    "q": "Pertanyaan 1...",
    "options": ["A", "B", "C", "D"],
    "a": "A",
    "explanation": "Penjelasan singkat"
  }
]`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                q: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                a: { type: Type.STRING },
                explanation: { type: Type.STRING }
              },
              required: ["q", "options", "a", "explanation"]
            }
          }
        }
      });

      const text = response.text || '[]';
      const parsedQs = JSON.parse(text);
      
      if (parsedQs && parsedQs.length >= 10) {
        setQuestions(parsedQs.slice(0, 15));
        setGameStarted(true);
        setCurrentQIndex(0);
        resetTurnState();
        resetLifelines();
        stopAllAudio();
        playAudio(suspenseAudioRef);
      } else {
        throw new Error('Gagal menghasilkan jumlah pertanyaan yang cukup');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan saat memproses data.');
    } finally {
      setIsGenerating(false);
    }
  };

  const resetTurnState = () => {
    setSelectedAnswer(null);
    setIsCorrect(null);
    setHiddenOptions([]);
    setAudienceVotes([]);
    setFriendAdvice(null);
    setGameOver(false);
    setGameWon(false);
  };

  const resetLifelines = () => {
    setUsed5050(false);
    setUsedAskAudience(false);
    setUsedPhoneFriend(false);
  };

  const handleAnswerSelect = (opt: string) => {
    if (selectedAnswer !== null || gameOver || gameWon) return; // Prevent double click
    
    setSelectedAnswer(opt);
    
    // Check answer
    const currentQ = questions[currentQIndex];
    if (opt === currentQ.a) {
      setIsCorrect(true);
      stopAllAudio();
      playAudio(correctAudioRef);
      
      setTimeout(() => {
        if (currentQIndex === questions.length - 1) {
          // Win!
          setGameWon(true);
          playAudio(mainThemeAudioRef);
        } else {
          setCurrentQIndex(prev => prev + 1);
          resetTurnState();
          playAudio(suspenseAudioRef);
        }
      }, 3000);
    } else {
      setIsCorrect(false);
      setGameOver(true);
      stopAllAudio();
      playAudio(wrongAudioRef);
    }
  };

  const use5050 = () => {
    if (used5050 || selectedAnswer) return;
    setUsed5050(true);
    const currentQ = questions[currentQIndex];
    const incorrectIndices = [];
    for (let i = 0; i < currentQ.options.length; i++) {
        if (currentQ.options[i] !== currentQ.a) {
            incorrectIndices.push(i);
        }
    }
    // Shuffle incorrect indices and pick 2 to hide
    const toHide = incorrectIndices.sort(() => 0.5 - Math.random()).slice(0, 2);
    setHiddenOptions(toHide);
  };

  const useAskAudience = () => {
    if (usedAskAudience || selectedAnswer) return;
    setUsedAskAudience(true);
    const currentQ = questions[currentQIndex];
    
    const correctIdx = currentQ.options.findIndex(o => o === currentQ.a);
    let votes = [0, 0, 0, 0];
    
    // Assign a high percentage to the correct answer (say 50-80%)
    let remaining = 100;
    const correctVote = Math.floor(Math.random() * 40) + 40; // 40-80
    votes[correctIdx] = correctVote;
    remaining -= correctVote;
    
    // Distribute remaining randomly among the other 3
    for (let i = 0; i < 4; i++) {
        if (i !== correctIdx) {
            const v = Math.floor(Math.random() * remaining);
            votes[i] = v;
            remaining -= v;
        }
    }
    // Add whatever is left to a random wrong one
    const randomWrong = votes.findIndex((v, i) => i !== correctIdx);
    if(randomWrong !== -1) votes[randomWrong] += remaining;
    
    setAudienceVotes(votes);
  };

  const usePhoneFriend = () => {
    if (usedPhoneFriend || selectedAnswer) return;
    setUsedPhoneFriend(true);
    const currentQ = questions[currentQIndex];
    
    // 80% chance friend is right
    const isFriendRight = Math.random() < 0.8;
    if (isFriendRight) {
        setFriendAdvice(`"Halo! Saya yakin 100% jawabannya adalah ${currentQ.a}."`);
    } else {
        const wrongOptions = currentQ.options.filter(o => o !== currentQ.a);
        const randomWrong = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
        setFriendAdvice(`"Hai... aduh ini susah ya. Tapi menurutku jawabannya mungkin ${randomWrong}."`);
    }
  };

  const surrender = () => {
    setGameOver(true);
    stopAllAudio();
    playAudio(mainThemeAudioRef);
  };

  const toggleSound = () => {
    setSoundEnabled(prev => {
        const newSound = !prev;
        if (!newSound) stopAllAudio();
        else if (gameStarted && !gameOver && !gameWon) playAudio(suspenseAudioRef);
        return newSound;
    });
  };

  if (gameStarted) {
    const q = questions[currentQIndex];
    
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center bg-slate-900 border border-slate-700 p-4 rounded-xl">
            <h2 className="text-xl font-black text-cyber-blue uppercase italic">RANKING #1</h2>
            <div className="flex items-center gap-4">
                <button onClick={toggleSound} className="text-slate-400 hover:text-white transition-colors">
                    {soundEnabled ? <Volume2 /> : <VolumeX />}
                </button>
                <button onClick={() => setGameStarted(false)} className="px-4 py-2 bg-red-600/20 text-red-500 rounded-lg hover:bg-red-600/40 text-sm font-bold">
                    Tutup Game
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Game Area */}
            <div className="lg:col-span-3 space-y-6">
                 {/* Lifelines */}
                 <div className="flex flex-wrap gap-4 justify-center">
                    <button 
                        onClick={use5050} 
                        disabled={used5050 || selectedAnswer !== null}
                        className={`w-16 h-12 flex items-center justify-center rounded-full border-2 font-bold transition-all ${used5050 ? 'border-red-500 text-red-500 opacity-50 line-through' : 'border-cyber-yellow text-cyber-yellow hover:bg-cyber-yellow/20 hover:scale-110 shadow-[0_0_15px_rgba(255,215,0,0.5)]'}`}
                    >
                        50:50
                    </button>
                    <button 
                        onClick={useAskAudience} 
                        disabled={usedAskAudience || selectedAnswer !== null}
                        className={`w-16 h-12 flex items-center justify-center rounded-full border-2 font-bold transition-all ${usedAskAudience ? 'border-red-500 text-red-500 opacity-50 line-through' : 'border-cyber-yellow text-cyber-yellow hover:bg-cyber-yellow/20 hover:scale-110 shadow-[0_0_15px_rgba(255,215,0,0.5)]'}`}
                    >
                        <Users size={20} />
                    </button>
                    <button 
                        onClick={usePhoneFriend} 
                        disabled={usedPhoneFriend || selectedAnswer !== null}
                        className={`w-16 h-12 flex items-center justify-center rounded-full border-2 font-bold transition-all ${usedPhoneFriend ? 'border-red-500 text-red-500 opacity-50 line-through' : 'border-cyber-yellow text-cyber-yellow hover:bg-cyber-yellow/20 hover:scale-110 shadow-[0_0_15px_rgba(255,215,0,0.5)]'}`}
                    >
                        <Phone size={20} />
                    </button>
                 </div>

                 {/* Active Lifeline Info */}
                 {(audienceVotes.length > 0 || friendAdvice) && (
                    <div className="bg-slate-800/80 border border-cyber-yellow/50 p-4 rounded-xl text-center animate-in fade-in zoom-in">
                        {audienceVotes.length > 0 && (
                            <div>
                                <h4 className="text-cyber-yellow font-bold mb-2">Hasil Polling Penonton:</h4>
                                <div className="flex justify-center gap-4">
                                    {['A','B','C','D'].map((lbl, idx) => (
                                        <div key={idx} className="flex flex-col items-center">
                                            <div className="w-8 h-24 bg-slate-700 rounded-t-sm flex items-end justify-center pb-1">
                                                <div 
                                                    className="w-4 bg-cyber-blue rounded-t-sm" 
                                                    style={{ height: `${audienceVotes[idx]}%` }}
                                                ></div>
                                            </div>
                                            <div className="text-xs font-bold mt-1">{lbl}</div>
                                            <div className="text-[10px] text-slate-400">{audienceVotes[idx]}%</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {friendAdvice && (
                            <div>
                                <h4 className="text-cyber-yellow font-bold mb-2">Saran Teman:</h4>
                                <p className="italic text-slate-300">{friendAdvice}</p>
                            </div>
                        )}
                    </div>
                 )}

                 {/* Question Area */}
                 <div className="relative">
                    <div className="absolute inset-0 bg-blue-900/20 blur-xl rounded-[100%]"></div>
                    <div className="bg-[#000033] border-4 border-blue-500/50 rounded-[4rem] text-center p-8 relative overflow-hidden shadow-[0_0_30px_rgba(0,100,255,0.4)]">
                        <div className="absolute top-0 left-0 w-full h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.02)_10px,rgba(255,255,255,0.02)_20px)]"></div>
                        <h3 className="text-2xl md:text-3xl font-bold text-white relative z-10 leading-relaxed shadow-black drop-shadow-md">
                            {q.q}
                        </h3>
                    </div>
                 </div>

                 {/* Options Area */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {q.options.map((opt, idx) => {
                        const ABCD = ['A', 'B', 'C', 'D'][idx];
                        const isHidden = hiddenOptions.includes(idx);
                        
                        let bgColor = 'bg-[#000033]';
                        let borderColor = 'border-blue-500/50';
                        let textColor = 'text-white';
                        
                        if (selectedAnswer === opt) {
                            if (isCorrect === null) {
                                bgColor = 'bg-yellow-500'; // Lock answer
                                textColor = 'text-black';
                            } else if (isCorrect === true) {
                                bgColor = 'bg-green-500'; // Correct!
                                textColor = 'text-white';
                            } else {
                                bgColor = 'bg-red-500'; // Wrong!
                                textColor = 'text-white';
                            }
                        } else if (selectedAnswer !== null && opt === q.a && isCorrect === false) {
                            // Show correct if they got it wrong
                            bgColor = 'bg-green-500 animate-pulse';
                            textColor = 'text-white';
                        }
                        
                        if (isHidden) {
                            return (
                                <div key={idx} className="h-16 flex items-center px-6 rounded-full border border-slate-800 bg-slate-900 opacity-20">
                                   <span className="text-orange-500 font-bold mr-4">{ABCD}:</span>
                                </div>
                            );
                        }

                        return (
                            <button
                                key={idx}
                                onClick={() => handleAnswerSelect(opt)}
                                disabled={selectedAnswer !== null}
                                className={`h-16 flex items-center px-6 rounded-full border-2 ${borderColor} ${bgColor} transition-all relative overflow-hidden group hover:scale-[1.02]`}
                            >
                                <span className={`font-bold mr-4 ${textColor === 'text-white' ? 'text-orange-500' : 'text-black'}`}>{ABCD}:</span>
                                <span className={`font-semibold text-left max-w-full truncate ${textColor}`}>{opt}</span>
                                {!selectedAnswer && <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors"></div>}
                            </button>
                        );
                    })}
                 </div>

                 {/* Explanation / Result */}
                 {selectedAnswer !== null && (
                     <div className={`p-6 rounded-xl border-l-4 animate-in fade-in slide-in-from-bottom-4 ${isCorrect ? 'bg-green-900/20 border-green-500' : 'bg-red-900/20 border-red-500'}`}>
                         <h4 className={`text-xl font-bold mb-2 flex items-center gap-2 ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                             {isCorrect ? <CheckCircle /> : <XCircle />} 
                             {isCorrect ? 'Benar!' : 'Salah!'}
                         </h4>
                         <p className="text-slate-200">{q.explanation}</p>
                         
                         {gameOver && !gameWon && (
                             <div className="mt-6">
                                 <h3 className="text-2xl font-black text-white italic">GAME OVER</h3>
                                 <p className="text-slate-400 mt-2">Anda berhasil mencapai hadiah:</p>
                                 <p className="text-3xl text-cyber-yellow font-bold font-mono">
                                    {currentQIndex === 0 ? 'Rp 0' : PRIZE_TREE[currentQIndex - 1]}
                                 </p>
                                 <button onClick={() => setGameStarted(false)} className="mt-4 px-6 py-3 bg-cyber-blue text-black font-bold rounded-lg hover:bg-cyan-400">
                                     Main Lagi
                                 </button>
                             </div>
                         )}

                         {gameWon && (
                             <div className="mt-6">
                                 <h3 className="text-3xl font-black text-cyber-yellow italic animate-pulse">RANKING #1 TERCAPAI!</h3>
                                 <p className="text-slate-400 mt-2">Selamat! Anda telah memenangkan hadiah utama:</p>
                                 <p className="text-4xl text-green-400 font-bold font-mono">
                                    Rp 1.000.000.000
                                 </p>
                                 <button onClick={() => setGameStarted(false)} className="mt-4 px-6 py-3 bg-cyber-blue text-black font-bold rounded-lg hover:bg-cyan-400">
                                     Kembali ke Menu
                                 </button>
                             </div>
                         )}
                     </div>
                 )}
            </div>

            {/* Prize Tree Area */}
            <div className="lg:col-span-1 bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 flex flex-col justify-end">
                <div className="space-y-1 w-full text-right font-mono font-bold tracking-tight">
                    {[...PRIZE_TREE].reverse().map((prize, idx) => {
                        const originalIndex = PRIZE_TREE.length - 1 - idx;
                        const isCurrent = originalIndex === currentQIndex;
                        const isPassed = originalIndex < currentQIndex;
                        const isMilestone = (originalIndex + 1) % 5 === 0;

                        return (
                            <div 
                                key={originalIndex}
                                className={`flex justify-between items-center px-3 py-1 rounded transition-all ${
                                    isCurrent ? 'bg-orange-500 text-black scale-105 shadow-[0_0_10px_orange]' : 
                                    isPassed ? 'text-green-500' :
                                    isMilestone ? 'text-white' : 'text-slate-500'
                                }`}
                            >
                                <span className={isCurrent ? '' : 'text-slate-600'}>{originalIndex + 1}</span>
                                ◐ {prize}
                            </div>
                        );
                    })}
                </div>
                {!gameOver && !gameWon && selectedAnswer === null && currentQIndex > 0 && (
                    <button 
                        onClick={surrender}
                        className="mt-6 w-full py-2 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/10 text-sm font-bold transition-all"
                    >
                        Nyerah Bawa Pulang {PRIZE_TREE[currentQIndex - 1]}
                    </button>
                )}
            </div>
        </div>
      </div>
    );
  }

  // Setup Form Mode
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 md:p-8">
            <h2 className="text-2xl md:text-3xl font-black text-cyber-yellow tracking-tighter italic mb-2 flex items-center gap-3">
               RANKING #1 🏆
            </h2>
            <p className="text-slate-400 text-sm mb-6 max-w-2xl">
              Uji pengetahuan siswa layaknya di kursi panas acara Who Wants To Be A Millionaire. 
              Gunakan 3 pilihan bantuan untuk mencapai hadiah virtual terbesar!
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Jenjang Pendidikan</label>
                  <select 
                    value={eduLevel}
                    onChange={(e) => setEduLevel(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-600 rounded-xl p-3 text-white focus:border-cyber-yellow transition-all"
                  >
                    {educationLevels.map(lvl => (
                      <option key={lvl.id} value={lvl.id}>{lvl.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Mata Pelajaran</label>
                  <select 
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-600 rounded-xl p-3 text-white focus:border-cyber-yellow transition-all"
                  >
                    {subjectsByLevel[eduLevel]?.map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Fase</label>
                  <select 
                    value={fase}
                    onChange={(e) => setFase(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-600 rounded-xl p-3 text-white focus:border-cyber-yellow transition-all"
                  >
                    {phaseClassMap[eduLevel]?.phases.map(p => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Kelas</label>
                  <select 
                    value={kelas}
                    onChange={(e) => setKelas(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-600 rounded-xl p-3 text-white focus:border-cyber-yellow transition-all"
                  >
                    {phaseClassMap[eduLevel]?.classes[fase]?.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
            </div>

            <div className="mb-8">
                <label className="block text-sm font-medium text-slate-300 mb-2">Topik Spesifik (Opsional)</label>
                <input 
                    type="text" 
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    placeholder="Contoh: Tata Surya, Aljabar, dll..."
                    className="w-full bg-slate-800/50 border border-slate-600 rounded-xl p-3 text-white focus:border-cyber-yellow transition-all"
                />
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-900/30 text-red-400 rounded-xl text-sm border border-red-900/50">
                {error}
              </div>
            )}

            <button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-600 font-bold text-lg text-white hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 btn-generate-animated"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={24} className="animate-spin" />
                  Membangun Kursi Panas...
                </>
              ) : (
                <>
                  <Play size={24} />
                  Mulai Kuis
                </>
              )}
            </button>
        </div>
    </div>
  );
}
