import React, { useState, useEffect, useRef } from 'react';
import { Heart, ChevronDown, LayoutDashboard, Users, Gamepad2, BookOpen, FileText, MonitorPlay, School, MessageSquare, Menu, X, Bell, Search, Settings, User, Activity, Zap, Globe, Shield, Cpu, Share2, LogIn, LogOut, Coins } from 'lucide-react';
import { FaFacebook, FaInstagram, FaTiktok } from 'react-icons/fa';
import { collection, doc, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db, loginWithGoogle, logout, incrementFavorites, addActivityLog } from './firebase';
import { useAuth } from './AuthContext';
import GroupGenerator from './components/GroupGenerator';
import WordSearch from './components/WordSearch';
import SnakeLadder from './components/SnakeLadder';
import CrosswordGenerator from './components/CrosswordGenerator';
import Supervision from './components/Supervision';
import ModuleGenerator from './components/ModuleGenerator';
import DailyJournal from './components/DailyJournal';
import DeepLearningPlan from './components/DeepLearningPlan';
import Chatbot from './components/Chatbot';
import WorksheetGenerator from './components/WorksheetGenerator';
import FeedbackForm from './components/FeedbackForm';
import ModulKokurikuler from './components/ModulKokurikuler';
import GameIFP from './components/GameIFP';
import AdventureJourney from './components/AdventureJourney';
import KalenderPendidikan from './components/KalenderPendidikan';
import Logo from './components/Logo';
import AnalisisHariEfektif from './components/AnalisisHariEfektif';
import ProgramSemester from './components/ProgramSemester';
import ProgramTahunan from './components/ProgramTahunan';
import MengajarHarian from './components/MengajarHarian';
import KKTP from './components/KKTP';
import BuatSoal from './components/BuatSoal';
import QuickProfile from './components/QuickProfile';
import SNP from './components/SNP';
import RankingSatu from './components/RankingSatu';
import Pricing from './components/Pricing';
import { translations } from './constants';

function Clock() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/:/g, '.');
  const dateString = currentTime.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="flex flex-col items-end font-mono">
      <div className="text-xl font-bold text-cyber-blue tracking-tighter">
        {timeString}
      </div>
      <div className="text-[10px] uppercase tracking-widest text-cyber-purple font-medium">
        {dateString}
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('beranda');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [language, setLanguage] = useState('id');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSocialOpen, setIsSocialOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);
  const [visitors, setVisitors] = useState({ today: 0, month: 0, total: 0 });
  const [favorites, setFavorites] = useState(0);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [osName, setOsName] = useState('Unknown OS');
  const [ramInfo, setRamInfo] = useState('Unknown');
  const [usageTime, setUsageTime] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activityClicks, setActivityClicks] = useState<Record<string, number>>({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [brightness, setBrightness] = useState(100);
  const [gradientsEnabled, setGradientsEnabled] = useState(true);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const notifDropdownRef = useRef<HTMLDivElement>(null);
  const settingsDropdownRef = useRef<HTMLDivElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    const userAgent = window.navigator.userAgent;
    let os = 'Unknown OS';
    if (userAgent.indexOf('Win') !== -1) os = 'Windows';
    if (userAgent.indexOf('Mac') !== -1) os = 'MacOS';
    if (userAgent.indexOf('Linux') !== -1) os = 'Linux';
    if (userAgent.indexOf('Android') !== -1) os = 'Android';
    if (userAgent.indexOf('like Mac') !== -1) os = 'iOS';
    setOsName(os);
    
    const ram = (navigator as any).deviceMemory;
    if (ram) {
      setRamInfo(`${ram} GB`);
    }

    const interval = setInterval(() => {
      setUsageTime(prev => prev + 1);
    }, 1000);

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      clearInterval(interval);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const trackClick = (activityName: string) => {
    setActivityClicks(prev => ({
      ...prev,
      [activityName]: (prev[activityName] || 0) + 1
    }));
  };

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
      addActivityLog('User logged in', 'SUCCESS', 'text-cyber-green');
      incrementFavorites();
    } catch (error) {
      addActivityLog('Login failed', 'ERROR', 'text-red-500');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      addActivityLog('User logged out', 'INFO', 'text-cyber-blue');
    } catch (error) {
      addActivityLog('Logout failed', 'ERROR', 'text-red-500');
    }
  };

  const handleTabChange = (tabId: string) => {
    // Check if the tab is premium only
    let isPremiumTab = false;
    for (const item of menuItems) {
      if (item.id === tabId && item.premiumOnly) isPremiumTab = true;
      if (item.dropdown) {
        for (const sub of item.dropdown) {
          if (sub.id === tabId && (sub.premiumOnly || item.premiumOnly)) isPremiumTab = true;
        }
      }
    }

    if (isPremiumTab) {
      const tier = profile?.tier || profile?.role || 'Free';
      if (tier === 'Free' || tier === 'guest') {
        alert('Fitur ini khusus untuk pengguna berbayar. Silakan upgrade akun Anda ke plan Essential, Premium, atau lainnya.');
        return;
      }
    }

    setActiveTab(tabId);
    trackClick(tabId);
    addActivityLog(`Navigated to ${tabId}`, 'OK', 'text-cyber-purple');
    incrementFavorites();
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setVisitors({
      today: Math.floor(Math.random() * 50) + 10,
      month: Math.floor(Math.random() * 500) + 100,
      total: Math.floor(Math.random() * 5000) + 1000
    });
  }, []);

  useEffect(() => {
    // Listen to system stats (favorites)
    const statsRef = doc(db, 'system', 'stats');
    const unsubscribeStats = onSnapshot(statsRef, (docSnap) => {
      if (docSnap.exists()) {
        setFavorites(docSnap.data().favorites || 0);
      }
    }, (error) => {
      console.error('Firestore Error (Stats):', error);
    });

    // Listen to activity logs
    const logsQuery = query(collection(db, 'activityLogs'), orderBy('timestamp', 'desc'), limit(5));
    const unsubscribeLogs = onSnapshot(logsQuery, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setActivityLogs(logs);
    }, (error) => {
      console.error('Firestore Error (Logs):', error);
    });

    return () => {
      unsubscribeStats();
      unsubscribeLogs();
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (settingsDropdownRef.current && !settingsDropdownRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F12' || e.keyCode === 123) e.preventDefault();
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && ['i', 'j', 'c'].includes(e.key.toLowerCase())) e.preventDefault();
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') e.preventDefault();
    };
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const todayStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  const monthStr = new Date().toLocaleDateString('id-ID', { month: 'long' });

  type MenuItem = {
    id: string;
    icon: React.ReactNode;
    label: string;
    link?: string;
    premiumOnly?: boolean;
    dropdown?: { id: string; icon: React.ReactNode; label: string; link?: string; premiumOnly?: boolean }[];
  };

  const menuItems: MenuItem[] = [
    { id: 'beranda', icon: <LayoutDashboard size={20} />, label: 'Beranda' },
    { id: 'kelompok', icon: <Users size={20} />, label: 'Kelompok' },
    { 
      id: 'games', 
      icon: <Gamepad2 size={20} />, 
      label: 'Games',
      dropdown: [
        { id: 'adventure-journey', icon: '🗺️', label: 'Adventure Journey' },
        { id: 'puzzle', icon: '🧩', label: 'Puzzle Kata' },
        { id: 'snake', icon: '🎲', label: 'Snake & Ladder' },
        { id: 'ranking-satu', icon: '🏆', label: 'Ranking #1' },
        { id: 'crossword', icon: '📝', label: 'Teka Teki Silang' }
      ]
    },
    { 
      id: 'admin', 
      icon: <BookOpen size={20} />, 
      label: 'Administrasi',
      dropdown: [
        { id: 'mengajar-harian', icon: '📝', label: 'Mengajar Harian' },
        { id: 'kalender-pendidikan', icon: '📅', label: 'Kalender Pendidikan' },
        { id: 'analisis-hari-efektif', icon: '🧮', label: 'Analisis Hari Efektif' },
        { id: 'program-tahunan', icon: '📋', label: 'Program Tahunan', premiumOnly: true },
        { id: 'program-semester', icon: '📑', label: 'Program Semester', premiumOnly: true },
        { id: 'deeplearning', icon: '📋', label: 'RPM', premiumOnly: true },
        { id: 'modul', icon: '📘', label: 'Modul Ajar', premiumOnly: true },
        { id: 'jurnal', icon: '📓', label: 'Jurnal' },
        { id: 'supervisi', icon: '🔍', label: 'Supervisi' },
        { id: 'kktp', icon: '🎯', label: 'KKTP' },
        { id: 'modul-kokurikuler', icon: '🏕️', label: 'Modul Kokurikuler', premiumOnly: true },
        { id: 'buat-soal', icon: '📝', label: 'Buat Soal', premiumOnly: true }
      ]
    },
    {
      id: 'snp',
      icon: <FileText size={20} />,
      label: 'SNP',
      dropdown: [
        { id: 'snp-adiwiyata', icon: '🌱', label: 'Adiwiyata' },
        { id: 'snp-sra', icon: '🧒', label: 'Sekolah Ramah Anak' },
        { id: 'snp-ssk', icon: '👨‍👩‍👧‍👦', label: 'Sekolah Siaga Kependudukan' },
        { id: 'snp-rapor', icon: '📊', label: 'Rapor Pendidikan' },
        { id: 'snp-spmi', icon: '📘', label: 'SPMI' },
        { id: 'snp-ksp', icon: '📚', label: 'KSP' }
      ]
    },
    { id: 'worksheet', icon: <FileText size={20} />, label: 'Worksheet' },
    { id: 'game-ifp', icon: <MonitorPlay size={20} />, label: 'Game IFP' },
    { id: 'pricing', icon: <Coins size={20} className="text-amber-400" />, label: 'Langganan' }
  ];

  return (
    <div 
      className={`app-wrapper min-h-screen font-sans text-white cyber-grid overflow-x-hidden ${animationsEnabled ? '' : 'disable-animations'} ${gradientsEnabled ? '' : 'disable-gradients'}`}
      style={{ filter: `brightness(${brightness}%)` }}
    >
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed top-0 left-0 h-full z-50 bg-black/95 backdrop-blur-xl border-r border-cyber-blue/30 transition-all duration-300 ${
        isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0 md:w-20'
      }`}>
        <div className="p-6 flex items-center justify-between border-b border-cyber-blue/20">
          <div className="flex items-center gap-3">
            <Logo className="w-10 h-10" />
            {isSidebarOpen && (
              <div className="animate-in fade-in slide-in-from-left-2">
                <h1 className="text-lg font-bold text-cyber-blue tracking-tighter">PEMURYADI</h1>
                <p className="text-[8px] text-cyber-purple uppercase tracking-widest font-bold">Cyber Education</p>
              </div>
            )}
          </div>
          {isSidebarOpen && (
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100%-100px)] custom-scrollbar">
          {menuItems.map(item => (
            <div key={item.id}>
              <button
                onClick={() => {
                  if (item.dropdown) {
                    setActiveDropdown(activeDropdown === item.id ? null : item.id);
                  } else {
                    handleTabChange(item.id);
                    setActiveDropdown(null);
                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                  }
                }}
                className={`w-full flex items-center gap-4 p-3 rounded-lg transition-all group ${
                  activeTab === item.id || (item.dropdown && item.dropdown.some(d => d.id === activeTab))
                    ? 'bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/50 shadow-[0_0_10px_rgba(0,243,255,0.2)]'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="shrink-0 group-hover:scale-110 transition-transform">{item.icon}</span>
                {isSidebarOpen && <span className="text-sm font-bold tracking-tight uppercase flex items-center gap-2">{item.label} {item.premiumOnly && <span className="text-[8px] bg-cyber-yellow text-black px-1 rounded">PRO</span>}</span>}
                {isSidebarOpen && item.dropdown && <ChevronDown size={14} className={`ml-auto transition-transform ${activeDropdown === item.id ? 'rotate-180' : ''}`} />}
              </button>

              {isSidebarOpen && item.dropdown && activeDropdown === item.id && (
                <div className="mt-2 ml-8 space-y-1 border-l border-cyber-blue/20 pl-4 animate-in fade-in slide-in-from-top-2">
                  {item.dropdown.map(sub => (
                    <button
                      key={sub.id}
                      onClick={() => {
                        handleTabChange(sub.id);
                        if (window.innerWidth < 768) setIsSidebarOpen(false);
                      }}
                      className={`w-full text-left p-2 text-xs font-medium rounded-md transition-all flex items-center justify-between ${
                        activeTab === sub.id ? 'text-cyber-blue bg-cyber-blue/10' : 'text-slate-500 hover:text-cyber-purple'
                      }`}
                    >
                      <span>{sub.label}</span>
                      {sub.premiumOnly && <span className="text-[8px] bg-cyber-yellow text-black px-1 rounded ml-2">PRO</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute top-20 right-[-12px] w-6 h-6 bg-cyber-blue rounded-full hidden md:flex items-center justify-center text-black shadow-lg hover:scale-110 transition-transform z-50"
        >
          {isSidebarOpen ? <X size={14} /> : <Menu size={14} />}
        </button>
      </aside>

      {/* Main Content Area */}
      <main className={`transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-20'} pb-20 min-h-screen flex flex-col w-full md:w-auto`}>
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-black/60 backdrop-blur-md border-b border-cyber-blue/20 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between no-print w-full">
          <div className="flex items-center gap-3 md:hidden">
             <button onClick={() => setIsSidebarOpen(true)} className="text-cyber-blue p-1">
               <Menu size={24} />
             </button>
             <Logo className="w-8 h-8" />
             <h1 className="text-sm font-bold text-cyber-blue">PEMURYADI</h1>
          </div>

          <div className="hidden md:flex items-center gap-4 flex-1 max-w-md mx-4 lg:mx-8 relative" ref={searchDropdownRef}>
            <div className="relative w-full">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search modules, games, documents..." 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchFocused(true);
                }}
                onFocus={() => setIsSearchFocused(true)}
                className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-xs focus:border-cyber-blue outline-none transition-all"
              />
            </div>
            {isSearchFocused && searchQuery && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-cyber-blue/30 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 max-h-64 overflow-y-auto custom-scrollbar">
                {menuItems.flatMap(item => [
                  item,
                  ...(item.dropdown || [])
                ]).filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 ? (
                  menuItems.flatMap(item => [
                    item,
                    ...(item.dropdown || [])
                  ]).filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase())).map(item => (
                    <button
                      key={item.id}
                      onClick={() => {
                        handleTabChange(item.id);
                        setSearchQuery('');
                        setIsSearchFocused(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-white/5 border-b border-white/5 last:border-0 flex items-center gap-3 transition-colors"
                    >
                      <span className="text-cyber-blue">{typeof item.icon === 'string' ? item.icon : <Search size={14} />}</span>
                      <span className="text-sm text-slate-300">{item.label}</span>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-slate-500">No results found</div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-6 ml-auto">
            <div className="hidden sm:block">
              <Clock />
            </div>
            <div className="h-8 w-[1px] bg-white/10 hidden sm:block"></div>
            <div className="flex items-center gap-1 sm:gap-3">
              
              {/* Notifications */}
              <div className="relative" ref={notifDropdownRef}>
                <button 
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className={`p-2 rounded-lg transition-colors relative ${isNotificationsOpen ? 'bg-cyber-purple/20 text-cyber-purple' : 'bg-white/5 text-slate-400 hover:text-cyber-blue'}`}
                >
                  <Bell size={18} />
                  {usageTime > 7200 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>}
                  {usageTime > 7200 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>}
                </button>
                
                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-black/95 backdrop-blur-xl border border-cyber-purple/30 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="p-3 border-b border-cyber-purple/20 bg-cyber-purple/5 flex justify-between items-center">
                      <h3 className="text-xs font-bold text-cyber-purple uppercase tracking-widest">Peringatan Sistem</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto custom-scrollbar p-2">
                      {usageTime > 7200 ? (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                          <h4 className="text-sm font-bold text-red-400 mb-1">Peringatan Kesehatan</h4>
                          <p className="text-xs text-slate-300">Anda telah menggunakan perangkat ini lebih dari 2 jam. Harap istirahatkan mata dan tubuh Anda sejenak untuk menjaga kesehatan.</p>
                        </div>
                      ) : (
                        <div className="p-4 text-center text-xs text-slate-500 italic">Tidak ada peringatan. Waktu penggunaan: {Math.floor(usageTime / 60)} menit.</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Settings */}
              <div className="relative hidden sm:block" ref={settingsDropdownRef}>
                <button 
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  className={`p-2 rounded-lg transition-colors ${isSettingsOpen ? 'bg-cyber-blue/20 text-cyber-blue' : 'bg-white/5 text-slate-400 hover:text-cyber-blue'}`}
                >
                  <Settings size={18} className={isSettingsOpen ? 'animate-spin-slow' : ''} />
                </button>
                
                {isSettingsOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-black/95 backdrop-blur-xl border border-cyber-blue/30 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="p-3 border-b border-cyber-blue/20 bg-cyber-blue/5">
                      <h3 className="text-xs font-bold text-cyber-blue uppercase tracking-widest">System Settings</h3>
                    </div>
                    <div className="p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-300 font-medium">UI Animations</span>
                        <button 
                          onClick={() => setAnimationsEnabled(!animationsEnabled)}
                          className={`w-10 h-5 rounded-full transition-colors relative ${animationsEnabled ? 'bg-cyber-blue' : 'bg-slate-700'}`}
                        >
                          <span className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${animationsEnabled ? 'left-6' : 'left-1'}`}></span>
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-300 font-medium">Moving Gradients</span>
                        <button 
                          onClick={() => setGradientsEnabled(!gradientsEnabled)}
                          className={`w-10 h-5 rounded-full transition-colors relative ${gradientsEnabled ? 'bg-cyber-blue' : 'bg-slate-700'}`}
                        >
                          <span className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${gradientsEnabled ? 'left-6' : 'left-1'}`}></span>
                        </button>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-300 font-medium">Brightness</span>
                          <span className="text-[10px] text-cyber-blue font-mono">{brightness}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="50" 
                          max="150" 
                          value={brightness} 
                          onChange={(e) => setBrightness(parseInt(e.target.value))}
                          className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyber-blue"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-300 font-medium">Fullscreen Mode</span>
                        <button 
                          onClick={toggleFullscreen}
                          className={`w-10 h-5 rounded-full transition-colors relative ${isFullscreen ? 'bg-cyber-blue' : 'bg-slate-700'}`}
                        >
                          <span className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${isFullscreen ? 'left-6' : 'left-1'}`}></span>
                        </button>
                      </div>
                      {deferredPrompt && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-300 font-medium">Install App (IFP/Desktop)</span>
                          <button 
                            onClick={handleInstallClick}
                            className="px-3 py-1 bg-cyber-blue/10 text-cyber-blue hover:bg-cyber-blue hover:text-black border border-cyber-blue/30 rounded text-[10px] font-bold uppercase tracking-widest transition-colors"
                          >
                            Install
                          </button>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-300 font-medium">Clear Local Cache</span>
                        <button 
                          onClick={() => {
                            localStorage.clear();
                            window.location.reload();
                          }}
                          className="px-3 py-1 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/30 rounded text-[10px] font-bold uppercase tracking-widest transition-colors"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile */}
              <div className="relative" ref={profileDropdownRef}>
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-cyber-blue to-cyber-purple p-[1px] hover:scale-110 transition-transform focus:outline-none"
                >
                  <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                    {profile?.photoURL || user?.photoURL ? (
                      <img 
                        src={profile?.photoURL || user?.photoURL || ''} 
                        alt="Profile" 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <User size={16} className={user ? "text-cyber-green" : "text-cyber-blue"} />
                    )}
                  </div>
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-black/95 backdrop-blur-xl border border-cyber-blue/30 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="p-4 border-b border-cyber-blue/20 bg-gradient-to-b from-cyber-blue/10 to-transparent">
                      {loading ? (
                        <div className="animate-pulse flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-slate-800"></div>
                          <div className="space-y-2">
                            <div className="h-3 w-20 bg-slate-800 rounded"></div>
                            <div className="h-2 w-16 bg-slate-800 rounded"></div>
                          </div>
                        </div>
                      ) : user && profile ? (
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full border-2 border-cyber-blue p-0.5 shrink-0">
                            {profile.photoURL || user.photoURL ? (
                              <img 
                                src={profile.photoURL || user.photoURL || ''} 
                                alt="Profile" 
                                className="w-full h-full rounded-full object-cover" 
                                referrerPolicy="no-referrer"
                                crossOrigin="anonymous"
                              />
                            ) : (
                              <div className="gen-card w-full h-full bg-slate-800 rounded-full flex items-center justify-center text-cyber-blue">
                                <User size={24} />
                              </div>
                            )}
                          </div>
                          <div className="overflow-hidden">
                            <div className="text-sm font-bold text-white tracking-tight truncate">{profile.displayName || user.email}</div>
                            <div className="text-[10px] text-cyber-blue font-mono uppercase mt-1 flex items-center gap-1">
                              <Shield size={10} /> TIER: {profile.tier || profile.role || 'Free'}
                            </div>
                            <div className="text-[10px] text-cyber-yellow font-mono uppercase mt-1 flex items-center gap-1">
                              <Coins size={10} /> TOKEN: {(profile.tier || profile.role) === 'owner' ? 'Unlimited' : profile.tokens !== undefined ? profile.tokens : '2 / hari'}
                            </div>
                            <button onClick={() => { handleTabChange('pricing'); setIsProfileOpen(false); }} className="mt-2 text-[10px] bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold uppercase tracking-widest px-2 py-1 rounded w-full flex justify-center items-center gap-1">
                              <Zap size={10} /> Upgrade Tier
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-2">
                          <User size={24} className="text-slate-500 mb-2" />
                          <span className="text-xs text-slate-400 mb-3">Guest User</span>
                          <button onClick={handleLogin} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-cyber-blue/10 hover:bg-cyber-blue text-cyber-blue hover:text-black border border-cyber-blue/50 rounded-lg transition-colors text-xs font-bold uppercase tracking-widest">
                            <LogIn size={14} />
                            Login with Google
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {user && (
                      <div className="p-2">
                        <div className="px-3 py-2 text-[10px] uppercase font-bold text-slate-500 flex justify-between items-center">
                          <span>System Access</span>
                          <span className="text-cyber-green">GRANTED</span>
                        </div>
                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-300 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                          <LogOut size={14} />
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="p-4 md:p-6 max-w-7xl mx-auto w-full">
          {activeTab === 'beranda' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {/* Hero Dashboard Section */}
              <div className="flex flex-col lg:flex-row gap-8 mb-8">
                <div className="cyber-card p-8 rounded-2xl flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyber-blue/10 border border-cyber-blue/20 mb-6">
                    <span className="w-2 h-2 bg-cyber-blue rounded-full animate-pulse"></span> 
                    <span className="text-[10px] font-bold text-cyber-blue uppercase tracking-widest">System Online</span>
                  </div>
                  <h2 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter leading-none italic">
                    WELCOME TO THE <span className="text-cyber-blue">FUTURE</span> OF EDUCATION
                  </h2>
                  <p className="text-slate-400 text-sm md:text-base max-w-xl mb-8 font-medium italic">
                    Empowering educators with next-gen AI tools for module generation, assessment planning, and school administration.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <button onClick={() => handleTabChange('modul')} className="cyber-button px-8 py-3 text-sm">
                      Operation System: {osName} | RAM: {ramInfo}
                    </button>
                    <button onClick={() => setIsChatOpen(true)} className="px-8 py-3 text-sm font-bold uppercase tracking-widest border border-cyber-purple text-cyber-purple hover:bg-cyber-purple hover:text-white transition-all italic">
                      Consult AI Assistant
                    </button>
                  </div>
                </div>
                
                <div className="shrink-0">
                  <QuickProfile />
                </div>
              </div>

              {/* Analytics & Logs Row */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-6">
                <div className="cyber-card p-6 rounded-2xl overflow-y-auto custom-scrollbar flex-shrink-0 w-full sm:w-[318px] min-h-[160px]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold text-cyber-purple uppercase tracking-widest">Traffic Analytics</h3>
                    <Activity size={16} className="text-cyber-purple" />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Daily Access</span>
                      <span className="text-lg font-mono font-bold text-cyber-blue">{visitors.today}</span>
                    </div>
                    <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                      <div className="bg-cyber-blue h-full w-3/4 shadow-[0_0_10px_var(--color-cyber-blue)]"></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Monthly Load</span>
                      <span className="text-lg font-mono font-bold text-cyber-purple">{visitors.month}</span>
                    </div>
                    <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                      <div className="bg-cyber-purple h-full w-1/2 shadow-[0_0_10px_var(--color-cyber-purple)]"></div>
                    </div>
                    <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Heart size={14} className="text-cyber-yellow" />
                        <span className="text-xs text-slate-500">Favorites</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-mono font-bold text-cyber-yellow">{favorites}</span>
                        <button onClick={incrementFavorites} className="p-1.5 rounded bg-cyber-yellow/10 text-cyber-yellow hover:bg-cyber-yellow hover:text-black transition-colors" title="Favorite this app">
                          <Heart size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="cyber-card p-6 rounded-2xl overflow-y-auto custom-scrollbar flex-shrink-0 w-full sm:w-[318px] min-h-[160px]">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs font-bold text-cyber-blue uppercase tracking-widest flex items-center gap-2">
                      <div className="w-2 h-2 bg-cyber-blue animate-pulse rounded-full"></div>
                      Aktivitas Paling Sering Diklik
                    </h3>
                  </div>
                  <div className="space-y-4 font-mono text-[10px]">
                    {Object.entries(activityClicks).length > 0 ? (
                      Object.entries(activityClicks)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 5)
                        .map(([activity, count], index) => {
                          const menuItem = menuItems.flatMap(item => [item, ...(item.dropdown || [])]).find(item => item.id === activity);
                          const label = menuItem ? menuItem.label : activity;
                          return (
                            <div key={activity} className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-2 gap-1 sm:gap-4">
                              <div className="flex items-start sm:items-center gap-2 sm:gap-4 overflow-hidden">
                                <span className="text-slate-600 shrink-0">#{index + 1}</span>
                                <span className="text-slate-300 truncate sm:whitespace-normal sm:break-words">{label}</span>
                              </div>
                              <span className="text-cyber-blue font-bold self-end sm:self-auto shrink-0">{count} klik</span>
                            </div>
                          );
                        })
                    ) : (
                      <div className="text-slate-500 italic">Belum ada aktivitas...</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Feedback & Support */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="cyber-card p-6 rounded-2xl flex items-center justify-center" style={{ width: '300px', height: '300px', margin: '0 auto' }}>
                   <FeedbackForm inline={true} />
                </div>
                <div className="space-y-6">
                   <div className="cyber-card p-8 rounded-2xl bg-gradient-to-br from-cyber-yellow/5 to-transparent">
                      <h3 className="text-xl font-black italic text-cyber-yellow mb-4 uppercase tracking-tighter">Support the Network</h3>
                      <p className="text-xs text-slate-400 mb-6 leading-relaxed">Your contributions keep the system online and free for all educators. Join the mission to advance Indonesian education.</p>
                      <a href="https://saweria.co/pemuryadi" target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 px-6 py-3 bg-cyber-yellow text-black font-black uppercase text-xs tracking-widest hover:scale-105 transition-transform italic">
                        ☕ Donate via Saweria
                      </a>
                   </div>
                   <div className="cyber-card p-8 rounded-2xl bg-gradient-to-br from-cyber-blue/5 to-transparent">
                      <h3 className="text-xl font-black italic text-cyber-blue mb-4 uppercase tracking-tighter">Premium Assets</h3>
                      <p className="text-xs text-slate-400 mb-6 leading-relaxed">Access high-end teaching materials and exclusive module templates in our digital marketplace.</p>
                      <a href="https://lynk.id/pemuryadi" target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 px-6 py-3 bg-cyber-blue text-black font-black uppercase text-xs tracking-widest hover:scale-105 transition-transform italic">
                        🛒 Marketplace
                      </a>
                   </div>
                </div>
              </div>
            </div>
          )}

          {/* Generator Tabs Container */}
          <div className="transition-all duration-300 ease-in-out">
            {activeTab === 'kelompok' && <GroupGenerator />}
            {activeTab === 'adventure-journey' && <AdventureJourney />}
            {activeTab === 'puzzle' && <WordSearch />}
            {activeTab === 'snake' && <SnakeLadder />}
            {activeTab === 'ranking-satu' && <RankingSatu />}
            {activeTab === 'crossword' && <CrosswordGenerator />}
            {activeTab === 'supervisi' && <Supervision />}
            {activeTab === 'modul' && <ModuleGenerator />}
            {activeTab === 'mengajar-harian' && <MengajarHarian />}
            {activeTab === 'jurnal' && <DailyJournal />}
            {activeTab === 'deeplearning' && <DeepLearningPlan />}
            {activeTab === 'worksheet' && <WorksheetGenerator />}
            {activeTab === 'modul-kokurikuler' && <ModulKokurikuler />}
            {activeTab === 'buat-soal' && <BuatSoal />}
            {activeTab === 'kalender-pendidikan' && <KalenderPendidikan />}
            {activeTab === 'analisis-hari-efektif' && <AnalisisHariEfektif />}
            {activeTab === 'program-semester' && <ProgramSemester />}
            {activeTab === 'program-tahunan' && <ProgramTahunan />}
            {activeTab === 'kktp' && <KKTP />}
            {activeTab === 'game-ifp' && <GameIFP />}
            {activeTab.startsWith('snp-') && <SNP subTab={activeTab} />}
            {activeTab === 'pricing' && <Pricing />}
          </div>
        </div>
      </main>

      {/* Social Floating Bar */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50 no-print items-center">
        <div className={`flex flex-col gap-3 transition-all duration-300 origin-bottom ${isSocialOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-0 opacity-0 translate-y-10 pointer-events-none'}`}>
          <a href="https://www.facebook.com/p.e.muryadi" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform">
            <FaFacebook size={18} />
          </a>
          <a href="https://www.instagram.com/p.e.muryadi" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform">
            <FaInstagram size={18} />
          </a>
          <a href="https://www.tiktok.com/@p.e.muryadi" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-black border border-white/20 flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform">
            <FaTiktok size={18} />
          </a>
        </div>
        
        <button 
          onClick={() => setIsSocialOpen(!isSocialOpen)} 
          className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all ${isSocialOpen ? 'bg-slate-700 text-white' : 'bg-white/10 text-slate-300 backdrop-blur-md border border-white/20'}`}
          title="Toggle Social Media"
        >
          {isSocialOpen ? <X size={18} /> : <Share2 size={18} />}
        </button>

        <button onClick={() => setIsChatOpen(true)} className="w-12 h-12 mt-2 rounded-full bg-cyber-blue text-black flex items-center justify-center shadow-[0_0_20px_rgba(0,243,255,0.5)] hover:scale-110 transition-transform pulse-glow">
          <MessageSquare size={24} />
        </button>
      </div>

      {/* Chatbot Overlay */}
      <Chatbot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

      {/* Footer */}
      <footer className={`transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'} bg-black/40 border-t border-white/5 py-8 px-6 no-print`}>
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-[1px] w-12 bg-cyber-blue/30"></div>
            <p className="text-xs font-mono text-cyber-blue uppercase tracking-widest">System Version 2.0.77</p>
            <div className="h-[1px] w-12 bg-cyber-blue/30"></div>
          </div>
          <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">
            ©2026 <span className="text-white">PEMURYADI</span> - ADVANCING INDONESIAN EDUCATION THROUGH TECHNOLOGY
          </p>
        </div>
      </footer>
    </div>
  );
}
