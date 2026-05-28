import React, { useState, useRef } from 'react';
import { Upload, FileText, X, Loader2, RefreshCw } from 'lucide-react';
import mammoth from 'mammoth';

interface PDFRemixUploadProps {
  onDataExtracted: (data: { type: 'text' | 'inline', content: string, mimeType?: string } | null) => void;
  label?: string;
}

export default function PDFRemixUpload({ onDataExtracted, label = "Remix dari PDF / Word / Image" }: PDFRemixUploadProps) {
  const [isExtracting, setIsExtracting] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      'application/pdf', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png'
    ];

    if (!allowedTypes.includes(file.type)) {
      setError('Hanya file PDF, Word (DOCX), JPEG, dan PNG yang didukung.');
      return;
    }

    setIsExtracting(true);
    setError(null);
    setFileName(file.name);

    try {
      if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        onDataExtracted({ type: 'text', content: result.value });
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          const base64Data = result.split(',')[1];
          onDataExtracted({
            type: 'inline',
            content: base64Data,
            mimeType: file.type
          });
        };
        reader.onerror = () => {
          throw new Error('Gagal membaca file.');
        };
        reader.readAsDataURL(file);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal membaca file.');
      setFileName(null);
    } finally {
      setIsExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</label>
        {fileName && (
          <button 
            onClick={() => {
              setFileName(null);
              setError(null);
              onDataExtracted(null);
            }}
            className="text-red-400 hover:text-red-300 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>
      
      <div 
        onClick={() => !isExtracting && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-4 transition-all cursor-pointer flex flex-col items-center justify-center gap-2
          ${isExtracting ? 'border-cyber-blue/50 bg-cyber-blue/5' : 'border-slate-700 hover:border-cyber-blue/50 hover:bg-white/5'}
          ${error ? 'border-red-500/50 bg-red-500/5' : ''}
        `}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,.docx,.jpeg,.jpg,.png"
          className="hidden"
        />
        
        {isExtracting ? (
          <>
            <Loader2 className="animate-spin text-cyber-blue" size={24} />
            <span className="text-xs text-cyber-blue font-bold animate-pulse">Menyiapkan Dokumen...</span>
          </>
        ) : fileName ? (
          <>
            <FileText className="text-cyber-green" size={24} />
            <span className="text-xs text-slate-300 font-medium truncate max-w-full px-2">{fileName}</span>
            <span className="text-[10px] text-cyber-green font-bold flex items-center gap-1">
              <RefreshCw size={10} /> Siap untuk di-Remix
            </span>
          </>
        ) : (
          <>
            <Upload className="text-slate-500" size={24} />
            <span className="text-xs text-slate-400 font-medium text-center">Klik untuk Upload Dokumen</span>
            <span className="text-[10px] text-slate-500 text-center">PDF, DOCX, JPEG, PNG (AI akan memaksa baca PDF terproteksi)</span>
          </>
        )}
      </div>
      
      {error && (
        <p className="text-[10px] text-red-400 font-medium">{error}</p>
      )}
    </div>
  );
}
