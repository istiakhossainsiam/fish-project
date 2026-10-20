import React from 'react';
import { 
  Waves, Package, Scale, TrendingUp, AlertTriangle, 
  Calendar, Droplets, ArrowUpRight, DollarSign, 
  CheckCircle2, Clock, Plus, CloudSun, Utensils,
  Users, Shield, User, HardHat, Sparkles, Activity,
  FileText, RotateCcw, Check, ArrowRight
} from 'lucide-react';

export default function Dashboard({ stats, ponds, weather, setActiveTab, onOpenModal, currentUser }) {
  if (!stats) return <div className="p-8 text-center text-slate-400">Loading Farm Overview...</div>;

  const role = currentUser?.role || 'superadmin';

  // -------------------------------------------------------------
  // 1. WORKER DASHBOARD (মাঠকর্মী সহজ ফিল্ড মোড)
  // -------------------------------------------------------------
  if (role === 'worker') {
    return (
      <div className="space-y-6 pb-20 md:pb-8">
        {/* Worker Greeting Banner */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-900 border border-amber-500/40 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-lg">
                <HardHat className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-bold text-white">মাঠকর্মী ড্যাশবোর্ড</h1>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    ফিল্ড ওয়ার্কার মোড
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  কর্মী: <strong className="text-white">{currentUser?.full_name || 'মাঠকর্মী'}</strong> • শাহ আমানত ফিশারি ও এগ্রো প্রকল্প, পতেঙ্গা
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('worker')}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-md flex items-center gap-1.5"
            >
              <HardHat className="w-4 h-4" /> সম্পূর্ণ কর্মী ইনপুট ফরম
            </button>
          </div>
        </div>

        {/* Aquaculture Weather Feeding Advisory */}
        {weather?.current && (
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-teal-500/30 shadow-md">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 mt-0.5">
                <CloudSun className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-teal-300 text-sm">আজকের আবহাওয়া ও খাবার দেওয়ার পরামর্শ</h3>
                  <span className="text-xs text-slate-400">তাপমাত্রা: {weather.current.temperature}°C • আর্দ্রতা: {weather.current.humidity}%</span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  💡 <strong>মাঠকর্মীদের জন্য টিপস:</strong> দুপুরের তীব্র রোদে বা মেঘলা আবহাওয়ায় মাছ খাবি খায় কিনা লক্ষ্য রাখুন। অক্সিজেন স্বাভাবিক থাকলে সকাল ৮-৯টায় এবং বিকেলে ৪-৫টায় নির্ধারিত ফিড দিন।
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TODAY'S POND FEEDING TASK CARDS */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Utensils className="w-5 h-5 text-amber-400" />
              আজকের পুকুরভিত্তিক খাবার দেওয়ার চেকলিস্ট (Daily Feeding Checklist)
            </h2>
            <span className="text-xs text-slate-400">স্পর্শ করে দ্রুত এন্ট্রি দিন</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ponds.filter(p => p.status === 'active').map((pond) => (
              <div 
                key={pond.id}
                className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 transition shadow-lg space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-pulse" />
                    <div>
                      <h3 className="font-bold text-white text-base">{pond.name}</h3>
                      <p className="text-xs text-slate-400">মোট মাছ: {pond.total_fish?.toLocaleString()} পিস</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    মোট খাবার: {pond.feed_bags_used} ব্যাগ
                  </span>
                </div>

                {/* Stocking quick info */}
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 text-xs space-y-1">
                  {pond.stockings?.map((st, i) => (
                    <div key={i} className="flex justify-between text-slate-300">
                      <span>• {st.fish_type}</span>
                      <span className="font-medium text-amber-300">{st.count_pcs.toLocaleString()} পিস {st.pcs_per_kg ? `(${st.pcs_per_kg} pc/kg)` : ''}</span>
                    </div>
                  ))}
                  {pond.vaat_kg_used > 0 && (
                    <div className="flex justify-between text-amber-400 pt-1 border-t border-slate-800">
                      <span>• রান্না করা ভাত:</span>
                      <span className="font-bold">{pond.vaat_kg_used} কেজি</span>
                    </div>
                  )}
                </div>

                {/* Action buttons with large touch targets */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => onOpenModal('feed', { pond_id: pond.id, feeding_time: 'সকাল' })}
                    className="p-3 rounded-xl bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-bold text-xs transition shadow flex flex-col items-center justify-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>সকালের ফিড</span>
                  </button>
                  <button
                    onClick={() => onOpenModal('feed', { pond_id: pond.id, feeding_time: 'বিকেল' })}
                    className="p-3 rounded-xl bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-bold text-xs transition shadow flex flex-col items-center justify-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>বিকেলের ফিড</span>
                  </button>
                  <button
                    onClick={() => onOpenModal('feed', { pond_id: pond.id, is_vaat: true })}
                    className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-750 text-amber-300 border border-amber-500/30 font-bold text-xs transition flex flex-col items-center justify-center gap-1"
                  >
                    <Utensils className="w-4 h-4" />
                    <span>ভাত এন্ট্রি</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 15-18 DAY GROWTH SAMPLING ACTION */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-teal-950/40 via-slate-900 to-slate-900 border border-teal-500/40 shadow-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center justify-center">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">১৫-১৮ দিনের মাছের বৃদ্ধি পরীক্ষা (Growth Sampling)</h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  পুকুরে খেপজাল ফেলে ১০-২০টি মাছ তুলে ওজন মাপুন এবং গড় ওজন সফটওয়্যারে রেকর্ড করুন।
                </p>
              </div>
            </div>
            <button
              onClick={() => onOpenModal('sampling')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition shadow flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> জাল ফেলে ওজন রেকর্ড করুন
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2. MANAGER DASHBOARD (ম্যানেজার তদারকি ও অপারেশনস মোড)
  // -------------------------------------------------------------
  if (role === 'manager') {
    const { project_overview, feed_summary, financial_summary, sampling_alerts } = stats;

    return (
      <div className="space-y-6 pb-20 md:pb-8">
        {/* Manager Header Banner */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-950/70 via-slate-900 to-slate-900 border border-cyan-500/40 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shadow-lg">
                <User className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-bold text-white">ম্যানেজার অপারেশনস ড্যাশবোর্ড</h1>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    ফার্ম ম্যানেজার
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  তদারককারী: <strong className="text-white">{currentUser?.full_name || 'ম্যানেজার'}</strong> • দৈনিক ফিডিং, স্টক ও খরচ তদারকি
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenModal('feed')}
                className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs transition shadow flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> খাবার এন্ট্রি
              </button>
              <button
                onClick={() => onOpenModal('expense')}
                className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition shadow flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> খরচ এন্ট্রি
              </button>
            </div>
          </div>
        </div>

        {/* FEED STOCK COUNTDOWN & INVENTORY ALERT */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-cyan-500/30 shadow-lg">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-base">ফিড ইনভেন্টরি ও রিমেইনিং স্টক ওয়াচ</h3>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    feed_summary.remaining_feed_bags < 50 
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {feed_summary.remaining_feed_bags < 50 ? '⚠️ রি-অর্ডার এলার্ট' : '✅ পর্যাপ্ত স্টক'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  মোট ৩১০ ব্যাগ এসেছে (ব্যাচ ২০২: ২১০ ব্যাগ @ ১৮২৫/১৮৭৫৳, ব্যাচ ২০৪: ১০০ ব্যাগ @ ১৭৭৫৳)। ব্যবহৃত হয়েছে: <strong className="text-white">{feed_summary.total_feed_bags_consumed} ব্যাগ</strong>।
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-slate-950/80 px-4 py-2.5 rounded-xl border border-slate-800 self-stretch md:self-auto justify-between md:justify-end">
              <div>
                <span className="text-[11px] text-slate-400 block">অবশিষ্ট স্টক</span>
                <span className="text-xl font-bold text-cyan-400">
                  {feed_summary.remaining_feed_bags % 1 === 0 ? feed_summary.remaining_feed_bags : Number(feed_summary.remaining_feed_bags).toFixed(1)} ব্যাগ
                </span>
              </div>
              <button
                onClick={() => onOpenModal('feed_inventory')}
                className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition"
              >
                + চালান যোগ
              </button>
            </div>
          </div>
        </div>

        {/* 15-18 DAY GROWTH SAMPLING ALERTS */}
        {sampling_alerts && sampling_alerts.length > 0 && (
          <div className="space-y-2">
            {sampling_alerts.map((alert, idx) => (
              <div 
                key={idx}
                className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg ${
                  alert.is_overdue 
                    ? 'bg-rose-950/40 border-rose-500/40 text-rose-200' 
                    : (alert.is_due_soon ? 'bg-amber-950/40 border-amber-500/40 text-amber-200' : 'bg-teal-950/40 border-teal-500/40 text-teal-200')
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${alert.is_overdue ? 'bg-rose-500/20 text-rose-400' : 'bg-teal-500/20 text-teal-400'}`}>
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{alert.pond_name}</span>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        alert.is_overdue ? 'bg-rose-500 text-white' : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                      }`}>
                        {alert.status_text}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      ১৫-১৮ দিন অন্তর বৃদ্ধির মাপ নেওয়া জরুরি। শেষ মাপ: {alert.ref_date} (গত {alert.days_elapsed} দিন আগে)। পরবর্তী তারিখ: {alert.next_due_date}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onOpenModal('sampling', { pond_id: alert.pond_id })}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-xs transition shadow whitespace-nowrap flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  ওজন স্যাম্পলিং রেকর্ড
                </button>
              </div>
            ))}
          </div>
        )}

        {/* WEATHER & DO ADVISORY */}
        {weather?.aquaculture_advisor && (
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mt-0.5">
                <CloudSun className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white text-sm">শাহ আমানত বিমানবন্দর ওয়েদার ও ডিজলভড অক্সিজেন (DO) সতর্কবার্তা</h3>
                  <button onClick={() => setActiveTab('weather')} className="text-xs text-teal-400 hover:text-teal-300">
                    পূর্বাভাস দেখুন →
                  </button>
                </div>
                <div className="mt-1 space-y-1">
                  {weather.aquaculture_advisor.map((adv, i) => (
                    <p key={i} className="text-xs text-slate-300">
                      • <strong className="text-teal-300">{adv.title}:</strong> {adv.message}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PONDS OPERATIONAL OVERVIEW */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Waves className="w-4 h-4 text-cyan-400" />
              পুকুর সমূহের তদারকি (Pond Operations)
            </h2>
            <button
              onClick={() => setActiveTab('ponds')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
            >
              সকল পুকুর বিস্তারিত →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ponds.map((pond) => (
              <div 
                key={pond.id}
                className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition shadow space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-3 h-3 rounded-full ${pond.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
                    <h3 className="font-bold text-white text-base">{pond.name}</h3>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">{pond.status === 'active' ? 'চলমান' : 'প্রস্তুতি'}</span>
                </div>

                {pond.status === 'active' && (
                  <>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="text-slate-400 block">মোট ফিড ব্যবহার</span>
                        <span className="font-bold text-white text-sm">{pond.feed_bags_used} ব্যাগ</span>
                        <span className="text-[11px] text-amber-300 block">ভাত: {pond.vaat_kg_used} কেজি</span>
                      </div>
                      <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="text-slate-400 block">সর্বশেষ নমুনা ওজন</span>
                        {pond.latest_sampling ? (
                          <span className="font-bold text-teal-300 text-sm">
                            {pond.latest_sampling.avg_weight_grams} গ্রাম ({pond.latest_sampling.calculated_pcs_per_kg}/kg)
                          </span>
                        ) : (
                          <span className="text-slate-500 italic block">মাপ বাকি</span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => onOpenModal('feed', { pond_id: pond.id })}
                        className="flex-1 py-1.5 rounded-lg bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 text-xs font-semibold border border-teal-500/30 transition text-center"
                      >
                        + খাবার যোগ
                      </button>
                      <button
                        onClick={() => onOpenModal('sampling', { pond_id: pond.id })}
                        className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition text-center"
                      >
                        + স্যাম্পলিং
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 3. SUPERADMIN DASHBOARD (মালিক ও এক্সিকিউটিভ ড্যাশবোর্ড)
  // -------------------------------------------------------------
  const { project_overview, feed_summary, financial_summary, sampling_alerts } = stats;

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Super Admin Welcome Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/30 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-white">সুপারএডমিন ড্যাশবোর্ড (Super Admin)</h1>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  পূর্ণ নিয়ন্ত্রণ ও মালিকানা
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                শাহ আমানত ফিশারি অ্যান্ড এগ্রো প্রজেক্ট • ৪টি পুকুর • সর্বমোট ব্যবসায়িক ও আর্থিক সারসংক্ষেপ
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('users')}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 font-semibold text-xs transition shadow flex items-center gap-1.5"
            >
              <Users className="w-4 h-4" /> ইউজার তৈরি ও নিয়ন্ত্রণ
            </button>
            <button
              onClick={() => setActiveTab('cycles')}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" /> ৬ মাসের সাইকেল
            </button>
          </div>
        </div>
      </div>

      {/* 15-18 DAY GROWTH CHECK ALERT BANNER */}
      {sampling_alerts && sampling_alerts.length > 0 && (
        <div className="space-y-2">
          {sampling_alerts.map((alert, idx) => (
            <div 
              key={idx}
              className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg ${
                alert.is_overdue 
                  ? 'bg-rose-950/40 border-rose-500/40 text-rose-200' 
                  : (alert.is_due_soon ? 'bg-amber-950/40 border-amber-500/40 text-amber-200' : 'bg-teal-950/40 border-teal-500/40 text-teal-200')
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${alert.is_overdue ? 'bg-rose-500/20 text-rose-400' : 'bg-teal-500/20 text-teal-400'}`}>
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm sm:text-base text-white">{alert.pond_name}</span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      alert.is_overdue ? 'bg-rose-500 text-white' : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                    }`}>
                      {alert.status_text}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    ১৫-১৮ দিন অন্তর বৃদ্ধির মাপ নেওয়া জরুরি। শেষ মাপ/স্টকিং: {alert.ref_date} (গত {alert.days_elapsed} দিন আগে)। পরবর্তী মাপের তারিখ: {alert.next_due_date}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onOpenModal('sampling', { pond_id: alert.pond_id })}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-xs transition shadow-md whitespace-nowrap flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                ওজন স্যাম্পলিং রেকর্ড করুন
              </button>
            </div>
          ))}
        </div>
      )}

      {/* AQUACULTURE WEATHER & DISSOLVED OXYGEN (DO) ADVISORY */}
      {weather?.aquaculture_advisor && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800/90 border border-slate-700/80 shadow-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mt-0.5">
                <CloudSun className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white text-sm">আবহাওয়া ও জলজ সতর্কতা (Aquaculture Advisory)</h3>
                  <span className="text-xs text-slate-400">শাহ আমানত বিমানবন্দর • তাপমাত্রা: {weather.current?.temperature}°C</span>
                </div>
                <div className="mt-1 space-y-1">
                  {weather.aquaculture_advisor.map((adv, i) => (
                    <p key={i} className="text-xs text-slate-300">
                      • <strong className="text-teal-300">{adv.title}:</strong> {adv.message}
                    </p>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('weather')}
              className="text-xs text-teal-400 hover:text-teal-300 font-medium whitespace-nowrap flex items-center gap-1 self-end sm:self-center"
            >
              ৭ দিনের পূর্বাভাস <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* PRIMARY KPI METRICS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Ponds & Fish Count */}
        <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/70 hover:border-slate-600 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">মোট পুকুর ও মাছ</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <Waves className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-bold text-white">
              {project_overview.total_fish_count.toLocaleString()} <span className="text-xs text-teal-400 font-normal">পিস মাছ</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              ৪টি পুকুর • ২টি চলমান
            </p>
          </div>
        </div>

        {/* Feed Stock (310 Bags Received) */}
        <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/70 hover:border-slate-600 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">ফিড স্টক (Feed Bags)</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-bold text-white">
              {feed_summary.remaining_feed_bags % 1 === 0 ? feed_summary.remaining_feed_bags : Number(feed_summary.remaining_feed_bags).toFixed(1)} <span className="text-xs text-cyan-400 font-normal">ব্যাগ অবশিষ্ট</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              মোট ৩১০ ব্যাগ এসেছে (ব্যবহৃত: {feed_summary.total_feed_bags_consumed} ব্যাগ)
            </p>
          </div>
        </div>

        {/* Vaat (Cooked Rice) */}
        <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/70 hover:border-slate-600 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">ভাত ট্র্যাকিং (Cooked Vaat)</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Utensils className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-bold text-white">
              {feed_summary.total_vaat_kg_consumed} <span className="text-xs text-amber-400 font-normal">কেজি</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {feed_summary.total_vaat_kg_consumed === 0 ? "এখনও ভাত দেওয়া হয়নি (পরবর্তীতে দেওয়া হবে)" : "ভাত ও ফিড মিশ্রণ চলমান"}
            </p>
          </div>
        </div>

        {/* Current Biomass */}
        <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/70 hover:border-slate-600 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">বর্তমান আনুমানিক বায়োমাস</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-bold text-white">
              {project_overview.current_estimated_biomass_kg.toLocaleString()} <span className="text-xs text-indigo-400 font-normal">কেজি</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              হার্ভেস্ট টার্গেট: ~{Math.round(project_overview.projected_harvest_biomass_kg).toLocaleString()} কেজি ({Math.round(project_overview.projected_harvest_biomass_kg / 40).toLocaleString()} মণ)
            </p>
          </div>
        </div>
      </div>

      {/* FINANCIALS & PROJECTED PROFIT HIGHLIGHT */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-teal-950/40 border border-teal-500/30 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 uppercase tracking-wider">
                Financials & Profit Forecast
              </span>
              <span className="text-xs text-slate-400">সুপারএডমিন হিসাব ও সম্ভাব্য মুনাফা</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-3">
              <div>
                <span className="text-xs text-slate-400">মোট বিনিয়োগ (এখন পর্যন্ত)</span>
                <div className="text-lg sm:text-xl font-bold text-slate-100">
                  ৳ {financial_summary.total_investment_bdt.toLocaleString()}
                </div>
                <span className="text-[11px] text-slate-400">ফিড: ৳{financial_summary.feed_cost_bdt.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400">সম্ভাব্য মোট বিক্রয়মূল্য</span>
                <div className="text-lg sm:text-xl font-bold text-teal-400">
                  ৳ {financial_summary.projected_harvest_revenue_bdt.toLocaleString()}
                </div>
                <span className="text-[11px] text-teal-300/80">টার্গেট ১.২ কেজি পাঙ্গাশ @ ১৫৫৳</span>
              </div>
              <div>
                <span className="text-xs text-slate-400">সম্ভাব্য নীট লাভ (Net Profit)</span>
                <div className="text-lg sm:text-xl font-bold text-emerald-400">
                  + ৳ {financial_summary.projected_net_profit_bdt.toLocaleString()}
                </div>
                <span className="text-[11px] text-emerald-400/80">সম্ভাব্য ROI: ~{financial_summary.estimated_roi_pct}%</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start md:self-center">
            <button
              onClick={() => setActiveTab('investors')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 text-xs font-medium transition flex items-center gap-1.5"
            >
              ইনভেস্টর ক্যালকুলেটর <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* QUICK ACTION BUTTONS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => onOpenModal('feed')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs shadow-md transition whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> দৈনিক খাবার এন্ট্রি (Daily Feed)
        </button>
        <button
          onClick={() => onOpenModal('sampling')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 font-medium text-xs transition whitespace-nowrap"
        >
          <Scale className="w-4 h-4" /> ১৫ দিনের বৃদ্ধি স্যাম্পলিং
        </button>
        <button
          onClick={() => onOpenModal('feed_inventory')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 font-medium text-xs transition whitespace-nowrap"
        >
          <Package className="w-4 h-4" /> নতুন ফিড চালান যোগ
        </button>
        <button
          onClick={() => onOpenModal('expense')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-medium text-xs transition whitespace-nowrap"
        >
          <DollarSign className="w-4 h-4" /> খরচ এন্ট্রি (Expense)
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-medium text-xs transition whitespace-nowrap"
        >
          <Users className="w-4 h-4" /> ইউজার তৈরি ও একাউন্ট
        </button>
      </div>

      {/* 4 PONDS DETAILED OVERVIEW */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Waves className="w-4 h-4 text-teal-400" />
            প্রকল্পের ৪টি পুকুরের বর্তমান অবস্থা (Pond Status)
          </h2>
          <button
            onClick={() => setActiveTab('ponds')}
            className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 font-medium"
          >
            সব পুকুরের হিসাব <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ponds.map((pond) => {
            const isActive = pond.status === 'active';
            return (
              <div
                key={pond.id}
                className={`p-5 rounded-2xl border transition ${
                  isActive
                    ? 'bg-slate-800/80 border-slate-700 hover:border-teal-500/50 shadow-md'
                    : 'bg-slate-850/50 border-slate-800/80 opacity-75'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
                    <h3 className="font-bold text-white text-base">{pond.name}</h3>
                  </div>
                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                    isActive 
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' 
                      : 'bg-slate-700 text-slate-300'
                  }`}>
                    {pond.status === 'active' ? 'চলমান (Active)' : 'প্রস্তুতি (Preparing)'}
                  </span>
                </div>

                {isActive ? (
                  <div className="mt-4 space-y-3">
                    {/* Stocking Details */}
                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                      <div className="text-slate-400 font-medium">স্টক করা মাছের বিবরণ:</div>
                      {pond.stockings?.map((st, i) => (
                        <div key={i} className="flex justify-between items-center text-slate-200">
                          <span>• {st.fish_type} ({st.date})</span>
                          <span className="font-semibold text-teal-300">
                            {st.count_pcs.toLocaleString()} pcs {st.pcs_per_kg ? `@ ${st.pcs_per_kg} pcs/kg` : ''}
                          </span>
                        </div>
                      ))}
                      <div className="pt-1.5 border-t border-slate-800 flex justify-between font-bold text-white">
                        <span>মোট মাছ:</span>
                        <span className="text-teal-400">{pond.total_fish?.toLocaleString()} pcs</span>
                      </div>
                    </div>

                    {/* Feed & Sampling status */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="text-slate-400 block">মোট ফিড দেওয়া হয়েছে</span>
                        <span className="font-bold text-white text-sm">{pond.feed_bags_used} ব্যাগ</span>
                        <span className="text-[11px] text-amber-300 block">ভাত: {pond.vaat_kg_used} কেজি</span>
                      </div>
                      <div className="bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="text-slate-400 block">সর্বশেষ নমুনা ওজন</span>
                        {pond.latest_sampling ? (
                          <>
                            <span className="font-bold text-teal-300 text-sm">
                              {pond.latest_sampling.avg_weight_grams} গ্রাম ({pond.latest_sampling.calculated_pcs_per_kg}/kg)
                            </span>
                            <span className="text-[11px] text-slate-400 block">FCR: {pond.latest_sampling.fcr}</span>
                          </>
                        ) : (
                          <span className="text-slate-500 italic block">স্যাম্পলিং বাকি</span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => onOpenModal('feed', { pond_id: pond.id })}
                        className="flex-1 py-1.5 rounded-lg bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 text-xs font-medium border border-teal-500/30 transition text-center"
                      >
                        + খাবার যোগ
                      </button>
                      <button
                        onClick={() => onOpenModal('sampling', { pond_id: pond.id })}
                        className="flex-1 py-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-600 transition text-center"
                      >
                        + বৃদ্ধি স্যাম্পলিং
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 text-center space-y-2">
                    <p className="text-xs text-slate-400">
                      {pond.notes || "বর্তমানে কোন মাছ নেই। পরবর্তী চালানের প্রস্তুতি চলছে।"}
                    </p>
                    <button
                      onClick={() => onOpenModal('stocking', { pond_id: pond.id })}
                      className="px-4 py-1.5 rounded-lg bg-teal-600/80 hover:bg-teal-600 text-white text-xs font-medium transition"
                    >
                      + নতুন পোনা ফেলুন (Stock Fish)
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
