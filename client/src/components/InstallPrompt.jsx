import React, { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed or dismissed in this session
    const isDismissed = sessionStorage.getItem('pwa_install_dismissed') === 'true';
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

    if (isStandalone || isDismissed) return;

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const detectIOS = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(detectIOS);

    // If iOS and using Safari (not standalone)
    if (detectIOS && !isStandalone) {
      // Show iOS prompt after a short delay
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }

    // Handle Android/Chrome beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    sessionStorage.setItem('pwa_install_dismissed', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:bottom-6 md:left-auto md:right-6 max-w-sm bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-indigo-500/30 z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex gap-3 items-start">
        <div className="w-10 h-10 rounded-xl gradient-btn flex items-center justify-center flex-shrink-0 shadow-glow">
          <Download className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
            Install SocialAI App
          </h4>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
            {isIOS 
              ? 'Tap "Share" below, then select "Add to Home Screen" to install on iPhone. 📲'
              : 'Install our App for a premium full-screen, offline-enabled social media experience! 🚀'}
          </p>
          
          <div className="flex gap-2 mt-3">
            {isIOS ? (
              <div className="flex items-center gap-1.5 bg-indigo-500/20 text-indigo-300 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg border border-indigo-500/30">
                <Share className="w-3.5 h-3.5" /> Tap Share → Add to Home Screen
              </div>
            ) : (
              <button 
                onClick={handleInstallClick} 
                className="gradient-btn text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-lg hover:scale-105 transition"
              >
                Install Now
              </button>
            )}
            <button 
              onClick={handleDismiss} 
              className="px-3 py-2 rounded-xl hover:bg-white/10 text-xs font-medium text-gray-400 hover:text-white transition"
            >
              Maybe Later
            </button>
          </div>
        </div>
        <button 
          onClick={handleDismiss} 
          className="p-1 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
