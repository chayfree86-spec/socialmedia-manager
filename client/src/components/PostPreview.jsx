import React, { useState, useEffect } from 'react';
import {
  Smartphone, Monitor, X, Heart, MessageSquare,
  Send, Bookmark, MoreHorizontal, Play, Eye, Repeat2,
  BarChart2, ThumbsUp, MessageCircle as CommentIcon,
  ExternalLink, Globe, Clock, Music, Share2
} from 'lucide-react';
import SocialIcon from './SocialIcons';

const ALL_PLATFORMS = ['instagram', 'facebook', 'youtube', 'whatsapp', 'google_business', 'pinterest', 'linkedin'];

const PLATFORM_CFG = {
  instagram: {
    name: 'Instagram', color: 'from-pink-500 to-rose-500', textColor: 'text-pink-500', bg: 'bg-pink-50',
    mobile: { w: 375, h: 600 }, desktop: { w: 480, h: 700 }, ratio: '1:1', ratioW: 1, ratioH: 1,
    style: 'instagram'
  },
  facebook: {
    name: 'Facebook', color: 'from-blue-500 to-blue-700', textColor: 'text-blue-500', bg: 'bg-blue-50',
    mobile: { w: 375, h: 520 }, desktop: { w: 500, h: 580 }, ratio: '1.91:1', ratioW: 1.91, ratioH: 1,
    style: 'facebook'
  },
  youtube: {
    name: 'YouTube', color: 'from-red-500 to-red-700', textColor: 'text-red-500', bg: 'bg-red-50',
    mobile: { w: 375, h: 280 }, desktop: { w: 560, h: 340 }, ratio: '16:9', ratioW: 16, ratioH: 9,
    style: 'youtube'
  },
  whatsapp: {
    name: 'WhatsApp', color: 'from-emerald-500 to-green-600', textColor: 'text-emerald-600', bg: 'bg-emerald-50',
    mobile: { w: 320, h: 500 }, desktop: { w: 400, h: 550 }, ratio: '1:1', ratioW: 1, ratioH: 1,
    style: 'instagram'
  },
  google_business: {
    name: 'Google Biz', color: 'from-blue-400 to-sky-600', textColor: 'text-blue-600', bg: 'bg-blue-50',
    mobile: { w: 375, h: 450 }, desktop: { w: 500, h: 500 }, ratio: '1.91:1', ratioW: 1.91, ratioH: 1,
    style: 'linkedin'
  },
  pinterest: {
    name: 'Pinterest', color: 'from-red-600 to-rose-700', textColor: 'text-red-600', bg: 'bg-red-50',
    mobile: { w: 280, h: 450 }, desktop: { w: 340, h: 520 }, ratio: '2:3', ratioW: 2, ratioH: 3,
    style: 'instagram'
  },
  linkedin: {
    name: 'LinkedIn', color: 'from-blue-600 to-blue-800', textColor: 'text-blue-700', bg: 'bg-blue-50',
    mobile: { w: 375, h: 480 }, desktop: { w: 550, h: 560 }, ratio: '1.91:1', ratioW: 1.91, ratioH: 1,
    style: 'linkedin'
  },
};

export default function PostPreview({ caption, hashtags, imageUrl, videoUrl, platforms, brand, isOpen, onClose, onCaptionChange, onApprove }) {
  const [active, setActive] = useState('instagram');
  const [viewMode, setViewMode] = useState('mobile');
  const [isEditing, setIsEditing] = useState(false);
  const [editedCaption, setEditedCaption] = useState(caption || '');

  useEffect(() => {
    if (isOpen) {
      setEditedCaption(caption || '');
      setIsEditing(false); // Reset editor state when opening
    }
  }, [caption, isOpen]);

  if (!isOpen) return null;

  const cfg = PLATFORM_CFG[active];
  const w = viewMode === 'mobile' ? cfg.mobile.w : Math.min(cfg.desktop.w, 600);
  const imgH = Math.round(w * cfg.ratioH / cfg.ratioW);
  const displayCaption = editedCaption || caption || 'No caption yet...';
  const shortCaption = displayCaption.length > 150 ? displayCaption.substring(0, 150) + '...' : displayCaption;
  const tags = hashtags?.slice(0, 6) || [];
  const displayImage = imageUrl || `https://placehold.co/${w}x${imgH}/6366f1/ffffff?text=AI+Image`;
  const brandName = brand?.brand_name || 'Your Brand';
  const brandLoc = brand?.city || 'India';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-1 sm:p-2" onClick={onClose}>
      <div className="bg-white sm:rounded-2xl shadow-2xl w-full h-full sm:h-auto sm:max-h-[95vh] max-w-full sm:max-w-6xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-3 border-b bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${cfg.color} flex items-center justify-center shadow`}>
              <SocialIcon platform={active} size={20} className="brightness-0 invert" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Post Preview</h2>
              <p className="text-xs text-gray-400">{brandName} • {cfg.name} • {cfg.ratio}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg bg-gray-100 p-1">
              <button onClick={() => setViewMode('mobile')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition ${viewMode === 'mobile' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}>
                <Smartphone className="w-3.5 h-3.5" /> Mobile
              </button>
              <button onClick={() => setViewMode('desktop')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition ${viewMode === 'desktop' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}>
                <Monitor className="w-3.5 h-3.5" /> Desktop
              </button>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-200 transition">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">

          {/* Platform Tabs Sidebar */}
          <div className="lg:w-52 border-r bg-gray-50/30 p-3 space-y-1 overflow-y-auto flex-shrink-0">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2 px-2">Platforms</p>
            {ALL_PLATFORMS.map(p => {
              const c = PLATFORM_CFG[p];
              const sel = active === p;
              return (
                <button key={p} onClick={() => setActive(p)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all ${
                    sel ? 'bg-white shadow-sm border border-gray-200 font-semibold text-gray-900' : 'text-gray-500 hover:bg-white/60 hover:text-gray-700'
                  }`}>
                  <SocialIcon platform={p} size={20} className={sel ? '' : 'opacity-60'} />
                  <span className="flex-1 text-left">{c.name}</span>
                  <span className="text-[10px] text-gray-400 font-mono">{c.ratio}</span>
                </button>
              );
            })}
          </div>

          {/* Preview Area */}
          <div className="flex-1 flex items-start justify-center p-4 lg:p-6 bg-gray-100/50 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-300" style={{ width: w, maxWidth: '100%' }}>

              {/* ============ INSTAGRAM STYLE ============ */}
              {cfg.style === 'instagram' && (
                <>
                  <div className="flex items-center gap-2.5 p-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">{brandName[0]}</div>
                    <div className="flex-1"><p className="text-xs font-semibold">{brandName}</p><p className="text-[10px] text-gray-400">{brandLoc}</p></div>
                    <MoreHorizontal className="w-5 h-5 text-gray-400" />
                  </div>
                  <div style={{ height: imgH, maxHeight: 380, background: '#f3f4f6' }}>
                    <img src={displayImage} alt="" className="w-full h-full object-cover object-center" onError={e => { e.target.src = `https://placehold.co/${w}x${imgH}/6366f1/fff?text=IG`; }} />
                  </div>
                  <div className="flex justify-between px-3 py-2">
                    <div className="flex gap-3">
                      <Heart className="w-6 h-6 cursor-pointer hover:text-red-500 transition" />
                      <MessageSquare className="w-6 h-6 cursor-pointer hover:text-gray-600 transition" />
                      <Send className="w-6 h-6 cursor-pointer hover:text-gray-600 transition" />
                    </div>
                    <Bookmark className="w-6 h-6 cursor-pointer hover:text-gray-600 transition" />
                  </div>
                  <p className="px-3 text-xs font-bold">0 likes</p>
                  <p className="px-3 py-0.5 text-xs"><b className="mr-1">{brandName}</b>{shortCaption}</p>
                  {tags.length > 0 && <div className="px-3 pb-3 flex flex-wrap gap-1"><span className="text-[10px] text-indigo-500">{tags.join(' ')}</span></div>}
                </>
              )}

              {/* ============ FACEBOOK STYLE ============ */}
              {cfg.style === 'facebook' && (
                <>
                  <div className="flex items-center gap-2.5 p-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold">{brandName[0]}</div>
                    <div>
                      <p className="text-xs font-semibold">{brandName}</p>
                      <p className="text-[10px] text-gray-400 flex items-center gap-1"><Globe className="w-2.5 h-2.5" /> Public • {brandLoc}</p>
                    </div>
                    <MoreHorizontal className="w-5 h-5 text-gray-400 ml-auto" />
                  </div>
                  <div className="px-3 pb-2"><p className="text-xs text-gray-800">{shortCaption}</p></div>
                  <div style={{ height: imgH, maxHeight: 320, background: '#f3f4f6' }}>
                    <img src={displayImage} alt="" className="w-full h-full object-cover object-center" onError={e => { e.target.src = `https://placehold.co/${w}x${imgH}/1877f2/fff?text=FB`; }} />
                  </div>
                  <div className="flex justify-between px-3 py-2 border-b">
                    <span className="text-[10px] text-gray-500">👍 0</span>
                    <span className="text-[10px] text-gray-500">0 comments • 0 shares</span>
                  </div>
                  <div className="flex border-b">
                    {['Like','Comment','Share'].map(a => (
                      <button key={a} className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[11px] text-gray-500 font-medium hover:bg-gray-50 transition">
                        {a === 'Like' && <ThumbsUp className="w-3.5 h-3.5" />}{a === 'Comment' && <CommentIcon className="w-3.5 h-3.5" />}{a === 'Share' && <Share2 className="w-3.5 h-3.5" />}{a}
                      </button>
                    ))}
                  </div>
                  {tags.length > 0 && <div className="px-3 py-2 flex flex-wrap gap-1"><span className="text-[10px] text-blue-500">{tags.join(' ')}</span></div>}
                </>
              )}

              {/* ============ TWITTER / X STYLE ============ */}
              {cfg.style === 'twitter' && (
                <>
                  <div className="flex gap-3 p-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-700 to-black flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{brandName[0]}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold">{brandName}</span>
                        <span className="text-[10px] text-gray-400">@{brandName.toLowerCase().replace(/\s/g,'')}</span>
                      </div>
                      <p className="text-xs mt-1 whitespace-pre-wrap leading-relaxed">{displayCaption}</p>
                      {tags.length > 0 && <div className="flex flex-wrap gap-1 mt-1"><span className="text-[11px] text-blue-500">{tags.slice(0,4).join(' ')}</span></div>}
                      <div className="mt-2 rounded-2xl border border-gray-200 overflow-hidden" style={{ height: Math.min(imgH, 220) }}>
                        <img src={displayImage} alt="" className="w-full h-full object-cover object-center" onError={e => { e.target.src = `https://placehold.co/${w}x${Math.min(imgH,220)}/1d9bf0/fff?text=X`; }} />
                      </div>
                      <div className="flex justify-between mt-2 pr-8">
                        {[
                          { icon: MessageSquare, count: 0, label: '' },
                          { icon: Repeat2, count: 0, label: '' },
                          { icon: Heart, count: 0, label: '' },
                          { icon: BarChart2, count: 0, label: '' },
                        ].map(({ icon: Ic, count, label }) => (
                          <button key={label || count} className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-blue-500 transition">
                            <Ic className="w-4 h-4" /> {count}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ============ LINKEDIN STYLE ============ */}
              {cfg.style === 'linkedin' && (
                <>
                  <div className="flex items-center gap-2.5 p-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white text-sm font-bold">{brandName[0]}</div>
                    <div>
                      <p className="text-xs font-semibold">{brandName}</p>
                      <p className="text-[10px] text-gray-400">{brand?.tagline || 'Business • Brand'} • {brandLoc}</p>
                      <p className="text-[10px] text-gray-400 flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> 2h ago</p>
                    </div>
                  </div>
                  <div className="px-3 pb-2">
                    <p className="text-xs text-gray-800 leading-relaxed">{displayCaption}</p>
                  </div>
                  <div style={{ height: imgH, maxHeight: 300, background: '#f3f4f6' }}>
                    <img src={displayImage} alt="" className="w-full h-full object-cover object-center" onError={e => { e.target.src = `https://placehold.co/${w}x${imgH}/0a66c2/fff?text=LI`; }} />
                  </div>
                  <div className="flex justify-between px-3 py-2 border-b">
                    <span className="text-[10px] text-gray-500">👍 0</span>
                    <span className="text-[10px] text-gray-500">0 comments</span>
                  </div>
                  <div className="flex border-b">
                    {['Like','Comment','Share'].map(a => (
                      <button key={a} className="flex-1 flex items-center justify-center gap-1 py-2 text-[11px] text-gray-500 font-medium hover:bg-gray-50 transition">
                        {a === 'Like' && <ThumbsUp className="w-3.5 h-3.5" />}{a}
                      </button>
                    ))}
                  </div>
                  {tags.length > 0 && <div className="px-3 py-2"><span className="text-[10px] text-blue-600">{tags.join(' ')}</span></div>}
                </>
              )}

              {/* ============ YOUTUBE STYLE ============ */}
              {cfg.style === 'youtube' && (
                <>
                  <div className="relative" style={{ height: imgH, maxHeight: 300, background: '#000' }}>
                    <img src={displayImage} alt="" className="w-full h-full object-cover object-center opacity-80" onError={e => { e.target.src = `https://placehold.co/${w}x${imgH}/ff0000/fff?text=YT`; }} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-red-600/90 flex items-center justify-center shadow-xl">
                        <Play className="w-7 h-7 text-white fill-white ml-1" />
                      </div>
                    </div>
                    <div className="absolute bottom-1 right-1 px-2 py-0.5 rounded bg-black/80 text-white text-[10px] font-medium">0:15</div>
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/60 text-white text-[10px]">▶ Playing</div>
                  </div>
                  <div className="p-3">
                    <div className="flex gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{brandName[0]}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold line-clamp-2">{shortCaption}</p>
                        <p className="text-[10px] text-gray-400">{brandName} • 0 views • just now</p>
                      </div>
                    </div>
                    {tags.length > 0 && <p className="text-[10px] text-blue-500 mt-1">{tags.slice(0,4).join(' ')}</p>}
                  </div>
                </>
              )}

              {/* ============ TIKTOK STYLE ============ */}
              {cfg.style === 'tiktok' && (
                <>
                  <div className="relative" style={{ height: imgH, maxHeight: 420, background: '#000' }}>
                    <img src={displayImage} alt="" className="w-full h-full object-cover object-center" onError={e => { e.target.src = `https://placehold.co/${w}x${imgH}/00f2ea/000?text=TT`; }} />
                    {/* Right sidebar icons */}
                    <div className="absolute right-2 bottom-16 flex flex-col items-center gap-5">
                      <div className="flex flex-col items-center"><div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"><Heart className="w-5 h-5 text-white" /></div><span className="text-[10px] text-white mt-0.5">0</span></div>
                      <div className="flex flex-col items-center"><div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"><MessageSquare className="w-5 h-5 text-white" /></div><span className="text-[10px] text-white mt-0.5">0</span></div>
                      <div className="flex flex-col items-center"><div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"><Share2 className="w-5 h-5 text-white" /></div><span className="text-[10px] text-white mt-0.5">Share</span></div>
                      <div className="flex flex-col items-center"><div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"><Music className="w-5 h-5 text-white" /></div></div>
                    </div>
                    {/* Bottom info */}
                    <div className="absolute bottom-2 left-3 right-16">
                      <p className="text-xs font-semibold text-white">@{brandName.toLowerCase().replace(/\s/g,'')}</p>
                      <p className="text-[11px] text-white/90 leading-snug">{shortCaption}</p>
                      <p className="text-[10px] text-white/70 flex items-center gap-1 mt-0.5"><Music className="w-3 h-3" /> Trending Sound • {brandName}</p>
                    </div>
                    <div className="absolute bottom-1 right-16 px-2 py-0.5 rounded bg-white/20 text-white text-[10px]">0 views</div>
                  </div>
                </>
              )}

            </div>
          </div>

          {/* Live Edit Side Panel */}
          {isEditing && (
            <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l bg-gray-50/50 p-4 space-y-4 overflow-y-auto flex-shrink-0 flex flex-col justify-between" onClick={e => e.stopPropagation()}>
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-700">Edit Caption</h3>
                <textarea
                  value={editedCaption}
                  onChange={(e) => {
                    setEditedCaption(e.target.value);
                    if (onCaptionChange) onCaptionChange(e.target.value);
                  }}
                  className="w-full h-64 p-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition resize-none text-xs leading-relaxed"
                  placeholder="Write your caption here..."
                />
                <p className="text-[10px] text-gray-400">Updates will reflect in the live preview in real-time.</p>
              </div>
              <button onClick={() => setIsEditing(false)}
                className="w-full py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-900 text-white text-xs font-bold transition shadow-sm">
                Done Editing
              </button>
            </div>
          )}

        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-5 py-3 border-t bg-gray-50/50">
          <div className="flex items-center gap-3 text-[11px] text-gray-400 flex-wrap">
            <span className={`flex items-center gap-1 px-2 py-1 rounded-full ${viewMode === 'mobile' ? 'bg-indigo-100 text-indigo-600 font-medium' : 'bg-gray-100'}`}>
              <Smartphone className="w-3 h-3" /> {cfg.mobile.w}×{cfg.mobile.h}
            </span>
            <span className={`flex items-center gap-1 px-2 py-1 rounded-full ${viewMode === 'desktop' ? 'bg-indigo-100 text-indigo-600 font-medium' : 'bg-gray-100'}`}>
              <Monitor className="w-3 h-3" /> {cfg.desktop.w}×{cfg.desktop.h}
            </span>
            <span className="px-2 py-1 rounded-full bg-gray-100">📐 {cfg.ratio}</span>
            <span className="hidden sm:inline px-2 py-1 rounded-full bg-gray-100 capitalize">{cfg.style} layout</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setIsEditing(!isEditing)}
              className={`px-4 py-2 rounded-xl border text-sm font-semibold transition ${
                isEditing ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}>
              {isEditing ? 'Close Editor' : 'Edit Content'}
            </button>
            <button onClick={onApprove}
              className="gradient-btn text-white px-5 py-2 rounded-xl text-sm font-semibold shadow hover:opacity-95 transition">
              Approve & Schedule
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
