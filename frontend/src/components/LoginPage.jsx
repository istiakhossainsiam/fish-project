import React, { useState } from 'react';
import { Waves, Lock, User, KeyRound, ShieldCheck, Eye, EyeOff, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { loginUser } from '../api';

export default function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('superadmin');
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

  const handleQuickFill = (u, p) => {
    setUsername(u);
    setPin(p);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 sm:px-6 py-12 relative overflow-hidden font-sans">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 space-y-6">
        
        {/* Farm Logo & Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-400 shadow-lg shadow-teal-500/20 text-slate-950">
            <Waves className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              শাহ আমানত ফিশারি ও এগ্রো
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Shah Amanat Fishery & Agro Project • চট্টগ্রাম বিমানবন্দর
            </p>
            <div className="inline-block mt-1.5 px-3 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-[11px] font-medium">
              ৪টি পুকুর • ক্লাউড ম্যানেজমেন্ট সিস্টেম
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-teal-400" />
              ইউজারনেম (Username)
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="superadmin"
                className="w-full px-4 py-3 bg-slate-950/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition placeholder:text-slate-600"
                autoComplete="username"
                required
              />
            </div>
          </div>

          {/* PIN Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-teal-400" />
                সিকিউরিটি পিন (PIN)
              </span>
              <span className="text-[11px] text-slate-500 font-normal">ডিফল্ট সুপারএডমিন: 4023</span>
            </label>
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="৪-সংখ্যার পিন লিখুন (e.g. 4023)"
                maxLength={6}
                className="w-full px-4 py-3 pr-11 bg-slate-950/80 border border-slate-700 rounded-xl text-white text-sm tracking-widest focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition placeholder:tracking-normal placeholder:text-slate-600"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
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
                className="w-4 h-4 rounded border-slate-700 text-teal-500 focus:ring-teal-500/20 bg-slate-950"
              />
              <span className="text-xs text-slate-300">
                এই ডিভাইস মনে রাখুন (Auto Login Cache)
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-sm shadow-lg shadow-teal-500/25 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                <span>যাচাই করা হচ্ছে...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>সফটওয়্যারে প্রবেশ করুন (Login)</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Credentials Info Box */}
        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              প্রাইমারি এক্সেস তথ্য:
            </span>
            <span className="text-[10px] text-teal-400">১-ক্লিক ইনপুট</span>
          </div>
          
          <button
            type="button"
            onClick={() => handleQuickFill('superadmin', '4023')}
            className="w-full p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700/60 text-left transition flex items-center justify-between group"
          >
            <div>
              <div className="text-xs font-bold text-white group-hover:text-teal-300">
                👑 Super Admin (মালিক)
              </div>
              <div className="text-[11px] text-slate-400">
                ইউজার: <span className="text-slate-200">superadmin</span> | পিন: <span className="text-amber-400 font-mono font-bold">4023</span>
              </div>
            </div>
            <span className="text-[10px] px-2 py-1 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20 group-hover:bg-teal-500 group-hover:text-slate-950 transition">
              ক্লিক করুন
            </span>
          </button>

          <p className="text-[10px] text-slate-500 text-center pt-1">
            * নতুন কর্মী (Worker) বা ম্যানেজারের ইউজার ভেতরের ইউজার তৈরি অপশন থেকে তৈরি করতে পারবেন।
          </p>
        </div>

      </div>

      {/* Footer copyright */}
      <div className="mt-8 text-center text-xs text-slate-600">
        © 2026 শাহ আমানত ফিশারি অ্যান্ড এগ্রো প্রজেক্ট • সর্বস্বত্ব সংরক্ষিত
      </div>
    </div>
  );
}
