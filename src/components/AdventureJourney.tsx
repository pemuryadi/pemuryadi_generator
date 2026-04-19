import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, MapPin, Info, Coins, Landmark, Compass, ChevronRight, Map as MapIcon, Sparkles, X, Brain, Target, MessageCircle, Loader2, Users } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface Pin {
  name: string;
  characteristic: string;
  x: number; // percentage
  y: number; // percentage
  details?: {
    adatBudaya?: string;
    senjataTradisional?: string;
    makananKhas?: string;
    pakaian?: string;
    bahasa?: string;
    kearifanLokal?: string;
  };
}

interface CountryData {
  currency: string;
  characteristic: string;
  flag: string;
  pins: Pin[];
  islands?: Pin[]; // Special for Indonesia
  deepInfo?: string;
}

const WORLD_DATA: Record<string, Record<string, CountryData>> = {
  'Asia': {
    'Indonesia': {
      currency: 'Rupiah (IDR)',
      characteristic: 'Negara Kepulauan Terbesar di Dunia dengan kekayaan budaya dan alam yang luar biasa.',
      flag: '🇮🇩',
      pins: [],
      islands: [
        { 
          name: 'Sumatera', 
          characteristic: 'Gajah Sumatera, Danau Toba, dan Rendang.', 
          x: 15, y: 35,
          details: {
            adatBudaya: 'Budaya Melayu, Minangkabau (Matrilineal), Batak.',
            senjataTradisional: 'Rencong (Aceh), Keris (Melayu), Pedang Jenawi.',
            makananKhas: 'Rendang, Pempek, Mie Aceh, Arsik.',
            pakaian: 'Ulos, Aesan Gede, Baju Kurung.',
            bahasa: 'Bahasa Melayu, Batak, Minang, Lampung.',
            kearifanLokal: 'Sistem irigasi tradisional, hukum adat yang kuat.'
          }
        },
        { 
          name: 'Jawa', 
          characteristic: 'Candi Borobudur, Gunung Bromo, dan pusat pemerintahan.', 
          x: 30, y: 75,
          details: {
            adatBudaya: 'Budaya Jawa, Sunda, Madura. Wayang Kulit, Gamelan.',
            senjataTradisional: 'Keris, Kujang (Sunda), Clurit (Madura).',
            makananKhas: 'Gudeg, Sate, Bakso, Nasi Liwet.',
            pakaian: 'Kebaya, Beskap, Batik.',
            bahasa: 'Bahasa Jawa, Sunda, Madura.',
            kearifanLokal: 'Gotong royong, tata krama (unggah-ungguh).'
          }
        },
        { 
          name: 'Kalimantan', 
          characteristic: 'Orangutan, Hutan Hujan Tropis, dan Ibu Kota Nusantara.', 
          x: 45, y: 30,
          details: {
            adatBudaya: 'Budaya Dayak, Banjar. Upacara Tiwah, Tari Enggang.',
            senjataTradisional: 'Mandau, Sumpit.',
            makananKhas: 'Soto Banjar, Ketupat Kandangan.',
            pakaian: 'King Baba, King Bibinge.',
            bahasa: 'Bahasa Dayak, Banjar, Kutai.',
            kearifanLokal: 'Hutan larangan, rumah betang.'
          }
        },
        { 
          name: 'Sulawesi', 
          characteristic: 'Taman Nasional Wakatobi dan bentuk pulau yang unik.', 
          x: 65, y: 45,
          details: {
            adatBudaya: 'Budaya Bugis, Makassar, Toraja. Rambu Solo.',
            senjataTradisional: 'Badik.',
            makananKhas: 'Coto Makassar, Konro, Kapurung.',
            pakaian: 'Baju Bodo.',
            bahasa: 'Bahasa Bugis, Makassar, Toraja, Manado.',
            kearifanLokal: 'Filosofi Siri\' na Paccé, pelaut ulung.'
          }
        },
        { 
          name: 'Papua', 
          characteristic: 'Raja Ampat, Burung Cendrawasih, dan Puncak Jaya.', 
          x: 85, y: 65,
          details: {
            adatBudaya: 'Budaya Asmat, Dani. Bakar Batu.',
            senjataTradisional: 'Busur dan Panah, Belati Tulang Kasuari.',
            makananKhas: 'Papeda, Ikan Kuah Kuning.',
            pakaian: 'Koteka, Sali.',
            bahasa: 'Bahasa Dani, Asmat, Biak.',
            kearifanLokal: 'Penghormatan terhadap alam (Hutan adalah Ibu).'
          }
        },
        { 
          name: 'Bali & Nusa Tenggara', 
          characteristic: 'Pulau Dewata, Komodo, dan pantai eksotis.', 
          x: 50, y: 85,
          details: {
            adatBudaya: 'Budaya Bali (Hindu), Sasak, Sumba. Ngaben, Nyepi.',
            senjataTradisional: 'Keris Bali, Tulup.',
            makananKhas: 'Ayam Betutu, Babi Guling, Plecing Kangkung.',
            pakaian: 'Payas Agung, Kain Tenun Ikat.',
            bahasa: 'Bahasa Bali, Sasak, Sumbawa.',
            kearifanLokal: 'Subak (Sistem irigasi Bali), Tri Hita Karana.'
          }
        }
      ]
    },
    'Jepang': {
      currency: 'Yen (JPY)',
      characteristic: 'Negara Matahari Terbit yang memadukan tradisi kuno dengan teknologi masa depan.',
      flag: '🇯🇵',
      pins: [
        { name: 'Tokyo', characteristic: 'Metropolitan terbesar dan pusat teknologi.', x: 75, y: 45 },
        { name: 'Kyoto', characteristic: 'Pusat budaya dengan ribuan kuil bersejarah.', x: 55, y: 65 },
        { name: 'Gunung Fuji', characteristic: 'Ikon nasional dan gunung tertinggi di Jepang.', x: 65, y: 55 }
      ]
    },
    'Arab Saudi': {
      currency: 'Riyal (SAR)',
      characteristic: 'Negara di Semenanjung Arab, pusat agama Islam dengan Ka\'bah di Mekkah.',
      flag: '🇸🇦',
      pins: [
        { name: 'Mekkah', characteristic: 'Kota suci umat Islam dan lokasi Ka\'bah.', x: 30, y: 60 },
        { name: 'Madinah', characteristic: 'Kota suci kedua dan lokasi Masjid Nabawi.', x: 25, y: 45 },
        { name: 'Riyadh', characteristic: 'Ibu kota dan pusat ekonomi modern.', x: 60, y: 50 }
      ]
    },
    'Tiongkok': {
      currency: 'Yuan (CNY)',
      characteristic: 'Negara dengan populasi terbesar kedua dan sejarah peradaban yang sangat tua.',
      flag: '🇨🇳',
      pins: [
        { name: 'Tembok Besar', characteristic: 'Struktur pertahanan kuno terpanjang di dunia.', x: 60, y: 30 },
        { name: 'Beijing', characteristic: 'Ibu kota dan lokasi Kota Terlarang.', x: 65, y: 25 },
        { name: 'Shanghai', characteristic: 'Pusat keuangan dan kota pelabuhan modern.', x: 80, y: 50 }
      ]
    },
    'India': {
      currency: 'Rupee (INR)',
      characteristic: 'Negara dengan keragaman budaya, bahasa, dan ikon arsitektur Taj Mahal.',
      flag: '🇮🇳',
      pins: [
        { name: 'Taj Mahal', characteristic: 'Monumen cinta yang merupakan Situs Warisan Dunia UNESCO.', x: 40, y: 40 },
        { name: 'New Delhi', characteristic: 'Ibu kota negara dengan sejarah yang kaya.', x: 35, y: 30 },
        { name: 'Mumbai', characteristic: 'Pusat industri film Bollywood.', x: 25, y: 60 }
      ]
    },
    'Korea Selatan': {
      currency: 'Won (KRW)',
      characteristic: 'Negara dengan perpaduan budaya tradisional dan modernitas K-Pop.',
      flag: '🇰🇷',
      pins: [
        { name: 'Seoul', characteristic: 'Ibu kota metropolitan dengan Istana Gyeongbokgung.', x: 60, y: 40 },
        { name: 'Pulau Jeju', characteristic: 'Pulau vulkanik dengan keindahan alam yang eksotis.', x: 55, y: 85 }
      ]
    },
    'Thailand': {
      currency: 'Baht (THB)',
      characteristic: 'Negara Gajah Putih yang terkenal dengan kuil emas dan pantai tropis.',
      flag: '🇹🇭',
      pins: [
        { name: 'Bangkok', characteristic: 'Kota dengan kuil-kuil megah dan pasar terapung.', x: 45, y: 60 },
        { name: 'Phuket', characteristic: 'Destinasi wisata pantai kelas dunia.', x: 35, y: 85 }
      ]
    }
  },
  'Eropa': {
    'Prancis': {
      currency: 'Euro (EUR)',
      characteristic: 'Negara mode, seni, dan kuliner yang terkenal dengan Menara Eiffel.',
      flag: '🇫🇷',
      pins: [
        { name: 'Paris', characteristic: 'Kota Cahaya dan lokasi Menara Eiffel.', x: 45, y: 35 },
        { name: 'Lyon', characteristic: 'Pusat kuliner dunia.', x: 55, y: 60 },
        { name: 'Riviera', characteristic: 'Pantai mewah di selatan Prancis.', x: 70, y: 85 }
      ]
    },
    'Inggris': {
      currency: 'Pound Sterling (GBP)',
      characteristic: 'Negara kerajaan dengan sejarah panjang dan pengaruh global.',
      flag: '🇬🇧',
      pins: [
        { name: 'London', characteristic: 'Big Ben, London Eye, dan Istana Buckingham.', x: 60, y: 70 },
        { name: 'Stonehenge', characteristic: 'Situs prasejarah misterius.', x: 40, y: 75 }
      ]
    },
    'Italia': {
      currency: 'Euro (EUR)',
      characteristic: 'Negara dengan warisan Romawi, seni Renaisans, dan pizza.',
      flag: '🇮🇹',
      pins: [
        { name: 'Roma', characteristic: 'Koloseum dan pusat peradaban Romawi.', x: 50, y: 60 },
        { name: 'Venesia', characteristic: 'Kota kanal yang romantis.', x: 55, y: 30 },
        { name: 'Menara Pisa', characteristic: 'Menara miring yang ikonik.', x: 40, y: 45 }
      ]
    },
    'Jerman': {
      currency: 'Euro (EUR)',
      characteristic: 'Negara dengan sejarah kuat, teknologi otomotif, dan kastil megah.',
      flag: '🇩🇪',
      pins: [
        { name: 'Berlin', characteristic: 'Ibu kota dengan Gerbang Brandenburg.', x: 65, y: 35 },
        { name: 'Kastil Neuschwanstein', characteristic: 'Kastil dongeng yang menginspirasi Disney.', x: 55, y: 80 }
      ]
    },
    'Spanyol': {
      currency: 'Euro (EUR)',
      characteristic: 'Negara dengan budaya flamenco, arsitektur Gaudi, dan sepak bola.',
      flag: '🇪🇸',
      pins: [
        { name: 'Madrid', characteristic: 'Ibu kota dengan istana kerajaan yang megah.', x: 40, y: 50 },
        { name: 'Barcelona', characteristic: 'Kota dengan mahakarya Sagrada Familia.', x: 75, y: 45 }
      ]
    }
  },
  'Amerika': {
    'Amerika Serikat': {
      currency: 'US Dollar (USD)',
      characteristic: 'Negara adidaya dengan keragaman lanskap dari kota besar hingga taman nasional.',
      flag: '🇺🇸',
      pins: [
        { name: 'New York', characteristic: 'Patung Liberty dan pusat keuangan dunia.', x: 85, y: 35 },
        { name: 'Grand Canyon', characteristic: 'Keajaiban alam geologi yang luar biasa.', x: 25, y: 55 },
        { name: 'Hollywood', characteristic: 'Pusat industri film dunia.', x: 10, y: 60 }
      ]
    },
    'Brasil': {
      currency: 'Real (BRL)',
      characteristic: 'Negara terbesar di Amerika Latin, terkenal dengan Amazon dan Karnaval.',
      flag: '🇧🇷',
      pins: [
        { name: 'Rio de Janeiro', characteristic: 'Patung Kristus Penebus dan Pantai Copacabana.', x: 75, y: 75 },
        { name: 'Hutan Amazon', characteristic: 'Paru-paru dunia dengan biodiversitas tinggi.', x: 40, y: 30 }
      ]
    },
    'Kanada': {
      currency: 'Canadian Dollar (CAD)',
      characteristic: 'Negara terbesar kedua di dunia, terkenal dengan keindahan alam dan sirup maple.',
      flag: '🇨🇦',
      pins: [
        { name: 'Air Terjun Niagara', characteristic: 'Air terjun spektakuler di perbatasan AS.', x: 75, y: 80 },
        { name: 'Toronto', characteristic: 'Kota terbesar dengan CN Tower.', x: 70, y: 75 }
      ]
    },
    'Meksiko': {
      currency: 'Peso Meksiko (MXN)',
      characteristic: 'Negara dengan warisan suku Maya dan Aztec serta kuliner pedas.',
      flag: '🇲🇽',
      pins: [
        { name: 'Chichen Itza', characteristic: 'Piramida kuno suku Maya.', x: 70, y: 50 },
        { name: 'Mexico City', characteristic: 'Ibu kota yang dibangun di atas kota kuno Aztec.', x: 45, y: 70 }
      ]
    }
  },
  'Afrika': {
    'Mesir': {
      currency: 'Pound Mesir (EGP)',
      characteristic: 'Negara piramida dan peradaban kuno di sepanjang Sungai Nil.',
      flag: '🇪🇬',
      pins: [
        { name: 'Kairo', characteristic: 'Ibu kota dan lokasi Piramida Giza.', x: 60, y: 30 },
        { name: 'Luxor', characteristic: 'Museum terbuka terbesar di dunia.', x: 65, y: 60 }
      ]
    },
    'Afrika Selatan': {
      currency: 'Rand (ZAR)',
      characteristic: 'Negara dengan keragaman hayati luar biasa dan sejarah perjuangan Nelson Mandela.',
      flag: '🇿🇦',
      pins: [
        { name: 'Cape Town', characteristic: 'Table Mountain dan pemandangan pesisir yang indah.', x: 30, y: 85 },
        { name: 'Taman Nasional Kruger', characteristic: 'Salah satu cagar alam terbesar di Afrika.', x: 70, y: 40 }
      ]
    },
    'Maroko': {
      currency: 'Dirham Maroko (MAD)',
      characteristic: 'Negara di Afrika Utara dengan perpaduan budaya Arab, Berber, dan Eropa.',
      flag: '🇲🇦',
      pins: [
        { name: 'Marrakesh', characteristic: 'Kota merah dengan pasar tradisional (souk) yang ramai.', x: 40, y: 60 },
        { name: 'Casablanca', characteristic: 'Kota pelabuhan modern dan pusat ekonomi.', x: 35, y: 35 }
      ]
    },
    'Nigeria': {
      currency: 'Naira (NGN)',
      characteristic: 'Negara dengan ekonomi terbesar di Afrika dan industri film Nollywood.',
      flag: '🇳🇬',
      pins: [
        { name: 'Lagos', characteristic: 'Kota metropolitan terbesar dan pusat hiburan.', x: 30, y: 60 },
        { name: 'Abuja', characteristic: 'Ibu kota negara yang terencana.', x: 50, y: 40 }
      ]
    }
  },
  'Australia': {
    'Australia': {
      currency: 'Australian Dollar (AUD)',
      characteristic: 'Negara benua dengan satwa unik seperti Kanguru dan Koala.',
      flag: '🇦🇺',
      pins: [
        { name: 'Sydney', characteristic: 'Opera House dan Jembatan Harbour.', x: 85, y: 75 },
        { name: 'Great Barrier Reef', characteristic: 'Terumbu karang terbesar di dunia.', x: 80, y: 25 },
        { name: 'Uluru', characteristic: 'Batu raksasa suci di tengah gurun.', x: 45, y: 55 }
      ]
    },
    'Selandia Baru': {
      currency: 'New Zealand Dollar (NZD)',
      characteristic: 'Negara kepulauan dengan pemandangan alam yang menakjubkan, lokasi syuting Lord of the Rings.',
      flag: '🇳🇿',
      pins: [
        { name: 'Auckland', characteristic: 'Kota layar dengan pelabuhan yang indah.', x: 70, y: 30 },
        { name: 'Queenstown', characteristic: 'Pusat petualangan dunia di Pulau Selatan.', x: 30, y: 80 }
      ]
    },
    'Fiji': {
      currency: 'Fijian Dollar (FJD)',
      characteristic: 'Negara kepulauan tropis yang terkenal dengan keramahan penduduknya dan terumbu karang.',
      flag: '🇫🇯',
      pins: [
        { name: 'Suva', characteristic: 'Ibu kota dengan arsitektur kolonial Inggris.', x: 60, y: 50 },
        { name: 'Kepulauan Mamanuca', characteristic: 'Lokasi syuting film Cast Away.', x: 30, y: 40 }
      ]
    }
  }
};

export default function AdventureJourney() {
  const [selectedContinent, setSelectedContinent] = useState<string>('Asia');
  const [selectedCountry, setSelectedCountry] = useState<string>('Indonesia');
  const [activePin, setActivePin] = useState<Pin | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [challenge, setChallenge] = useState<{question: string, answer: string} | null>(null);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const continents = Object.keys(WORLD_DATA);
  const countries = Object.keys(WORLD_DATA[selectedContinent] || {});
  const currentData = WORLD_DATA[selectedContinent]?.[selectedCountry];

  useEffect(() => {
    setImageLoading(true);
  }, [selectedCountry]);

  const generateDeepInfo = async (country: string, region?: string) => {
    setIsGenerating(true);
    setChallenge(null); // Clear old challenge immediately
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('API Key Gemini tidak ditemukan.');
      }

      const ai = new GoogleGenAI({ apiKey });

      const prompt = `Anda adalah ahli geografi dan budaya dunia. Berikan informasi mendalam tentang ${region ? region + ' di ' : ''}${country}. 
      Informasi ini akan digunakan oleh siswa dan guru, jadi pastikan bahasa yang digunakan edukatif dan menarik.
      Fokus pada: Adat Budaya, Senjata Tradisional, Makanan Khas, Pakaian Adat, Bahasa, dan Kearifan Lokal.
      SANGAT PENTING: Pastikan semua informasi, terutama bagian "challenge", benar-benar spesifik untuk ${region || country}. JANGAN memberikan informasi dari daerah lain.
      
      Berikan dalam format JSON murni tanpa markdown:
      {
        "adatBudaya": "...",
        "senjataTradisional": "...",
        "makananKhas": "...",
        "pakaian": "...",
        "bahasa": "...",
        "kearifanLokal": "...",
        "challenge": {
          "question": "Tantangan: Sebutkan satu fakta unik atau ciri khas dari ${region || country} yang jarang diketahui orang, namun sangat penting dalam sejarah atau budayanya?",
          "answer": "..."
        }
      }`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });
      
      const text = response.text || '{}';
      
      // Clean potential markdown code blocks
      const cleanJson = text.replace(/```json|```/gi, '').trim();
      const data = JSON.parse(cleanJson);
      
      if (activePin) {
        setActivePin({
          ...activePin,
          details: {
            adatBudaya: data.adatBudaya,
            senjataTradisional: data.senjataTradisional,
            makananKhas: data.makananKhas,
            pakaian: data.pakaian,
            bahasa: data.bahasa,
            kearifanLokal: data.kearifanLokal
          }
        });
        setChallenge(data.challenge);
      }
    } catch (error) {
      console.error("AI Error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const startChallenge = () => {
    if (activePin && !challenge) {
      generateDeepInfo(selectedCountry, activePin.name);
    }
    setShowChallengeModal(true);
  };

  const handleContinentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const continent = e.target.value;
    setSelectedContinent(continent);
    const firstCountry = Object.keys(WORLD_DATA[continent])[0];
    setSelectedCountry(firstCountry);
    setActivePin(null);
    setChallenge(null);
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCountry(e.target.value);
    setActivePin(null);
    setChallenge(null);
  };

  const pinsToDisplay = useMemo(() => {
    if (!currentData) return [];
    return currentData.islands || currentData.pins || [];
  }, [currentData]);

  const getPollinationsUrl = (country: string) => {
    const p = `A hyper-realistic 3D travel guide infographic poster for ${country}. The country shape is rendered as a raised, textured terrain map floating on a clean light gray surface. Iconic landmarks are placed as miniature 3D sculpted models at their correct geographic locations across the map — each one highly detailed and photorealistic. Roads or railway lines connect key cities as white paths across the terrain. Around the map, floating 3D decorative props related to travel are scattered: a vintage leather suitcase with travel stickers, a compass rose, crystal heart charms, and a postage stamp seal reading "Travel to ${country}." The national flag of ${country} is shown as a small realistic folded flag in the upper right corner. Each major city has a bold black label on the map, and beside the map, each city has a neat checklist of its top attractions in clean sans-serif typography. A large bold title at the top reads: "TRAVEL GUIDE TO ${country}" in black uppercase typography with the word ${country} in heavy bold. The overall aesthetic is premium editorial travel content — soft studio lighting, photorealistic 3D render, white/light gray background, clean layout.`;
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(p)}?width=1200&height=800&nologo=true&seed=42`;
  };

  return (
    <div className="min-h-[600px] bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col">
      {/* Header Section */}
      <div className="p-6 bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2 italic tracking-tighter">
            <Globe className="text-cyber-blue animate-spin-slow" />
            ADVENTURE JOURNEY <span className="text-cyber-purple">3D DIORAMA</span>
          </h2>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Jelajahi keunikan negara-negara di dunia</p>
        </div>

        <div className="flex gap-3">
          <div className="relative">
            <label className="absolute -top-2 left-3 bg-slate-900 px-1 text-[8px] font-bold text-cyber-blue uppercase tracking-tighter z-10">Benua</label>
            <select 
              value={selectedContinent}
              onChange={handleContinentChange}
              className="bg-slate-900 border border-cyber-blue/30 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-cyber-blue transition-all appearance-none pr-10 min-w-[120px]"
            >
              {continents.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-cyber-blue pointer-events-none" size={14} />
          </div>

          <div className="relative">
            <label className="absolute -top-2 left-3 bg-slate-900 px-1 text-[8px] font-bold text-cyber-purple uppercase tracking-tighter z-10">Negara</label>
            <select 
              value={selectedCountry}
              onChange={handleCountryChange}
              className="bg-slate-900 border border-cyber-purple/30 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-cyber-purple transition-all appearance-none pr-10 min-w-[150px]"
            >
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-cyber-purple pointer-events-none" size={14} />
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row min-h-[800px]">
        {/* Map Stage */}
        <div className="flex-1 relative bg-slate-900/50 p-6 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="w-full h-full cyber-grid"></div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div 
              key={`${selectedContinent}-${selectedCountry}`}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="relative w-full h-full max-w-[1000px] aspect-[16/10] bg-slate-800 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-slate-700 overflow-hidden"
            >
              {/* Map Surface */}
              <div className="absolute inset-0 rounded-2xl overflow-hidden bg-slate-900/80">
                <img 
                  src={getPollinationsUrl(selectedCountry)} 
                  alt={`Diorama of ${selectedCountry}`}
                  className={`w-full h-full object-cover transition-opacity duration-700 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  onLoad={() => setImageLoading(false)}
                />

                {imageLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-10 backdrop-blur-sm">
                    <Loader2 size={48} className="text-cyber-blue animate-spin mb-4" />
                    <p className="text-cyber-blue font-bold tracking-widest text-sm animate-pulse">MEMBUAT DIORAMA 3D...</p>
                    <p className="text-slate-400 text-[10px] mt-2">Proses rendering menggunakan AI sedang berlangsung</p>
                  </div>
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-slate-950/10 pointer-events-none"></div>
                
                <div className="absolute inset-0 flex items-center justify-center opacity-10">
                  <MapIcon size={400} className="text-white" />
                </div>
                
                {/* Country Name Overlay */}
                <div className="absolute top-4 left-6 z-10">
                  <div className="text-4xl font-black text-white/10 italic select-none">{selectedCountry.toUpperCase()}</div>
                </div>

                {/* Pins */}
                {pinsToDisplay.map((pin, idx) => (
                  <motion.button
                    key={pin.name}
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 + idx * 0.1, type: "spring" }}
                    onClick={() => {
                      setActivePin(pin);
                      setChallenge(null); // Reset challenge when selecting a new pin
                    }}
                    className="absolute group z-20"
                    style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                  >
                    <div className="relative flex flex-col items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${activePin?.name === pin.name ? 'bg-cyber-blue scale-125 ring-4 ring-cyber-blue/30' : 'bg-white/10 backdrop-blur-md border border-white/20 hover:bg-cyber-purple hover:scale-110'}`}>
                        <MapPin size={14} className={activePin?.name === pin.name ? 'text-black' : 'text-white'} />
                      </div>
                      {/* 3D Shadow */}
                      <div className="absolute -bottom-1 w-4 h-1 bg-black/40 blur-[2px] rounded-full -z-10"></div>
                      
                      <div className="mt-1 px-2 py-0.5 bg-black/80 backdrop-blur-md rounded text-[8px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/10">
                        {pin.name}
                      </div>
                      {/* 3D Stem */}
                      <div className="w-0.5 h-4 bg-gradient-to-b from-white/40 to-transparent"></div>
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Base Decoration */}
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[110%] h-20 bg-black/40 blur-3xl rounded-full -z-10"></div>
            </motion.div>
          </AnimatePresence>

          {/* Floating Info Card */}
          <AnimatePresence>
            {activePin && (
              <>
                {/* Backdrop for mobile to allow closing by clicking outside */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setActivePin(null)}
                  className="absolute inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
                />
                <motion.div
                  initial={{ opacity: 0, x: 20, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.9 }}
                  className="absolute md:right-6 md:top-1/2 md:-translate-y-1/2 md:w-80 w-[90%] left-1/2 -translate-x-1/2 md:translate-x-0 top-1/2 -translate-y-1/2 bg-slate-900/95 backdrop-blur-2xl border border-cyber-blue/30 rounded-3xl p-6 shadow-[0_0_50px_rgba(0,243,255,0.1)] z-50 max-h-[90%] overflow-y-auto custom-scrollbar"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-cyber-blue/20 flex items-center justify-center">
                        <MapPin size={16} className="text-cyber-blue" />
                      </div>
                      <h4 className="text-lg font-black text-white italic uppercase tracking-tighter">{activePin.name}</h4>
                    </div>
                    <button onClick={() => { setActivePin(null); setShowChallengeModal(false); setChallenge(null); }} className="text-slate-500 hover:text-white p-2 hover:bg-white/10 rounded-full transition-all"><X size={20} /></button>
                  </div>

                <div className="space-y-4">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-2 flex items-center gap-1">
                      <Sparkles size={10} className="text-amber-400" /> Deskripsi Umum
                    </p>
                    <p className="text-sm text-slate-200 leading-relaxed">{activePin.characteristic}</p>
                  </div>

                  {activePin.details && (
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        { label: 'Adat & Budaya', value: activePin.details.adatBudaya, icon: <Users size={12} /> },
                        { label: 'Senjata Tradisional', value: activePin.details.senjataTradisional, icon: <Target size={12} /> },
                        { label: 'Makanan Khas', value: activePin.details.makananKhas, icon: <Coins size={12} /> },
                        { label: 'Pakaian Adat', value: activePin.details.pakaian, icon: <Sparkles size={12} /> },
                        { label: 'Bahasa', value: activePin.details.bahasa, icon: <MessageCircle size={12} /> },
                        { label: 'Kearifan Lokal', value: activePin.details.kearifanLokal, icon: <Brain size={12} /> },
                      ].map((item, i) => item.value && (
                        <div key={i} className="p-3 bg-slate-800/50 rounded-xl border border-white/5">
                          <p className="text-[9px] text-cyber-blue font-bold uppercase mb-1 flex items-center gap-1">
                            {item.icon} {item.label}
                          </p>
                          <p className="text-xs text-slate-300">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {!showChallengeModal ? (
                    <button 
                      onClick={startChallenge}
                      disabled={isGenerating}
                      className="w-full py-3 bg-gradient-to-r from-cyber-blue to-cyber-purple text-black font-black uppercase tracking-widest rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyber-blue/20 hover:scale-[1.02] transition-all"
                    >
                      {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <Target size={16} />}
                      Tantangan Eksplorasi
                    </button>
                  ) : (
                    <div className="p-3 bg-cyber-purple/10 border border-cyber-purple/20 rounded-xl text-center">
                      <p className="text-[10px] text-cyber-purple font-bold uppercase">Tantangan Aktif</p>
                      <p className="text-[9px] text-slate-400">Lihat kartu tantangan di layar</p>
                    </div>
                  )}
                  
                  <button 
                    onClick={() => { setActivePin(null); setShowChallengeModal(false); setChallenge(null); }}
                    className="w-full py-2 text-slate-500 hover:text-slate-300 text-[10px] font-bold uppercase tracking-widest transition-all mt-2"
                  >
                    Tutup Detail
                  </button>
                </div>
              </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Challenge Modal / Card Overlay */}
          <AnimatePresence>
            {showChallengeModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowChallengeModal(false)}
                className="absolute inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-slate-950/90 backdrop-blur-xl"
              >
                <motion.div
                  initial={{ scale: 0.8, rotateY: 20, y: 40 }}
                  animate={{ scale: 1, rotateY: 0, y: 0 }}
                  exit={{ scale: 0.8, rotateY: -20, y: 40 }}
                  transition={{ type: "spring", damping: 15 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-2xl bg-gradient-to-br from-slate-900 to-slate-950 border-4 border-cyber-purple/40 rounded-[2.5rem] p-8 md:p-12 shadow-[0_0_150px_rgba(168,85,247,0.3)] relative overflow-y-auto max-h-[95%] flex flex-col items-center text-center custom-scrollbar"
                >
                  {/* Decorative Elements */}
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-cyber-blue via-cyber-purple to-cyber-blue animate-gradient-x"></div>
                  <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyber-purple/20 blur-[80px] rounded-full"></div>
                  <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyber-blue/20 blur-[80px] rounded-full"></div>
                  
                  <button 
                    onClick={() => setShowChallengeModal(false)}
                    className="absolute top-6 right-6 text-slate-500 hover:text-white hover:bg-white/10 p-2 rounded-full transition-all z-10"
                  >
                    <X size={32} />
                  </button>

                  <div className="space-y-8 w-full">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-cyber-purple/30 to-indigo-600/30 flex items-center justify-center shadow-inner border border-white/10">
                        <Brain size={48} className="text-cyber-purple animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-3xl md:text-4xl font-black text-white italic uppercase tracking-tighter mb-1">KARTU TANTANGAN</h3>
                        <div className="flex items-center justify-center gap-2">
                          <span className="px-3 py-1 bg-cyber-purple/20 rounded-full text-[10px] font-bold text-cyber-purple uppercase tracking-widest border border-cyber-purple/30">
                            {selectedCountry}
                          </span>
                          <span className="text-slate-500">•</span>
                          <span className="text-xs text-slate-400 font-medium">{activePin?.name}</span>
                        </div>
                      </div>
                    </div>

                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-cyber-blue/20 to-cyber-purple/20 rounded-3xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                      <div className="relative w-full p-8 md:p-10 bg-slate-900/80 rounded-3xl border border-white/10 min-h-[180px] flex items-center justify-center">
                        {isGenerating ? (
                          <div className="flex flex-col items-center gap-4">
                            <Loader2 className="animate-spin text-cyber-blue" size={40} />
                            <p className="text-sm text-slate-400 font-medium animate-pulse">Siap menjelajah bersama pemuryadi!</p>
                          </div>
                        ) : (
                          <p className="text-xl md:text-2xl text-white font-bold leading-relaxed italic">
                            "{challenge?.question || "Tantangan tidak tersedia. Silakan coba lagi."}"
                          </p>
                        )}
                      </div>
                    </div>

                    {!isGenerating && challenge && (
                      <div className="w-full space-y-6">
                        <details className="group">
                          <summary className="w-full py-4 bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white font-bold rounded-2xl cursor-pointer transition-all list-none flex items-center justify-center gap-3 border border-white/5">
                            <Info size={20} />
                            <span>LIHAT KUNCI JAWABAN</span>
                            <ChevronRight size={18} className="group-open:rotate-90 transition-transform" />
                          </summary>
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 p-6 bg-cyber-blue/5 border border-cyber-blue/20 rounded-2xl text-base text-slate-300 text-left relative overflow-hidden"
                          >
                            <div className="absolute top-0 left-0 w-1 h-full bg-cyber-blue"></div>
                            <p className="font-black text-cyber-blue mb-3 flex items-center gap-2 uppercase tracking-tighter italic">
                              <Sparkles size={16} /> Jawaban Edukasi:
                            </p>
                            <p className="leading-relaxed">{challenge.answer}</p>
                          </motion.div>
                        </details>

                        <button 
                          onClick={() => setShowChallengeModal(false)}
                          className="w-full py-5 bg-gradient-to-r from-cyber-purple to-indigo-600 text-white font-black text-lg uppercase tracking-[0.2em] rounded-2xl shadow-[0_10px_30px_rgba(168,85,247,0.3)] hover:shadow-cyber-purple/50 hover:scale-[1.02] active:scale-95 transition-all"
                        >
                          Selesaikan Misi
                        </button>

                        <button 
                          onClick={() => setShowChallengeModal(false)}
                          className="text-slate-500 hover:text-slate-300 text-xs font-bold uppercase tracking-widest transition-all"
                        >
                          Kembali ke Peta
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar Info */}
        <div className="w-full lg:w-80 bg-slate-950 border-l border-slate-800 p-6 space-y-6 overflow-y-auto">
          <div className="gen-card p-5 bg-indigo-500/5 rounded-2xl border border-indigo-500/20">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">{currentData?.flag}</span>
              <div>
                <h3 className="text-lg font-black text-white italic tracking-tighter">{selectedCountry}</h3>
                <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">{selectedContinent}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyber-blue/10 flex items-center justify-center shrink-0">
                  <Coins size={16} className="text-cyber-blue" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Mata Uang</p>
                  <p className="text-xs text-white font-medium">{currentData?.currency}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyber-purple/10 flex items-center justify-center shrink-0">
                  <Landmark size={16} className="text-cyber-purple" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Karakteristik Utama</p>
                  <p className="text-xs text-white font-medium leading-relaxed">{currentData?.characteristic}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Compass size={12} /> Titik Eksplorasi ({pinsToDisplay.length})
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {pinsToDisplay.map(pin => (
                <button
                  key={pin.name}
                  onClick={() => {
                    setActivePin(pin);
                    setChallenge(null);
                  }}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left ${activePin?.name === pin.name ? 'bg-cyber-blue/10 border-cyber-blue text-cyber-blue' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'}`}
                >
                  <span className="text-xs font-bold">{pin.name}</span>
                  <ChevronRight size={14} />
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
            <p className="text-[10px] text-amber-500 font-bold uppercase mb-1">💡 Tips Petualang</p>
            <p className="text-[10px] text-slate-400 leading-relaxed italic">
              Klik pada pin di peta atau daftar di atas untuk melihat detail unik dari setiap lokasi di {selectedCountry}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
