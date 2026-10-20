import React, { useState } from 'react';
import { Waves, User, KeyRound, ShieldCheck, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { loginUser } from '../api';

export default function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('ইউজারনেম লিখুন');
      return;
    }
    if (!pin.trim()) {
      setError('আপনার সিকিউরিটি পিন (PIN) লিখুন');
      return;
    }

    setLoading(true);
    try {
      const user = await loginUser({
        username: username.trim().toLowerCase(),
        pin: pin.trim()
      });

      if (rememberMe) {
        localStorage.setItem('fish_farm_user', JSON.stringify(user));
        localStorage.setItem('fish_farm_remember', 'true');
      } else {
        sessionStorage.setItem('fish_farm_user', JSON.stringify(user));
        localStorage.removeItem('fish_farm_user');
        localStorage.removeItem('fish_farm_remember');
      }

      onLoginSuccess(user);
    } catch (err) {
      setError(err.message || 'ভুল ইউজারনেম বা পিন নম্বর। সঠিক পিন দিন।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 sm:px-6 py-12 relative overflow-hidden font-sans">
      {/* Background Soft Glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-teal-100/60 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-cyan-100/60 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card (Clean White UI) */}
      <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/60 relative z-10 space-y-6">
        
        {/* Farm Logo & Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-teal-600 shadow-lg shadow-teal-600/20 text-white">
            <Waves className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              শাহ আমানত ফিশারি ও এগ্রো
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Shah Amanat Fishery & Agro Project • চট্টগ্রাম বিমানবন্দর
            </p>
            <div className="inline-block mt-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/60 text-teal-800 text-[11px] font-semibold">
              ৪টি পুকুর • ক্লাউড ম্যানেজমেন্ট সিস্টেম
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-teal-600" />
              ইউজারনেম (Username)
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="আপনার ইউজারনেম লিখুন"
                className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-teal-600 focus:ring-2 focus:ring-teal-500/10 transition placeholder:text-slate-400"
                autoComplete="username"
                required
              />
            </div>
          </div>

          {/* PIN Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-teal-600" />
                সিকিউরিটি পিন (PIN)
              </span>
            </label>
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="পিন নম্বর লিখুন"
                maxLength={6}
                className="w-full px-4 py-3 pr-11 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 text-sm tracking-widest focus:outline-none focus:bg-white focus:border-teal-600 focus:ring-2 focus:ring-teal-500/10 transition placeholder:tracking-normal placeholder:text-slate-400"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember this Device (Auto Cache) Checkbox */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 bg-white"
              />
              <span className="text-xs text-slate-600 font-medium">
                এই ডিভাইস মনে রাখুন (Auto Login Cache)
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/20 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>যাচাই করা হচ্ছে...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>লগইন করুন (Login)</span>
              </>
            )}
          </button>
        </form>

      </div>

      {/* Footer copyright */}
      <div className="mt-8 text-center text-xs text-slate-500">
        © 2026 শাহ আমানত ফিশারি অ্যান্ড এগ্রো প্রজেক্ট • সর্বস্বত্ব সংরক্ষিত
      </div>
    </div>
  );
}
