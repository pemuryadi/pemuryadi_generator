import React from 'react';
import { Shield, Check, Star, Zap, Crown, Award } from 'lucide-react';
import { useAuth } from '../AuthContext';

export default function Pricing() {
  const { user, profile } = useAuth();
  
  const currentTier = profile?.tier || profile?.role || (user ? 'Free' : null);

  const plans = [
    {
      name: 'Free',
      description: 'Layanan dasar untuk eksplorasi',
      price: 'Rp 0',
      period: '/ bulan',
      tokens: 2,
      tokenDesc: 'x generate / hari',
      features: [
        'Ada Watermark (WM)',
        'Reset otomatis setiap hari',
        'Akses fitur dasar'
      ],
      icon: <Shield size={24} className="text-slate-400" />,
      color: 'slate',
      buttonText: 'Paket Saat Ini'
    },
    {
      name: 'Essential',
      description: 'Cukup untuk kebutuhan ngajar bulanan',
      price: 'Rp 170.000',
      period: '',
      tokens: 85,
      tokenDesc: 'x generate total',
      features: [
        'Tanpa Watermark (WM)',
        'Tanpa expired',
        'Prioritas generate dasar',
        'Akses fitur RPP & Modul'
      ],
      icon: <Star size={24} className="text-amber-400" />,
      color: 'amber',
      buttonText: 'Pilih Essential'
    },
    {
      name: 'Premium',
      description: 'Cocok untuk penyusunan materi padat',
      price: 'Rp 408.000',
      period: '',
      tokens: 250,
      tokenDesc: 'x generate total',
      features: [
        'Tanpa Watermark (WM)',
        'Tanpa expired',
        'Kecepatan AI Premium',
        'Akses semua modul premium',
        'Dukungan customer service'
      ],
      icon: <Zap size={24} className="text-cyber-green" />,
      color: 'emerald',
      buttonText: 'Sangat Direkomendasikan',
      popular: true
    },
    {
      name: 'Ultimate',
      description: 'Paket super untuk sekolah / pengawas',
      price: 'Rp 816.000',
      period: '',
      tokens: 600,
      tokenDesc: 'x generate total',
      features: [
        'Tanpa Watermark (WM)',
        'Akses prioritas tertinggi',
        'Sistem manajemen lanjutan',
        'Termasuk pembuatan soal adaptif',
        'Layanan 24/7'
      ],
      icon: <Crown size={24} className="text-cyber-blue" />,
      color: 'blue',
      buttonText: 'Pilih Ultimate'
    },
    {
      name: 'SUPREME',
      description: 'Tak terbatas dengan segala kemampuan full power.',
      price: 'Rp 1.000.000',
      period: '',
      tokens: 1000,
      tokenDesc: 'x generate total',
      features: [
        'Tanpa Watermark (WM)',
        'Teknologi AI Terbaru 2026',
        'Generate Kilat Tanpa Antre',
        'Dukungan Integrasi Eksklusif',
        'Spesial badge SUPREME'
      ],
      icon: <Award size={24} className="text-yellow-300" />,
      color: 'supreme',
      buttonText: 'Beli SUPREME'
    },
    {
      name: 'Titan',
      description: 'Paket Ultimate Terkuat untuk Instansi Skala Besar',
      price: 'Rp 2.000.000',
      period: '',
      tokens: 'Unlimited',
      tokenDesc: 'Akses tanpa batas',
      features: [
        'Tanpa Watermark (WM)',
        'Server Eksklusif Dedicated',
        'Whitelist semua fitur VIP',
        'Custom Fitur Sistem',
        'Dukungan VIP 24/7'
      ],
      icon: <Crown size={24} className="text-rose-500" />,
      color: 'rose',
      buttonText: 'Beli Titan'
    }
  ];

  const handleUpgrade = (planName: string) => {
    const phoneNumber = "628xxxxxxxxxx"; // This should be configured
    const message = encodeURIComponent(`Halo Admin Pemuryadi, saya tertarik untuk upgrade akun saya (${profile?.email || ''}) ke paket ${planName}. Bagaimana instruksi pembayarannya?`);
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  return (
    <div className="p-6 md:p-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tighter">
          Tingkatkan <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyber-blue to-cyber-purple">Performa Mengajar</span> Anda
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Pilih paket yang sesuai dengan kebutuhan mengajar dan persiapkan materi jauh lebih cepat dengan kekuatan penuh Pemuryadi.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {plans.map((plan, i) => {
          const isSupreme = plan.name === 'SUPREME';
          const isCurrent = currentTier?.toLowerCase() === plan.name.toLowerCase() || (plan.name === 'Free' && !currentTier);
          const isTitan = plan.name === 'Titan';
          
          return (
            <div 
              key={i} 
              className={`relative gen-card rounded-2xl overflow-hidden shadow-2xl flex flex-col transition-all duration-300 hover:-translate-y-2 ${
                plan.popular ? 'border-2 border-cyber-green scale-105 z-10' : 
                isSupreme ? 'border-2 border-transparent bg-gradient-to-b from-purple-600/30 to-amber-500/20' : 
                isTitan ? 'border-2 border-rose-500/50 bg-gradient-to-b from-rose-900/40 to-slate-900/80 shadow-[0_0_20px_rgba(244,63,94,0.3)]' :
                'border border-slate-800 bg-slate-900'
              }`}
            >
              {isSupreme && (
                <div className="absolute inset-0 bg-gradient-to-dr from-violet-600/20 via-transparent to-amber-400/20 z-0"></div>
              )}
              {isTitan && (
                <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 via-transparent to-red-500/10 z-0 pointer-events-none"></div>
              )}
              {plan.popular && (
                <div className="bg-cyber-green text-black text-xs font-bold uppercase tracking-widest text-center py-1 absolute top-0 w-full z-20">
                  Best Offer
                </div>
              )}

              <div className={`p-6 z-10 ${plan.popular ? 'pt-8' : ''}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-xl ${
                    isTitan ? 'bg-gradient-to-br from-rose-500 to-red-600' :
                    isSupreme ? 'bg-gradient-to-br from-violet-600 to-amber-400' :
                    plan.name === 'Premium' ? 'bg-emerald-500/20' :
                    plan.name === 'Ultimate' ? 'bg-blue-500/20' :
                    plan.name === 'Essential' ? 'bg-amber-500/20' :
                    'bg-slate-800'
                  }`}>
                    {plan.icon}
                  </div>
                  <h3 className={`text-xl font-bold uppercase tracking-widest ${
                    isTitan ? 'text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-red-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]' :
                    isSupreme ? 'text-transparent bg-clip-text bg-gradient-to-r from-[#8A2BE2] to-[#FFD700] drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]' :
                    plan.name === 'Premium' ? 'text-cyber-green' :
                    plan.name === 'Ultimate' ? 'text-red-400' :
                    plan.name === 'Essential' ? 'text-amber-400' :
                    'text-white'
                  }`}>
                    {plan.name}
                  </h3>
                </div>
                
                <p className="text-xs text-slate-400 mb-6 h-8">{plan.description}</p>
                
                <div className="mb-6 pb-6 border-b border-white/10">
                  <span className="text-3xl font-bold tracking-tighter text-white">{plan.price}</span>
                  <span className="text-slate-400 text-sm">{plan.period}</span>
                </div>

                <div className="mb-6">
                  <div className="flex items-end gap-2 mb-1">
                    <span className={`text-4xl font-bold ${isTitan ? 'text-rose-400' : isSupreme ? 'text-amber-400' : 'text-white'}`}>{plan.tokens}</span>
                    <span className="text-xs text-slate-400 pb-1">{plan.tokenDesc}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-slate-300">
                      <Check size={16} className={`mt-0.5 shrink-0 ${
                        isTitan ? 'text-rose-400' :
                        isSupreme ? 'text-amber-400' :
                        plan.name === 'Premium' ? 'text-cyber-green' :
                        'text-cyber-blue'
                      }`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="mt-auto">
                  <button 
                    onClick={() => handleUpgrade(plan.name)}
                    disabled={isCurrent && plan.name === 'Free'}
                    className={`w-full py-3 rounded-xl font-bold uppercase tracking-widest transition-all ${
                      isCurrent && plan.name === 'Free' ? 'bg-slate-800 text-slate-500 cursor-not-allowed' :
                      isTitan ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white hover:shadow-[0_0_20px_rgba(225,29,72,0.5)] shadow-lg hover:scale-105' :
                      isSupreme ? 'bg-gradient-to-r from-violet-600 to-amber-500 text-white hover:shadow-[0_0_20px_rgba(138,43,226,0.5)] shadow-lg hover:scale-105' :
                      plan.popular ? 'bg-cyber-green text-black hover:bg-cyber-green/90 shadow-lg shadow-cyber-green/20' :
                      plan.name === 'Ultimate' ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30' :
                      plan.name === 'Essential' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50 hover:bg-amber-500/30' :
                      'bg-slate-800 text-white hover:bg-slate-700'
                    }`}
                  >
                    {isCurrent ? (plan.name === 'Free' ? 'Paket Saat Ini' : 'Beli Lagi') : plan.buttonText}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-12 text-center max-w-2xl mx-auto p-6 bg-slate-900 border border-slate-800 rounded-2xl">
        <h4 className="text-white font-bold mb-2 flex justify-center items-center gap-2"><Shield size={18} className="text-cyber-blue"/> Bagaimana sistem Tokens bekerja?</h4>
        <p className="text-sm text-slate-400">
          Satu token setara dengan satu kali tekan tombol Generate. Pembuatan soal, perangkat ajar, atau kegiatan di tab apa pun akan memakan 1 Token. Jika token habis, Anda bisa membeli paket token secara terpisah kapan pun.
        </p>
      </div>
    </div>
  );
}
