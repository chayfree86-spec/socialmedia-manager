import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Wand2, LayoutDashboard, CalendarCheck, FileText, Settings,
  Sparkles, Zap, TrendingUp, Camera, Video, Hash, Send, Link2, LogOut,
  ChevronDown, Info, Building, Check, Mail, Phone, MapPin, X
} from 'lucide-react';
import SocialIcon from './components/SocialIcons';
import Dashboard from './pages/Dashboard';
import ContentGenerator from './pages/ContentGenerator';
import PostManager from './pages/PostManager';
import MediaLibrary from './pages/MediaLibrary';
import SocialAccounts from './pages/SocialAccounts';
import BrandSettings from './pages/BrandSettings';
import Login from './pages/Login';

const defaultSettings = {
  brandName: '',
  brandColor: '#4f46e5',
  logoColor: '',
  logoWhite: '',
  logoBlack: '',
  phone: '',
  email: '',
  address: '',
  showLogo: true,
  showName: true,
  showContact: true,
  showSocials: true,
  selectedLayout: 'classic',
  logoPosition: 'top-right',
  namePosition: 'bottom-left',
  addressPosition: 'bottom-left',
  socialPosition: 'bottom-right',
  logoSize: 60,
  overlayOpacity: 90,
  activeSocials: {
    instagram: true,
    facebook: true,
    linkedin: true,
    whatsapp: true,
    pinterest: false,
    youtube: false,
    google_business: false,
  },
  textModel: 'gemini-1.5-flash',
  imageModel: 'imagen',
  geminiApiKey: '',
  openaiApiKey: ''
};

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const localAuth = localStorage.getItem('socialai_authenticated') === 'true';
    const sessionAuth = sessionStorage.getItem('socialai_authenticated') === 'true';
    return localAuth || sessionAuth;
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const localUser = localStorage.getItem('socialai_user');
    const sessionUser = sessionStorage.getItem('socialai_user');
    const user = localUser || sessionUser;
    return user ? JSON.parse(user) : null;
  });

  // Multiple Businesses State
  const [businesses, setBusinesses] = useState([]);
  const [activeBusinessId, setActiveBusinessId] = useState(() => {
    return localStorage.getItem('socialai_active_business_id') || '1';
  });

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownHovered, setDropdownHovered] = useState(false);
  const [dropdownFocused, setDropdownFocused] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadDataFromDB = async () => {
    try {
      const listRes = await axios.get('/api/brand.php?action=list&user_id=default');
      if (listRes.data?.success && listRes.data?.businesses?.length > 0) {
        const bizList = listRes.data.businesses;
        setBusinesses(bizList);
        localStorage.setItem('socialai_businesses', JSON.stringify(bizList));

        let activeId = localStorage.getItem('socialai_active_business_id');
        if (!activeId || !bizList.some(b => String(b.id) === String(activeId))) {
          activeId = String(bizList[0].id);
          localStorage.setItem('socialai_active_business_id', activeId);
        }
        setActiveBusinessId(activeId);

        const brandRes = await axios.get(`/api/brand.php?business_id=${activeId}&user_id=default`);
        if (brandRes.data?.success && brandRes.data?.brand) {
          localStorage.setItem('brand_settings', JSON.stringify(brandRes.data.brand));
        }
      }
    } catch (err) {
      console.error('Failed to load data from DB in App:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadDataFromDB();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleUpdate = () => {
      loadDataFromDB();
    };
    window.addEventListener('brandSettingsUpdated', handleUpdate);
    return () => {
      window.removeEventListener('brandSettingsUpdated', handleUpdate);
    };
  }, []);

  const handleBusinessSwitch = (id) => {
    const selectedBiz = businesses.find(b => String(b.id) === String(id));
    if (selectedBiz) {
      localStorage.setItem('socialai_active_business_id', String(id));
      localStorage.setItem('brand_settings', JSON.stringify(selectedBiz));
      setActiveBusinessId(String(id));
      setDropdownOpen(false);
      window.dispatchEvent(new Event('brandSettingsUpdated'));
      toast.success(`Switched to ${selectedBiz.brandName}! 🏢`);
    }
  };

  const currentBusiness = businesses.find(b => String(b.id) === String(activeBusinessId)) || businesses[0] || defaultSettings;

  const handleLogin = (email, rememberMe) => {
    setIsAuthenticated(true);
    setCurrentUser({ email });
    if (rememberMe) {
      localStorage.setItem('socialai_authenticated', 'true');
      localStorage.setItem('socialai_user', JSON.stringify({ email }));
    } else {
      setIsAuthenticated(true);
      sessionStorage.setItem('socialai_authenticated', 'true');
      sessionStorage.setItem('socialai_user', JSON.stringify({ email }));
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem('socialai_authenticated');
    localStorage.removeItem('socialai_user');
    sessionStorage.removeItem('socialai_authenticated');
    sessionStorage.removeItem('socialai_user');
  };

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', color: 'text-indigo-400' },
    { to: '/generate', icon: Wand2, label: 'AI Generate', color: 'text-purple-400' },
    { to: '/posts', icon: FileText, label: 'Posts', color: 'text-pink-400' },
    { to: '/media', icon: Camera, label: 'Media', color: 'text-emerald-400' },
    { to: '/accounts', icon: Link2, label: 'Accounts', color: 'text-amber-400' },
    { to: '/settings', icon: Settings, label: 'Settings', color: 'text-indigo-300' },
  ];

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - High Contrast */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} text-white transition-all duration-300 flex flex-col border-r border-indigo-500/30 flex-shrink-0`}
        style={{ background: '#080614' }}>
        {/* Logo */}
        <div className={`border-b border-white/10 ${sidebarOpen ? 'p-6' : 'p-3 flex justify-center'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-btn flex items-center justify-center shadow-glow flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="font-bold text-lg gradient-text">SocialAI</h1>
                <p className="text-xs text-gray-400">AI Manager</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 space-y-1 ${sidebarOpen ? 'p-4' : 'p-2'}`}>
          {navItems.map(({ to, icon: Icon, label, color }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center rounded-xl transition-all duration-200 group ${
                  sidebarOpen ? 'gap-3 px-4 py-3 text-left' : 'justify-center p-3'
                } ${
                  isActive
                    ? 'bg-white/15 text-white shadow-lg font-semibold'
                    : 'text-gray-300 hover:text-white hover:bg-white/8 font-medium'
                }`
              }
            >
              <Icon className={`w-5 h-5 ${color} flex-shrink-0`} />
              {sidebarOpen && <span className="font-medium text-sm">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Supported Platforms */}
        {sidebarOpen && (
          <div className="p-4 border-t border-white/10">
            <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider">Platforms</p>
            <div className="flex gap-2 flex-wrap">
              {[
                { id: 'instagram', label: 'IG' },
                { id: 'facebook', label: 'FB' },
                { id: 'youtube', label: 'YT' },
                { id: 'whatsapp', label: 'WA' },
                { id: 'google_business', label: 'GB' },
                { id: 'pinterest', label: 'PT' },
                { id: 'linkedin', label: 'LI' },
              ].map(({ id, label }) => (
                <div key={label} className="w-9 h-9 rounded-lg bg-white/8 flex items-center justify-center hover:bg-white/15 transition cursor-pointer border border-white/5" title={label}>
                  <SocialIcon platform={id} size={16} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Logout Action */}
        <button
          onClick={handleLogout}
          className={`border-t border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition text-sm flex items-center w-full font-medium ${
            sidebarOpen ? 'p-4 gap-3 text-left' : 'p-3.5 justify-center'
          }`}
        >
          <LogOut className="w-5.5 h-5.5 text-rose-400 flex-shrink-0" />
          {sidebarOpen && <span>Logout</span>}
        </button>

        {/* Toggle Sidebar */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`border-t border-white/10 text-gray-500 hover:text-white transition text-sm w-full flex ${
            sidebarOpen ? 'p-4 text-left' : 'p-3.5 justify-center'
          }`}
        >
          {sidebarOpen ? '◀ Collapse' : '▶'}
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden w-full flex flex-col bg-slate-50/50">
        {/* Top Header with Business Dropdown */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between flex-shrink-0 z-20 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider hidden sm:inline">Active Workspace:</span>
            
            {/* Custom Business Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                onMouseEnter={() => setDropdownHovered(true)}
                onMouseLeave={() => setDropdownHovered(false)}
                onFocus={() => setDropdownFocused(true)}
                onBlur={() => setDropdownFocused(false)}
                style={{
                  borderColor: dropdownOpen || dropdownFocused || dropdownHovered ? currentBusiness.brandColor : undefined,
                  boxShadow: dropdownFocused ? `0 0 0 4px ${currentBusiness.brandColor}20` : undefined
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-220 bg-white transition text-xs sm:text-sm font-semibold text-gray-700 shadow-sm focus:outline-none"
              >
                <Building className="w-4 h-4 flex-shrink-0" style={{ color: currentBusiness.brandColor }} />
                <span className="max-w-[120px] sm:max-w-[180px] truncate">{currentBusiness.brandName}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute left-0 mt-2 w-64 bg-white border border-gray-150 rounded-xl shadow-xl z-30 py-1.5 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-100 max-h-72 overflow-y-auto">
                  <div className="px-3 py-1 border-b border-gray-100 mb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Select Workspace
                  </div>
                  {businesses.map((biz) => {
                    const isSelected = String(biz.id) === String(activeBusinessId);
                    return (
                      <button
                        key={biz.id}
                        onClick={() => handleBusinessSwitch(biz.id)}
                        style={{
                          backgroundColor: isSelected ? `${biz.brandColor}12` : undefined,
                          color: isSelected ? biz.brandColor : undefined
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs text-left transition-colors font-medium hover:bg-gray-50 hover:text-gray-900 ${
                          isSelected ? 'font-bold' : ''
                        }`}
                      >
                        <span className="truncate">{biz.brandName}</span>
                        {isSelected && <Check className="w-3.5 h-3.5" style={{ color: biz.brandColor }} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Profile Info Button */}
            <button
              onClick={() => setModalOpen(true)}
              style={{
                color: currentBusiness.brandColor,
                backgroundColor: `${currentBusiness.brandColor}0a`
              }}
              className="p-1.5 rounded-lg transition hover:brightness-90"
              title="View Business Profile Details"
            >
              <Info className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Quick Contact Info */}
          <div className="hidden md:flex items-center gap-5 text-xs text-gray-500 font-medium">
            {currentBusiness.phone && <span className="flex items-center gap-1">📞 {currentBusiness.phone}</span>}
            {currentBusiness.email && <span className="flex items-center gap-1">✉️ {currentBusiness.email}</span>}
          </div>
        </header>

        {/* Page Content Body */}
        <div className="flex-1 overflow-y-auto w-full">
          <Routes key={activeBusinessId}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/generate" element={<ContentGenerator />} />
            <Route path="/posts" element={<PostManager />} />
            <Route path="/media" element={<MediaLibrary />} />
            <Route path="/accounts" element={<SocialAccounts />} />
            <Route path="/settings" element={<BrandSettings />} />
          </Routes>
        </div>
      </main>

      {/* Business Profile Info Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-gray-150 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-950 text-base flex items-center gap-2">
                <Building className="w-5 h-5" style={{ color: currentBusiness.brandColor }} />
                Business Profile
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-200 transition text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-sm text-gray-700">
              {/* Logo & Name */}
              <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
                {currentBusiness.logoColor ? (
                  <img src={currentBusiness.logoColor} alt="Logo" className="w-12 h-12 rounded-xl object-contain border border-gray-100 p-1" />
                ) : (
                  <div
                    style={{ backgroundColor: `${currentBusiness.brandColor}1a`, color: currentBusiness.brandColor }}
                    className="w-12 h-12 rounded-xl font-bold flex items-center justify-center text-lg select-none shadow-sm"
                  >
                    {currentBusiness.brandName ? currentBusiness.brandName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'PW'}
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-gray-900 text-lg leading-tight">{currentBusiness.brandName}</h4>
                  <span
                    style={{ backgroundColor: currentBusiness.brandColor }}
                    className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full uppercase tracking-wider"
                  >
                    Active
                  </span>
                </div>
              </div>

              {/* Business Contact Fields */}
              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-gray-450 uppercase tracking-wider leading-none mb-1">Phone</p>
                    <p className="font-medium text-gray-800">{currentBusiness.phone || 'Not Set'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Mail className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-gray-455 uppercase tracking-wider leading-none mb-1">Email</p>
                    <p className="font-medium text-gray-800 break-all">{currentBusiness.email || 'Not Set'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-gray-455 uppercase tracking-wider leading-none mb-1">Address</p>
                    <p className="font-medium text-gray-800 leading-normal">{currentBusiness.address || 'Not Set'}</p>
                  </div>
                </div>
              </div>

              {/* Models Info */}
              <div className="border-t border-gray-100 pt-4 grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-gray-100">
                  <p className="font-bold text-gray-400 uppercase tracking-wider text-[9px] mb-1">Text AI Model</p>
                  <p className="font-bold" style={{ color: currentBusiness.brandColor }}>{currentBusiness.textModel || 'Not configured'}</p>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-gray-100">
                  <p className="font-bold text-gray-400 uppercase tracking-wider text-[9px] mb-1">Image AI Model</p>
                  <p className="font-bold" style={{ color: currentBusiness.brandColor }}>{currentBusiness.imageModel || 'Not configured'}</p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setModalOpen(false)}
                style={{ backgroundColor: currentBusiness.brandColor, boxShadow: `0 4px 12px ${currentBusiness.brandColor}20` }}
                className="px-4 py-2 text-white rounded-xl text-xs font-bold transition hover:brightness-110"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
