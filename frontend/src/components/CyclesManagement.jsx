import React, { useState, useEffect } from 'react';
import { 
  RotateCcw, Plus, CheckCircle, Clock, Calendar, TrendingUp, 
  DollarSign, Package, AlertCircle, Sparkles, Check, Edit3, Trash2, Printer, ArrowRight 
} from 'lucide-react';
import { fetchCycles, createCycle, endCycle, deleteCycle } from '../api';

export default function CyclesManagement({ ponds, currentUser, onRefreshParent }) {
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // 'active', 'completed'
  const [showStartModal, setShowStartModal] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState(null);

  // Start Cycle Form State
  const [startForm, setStartForm] = useState({
    pond_id: 1,
    cycle_name: '',
    start_date: new Date().toISOString().slice(0, 10),
    expected_end_date: '',
    initial_fish_count: 15000,
    initial_stock_weight_kg: 700.0,
    target_harvest_biomass_kg: 20000.0,
    notes: '৬ মাসের বাণিজ্যিক কালচার সাইকেল'
  });

  // End Cycle Form State
  const [endForm, setEndForm] = useState({
    actual_end_date: new Date().toISOString().slice(0, 10),
    final_harvest_weight_kg: 18500.0,
    total_revenue_bdt: 2850000.0,
    other_expenses_bdt: 45000.0,
    notes: 'মাছ সফলভাবে হার্ভেস্ট ও বিক্রি সম্পন্ন হয়েছে।'
  });

  const loadCyclesData = async () => {
    setLoading(true);
    try {
      const data = await fetchCycles();
      setCycles(data);
    } catch (err) {
      console.error("Failed to load cycles:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCyclesData();
  }, []);

  const isAdmin = currentUser?.role === 'superadmin' || currentUser?.role === 'manager';

  const handleStartCycleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createCycle(startForm);
      setShowStartModal(false);
      loadCyclesData();
      if (onRefreshParent) onRefreshParent();
    } catch (err) {
      alert("Error starting cycle: " + err.message);
    }
  };

  const handleEndCycleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCycle) return;
    try {
      await endCycle(selectedCycle.id, endForm);
      setShowEndModal(false);
      setSelectedCycle(null);
      loadCyclesData();
      if (onRefreshParent) onRefreshParent();
    } catch (err) {
      alert("Error ending cycle: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("আপনি কি নিশ্চিতভাবে এই সাইকেল রেকর্ডটি মুছে ফেলতে চান?")) {
      try {
        await deleteCycle(id);
        loadCyclesData();
        if (onRefreshParent) onRefreshParent();
      } catch (err) {
        alert("Delete failed: " + err.message);
      }
    }
  };

  const activeCycles = cycles.filter(c => c.status === 'active');
  const completedCycles = cycles.filter(c => c.status === 'harvested' || c.status === 'completed');

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-teal-600" />
            ৬ মাসের মাছ চাষ সাইকেল ব্যবস্থাপনা (Aquaculture Cycle Engine)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            মাছ ছাড়া থেকে শুরু করে বড় হওয়া এবং হার্ভেস্ট পর্যন্ত প্রতি ৬ মাসের সাইকেল নিয়ন্ত্রণ ও নতুন সাইকেল চালুকরণ
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => {
                setStartForm({
                  ...startForm,
                  cycle_name: `পুকুর ৩ - ১ম সাইকেল (৬ মাস)`,
                  pond_id: 3
                });
                setShowStartModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-teal-500/20 transition"
            >
              <Plus className="w-4 h-4" /> নতুন সাইকেল শুরু করুন (Start Cycle)
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-300 cursor-pointer transition"
            title="প্রিন্ট করুন"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* OVERVIEW STATS BANNER */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="p-4 rounded-2xl bg-white border border-slate-200">
          <span className="text-slate-500 block font-medium">সক্রিয় সাইকেল (Active)</span>
          <div className="text-xl font-bold text-teal-700 mt-1">
            {activeCycles.length} টি পুকুর
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            পুকুর ১ ও পুকুর ২ বর্তমানে চলমান
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200">
          <span className="text-slate-500 block font-medium">গড় সাইকেল সময়কাল</span>
          <div className="text-xl font-bold text-slate-900 mt-1">
            ~৬ মাস <span className="text-xs font-normal text-slate-500">(১৮০ দিন)</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            প্রতি ৬ মাস অন্তর মাছ হার্ভেস্ট ও নতুন ব্যাচ
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200">
          <span className="text-slate-500 block font-medium">মোট যুক্ত ইনভেস্টর</span>
          <div className="text-xl font-bold text-amber-700 mt-1">
            {cycles.reduce((acc, c) => acc + (c.total_investors_count || 0), 0)} জন পার্টনার
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            বিনিয়োগ: ৳ {cycles.reduce((acc, c) => acc + (c.total_external_investment_bdt || 0), 0).toLocaleString()}
          </span>
        </div>

        <div className="p-4 rounded-2xl card-surface bg-emerald-50/40 border-emerald-200/80">
          <span className="text-emerald-800 block font-medium">প্রজেক্টেড মোট সাইকেল লাভ</span>
          <div className="text-xl font-black text-emerald-600 mt-1">
            ৳ {activeCycles.reduce((acc, c) => acc + (c.projected_net_profit_bdt || 0), 0).toLocaleString()}
          </div>
          <span className="text-[10px] text-emerald-700 mt-0.5 block">
            মাছ বিক্রয়ের পর ইনভেস্টরদের লভ্যাংশ বণ্টনযোগ্য
          </span>
        </div>
      </div>

      {/* TAB SELECTOR: ACTIVE CYCLES VS HARVESTED HISTORY */}
      <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-xs no-print">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
            activeTab === 'active' 
              ? 'bg-teal-50 text-teal-800 border border-teal-200/80 shadow-xs' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" /> চলমান সাইকেল ({activeCycles.length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
            activeTab === 'completed' 
              ? 'bg-teal-50 text-teal-800 border border-teal-200/80 shadow-xs' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CheckCircle className="w-4 h-4" /> সমাপ্ত ও হার্ভেস্টকৃত সাইকেল ইতিহাস ({completedCycles.length})
        </button>
      </div>

      {/* ACTIVE CYCLES LIST (Pond-by-Pond Cards) */}
      {activeTab === 'active' && (
        <div className="space-y-4">
          {activeCycles.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-3xl border border-slate-200 text-slate-500 text-xs">
              বর্তমানে কোনো চলমান সাইকেল নেই। "নতুন সাইকেল শুরু করুন" বাটনে ক্লিক করে পুকুর প্রস্তুত ও সাইকেল শুরু করতে পারেন।
            </div>
          ) : (
            activeCycles.map((c) => (
              <div 
                key={c.id}
                className="card-surface p-5 sm:p-6 rounded-3xl space-y-4 hover:border-slate-300 transition-all"
              >
                {/* Card Top Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-600 flex items-center justify-center font-bold text-base border border-teal-500/30">
                      P{c.pond_id}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-base">{c.cycle_name}</h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80 animate-pulse">
                          চলমান সাইকেল (Active)
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {c.pond_name} • শুরু: {c.start_date} • সম্ভাব্য সমাপনী: {c.expected_end_date || '~১৮০ দিন পর'}
                      </p>
                    </div>
                  </div>

                  {/* Actions: End Cycle / Edit */}
                  {isAdmin && (
                    <div className="flex items-center gap-2 no-print">
                      <button
                        onClick={() => {
                          setSelectedCycle(c);
                          setEndForm({
                            ...endForm,
                            final_harvest_weight_kg: c.target_harvest_biomass_kg || 20000.0,
                            total_revenue_bdt: c.projected_revenue_bdt || 3100000.0
                          });
                          setShowEndModal(true);
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition"
                      >
                        <Check className="w-4 h-4" /> মাছ বিক্রি ও সাইকেল সমাপ্ত (End Cycle)
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        title="মুছে ফেলুন"
                        className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-rose-600 border border-slate-200 cursor-pointer transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Progress bar (180 Days Timeline) */}
                <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">
                      সাইকেল অতিক্রান্ত সময়: <strong className="text-slate-900">{c.days_elapsed} দিন</strong> / আনুমানিক ১৮০ দিন
                    </span>
                    <span className="font-bold text-teal-700">
                      {c.progress_pct}% সম্পন্ন
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-teal-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${c.progress_pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>স্টার্ট পয়েন্ট: {c.start_date}</span>
                    <span>সম্ভাব্য হার্ভেস্ট ও বিক্রয় পয়েন্ট: {c.expected_end_date}</span>
                  </div>
                </div>

                {/* Cycle Key Performance Numbers Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block">মোট মজুদ মাছ (Stock Pcs)</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                      {c.initial_fish_count?.toLocaleString()} পিস
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      শুরুর ওজন: {c.initial_stock_weight_kg} কেজি
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block">খাওয়ানো খাবার (Feed Log)</span>
                    <span className="font-bold text-cyan-700 text-sm mt-0.5 block">
                      {c.feed_bags_consumed} ব্যাগ ({c.feed_kg_consumed} কেজি)
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      ফিড ব্যয়: ৳ {c.feed_cost_bdt?.toLocaleString()}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block">টার্গেট উৎপাদন ও রাজস্ব</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                      {c.target_harvest_biomass_kg?.toLocaleString()} কেজি (~{Math.round(c.target_harvest_biomass_kg / 40)} মণ)
                    </span>
                    <span className="text-[10px] text-teal-700 block">
                      বিক্রয়মূল্য: ৳ {c.projected_revenue_bdt?.toLocaleString()}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block">সম্ভাব্য নিট মুনাফা (Net Profit)</span>
                    <span className="font-bold text-emerald-600 text-sm mt-0.5 block">
                      + ৳ {c.projected_net_profit_bdt?.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      পোনা ব্যয়: ৳ {c.pona_cost_bdt?.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Attached Investors in this Cycle */}
                {c.investors && c.investors.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-teal-950/20 border border-teal-500/20 text-xs space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-teal-700 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                        এই সাইকেলে যুক্ত ইনভেস্টর ও মুনাফা বণ্টন (Investors in this Cycle):
                      </span>
                      <span className="text-[11px] text-slate-500">
                        মোট বিনিয়োগ: ৳ {c.total_external_investment_bdt?.toLocaleString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {c.investors.map((inv) => (
                        <div key={inv.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center text-[11px]">
                          <div>
                            <span className="font-bold text-slate-900 block">{inv.investor_name}</span>
                            <span className="text-slate-500">বিনিয়োগ: ৳ {inv.amount_bdt?.toLocaleString()} ({inv.share_percentage}% প্রফিট শেয়ার)</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-emerald-600 block">
                              + ৳ {inv.projected_profit_bdt?.toLocaleString()} লভ্যাংশ
                            </span>
                            <span className="text-[10px] text-slate-500">
                              ফেরত: ৳ {inv.total_expected_payout_bdt?.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* COMPLETED / HARVESTED CYCLES HISTORY TABLE */}
      {activeTab === 'completed' && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[11px] border-b border-slate-200">
              <tr>
                <th className="p-3.5">সাইকেল নাম</th>
                <th className="p-3.5">পুকুর নং</th>
                <th className="p-3.5">শুরু ও সমাপ্তি তারিখ</th>
                <th className="p-3.5">সময়কাল (দিন)</th>
                <th className="p-3.5">খাওয়ানো ফিড</th>
                <th className="p-3.5">মোট হার্ভেস্ট মাছ</th>
                <th className="p-3.5">বিক্রয় রাজস্ব</th>
                <th className="p-3.5">নিট লাভ (BDT)</th>
                <th className="p-3.5">স্ট্যাটাস</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {completedCycles.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-slate-500">
                    এখনো কোনো সাইকেল সমাপ্ত করা হয়নি। ৬ মাস পর মাছ হার্ভেস্ট সম্পন্ন হলে এখানে সাইকেলভিত্তিক চূড়ান্ত ইতিহাস সংরক্ষিত থাকবে।
                  </td>
                </tr>
              ) : (
                completedCycles.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 font-bold text-white">{c.cycle_name}</td>
                    <td className="p-3.5 text-teal-700 font-semibold">{c.pond_name}</td>
                    <td className="p-3.5">{c.start_date} হতে {c.actual_end_date}</td>
                    <td className="p-3.5 font-bold">{c.days_elapsed} দিন</td>
                    <td className="p-3.5">{c.feed_bags_consumed} ব্যাগ</td>
                    <td className="p-3.5 font-bold text-white">{c.harvest_biomass_kg?.toLocaleString()} কেজি</td>
                    <td className="p-3.5 text-emerald-600 font-bold">৳ {c.projected_revenue_bdt?.toLocaleString()}</td>
                    <td className="p-3.5 text-emerald-700 font-bold text-sm">৳ {c.projected_net_profit_bdt?.toLocaleString()}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[10px] font-bold">
                        হার্ভেস্ট সমাপ্ত
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. START NEW CYCLE MODAL */}
      {/* ========================================================================= */}
      {showStartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-3xl p-5 sm:p-6 shadow-2xl relative my-8 text-xs">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
              <RotateCcw className="w-5 h-5 text-teal-600" />
              নতুন ৬ মাসের সাইকেল শুরু করুন (Start New Aquaculture Cycle)
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              মাছ তোলার পর পুকুর প্রস্তুত করে নতুন সাইকেল ও নতুন মাছের পোনা ছাড়ার স্টার্ট পয়েন্ট নির্ধারণ করুন
            </p>

            <form onSubmit={handleStartCycleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-500 block mb-1">পুকুর নির্বাচন</label>
                  <select
                    value={startForm.pond_id}
                    onChange={(e) => {
                      const pId = parseInt(e.target.value);
                      setStartForm({
                        ...startForm,
                        pond_id: pId,
                        cycle_name: `পুকুর ${pId} - নতুন সাইকেল (৬ মাস)`
                      });
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 shadow-sm focus:border-teal-600 focus:outline-none"
                  >
                    {ponds.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-500 block mb-1">সাইকেলের নাম</label>
                  <input
                    type="text"
                    value={startForm.cycle_name}
                    onChange={(e) => setStartForm({ ...startForm, cycle_name: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 shadow-sm focus:border-teal-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-500 block mb-1">সাইকেল শুরুর তারিখ (Start Date)</label>
                  <input
                    type="date"
                    value={startForm.start_date}
                    onChange={(e) => setStartForm({ ...startForm, start_date: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 shadow-sm focus:border-teal-600 focus:outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-1">সম্ভাব্য সমাপনী তারিখ (~৬ মাস পর)</label>
                  <input
                    type="date"
                    value={startForm.expected_end_date}
                    onChange={(e) => setStartForm({ ...startForm, expected_end_date: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 shadow-sm focus:border-teal-600 focus:outline-none font-medium"
                    placeholder="স্বয়ংক্রিয় ১৮০ দিন"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-500 block mb-1">প্রারম্ভিক পোনা সংখ্যা (Pcs)</label>
                  <input
                    type="number"
                    value={startForm.initial_fish_count}
                    onChange={(e) => setStartForm({ ...startForm, initial_fish_count: parseInt(e.target.value) || 0 })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 shadow-sm focus:border-teal-600 focus:outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-1">লক্ষ্যমাত্রা উৎপাদন (Kg)</label>
                  <input
                    type="number"
                    value={startForm.target_harvest_biomass_kg}
                    onChange={(e) => setStartForm({ ...startForm, target_harvest_biomass_kg: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 shadow-sm focus:border-teal-600 focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-500 block mb-1">মন্তব্য বা বিশেষ নির্দেশনা</label>
                <textarea
                  rows="2"
                  value={startForm.notes}
                  onChange={(e) => setStartForm({ ...startForm, notes: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 shadow-sm focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStartModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold"
                >
                  সাইকেল চালু করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. END CYCLE & HARVEST MODAL */}
      {/* ========================================================================= */}
      {showEndModal && selectedCycle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-3xl p-5 sm:p-6 shadow-2xl relative my-8 text-xs">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
              <Check className="w-5 h-5 text-emerald-600" />
              মাছ বিক্রি ও সাইকেল সমাপ্তি (Complete Cycle & Harvest)
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              {selectedCycle.cycle_name} • মাছ তোলার পর চূড়ান্ত ওজন ও বিক্রয়মূল্য ইনপুট দিলে সাইকেল ক্লোজ হয়ে চূড়ান্ত প্রফিট হিসাব হবে
            </p>

            <form onSubmit={handleEndCycleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="text-slate-500 block mb-1">মাছ তোলার ও সাইকেল সমাপ্তির তারিখ</label>
                <input
                  type="date"
                  value={endForm.actual_end_date}
                  onChange={(e) => setEndForm({ ...endForm, actual_end_date: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 shadow-sm focus:border-teal-600 focus:outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-500 block mb-1">মোট উত্তোলিত মাছ (কেজি)</label>
                  <input
                    type="number"
                    value={endForm.final_harvest_weight_kg}
                    onChange={(e) => setEndForm({ ...endForm, final_harvest_weight_kg: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 shadow-sm focus:border-teal-600 focus:outline-none font-bold text-sm"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    ~ {Math.round(endForm.final_harvest_weight_kg / 40)} মণ
                  </span>
                </div>
                <div>
                  <label className="text-slate-500 block mb-1">মোট বিক্রয়মূল্য (টাকা)</label>
                  <input
                    type="number"
                    value={endForm.total_revenue_bdt}
                    onChange={(e) => setEndForm({ ...endForm, total_revenue_bdt: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-emerald-600 font-bold text-sm"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    গড় রেট: ৳ {(endForm.total_revenue_bdt / max(1, endForm.final_harvest_weight_kg)).toFixed(1)} /কেজি
                  </span>
                </div>
              </div>

              <div>
                <label className="text-slate-500 block mb-1">মন্তব্য</label>
                <input
                  type="text"
                  value={endForm.notes}
                  onChange={(e) => setEndForm({ ...endForm, notes: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 shadow-sm focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-700">
                <span className="block font-bold">সাইকেল সমাপ্তির পর:</span>
                <span className="text-[11px] block mt-0.5">
                  পুকুরটি "প্রস্তুতিাধীন" (preparing) অবস্থায় যাবে এবং সাথে সাথে নতুন পোনা ফেলার জন্য ফ্রেশ সাইকেল ২ তৈরি করতে পারবেন। যুক্ত ইনভেস্টরদের প্রফিট বণ্টন প্রস্তুত হবে।
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEndModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  সাইকেল ক্লোজ ও সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function max(a, b) {
  return a > b ? a : b;
}
