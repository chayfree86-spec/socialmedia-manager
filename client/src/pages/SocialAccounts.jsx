import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Link2, Plus, Trash2, Edit3, Check, X, ExternalLink,
  CheckCircle2, Eye, EyeOff
} from 'lucide-react';
import SocialIcon from '../components/SocialIcons';

const API_BASE = '/api';

// Platform-specific required fields for connecting each platform
const PLATFORM_FIELDS = {
  instagram: {
    name: 'Instagram', fields: [
      { key: 'accountName', label: 'Instagram Username', placeholder: '@yourhandle', required: true },
      { key: 'profileUrl', label: 'Profile URL', placeholder: 'https://instagram.com/yourhandle' },
      { key: 'accessToken', label: 'Instagram Graph API Token', placeholder: 'IGQVJ...', hint: 'Facebook Developer → Graph API Explorer → Generate Token' },
      { key: 'appId', label: 'Instagram Business Account ID', placeholder: '178414...' },
    ]
  },
  facebook: {
    name: 'Facebook', fields: [
      { key: 'accountName', label: 'Facebook Page Name', placeholder: 'Your Brand Page', required: true },
      { key: 'profileUrl', label: 'Page URL', placeholder: 'https://facebook.com/yourpage' },
      { key: 'accessToken', label: 'Page Access Token', placeholder: 'EAABwz...', hint: 'Facebook Developer → Graph API → Generate Page Token' },
      { key: 'appId', label: 'Facebook App ID', placeholder: '123456789' },
      { key: 'appSecret', label: 'Facebook App Secret', placeholder: 'abc123...' },
    ]
  },
  youtube: {
    name: 'YouTube', fields: [
      { key: 'accountName', label: 'YouTube Channel Name', placeholder: 'Your Brand', required: true },
      { key: 'profileUrl', label: 'Channel URL', placeholder: 'https://youtube.com/@yourbrand' },
      { key: 'accessToken', label: 'YouTube API Key / OAuth Token', placeholder: 'AIzaSy...', hint: 'Google Cloud Console → YouTube Data API v3' },
      { key: 'appId', label: 'Google OAuth Client ID', placeholder: 'xxx.apps.googleusercontent.com' },
    ]
  },
  whatsapp: {
    name: 'WhatsApp', fields: [
      { key: 'accountName', label: 'WhatsApp Phone Number', placeholder: '+91 98765 43210', required: true },
      { key: 'profileUrl', label: 'WhatsApp Link', placeholder: 'https://wa.me/919876543210' },
      { key: 'accessToken', label: 'WhatsApp Cloud API Token', placeholder: 'EAAJ...', hint: 'Meta Developer → WhatsApp → Setup → Generate Token' },
      { key: 'appId', label: 'Phone Number ID', placeholder: '123456789...' },
      { key: 'appSecret', label: 'WABA ID', placeholder: 'WhatsApp Business Account ID' },
    ]
  },
  google_business: {
    name: 'Google Business', fields: [
      { key: 'accountName', label: 'Business Name', placeholder: 'Your Brand Store', required: true },
      { key: 'profileUrl', label: 'Google Maps / Business URL', placeholder: 'https://maps.google.com/...' },
      { key: 'accessToken', label: 'Google Business API Key', placeholder: 'AIzaSy...', hint: 'Google Cloud Console → Business Profile API' },
      { key: 'appId', label: 'Place ID', placeholder: 'ChIJ...' },
    ]
  },
  pinterest: {
    name: 'Pinterest', fields: [
      { key: 'accountName', label: 'Pinterest Username', placeholder: 'yourbrand', required: true },
      { key: 'profileUrl', label: 'Profile URL', placeholder: 'https://pinterest.com/yourbrand' },
      { key: 'accessToken', label: 'Pinterest API Token', placeholder: 'pina...', hint: 'Pinterest Developer → Create App → Generate Token' },
    ]
  },
  linkedin: {
    name: 'LinkedIn', fields: [
      { key: 'accountName', label: 'LinkedIn Company Name', placeholder: 'Your Brand', required: true },
      { key: 'profileUrl', label: 'Company Page URL', placeholder: 'https://linkedin.com/company/yourbrand' },
      { key: 'accessToken', label: 'LinkedIn OAuth Token', placeholder: 'AQV...', hint: 'LinkedIn Developer → Create App → OAuth 2.0' },
      { key: 'appId', label: 'LinkedIn Client ID', placeholder: '86...' },
      { key: 'appSecret', label: 'LinkedIn Client Secret', placeholder: '...' },
    ]
  },
  twitter: {
    name: 'Twitter (X)', fields: [
      { key: 'accountName', label: 'Twitter Handle', placeholder: '@yourhandle', required: true },
      { key: 'profileUrl', label: 'Profile URL', placeholder: 'https://twitter.com/yourhandle' },
      { key: 'accessToken', label: 'API Bearer Token / OAuth Token', placeholder: 'AAAA...', hint: 'X Developer Portal → Keys and Tokens' },
      { key: 'appId', label: 'Client ID / API Key', placeholder: 'X Client ID' },
      { key: 'appSecret', label: 'Client Secret / API Secret', placeholder: 'X Client Secret' },
    ]
  },
  tiktok: {
    name: 'TikTok', fields: [
      { key: 'accountName', label: 'TikTok Username', placeholder: '@yourhandle', required: true },
      { key: 'profileUrl', label: 'Profile URL', placeholder: 'https://tiktok.com/@yourhandle' },
      { key: 'accessToken', label: 'TikTok Creator API Access Token', placeholder: 'act...', hint: 'TikTok for Developers → Login Kit' },
    ]
  },
  threads: {
    name: 'Threads', fields: [
      { key: 'accountName', label: 'Threads Username', placeholder: '@yourhandle', required: true },
      { key: 'profileUrl', label: 'Profile URL', placeholder: 'https://threads.net/@yourhandle' },
      { key: 'accessToken', label: 'Threads API Token', placeholder: 'THV...', hint: 'Meta Developer → Threads API' },
    ]
  },
  custom_platform: {
    name: 'Other (Custom)', fields: [
      { key: 'appId', label: 'Custom Platform Name', placeholder: 'e.g. TikTok, Reddit, Threads', required: true },
      { key: 'accountName', label: 'Account Username/Name', placeholder: 'e.g. @yourhandle', required: true },
      { key: 'profileUrl', label: 'Profile URL', placeholder: 'https://platform.com/yourhandle' },
      { key: 'accessToken', label: 'API Access Token / Key (Optional)', placeholder: 'token...' },
    ]
  },
};

export default function SocialAccounts() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showTokens, setShowTokens] = useState({});
  const [selectedPlatform, setSelectedPlatform] = useState('instagram');

  const [form, setForm] = useState({
    accountName: '', profileUrl: '', accessToken: '',
    appId: '', appSecret: '', notes: ''
  });

  useEffect(() => { fetchAccounts(); }, []);

  const fetchAccounts = async () => {
    try {
      const businessId = localStorage.getItem('socialai_active_business_id') || '1';
      const { data } = await axios.get(`${API_BASE}/social.php?business_id=${businessId}`);
      if (data.success) setAccounts(data.accounts);
    } catch { setAccounts([]); }
    finally { setLoading(false); }
  };

  const resetForm = () => {
    setForm({ accountName: '', profileUrl: '', accessToken: '', appId: '', appSecret: '', notes: '' });
    setEditingId(null);
  };

  const handlePlatformSelect = (key) => {
    setSelectedPlatform(key);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cfg = PLATFORM_FIELDS[selectedPlatform];
    const reqField = cfg.fields.find(f => f.required);
    if (reqField && !form[reqField.key]?.trim()) {
      toast.error(`${reqField.label} required hai!`);
      return;
    }

    const businessId = localStorage.getItem('socialai_active_business_id') || '1';
    const payload = { platform: selectedPlatform, business_id: businessId, ...form };

    try {
      if (editingId) {
        const { data } = await axios.put(`${API_BASE}/social.php?id=${editingId}&business_id=${businessId}`, payload);
        if (data.success) { toast.success('Account updated! ✅'); setAccounts(prev => prev.map(a => a._id === editingId ? data.account : a)); }
      } else {
        const { data } = await axios.post(`${API_BASE}/social.php?action=connect&business_id=${businessId}`, payload);
        if (data.success) { toast.success(data.message); setAccounts(prev => [data.account, ...prev]); }
      }
      resetForm(); setShowForm(false);
    } catch (error) {
      const msg = error.response?.data?.error || 'Kuch error aaya';
      toast.error(msg);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Disconnect this account?')) return;
    const businessId = localStorage.getItem('socialai_active_business_id') || '1';
    try { await axios.delete(`${API_BASE}/social.php?id=${id}&business_id=${businessId}`); } catch {}
    setAccounts(prev => prev.filter(a => a._id !== id));
    toast.success('Account disconnected');
  };

  const handleEdit = (acc) => {
    setSelectedPlatform(acc.platform);
    setForm({
      accountName: acc.accountName || '', profileUrl: acc.profileUrl || '',
      accessToken: acc.accessToken || '', appId: acc.appId || '',
      appSecret: acc.appSecret || '', notes: acc.notes || ''
    });
    setEditingId(acc._id);
    setShowForm(true);
  };

  const toggleToken = (id) => setShowTokens(prev => ({ ...prev, [id]: !prev[id] }));
  const copyToClipboard = (text) => { navigator.clipboard.writeText(text); toast.success('Copied! 📋'); };

  const connectedCount = accounts.filter(a => a.status === 'connected').length;
  const currentCfg = PLATFORM_FIELDS[selectedPlatform];

  return (
    <div className="p-3 sm:p-4 lg:p-6 w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Link2 className="w-8 h-8 text-indigo-500" /> Social Accounts
          </h1>
          <p className="text-gray-500 mt-1">Connect to real platform APIs — post in just one click!</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="gradient-btn text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-lg">
          <Plus className="w-5 h-5" /> Connect Account
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border shadow-sm text-center"><p className="text-3xl font-bold">{connectedCount}</p><p className="text-xs text-gray-400">Connected</p></div>
        <div className="bg-white rounded-2xl p-4 border shadow-sm text-center"><p className="text-3xl font-bold">7</p><p className="text-xs text-gray-400">Platforms</p></div>
        <div className="bg-white rounded-2xl p-4 border shadow-sm text-center"><p className="text-3xl font-bold">{accounts.length}</p><p className="text-xs text-gray-400">Linked</p></div>
        <div className="bg-white rounded-2xl p-4 border shadow-sm text-center"><p className="text-3xl font-bold text-emerald-500">{connectedCount}</p><p className="text-xs text-gray-400">Active</p></div>
      </div>

      {/* Connect Form */}
      {showForm && (
        <div className="bg-white rounded-2xl p-6 border-2 border-indigo-200 shadow-lg">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold flex items-center gap-2">
              {editingId ? <Edit3 className="w-5 h-5 text-amber-500" /> : <Plus className="w-5 h-5 text-emerald-500" />}
              {editingId ? 'Edit Account' : `Connect ${currentCfg.name} Account`}
            </h2>
            <button onClick={() => { setShowForm(false); resetForm(); }} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-400" /></button>
          </div>

          {/* Platform Selector */}
          {!editingId && (
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-600 mb-2">Select Platform</label>
              <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-11 gap-2">
                {Object.entries(PLATFORM_FIELDS).map(([key, cfg]) => (
                  <button key={key} type="button" onClick={() => handlePlatformSelect(key)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                      selectedPlatform === key ? 'border-indigo-400 bg-indigo-50' : 'border-gray-100 hover:border-gray-200'
                    }`}>
                    <SocialIcon platform={key} size={28} badge={true} />
                    <span className="text-[10px] font-medium text-gray-600 leading-tight text-center">{cfg.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Platform-specific fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentCfg.fields.map(field => (
                <div key={field.key} className={field.key === 'accessToken' || field.key === 'appSecret' ? 'md:col-span-2' : ''}>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">
                    {field.label} {field.required && <span className="text-red-400">*</span>}
                    {field.hint && <span className="text-gray-400 font-normal text-[11px] ml-1">— {field.hint}</span>}
                  </label>
                  {field.key === 'appSecret' || field.key === 'accessToken' ? (
                    <div className="relative">
                      <input type={showTokens['new'] ? 'text' : 'password'} value={form[field.key] || ''}
                        onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition pr-10 text-sm" />
                      <button type="button" onClick={() => toggleToken('new')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showTokens['new'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  ) : (
                    <input type="text" value={form[field.key] || ''}
                      onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder} required={field.required}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition text-sm" />
                  )}
                </div>
              ))}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Notes (Optional)</label>
              <input type="text" value={form.notes || ''} onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="e.g., Business account, Client's account..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition text-sm" />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" className="gradient-btn text-white px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg">
                {editingId ? <><Check className="w-4 h-4" /> Update</> : <><Link2 className="w-4 h-4" /> Connect {currentCfg.name}</>}
              </button>
              <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
                className="px-6 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 font-medium text-gray-600 transition">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Connected Accounts */}
      {loading ? (
        <div className="text-center py-12"><div className="spinner mx-auto"></div><p className="text-gray-400 mt-4">Loading...</p></div>
      ) : accounts.length === 0 ? (
        <div className="bg-white rounded-2xl border p-12 text-center">
          <Link2 className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-500">No accounts connected!</h3>
          <p className="text-gray-400 mt-1 mb-4">Link your social media accounts to get started</p>
          <button onClick={() => { resetForm(); setShowForm(true); }}
            className="gradient-btn text-white px-6 py-3 rounded-xl font-semibold inline-flex items-center gap-2">
            <Plus className="w-5 h-5" /> Connect First Account
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map(acc => (
            <div key={acc._id} className="bg-white rounded-2xl border shadow-sm p-5 flex flex-col md:flex-row md:items-center gap-4 hover:shadow-md transition">
              <div className="flex items-center gap-4 flex-1">
                <SocialIcon platform={acc.platform} size={40} badge={true} />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{acc.accountName}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${acc.status === 'connected' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {acc.status === 'connected' ? '● Connected' : acc.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">
                    {acc.platform === 'custom_platform' ? `Custom: ${acc.appId}` : (PLATFORM_FIELDS[acc.platform]?.name || acc.platform)}
                  </p>
                  {acc.profileUrl && (
                    <a href={acc.profileUrl} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-1 mt-1">
                      <ExternalLink className="w-3 h-3" /> View Profile
                    </a>
                  )}
                  {acc.notes && <p className="text-xs text-gray-400 mt-1">📝 {acc.notes}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {acc.accessToken ? (
                  <span className="text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> API Ready</span>
                ) : (
                  <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full">Manual Only</span>
                )}
                <button onClick={() => handleEdit(acc)} className="p-2 rounded-lg hover:bg-amber-50"><Edit3 className="w-4 h-4 text-gray-400" /></button>
                <button onClick={() => handleDelete(acc._id)} className="p-2 rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


