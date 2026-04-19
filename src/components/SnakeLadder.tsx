import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { eduQuestions, snakes, ladders, educationLevels, phaseClassMap, subjectsByLevel } from '../constants';

type Player = {
  id: number;
  position: number;
  pawn: string;
  color: string;
};

type Question = {
  q: string;
  options: string[];
  a: string;
};

export default function SnakeLadder() {
  const [eduLevel, setEduLevel] = useState('sd');
  const [fase, setFase] = useState('A');
  const [kelas, setKelas] = useState('1');
  const [subject, setSubject] = useState('matematika');
  const [questionType, setQuestionType] = useState('isian');
  const [boardGenerated, setBoardGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [diceResult, setDiceResult] = useState<number | '❓'>('❓');
  const [isRolling, setIsRolling] = useState(false);
  const [modalContent, setModalContent] = useState<{title: string, question: Question, targetCell: number, isSnake: any, isLadder: any} | null>(null);
  
  // New Game State
  const [numPlayers, setNumPlayers] = useState(2);
  const [players, setPlayers] = useState<Player[]>([
    { id: 1, position: 1, pawn: '🚗', color: 'bg-blue-500' },
    { id: 2, position: 1, pawn: '🚢', color: 'bg-red-500' }
  ]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [winner, setWinner] = useState<Player | null>(null);

  const [showCharacterSelection, setShowCharacterSelection] = useState(false);

  const pawns = [
    { icon: '🚗', color: 'bg-blue-500' },
    { icon: '🚢', color: 'bg-red-500' },
    { icon: '✈️', color: 'bg-green-500' },
    { icon: '🏍️', color: 'bg-yellow-500' },
    { icon: '🚀', color: 'bg-purple-500' },
    { icon: '🚁', color: 'bg-teal-500' },
    { icon: '🛸', color: 'bg-indigo-500' },
    { icon: '🚂', color: 'bg-orange-500' },
    { icon: '🚜', color: 'bg-lime-500' },
    { icon: '🛵', color: 'bg-pink-500' }
  ];

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

  const handleNumPlayersChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const count = parseInt(e.target.value);
    setNumPlayers(count);
    const newPlayers = Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      position: 1,
      pawn: pawns[i].icon,
      color: pawns[i].color
    }));
    setPlayers(newPlayers);
  };

  const startGame = () => {
    if (!boardGenerated) return;
    setGameStarted(true);
    setPlayers(players.map(p => ({ ...p, position: 1 })));
    setCurrentPlayerIndex(0);
    setWinner(null);
    setDiceResult('❓');
  };

  const generateBoard = async () => {
    setIsGenerating(true);
    setError('');
    setBoardGenerated(false);
    
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error('API key tidak ditemukan');

      const ai = new GoogleGenAI({ apiKey });
      
      const jenjangLabel = educationLevels.find(l => l.id === eduLevel)?.label || eduLevel;
      const faseLabel = phaseClassMap[eduLevel]?.phases.find(p => p.id === fase)?.label || fase;
      const kelasLabel = phaseClassMap[eduLevel]?.classes[fase]?.find(c => c.id === kelas)?.label || kelas;
      const subjectLabel = subjectsByLevel[eduLevel]?.find(s => s.id === subject)?.label || subject;

      let prompt = '';
      if (questionType === 'isian') {
          prompt = `Buatkan 30 pertanyaan edukatif tipe isian singkat (jawaban pendek) untuk permainan Ular Tangga.
Jenjang: ${jenjangLabel}
Fase: ${faseLabel}
Kelas: ${kelasLabel}
Mata Pelajaran: ${subjectLabel}

PENTING: 
1. Sesuaikan tingkat kesulitan soal dengan fase atau kelas yang dipilih.
2. Gunakan referensi dari sumber terpercaya.
3. Berikan output HANYA dalam format JSON array of objects dengan struktur:
[
  { 
    "q": "Pertanyaan 1...", 
    "options": ["Tampilkan Jawaban"],
    "a": "Kunci Jawaban Singkat" 
  },
  ...
]`;
      } else {
          prompt = `Buatkan 30 pertanyaan edukatif pilihan ganda untuk permainan Ular Tangga.
Jenjang: ${jenjangLabel}
Fase: ${faseLabel}
Kelas: ${kelasLabel}
Mata Pelajaran: ${subjectLabel}

PENTING: 
1. Sesuaikan tingkat kesulitan soal dengan fase atau kelas yang dipilih.
2. Gunakan referensi dari sumber terpercaya.
3. Berikan output HANYA dalam format JSON array of objects dengan struktur:
[
  { 
    "q": "Pertanyaan 1", 
    "options": ["Pilihan A", "Pilihan B", "Pilihan C", "Pilihan D"],
    "a": "Jawaban Benar (harus sama persis dengan salah satu options)" 
  },
  ...
]`;
      }

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
                q: { type: Type.STRING, description: "Pertanyaan edukatif" },
                options: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING },
                  description: "4 Pilihan jawaban" 
                },
                a: { type: Type.STRING, description: "Jawaban benar" }
              },
              required: ["q", "options", "a"]
            }
          }
        }
      });

      const text = response.text || '[]';
      const questions = JSON.parse(text);
      
      if (questions && questions.length > 0) {
        setGeneratedQuestions(questions);
        setBoardGenerated(true);
      } else {
        throw new Error('Gagal menghasilkan pertanyaan');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan saat membuat papan permainan');
      // Fallback to static questions if API fails
      const fallbackQuestions = [
        { 
          q: `Pertanyaan seputar ${subjectsByLevel[eduLevel]?.find(s => s.id === subject)?.label || subject} untuk kelas ${kelas}?`, 
          options: ["A", "B", "C", "D"],
          a: "A" 
        }
      ];
      setGeneratedQuestions(fallbackQuestions);
      setBoardGenerated(true);
      setGameStarted(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const rollDice = () => {
    if (!gameStarted || winner || isRolling) return;
    
    setIsRolling(true);
    
    // Animation effect
    let rolls = 0;
    const rollInterval = setInterval(() => {
      setDiceResult(Math.floor(Math.random() * 6) + 1);
      rolls++;
      if (rolls > 10) {
        clearInterval(rollInterval);
        const finalDice = Math.floor(Math.random() * 6) + 1;
        setDiceResult(finalDice);
        setIsRolling(false);
        handleMove(finalDice);
      }
    }, 100);
  };

  const handleMove = (diceValue: number) => {
    const currentPlayer = players[currentPlayerIndex];
    let newPosition = currentPlayer.position + diceValue;
    
    if (newPosition > 100) {
      // Bounce back if exceeding 100
      newPosition = 100 - (newPosition - 100);
    }

    const isSnake = snakes.find(s => s.head === newPosition);
    const isLadder = ladders.find(l => l.bottom === newPosition);
    
    showCellQuestion(newPosition, isSnake, isLadder);
  };

  const handleAnswer = (selectedOption: string, targetCell: number, isSnake: any, isLadder: any) => {
    const isCorrect = selectedOption === modalContent?.question.a;
    const currentPlayer = players[currentPlayerIndex];
    
    let finalPosition = currentPlayer.position;

    if (isCorrect) {
      finalPosition = targetCell;
      if (isSnake) finalPosition = isSnake.tail;
      if (isLadder) finalPosition = isLadder.top;
    }

    const newPlayers = [...players];
    newPlayers[currentPlayerIndex] = { ...currentPlayer, position: finalPosition };
    setPlayers(newPlayers);
    
    setModalContent(null);

    if (finalPosition === 100) {
      setWinner(currentPlayer);
    } else {
      setCurrentPlayerIndex((prev) => (prev + 1) % numPlayers);
    }
  };

  const showCellQuestion = (cellNum: number, isSnake: any, isLadder: any) => {
    const questionPool = generatedQuestions.length > 0 ? generatedQuestions : [
      { q: "Pertanyaan belum tersedia", options: ["A", "B"], a: "A" }
    ];
    
    const randomQ = questionPool[Math.floor(Math.random() * questionPool.length)];
    
    setModalContent({ 
      title: `Pemain ${currentPlayerIndex + 1} Menjawab`, 
      question: randomQ,
      targetCell: cellNum,
      isSnake,
      isLadder
    });
  };

  const renderDiceFace = (result: number | '❓') => {
    if (result === '❓') return <div className="text-7xl">🎲</div>;
    
    const dot = <div className="w-5 h-5 bg-white rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"></div>;
    
    return (
      <div className="w-full h-full relative p-4">
        {result === 1 && <div className="absolute inset-0 flex items-center justify-center">{dot}</div>}
        {result === 2 && (
          <>
            <div className="absolute top-4 left-4">{dot}</div>
            <div className="absolute bottom-4 right-4">{dot}</div>
          </>
        )}
        {result === 3 && (
          <>
            <div className="absolute top-4 left-4">{dot}</div>
            <div className="absolute inset-0 flex items-center justify-center">{dot}</div>
            <div className="absolute bottom-4 right-4">{dot}</div>
          </>
        )}
        {result === 4 && (
          <>
            <div className="absolute top-4 left-4">{dot}</div>
            <div className="absolute top-4 right-4">{dot}</div>
            <div className="absolute bottom-4 left-4">{dot}</div>
            <div className="absolute bottom-4 right-4">{dot}</div>
          </>
        )}
        {result === 5 && (
          <>
            <div className="absolute top-4 left-4">{dot}</div>
            <div className="absolute top-4 right-4">{dot}</div>
            <div className="absolute inset-0 flex items-center justify-center">{dot}</div>
            <div className="absolute bottom-4 left-4">{dot}</div>
            <div className="absolute bottom-4 right-4">{dot}</div>
          </>
        )}
        {result === 6 && (
          <>
            <div className="absolute top-4 left-4">{dot}</div>
            <div className="absolute top-4 right-4">{dot}</div>
            <div className="absolute top-[50%] left-4 -translate-y-1/2">{dot}</div>
            <div className="absolute top-[50%] right-4 -translate-y-1/2">{dot}</div>
            <div className="absolute bottom-4 left-4">{dot}</div>
            <div className="absolute bottom-4 right-4">{dot}</div>
          </>
        )}
      </div>
    );
  };

  const renderBoard = () => {
    const cells = [];
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        let num;
        if (row % 2 === 0) {
          num = 100 - (row * 10) - col;
        } else {
          num = 100 - (row * 10) - (9 - col);
        }
        
        const isSnake = snakes.find(s => s.head === num);
        const isLadder = ladders.find(l => l.bottom === num);
        
        let bgClass = num % 2 === 0 ? 'bg-slate-700' : 'bg-slate-600';
        if (isSnake) bgClass = 'bg-gradient-to-br from-red-500 to-red-600';
        if (isLadder) bgClass = 'bg-gradient-to-br from-green-500 to-green-600';

        const playersOnCell = players.filter(p => p.position === num);

        cells.push(
          <div 
            key={num}
            className={`aspect-square flex flex-col items-center justify-center text-[10px] p-[2px] rounded relative ${bgClass} text-white shadow-sm border border-slate-800/50`}
          >
            <span className="font-bold opacity-50 absolute top-1 left-1">{num}</span>
            {isSnake && <div className="absolute top-1 right-1 flex flex-col items-center leading-none opacity-50"><span className="text-xs">🐍</span><span className="text-[6px]">{isSnake.tail}</span></div>}
            {isLadder && <div className="absolute top-1 right-1 flex flex-col items-center leading-none opacity-50"><span className="text-xs">🪜</span><span className="text-[6px]">{isLadder.top}</span></div>}
            
            {/* Pawns */}
            <div className="flex flex-wrap justify-center items-center gap-0.5 w-full h-full z-10 pt-3">
              {playersOnCell.map(p => (
                <div key={p.id} className={`w-4 h-4 md:w-5 md:h-5 rounded-full ${p.color} flex items-center justify-center text-[10px] md:text-xs shadow-md border border-white/50 animate-bounce`}>
                  {p.pawn}
                </div>
              ))}
            </div>
          </div>
        );
      }
    }
    return <div className="gen-card grid grid-cols-10 gap-[2px] p-2 bg-slate-800 rounded-xl">{cells}</div>;
  };

  return (
    <div className="gen-card rounded-2xl p-6 md:p-8 bg-gradient-to-br from-slate-800 to-slate-900 shadow-xl relative">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-2xl shadow-lg">
          🎲
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white">Snake & Ladder Edukatif</h3>
          <p className="text-slate-400">Permainan ular tangga dengan pertanyaan edukatif</p>
        </div>
      </div>
      
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Jenjang Pendidikan</label>
            <select 
              value={eduLevel}
              onChange={(e) => setEduLevel(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-600 rounded-xl p-3 text-white focus:border-orange-500 transition-all"
            >
              {educationLevels.map(level => (
                <option key={level.id} value={level.id}>{level.label}</option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Fase</label>
              <select 
                value={fase}
                onChange={(e) => setFase(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-600 rounded-xl p-3 text-white focus:border-orange-500 transition-all"
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
                className="w-full bg-slate-800/50 border border-slate-600 rounded-xl p-3 text-white focus:border-orange-500 transition-all"
              >
                {phaseClassMap[eduLevel]?.classes[fase]?.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Mata Pelajaran</label>
              <select 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-600 rounded-xl p-3 text-white focus:border-orange-500 transition-all"
              >
                {subjectsByLevel[eduLevel]?.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Bentuk Soal</label>
              <select 
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-600 rounded-xl p-3 text-white focus:border-orange-500 transition-all"
              >
                <option value="isian">Isian Singkat</option>
                <option value="pg">Pilihan Ganda</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Jumlah Pemain</label>
            <select 
              value={numPlayers}
              onChange={handleNumPlayersChange}
              disabled={gameStarted}
              className="w-full bg-slate-800/50 border border-slate-600 rounded-xl p-3 text-white focus:border-orange-500 transition-all disabled:opacity-50"
            >
              <option value={2}>2 Pemain</option>
              <option value={3}>3 Pemain</option>
              <option value={4}>4 Pemain</option>
            </select>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => setShowCharacterSelection(true)} 
              disabled={isGenerating || gameStarted}
              className="flex-1 py-4 rounded-xl bg-slate-700 font-bold text-white hover:bg-slate-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 btn-generate-animated"
            >
              {isGenerating ? (
                <><span className="animate-spin">⏳</span> Menyiapkan...</>
              ) : (
                <><span>📝</span> Buat Soal</>
              )}
            </button>
            <button 
              onClick={startGame} 
              disabled={!boardGenerated || isGenerating}
              className="flex-1 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 font-bold text-white hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-orange-500/25 disabled:opacity-50"
            >
              <span>🎮</span> {gameStarted ? 'Mulai Ulang' : 'Mulai Main'}
            </button>
          </div>
          
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}
          
          <div className="gen-card bg-slate-800/80 rounded-xl p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2 text-white">🎯 Cara Main</h4>
            <ol className="text-sm text-slate-400 space-y-2">
              <li>1. Buat soal lalu klik Mulai Main</li>
              <li>2. Pemain bergiliran melempar dadu</li>
              <li>3. Jawab pertanyaan dengan benar untuk maju</li>
              <li>4. Salah jawab = tidak maju</li>
              <li>5. 🐍 Ular = turun, 🪜 Tangga = naik</li>
            </ol>
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <div className="gen-card bg-slate-800/30 rounded-xl p-4 min-h-[500px] flex items-center justify-center relative">
            {winner && (
              <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center animate-in fade-in zoom-in">
                <div className="text-6xl mb-4 animate-bounce">🏆</div>
                <h2 className="text-3xl font-bold text-white mb-2">Pemain {winner.id} Menang!</h2>
                <div className={`text-4xl w-16 h-16 rounded-full ${winner.color} flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,255,255,0.3)]`}>
                  {winner.pawn}
                </div>
                <button 
                  onClick={startGame}
                  className="px-6 py-3 bg-orange-500 hover:bg-orange-400 text-white font-bold rounded-xl transition-all"
                >
                  Main Lagi
                </button>
              </div>
            )}
            
            {boardGenerated ? (
              <div className="flex flex-col md:flex-row items-center justify-center gap-8 w-full">
                <div className="w-full max-w-md">
                  {renderBoard()}
                </div>
                {gameStarted && (
                  <div className="w-full md:w-64 bg-slate-900/80 rounded-xl p-4 border border-slate-700 flex-shrink-0 shadow-xl">
                    <div className="flex flex-col items-center justify-between mb-4 gap-2">
                      <span className="font-semibold text-slate-300 uppercase tracking-widest text-xs">Giliran Pemain</span>
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${players[currentPlayerIndex].color} text-white text-sm font-bold shadow-lg`}>
                        <span className="text-2xl">{players[currentPlayerIndex].pawn}</span> Pemain {players[currentPlayerIndex].id}
                      </div>
                    </div>
                    <div className="flex items-center justify-center py-6 perspective-1000">
                      <div 
                        className={`w-[135px] h-[155px] bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl border-2 border-slate-600 shadow-[0_10px_20px_rgba(0,0,0,0.5),inset_0_2px_5px_rgba(255,255,255,0.2)] flex items-center justify-center transition-all duration-100 ${isRolling ? 'animate-dice-roll' : ''}`}
                      >
                        {renderDiceFace(diceResult)}
                      </div>
                    </div>
                    <button 
                      onClick={rollDice} 
                      disabled={isRolling || !!winner}
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white font-bold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-sm"
                    >
                      {isRolling ? 'Melempar...' : 'Lempar Dadu!'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-slate-500 py-16">
                <div className="text-6xl mb-4 opacity-50">🎲</div>
                <p>Papan permainan akan muncul di sini</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
          <div className="gen-card relative bg-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-blue-400 flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full ${players[currentPlayerIndex].color} flex items-center justify-center text-sm`}>
                  {players[currentPlayerIndex].pawn}
                </div>
                {modalContent.title}
              </h3>
              <div className="text-right">
                <div className="text-xs text-slate-400">Menuju Kotak</div>
                <div className="text-xl font-bold text-white">{modalContent.targetCell}</div>
              </div>
            </div>
            
            <div className="gen-card bg-slate-900/50 rounded-xl p-4 mb-6">
              <p className="text-lg text-white font-medium mb-4">{modalContent.question.q}</p>
              
              <div className="space-y-3">
                {modalContent.question.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(opt, modalContent.targetCell, modalContent.isSnake, modalContent.isLadder)}
                    className="w-full text-left p-4 rounded-xl bg-slate-800 hover:bg-blue-600/20 border border-slate-600 hover:border-blue-500 transition-all text-slate-200"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex gap-4 text-sm">
              {modalContent.isSnake && (
                <div className="flex-1 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400">
                  🐍 Awas! Jika benar, kamu akan turun ke kotak {modalContent.isSnake.tail}
                </div>
              )}
              {modalContent.isLadder && (
                <div className="flex-1 bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-green-400">
                  🪜 Mantap! Jika benar, kamu akan naik ke kotak {modalContent.isLadder.top}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Character Selection Modal */}
      {showCharacterSelection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
          <div className="gen-card relative bg-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-white mb-4 text-center">Pilih Karakter Pemain</h3>
            
            <div className="space-y-4 mb-6 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
              {players.map((player, idx) => (
                <div key={player.id} className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                  <h4 className="text-sm font-semibold text-slate-300 mb-3">Pemain {player.id}</h4>
                  <div className="flex flex-wrap gap-2">
                    {pawns.map((pawn, pIdx) => (
                      <button
                        key={pIdx}
                        onClick={() => {
                          const newPlayers = [...players];
                          newPlayers[idx] = { ...newPlayers[idx], pawn: pawn.icon, color: pawn.color };
                          setPlayers(newPlayers);
                        }}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all ${player.pawn === pawn.icon ? `${pawn.color} shadow-lg scale-110` : 'bg-slate-800 hover:bg-slate-700 border border-slate-600'}`}
                      >
                        {pawn.icon}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowCharacterSelection(false)}
                className="flex-1 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold transition-all"
              >
                Batal
              </button>
              <button 
                onClick={() => {
                  setShowCharacterSelection(false);
                  generateBoard();
                }}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-lg"
              >
                Mulai Buat Soal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
