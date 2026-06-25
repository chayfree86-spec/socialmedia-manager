import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Wand2, Sparkles, ArrowRight, TrendingUp, Heart, Eye,
  Share2, Link2, Unlink, Users, Send, BarChart2,
  RefreshCw, ExternalLink, CheckCircle2, Plus, Camera
} from 'lucide-react';
import SocialIcon from '../components/SocialIcons';

const API_BASE = '/api';

// ⭐ 7 Platforms with real SVG icons
const ALL_PLATFORMS = [
  { id: 'instagram', name: 'Instagram', color: '#e11d48', gradient: 'from-pink-500 to-rose-600', textColor: 'text-pink-600', bgLight: 'bg-pink-50', border: 'border-pink-200', priority: true },
  { id: 'facebook', name: 'Facebook', color: '#2563eb', gradient: 'from-blue-500 to-blue-700', textColor: 'text-blue-600', bgLight: 'bg-blue-50', border: 'border-blue-200', priority: true },
  { id: 'youtube', name: 'YouTube', color: '#dc2626', gradient: 'from-red-500 to-red-700', textColor: 'text-red-600', bgLight: 'bg-red-50', border: 'border-red-200', priority: true },
  { id: 'whatsapp', name: 'WhatsApp', color: '#25D366', gradient: 'from-emerald-500 to-green-600', textColor: 'text-emerald-600', bgLight: 'bg-emerald-50', border: 'border-emerald-200', priority: true },
  { id: 'google_business', name: 'Google Business', color: '#4285F4', gradient: 'from-blue-400 to-sky-600', textColor: 'text-blue-600', bgLight: 'bg-blue-50', border: 'border-blue-200', priority: true },
  { id: 'pinterest', name: 'Pinterest', color: '#E60023', gradient: 'from-red-600 to-rose-700', textColor: 'text-red-600', bgLight: 'bg-red-50', border: 'border-red-200', priority: false },
  { id: 'linkedin', name: 'LinkedIn', color: '#0a66c2', gradient: 'from-blue-600 to-blue-800', textColor: 'text-blue-700', bgLight: 'bg-blue-50', border: 'border-blue-200', priority: false },
];

// Static color maps for Tailwind JIT compatibility
const STAT_COLORS = {
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-600' },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [recentPosts, setRecentPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const businessId = localStorage.getItem('socialai_active_business_id') || '1';
      const [accRes, postRes] = await Promise.all([
        axios.get(`${API_BASE}/social.php?business_id=${businessId}&user_id=default-user`),
        axios.get(`${API_BASE}/posts.php?business_id=${businessId}&limit=20`)
      ]);
      if (accRes.data.success && accRes.data.accounts?.length > 0) {
        setAccounts(accRes.data.accounts);
      } else {
        setAccounts([]);
      }
      if (postRes.data.success && postRes.data.posts?.length > 0) {
        setRecentPosts(postRes.data.posts);
      } else {
        setRecentPosts([]);
      }
    } catch {
      setAccounts([]);
      setRecentPosts([]);
    }
    finally { setLoading(false); }
  };

  // Get latest post for a specific platform
  const getLatestPost = (platformId) => {
    return recentPosts.find(p => 
      p.platforms?.includes(platformId) || 
      (Array.isArray(p.platforms) && p.platforms[0] === platformId)
    );
  };

  // Merge platform configs with live account data + recent posts
  const cards = ALL_PLATFORMS.map(p => {
    const acc = accounts.find(a => a.platform === p.id);
    const linked = !!acc && acc.status === 'connected';
    const latestPost = linked ? getLatestPost(p.id) : null;
    return {
      ...p,
      linked,
      accountName: linked ? acc.accountName : null,
      profileUrl: linked ? acc.profileUrl : null,
      followers: linked ? (acc.followers || acc.stats?.followers || 0).toLocaleString() : '0',
      posts: linked ? (acc.posts_count || acc.stats?.posts || 0) : 0,
      likes: linked ? (latestPost?.engagement_likes || '0') : '0',
      latestCaption: latestPost?.caption || null,
      latestImage: latestPost?.imageUrl || null,
    };
  });

  const linkedCount = cards.filter(c => c.linked).length;
  const totalFollowers = cards.reduce((s, c) => s + (c.linked ? parseInt(c.followers.replace(/,/g, '')) || 0 : 0), 0);
  const totalPosts = cards.reduce((s, c) => s + (c.linked ? c.posts : 0), 0);
  const totalEngagement = cards.reduce((s, c) => s + (c.linked ? parseInt(c.likes.replace(/,/g, '')) || 0 : 0), 0);

  return (
    <div className="p-3 sm:p-4 lg:p-6 w-full space-y-6">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">AI-powered social media command center</p>
        </div>
        <button onClick={() => navigate('/generate')}
          className="gradient-btn text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-lg self-start">
          <Wand2 className="w-4 h-4" /> Create New Post
        </button>
      </div>

      {/* ── STATS ROW ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Followers', value: totalFollowers.toLocaleString(), icon: Users, col: 'indigo' },
          { label: 'Connected', value: `${linkedCount}/7`, icon: CheckCircle2, col: 'emerald' },
          { label: 'Total Posts', value: totalPosts, icon: Send, col: 'amber' },
          { label: 'Engagement', value: totalEngagement.toLocaleString(), icon: TrendingUp, col: 'rose' },
        ].map(s => {
          const sc = STAT_COLORS[s.col];
          return (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{s.label}</span>
              <div className={`w-9 h-9 rounded-lg ${sc.bg} flex items-center justify-center`}>
                {React.createElement(s.icon, { className: `w-4 h-4 ${sc.text}` })}
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
          </div>
          );
        })}
      </div>

      {/* ── PLATFORM CARDS ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Share2 className="w-4 h-4 text-indigo-500" /> Connected Platforms
          </h2>
          <button onClick={() => navigate('/accounts')}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Connect More
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {cards.map(card => {
            const linked = card.linked;

            const handleCardClick = () => {
              if (linked && card.profileUrl) {
                window.open(card.profileUrl, '_blank', 'noopener,noreferrer');
              } else if (linked && card.accountName) {
                // WhatsApp wa.me link or generic
                const waMatch = card.accountName.match(/\+?\d{10,15}/);
                if (card.id === 'whatsapp' && waMatch) {
                  window.open(`https://wa.me/${waMatch[0].replace(/[^0-9]/g, '')}`, '_blank');
                } else {
                  navigate('/accounts');
                }
              } else {
                navigate('/accounts');
              }
            };

            return (
              <div key={card.id} onClick={handleCardClick}
                className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col cursor-pointer"
                style={{ minHeight: 280 }}>

                <div className="p-4 flex flex-col flex-1">
                  {/* Header: Icon + Name + Status */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-zinc-150 bg-zinc-50/50 flex-shrink-0">
                      <SocialIcon platform={card.id} size={22} className={linked ? '' : 'opacity-40 grayscale'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-zinc-950 text-sm truncate">{card.name}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {linked ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span className="text-xs font-semibold text-emerald-600 truncate max-w-[120px]">{card.accountName || 'Connected'}</span>
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                            <span className="text-xs text-zinc-400">Not connected</span>
                          </>
                        )}
                      </div>
                    </div>
                    {linked && card.profileUrl && (
                      <a href={card.profileUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-lg hover:bg-zinc-50 flex-shrink-0 border border-transparent hover:border-zinc-200">
                        <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                      </a>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="rounded-xl p-2.5 bg-zinc-50 border border-zinc-150">
                      <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider mb-0.5">Followers</p>
                      <p className={`text-base font-bold ${linked ? 'text-zinc-800' : 'text-zinc-400'}`}>
                        {linked ? card.followers : '—'}
                      </p>
                    </div>
                    <div className="rounded-xl p-2.5 bg-zinc-50 border border-zinc-150">
                      <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider mb-0.5">Posts</p>
                      <p className={`text-base font-bold ${linked ? 'text-zinc-800' : 'text-zinc-400'}`}>
                        {linked ? card.posts : '—'}
                      </p>
                    </div>
                  </div>

                  {/* Latest Post Preview */}
                  {linked ? (
                    card.latestImage ? (
                      <div className="relative rounded-xl overflow-hidden bg-zinc-100 flex-1 min-h-[100px]">
                        <img src={card.latestImage} alt="" className="w-full h-full object-cover object-center absolute inset-0"
                          onError={e => { e.target.style.display = 'none'; }} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-2.5">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1 text-white text-[11px]"><Heart className="w-3 h-3 fill-white text-rose-500" /> {card.likes}</span>
                            <span className="text-[9px] text-white/90 bg-white/20 px-2 py-0.5 rounded-md font-semibold uppercase tracking-wider">Latest</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 flex-1 flex flex-col items-center justify-center min-h-[100px] gap-2">
                        <Camera className="w-8 h-8 text-zinc-300" />
                        <p className="text-xs text-zinc-400 font-medium">No posts yet</p>
                      </div>
                    )
                  ) : (
                    <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 flex-1 flex flex-col items-center justify-center min-h-[100px] gap-2">
                      <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center border border-zinc-150">
                        <Camera className="w-3.5 h-3.5 text-zinc-400" />
                      </div>
                      <p className="text-xs text-zinc-400 font-medium">No posts yet</p>
                      <button onClick={(e) => { e.stopPropagation(); navigate('/accounts'); }}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-850 transition">
                        + Connect Account
                      </button>
                    </div>
                  )}
                </div>

                {/* Bottom Action */}
                <div className="px-4 pb-4 pt-1 mt-auto">
                  <button
                    onClick={(e) => { e.stopPropagation(); linked ? navigate('/generate') : navigate('/accounts'); }}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold border transition-all duration-300 flex items-center justify-center gap-1.5 shadow-sm text-white ${
                      linked
                        ? `bg-gradient-to-r ${card.gradient} border-transparent hover:opacity-90 hover:shadow-md`
                        : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                    }`}>
                    {linked ? <><Sparkles className="w-3.5 h-3.5" /> Create Post</> : <><Link2 className="w-3.5 h-3.5" /> Link Account</>}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── QUICK GENERATE ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-500" /> Quick Generate
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {[
            { e: '🎉', t: 'Product Launch' },
            { e: '💡', t: 'Motivation' },
            { e: '🍕', t: 'Food Review' },
            { e: '💪', t: 'Fitness' },
            { e: '🎬', t: 'BTS Content' },
            { e: '🛍️', t: 'Flash Sale' },
          ].map(({ e, t }) => (
            <button key={t} onClick={() => navigate('/generate', { state: { prompt: t } })}
              className="flex flex-col items-center gap-1 p-3 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/50 transition text-center group">
              <span className="text-2xl">{e}</span>
              <span className="text-[11px] font-medium text-gray-600 group-hover:text-indigo-600 leading-tight">{t}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}


