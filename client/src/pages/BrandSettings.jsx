import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import {
  Settings, Upload, Layout, Eye, Check, RotateCcw, Sliders,
  Globe, Mail, Phone, MapPin, Sparkles, Play, Image, Save,
  CheckCircle2, AlertCircle, Info, ChevronRight, FileText,
  SlidersHorizontal, LayoutTemplate, Lock, Key, Cpu,
  ArrowUpLeft, ArrowUpRight, Move, ArrowDownLeft, ArrowDownRight,
  Building, Trash2, Plus
} from 'lucide-react';
import CustomDropdown from '../components/CustomDropdown';
import SocialIcon from '../components/SocialIcons';

const API_BASE = '/api';

const defaultSettings = {
  brandName: '',
  brandColor: '#4f46e5',
  logoColor: '',
  logoWhite: '',
  logoBlack: '',
  logoSelected: 'logoWhite',
  phone: '',
  email: '',
  address: '',
  showLogo: true,
  showName: true,
  showContact: true,
  showSocials: true,
  watermarkEnabled: true,
  selectedLayout: 'classic', // classic, modern, footer, header, custom
  logoPosition: 'top-right',
  namePosition: 'bottom-left',
  addressPosition: 'bottom-left',
  socialPosition: 'bottom-right',
  logoSize: 60, // size in px (30 to 120)
  overlayOpacity: 90, // opacity in % (10 to 100)
  activeSocials: {
    instagram: true,
    facebook: true,
    linkedin: true,
    whatsapp: true,
    pinterest: false,
    youtube: false,
    google_business: false,
  },
  // AI Config settings
  textModel: 'gemini-1.5-flash', // gemini-1.5-flash, gpt-4, mock
  imageModel: 'imagen', // imagen, dall-e-3, mock
  geminiApiKey: '',
  openaiApiKey: ''
};

const COLOR_PRESETS = [
  { name: 'Indigo Spark', value: '#4f46e5' },
  { name: 'Royal Purple', value: '#7c3aed' },
  { name: 'Emerald Clean', value: '#10b981' },
  { name: 'Warm Amber', value: '#f59e0b' },
  { name: 'Rose Petal', value: '#f43f5e' },
  { name: 'Ocean Blue', value: '#0284c7' },
  { name: 'Deep Carbon', value: '#1e293b' },
  { name: 'Sleek Black', value: '#000000' }
];

const POSITION_OPTIONS = [
  { value: 'top-left', label: 'Top Left', icon: <ArrowUpLeft className="w-4 h-4" /> },
  { value: 'top-right', label: 'Top Right', icon: <ArrowUpRight className="w-4 h-4" /> },
  { value: 'center', label: 'Center', icon: <Move className="w-4 h-4" /> },
  { value: 'bottom-left', label: 'Bottom Left', icon: <ArrowDownLeft className="w-4 h-4" /> },
  { value: 'bottom-right', label: 'Bottom Right', icon: <ArrowDownRight className="w-4 h-4" /> }
];

const POSITION_OPTIONS_WITHOUT_CENTER = [
  { value: 'top-left', label: 'Top Left', icon: <ArrowUpLeft className="w-4 h-4" /> },
  { value: 'top-right', label: 'Top Right', icon: <ArrowUpRight className="w-4 h-4" /> },
  { value: 'bottom-left', label: 'Bottom Left', icon: <ArrowDownLeft className="w-4 h-4" /> },
  { value: 'bottom-right', label: 'Bottom Right', icon: <ArrowDownRight className="w-4 h-4" /> }
];

export default function BrandSettings() {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('brand_settings');
    if (saved) {
      try {
        return { ...defaultSettings, ...JSON.parse(saved) };
      } catch (e) {}
    }
    return defaultSettings;
  });
  const [previewMode, setPreviewMode] = useState('image'); // image, video
  const [activeTab, setActiveTab] = useState('identity'); // identity, overlay, layout, ai_config

  // Multiple businesses state
  const [businessesList, setBusinessesList] = useState(() => {
    const saved = localStorage.getItem('socialai_businesses');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });
  const [activeBizId, setActiveBizId] = useState(() => {
    return localStorage.getItem('socialai_active_business_id') || '1';
  });

  const selectedLogoUrl = settings[settings.logoSelected || 'logoWhite'] || settings.logoColor || settings.logoWhite || settings.logoBlack;

  const [newBizName, setNewBizName] = useState('');
  const [newBizPhone, setNewBizPhone] = useState('');
  const [newBizEmail, setNewBizEmail] = useState('');
  const [newBizAddress, setNewBizAddress] = useState('');
  const [newBizColor, setNewBizColor] = useState('#4f46e5');

  const loadBusinesses = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/brand.php?action=list&user_id=default`);
      if (data?.success && data?.businesses) {
        setBusinessesList(data.businesses);
      }
    } catch (e) {
      console.error('Failed to load businesses from DB:', e);
    }
    setActiveBizId(localStorage.getItem('socialai_active_business_id') || '1');
  };

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const activeId = localStorage.getItem('socialai_active_business_id') || '1';
        const { data } = await axios.get(`${API_BASE}/brand.php?business_id=${activeId}&user_id=default`);
        if (data?.success && data?.brand) {
          const brand = data.brand;
          const merged = {
            ...defaultSettings,
            brandName: brand.brandName || defaultSettings.brandName,
            brandColor: brand.brandColor || defaultSettings.brandColor,
            logoColor: brand.logoColor || '',
            logoWhite: brand.logoWhite || '',
            logoBlack: brand.logoBlack || '',
            logoSelected: brand.logoSelected || 'logoWhite',
            phone: brand.phone || '',
            email: brand.email || '',
            address: brand.address || '',
            showLogo: brand.showLogo ?? true,
            showName: brand.showName ?? true,
            showContact: brand.showContact ?? true,
            showSocials: brand.showSocials ?? true,
            watermarkEnabled: brand.watermarkEnabled ?? true,
            selectedLayout: brand.selectedLayout || 'classic',
            logoPosition: brand.logoPosition || 'top-right',
            namePosition: brand.namePosition || 'bottom-left',
            addressPosition: brand.addressPosition || 'bottom-left',
            socialPosition: brand.socialPosition || 'bottom-right',
            logoSize: brand.logoSize || 60,
            overlayOpacity: brand.overlayOpacity || 90,
            activeSocials: brand.activeSocials || defaultSettings.activeSocials,
            textModel: brand.textModel || 'gemini-1.5-flash',
            imageModel: brand.imageModel || 'imagen',
            geminiApiKey: brand.geminiApiKey || '',
            openaiApiKey: brand.openaiApiKey || '',
          };
          setSettings(merged);
          localStorage.setItem('brand_settings', JSON.stringify(merged));
          return;
        }
      } catch (err) {
        console.log('API not reachable, loading from localStorage');
      }
      // Fallback to localStorage
      const saved = localStorage.getItem('brand_settings');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setSettings({ ...defaultSettings, ...parsed });
        } catch (e) {
          console.error('Failed to parse settings', e);
        }
      }
    };

    loadSettings();
    loadBusinesses();
    window.addEventListener('brandSettingsUpdated', loadBusinesses);
    return () => window.removeEventListener('brandSettingsUpdated', loadBusinesses);
  }, []);

  const saveSettings = async (newSettings, showToast = true) => {
    setSettings(newSettings);
    localStorage.setItem('brand_settings', JSON.stringify(newSettings));

    const activeId = localStorage.getItem('socialai_active_business_id') || '1';

    // Save to database via API
    try {
      const payload = {
        business_id: activeId,
        user_id: 1,
        brand_name: newSettings.brandName,
        brand_color: newSettings.brandColor,
        phone: newSettings.phone,
        email: newSettings.email,
        address: newSettings.address,
        logo_color: newSettings.logoColor,
        logo_white: newSettings.logoWhite,
        logo_black: newSettings.logoBlack,
        logoSelected: newSettings.logoSelected || 'logoWhite',
        logo_selected: newSettings.logoSelected || 'logoWhite',
        logoSize: newSettings.logoSize,
        logo_size: newSettings.logoSize,
        showLogo: newSettings.showLogo,
        show_logo: newSettings.showLogo,
        showName: newSettings.showName,
        show_name: newSettings.showName,
        showContact: newSettings.showContact,
        show_contact: newSettings.showContact,
        showSocials: newSettings.showSocials,
        show_socials: newSettings.showSocials,
        watermarkEnabled: newSettings.watermarkEnabled,
        watermark_enabled: newSettings.watermarkEnabled,
        overlayOpacity: newSettings.overlayOpacity,
        overlay_opacity: newSettings.overlayOpacity,
        selectedLayout: newSettings.selectedLayout,
        selected_layout: newSettings.selectedLayout,
        logoPosition: newSettings.logoPosition,
        logo_position: newSettings.logoPosition,
        namePosition: newSettings.namePosition,
        name_position: newSettings.namePosition,
        addressPosition: newSettings.addressPosition,
        address_position: newSettings.addressPosition,
        socialPosition: newSettings.socialPosition,
        social_position: newSettings.socialPosition,
        activeSocials: newSettings.activeSocials,
        active_socials: newSettings.activeSocials,
        textModel: newSettings.textModel,
        text_model: newSettings.textModel,
        imageModel: newSettings.imageModel,
        image_model: newSettings.imageModel,
        geminiApiKey: newSettings.geminiApiKey,
        gemini_api_key: newSettings.geminiApiKey,
        openaiApiKey: newSettings.openaiApiKey,
        openai_api_key: newSettings.openaiApiKey,
      };
      await axios.post(`${API_BASE}/brand.php`, payload);
      if (showToast) toast.success('✅ Brand settings saved to database!');
    } catch (err) {
      console.error('Failed to save to DB:', err);
      if (showToast) toast.error('Saved locally only. DB connection failed.');
    }

    // Dispatch event to notify App.jsx of changes
    window.dispatchEvent(new Event('brandSettingsUpdated'));
  };

  const handleAddBusiness = async (e) => {
    e.preventDefault();
    if (!newBizName.trim()) {
      toast.error("Please enter a business name");
      return;
    }

    try {
      const payload = {
        business_id: 0,
        brand_name: newBizName,
        brand_color: newBizColor,
        phone: newBizPhone,
        email: newBizEmail,
        address: newBizAddress,
      };
      const { data } = await axios.post(`${API_BASE}/brand.php`, payload);
      if (data.success && data.brand) {
        const newBiz = data.brand;
        toast.success(`Business "${newBiz.brandName}" added and activated! 🏢`);
        
        localStorage.setItem('socialai_active_business_id', String(newBiz.id));
        localStorage.setItem('brand_settings', JSON.stringify(newBiz));
        
        await loadBusinesses();
        
        // Reset form
        setNewBizName('');
        setNewBizPhone('');
        setNewBizEmail('');
        setNewBizAddress('');
        setNewBizColor('#4f46e5');
        
        window.dispatchEvent(new Event('brandSettingsUpdated'));
      }
    } catch (err) {
      toast.error('Failed to add business to database');
    }
  };

  const handleActivateBusiness = (id) => {
    const selected = businessesList.find(b => String(b.id) === String(id));
    if (selected) {
      localStorage.setItem('socialai_active_business_id', String(id));
      localStorage.setItem('brand_settings', JSON.stringify(selected));
      window.dispatchEvent(new Event('brandSettingsUpdated'));
      toast.success(`Switched workspace to ${selected.brandName}! 🏢`);
    }
  };

  const handleDeleteBusiness = async (id, name) => {
    if (businessesList.length <= 1) {
      toast.error("You must have at least one business profile!");
      return;
    }

    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        const { data } = await axios.delete(`${API_BASE}/brand.php?business_id=${id}`);
        if (data.success) {
          toast.success(`Business "${name}" deleted successfully!`);
          
          await loadBusinesses();

          // If we deleted the active business, activate another one
          if (String(id) === String(activeBizId)) {
            const remaining = businessesList.filter(b => String(b.id) !== String(id));
            const fallbackBiz = remaining[0];
            if (fallbackBiz) {
              localStorage.setItem('socialai_active_business_id', String(fallbackBiz.id));
              localStorage.setItem('brand_settings', JSON.stringify(fallbackBiz));
            }
          }
          window.dispatchEvent(new Event('brandSettingsUpdated'));
        }
      } catch (err) {
        toast.error(err.response?.data?.error || 'Failed to delete business');
      }
    }
  };

  const handleInputChange = (field, val) => {
    const updated = { ...settings, [field]: val };
    setSettings(updated);
    localStorage.setItem('brand_settings', JSON.stringify(updated));
  };

  const handleSocialToggle = (platform) => {
    const updated = {
      ...settings,
      activeSocials: {
        ...settings.activeSocials,
        [platform]: !settings.activeSocials[platform]
      }
    };
    setSettings(updated);
    localStorage.setItem('brand_settings', JSON.stringify(updated));
  };

  const resetToDefault = () => {
    if (window.confirm("Are you sure you want to reset settings to default?")) {
      saveSettings(defaultSettings);
      toast.success("Settings reset to default!");
    }
  };

  const handleLogoUpload = (variant, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleInputChange(variant, reader.result);
        const typeLabel = variant === 'logoColor' ? 'Color' : variant === 'logoWhite' ? 'White' : 'Black';
        toast.success(`${typeLabel} logo uploaded successfully!`);
      };
      reader.readAsDataURL(file);
    }
  };

  const getInitials = (name) => {
    return name
      ? name
          .split(' ')
          .map((n) => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase()
      : 'PW';
  };

  // Predefined layouts coordinates helper
  const getLayoutClasses = () => {
    const opacityVal = settings.overlayOpacity / 100;
    
    if (settings.selectedLayout === 'classic') {
      return {
        logo: { position: 'absolute top-6 right-6', style: { width: `${settings.logoSize}px`, opacity: opacityVal } },
        nameAndAddress: { position: 'absolute bottom-6 left-6 max-w-[60%] text-left bg-black/45 backdrop-blur-md p-3.5 rounded-xl border border-white/10 text-white', style: { opacity: opacityVal } },
        socials: { position: 'absolute bottom-6 right-6 flex gap-2', style: { opacity: opacityVal } }
      };
    }
    
    if (settings.selectedLayout === 'modern') {
      return {
        logo: { position: 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-125 pointer-events-none', style: { width: `${settings.logoSize * 1.5}px`, opacity: 0.25 } },
        nameAndAddress: { position: 'absolute bottom-6 left-1/2 -translate-x-1/2 w-[85%] text-center bg-white/90 backdrop-blur-md p-3.5 rounded-2xl border border-gray-200/50 text-gray-900 shadow-md', style: { opacity: opacityVal } },
        socials: { position: 'absolute top-6 right-6 flex gap-1.5 bg-black/35 backdrop-blur-sm px-2.5 py-1.5 rounded-full', style: { opacity: opacityVal } }
      };
    }
    
    if (settings.selectedLayout === 'footer') {
      return {
        logo: { position: 'flex items-center', style: { width: `${settings.logoSize * 0.8}px`, opacity: 1 } },
        nameAndAddress: { position: 'flex flex-col text-left justify-center min-w-0 flex-1', style: { opacity: 1 } },
        socials: { position: 'flex gap-2 items-center justify-end', style: { opacity: 1 } },
        bannerContainer: { position: 'absolute bottom-0 left-0 right-0 py-3 px-5 flex items-center justify-between gap-4 text-white border-t border-white/10', style: { backgroundColor: settings.brandColor, opacity: opacityVal } }
      };
    }

    if (settings.selectedLayout === 'header') {
      return {
        logo: { position: 'flex items-center', style: { width: `${settings.logoSize * 0.8}px`, opacity: 1 } },
        nameAndAddress: { position: 'flex flex-col text-left justify-center min-w-0 flex-1', style: { opacity: 1 } },
        socials: { position: 'absolute bottom-6 right-6 flex gap-2 bg-black/40 backdrop-blur-sm p-2 rounded-xl border border-white/5', style: { opacity: opacityVal } },
        addressCorner: { position: 'absolute bottom-6 left-6 bg-black/40 backdrop-blur-sm p-3.5 rounded-xl border border-white/5 text-xs text-white max-w-[50%] text-left', style: { opacity: opacityVal } },
        bannerContainer: { position: 'absolute top-0 left-0 right-0 py-3 px-5 flex items-center justify-between gap-4 text-white border-b border-white/10', style: { backgroundColor: settings.brandColor, opacity: opacityVal } }
      };
    }

    // Custom layout logic
    const getPosClass = (pos) => {
      switch (pos) {
        case 'top-left': return 'absolute top-6 left-6 text-left';
        case 'top-right': return 'absolute top-6 right-6 text-right';
        case 'center': return 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center';
        case 'bottom-left': return 'absolute bottom-6 left-6 text-left';
        case 'bottom-right': return 'absolute bottom-6 right-6 text-right';
        default: return 'absolute top-6 right-6 text-right';
      }
    };

    return {
      logo: { position: getPosClass(settings.logoPosition), style: { width: `${settings.logoSize}px`, opacity: opacityVal } },
      nameAndAddress: { position: `${getPosClass(settings.namePosition)} max-w-[50%] bg-black/40 backdrop-blur-sm p-3 rounded-xl border border-white/5 text-white text-xs`, style: { opacity: opacityVal } },
      socials: { position: `${getPosClass(settings.socialPosition)} flex gap-2`, style: { opacity: opacityVal } }
    };
  };

  const layoutStyles = getLayoutClasses();

  // Helper for dynamic hover/active styles
  const getThemeTextClass = (isActive) => {
    return isActive ? { color: settings.brandColor } : { color: '#6b7280' };
  };

  const getThemeBgClass = (isActive) => {
    return isActive ? { backgroundColor: settings.brandColor } : { backgroundColor: '#e5e7eb' };
  };

  const getThemeBorderClass = (isActive) => {
    return isActive ? { borderColor: settings.brandColor } : { borderColor: '#e5e7eb' };
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1" style={{ color: settings.brandColor }}>
            <Settings className="w-6 h-6 animate-spin-slow" />
            <span className="font-bold text-xs uppercase tracking-wider">Brand Control Hub</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Brand Settings</h1>
          <p className="text-gray-500 text-sm mt-1">
            Configure your brand visual identity and control watermark overlays on image and video posts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={resetToDefault}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-250 hover:border-gray-400 bg-white text-gray-700 font-semibold text-sm transition"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          <button
            onClick={() => saveSettings(settings)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm transition font-semibold hover:brightness-110 shadow-md"
            style={{ backgroundColor: settings.brandColor }}
          >
            <Save className="w-4 h-4" />
            Save Settings
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Controls Form (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Navigation Tabs */}
          <div className="flex border-b border-gray-250 bg-gray-50 p-1.5 rounded-2xl">
            {[
              { id: 'identity', label: 'Brand Identity', icon: Globe },
              { id: 'overlay', label: 'Overlay Controls', icon: Eye },
              { id: 'layout', label: 'Layout & Placement', icon: LayoutTemplate },
              { id: 'ai_config', label: 'AI Config', icon: Cpu },
              { id: 'businesses', label: 'Business Profiles', icon: Building },
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isTabActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-xs sm:text-sm font-bold rounded-xl transition ${
                    isTabActive
                      ? 'bg-white shadow-sm border border-gray-200/50'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                  style={isTabActive ? { color: settings.brandColor } : {}}
                >
                  <TabIcon className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab 1: Brand Identity */}
          {activeTab === 'identity' && (
            <div className="bg-white border border-gray-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-6">
              <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
                <Globe className="w-5 h-5" style={{ color: settings.brandColor }} />
                Brand Profile & Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Brand Name */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">Brand Name</label>
                  <input
                    type="text"
                    value={settings.brandName}
                    onChange={(e) => handleInputChange('brandName', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-250 bg-gray-50 focus:bg-white focus:outline-none transition text-sm"
                    style={{ '--tw-focus-ring-color': settings.brandColor }}
                    placeholder="e.g. Purity Wellness"
                  />
                </div>

                {/* Brand Color */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">Brand Color</label>
                  <div className="flex gap-3">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-gray-250 cursor-pointer shadow-inner">
                      <input
                        type="color"
                        value={settings.brandColor}
                        onChange={(e) => handleInputChange('brandColor', e.target.value)}
                        className="absolute inset-0 w-full h-full scale-150 cursor-pointer opacity-100 border-none bg-none p-0"
                      />
                    </div>
                    <input
                      type="text"
                      value={settings.brandColor}
                      onChange={(e) => handleInputChange('brandColor', e.target.value)}
                      className="flex-1 px-4 py-3 rounded-xl border border-gray-250 bg-gray-50 focus:bg-white focus:outline-none transition text-sm uppercase font-mono"
                      placeholder="#4f46e5"
                    />
                  </div>
                </div>
              </div>

              {/* Color Presets */}
              <div className="space-y-2">
                <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Quick Presets</span>
                <div className="flex flex-wrap gap-2.5">
                  {COLOR_PRESETS.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => handleInputChange('brandColor', p.value)}
                      className={`w-8 h-8 rounded-full border-2 transition transform hover:scale-110 flex items-center justify-center`}
                      style={{
                        backgroundColor: p.value,
                        borderColor: settings.brandColor === p.value ? '#ffffff' : 'transparent',
                        boxShadow: settings.brandColor === p.value ? `0 0 0 2px ${p.value}` : 'none'
                      }}
                      title={p.name}
                    >
                      {settings.brandColor === p.value && (
                        <Check className={`w-4 h-4 ${p.value === '#ffffff' ? 'text-black' : 'text-white'}`} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 border-t border-gray-150 pt-5">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700 flex items-center gap-1.5">
                    <Phone className="w-4 h-4" style={{ color: settings.brandColor }} />
                    Contact Number (WhatsApp)
                  </label>
                  <input
                    type="text"
                    value={settings.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-250 bg-gray-50 focus:bg-white focus:outline-none transition text-sm"
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700 flex items-center gap-1.5">
                    <Mail className="w-4 h-4" style={{ color: settings.brandColor }} />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-250 bg-gray-50 focus:bg-white focus:outline-none transition text-sm"
                    placeholder="email@brand.com"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" style={{ color: settings.brandColor }} />
                  Brand Address
                </label>
                <textarea
                  value={settings.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-250 bg-gray-50 focus:bg-white focus:outline-none transition text-sm h-20 resize-none"
                  placeholder="Enter business address..."
                />
              </div>

              {/* Logo Upload Section */}
              <div className="border-t border-gray-150 pt-5 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1">Logo Variants</h3>
                  <p className="text-xs text-gray-400">Upload three formats of your logo for different backgrounds</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Color Logo */}
                  <div 
                    onClick={() => handleInputChange('logoSelected', 'logoColor')}
                    style={{ borderColor: (settings.logoSelected || 'logoWhite') === 'logoColor' ? settings.brandColor : undefined }}
                    className={`cursor-pointer border-2 rounded-2xl p-4 flex flex-col items-center justify-between text-center transition min-h-[170px] relative ${
                      (settings.logoSelected || 'logoWhite') === 'logoColor' ? 'bg-gray-50/70 shadow-md font-semibold' : 'border-gray-200 bg-gray-50/50 hover:bg-gray-50'
                    }`}
                  >
                    {(settings.logoSelected || 'logoWhite') === 'logoColor' && (
                      <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: settings.brandColor }}>
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <span className="text-xs font-bold text-gray-600 mb-2">Color Logo</span>
                    <div className="w-16 h-16 rounded-xl border border-dashed border-gray-300 flex items-center justify-center bg-white overflow-hidden shadow-inner">
                      {settings.logoColor ? (
                        <img src={settings.logoColor} className="w-full h-full object-contain" alt="Color Logo" />
                      ) : (
                        <div className="text-xs font-extrabold text-white w-10 h-10 rounded-lg flex items-center justify-center shadow-md" style={{ backgroundColor: settings.brandColor }}>
                          {getInitials(settings.brandName)}
                        </div>
                      )}
                    </div>
                    <label onClick={(e) => e.stopPropagation()} className="mt-3 cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition hover:brightness-95" style={{ backgroundColor: `${settings.brandColor}1a`, color: settings.brandColor }}>
                      <Upload className="w-3.5 h-3.5" />
                      Upload
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload('logoColor', e)} />
                    </label>
                  </div>

                  {/* White Logo */}
                  <div 
                    onClick={() => handleInputChange('logoSelected', 'logoWhite')}
                    style={{ borderColor: (settings.logoSelected || 'logoWhite') === 'logoWhite' ? settings.brandColor : 'transparent' }}
                    className={`cursor-pointer border-2 rounded-2xl p-4 flex flex-col items-center justify-between text-center bg-slate-900 text-white min-h-[170px] relative ${
                      (settings.logoSelected || 'logoWhite') === 'logoWhite' ? 'shadow-lg' : 'border-gray-200'
                    }`}
                  >
                    {(settings.logoSelected || 'logoWhite') === 'logoWhite' && (
                      <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: settings.brandColor }}>
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <span className="text-xs font-bold text-slate-300 mb-2">White Logo</span>
                    <div className="w-16 h-16 rounded-xl border border-dashed border-slate-700 flex items-center justify-center bg-white/5 overflow-hidden">
                      {settings.logoWhite ? (
                        <img src={settings.logoWhite} className="w-full h-full object-contain filter invert" alt="White Logo" />
                      ) : (
                        <div className="text-xs font-extrabold text-slate-800 w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                          {getInitials(settings.brandName)}
                        </div>
                      )}
                    </div>
                    <label onClick={(e) => e.stopPropagation()} className="mt-3 cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition">
                      <Upload className="w-3.5 h-3.5" />
                      Upload
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload('logoWhite', e)} />
                    </label>
                  </div>

                  {/* Black Logo */}
                  <div 
                    onClick={() => handleInputChange('logoSelected', 'logoBlack')}
                    style={{ borderColor: (settings.logoSelected || 'logoWhite') === 'logoBlack' ? settings.brandColor : undefined }}
                    className={`cursor-pointer border-2 rounded-2xl p-4 flex flex-col items-center justify-between text-center transition min-h-[170px] relative ${
                      (settings.logoSelected || 'logoWhite') === 'logoBlack' ? 'bg-gray-50/70 shadow-md font-semibold' : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    {(settings.logoSelected || 'logoWhite') === 'logoBlack' && (
                      <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: settings.brandColor }}>
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <span className="text-xs font-bold text-gray-600 mb-2">Black Logo</span>
                    <div className="w-16 h-16 rounded-xl border border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden">
                      {settings.logoBlack ? (
                        <img src={settings.logoBlack} className="w-full h-full object-contain" alt="Black Logo" />
                      ) : (
                        <div className="text-xs font-extrabold text-white w-10 h-10 rounded-lg bg-black flex items-center justify-center">
                          {getInitials(settings.brandName)}
                        </div>
                      )}
                    </div>
                    <label onClick={(e) => e.stopPropagation()} className="mt-3 cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition">
                      <Upload className="w-3.5 h-3.5" />
                      Upload
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload('logoBlack', e)} />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Overlay Controls */}
          {activeTab === 'overlay' && (
            <div className="bg-white border border-gray-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-6">
              <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
                <Eye className="w-5 h-5" style={{ color: settings.brandColor }} />
                Element Visibility Controls
              </h2>

              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  Choose what elements to show on the generated image or video watermark overlay:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Toggle Overall Watermark */}
                  <div className="col-span-1 sm:col-span-2 flex items-center justify-between p-4 border border-gray-150 rounded-2xl hover:bg-gray-50/50 bg-gray-50/20 transition">
                    <div>
                      <span className="block text-sm font-bold text-gray-800">Enable Brand Watermark</span>
                      <span className="text-xs text-gray-400">If disabled, no watermark overlay will be shown on poster previews or post outputs.</span>
                    </div>
                    <button
                      onClick={() => handleInputChange('watermarkEnabled', !settings.watermarkEnabled)}
                      className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                      style={settings.watermarkEnabled ? { backgroundColor: settings.brandColor } : { backgroundColor: '#e5e7eb' }}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        settings.watermarkEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {/* Toggle Logo */}
                  <div className="flex items-center justify-between p-4 border border-gray-150 rounded-2xl hover:bg-gray-50/50 transition">
                    <div>
                      <span className="block text-sm font-bold text-gray-800">Show Logo</span>
                      <span className="text-xs text-gray-400">Brand logo on images and videos</span>
                    </div>
                    <button
                      onClick={() => handleInputChange('showLogo', !settings.showLogo)}
                      className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                      style={settings.showLogo ? { backgroundColor: settings.brandColor } : { backgroundColor: '#e5e7eb' }}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        settings.showLogo ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {/* Toggle Brand Name */}
                  <div className="flex items-center justify-between p-4 border border-gray-150 rounded-2xl hover:bg-gray-50/50 transition">
                    <div>
                      <span className="block text-sm font-bold text-gray-800">Show Brand Name</span>
                      <span className="text-xs text-gray-400">Text representation of brand name</span>
                    </div>
                    <button
                      onClick={() => handleInputChange('showName', !settings.showName)}
                      className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                      style={settings.showName ? { backgroundColor: settings.brandColor } : { backgroundColor: '#e5e7eb' }}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        settings.showName ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {/* Toggle Contact/Address */}
                  <div className="flex items-center justify-between p-4 border border-gray-150 rounded-2xl hover:bg-gray-50/50 transition">
                    <div>
                      <span className="block text-sm font-bold text-gray-800">Show Contact & Address</span>
                      <span className="text-xs text-gray-400">Phone number, email, and business address</span>
                    </div>
                    <button
                      onClick={() => handleInputChange('showContact', !settings.showContact)}
                      className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                      style={settings.showContact ? { backgroundColor: settings.brandColor } : { backgroundColor: '#e5e7eb' }}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        settings.showContact ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {/* Toggle Social Icons */}
                  <div className="flex items-center justify-between p-4 border border-gray-150 rounded-2xl hover:bg-gray-50/50 transition">
                    <div>
                      <span className="block text-sm font-bold text-gray-800">Show Social Icons</span>
                      <span className="text-xs text-gray-400">Muted badges of connected social profiles</span>
                    </div>
                    <button
                      onClick={() => handleInputChange('showSocials', !settings.showSocials)}
                      className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                      style={settings.showSocials ? { backgroundColor: settings.brandColor } : { backgroundColor: '#e5e7eb' }}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        settings.showSocials ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Social Media Selector Icons (Only visible if showSocials is true) */}
              {settings.showSocials && (
                <div className="border-t border-gray-150 pt-5 space-y-3">
                  <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Social Icons</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { id: 'instagram', label: 'Instagram' },
                      { id: 'facebook', label: 'Facebook' },
                      { id: 'linkedin', label: 'LinkedIn' },
                      { id: 'whatsapp', label: 'WhatsApp' },
                      { id: 'pinterest', label: 'Pinterest' },
                      { id: 'youtube', label: 'YouTube' },
                      { id: 'google_business', label: 'Google Business' },
                    ].map((p) => {
                      const isActive = settings.activeSocials[p.id];
                      return (
                        <button
                          key={p.id}
                          onClick={() => handleSocialToggle(p.id)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl border transition text-left text-xs font-bold"
                          style={
                            isActive
                              ? { backgroundColor: `${settings.brandColor}0f`, borderColor: `${settings.brandColor}50`, color: settings.brandColor }
                              : { backgroundColor: '#ffffff', borderColor: '#e5e7eb', color: '#6b7280' }
                          }
                        >
                          <div className="w-6 h-6 flex items-center justify-center rounded bg-white border border-gray-100 flex-shrink-0">
                            <SocialIcon platform={p.id} size={14} badge={false} />
                          </div>
                          <span className="truncate">{p.label}</span>
                          {isActive && <Check className="w-3.5 h-3.5 ml-auto flex-shrink-0" style={{ color: settings.brandColor }} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Layout Placement */}
          {activeTab === 'layout' && (
            <div className="bg-white border border-gray-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-6">
              <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
                <LayoutTemplate className="w-5 h-5" style={{ color: settings.brandColor }} />
                Watermark Layout
              </h2>

              {/* Layout Cards Selection */}
              <div className="space-y-3">
                <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Select Preset Layout</span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { id: 'classic', label: 'Classic Corner', desc: 'Corner arranged', icon: '↗️' },
                    { id: 'modern', label: 'Modern Center', desc: 'Center watermark', icon: '🎯' },
                    { id: 'footer', label: 'Footer Banner', desc: 'Bottom brand bar', icon: '⏹️' },
                    { id: 'header', label: 'Header Banner', desc: 'Top brand bar', icon: '🎚️' },
                    { id: 'custom', label: 'Custom', desc: 'Full custom control', icon: '⚙️' },
                  ].map((lay) => {
                    const isLayActive = settings.selectedLayout === lay.id;
                    return (
                      <button
                        key={lay.id}
                        onClick={() => handleInputChange('selectedLayout', lay.id)}
                        className={`flex flex-col p-3 rounded-2xl border text-center transition`}
                        style={
                          isLayActive
                            ? { backgroundColor: `${settings.brandColor}0f`, borderColor: settings.brandColor, color: settings.brandColor, fontWeight: 'bold', boxShadow: `0 0 0 2px ${settings.brandColor}20` }
                            : { backgroundColor: '#ffffff', borderColor: '#e5e7eb', color: '#4b5563' }
                        }
                      >
                        <span className="text-xl mb-1">{lay.icon}</span>
                        <span className="text-xs font-bold block truncate">{lay.label}</span>
                        <span className="text-[10px] text-gray-400 font-normal mt-0.5 truncate">{lay.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Size and Opacity Controls */}
              <div className="border-t border-gray-150 pt-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Logo Size */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-gray-700">Logo Size</label>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded" style={{ color: settings.brandColor, backgroundColor: `${settings.brandColor}15` }}>
                      {settings.logoSize}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="120"
                    value={settings.logoSize}
                    onChange={(e) => handleInputChange('logoSize', parseInt(e.target.value))}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    style={{ accentColor: settings.brandColor }}
                  />
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>Small (30px)</span>
                    <span>Large (120px)</span>
                  </div>
                </div>

                {/* Opacity */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-gray-700">Overlay Opacity</label>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded" style={{ color: settings.brandColor, backgroundColor: `${settings.brandColor}15` }}>
                      {settings.overlayOpacity}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={settings.overlayOpacity}
                    onChange={(e) => handleInputChange('overlayOpacity', parseInt(e.target.value))}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    style={{ accentColor: settings.brandColor }}
                  />
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>Light (10%)</span>
                    <span>Solid (100%)</span>
                  </div>
                </div>
              </div>

              {/* Custom Layout Position Controls (Only visible if selectedLayout is 'custom') */}
              {settings.selectedLayout === 'custom' && (
                <div className="border-t border-gray-150 pt-5 space-y-5 animate-in fade-in slide-in-from-top-3 duration-200">
                  <div className="flex items-center gap-1.5 p-3 rounded-2xl border" style={{ color: settings.brandColor, backgroundColor: `${settings.brandColor}0f`, borderColor: `${settings.brandColor}20` }}>
                    <Sliders className="w-4 h-4" />
                    <span className="text-xs font-bold">Custom Position Options</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Logo Position */}
                    <div className="space-y-1">
                      <CustomDropdown
                        value={settings.logoPosition}
                        onChange={(val) => handleInputChange('logoPosition', val)}
                        options={POSITION_OPTIONS.map(opt => ({ ...opt, icon: React.cloneElement(opt.icon, { style: { color: settings.brandColor } }) }))}
                        label="Logo Position"
                      />
                    </div>

                    {/* Brand Name Position */}
                    <div className="space-y-1">
                      <CustomDropdown
                        value={settings.namePosition}
                        onChange={(val) => handleInputChange('namePosition', val)}
                        options={POSITION_OPTIONS_WITHOUT_CENTER.map(opt => ({ ...opt, icon: React.cloneElement(opt.icon, { style: { color: settings.brandColor } }) }))}
                        label="Brand Name Position"
                      />
                    </div>

                    {/* Address & Contact Position */}
                    <div className="space-y-1">
                      <CustomDropdown
                        value={settings.addressPosition}
                        onChange={(val) => handleInputChange('addressPosition', val)}
                        options={POSITION_OPTIONS_WITHOUT_CENTER.map(opt => ({ ...opt, icon: React.cloneElement(opt.icon, { style: { color: settings.brandColor } }) }))}
                        label="Address & Contact Position"
                      />
                    </div>

                    {/* Social Icons Custom Position */}
                    <div className="space-y-1">
                      <CustomDropdown
                        value={settings.socialPosition}
                        onChange={(val) => handleInputChange('socialPosition', val)}
                        options={POSITION_OPTIONS_WITHOUT_CENTER.map(opt => ({ ...opt, icon: React.cloneElement(opt.icon, { style: { color: settings.brandColor } }) }))}
                        label="Social Icons Position"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 4: AI Config Settings */}
          {activeTab === 'ai_config' && (
            <div className="bg-white border border-gray-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-6">
              <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
                <Cpu className="w-5 h-5" style={{ color: settings.brandColor }} />
                AI Model & API Configuration
              </h2>
              
              <p className="text-xs text-gray-400">
                Choose which model to use and configure your personal API Keys. All keys are stored safely on your local device.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Text Generation Model selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">Text Content Model</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'gemini-1.5-flash', label: 'Gemini Flash', desc: 'Free Tier' },
                      { id: 'gpt-4', label: 'GPT-4', desc: 'Premium OpenAI' },
                      { id: 'mock', label: 'Mock Demo', desc: 'No API Key' },
                    ].map((m) => {
                      const isModelActive = settings.textModel === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => handleInputChange('textModel', m.id)}
                          className="flex flex-col p-2.5 rounded-xl border text-center transition"
                          style={
                            isModelActive
                              ? { backgroundColor: `${settings.brandColor}0f`, borderColor: settings.brandColor, color: settings.brandColor, fontWeight: 'bold' }
                              : { backgroundColor: '#ffffff', borderColor: '#e5e7eb', color: '#4b5563' }
                          }
                        >
                          <span className="text-xs font-bold block truncate">{m.label}</span>
                          <span className="text-[9px] text-gray-400 font-normal mt-0.5 truncate">{m.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Image Generation Model selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">Image Model</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'imagen', label: 'Imagen 3', desc: 'Gradient fallback' },
                      { id: 'dall-e-3', label: 'DALL-E 3', desc: 'OpenAI Cost' },
                      { id: 'mock', label: 'Mock Demo', desc: 'No API Key' },
                    ].map((m) => {
                      const isModelActive = settings.imageModel === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => handleInputChange('imageModel', m.id)}
                          className="flex flex-col p-2.5 rounded-xl border text-center transition"
                          style={
                            isModelActive
                              ? { backgroundColor: `${settings.brandColor}0f`, borderColor: settings.brandColor, color: settings.brandColor, fontWeight: 'bold' }
                              : { backgroundColor: '#ffffff', borderColor: '#e5e7eb', color: '#4b5563' }
                          }
                        >
                          <span className="text-xs font-bold block truncate">{m.label}</span>
                          <span className="text-[9px] text-gray-400 font-normal mt-0.5 truncate">{m.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* API Keys Configuration */}
              <div className="border-t border-gray-150 pt-5 space-y-5">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-indigo-500" />
                  API Keys Setup
                </h3>

                {/* Google Gemini API Key Input */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Google Gemini API Key</label>
                    <a
                      href="https://aistudio.google.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold hover:underline"
                      style={{ color: settings.brandColor }}
                    >
                      Get Free Gemini Key ↗
                    </a>
                  </div>
                  <div className="relative">
                    <input
                      type="password"
                      value={settings.geminiApiKey}
                      onChange={(e) => handleInputChange('geminiApiKey', e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-250 bg-gray-50 focus:bg-white focus:outline-none transition text-sm font-mono"
                    />
                    <div className="absolute left-3.5 top-3.5 text-gray-400">
                      <Lock className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400">Needed if Gemini Flash model is selected for content creation.</p>
                </div>

                {/* OpenAI API Key Input */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">OpenAI API Key</label>
                    <a
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold hover:underline"
                      style={{ color: settings.brandColor }}
                    >
                      Get OpenAI Key ↗
                    </a>
                  </div>
                  <div className="relative">
                    <input
                      type="password"
                      value={settings.openaiApiKey}
                      onChange={(e) => handleInputChange('openaiApiKey', e.target.value)}
                      placeholder="sk-proj-..."
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-250 bg-gray-50 focus:bg-white focus:outline-none transition text-sm font-mono"
                    />
                    <div className="absolute left-3.5 top-3.5 text-gray-400">
                      <Lock className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400">Needed if GPT-4 or DALL-E 3 models are selected.</p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Business Profiles */}
          {activeTab === 'businesses' && (
            <div className="space-y-6">
              {/* Business Profiles List Card */}
              <div className="bg-white border border-gray-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
                <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
                  <Building className="w-5 h-5" style={{ color: settings.brandColor }} />
                  Active Business Profiles
                </h2>
                
                <div className="space-y-4">
                  {businessesList.map((biz) => {
                    const isActive = biz.id === activeBizId;
                    return (
                      <div
                        key={biz.id}
                        style={{
                          borderColor: isActive ? settings.brandColor : undefined,
                          boxShadow: isActive ? `0 0 16px ${settings.brandColor}15` : undefined
                        }}
                        className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/30 ${
                          isActive ? 'border-2 bg-white' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Color indicator / Initials badge */}
                          <div
                            style={{
                              backgroundColor: `${biz.brandColor}1a`,
                              color: biz.brandColor,
                              borderColor: `${biz.brandColor}30`
                            }}
                            className="w-11 h-11 rounded-xl font-bold border flex items-center justify-center text-sm shadow-inner"
                          >
                            {biz.brandName ? biz.brandName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'PW'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900 text-sm">{biz.brandName}</span>
                              {isActive && (
                                <span
                                  style={{ backgroundColor: settings.brandColor }}
                                  className="text-[9px] font-extrabold text-white px-2 py-0.5 rounded-full uppercase tracking-wider"
                                >
                                  Active
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px] sm:max-w-xs">
                              {biz.email || 'No Email'} • {biz.phone || 'No Phone'}
                            </p>
                          </div>
                        </div>

                        {/* Card Actions */}
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
                          {!isActive ? (
                            <button
                              onClick={() => handleActivateBusiness(biz.id)}
                              className="px-3.5 py-1.5 rounded-lg border border-gray-250 text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 transition"
                            >
                              Activate
                            </button>
                          ) : (
                            <span
                              style={{ color: settings.brandColor, backgroundColor: `${settings.brandColor}12` }}
                              className="px-3.5 py-1.5 rounded-lg text-xs font-bold"
                            >
                              Current Workspace
                            </span>
                          )}
                          <button
                            onClick={() => handleDeleteBusiness(biz.id, biz.brandName)}
                            disabled={businessesList.length <= 1}
                            className={`p-2 rounded-lg transition ${
                              businessesList.length <= 1
                                ? 'text-gray-300 cursor-not-allowed bg-gray-50'
                                : 'text-rose-500 hover:bg-rose-50 hover:text-rose-700'
                            }`}
                            title="Delete Business Profile"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add Business Profile Card */}
              <div className="bg-white border border-gray-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
                <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
                  <Plus className="w-5 h-5" style={{ color: settings.brandColor }} />
                  Create New Profile
                </h2>

                <form onSubmit={handleAddBusiness} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Business Name */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Business Name *</label>
                      <input
                        type="text"
                        required
                        value={newBizName}
                        onChange={(e) => setNewBizName(e.target.value)}
                        placeholder="e.g. Acme Corporation"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-250 bg-gray-50 focus:bg-white focus:outline-none transition text-sm focus:border-indigo-400"
                        style={{ '--tw-focus-ring-color': settings.brandColor }}
                      />
                    </div>

                    {/* Brand Color selection */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Brand Accent Color</label>
                      <div className="flex gap-2">
                        <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-gray-250 cursor-pointer shadow-inner flex-shrink-0">
                          <input
                            type="color"
                            value={newBizColor}
                            onChange={(e) => setNewBizColor(e.target.value)}
                            className="absolute inset-0 w-full h-full scale-150 cursor-pointer opacity-100 border-none bg-none p-0"
                          />
                        </div>
                        <input
                          type="text"
                          value={newBizColor}
                          onChange={(e) => setNewBizColor(e.target.value)}
                          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-250 bg-gray-50 focus:bg-white focus:outline-none transition text-sm font-mono uppercase"
                          placeholder="#4f46e5"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Contact Number */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Phone / WhatsApp</label>
                      <input
                        type="text"
                        value={newBizPhone}
                        onChange={(e) => setNewBizPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-250 bg-gray-50 focus:bg-white focus:outline-none transition text-sm"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Email Address</label>
                      <input
                        type="email"
                        value={newBizEmail}
                        onChange={(e) => setNewBizEmail(e.target.value)}
                        placeholder="hello@acme.com"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-250 bg-gray-50 focus:bg-white focus:outline-none transition text-sm"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Business Address</label>
                    <textarea
                      value={newBizAddress}
                      onChange={(e) => setNewBizAddress(e.target.value)}
                      placeholder="123 Corporate Tower, Tech Park, India"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-250 bg-gray-50 focus:bg-white focus:outline-none transition text-sm h-16 resize-none"
                    />
                  </div>

                  {/* Add Button */}
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      style={{ backgroundColor: settings.brandColor, boxShadow: `0 4px 12px ${settings.brandColor}20` }}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-xs font-bold hover:brightness-110 transition shadow-md animate-in fade-in"
                    >
                      <Plus className="w-4 h-4" />
                      Add Profile & Switch
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Live Visual Preview (5 Cols) */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
              <Eye className="w-4 h-4" style={{ color: settings.brandColor }} />
              Live Watermark Preview
            </span>
            <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200">
              <button
                onClick={() => setPreviewMode('image')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition flex items-center gap-1 ${
                  previewMode === 'image'
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
                style={previewMode === 'image' ? { color: settings.brandColor } : {}}
              >
                <Image className="w-3.5 h-3.5" />
                Image
              </button>
              <button
                onClick={() => setPreviewMode('video')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition flex items-center gap-1 ${
                  previewMode === 'video'
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
                style={previewMode === 'video' ? { color: settings.brandColor } : {}}
              >
                <Play className="w-3.5 h-3.5" />
                Video
              </button>
            </div>
          </div>

          {/* Interactive Social Media Visualizer Card */}
          <div className="relative aspect-square w-full rounded-[24px] overflow-hidden border border-gray-300 shadow-xl bg-slate-900 group">
            {/* Visualizer Background */}
            {previewMode === 'image' ? (
              <img
                src="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600&auto=format&fit=crop"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80"
                alt="Post Background Mockup"
              />
            ) : (
              <div className="relative w-full h-full">
                <img
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=600&auto=format&fit=crop"
                  className="w-full h-full object-cover opacity-60"
                  alt="Video Background Mockup"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 animate-pulse cursor-pointer">
                    <Play className="w-7 h-7 fill-white translate-x-0.5" />
                  </div>
                </div>
                <div className="absolute bottom-20 left-6 bg-red-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  VIDEO PLAYING
                </div>
              </div>
            )}

            {/* Banner Layout Elements Container */}
            {settings.watermarkEnabled && (settings.selectedLayout === 'footer' || settings.selectedLayout === 'header') && (
              <div className={layoutStyles.bannerContainer?.position} style={layoutStyles.bannerContainer?.style}>
                {/* Logo in Banner */}
                {settings.showLogo && (
                  <div className={layoutStyles.logo.position}>
                    {selectedLogoUrl ? (
                      <img src={selectedLogoUrl} style={layoutStyles.logo.style} className="object-contain" alt="Logo" />
                    ) : (
                      <div className="text-[10px] font-black text-slate-800 bg-white rounded flex items-center justify-center" style={{ width: '28px', height: '28px' }}>
                        {getInitials(settings.brandName)}
                      </div>
                    )}
                  </div>
                )}

                {/* Text Details in Banner */}
                <div className="flex-1 min-w-0 text-left">
                  {settings.showName && (
                    <div className="font-extrabold text-xs tracking-tight truncate">{settings.brandName}</div>
                  )}
                  {settings.showContact && (
                    <div className="text-[9px] text-white/85 truncate font-medium">
                      {[settings.phone, settings.email, settings.address].filter(Boolean).join(' • ')}
                    </div>
                  )}
                </div>

                {/* Social Media Icons in Banner */}
                {settings.showSocials && (
                  <div className="flex gap-1.5 flex-shrink-0">
                    {Object.keys(settings.activeSocials).map((platform) => {
                      if (!settings.activeSocials[platform]) return null;
                      return (
                        <div key={platform} className="w-6 h-6 rounded-md bg-white/10 hover:bg-white/25 flex items-center justify-center border border-white/5 transition" title={platform}>
                          <SocialIcon platform={platform} size={11} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Classic / Modern / Custom Layout Elements */}
            {settings.watermarkEnabled && settings.selectedLayout !== 'footer' && settings.selectedLayout !== 'header' && (
              <>
                {/* 1. Brand Logo */}
                {settings.showLogo && (
                  <div className={layoutStyles.logo.position}>
                    {selectedLogoUrl ? (
                      <img src={selectedLogoUrl} style={layoutStyles.logo.style} className="rounded-xl object-contain shadow-md" alt="Logo" />
                    ) : (
                      settings.selectedLayout === 'modern' ? (
                        <div className="font-extrabold text-white/20 border-4 border-white/10 rounded-full flex items-center justify-center select-none" style={{ width: '100px', height: '100px', fontSize: '28px' }}>
                          {getInitials(settings.brandName)}
                        </div>
                      ) : (
                        <div className="font-extrabold text-white rounded-xl flex items-center justify-center shadow-lg border border-white/15" style={{ ...layoutStyles.logo.style, height: `${settings.logoSize}px`, backgroundColor: settings.brandColor }}>
                          {getInitials(settings.brandName)}
                        </div>
                      )
                    )}
                  </div>
                )}

                {/* 2. Brand Name & Contact Address Card */}
                {(settings.showName || settings.showContact) && (
                  <div className={layoutStyles.nameAndAddress.position} style={layoutStyles.nameAndAddress.style}>
                    {settings.showName && (
                      <h4 className="font-extrabold text-sm tracking-tight text-white mb-1 drop-shadow-sm select-none">
                        {settings.brandName}
                      </h4>
                    )}
                    {settings.showContact && (
                      <div className="space-y-0.5 text-[10px] text-white/90 font-medium">
                        <p className="flex items-center gap-1 text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          {settings.phone}
                        </p>
                        <p className="truncate text-white/80">{settings.email}</p>
                        <p className="truncate text-white/70 text-[9px] border-t border-white/10 mt-1 pt-1">{settings.address}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Social Media Handles Bar */}
                {settings.showSocials && (
                  <div className={layoutStyles.socials.position} style={layoutStyles.socials.style}>
                    {Object.keys(settings.activeSocials).map((platform) => {
                      if (!settings.activeSocials[platform]) return null;
                      return (
                        <div key={platform} className="w-8 h-8 rounded-lg bg-black/40 hover:bg-black/60 backdrop-blur-md flex items-center justify-center border border-white/10 transition cursor-pointer" title={platform}>
                          <SocialIcon platform={platform} size={13} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* Additional details for Header layout (shows address separately at bottom) */}
            {settings.watermarkEnabled && settings.selectedLayout === 'header' && (
              <>
                {settings.showContact && (
                  <div className={layoutStyles.addressCorner?.position} style={layoutStyles.addressCorner?.style}>
                    <p className="flex items-center gap-1 text-emerald-400 font-bold mb-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {settings.phone}
                    </p>
                    <p className="text-white/80 mb-0.5">{settings.email}</p>
                    <p className="text-white/60 text-[10px] border-t border-white/10 mt-1 pt-1">{settings.address}</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Quick Informational Tip */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex gap-3 text-xs text-gray-500">
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: settings.brandColor }} />
            <div>
              <span className="font-bold text-gray-700 block mb-0.5">Did you know?</span>
              This watermark configuration will be automatically overlaid on your newly generated posts by the AI generator.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
