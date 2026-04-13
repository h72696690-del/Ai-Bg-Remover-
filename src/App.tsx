/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  Image as ImageIcon, 
  Download, 
  Zap, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  X,
  ShieldCheck,
  Crown,
  Smartphone,
  MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
interface ProcessingResult {
  originalUrl: string;
  resultUrl: string;
  blob: Blob;
}

// --- Constants ---
const FREE_LIMIT = 5;
const ADMIN_PASSWORD = "haider123";

export default function App() {
  // --- State ---
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [dailyCount, setDailyCount] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Effects ---
  useEffect(() => {
    // Load usage data
    const savedCount = localStorage.getItem('bgRemoverCount');
    const savedDate = localStorage.getItem('bgRemoverDate');
    const savedPremium = localStorage.getItem('isBgPremium') === 'true';
    
    const today = new Date().toDateString();
    
    if (savedDate !== today) {
      localStorage.setItem('bgRemoverDate', today);
      localStorage.setItem('bgRemoverCount', '0');
      setDailyCount(0);
    } else {
      setDailyCount(parseInt(savedCount || '0'));
    }
    
    setIsPremium(savedPremium);
  }, []);

  // --- Handlers ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) validateAndProcess(selectedFile);
  };

  const validateAndProcess = (selectedFile: File) => {
    if (!isPremium && dailyCount >= FREE_LIMIT) {
      setError(`Free limit reached (${FREE_LIMIT} images/day). Upgrade to Premium for unlimited!`);
      setShowPaymentModal(true);
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File too large! Maximum size is 5MB.');
      return;
    }

    if (!selectedFile.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    setFile(selectedFile);
    processImage(selectedFile);
  };

  const processImage = async (imageFile: File) => {
    setIsProcessing(true);
    setError(null);
    setResult(null);

    const originalUrl = URL.createObjectURL(imageFile);

    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await fetch('/api/remove-bg', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process image');
      }

      const blob = await response.blob();
      const resultUrl = URL.createObjectURL(blob);

      setResult({
        originalUrl,
        resultUrl,
        blob,
      });

      if (!isPremium) {
        const newCount = dailyCount + 1;
        setDailyCount(newCount);
        localStorage.setItem('bgRemoverCount', newCount.toString());
      }
    } catch (err: any) {
      setError(err.message || 'Network error. Please try again.');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadResult = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.resultUrl;
    a.download = 'vera-tech-removed-bg.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const activatePremium = (tid: string) => {
    localStorage.setItem('isBgPremium', 'true');
    localStorage.setItem('bgPremiumTID', tid);
    setIsPremium(true);
    alert('✅ Premium activated successfully!');
  };

  // --- Components ---
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl min-h-screen flex flex-col items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card w-full p-6 md:p-10 relative overflow-hidden"
      >
        {/* Background Glows */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-neon-cyan/10 blur-[100px] rounded-full" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-neon-magenta/10 blur-[100px] rounded-full" />

        {/* Header */}
        <header className="text-center mb-8 relative z-10">
          <motion.h1 
            className="text-3xl md:text-5xl font-black bg-gradient-to-r from-neon-cyan via-white to-neon-magenta bg-clip-text text-transparent mb-2"
          >
            AI Background Remover
          </motion.h1>
          <p className="text-gray-400 text-sm md:text-base">
            Professional-grade background removal powered by VeraTech AI
          </p>
        </header>

        {/* Usage Counter */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2 flex items-center gap-3">
            {isPremium ? (
              <>
                <Crown className="w-5 h-5 text-neon-orange" />
                <span className="text-neon-orange font-bold text-sm">PREMIUM UNLIMITED</span>
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 text-neon-cyan" />
                <span className="text-sm">
                  Daily Free: <span className="text-neon-cyan font-bold">{FREE_LIMIT - dailyCount}</span> / {FREE_LIMIT} remaining
                </span>
              </>
            )}
          </div>
        </div>

        {/* Upload Area */}
        <AnimatePresence mode="wait">
          {!isProcessing && !result && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-neon-cyan'); }}
              onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-neon-cyan'); }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('border-neon-cyan');
                const droppedFile = e.dataTransfer.files[0];
                if (droppedFile) validateAndProcess(droppedFile);
              }}
              className="upload-area neon-border border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer bg-white/5 group"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-neon-cyan/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8 text-neon-cyan" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1">Tap or Drag Image</h3>
                  <p className="text-gray-500 text-sm">PNG, JPG, WEBP (Max 5MB)</p>
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                className="hidden" 
                accept="image/*" 
              />
            </motion.div>
          )}

          {/* Processing State */}
          {isProcessing && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 gap-6"
            >
              <div className="relative">
                <Loader2 className="w-16 h-16 text-neon-cyan animate-spin" />
                <div className="absolute inset-0 blur-xl bg-neon-cyan/20 animate-pulse" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold mb-2">Processing with AI...</h3>
                <p className="text-gray-500">Removing background and refining edges</p>
              </div>
            </motion.div>
          )}

          {/* Result Preview */}
          {result && !isProcessing && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <div className="bg-black/40 rounded-3xl p-4 border border-white/5">
                <div className="flex items-center gap-2 mb-3 px-2">
                  <ImageIcon className="w-4 h-4 text-gray-500" />
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Original</span>
                </div>
                <img 
                  src={result.originalUrl} 
                  alt="Original" 
                  className="w-full h-64 object-contain rounded-2xl"
                  referrerPolicy="no-referrer"
                />
              </div>
              
              <div className="bg-black/40 rounded-3xl p-4 border border-neon-cyan/20 relative">
                <div className="flex items-center gap-2 mb-3 px-2">
                  <Zap className="w-4 h-4 text-neon-cyan" />
                  <span className="text-xs font-bold text-neon-cyan uppercase tracking-widest">Result</span>
                </div>
                <div className="relative group">
                  <img 
                    src={result.resultUrl} 
                    alt="Result" 
                    className="w-full h-64 object-contain rounded-2xl bg-[url('https://www.transparenttextures.com/patterns/checkerboard.png')]"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-neon-cyan/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />
                </div>
                
                <div className="mt-6 flex flex-col gap-3">
                  <button onClick={downloadResult} className="btn-primary flex items-center justify-center gap-2">
                    <Download className="w-5 h-5" />
                    Download PNG
                  </button>
                  <button 
                    onClick={() => { setResult(null); setFile(null); }} 
                    className="text-gray-500 hover:text-white text-sm font-medium transition-colors"
                  >
                    Process Another Image
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Message */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 text-red-400 text-sm"
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </motion.div>
        )}

        {/* Premium Banner */}
        {!isPremium && (
          <div className="mt-10 p-6 bg-gradient-to-r from-neon-orange/20 to-transparent border border-neon-orange/20 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-neon-orange/20 flex items-center justify-center">
                <Crown className="w-6 h-6 text-neon-orange" />
              </div>
              <div>
                <h4 className="font-bold">Upgrade to Premium</h4>
                <p className="text-gray-500 text-sm">Unlimited usage + HD Export + Priority Support</p>
              </div>
            </div>
            <button onClick={() => setShowPaymentModal(true)} className="btn-premium whitespace-nowrap">
              Upgrade Now (Rs. 299)
            </button>
          </div>
        )}

        {/* Footer / Admin Trigger */}
        <footer className="mt-10 pt-6 border-t border-white/5 flex items-center justify-between text-gray-600 text-[10px] uppercase tracking-widest">
          <span>© 2024 VeraTech AI</span>
          <button 
            onClick={() => setShowAdminPanel(!showAdminPanel)}
            className="hover:text-neon-cyan transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
          </button>
        </footer>
      </motion.div>

      {/* Admin Panel */}
      <AnimatePresence>
        {showAdminPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full mt-4 overflow-hidden"
          >
            <div className="glass-card p-6 border-neon-orange/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-neon-orange font-bold flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Admin Access
                </h3>
                <button onClick={() => setShowAdminPanel(false)}><X className="w-4 h-4" /></button>
              </div>
              
              {!isAdminLoggedIn ? (
                <div className="flex gap-2">
                  <input 
                    type="password" 
                    placeholder="Admin Password"
                    className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 flex-1 outline-none focus:border-neon-orange transition-colors"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (e.currentTarget.value === ADMIN_PASSWORD) setIsAdminLoggedIn(true);
                        else alert('Wrong password!');
                      }
                    }}
                  />
                  <button 
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      if (input.value === ADMIN_PASSWORD) setIsAdminLoggedIn(true);
                      else alert('Wrong password!');
                    }}
                    className="bg-neon-orange px-4 py-2 rounded-xl font-bold text-sm"
                  >
                    Login
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-green-400">✅ Admin access granted</p>
                  <div className="flex gap-2">
                    <input 
                      id="adminTidInput"
                      type="text" 
                      placeholder="User Transaction ID"
                      className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 flex-1 outline-none focus:border-neon-cyan transition-colors"
                    />
                    <button 
                      onClick={() => {
                        const input = document.getElementById('adminTidInput') as HTMLInputElement;
                        if (input.value) {
                          activatePremium(input.value);
                          input.value = '';
                        }
                      }}
                      className="bg-neon-cyan text-black px-4 py-2 rounded-xl font-bold text-sm"
                    >
                      Activate Premium
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPaymentModal(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card w-full max-w-md p-8 relative z-10 border-neon-orange/30"
            >
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="absolute top-6 right-6 text-gray-500 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-neon-orange/20 flex items-center justify-center mx-auto mb-4">
                  <Crown className="w-8 h-8 text-neon-orange" />
                </div>
                <h3 className="text-2xl font-bold mb-1">Upgrade to Premium</h3>
                <p className="text-neon-orange font-bold">Rs. 299 — Lifetime Access</p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="bg-black/40 border border-white/5 rounded-2xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Smartphone className="w-5 h-5 text-neon-cyan" />
                    <span className="text-sm font-bold text-neon-cyan">EasyPaisa Account</span>
                  </div>
                  <p className="text-2xl font-mono font-bold tracking-wider">03288281531</p>
                  <p className="text-gray-500 text-xs mt-1">Account Holder: Ghulam Haider</p>
                </div>

                <a 
                  href="https://wa.me/923701012235" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#25D366]/80 text-white font-bold py-4 rounded-2xl transition-all"
                >
                  <MessageCircle className="w-6 h-6" />
                  Send TID on WhatsApp
                </a>
                <p className="text-center text-gray-500 text-[10px] uppercase tracking-widest">
                  After payment, send your Transaction ID on WhatsApp for activation
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <CheckCircle2 className="w-4 h-4 text-neon-cyan" />
                  <span>Unlimited background removals</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <CheckCircle2 className="w-4 h-4 text-neon-cyan" />
                  <span>High-definition export quality</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <CheckCircle2 className="w-4 h-4 text-neon-cyan" />
                  <span>No daily limits or restrictions</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
