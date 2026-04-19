import React, { useState, useRef } from 'react';
import { useAuth } from '../AuthContext';
import { getWatermarkHtml } from '../utils/print';

export default function WordSearch() {
  const { profile } = useAuth();
  const [title, setTitle] = useState('');
  const [wordsText, setWordsText] = useState('');
  const [gridSize, setGridSize] = useState(20);
  const [difficulty, setDifficulty] = useState('easy');
  const [puzzleData, setPuzzleData] = useState<{title: string, grid: string[][], words: string[], gridSize: number} | null>(null);
  const [error, setError] = useState('');

  const wordCount = wordsText.trim().split('\n').filter(w => w.trim()).length;

  const getDirections = (diff: string) => {
    switch(diff) {
      case 'easy': return [[0,1], [1,0]]; // H, V
      case 'medium': return [[0,1], [1,0], [1,1], [-1,1]]; // + Diagonal
      case 'hard': return [[0,1], [1,0], [1,1], [-1,1], [0,-1], [-1,0], [-1,-1], [1,-1]]; // + Reverse
      default: return [[0,1], [1,0]];
    }
  };

  const canPlace = (grid: string[][], word: string, row: number, col: number, dir: number[], size: number) => {
    for (let i = 0; i < word.length; i++) {
      const r = row + i * dir[0];
      const c = col + i * dir[1];
      if (r < 0 || r >= size || c < 0 || c >= size) return false;
      if (grid[r][c] && grid[r][c] !== word[i]) return false;
    }
    return true;
  };

  const placeWord = (grid: string[][], word: string, directions: number[][], size: number) => {
    const attempts = 100;
    for (let a = 0; a < attempts; a++) {
      const dir = directions[Math.floor(Math.random() * directions.length)];
      const startRow = Math.floor(Math.random() * size);
      const startCol = Math.floor(Math.random() * size);

      if (canPlace(grid, word, startRow, startCol, dir, size)) {
        for (let i = 0; i < word.length; i++) {
          grid[startRow + i * dir[0]][startCol + i * dir[1]] = word[i];
        }
        return true;
      }
    }
    return false;
  };

  const generatePuzzle = () => {
    setError('');
    const puzzleTitle = title || 'Word Search Puzzle';
    
    if (!wordsText.trim()) {
      setError('Masukkan kata-kata untuk puzzle!');
      return;
    }

    let words = wordsText.toUpperCase().split('\n').map(w => w.trim().replace(/\s/g, '')).filter(w => w && w.length <= gridSize);
    words = words.slice(0, 40); // Max 40 words

    // Create grid
    const grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(''));
    const placedWords: string[] = [];
    const directions = getDirections(difficulty);

    // Place words
    words.forEach(word => {
      const placed = placeWord(grid, word, directions, gridSize);
      if (placed) placedWords.push(word);
    });

    // Fill empty cells
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        if (!grid[i][j]) {
          grid[i][j] = letters[Math.floor(Math.random() * 26)];
        }
      }
    }

    setPuzzleData({ title: puzzleTitle, grid, words: placedWords, gridSize });
  };

  const printPuzzle = () => {
    if (!puzzleData) {
      setError('Generate puzzle terlebih dahulu!');
      return;
    }

    const { title, grid, words, gridSize } = puzzleData;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    let gridHtml = '<table style="border-collapse:collapse;margin:20px auto;">';
    for (let i = 0; i < gridSize; i++) {
      gridHtml += '<tr>';
      for (let j = 0; j < gridSize; j++) {
        gridHtml += `<td style="width:25px;height:25px;text-align:center;border:1px solid #333;font-family:monospace;font-weight:bold;">${grid[i][j]}</td>`;
      }
      gridHtml += '</tr>';
    }
    gridHtml += '</table>';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head><title>${title}</title></head>
      <body style="font-family:Arial,sans-serif;padding:20px;">
        <h1 style="text-align:center;">${title}</h1>
        <p style="text-align:center;">Temukan ${words.length} kata tersembunyi!</p>
        ${gridHtml}
        <div style="margin-top:20px;">
          <h3>Kata yang dicari:</h3>
          <p>${words.join(', ')}</p>
        </div>
        <p style="text-align:center;margin-top:30px;font-size:12px;color:#666;">©2026 pemuryadi - Maju Pendidikan Indonesia</p>
        ${getWatermarkHtml(profile?.role)}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="gen-card rounded-2xl p-6 md:p-8 bg-gradient-to-br from-slate-800 to-slate-900 shadow-xl">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-2xl shadow-lg">
          🔤
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white">Generator Word Search Puzzle</h3>
          <p className="text-slate-400">Buat puzzle mencari kata untuk pembelajaran (maks. 40 kata)</p>
        </div>
      </div>
      
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Judul Puzzle</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-600 rounded-xl p-3 text-white focus:border-green-500 transition-all" 
              placeholder="Contoh: Mencari Kata Sains"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Daftar Kata (satu kata per baris, maks 40)</label>
            <textarea 
              value={wordsText}
              onChange={(e) => setWordsText(e.target.value)}
              rows={6} 
              className="w-full bg-slate-800/50 border border-slate-600 rounded-xl p-4 text-white focus:border-green-500 transition-all" 
              placeholder="MATAHARI&#10;BULAN&#10;BINTANG&#10;PLANET&#10;..."
            />
            <p className="text-xs text-slate-500 mt-1">Jumlah kata: <span>{Math.min(wordCount, 40)}</span>/40</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Ukuran Grid</label>
              <select 
                value={gridSize}
                onChange={(e) => setGridSize(parseInt(e.target.value))}
                className="w-full bg-slate-800/50 border border-slate-600 rounded-xl p-3 text-white"
              >
                <option value="15">15 x 15</option>
                <option value="18">18 x 18</option>
                <option value="20">20 x 20</option>
                <option value="25">25 x 25</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Tingkat Kesulitan</label>
              <select 
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-600 rounded-xl p-3 text-white"
              >
                <option value="easy">Mudah (H/V)</option>
                <option value="medium">Sedang (+Diagonal)</option>
                <option value="hard">Sulit (+Terbalik)</option>
              </select>
            </div>
          </div>
          
          {error && <p className="text-red-400 text-sm">{error}</p>}
          
          <button 
            onClick={generatePuzzle} 
            className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 font-bold text-lg text-white hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-green-500/25 btn-generate-animated"
          >
            <span>🧩</span> Generate Puzzle
          </button>
          
          <div className="flex gap-2">
            <button 
              onClick={printPuzzle} 
              className="flex-1 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium transition-all flex items-center justify-center gap-2"
            >
              <span>🖨️</span> Print / Download PDF
            </button>
          </div>
        </div>
        
        <div className="gen-card bg-slate-800/30 rounded-xl p-4 min-h-[400px] overflow-auto flex flex-col items-center">
          {puzzleData ? (
            <>
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-white">{puzzleData.title}</h3>
                <p className="text-sm text-slate-400">Temukan {puzzleData.words.length} kata tersembunyi!</p>
              </div>
              <div 
                className="grid gap-[2px] font-mono mx-auto" 
                style={{ gridTemplateColumns: `repeat(${puzzleData.gridSize}, ${puzzleData.gridSize > 20 ? 24 : 28}px)` }}
              >
                {puzzleData.grid.map((row, i) => 
                  row.map((cell, j) => (
                    <div 
                      key={`${i}-${j}`} 
                      className="gen-card flex items-center justify-center font-bold bg-slate-800 text-white rounded-[4px] transition-all hover:bg-blue-500 hover:scale-110 cursor-default"
                      style={{ 
                        width: puzzleData.gridSize > 20 ? 24 : 28, 
                        height: puzzleData.gridSize > 20 ? 24 : 28, 
                        fontSize: puzzleData.gridSize > 24 ? 12 : 14 
                      }}
                    >
                      {cell}
                    </div>
                  ))
                )}
              </div>
              <div className="gen-card mt-6 w-full p-4 bg-slate-800/50 rounded-lg">
                <h4 className="font-semibold text-sm mb-3 text-white">Kata yang dicari:</h4>
                <div className="flex flex-wrap gap-2">
                  {puzzleData.words.map((w, i) => (
                    <span key={i} className="px-3 py-1 bg-slate-700 text-white rounded-md text-xs font-medium border border-slate-600">{w}</span>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center text-slate-500 py-16 h-full flex flex-col items-center justify-center">
              <div className="text-6xl mb-4 opacity-50">🔤</div>
              <p>Puzzle akan muncul di sini</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
