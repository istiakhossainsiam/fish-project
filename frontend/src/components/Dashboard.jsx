import React from 'react';
import { 
  Waves, Package, Scale, TrendingUp, AlertTriangle, 
  Calendar, Droplets, ArrowUpRight, DollarSign, 
  CheckCircle2, Clock, Plus, CloudSun, Utensils,
  Users, Shield, User, HardHat, Sparkles, Activity,
  FileText, RotateCcw, Check, ArrowRight
} from 'lucide-react';

export default function Dashboard({ stats, ponds, weather, setActiveTab, onOpenModal, currentUser }) {
  if (!stats) return <div className="p-8 text-center text-slate-500 font-medium">Loading Farm Overview...</div>;

  const role = currentUser?.role || 'superadmin';

  // -------------------------------------------------------------
  // 1. WORKER DASHBOARD (মাঠকর্মী সহজ ফিল্ড মোড)
  // -------------------------------------------------------------
  if (role === 'worker') {
    return (
      <div className="space-y-6 pb-20 md:pb-8">
        {/* Worker Greeting Banner */}
        <div className="card-surface p-5 sm:p-6 rounded-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-700 border border-amber-200/80 flex items-center justify-center shadow-xs">
                <HardHat className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 bg-clip-text text-transparent">মাঠকর্মী ড্যাশবোর্ড</h1>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80">
                    ফিল্ড ওয়ার্কার মোড
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  কর্মী: <strong className="text-slate-800">{currentUser?.full_name || 'মাঠকর্মী'}</strong> • শাহ আমানত ফিশারি ও এগ্রো প্রকল্প, পতেঙ্গা
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => onOpenModal('bulk_feed')}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200/80 font-bold text-xs transition-all active:scale-[0.98] shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-teal-700" /> + বাল্ক খাবার
              </button>
              <button
                onClick={() => setActiveTab('worker')}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-all active:scale-[0.98] shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <HardHat className="w-4 h-4" /> সম্পূর্ণ ইনপুট ফরম
              </button>
            </div>
          </div>
        </div>

        {/* Aquaculture Weather Feeding Advisory */}
        {weather?.current && (
          <div className="card-surface p-4 sm:p-5 rounded-2xl">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700 border border-teal-200/80 mt-0.5 shadow-xs">
                <CloudSun className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="font-bold text-slate-900 text-sm">আজকের আবহাওয়া ও খাবার দেওয়ার পরামর্শ</h3>
                  <span className="text-xs text-slate-500 font-mono tabular-nums">তাপমাত্রা: {weather.current.temperature}°C • আর্দ্রতা: {weather.current.humidity}%</span>
                </div>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  💡 <strong>মাঠকর্মীদের জন্য টিপস:</strong> দুপুরের তীব্র রোদে বা মেঘলা আবহাওয়ায় মাছ খাবি খায় কিনা লক্ষ্য রাখুন। অক্সিজেন স্বাভাবিক থাকলে সকাল ৮-৯টায় এবং বিকেলে ৪-৫টায় নির্ধারিত ফিড দিন।
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TODAY'S POND FEEDING TASK CARDS */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Utensils className="w-4.5 h-4.5 text-amber-600" />
              আজকের পুকুরভিত্তিক খাবার দেওয়ার চেকলিস্ট (Daily Feeding Checklist)
            </h2>
            <span className="text-xs text-slate-500 font-medium">স্পর্শ করে দ্রুত এন্ট্রি দিন</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ponds.filter(p => p.status === 'active').map((pond) => (
              <div 
                key={pond.id}
                className="card-surface p-5 rounded-2xl space-y-4 hover:border-amber-400/80 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm animate-pulse" />
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{pond.name}</h3>
                      <p className="text-xs text-slate-500 font-medium font-mono tabular-nums">মোট মাছ: {pond.total_fish?.toLocaleString()} পিস</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200/80 font-mono tabular-nums">
                    মোট খাবার: {pond.feed_bags_used} ব্যাগ
                  </span>
                </div>

                {/* Stocking quick info */}
                <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80 text-xs space-y-1.5">
                  {pond.stockings?.map((st, i) => (
                    <div key={i} className="flex justify-between text-slate-700">
                      <span>• {st.fish_type}</span>
                      <span className="font-bold text-amber-800 font-mono tabular-nums">{st.count_pcs.toLocaleString()} পিস {st.pcs_per_kg ? `(${st.pcs_per_kg} pc/kg)` : ''}</span>
                    </div>
                  ))}
                  {pond.vaat_kg_used > 0 && (
                    <div className="flex justify-between text-amber-800 pt-1.5 border-t border-slate-200/80">
                      <span>• রান্না করা ভাত:</span>
                      <span className="font-bold font-mono tabular-nums">{pond.vaat_kg_used} কেজি</span>
                    </div>
                  )}
                </div>

                {/* Action buttons with large touch targets */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => onOpenModal('feed', { pond_id: pond.id, feeding_time: 'সকাল' })}
                    className="p-3 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white font-bold text-xs transition shadow-xs flex flex-col items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-white" />
                    <span>সকালের ফিড</span>
                  </button>
                  <button
                    onClick={() => onOpenModal('feed', { pond_id: pond.id, feeding_time: 'বিকেল' })}
                    className="p-3 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white font-bold text-xs transition shadow-xs flex flex-col items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-white" />
                    <span>বিকেলের ফিড</span>
                  </button>
                  <button
                    onClick={() => onOpenModal('feed', { pond_id: pond.id, is_vaat: true })}
                    className="p-3 rounded-xl bg-white hover:bg-amber-50 active:scale-[0.98] text-amber-800 border border-amber-300/80 font-bold text-xs transition shadow-xs flex flex-col items-center justify-center gap-1 cursor-pointer"
                  >
                    <Utensils className="w-4 h-4 text-amber-700" />
                    <span>ভাত এন্ট্রি</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 15-18 DAY GROWTH SAMPLING ACTION */}
        <div className="card-surface p-5 rounded-2xl border-teal-200/80">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 border border-teal-200/80 flex items-center justify-center shadow-xs">
                <Scale className="w-5 h-5 text-teal-700" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">১৫-১৮ দিনের মাছের বৃদ্ধি পরীক্ষা (Growth Sampling)</h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  পুকুরে খেপজাল ফেলে ১০-২০টি মাছ তুলে ওজন মাপুন এবং গড় ওজন সফটওয়্যারে রেকর্ড করুন।
                </p>
              </div>
            </div>
            <button
              onClick={() => onOpenModal('sampling')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white font-bold text-xs transition shadow-xs flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4 text-white" /> জাল ফেলে ওজন রেকর্ড করুন
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
        <div className="card-surface p-5 sm:p-6 rounded-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-700 border border-cyan-200/80 flex items-center justify-center shadow-xs">
                <User className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 bg-clip-text text-transparent">ম্যানেজার অপারেশনস ড্যাশবোর্ড</h1>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200/80">
                    ফার্ম ম্যানেজার
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  তদারককারী: <strong className="text-slate-800">{currentUser?.full_name || 'ম্যানেজার'}</strong> • দৈনিক ফিডিং, স্টক ও খরচ তদারকি
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => onOpenModal('bulk_feed')}
                className="px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200/80 font-bold text-xs transition-all active:scale-[0.98] shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-teal-700" /> + বাল্ক খাবার
              </button>
              <button
                onClick={() => onOpenModal('bulk_expense')}
                className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 font-bold text-xs transition-all active:scale-[0.98] shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-amber-700" /> + বাল্ক খরচ
              </button>
              <button
                onClick={() => onOpenModal('stocking')}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all active:scale-[0.98] shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-white" /> + নতুন মাছ মজুত
              </button>
            </div>
          </div>
        </div>

        {/* FEED STOCK COUNTDOWN & INVENTORY ALERT */}
        <div className="card-surface p-4 sm:p-5 rounded-2xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-xl bg-cyan-50 text-cyan-700 border border-cyan-200/80 shadow-xs">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-base">ফিড ইনভেন্টরি ও রিমেইনিং স্টক ওয়াচ</h3>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    feed_summary.remaining_feed_bags < 50 
                      ? 'bg-rose-50 text-rose-800 border border-rose-200/80' 
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
                  }`}>
                    {feed_summary.remaining_feed_bags < 50 ? '⚠️ রি-অর্ডার এলার্ট' : '✅ পর্যাপ্ত স্টক'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  মোট ৩১০ ব্যাগ এসেছে (ব্যবহৃত: <strong className="text-slate-900 font-mono tabular-nums">{feed_summary.total_feed_bags_consumed} ব্যাগ</strong>)।
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-slate-50/80 px-4 py-2.5 rounded-xl border border-slate-200/80 self-stretch md:self-auto justify-between md:justify-end">
              <div>
                <span className="text-[11px] text-slate-500 font-medium block">অবশিষ্ট স্টক</span>
                <span className="text-xl font-black text-cyan-700 font-mono tabular-nums">
                  {feed_summary.remaining_feed_bags % 1 === 0 ? feed_summary.remaining_feed_bags : Number(feed_summary.remaining_feed_bags).toFixed(1)} ব্যাগ
                </span>
              </div>
              <button
                onClick={() => onOpenModal('feed_inventory')}
                className="px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold transition-all active:scale-[0.98] cursor-pointer"
              >
                + চালান যোগ
              </button>
            </div>
          </div>
        </div>

        {/* 15-18 DAY GROWTH SAMPLING ALERTS */}
        {sampling_alerts && sampling_alerts.length > 0 && (
          <div className="space-y-2.5">
            {sampling_alerts.map((alert, idx) => (
              <div 
                key={idx}
                className={`card-surface p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  alert.is_overdue 
                    ? 'border-rose-200/90 bg-rose-50/40 text-rose-900' 
                    : (alert.is_due_soon ? 'border-amber-200/90 bg-amber-50/40 text-amber-900' : 'border-teal-200/90 bg-teal-50/40 text-teal-950')
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${alert.is_overdue ? 'bg-rose-100 text-rose-600' : (alert.is_due_soon ? 'bg-amber-100 text-amber-700' : 'bg-teal-100 text-teal-700')}`}>
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{alert.pond_name}</span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        alert.is_overdue ? 'bg-rose-600 text-white' : (alert.is_due_soon ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-teal-100 text-teal-800 border border-teal-300')
                      }`}>
                        {alert.status_text}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      ১৫-১৮ দিন অন্তর বৃদ্ধির মাপ নেওয়া জরুরি। শেষ মাপ: <strong className="text-slate-800 font-mono tabular-nums">{alert.ref_date}</strong> (গত {alert.days_elapsed} দিন আগে)। পরবর্তী তারিখ: <strong className="text-slate-800 font-mono tabular-nums">{alert.next_due_date}</strong>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onOpenModal('sampling', { pond_id: alert.pond_id })}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white font-bold text-xs transition shadow-xs whitespace-nowrap flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-white" />
                  ওজন স্যাম্পলিং রেকর্ড
                </button>
              </div>
            ))}
          </div>
        )}

        {/* WEATHER & DO ADVISORY */}
        {weather?.aquaculture_advisor && (
          <div className="card-surface p-4 rounded-2xl">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 mt-0.5">
                <CloudSun className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-sm">উপকূলীয় আবহাওয়া ও অক্সিজেন সতর্কতা</h3>
                  <span className="text-xs text-slate-500 font-medium font-mono tabular-nums">শাহ আমানত বিমানবন্দর • তাপমাত্রা: {weather.current?.temperature}°C</span>
                </div>
                <div className="mt-1 space-y-1">
                  {weather.aquaculture_advisor.map((adv, i) => (
                    <p key={i} className="text-xs text-slate-600">
                      • <strong className="text-teal-700 font-bold">{adv.title}:</strong> {adv.message}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PONDS LIST FOR MANAGER */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ponds.map((pond) => (
            <div
              key={pond.id}
              className={`card-surface p-5 rounded-2xl transition-all ${
                pond.status === 'active' ? 'hover:border-teal-400/80' : 'opacity-85'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-3 h-3 rounded-full ${pond.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                  <h3 className="font-bold text-slate-900 text-base">{pond.name}</h3>
                </div>
                <span className="text-xs text-slate-500 font-bold">{pond.status === 'active' ? 'চলমান' : 'প্রস্তুতি'}</span>
              </div>

              {pond.status === 'active' && (
                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/80">
                      <span className="text-slate-500 font-medium block">মোট ফিড ব্যবহার</span>
                      <span className="font-bold text-slate-900 text-sm font-mono tabular-nums">{pond.feed_bags_used} ব্যাগ</span>
                      <span className="text-[11px] text-amber-700 font-bold block font-mono tabular-nums">ভাত: {pond.vaat_kg_used} কেজি</span>
                    </div>
                    <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/80">
                      <span className="text-slate-500 font-medium block">সর্বশেষ নমুনা ওজন</span>
                      {pond.latest_sampling ? (
                        <span className="font-bold text-teal-700 text-sm block font-mono tabular-nums">
                          {pond.latest_sampling.avg_weight_grams} গ্রাম ({pond.latest_sampling.calculated_pcs_per_kg}/kg)
                        </span>
                      ) : (
                        <span className="text-slate-400 italic block">মাপ বাকি</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => onOpenModal('feed', { pond_id: pond.id })}
                      className="flex-1 py-1.5 rounded-lg bg-teal-50 text-teal-800 hover:bg-teal-100 text-xs font-bold border border-teal-200/80 transition-all active:scale-[0.98] text-center cursor-pointer"
                    >
                      + খাবার যোগ
                    </button>
                    <button
                      onClick={() => onOpenModal('sampling', { pond_id: pond.id })}
                      className="flex-1 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200/80 transition-all active:scale-[0.98] text-center cursor-pointer"
                    >
                      + স্যাম্পলিং
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
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
      <div className="card-surface p-5 sm:p-6 rounded-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-700 border border-teal-200/80 flex items-center justify-center shadow-xs">
              <Shield className="w-6 h-6 text-teal-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 bg-clip-text text-transparent">সুপারএডমিন ড্যাশবোর্ড (Super Admin)</h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                  পূর্ণ নিয়ন্ত্রণ ও মালিকানা
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                শাহ আমানত ফিশারি অ্যান্ড এগ্রো প্রজেক্ট • ৪টি পুকুর • সর্বমোট ব্যবসায়িক ও আর্থিক সারসংক্ষেপ
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('users')}
              className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold text-xs transition-all active:scale-[0.98] shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Users className="w-4 h-4 text-slate-600" /> ইউজার তৈরি
            </button>
            <button
              onClick={() => setActiveTab('cycles')}
              className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition-all active:scale-[0.98] shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-white" /> ৬ মাসের সাইকেল
            </button>
          </div>
        </div>
      </div>

      {/* 15-18 DAY GROWTH CHECK ALERT BANNER */}
      {sampling_alerts && sampling_alerts.length > 0 && (
        <div className="space-y-2.5">
          {sampling_alerts.map((alert, idx) => (
            <div 
              key={idx}
              className={`card-surface p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                alert.is_overdue 
                  ? 'border-rose-200/90 bg-rose-50/40 text-rose-900' 
                  : (alert.is_due_soon ? 'border-amber-200/90 bg-amber-50/40 text-amber-900' : 'border-teal-200/90 bg-teal-50/40 text-teal-950')
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${alert.is_overdue ? 'bg-rose-100 text-rose-600' : (alert.is_due_soon ? 'bg-amber-100 text-amber-700' : 'bg-teal-100 text-teal-700')}`}>
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm sm:text-base text-slate-900">{alert.pond_name}</span>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      alert.is_overdue 
                        ? 'bg-rose-600 text-white' 
                        : (alert.is_due_soon ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-teal-100 text-teal-800 border border-teal-300')
                    }`}>
                      {alert.status_text}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    ১৫-১৮ দিন অন্তর বৃদ্ধির মাপ নেওয়া জরুরি। শেষ মাপ/স্টকিং: <strong className="text-slate-800 font-mono tabular-nums">{alert.ref_date}</strong> (গত {alert.days_elapsed} দিন আগে)। পরবর্তী মাপের তারিখ: <strong className="text-slate-800 font-mono tabular-nums">{alert.next_due_date}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => onOpenModal('sampling', { pond_id: alert.pond_id })}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white font-bold text-xs transition shadow-xs whitespace-nowrap flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-white" />
                ওজন স্যাম্পলিং রেকর্ড করুন
              </button>
            </div>
          ))}
        </div>
      )}

      {/* AQUACULTURE WEATHER & DISSOLVED OXYGEN (DO) ADVISORY */}
      {weather?.aquaculture_advisor && (
        <div className="card-surface p-4 sm:p-5 rounded-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 mt-0.5 shadow-xs">
                <CloudSun className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-sm">আবহাওয়া ও জলজ সতর্কতা (Aquaculture Advisory)</h3>
                  <span className="text-xs text-slate-500 font-medium font-mono tabular-nums">শাহ আমানত বিমানবন্দর • তাপমাত্রা: {weather.current?.temperature}°C</span>
                </div>
                <div className="mt-1 space-y-1">
                  {weather.aquaculture_advisor.map((adv, i) => (
                    <p key={i} className="text-xs text-slate-600">
                      • <strong className="text-teal-700 font-bold">{adv.title}:</strong> {adv.message}
                    </p>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('weather')}
              className="text-xs text-teal-700 hover:text-teal-800 font-bold whitespace-nowrap flex items-center gap-1 self-end sm:self-center transition-colors"
            >
              ৭ দিনের পূর্বাভাস <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* PRIMARY KPI METRICS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Ponds & Fish Count */}
        <div className="card-surface p-4 sm:p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold">মোট পুকুর ও মাছ</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-100 shadow-xs">
              <Waves className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono tabular-nums">
              {project_overview.total_fish_count.toLocaleString()} <span className="text-xs text-teal-700 font-bold font-sans">পিস</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              ৪টি পুকুর • ২টি চলমান
            </p>
          </div>
        </div>

        {/* Feed Stock */}
        <div className="card-surface p-4 sm:p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold">অবশিষ্ট ফিড ব্যাগ</span>
            <div className="p-2 rounded-xl bg-cyan-50 text-cyan-700 border border-cyan-100 shadow-xs">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono tabular-nums">
              {feed_summary.remaining_feed_bags % 1 === 0 ? feed_summary.remaining_feed_bags : Number(feed_summary.remaining_feed_bags).toFixed(1)} <span className="text-xs text-cyan-700 font-bold font-sans">ব্যাগ</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium font-mono tabular-nums">
              ব্যবহৃত: {feed_summary.total_feed_bags_consumed} ব্যাগ
            </p>
          </div>
        </div>

        {/* Vaat (Cooked Rice) */}
        <div className="card-surface p-4 sm:p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold">ভাত ট্র্যাকিং (Cooked Vaat)</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 shadow-xs">
              <Utensils className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono tabular-nums">
              {feed_summary.total_vaat_kg_consumed} <span className="text-xs text-amber-700 font-bold font-sans">কেজি</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {feed_summary.total_vaat_kg_consumed === 0 ? "পরবর্তীতে যুক্ত হবে" : "ভাত ও ফিড মিশ্রণ চলমান"}
            </p>
          </div>
        </div>

        {/* Current Biomass */}
        <div className="card-surface p-4 sm:p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold">আনুমানিক বায়োমাস</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-xs">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono tabular-nums">
              {project_overview.current_estimated_biomass_kg.toLocaleString()} <span className="text-xs text-indigo-700 font-bold font-sans">কেজি</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium font-mono tabular-nums">
              টার্গেট: ~{Math.round(project_overview.projected_harvest_biomass_kg).toLocaleString()} কেজি
            </p>
          </div>
        </div>
      </div>

      {/* FINANCIALS & PROJECTED PROFIT HIGHLIGHT */}
      <div className="card-surface p-5 sm:p-6 rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200/80 uppercase tracking-wider">
                Financials & Profit Forecast
              </span>
              <span className="text-xs text-slate-500 font-medium">সুপারএডমিন হিসাব ও সম্ভাব্য মুনাফা</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mt-3">
              <div>
                <span className="text-xs text-slate-500 block font-medium">মোট বিনিয়োগ (এখন পর্যন্ত)</span>
                <div className="text-lg sm:text-2xl font-black text-slate-900 mt-0.5 font-mono tabular-nums">
                  ৳ {financial_summary.total_investment_bdt.toLocaleString()}
                </div>
                <span className="text-[11px] text-slate-500 font-mono tabular-nums">ফিড: ৳{financial_summary.feed_cost_bdt.toLocaleString()} • পোনা: ৳{financial_summary.pona_cost_bdt.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block font-medium">সম্ভাব্য মোট বিক্রয়মূল্য</span>
                <div className="text-lg sm:text-2xl font-black text-teal-700 mt-0.5 font-mono tabular-nums">
                  ৳ {financial_summary.projected_harvest_revenue_bdt.toLocaleString()}
                </div>
                <span className="text-[11px] text-teal-600 font-medium">টার্গেট ১.২ কেজি পাঙ্গাশ @ ১৫৫৳ (~৭৫.৫ টন)</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block font-medium">সম্ভাব্য নীট লাভ (পুরো সাইকেল)</span>
                <div className="text-lg sm:text-2xl font-black text-emerald-700 mt-0.5 font-mono tabular-nums">
                  + ৳ {financial_summary.projected_net_profit_bdt.toLocaleString()}
                </div>
                <span className="text-[11px] text-emerald-700 font-bold font-mono tabular-nums">সম্ভাব্য ROI: ~{financial_summary.estimated_roi_pct}%</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start md:self-center">
            <button
              onClick={() => setActiveTab('investors')}
              className="px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-[0.98] text-slate-800 border border-slate-300/80 text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              ইনভেস্টর ক্যালকুলেটর <ArrowUpRight className="w-4 h-4 text-teal-700" />
            </button>
          </div>
        </div>
      </div>

      {/* QUICK ACTION BUTTONS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => onOpenModal('bulk_feed')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white font-bold text-xs shadow-xs transition whitespace-nowrap cursor-pointer"
        >
          <Plus className="w-4 h-4 text-white" /> + বাল্ক খাবার এন্ট্রি
        </button>
        <button
          onClick={() => onOpenModal('bulk_expense')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white font-bold text-xs shadow-xs transition whitespace-nowrap cursor-pointer"
        >
          <Plus className="w-4 h-4 text-white" /> + বাল্ক খরচ এন্ট্রি
        </button>
        <button
          onClick={() => onOpenModal('feed')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 active:scale-[0.98] text-slate-700 border border-slate-200 font-semibold text-xs shadow-xs transition whitespace-nowrap cursor-pointer"
        >
          <Plus className="w-4 h-4 text-teal-600" /> একক খাবার
        </button>
        <button
          onClick={() => onOpenModal('sampling')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 active:scale-[0.98] text-slate-700 border border-slate-200 font-semibold text-xs shadow-xs transition whitespace-nowrap cursor-pointer"
        >
          <Scale className="w-4 h-4 text-teal-700" /> বৃদ্ধি স্যাম্পলিং
        </button>
        <button
          onClick={() => onOpenModal('feed_inventory')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 active:scale-[0.98] text-slate-700 border border-slate-200 font-semibold text-xs shadow-xs transition whitespace-nowrap cursor-pointer"
        >
          <Package className="w-4 h-4 text-cyan-700" /> নতুন ফিড চালান
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 active:scale-[0.98] text-teal-800 border border-teal-200/80 font-bold text-xs shadow-xs transition whitespace-nowrap cursor-pointer"
        >
          <Users className="w-4 h-4 text-teal-700" /> ইউজার একাউন্ট
        </button>
      </div>

      {/* 4 PONDS DETAILED OVERVIEW */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Waves className="w-4.5 h-4.5 text-teal-600" />
            প্রকল্পের ৪টি পুকুরের বর্তমান অবস্থা (Pond Status)
          </h2>
          <button
            onClick={() => setActiveTab('ponds')}
            className="text-xs text-teal-700 hover:text-teal-800 flex items-center gap-1 font-bold transition-colors"
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
                className={`card-surface p-5 rounded-2xl transition-all ${
                  isActive
                    ? 'hover:border-teal-400/80'
                    : 'opacity-85'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-emerald-500 shadow-sm animate-pulse' : 'bg-slate-400'}`} />
                    <h3 className="font-bold text-slate-900 text-base">{pond.name}</h3>
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    isActive 
                      ? 'bg-teal-50 text-teal-800 border border-teal-200/80' 
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {pond.status === 'active' ? 'চলমান (Active)' : 'প্রস্তুতি (Preparing)'}
                  </span>
                </div>

                {isActive ? (
                  <div className="mt-4 space-y-3">
                    {/* Stocking Details */}
                    <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80 space-y-1.5 text-xs">
                      <div className="text-slate-500 font-semibold">স্টক করা মাছের বিবরণ:</div>
                      {pond.stockings?.map((st, i) => (
                        <div key={i} className="flex justify-between items-center text-slate-700">
                          <span>• {st.fish_type} ({st.date})</span>
                          <span className="font-bold text-teal-700 font-mono tabular-nums">
                            {st.count_pcs.toLocaleString()} pcs {st.pcs_per_kg ? `@ ${st.pcs_per_kg} pcs/kg` : ''}
                          </span>
                        </div>
                      ))}
                      <div className="pt-1.5 border-t border-slate-200/80 flex justify-between font-bold text-slate-900">
                        <span>মোট মাছ:</span>
                        <span className="text-teal-700 font-mono tabular-nums">{pond.total_fish?.toLocaleString()} pcs</span>
                      </div>
                    </div>

                    {/* Feed & Sampling status */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/80">
                        <span className="text-slate-500 font-medium block">মোট ফিড দেওয়া হয়েছে</span>
                        <span className="font-bold text-slate-900 text-sm font-mono tabular-nums">{pond.feed_bags_used} ব্যাগ</span>
                        <span className="text-[11px] text-amber-700 font-bold block font-mono tabular-nums">ভাত: {pond.vaat_kg_used} কেজি</span>
                      </div>
                      <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/80">
                        <span className="text-slate-500 font-medium block">সর্বশেষ নমুনা ওজন</span>
                        {pond.latest_sampling ? (
                          <>
                            <span className="font-bold text-teal-700 text-sm block font-mono tabular-nums">
                              {pond.latest_sampling.avg_weight_grams} গ্রাম ({pond.latest_sampling.calculated_pcs_per_kg}/kg)
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium block font-mono tabular-nums">FCR: {pond.latest_sampling.fcr}</span>
                          </>
                        ) : (
                          <span className="text-slate-400 italic block">স্যাম্পলিং বাকি</span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => onOpenModal('feed', { pond_id: pond.id })}
                        className="flex-1 py-1.5 rounded-lg bg-teal-50 text-teal-800 hover:bg-teal-100 text-xs font-bold border border-teal-200/80 transition-all active:scale-[0.98] text-center cursor-pointer"
                      >
                        + খাবার
                      </button>
                      <button
                        onClick={() => onOpenModal('stocking', { pond_id: pond.id })}
                        className="flex-1 py-1.5 rounded-lg bg-blue-50 text-blue-800 hover:bg-blue-100 text-xs font-bold border border-blue-200/80 transition-all active:scale-[0.98] text-center cursor-pointer"
                      >
                        + নতুন মাছ
                      </button>
                      <button
                        onClick={() => onOpenModal('sampling', { pond_id: pond.id })}
                        className="flex-1 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200/80 transition-all active:scale-[0.98] text-center cursor-pointer"
                      >
                        + স্যাম্পলিং
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 text-center space-y-2">
                    <p className="text-xs text-slate-500">
                      {pond.notes || "বর্তমানে কোন মাছ নেই। পরবর্তী চালানের প্রস্তুতি চলছে।"}
                    </p>
                    <button
                      onClick={() => onOpenModal('stocking', { pond_id: pond.id })}
                      className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white text-xs font-bold transition shadow-xs cursor-pointer"
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
