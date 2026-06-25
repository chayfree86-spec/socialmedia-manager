import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  FileText, Send, Calendar, CheckCircle, Clock, XCircle,
  Trash2, Edit3, Eye, Search, Copy, Check, ExternalLink,
  ChevronRight, Sparkles, MessageSquare, AlertCircle
} from 'lucide-react';
import SocialIcon from '../components/SocialIcons';

const API_BASE = '/api';

export default function PostManager() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, [filter]);

  const fetchPosts = async () => {
    try {
      const businessId = localStorage.getItem('socialai_active_business_id') || '1';
      const statusParam = filter !== 'all' ? `&status=${filter}` : '';
      const { data } = await axios.get(`${API_BASE}/posts.php?business_id=${businessId}${statusParam}`);
      if (data.success) setPosts(data.posts);
    } catch (error) {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async (id) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      await axios.delete(`${API_BASE}/posts.php?id=${id}`);
      setPosts(posts.filter(p => p._id !== id));
      toast.success('Post deleted successfully ✅');
      if (selectedPost?._id === id) setSelectedPost(null);
    } catch {
      toast.error('Failed to delete post');
    }
  };

  const publishPost = async (id) => {
    try {
      await axios.post(`${API_BASE}/posts.php?action=publish&id=${id}`);
      toast.success('🚀 Post published successfully!');
      fetchPosts();
    } catch {
      toast.error('Failed to publish post');
    }
  };

  const copyCaption = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Caption copied! 📋');
    setTimeout(() => setCopied(false), 2000);
  };

  const statusBadge = (status) => {
    const configs = {
      published: { text: 'Published', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle },
      scheduled: { text: 'Scheduled', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: Clock },
      draft: { text: 'Draft', bg: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20', icon: Edit3 },
      failed: { text: 'Failed', bg: 'bg-red-500/10 text-red-400 border-red-500/20', icon: XCircle }
    };
    const config = configs[status] || configs.draft;
    const Icon = config.icon;
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 w-fit ${config.bg}`}>
        <Icon className="w-3.5 h-3.5" />
        {config.text}
      </span>
    );
  };

  const filteredPosts = posts.filter(p => {
    const matchesSearch = search ? p.caption?.toLowerCase().includes(search.toLowerCase()) ||
                                   p.prompt?.toLowerCase().includes(search.toLowerCase()) : true;
    const matchesFilter = filter === 'all' || p.status === filter;
    return matchesSearch && matchesFilter;
  });

  // Detailed View (Two-Column Premium Social Previewer)
  if (selectedPost) {
    const formattedDate = selectedPost.publishedAt 
      ? new Date(selectedPost.publishedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
      : selectedPost.scheduledAt 
      ? new Date(selectedPost.scheduledAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
      : 'Not set';

    return (
      <div className="min-h-full bg-gray-50 text-gray-800 p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Navigation Header */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <button onClick={() => setSelectedPost(null)} className="hover:text-indigo-650 transition font-medium">
            Posts
          </button>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-gray-900 font-semibold truncate max-w-[200px] sm:max-w-xs">
            {selectedPost.prompt || 'Post Details'}
          </span>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900 truncate max-w-sm">{selectedPost.prompt || 'Untitled Post'}</h2>
            {statusBadge(selectedPost.status)}
          </div>
          <div className="flex items-center gap-2">
            {selectedPost.status !== 'published' && (
              <button onClick={() => publishPost(selectedPost._id)}
                className="gradient-btn text-white px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md">
                <Send className="w-4 h-4" /> Publish Now
              </button>
            )}
            <button onClick={() => deletePost(selectedPost._id)}
              className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 border border-red-200 text-sm font-semibold flex items-center gap-2 transition">
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        </div>

        {/* Two-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Metadata & Source Contents (8 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Prompt & Generation Details */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" /> AI Generation Prompt
              </h3>
              <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-100 italic leading-relaxed">
                "{selectedPost.prompt || 'Directly created without a prompt.'}"
              </p>

              {/* Schedule Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="border border-gray-100 rounded-xl p-3 bg-gray-50">
                  <span className="text-xs text-gray-400 block mb-0.5">Date & Time</span>
                  <span className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-indigo-500" /> {formattedDate}
                  </span>
                </div>
                <div className="border border-gray-100 rounded-xl p-3 bg-gray-50">
                  <span className="text-xs text-gray-400 block mb-0.5">Publish Target</span>
                  <div className="flex gap-1 mt-1">
                    {selectedPost.platforms?.map(p => (
                      <SocialIcon key={p} platform={p} size={22} badge={true} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Caption Area with One-click Copy */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-indigo-500" /> Caption & Body
                </h3>
                <button onClick={() => copyCaption(selectedPost.caption)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-gray-650 flex items-center gap-1.5 transition">
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="text-sm text-gray-800 bg-gray-50 p-5 rounded-xl border border-gray-100 whitespace-pre-wrap leading-relaxed font-sans select-all">
                {selectedPost.caption || 'No caption generated.'}
              </div>

              {/* Hashtags list */}
              {selectedPost.hashtags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {selectedPost.hashtags.map((tag, i) => (
                    <span key={i} className="text-xs px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-650 font-semibold">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Video Script (Optional) */}
            {selectedPost.videoScript && (
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-gray-900">🎬 Video / Reels Script</h3>
                <div className="bg-gray-50 text-gray-800 p-5 rounded-xl text-sm font-mono border border-gray-100 whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto">
                  {selectedPost.videoScript}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Social Media Mockup Preview (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider pl-1">Live Simulator Preview</h3>

            {/* Instagram Mockup Style */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden max-w-[400px] mx-auto text-gray-800">
              {/* Mockup Header */}
              <div className="p-3.5 flex items-center justify-between border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 p-0.5">
                    <div className="w-full h-full rounded-full bg-white p-0.5">
                      <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center font-bold text-[10px] text-gray-500">YB</div>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-900 block leading-tight">yourbrand_official</span>
                    <span className="text-[10px] text-gray-400 block">Sponsored / AI Assistant</span>
                  </div>
                </div>
                <div className="text-gray-450 font-bold hover:text-gray-700 cursor-pointer">•••</div>
              </div>

              {/* Mockup Image */}
              <div className="aspect-square bg-gray-50 flex items-center justify-center border-b border-gray-100 overflow-hidden relative">
                {selectedPost.imageUrl ? (
                  <img src={selectedPost.imageUrl} alt="Social Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-6 space-y-2">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto" />
                    <span className="text-xs text-gray-400 block font-medium">Text-only Post Mockup</span>
                  </div>
                )}
              </div>

              {/* Mockup Likes & Interactions */}
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between text-gray-500">
                  <div className="flex items-center gap-4">
                    <svg className="w-6 h-6 hover:text-red-500 cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                    <svg className="w-6 h-6 hover:text-indigo-650 cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                    <svg className="w-6 h-6 hover:text-green-500 cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 10.742a3 3 0 11-2.2-2.2l1.393 2.686z M12.852 14.5a3 3 0 11-4.43 0l2.215-4.43z M15.316 10.742a3 3 0 112.2-2.2l-1.393 2.686z"></path></svg>
                  </div>
                  <svg className="w-6 h-6 hover:text-gray-800 cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
                </div>

                <span className="text-xs font-bold text-gray-900 block">0 likes</span>

                {/* Mockup Caption Text */}
                <div className="text-xs leading-relaxed text-gray-700">
                  <span className="font-bold mr-1.5 text-gray-900">yourbrand_official</span>
                  <span className="line-clamp-3 select-none">{selectedPost.caption || 'Write a caption...'}</span>
                </div>
                <span className="text-[10px] text-gray-400 block uppercase tracking-wider pt-1">2 hours ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50 text-gray-800 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FileText className="w-8 h-8 text-indigo-500" /> Posts
          </h1>
          <p className="text-gray-555 mt-1">Manage and publish all your AI-generated posts</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search posts (prompt, caption, tags)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-800 placeholder-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition text-sm shadow-sm"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['all', 'draft', 'scheduled', 'published'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold border transition-all capitalize whitespace-nowrap ${
                filter === f
                  ? 'bg-indigo-650 border-indigo-650 text-white shadow-md'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Posts Grid */}
      {loading ? (
        <div className="text-center py-16">
          <div className="spinner mx-auto border-indigo-500"></div>
          <p className="text-gray-500 mt-4 text-sm">Loading posts...</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center shadow-sm">
          <FileText className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-700">No posts found!</h3>
          <p className="text-gray-400 mt-1 mb-4">Create your first post using the AI Content Generator</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
          {filteredPosts.map(post => (
            <div key={post._id} className="bg-white border border-gray-200 rounded-2xl p-4 hover:border-indigo-400 hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-4">
              <div className="space-y-3.5">
                {/* Image Preview with Hover Zoom Effect */}
                {post.imageUrl && (
                  <div className="relative rounded-xl overflow-hidden h-40 bg-gray-50 border border-gray-100 group cursor-pointer"
                    onClick={() => setSelectedPost(post)}>
                    <img
                      src={post.imageUrl}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                )}

                {/* Date & Time */}
                {(() => {
                  const postDate = post.publishedAt || post.scheduledAt || post.createdAt;
                  const formattedCardDate = postDate 
                    ? new Date(postDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : null;
                  return formattedCardDate && (
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      {formattedCardDate}
                    </div>
                  );
                })()}

                {/* Caption / Prompt Text */}
                <div className="cursor-pointer" onClick={() => setSelectedPost(post)}>
                  <p className="text-sm text-gray-700 line-clamp-2 font-semibold hover:text-indigo-600 transition leading-relaxed">
                    {post.caption || post.prompt}
                  </p>
                </div>

                {/* Hashtags */}
                {post.hashtags?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {post.hashtags.slice(0, 3).map((tag, i) => (
                      <span key={i} className="text-[10px] px-2.5 py-0.5 rounded-full bg-gray-50 border border-gray-100 text-indigo-650 font-bold">
                        {tag}
                      </span>
                    ))}
                    {post.hashtags.length > 3 && (
                      <span className="text-[10px] text-gray-400 font-semibold flex items-center pl-1">+{post.hashtags.length - 3}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Status and Actions Container */}
              <div className="space-y-4 pt-2 border-t border-gray-100">
                {/* Status & Targeted Platforms */}
                <div className="flex items-center justify-between">
                  {statusBadge(post.status)}
                  <div className="flex gap-1 items-center">
                    {post.platforms?.map(p => (
                      <span key={p} title={p}>
                        <SocialIcon platform={p} size={18} badge={true} />
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Buttons Grid */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedPost(post)}
                    className="flex-1 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <Eye className="w-3.5 h-3.5" /> View
                  </button>
                  {post.status !== 'published' && (
                    <button
                      onClick={() => publishPost(post._id)}
                      className="flex-1 py-2 rounded-xl gradient-btn hover:opacity-95 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm"
                    >
                      <Send className="w-3.5 h-3.5" /> Publish
                    </button>
                  )}
                  <button
                    onClick={() => deletePost(post._id)}
                    className="py-2 px-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 border border-red-200 hover:text-red-600 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


