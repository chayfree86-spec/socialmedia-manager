import React, { useState } from 'react';
import axios from 'axios';
import { Eye, EyeOff, Lock, Mail, ShieldCheck, Sparkles, KeyRound, Heart, MessageCircle, Share2, ThumbsUp, Star, MapPin, MoreHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';
import SocialIcon from '../components/SocialIcons';

const API_BASE = '/api';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1); // 1: Email/Password, 2: OTP Verification
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const moveX = (clientX - centerX) / 25;
    const moveY = (clientY - centerY) / 25;
    setMousePos({ x: moveX, y: moveY });
  };

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(`${API_BASE}/auth.php?action=login`, {
        email: email.trim(),
        password: password,
        remember_me: rememberMe
      });

      if (data.success) {
        if (data.step === 'otp') {
          setStep(2);
          toast.success(data.message || 'OTP sent to your email! 📬');
        } else if (data.user) {
          toast.success('Logged in successfully! 🚀');
          onLogin(data.user.email || email, rememberMe);
        }
      } else {
        toast.error(data.error || 'Invalid email or password.');
      }
    } catch (err) {
      toast.error('Login failed. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP code.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(`${API_BASE}/auth.php?action=verify-otp`, {
        email: email.trim(),
        otp: otp,
        remember_me: rememberMe
      });

      if (data.success) {
        toast.success('Email verified successfully! Logging you in... 🚀');
        onLogin(data.user?.email || email, rememberMe);
      } else {
        toast.error(data.error || 'Incorrect verification code. Please try again.');
      }
    } catch (err) {
      toast.error('Verification failed. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div onMouseMove={handleMouseMove} className="min-h-screen relative flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-sky-50 px-4 py-12 sm:px-6 lg:px-8 font-sans overflow-hidden">
      
      {/* ── Background Floating Mockup Cards & Icons (Parallax Mouse Follow) ── */}
      
      {/* Floating Instagram Card */}
      <div style={{ transform: `translate3d(${mousePos.x * 0.4}px, ${mousePos.y * 0.4}px, 0)`, transition: 'transform 0.15s ease-out' }} className="absolute top-12 left-6 lg:left-20 z-0 hidden md:block">
        <div className="w-64 bg-white/70 backdrop-blur-md border border-white/40 shadow-xl rounded-2xl p-4 animate-float-insta hover:opacity-100 hover:scale-105 transition-all duration-500 select-none opacity-65">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <SocialIcon platform="instagram" size={24} badge={true} />
              <div>
                <p className="text-xs font-bold text-gray-800">creativespace_ai</p>
                <p className="text-[10px] text-gray-400">Sponsored</p>
              </div>
            </div>
            <MoreHorizontal className="w-4 h-4 text-gray-400" />
          </div>
          <div className="w-full h-32 rounded-lg overflow-hidden mb-3 shadow-inner relative bg-gray-100">
            <img src="/insta-post.png" alt="Instagram Post" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent flex items-end p-2">
              <span className="text-white font-bold text-[10px] drop-shadow-sm">AI Design Studio ✨</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-gray-500 text-xs mb-2">
            <div className="flex items-center gap-3">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500 animate-pulse" />
              <MessageCircle className="w-4 h-4 text-gray-400" />
              <Share2 className="w-4 h-4 text-gray-400" />
            </div>
          </div>
          <p className="text-[11px] text-gray-600 leading-relaxed font-medium">
            <span className="font-bold text-gray-800 mr-1">creativespace_ai</span>
            Automate your content generation workflow in seconds! 🚀 #socialmedia
          </p>
        </div>
      </div>
 
      {/* Floating Facebook Card */}
      <div style={{ transform: `translate3d(${mousePos.x * -0.5}px, ${mousePos.y * -0.5}px, 0)`, transition: 'transform 0.15s ease-out' }} className="absolute bottom-16 left-4 lg:left-16 z-0 hidden md:block">
        <div className="w-72 bg-white/70 backdrop-blur-md border border-white/40 shadow-xl rounded-2xl p-4 animate-float-fb hover:opacity-100 hover:scale-105 transition-all duration-500 select-none opacity-65">
          <div className="flex items-center gap-2.5 mb-3">
            <SocialIcon platform="facebook" size={24} badge={true} />
            <div>
              <p className="text-xs font-bold text-gray-800">TechCorp Global</p>
              <p className="text-[10px] text-gray-400">12 hrs · 🌎</p>
            </div>
          </div>
          <p className="text-xs text-gray-700 leading-relaxed font-medium mb-2.5">
            We are proud to partner with SocialAI to streamline our brand engagement across 7 platforms! 🚀
          </p>
          <div className="w-full h-28 rounded-lg overflow-hidden mb-3 bg-gray-100">
            <img src="/fb-post.png" alt="Facebook Post" className="w-full h-full object-cover" />
          </div>
          <div className="flex items-center justify-between pt-2.5 border-t border-gray-100 text-[11px] text-gray-500 font-semibold">
            <span className="flex items-center gap-1 hover:text-blue-600 transition cursor-pointer"><ThumbsUp className="w-3.5 h-3.5" /> Like</span>
            <span className="flex items-center gap-1 cursor-pointer"><MessageCircle className="w-3.5 h-3.5" /> Comment</span>
            <span className="flex items-center gap-1 cursor-pointer"><Share2 className="w-3.5 h-3.5" /> Share</span>
          </div>
        </div>
      </div>
 
      {/* Floating Google Business Card */}
      <div style={{ transform: `translate3d(${mousePos.x * 0.6}px, ${mousePos.y * -0.6}px, 0)`, transition: 'transform 0.15s ease-out' }} className="absolute top-16 right-6 lg:right-24 z-0 hidden md:block">
        <div className="w-60 bg-white/70 backdrop-blur-md border border-white/40 shadow-xl rounded-2xl p-4 animate-float-google hover:opacity-100 hover:scale-105 transition-all duration-500 select-none opacity-65">
          <div className="w-full h-24 rounded-lg overflow-hidden mb-3 bg-gray-100">
            <img src="/google-biz.png" alt="Google Business" className="w-full h-full object-cover" />
          </div>
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <SocialIcon platform="google_business" size={24} badge={true} />
              <p className="text-xs font-bold text-gray-800">SocialAI Agency</p>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="flex items-center gap-1 mb-2">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />)}
            </div>
            <span className="text-[10px] text-gray-500 font-bold">4.9 (148 reviews)</span>
          </div>
          <p className="text-[10px] text-gray-400 mb-3 flex items-center gap-1"><MapPin className="w-3 h-3 text-red-500" /> Silicon Valley, CA</p>
          <div className="flex gap-2">
            <button className="flex-1 py-1 px-2 rounded-lg bg-blue-50 text-[10px] font-bold text-blue-600 border border-blue-150 hover:bg-blue-100 transition">
              Call
            </button>
            <button className="flex-1 py-1 px-2 rounded-lg bg-blue-50 text-[10px] font-bold text-blue-600 border border-blue-150 hover:bg-blue-100 transition">
              Website
            </button>
          </div>
        </div>
      </div>
 
      {/* Floating LinkedIn Card */}
      <div style={{ transform: `translate3d(${mousePos.x * -0.4}px, ${mousePos.y * 0.4}px, 0)`, transition: 'transform 0.15s ease-out' }} className="absolute bottom-12 right-6 lg:right-20 z-0 hidden md:block">
        <div className="w-72 bg-white/70 backdrop-blur-md border border-white/40 shadow-xl rounded-2xl p-4 animate-float-linkedin hover:opacity-100 hover:scale-105 transition-all duration-500 select-none opacity-65">
          <div className="flex items-center gap-2 mb-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
              AM
            </div>
            <div>
              <p className="text-xs font-bold text-gray-800">Alex Mercer • 1st</p>
              <p className="text-[9px] text-gray-500 leading-none">VP of Digital Strategy @ TechLab</p>
            </div>
          </div>
          <p className="text-[11px] text-gray-600 leading-relaxed mb-2.5 font-medium">
            AI social media managers are a necessity for scaling digital marketing efficiently. Proud to use SocialAI!
          </p>
          <div className="w-full h-24 rounded-lg overflow-hidden mb-3 bg-gray-100">
            <img src="/linkedin-post.png" alt="LinkedIn Post" className="w-full h-full object-cover" />
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[10px] text-gray-500 font-semibold">
            <span>👍 Like</span>
            <span>💬 Comment</span>
          </div>
        </div>
      </div>

      {/* ── Additional Floating Social Icons (Parallax Deep Space) ── */}
      
      {/* WhatsApp Icon */}
      <div style={{ transform: `translate3d(${mousePos.x * 0.85}px, ${mousePos.y * 0.85}px, 0)`, transition: 'transform 0.15s ease-out' }} className="absolute bottom-28 right-[32%] z-0 hidden md:block">
        <div className="w-12 h-12 bg-white/80 backdrop-blur-md border border-white/40 shadow-lg rounded-xl flex items-center justify-center animate-float-google hover:scale-110 hover:opacity-100 opacity-60 transition-all duration-500">
          <SocialIcon platform="whatsapp" size={32} badge={true} />
        </div>
      </div>

      {/* YouTube Icon */}
      <div style={{ transform: `translate3d(${mousePos.x * -0.75}px, ${mousePos.y * 0.75}px, 0)`, transition: 'transform 0.15s ease-out' }} className="absolute top-[45%] left-12 lg:left-32 z-0 hidden md:block">
        <div className="w-14 h-14 bg-white/80 backdrop-blur-md border border-white/40 shadow-lg rounded-xl flex items-center justify-center animate-float-fb hover:scale-110 hover:opacity-100 opacity-60 transition-all duration-500">
          <SocialIcon platform="youtube" size={36} badge={true} />
        </div>
      </div>

      {/* Pinterest Icon */}
      <div style={{ transform: `translate3d(${mousePos.x * 0.8}px, ${mousePos.y * -0.7}px, 0)`, transition: 'transform 0.15s ease-out' }} className="absolute top-32 right-[35%] z-0 hidden md:block">
        <div className="w-12 h-12 bg-white/80 backdrop-blur-md border border-white/40 shadow-lg rounded-xl flex items-center justify-center animate-float-insta hover:scale-110 hover:opacity-100 opacity-60 transition-all duration-500">
          <SocialIcon platform="pinterest" size={32} badge={true} />
        </div>
      </div>

      {/* Instagram Small Logo */}
      <div style={{ transform: `translate3d(${mousePos.x * -0.55}px, ${mousePos.y * -0.55}px, 0)`, transition: 'transform 0.15s ease-out' }} className="absolute top-20 left-[35%] z-0 hidden md:block">
        <div className="w-11 h-11 bg-white/80 backdrop-blur-md border border-white/40 shadow-lg rounded-xl flex items-center justify-center animate-float-linkedin hover:scale-110 hover:opacity-100 opacity-60 transition-all duration-500">
          <SocialIcon platform="instagram" size={28} badge={true} />
        </div>
      </div>

      {/* LinkedIn Small Logo */}
      <div style={{ transform: `translate3d(${mousePos.x * 0.7}px, ${mousePos.y * -0.6}px, 0)`, transition: 'transform 0.15s ease-out' }} className="absolute top-[55%] right-16 lg:right-36 z-0 hidden md:block">
        <div className="w-12 h-12 bg-white/80 backdrop-blur-md border border-white/40 shadow-lg rounded-xl flex items-center justify-center animate-float-insta hover:scale-110 hover:opacity-100 opacity-60 transition-all duration-500">
          <SocialIcon platform="linkedin" size={30} badge={true} />
        </div>
      </div>
 
 
      {/* ── Login Form Card ── */}
      <div className="max-w-md w-full bg-white/90 backdrop-blur-lg rounded-3xl shadow-xl border border-gray-100/80 p-8 sm:p-10 space-y-8 relative overflow-hidden transition-all duration-500 z-10">
        
        {/* Soft Background Accent Lights */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-36 h-36 rounded-full bg-indigo-200/30 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-36 h-36 rounded-full bg-pink-200/30 blur-2xl pointer-events-none" />

        {/* Brand Logo Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl gradient-btn flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="h-6 w-6 text-white animate-pulse" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900 tracking-tight">
            {step === 1 ? 'Welcome to SocialAI' : 'Verify Your Email'}
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            {step === 1 
              ? 'Your AI-powered social media command center' 
              : `Enter the 6-digit verification code sent to ${email}`
            }
          </p>
        </div>

        {step === 1 ? (
          /* STEP 1: Email and Password Form */
          <form className="mt-8 space-y-6" onSubmit={handleCredentialsSubmit}>
            <div className="space-y-4 rounded-md">
              
              {/* Email Field */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Mail className="h-4.5 w-4.5" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all text-sm"
                    placeholder="e.g. admin@socialai.com"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Lock className="h-4.5 w-4.5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full pl-11 pr-11 py-3 border border-gray-200 rounded-xl bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all text-sm"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition"
                  >
                    {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Remember Me Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4.5 w-4.5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm font-semibold text-gray-600 cursor-pointer select-none">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <span className="font-semibold text-indigo-500 hover:text-indigo-600 cursor-help" onClick={() => toast('Demo Creds: admin@socialai.com / admin123')}>
                  Demo account info?
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white gradient-btn hover:opacity-95 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition shadow-lg shadow-indigo-500/10 disabled:opacity-50"
              >
                {loading ? (
                  <div className="spinner-white h-5 w-5" />
                ) : (
                  <>
                    <KeyRound className="h-4.5 w-4.5 mr-2 text-indigo-100 group-hover:scale-110 transition" />
                    Sign In
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* STEP 2: One-time Verification Code (OTP) Form */
          <form className="mt-8 space-y-6" onSubmit={handleOtpSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 text-center">Verification Code (OTP)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <ShieldCheck className="h-4.5 w-4.5" />
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    className="appearance-none block w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-xl bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all text-center tracking-[0.5em] text-lg font-bold"
                    placeholder="000000"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white gradient-btn hover:opacity-95 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition shadow-lg shadow-indigo-500/10 disabled:opacity-50"
              >
                {loading ? (
                  <div className="spinner-white h-5 w-5" />
                ) : (
                  'Confirm & Verify'
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 text-xs font-bold transition flex items-center justify-center"
              >
                ← Back to Login
              </button>
            </div>

            {/* Resend Option */}
            <div className="text-center">
              <p className="text-xs text-gray-400">
                Didn't receive code?{' '}
                <span 
                  className="font-bold text-indigo-500 hover:text-indigo-600 cursor-pointer"
                  onClick={() => {
                    toast.success('Demo code resent! 🔑 code: 123456');
                  }}
                >
                  Resend Code
                </span>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
