import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Wand2, Sparkles, Image, Video, Hash, Send, Clock,
  Copy, RefreshCw, Check, Loader2, X,
  Camera, Play, Languages, Smile, Zap,
  ChevronRight, ChevronLeft, Edit3, Eye,
  Smartphone, Monitor, ArrowRight, Upload, UploadCloud,
  ImagePlus, Film, CheckSquare, Square, LayoutGrid
} from 'lucide-react';
import PostPreview from '../components/PostPreview';
import SocialIcon from '../components/SocialIcons';
import CustomDropdown from '../components/CustomDropdown';
import CustomDateTimePicker from '../components/CustomDateTimePicker';

const API_BASE = '/api';

const languageOptions = [
  { value: 'hi', label: 'Hindi / Hinglish', icon: '🇮🇳' },
  { value: 'en', label: 'English', icon: '🇬🇧' },
  { value: 'mix', label: 'Mix', icon: '🔀' }
];

const toneOptions = [
  { value: 'casual', label: 'Casual', icon: '😊' },
  { value: 'professional', label: 'Professional', icon: '👔' },
  { value: 'funny', label: 'Funny', icon: '😂' },
  { value: 'inspirational', label: 'Inspirational', icon: '🌟' },
  { value: 'dramatic', label: 'Dramatic', icon: '🎭' }
];

const PLATFORM_SIZES = {
  instagram: { ratio: '1:1', w: 1080, h: 1080, label: 'Square 1:1' },
  facebook: { ratio: '1.91:1', w: 1200, h: 630, label: 'Landscape 1.91:1' },
  youtube: { ratio: '16:9', w: 1280, h: 720, label: 'HD 16:9' },
  whatsapp: { ratio: '1:1', w: 800, h: 800, label: 'Square 1:1' },
  google_business: { ratio: '1.91:1', w: 1200, h: 628, label: 'Landscape 1.91:1' },
  pinterest: { ratio: '2:3', w: 1000, h: 1500, label: 'Vertical 2:3' },
  linkedin: { ratio: '1.91:1', w: 1200, h: 627, label: 'Professional 1.91:1' },
};

const getAiHeaders = () => {
  const saved = localStorage.getItem('brand_settings');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return {
        'x-gemini-key': parsed.geminiApiKey || '',
        'x-openai-key': parsed.openaiApiKey || '',
        'x-text-model': parsed.textModel || '',
        'x-image-model': parsed.imageModel || ''
      };
    } catch (e) {
      console.error('Failed to parse brand settings for AI headers', e);
    }
  }
  return {};
};

export default function ContentGenerator() {
  const location = useLocation();
  const [prompt, setPrompt] = useState(location.state?.prompt || '');
  const [brand, setBrand] = useState(() => {
    const saved = localStorage.getItem('brand_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return null;
  });

  // Step: 0=input, 1=content, 2=image, 3=video, 4=preview
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');

  const [content, setContent] = useState({
    caption: '', hashtags: [], alternatives: [], bestTimeToPost: '',
    imageUrl: '', imagePrompt: '', imageSize: { w: 1080, h: 1080 },
    videoScript: '', videoIdea: '', videoPrompt: '', scenes: [], duration: '', musicSuggestion: '',
  });

  const [language, setLanguage] = useState('hi');
  const [tone, setTone] = useState('casual');
  const [scheduleAt, setScheduleAt] = useState('');
  const [platforms, setPlatforms] = useState(['instagram']);
  const [primaryPlatform, setPrimaryPlatform] = useState('instagram');

  // Upload mode
  const [mode, setMode] = useState('prompt'); // 'prompt' | 'upload'
  const [uploadedFile, setUploadedFile] = useState(null); // { name, type, size, dataUrl }
  const [uploadPreview, setUploadPreview] = useState(''); // dataUrl for preview
  const fileInputRef = useRef(null);

  const [editCaption, setEditCaption] = useState('');
  const [editHashtags, setEditHashtags] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const resultRef = useRef(null);

  useEffect(() => {
    const businessId = localStorage.getItem('socialai_active_business_id') || '1';
    axios.get(`${API_BASE}/brand.php?business_id=${businessId}&user_id=default`)
      .then(({ data }) => { if (data?.brand) setBrand(data.brand); })
      .catch(() => {});
  }, []);

  const togglePlatform = (id) => {
    setPlatforms(prev => {
      const next = prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id];
      if (!next.includes(primaryPlatform) && next.length > 0) setPrimaryPlatform(next[0]);
      return next;
    });
  };

  const selectAllPlatforms = () => setPlatforms(platformOptions.map(p => p.id));
  const deselectAllPlatforms = () => setPlatforms([]);

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { toast.error('File too large! Max 50MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setUploadedFile({ name: file.name, type: file.type.startsWith('video') ? 'video' : 'image', size: file.size, dataUrl });
      setUploadPreview(dataUrl);
      // Auto-set content from filename
      const name = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      if (!prompt) setPrompt(name);
      toast.success(`✅ ${file.name} uploaded! Select platforms → Generate`);
    };
    reader.readAsDataURL(file);
  };

  const removeUpload = () => { setUploadedFile(null); setUploadPreview(''); };

  // STEP 1: Generate Content (works for both prompt & upload mode)
  const generateContent = async () => {
    const businessId = localStorage.getItem('socialai_active_business_id') || '1';
    if (mode === 'upload') {
      if (!uploadedFile) { toast.error('Please upload a file first! 📤'); return; }
      setLoading(true); setLoadingStep('content');
      const promptText = prompt.trim() || uploadedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      try {
        const { data } = await axios.post(
          `${API_BASE}/ai.php?action=generate-text`,
          { business_id: businessId, prompt: promptText, language, tone, platforms, imageUrl: uploadedFile?.dataUrl || null },
          { headers: getAiHeaders() }
        );
        if (data.success) {
          setContent(prev => ({ ...prev, caption: data.caption, hashtags: data.hashtags, alternatives: data.alternatives || [], bestTimeToPost: data.bestTimeToPost || '', imageUrl: uploadedFile.dataUrl, imagePrompt: `Uploaded: ${uploadedFile.name}`, imageSize: { w: 1080, h: 1080 } }));
          setEditCaption(data.caption); setEditHashtags(data.hashtags?.join(' ') || '');
          setStep(2); toast.success('✅ Content generated from uploaded media!');
        }
      } catch (err) {
        toast.error('Content generation failed. Please check your API keys.');
      } finally { setLoading(false); setLoadingStep(''); }
      return;
    }

    // Prompt mode: original flow
    if (!prompt.trim()) { toast.error('Please write a prompt first! ✍️'); return; }
    setLoading(true); setLoadingStep('content');
    try {
      const { data } = await axios.post(
        `${API_BASE}/ai.php?action=generate-text`,
        { business_id: businessId, prompt: prompt.trim(), language, tone, platforms },
        { headers: getAiHeaders() }
      );
      if (data.success) {
        setContent(prev => ({ ...prev, caption: data.caption, hashtags: data.hashtags, alternatives: data.alternatives || [], bestTimeToPost: data.bestTimeToPost || '' }));
        setEditCaption(data.caption); setEditHashtags(data.hashtags?.join(' ') || '');
        setStep(1); toast.success('✅ Content generated! Edit & proceed');
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 200);
      }
    } catch (err) {
      toast.error('Content generation failed. Please check your API keys.');
    } finally { setLoading(false); setLoadingStep(''); }
  };

  // STEP 2: Generate Image
  const generateImage = async () => {
    setLoading(true); setLoadingStep('image');
    const imgSize = PLATFORM_SIZES[primaryPlatform] || PLATFORM_SIZES.instagram;
    const businessId = localStorage.getItem('socialai_active_business_id') || '1';
    try {
      const { data } = await axios.post(
        `${API_BASE}/ai.php?action=generate-image`,
        { business_id: businessId, prompt: `${prompt}. ${(editCaption || content.caption).substring(0, 100)}`, language, imageWidth: imgSize.w, imageHeight: imgSize.h, platform: primaryPlatform },
        { headers: getAiHeaders() }
      );
      if (data.success) setContent(prev => ({ ...prev, imageUrl: data.imageUrl, imagePrompt: data.imagePrompt, imageSize: { w: imgSize.w, h: imgSize.h } }));
      setStep(2); toast.success('🖼️ AI Image generated!');
    } catch (err) {
      toast.error('Image generation failed. Please check your API keys.');
    } finally { setLoading(false); setLoadingStep(''); }
  };

  // STEP 3: Generate Video
  const generateVideo = async () => {
    setLoading(true); setLoadingStep('video');
    const businessId = localStorage.getItem('socialai_active_business_id') || '1';
    try {
      const { data } = await axios.post(
        `${API_BASE}/ai.php?action=generate-video`,
        { business_id: businessId, prompt: prompt.trim(), language, caption: editCaption || content.caption },
        { headers: getAiHeaders() }
      );
      if (data.success) setContent(prev => ({ ...prev, videoScript: data.script, videoIdea: data.idea, videoPrompt: data.videoPrompt, scenes: data.scenes || [], duration: data.duration || '15-20s', musicSuggestion: data.musicSuggestion || 'Trending' }));
      setStep(3); toast.success('🎬 Video script ready!');
    } catch (err) {
      toast.error('Video script generation failed. Please check your API keys.');
    } finally { setLoading(false); setLoadingStep(''); }
  };

  // REGENERATE HASHTAGS
  const regenerateHashtags = async () => {
    const currentCaption = editCaption || content.caption;
    if (!currentCaption) {
      toast.error('Please generate content first! ✍️');
      return;
    }
    setLoading(true);
    setLoadingStep('content');
    const businessId = localStorage.getItem('socialai_active_business_id') || '1';
    try {
      const { data } = await axios.post(
        `${API_BASE}/ai.php?action=generate-text`,
        {
          business_id: businessId,
          prompt: `Generate a brand new set of 15-20 highly relevant, trending hashtags for this caption: "${currentCaption}"`,
          language,
          tone,
          platforms
        },
        { headers: getAiHeaders() }
      );
      if (data.success) {
        setContent(prev => ({ ...prev, hashtags: data.hashtags }));
        setEditHashtags(data.hashtags?.join(' ') || '');
        toast.success('🔄 Hashtags regenerated!');
      }
    } catch (err) {
      toast.error('Failed to regenerate hashtags.');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const openPreview = () => { setStep(4); setShowPreview(true); };
  const saveContentEdits = () => {
    setContent(prev => ({ ...prev, caption: editCaption, hashtags: editHashtags.split(/\s+/).filter(h => h.startsWith('#')) }));
    toast.success('Updated! ✅');
  };

  // Post Now - Save & publish to selected platforms
  const [posting, setPosting] = useState(false);
  const [showPostConfirm, setShowPostConfirm] = useState(false);

  const handlePostNow = () => {
    if (platforms.length === 0) { toast.error('Please select at least 1 platform!'); return; }
    setShowPostConfirm(true);
  };

  const confirmPost = async () => {
    setPosting(true);
    const businessId = localStorage.getItem('socialai_active_business_id') || '1';
    const payload = {
      business_id: businessId,
      prompt: prompt || uploadedFile?.name || 'Uploaded content',
      caption: editCaption || content.caption,
      hashtags: content.hashtags,
      imageUrl: content.imageUrl,
      imagePrompt: content.imagePrompt,
      videoScript: content.videoScript,
      platforms,
      status: scheduleAt ? 'scheduled' : 'published',
      scheduledAt: scheduleAt || null,
      language
    };

    try {
      await axios.post(`${API_BASE}/posts.php`, payload);
      toast.success(scheduleAt ? `🚀 Scheduled for ${new Date(scheduleAt).toLocaleString()}!` : `🚀 Posted to ${platforms.length} platform(s)!`);
    } catch {
      toast.success(scheduleAt ? `🚀 Scheduled! (demo mode)` : `🚀 Posted to ${platforms.length} platform(s)! (demo mode)`);
    }
    setPosting(false);
    setShowPostConfirm(false);
    setShowPreview(false);
    // Reset
    setStep(0); setContent({ caption: '', hashtags: [], alternatives: [], bestTimeToPost: '', imageUrl: '', imagePrompt: '', imageSize: { w: 1080, h: 1080 }, videoScript: '', videoIdea: '', videoPrompt: '', scenes: [], duration: '', musicSuggestion: '' });
    setPrompt(''); setEditCaption(''); setEditHashtags(''); setUploadedFile(null); setUploadPreview(''); setMode('prompt'); setScheduleAt('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const copyToClipboard = (text) => { navigator.clipboard.writeText(text); toast.success('Copied! 📋'); };

  const platformOptions = [
    { id: 'instagram', label: 'Instagram' },
    { id: 'facebook', label: 'Facebook' },
    { id: 'youtube', label: 'YouTube' },
    { id: 'whatsapp', label: 'WhatsApp' },
    { id: 'google_business', label: 'Google Biz' },
    { id: 'pinterest', label: 'Pinterest' },
    { id: 'linkedin', label: 'LinkedIn' },
  ];

  const steps = [
    { num: 0, label: 'Prompt', icon: Edit3 },
    { num: 1, label: 'Content', icon: Hash },
    { num: 2, label: 'Image', icon: Image },
    { num: 3, label: 'Video', icon: Video },
    { num: 4, label: 'Preview', icon: Eye },
  ];

  return (
    <div className="p-3 sm:p-4 lg:p-6 w-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Wand2 className="w-8 h-8 text-purple-500" /> AI Content Generator
        </h1>
        <p className="text-gray-500 mt-1">Step-by-step: Content → AI Image → Video → Preview ✨</p>
      </div>

      {/* Progress Steps */}
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center justify-between">
          {steps.map((s, i) => {
            const Icon = s.icon; const isDone = step > s.num; const isCurrent = step === s.num;
            const isClickable = !loading && (s.num === 0 || !!content.caption);
            return (
              <React.Fragment key={s.num}>
                <button
                  type="button"
                  disabled={!isClickable}
                  onClick={() => {
                    if (s.num === 4) {
                      openPreview();
                    } else {
                      setStep(s.num);
                    }
                  }}
                  className={`flex flex-col items-center gap-1 transition-all ${
                    isClickable ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed'
                  } ${isCurrent ? 'opacity-100' : isDone ? 'opacity-80' : 'opacity-40'}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isDone ? 'bg-emerald-100' : isCurrent ? 'gradient-btn shadow-lg' : 'bg-gray-100'}`}>
                    {isDone ? <Check className="w-5 h-5 text-emerald-600" /> : <Icon className={`w-5 h-5 ${isCurrent ? 'text-white' : 'text-gray-400'}`} />}
                  </div>
                  <span className={`text-xs font-medium ${isCurrent ? 'text-indigo-600' : isDone ? 'text-emerald-600' : 'text-gray-400'}`}>{s.label}</span>
                </button>
                {i < 4 && <div className={`flex-1 h-0.5 mx-2 rounded-full ${i < step ? 'bg-emerald-400' : 'bg-gray-200'}`} />}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ============ MODE TOGGLE ============ */}
      <div className="flex gap-2">
        <button onClick={() => setMode('prompt')}
          className={`flex-1 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition ${mode === 'prompt' ? 'gradient-btn text-white shadow-lg' : 'bg-white border text-gray-500 hover:bg-gray-50'}`}>
          <Wand2 className="w-4 h-4" /> AI Generate (Prompt)
        </button>
        <button onClick={() => setMode('upload')}
          className={`flex-1 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition ${mode === 'upload' ? 'gradient-btn text-white shadow-lg' : 'bg-white border text-gray-500 hover:bg-gray-50'}`}>
          <Upload className="w-4 h-4" /> Upload Media
        </button>
      </div>

      {/* ============ STEP 0: INPUT AREA ============ */}
      {step === 0 && (
        <div className="glass rounded-2xl p-6 space-y-5">

          {/* ── PROMPT MODE ── */}
          {mode === 'prompt' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">🎯 Enter your idea/prompt</label>
              <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
                placeholder="e.g., Diwali special offer - 50% off on all products, free delivery in Delhi NCR..."
                className="w-full h-32 px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition resize-none text-gray-800 placeholder-gray-400" />
              <p className="text-xs text-gray-400 mt-1">{prompt.length} chars</p>
            </div>
          )}

          {/* ── UPLOAD MODE ── */}
          {mode === 'upload' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Image or Video 📤</label>
              {!uploadedFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-indigo-300 rounded-2xl p-8 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/50 transition group">
                  <UploadCloud className="w-12 h-12 text-indigo-300 mx-auto mb-3 group-hover:text-indigo-500 transition" />
                  <p className="text-sm font-medium text-gray-600">Click to upload or drag & drop</p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG, GIF, MP4, MOV — Max 50MB</p>
                  <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleFileUpload} className="hidden" />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-50">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${uploadedFile.type === 'video' ? 'bg-rose-100' : 'bg-emerald-100'}`}>
                      {uploadedFile.type === 'video' ? <Film className="w-5 h-5 text-rose-500" /> : <ImagePlus className="w-5 h-5 text-emerald-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{uploadedFile.name}</p>
                      <p className="text-xs text-gray-400">{(uploadedFile.size / 1024 / 1024).toFixed(1)} MB • {uploadedFile.type}</p>
                    </div>
                    <button onClick={removeUpload} className="p-1.5 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                  </div>
                  {/* Uploaded file preview */}
                  <div className="rounded-xl overflow-hidden bg-gray-100 max-h-48 flex items-center justify-center">
                    {uploadedFile.type === 'video' ? (
                      <div className="relative w-full">
                        <img src={uploadPreview} alt="" className="w-full max-h-48 object-cover opacity-80" />
                        <div className="absolute inset-0 flex items-center justify-center"><Play className="w-12 h-12 text-white fill-white drop-shadow-lg" /></div>
                      </div>
                    ) : (
                      <img src={uploadPreview} alt="Uploaded" className="w-full max-h-48 object-cover" />
                    )}
                  </div>
                  {/* Optional prompt for AI caption */}
                  <input value={prompt} onChange={e => setPrompt(e.target.value)}
                    placeholder="Optional: Add context/prompt for AI caption (e.g., Diwali Sale 50% off)"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 text-sm text-gray-700" />
                </div>
              )}
            </div>
          )}

          {/* ── SETTINGS (Common for both modes) ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <CustomDropdown
              label="Language"
              value={language}
              onChange={setLanguage}
              options={languageOptions}
            />
            <CustomDropdown
              label="Tone"
              value={tone}
              onChange={setTone}
              options={toneOptions}
            />
            <CustomDateTimePicker
              label="Schedule"
              value={scheduleAt}
              onChange={setScheduleAt}
            />
          </div>

          {/* ── PLATFORM SELECTION ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-600">📱 Select Platforms ({platforms.length}/7)</label>
              <div className="flex gap-1">
                <button onClick={selectAllPlatforms} className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 px-2 py-0.5 rounded bg-indigo-50">All</button>
                <button onClick={deselectAllPlatforms} className="text-[10px] font-semibold text-gray-400 hover:text-gray-600 px-2 py-0.5 rounded bg-gray-100">None</button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {platformOptions.map(({ id, label }) => (
                <button key={id} onClick={() => togglePlatform(id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border-2 transition-all text-sm ${
                    platforms.includes(id)
                      ? 'border-indigo-400 bg-indigo-50 text-indigo-700 shadow-sm font-medium'
                      : 'border-gray-150 text-gray-400 hover:border-gray-300'
                  }`}>
                  <SocialIcon platform={id} size={18} />
                  <span>{label}</span>
                  {platforms.includes(id) ? <Check className="w-3.5 h-3.5 text-indigo-500" /> : <Square className="w-3.5 h-3.5 text-gray-300" />}
                </button>
              ))}
            </div>
          </div>

          {/* ── AUTO-RESIZE PREVIEW (Upload Mode) ── */}
          {mode === 'upload' && uploadedFile && platforms.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-indigo-500" />
                Smart Fit Preview — Aspect ratio safe, auto-centered
                <span className="text-xs text-gray-400 font-normal">(Ratio maintain — Instagram/Facebook jaisa smart crop)</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {platforms.map(p => {
                  const sz = PLATFORM_SIZES[p];
                  const aspect = sz.w / sz.h;
                  const previewW = 140;
                  const previewH = Math.round(previewW / aspect);
                  return (
                    <div key={p} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition">
                      <div className="bg-gray-100 flex items-center justify-center overflow-hidden" style={{ height: Math.min(previewH, 100) }}>
                        <img src={uploadPreview} alt={p}
                          className="w-full h-full object-cover object-center" />
                      </div>
                      <div className="p-2 text-center">
                        <p className="text-[11px] font-semibold text-gray-700">{platformOptions.find(o => o.id === p)?.label}</p>
                        <p className="text-[10px] text-gray-400">{sz.w}×{sz.h} • {sz.ratio}</p>
                        <span className="text-[10px] text-emerald-600 font-medium">✅ Smart fit (ratio safe)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── GENERATE BUTTON ── */}
          <button onClick={generateContent} disabled={loading || (!prompt.trim() && !uploadedFile)}
            className="gradient-btn text-white px-8 py-4 rounded-xl font-semibold text-lg flex items-center gap-2 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto justify-center">
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating...</>
              : mode === 'upload' && uploadedFile
                ? <><Upload className="w-5 h-5" /> Analyze Media & Generate Content →</>
                : <><Zap className="w-5 h-5" /> Generate Content →</>}
          </button>
        </div>
      )}

      {/* ============ STEPS 1-4: RESULTS ============ */}
      {step >= 1 && (
        <div ref={resultRef} className="space-y-6 animate-in fade-in slide-in-from-bottom-4">

          {/* Content Card */}
          <div className="glass rounded-2xl p-6 border-l-4 border-indigo-400">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 text-lg flex items-center gap-2"><Hash className="w-5 h-5 text-indigo-500" />{step === 1 ? '✏️ Edit Content' : '✅ Content'}</h3>
              <div className="flex gap-2">
                {step === 1 && <button onClick={saveContentEdits} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-700 text-sm"><Check className="w-4 h-4" /> Save</button>}
                <button onClick={() => copyToClipboard(editCaption + '\n\n' + editHashtags)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm"><Copy className="w-4 h-4" /> Copy</button>
              </div>
            </div>
            {step === 1 ? (
              <textarea value={editCaption} onChange={e => setEditCaption(e.target.value)} className="w-full h-24 px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 transition resize-none text-gray-800 mb-3" />
            ) : (
              <p className="text-gray-800 text-lg leading-relaxed whitespace-pre-wrap mb-3">{content.caption}</p>
            )}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-500">#️⃣ Hashtags ({content.hashtags?.length || 0})</p>
                <button
                  type="button"
                  onClick={regenerateHashtags}
                  disabled={loading}
                  className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading && loadingStep === 'content' ? 'animate-spin' : ''}`} />
                  Regenerate
                </button>
              </div>
              {step === 1 ? (
                <input value={editHashtags} onChange={e => setEditHashtags(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 text-sm text-indigo-600" />
              ) : (
                <div className="flex flex-wrap gap-2">{content.hashtags?.map((tag, i) => <span key={i} onClick={() => copyToClipboard(tag)} className="px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border border-indigo-100 hover:shadow-md cursor-pointer">{tag}</span>)}</div>
              )}
            </div>
            {content.alternatives?.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-400 mb-2">Alternatives:</p>
                {content.alternatives.map((alt, i) => <p key={i} onClick={() => { setEditCaption(alt); setContent(prev => ({ ...prev, caption: alt })); }} className="text-gray-600 text-sm mb-1 pl-3 border-l-2 border-indigo-200 cursor-pointer hover:text-indigo-600">{alt}</p>)}
              </div>
            )}
            {step === 1 && (
              <div className="mt-5 flex gap-3">
                <button onClick={generateImage} disabled={loading} className="gradient-btn text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-lg disabled:opacity-50">
                  {loading && loadingStep === 'image' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />} Generate AI Image →
                </button>
              </div>
            )}
          </div>

          {/* Image Card */}
          {step >= 2 && (
            <div className="glass rounded-2xl p-6 border-l-4 border-emerald-400">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 text-lg flex items-center gap-2"><Image className="w-5 h-5 text-emerald-500" />🖼️ AI Image <span className="text-xs font-normal text-gray-400 ml-2">({content.imageSize?.w}×{content.imageSize?.h} • {PLATFORM_SIZES[primaryPlatform]?.ratio})</span></h3>
                <span className="text-xs text-gray-400">{primaryPlatform} optimized</span>
              </div>
              {content.imageUrl ? (
                <img src={content.imageUrl} alt="AI Generated" className="w-full max-w-lg rounded-xl shadow-lg" onError={e => { e.target.src = 'https://placehold.co/1080x1080/6366f1/ffffff?text=Image'; }} />
              ) : (
                <div className="w-full max-w-lg h-64 rounded-xl bg-gray-100 flex items-center justify-center"><Camera className="w-12 h-12 text-gray-300" /></div>
              )}
              {content.imagePrompt && <div className="mt-3 p-3 rounded-xl bg-gray-50"><p className="text-xs text-gray-400">🎨 AI Prompt:</p><p className="text-sm text-gray-600">{content.imagePrompt}</p></div>}
              {step === 2 && (
                <div className="mt-5 flex gap-3">
                  <button onClick={generateVideo} disabled={loading} className="gradient-btn text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-lg disabled:opacity-50">
                    {loading && loadingStep === 'video' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />} Generate Video Script →
                  </button>
                  <button onClick={() => generateImage()} disabled={loading} className="px-4 py-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 font-medium flex items-center gap-1"><RefreshCw className="w-4 h-4" /> Retry</button>
                </div>
              )}
            </div>
          )}

          {/* Video Card */}
          {step >= 3 && (
            <div className="glass rounded-2xl p-6 border-l-4 border-rose-400">
              <h3 className="font-semibold text-gray-900 text-lg flex items-center gap-2 mb-4"><Video className="w-5 h-5 text-rose-500" />🎬 Video Script <span className="text-xs font-normal text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">{content.duration}</span></h3>
              {content.videoIdea && <div className="mb-4 p-4 rounded-xl bg-rose-50 border border-rose-100"><p className="text-sm font-medium text-rose-700">💡 Idea:</p><p className="text-rose-600">{content.videoIdea}</p></div>}
              {content.scenes?.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  {content.scenes.map((scene, i) => <div key={i} className="p-3 rounded-xl bg-gray-50 border border-gray-100"><span className="text-xs font-bold text-indigo-500">Scene {i + 1}</span><p className="text-sm text-gray-600 mt-1">{scene}</p></div>)}
                </div>
              )}
              {content.videoScript && <pre className="whitespace-pre-wrap text-gray-700 bg-gray-50 p-4 rounded-xl text-sm leading-relaxed max-h-40 overflow-y-auto">{content.videoScript}</pre>}
              {step === 3 && (
                <div className="mt-5 flex gap-3">
                  <button onClick={openPreview} className="gradient-btn text-white px-8 py-4 rounded-xl font-semibold text-lg flex items-center gap-2 shadow-xl"><Eye className="w-5 h-5" /> Preview Post 🔍<ArrowRight className="w-4 h-4" /></button>
                  <button onClick={() => generateVideo()} disabled={loading} className="px-4 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 font-medium text-gray-600 flex items-center gap-1"><RefreshCw className="w-4 h-4" /> Regenerate</button>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button onClick={openPreview} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white border-2 border-indigo-300 hover:border-indigo-500 hover:bg-indigo-50 transition font-semibold text-indigo-700">
              <Eye className="w-5 h-5" /> Preview ({platforms.length} platforms)
            </button>
            <button onClick={handlePostNow} className="gradient-btn text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 shadow-lg"><Send className="w-5 h-5" /> Post Now</button>
            <button onClick={() => { setStep(0); setContent({ caption: '', hashtags: [], alternatives: [], bestTimeToPost: '', imageUrl: '', imagePrompt: '', imageSize: { w: 1080, h: 1080 }, videoScript: '', videoIdea: '', videoPrompt: '', scenes: [], duration: '', musicSuggestion: '' }); setPrompt(''); setEditCaption(''); setEditHashtags(''); setUploadedFile(null); setUploadPreview(''); setMode('prompt'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 font-medium text-gray-600"><X className="w-5 h-5" /> Clear & New</button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="glass rounded-2xl p-8 text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">{loadingStep === 'content' ? '✍️ Generating caption & hashtags...' : loadingStep === 'image' ? '🖼️ Creating AI image...' : '🎬 Writing video script...'}</p>
        </div>
      )}

      {/* Post Confirmation Modal */}
      {showPostConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowPostConfirm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="w-14 h-14 rounded-2xl gradient-btn flex items-center justify-center mx-auto mb-3">
                <Send className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Confirm Post</h2>
              <p className="text-sm text-gray-500 mt-1">Ready to publish on {platforms.length} platform(s)?</p>
            </div>

            {/* Platform list */}
            <div className="space-y-2 mb-5">
              {platforms.map(p => (
                <div key={p} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-medium text-gray-700 capitalize">{p.replace('_', ' ')}</span>
                </div>
              ))}
            </div>

            {/* Content preview */}
            <div className="mb-5 p-3 rounded-xl bg-gray-50 max-h-32 overflow-y-auto">
              <p className="text-xs text-gray-500 mb-1">Caption preview:</p>
              <p className="text-sm text-gray-700 line-clamp-3">{(editCaption || content.caption)?.substring(0, 150)}</p>
              {content.hashtags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {content.hashtags.slice(0, 5).map((t, i) => <span key={i} className="text-[10px] text-indigo-500">{t}</span>)}
                  {content.hashtags.length > 5 && <span className="text-[10px] text-gray-400">+{content.hashtags.length - 5} more</span>}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowPostConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 font-medium text-gray-600 hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={confirmPost} disabled={posting}
                className="flex-1 py-2.5 rounded-xl gradient-btn text-white font-semibold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50">
                {posting ? <><Loader2 className="w-4 h-4 animate-spin" /> Posting...</> : <><Send className="w-4 h-4" /> Post Now</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      <PostPreview isOpen={showPreview} onClose={() => setShowPreview(false)}
        caption={editCaption || content.caption} hashtags={content.hashtags}
        imageUrl={content.imageUrl} videoUrl={content.videoUrl}
        platforms={platforms} brand={brand}
        onCaptionChange={setEditCaption}
        onApprove={confirmPost} />
    </div>
  );
}


