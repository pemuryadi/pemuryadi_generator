import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import Markdown from 'react-markdown';
import Logo from './Logo';

interface Message {
  role: 'user' | 'model';
  text: string;
}

export default function Chatbot({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Halo! 👋 Saya **Pemuryadi Bot**, saya siap membantu Anda dengan pertanyaan seputar pendidikan dan Kurikulum Merdeka.\n\nApa yang bisa saya bantu?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (text: string = input) => {
    if (!text.trim()) return;

    const userMessage = text.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('API Key tidak ditemukan');
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: 'Anda adalah Pemuryadi Bot, asisten AI yang ahli dalam bidang pendidikan di Indonesia, khususnya Kurikulum Merdeka, Modul Ajar, Capaian Pembelajaran, Profil Pelajar Pancasila, dan administrasi guru. Berikan jawaban yang ramah, informatif, dan terstruktur dengan baik menggunakan Markdown.',
        }
      });
      
      const response = await chat.sendMessage({ message: userMessage });
      
      setMessages(prev => [...prev, { role: 'model', text: response.text || 'Maaf, saya tidak dapat merespons saat ini.' }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'model', text: 'Maaf, terjadi kesalahan saat menghubungi server AI. Pastikan API Key sudah dikonfigurasi dengan benar.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="gen-card relative w-full max-w-md h-[600px] max-h-[80vh] bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
        
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-4 flex items-center justify-between shadow-md z-10">
          <div className="flex items-center gap-3">
            <Logo className="w-10 h-10 rounded-full" />
            <div>
              <h3 className="font-bold text-white">Pemuryadi Bot</h3>
              <p className="text-xs text-blue-100">Powered by Gemini AI</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors">
            ✕
          </button>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-900/50">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 rounded-2xl ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-sm' 
                  : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-sm'
              }`}>
                <div className="prose prose-sm prose-invert max-w-none">
                  <Markdown>{msg.text}</Markdown>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="gen-card bg-slate-800 text-slate-300 p-3 rounded-2xl rounded-tl-sm flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm">Sedang mengetik...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="p-4 border-t border-slate-800 bg-slate-900">
          <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-hide">
            {['Kurikulum Merdeka', 'Modul Ajar', 'Capaian Pembelajaran'].map(topic => (
              <button 
                key={topic}
                onClick={() => handleSend(`Apa itu ${topic}?`)}
                className="whitespace-nowrap px-3 py-1.5 text-xs rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              >
                {topic}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none" 
              placeholder="Tanya seputar pendidikan..." 
            />
            <button 
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-all shadow-md"
            >
              Kirim
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
