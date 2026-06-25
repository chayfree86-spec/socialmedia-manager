import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Camera, Image, Video, Download, Trash2, Search,
  Grid, List, Filter, Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MediaLibrary() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('grid');
  const [mediaType, setMediaType] = useState('all');

  const [mediaItems, setMediaItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMedia = async () => {
    try {
      const businessId = localStorage.getItem('socialai_active_business_id') || '1';
      const { data } = await axios.get(`/api/posts.php?business_id=${businessId}&limit=50`);
      if (data.success) {
        const items = [];
        data.posts.forEach(post => {
          if (post.imageUrl) {
            items.push({
              id: `img_${post._id}`,
              url: post.imageUrl,
              prompt: post.imagePrompt || post.prompt || 'Generated Image',
              type: 'image',
              date: new Date(post.created_at || Date.now()).toLocaleDateString()
            });
          }
          if (post.videoScript) {
            const details = post.video_details || {};
            items.push({
              id: `vid_${post._id}`,
              url: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=500&auto=format&fit=crop&q=60',
              prompt: details.idea || post.prompt || 'Generated Video Script',
              type: 'video',
              date: new Date(post.created_at || Date.now()).toLocaleDateString()
            });
          }
        });
        setMediaItems(items);
      }
    } catch (e) {
      console.error('Failed to fetch media from posts:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const filtered = mediaType === 'all' ? mediaItems : mediaItems.filter(m => m.type === mediaType);

  return (
    <div className="p-3 sm:p-4 lg:p-6 w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Camera className="w-8 h-8 text-indigo-500" />
            Media Library
          </h1>
          <p className="text-gray-500 mt-1">All your AI-generated images and video assets</p>
        </div>
        <button
          onClick={() => navigate('/generate')}
          className="gradient-btn text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-lg"
        >
          <Sparkles className="w-5 h-5" />
          Generate New
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          {['all', 'image', 'video'].map(type => (
            <button
              key={type}
              onClick={() => setMediaType(type)}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition ${
                mediaType === type
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {type === 'all' && '📁 All'}
              {type === 'image' && '🖼️ Images'}
              {type === 'video' && '🎬 Videos'}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition ${viewMode === 'grid' ? 'bg-indigo-100 text-indigo-600' : 'bg-white text-gray-400 border'}`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition ${viewMode === 'list' ? 'bg-indigo-100 text-indigo-600' : 'bg-white text-gray-400 border'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Media Grid */}
      {filtered.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Image className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600">No media files</h3>
          <p className="text-gray-400 mt-1">Generate AI images and videos from the Content Generator!</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filtered.map(media => (
            <div key={media.id} className="glass rounded-2xl overflow-hidden group card-hover">
              <div className="relative aspect-square bg-gray-100">
                <img
                  src={media.url}
                  alt={media.prompt}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button className="p-2 rounded-lg bg-white/90 hover:bg-white text-gray-700 transition">
                    <Download className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-lg bg-white/90 hover:bg-white text-red-500 transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {media.type === 'video' && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-xs font-medium">
                    🎬 Video
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-gray-700 truncate">{media.prompt}</p>
                <p className="text-xs text-gray-400 mt-0.5">{media.date}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass rounded-2xl divide-y divide-gray-100">
          {filtered.map(media => (
            <div key={media.id} className="flex items-center gap-4 p-4 hover:bg-gray-50/50 transition">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                <img src={media.url} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate">{media.prompt}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 capitalize">
                    {media.type}
                  </span>
                  <span className="text-xs text-gray-400">{media.date}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="p-2 rounded-lg hover:bg-gray-100 transition">
                  <Download className="w-4 h-4 text-gray-500" />
                </button>
                <button className="p-2 rounded-lg hover:bg-red-50 transition">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Storage Info */}
      <div className="glass rounded-2xl p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-700">Storage Used</p>
          <p className="text-xs text-gray-400">2.4 GB of 10 GB</p>
        </div>
        <div className="w-48 h-2 rounded-full bg-gray-200 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" style={{ width: '24%' }} />
        </div>
        <span className="text-sm font-medium text-gray-600">24%</span>
      </div>
    </div>
  );
}
