import React, { useState, useMemo } from 'react';
import { 
  Package, Plus, Utensils, Calendar, Clock, AlertCircle, 
  TrendingDown, Check, Edit3, Trash2, Waves, Search, Filter, 
  ChevronRight, ArrowRight, CheckCircle2, CloudSun, CalendarDays, X
} from 'lucide-react';
import { deleteDailyFeeding, deleteFeedBatch } from '../api';

const monthNamesBengali = {
  '01': 'জানুয়ারি', '02': 'ফেব্রুয়ারি', '03': 'মার্চ', '04': 'এপ্রিল',
  '05': 'মে', '06': 'জুন', '07': 'জুলাই', '08': 'আগস্ট',
  '09': 'সেপ্টেম্বর', '10': 'অক্টোবর', '11': 'নভেম্বর', '12': 'ডিসেম্বর'
};

const formatMonthLabel = (yearMonth) => {
  if (!yearMonth || yearMonth === 'all') return 'সকল মাস (All Months)';
  const parts = yearMonth.split('-');
  if (parts.length < 2) return yearMonth;
  const year = parts[0];
  const month = parts[1];
  const name = monthNamesBengali[month] || month;
  return `${name} ${year}`;
};

export default function FeedManagement({ ponds = [], feedInventory, dailyFeedings = [], vaatData, currentUser, onOpenModal, onRefresh }) {
  const [activeSubTab, setActiveSubTab] = useState('pond_wise'); // 'pond_wise', 'daily', 'inventory', 'vaat'
  const [selectedPondId, setSelectedPondId] = useState(1);
  const [filterPond, setFilterPond] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all'); // 'all' or 'YYYY-MM'
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');

  const batches = feedInventory?.batches || [];
  const feedings = dailyFeedings || [];
  const vaatRecords = vaatData?.records || [];

  const isAdmin = currentUser?.role === 'superadmin' || currentUser?.role === 'manager';

  // Dynamically extract all unique months present in feedings data
  const availableMonths = useMemo(() => {
    const monthsSet = new Set(
      feedings.map(f => f.date ? f.date.slice(0, 7) : null).filter(Boolean)
    );
    // ensure current month is present even if no feeding yet
    monthsSet.add('2026-10');
    monthsSet.add('2026-09');
    return Array.from(monthsSet).sort().reverse();
  }, [feedings]);

  // Selected Pond Info
  const activePond = ponds.find(p => p.id === parseInt(selectedPondId)) || ponds[0] || { id: 1, name: 'Pond 1 (পুকুর ১)' };

  // Feedings for selected pond
  const pondFeedings = feedings.filter(f => f.pond_id === parseInt(selectedPondId));

  // Pond feedings filtered by Month
  const monthFilteredPondFeedings = pondFeedings.filter(f => {
    if (selectedMonth === 'all') return true;
    return f.date && f.date.startsWith(selectedMonth);
  });

  // Calculate totals based on selectedMonth
  const pondTotalBags = monthFilteredPondFeedings.reduce((sum, f) => sum + (f.commercial_feed_bags || 0), 0);
  const pondTotalKg = monthFilteredPondFeedings.reduce((sum, f) => sum + (f.commercial_feed_kg || 0), 0);
  const pondTotalVaat = monthFilteredPondFeedings.reduce((sum, f) => sum + (f.vaat_kg || 0), 0);

  // Filtered pond feedings for table (including search & time)
  const filteredPondFeedings = monthFilteredPondFeedings.filter(f => {
    const matchesSearch = !searchTerm || 
      (f.notes && f.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (f.date && f.date.includes(searchTerm)) ||
      (f.feeding_time && f.feeding_time.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (f.weather_condition && f.weather_condition.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesTime = timeFilter === 'all' || 
      (f.feeding_time && f.feeding_time.toLowerCase().includes(timeFilter.toLowerCase()));

    return matchesSearch && matchesTime;
  });

  // All daily feedings filtered (by both pond and month)
  const filteredFeedings = feedings.filter(f => {
    const matchesPond = filterPond === 'all' || f.pond_id === parseInt(filterPond);
    const matchesMonth = selectedMonth === 'all' || (f.date && f.date.startsWith(selectedMonth));
    return matchesPond && matchesMonth;
  });

  const handleDeleteFeeding = async (id) => {
    if (window.confirm("আপনি কি নিশ্চিতভাবে এই খাবার দেওয়ার রেকর্ডটি মুছে ফেলতে চান?")) {
      try {
        await deleteDailyFeeding(id);
        if (onRefresh) onRefresh();
      } catch (err) {
        alert("Delete failed: " + err.message);
      }
    }
  };

  const handleDeleteBatch = async (id) => {
    if (window.confirm("আপনি কি নিশ্চিতভাবে এই ফিড চালানটি মুছে ফেলতে চান?")) {
      try {
        await deleteFeedBatch(id);
        if (onRefresh) onRefresh();
      } catch (err) {
        alert("Delete failed: " + err.message);
      }
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-cyan-400" />
            খাবার ও স্টক ব্যবস্থাপনা (Feed & Food Records)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            প্রতিটি পুকুরের আলাদা খাবারের খাতা, ৩১০ ব্যাগ ফিড চালান, মাসিক ফিল্টার ও সম্পূরক ভাতের রেকর্ড
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onOpenModal('feed', { pond_id: selectedPondId })}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-md transition"
          >
            <Plus className="w-4 h-4" /> দৈনিক খাবার দিন
          </button>
          <button
            onClick={() => onOpenModal('feed_inventory')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-medium transition"
          >
            <Plus className="w-4 h-4" /> ফিড চালান আনুন
          </button>
          <button
            onClick={() => onOpenModal('vaat')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-medium transition"
          >
            <Utensils className="w-4 h-4" /> ভাত রান্না এন্ট্রি
          </button>
        </div>
      </div>

      {/* Global Overview Cards */}
      {(() => {
        const totalReceivedBags = feedInventory?.total_bags_received || batches.reduce((sum, b) => sum + (b.bag_count || 0), 0) || 310;
        const totalConsumedBags = feedings.reduce((sum, f) => sum + (Number(f.commercial_feed_bags) || 0), 0);
        const remainingFeedBags = Math.max(0, Math.round((totalReceivedBags - totalConsumedBags) * 10) / 10);
        const remainingBagsDisplay = remainingFeedBags % 1 === 0 ? remainingFeedBags : remainingFeedBags.toFixed(1);
        const totalConsumedKg = feedings.reduce((sum, f) => sum + (Number(f.commercial_feed_kg) || 0), 0);

        return (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-slate-800/70 p-4 rounded-2xl border border-slate-700">
              <span className="text-xs text-slate-400 block">মোট ফিড এসেছে (Received)</span>
              <div className="text-xl font-bold text-white mt-1">
                {totalReceivedBags} <span className="text-xs text-cyan-400 font-normal">ব্যাগ</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                ব্যাচ ২০২ (২১০ ব্যাগ) + ব্যাচ ২০৪ (১০০ ব্যাগ)
              </span>
            </div>

            <div className="bg-slate-800/70 p-4 rounded-2xl border border-slate-700">
              <span className="text-xs text-slate-400 block">মোট ফিড ক্রয় ব্যয় (Cost)</span>
              <div className="text-xl font-bold text-slate-200 mt-1">
                ৳ {feedInventory?.total_feed_spent_bdt?.toLocaleString() || "5,68,750"}
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                গড় দর: ৳ {feedInventory?.avg_cost_per_bag || "1,834.68"} /ব্যাগ
              </span>
            </div>

            <div className="bg-slate-800/70 p-4 rounded-2xl border border-slate-700">
              <span className="text-xs text-slate-400 block">মোট খাওয়ানো ফিড (All Ponds)</span>
              <div className="text-xl font-bold text-teal-300 mt-1">
                {totalConsumedBags.toFixed(1)} <span className="text-xs font-normal text-slate-400">ব্যাগ</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                ওজন: ~{totalConsumedKg.toFixed(0)} কেজি (২১/০৯/২০২৬ হতে)
              </span>
            </div>

            <div className="bg-slate-800/70 p-4 rounded-2xl border border-slate-700">
              <span className="text-xs text-slate-400 block">অবশিষ্ট ফিড স্টক (Stock)</span>
              <div className="text-xl font-bold text-cyan-400 mt-1">
                {remainingBagsDisplay} <span className="text-xs font-normal text-slate-400">ব্যাগ বাকি</span>
              </div>
              <span className={`text-[11px] mt-0.5 block font-medium ${remainingFeedBags <= 30 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {remainingFeedBags <= 30 
                  ? '⚠️ রি-অর্ডার এলার্ট (স্টক শেষ পর্যায়ে)' 
                  : 'খামারের গুদামে পর্যাপ্ত মজুত রয়েছে'}
              </span>
            </div>
          </div>
        );
      })()}

      {/* Sub Tabs */}
      <div className="flex border-b border-slate-800 space-x-2 sm:space-x-4 overflow-x-auto pb-1">
        {[
          { id: 'pond_wise', label: '🌊 পুকুর ভিত্তিক খাবার খাতা (Pond Food Records)', highlight: true },
          { id: 'daily', label: '📋 সার্বিক দৈনিক খাতা (All Daily Logs)', count: feedings.length },
          { id: 'inventory', label: '📦 ফিড চালান ও ইনভেন্টরি (Batches)', count: batches.length },
          { id: 'vaat', label: '🍚 ভাত সরবরাহ সিস্টেম (Vaat System)', count: vaatRecords.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`pb-3 text-xs sm:text-sm font-semibold transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeSubTab === tab.id
                ? 'border-teal-400 text-teal-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-400">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: POND-WISE FOOD RECORDS WITH MONTHLY FILTER                     */}
      {/* ========================================================================= */}
      {activeSubTab === 'pond_wise' && (
        <div className="space-y-6 animate-in fade-in">
          
          {/* Quick Explanation & Global Month Filter Bar */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-teal-500/30 shadow-md space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  <Waves className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">প্রতিটি পুকুরের পৃথক খাবার খাতা ও মাসিক ফিল্টার</h3>
                  <p className="text-xs text-slate-400">পুকুর সিলেক্ট করুন এবং মাস নির্বাচন করে ঐ মাসের খাবার হিসাব চেক করুন।</p>
                </div>
              </div>

              {/* Monthly Filter Pill Bar */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-slate-400 font-semibold flex items-center gap-1 mr-1">
                  <CalendarDays className="w-3.5 h-3.5 text-teal-400" /> মাস ফিল্টার:
                </span>
                
                <button
                  onClick={() => setSelectedMonth('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    selectedMonth === 'all'
                      ? 'bg-teal-600 text-white shadow'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  সকল মাস (All)
                </button>

                {availableMonths.map((ym) => (
                  <button
                    key={ym}
                    onClick={() => setSelectedMonth(ym)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      selectedMonth === ym
                        ? 'bg-teal-600 text-white shadow'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {formatMonthLabel(ym)}
                  </button>
                ))}

                {/* Optional month dropdown for any future months */}
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-xs rounded-xl px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-teal-500"
                >
                  <option value="all">অন্যান্য মাস...</option>
                  {availableMonths.map((ym) => (
                    <option key={ym} value={ym}>{formatMonthLabel(ym)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active Month Status Badge */}
            {selectedMonth !== 'all' && (
              <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-xs">
                <span className="text-teal-300 flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                  ফিল্টার সক্রিয়: <strong>{formatMonthLabel(selectedMonth)}</strong>-এর খাবার হিসাব প্রদর্শিত হচ্ছে।
                </span>
                <button
                  onClick={() => setSelectedMonth('all')}
                  className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px] underline"
                >
                  <X className="w-3 h-3" /> ফিল্টার মুছুন
                </button>
              </div>
            )}
          </div>

          {/* 4 Ponds Interactive Selector Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {ponds.map((p) => {
              const isSelected = selectedPondId === p.id;
              const pFeedings = feedings.filter(f => f.pond_id === p.id);
              
              // Filter by month for the card metrics too if month selected
              const pFeedingsForCard = selectedMonth === 'all' 
                ? pFeedings 
                : pFeedings.filter(f => f.date && f.date.startsWith(selectedMonth));

              const pBags = pFeedingsForCard.reduce((sum, f) => sum + (f.commercial_feed_bags || 0), 0);
              const pKg = pFeedingsForCard.reduce((sum, f) => sum + (f.commercial_feed_kg || 0), 0);
              const pVaat = pFeedingsForCard.reduce((sum, f) => sum + (f.vaat_kg || 0), 0);
              const isActive = p.status === 'active';

              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedPondId(p.id);
                    setSearchTerm('');
                    setTimeFilter('all');
                  }}
                  className={`p-4 rounded-2xl border text-left transition relative overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? 'bg-slate-800 border-teal-500 shadow-xl shadow-teal-500/10 ring-2 ring-teal-500/40'
                      : 'bg-slate-850/70 border-slate-700/80 hover:border-slate-600'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm sm:text-base text-white">{p.name}</span>
                      <span className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                    </div>
                    <div className="text-xs text-slate-400 mb-3">
                      মাছ: <strong className="text-slate-200">{p.total_fish > 0 ? `${p.total_fish.toLocaleString()} pcs` : 'খালি / প্রস্তুতি'}</strong>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">{selectedMonth === 'all' ? 'মোট ফিড:' : 'মাসের ফিড:'}</span>
                      <span className="font-bold text-teal-300 text-sm">{pBags.toFixed(1)} ব্যাগ</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">ওজন:</span>
                      <span className="text-slate-200">{pKg.toFixed(0)} কেজি</span>
                    </div>
                    {pVaat > 0 && (
                      <div className="flex justify-between items-center text-[11px] text-amber-300">
                        <span>ভাত:</span>
                        <span className="font-bold">{pVaat} কেজি</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">
                      {pFeedingsForCard.length > 0 ? `${pFeedingsForCard.length}টি এন্ট্রি` : 'রেকর্ড নেই'}
                    </span>
                    <span className={`font-semibold flex items-center gap-0.5 ${isSelected ? 'text-teal-400' : 'text-slate-400'}`}>
                      খাতা দেখুন <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Pond Detailed Feed Log & Summary */}
          <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-700 shadow-xl space-y-5">
            
            {/* Selected Pond Title Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-3.5 h-3.5 rounded-full bg-teal-400 animate-pulse" />
                  <h3 className="text-lg font-bold text-white">
                    {activePond.name} - এর ব্যক্তিগত খাবারের পূর্ণাঙ্গ খাতা
                  </h3>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                    activePond.status === 'active' 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                      : 'bg-slate-700 text-slate-300'
                  }`}>
                    {activePond.status === 'active' ? 'চলমান পুকুর' : 'প্রস্তুতি'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  মোট মজুদ মাছ: <strong className="text-teal-300">{activePond.total_fish?.toLocaleString() || 0} পিস</strong> • 
                  {selectedMonth === 'all' 
                    ? ' ২১/০৯/২০২৬ থেকে শুরু হওয়া সকল খাদ্য এন্ট্রি' 
                    : ` ${formatMonthLabel(selectedMonth)}-এর খাদ্য এন্ট্রি`}
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                <button
                  onClick={() => onOpenModal('feed', { pond_id: activePond.id })}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs shadow-md transition flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> + এই পুকুরে খাবার দিন
                </button>
              </div>
            </div>

            {/* Selected Pond 4 Metric Counters (Updates with Monthly Filter) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400 block">বাণিজ্যিক ফিড</span>
                  <span className="text-[10px] text-teal-400 uppercase font-semibold">
                    {selectedMonth === 'all' ? 'সর্বমোট' : formatMonthLabel(selectedMonth)}
                  </span>
                </div>
                <span className="text-xl font-black text-teal-300 mt-1 block">
                  {pondTotalBags.toFixed(1)} <span className="text-xs font-normal text-slate-400">ব্যাগ</span>
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  মোট {monthFilteredPondFeedings.length} বার খাবার দেওয়া হয়েছে
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400 block">ফিডের ওজন (Kg)</span>
                  <span className="text-[10px] text-cyan-400 uppercase font-semibold">
                    {selectedMonth === 'all' ? 'সর্বমোট' : formatMonthLabel(selectedMonth)}
                  </span>
                </div>
                <span className="text-xl font-black text-cyan-300 mt-1 block">
                  {pondTotalKg.toFixed(0)} <span className="text-xs font-normal text-slate-400">কেজি</span>
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  প্রতি ব্যাগে ২৫ কেজি ফিড
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400 block">সম্পূরক ভাত (Vaat)</span>
                  <span className="text-[10px] text-amber-400 uppercase font-semibold">
                    {selectedMonth === 'all' ? 'সর্বমোট' : formatMonthLabel(selectedMonth)}
                  </span>
                </div>
                <span className="text-xl font-black text-amber-300 mt-1 block">
                  {pondTotalVaat.toFixed(0)} <span className="text-xs font-normal text-slate-400">কেজি</span>
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  {pondTotalVaat === 0 ? 'এখনও ভাত দেওয়া হয়নি' : 'ভাত ও ফিড মিশ্রণ'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400 block">খাবারের খরচ</span>
                  <span className="text-[10px] text-emerald-400 uppercase font-semibold">
                    {selectedMonth === 'all' ? 'সর্বমোট' : formatMonthLabel(selectedMonth)}
                  </span>
                </div>
                <span className="text-xl font-black text-emerald-400 mt-1 block">
                  ৳ {(pondTotalBags * 1834.68).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  গড় দর: ৳ ১,৮৩৪.৬৮/ব্যাগ
                </span>
              </div>
            </div>

            {/* Filter and Search Bar for this Pond */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <div className="relative w-full">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="তারিখ, সময়, কর্মী বা মন্তব্য দিয়ে খুঁজুন..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Monthly dropdown filter */}
                <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800 text-xs">
                  <CalendarDays className="w-3.5 h-3.5 text-teal-400" />
                  <span className="text-slate-400">মাস:</span>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-transparent text-white focus:outline-none font-medium cursor-pointer"
                  >
                    <option value="all" className="bg-slate-900 text-white">সকল মাস</option>
                    {availableMonths.map((ym) => (
                      <option key={ym} value={ym} className="bg-slate-900 text-white">
                        {formatMonthLabel(ym)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Time filter */}
                <div className="flex bg-slate-950 rounded-xl p-1 border border-slate-800 text-xs">
                  {['all', 'সকাল', 'বিকেল'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTimeFilter(t)}
                      className={`px-3 py-1 rounded-lg font-medium transition ${
                        timeFilter === t
                          ? 'bg-teal-600 text-white font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {t === 'all' ? 'সকল সময়' : t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Feeding Table for this Pond */}
            {filteredPondFeedings.length > 0 ? (
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/70">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 uppercase text-[11px] border-b border-slate-800">
                    <tr>
                      <th className="p-3.5">তারিখ</th>
                      <th className="p-3.5">খাবারের সময়</th>
                      <th className="p-3.5">বাণিজ্যিক ফিড ব্যাগ</th>
                      <th className="p-3.5">ফিড ওজন (কেজি)</th>
                      <th className="p-3.5">ভাত (কেজি)</th>
                      <th className="p-3.5">আবহাওয়া ও খামার অবস্থা</th>
                      <th className="p-3.5">এন্ট্রি করেছেন</th>
                      <th className="p-3.5">মন্তব্য</th>
                      {isAdmin && <th className="p-3.5 text-center">অ্যাকশন</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredPondFeedings.map((f) => (
                      <tr key={f.id} className="hover:bg-slate-900/60 transition">
                        <td className="p-3.5 font-bold text-white whitespace-nowrap">
                          {f.date}
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                            f.feeding_time?.includes('সকাল') || f.feeding_time?.toLowerCase().includes('morning')
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          }`}>
                            {f.feeding_time || 'সাধারণ'}
                          </span>
                        </td>
                        <td className="p-3.5 font-bold text-white text-sm">
                          <span className="px-2.5 py-1 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30 font-mono">
                            {f.commercial_feed_bags} ব্যাগ
                          </span>
                        </td>
                        <td className="p-3.5 font-bold text-slate-200">
                          {f.commercial_feed_kg} kg
                        </td>
                        <td className="p-3.5">
                          {f.vaat_kg > 0 ? (
                            <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                              {f.vaat_kg} kg ভাত
                            </span>
                          ) : (
                            <span className="text-slate-500">০ কেজি</span>
                          )}
                        </td>
                        <td className="p-3.5 text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <CloudSun className="w-3.5 h-3.5 text-teal-400" />
                            <span>{f.weather_condition || 'স্বাভাবিক'}</span>
                          </div>
                        </td>
                        <td className="p-3.5 text-slate-400 font-medium">
                          {f.logged_by || 'কর্মী'}
                        </td>
                        <td className="p-3.5 text-slate-300 italic max-w-xs truncate">
                          {f.notes || '-'}
                        </td>
                        {isAdmin && (
                          <td className="p-3.5 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => onOpenModal('feed', { editItem: f, pond_id: activePond.id })}
                                title="সম্পাদনা করুন (Edit)"
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 hover:text-white transition"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteFeeding(f.id)}
                                title="মুছে ফেলুন (Delete)"
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-rose-400 hover:text-rose-200 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-10 text-center bg-slate-950/40 rounded-2xl border border-slate-800 text-slate-400 text-xs space-y-2">
                <p>
                  {selectedMonth !== 'all'
                    ? `${formatMonthLabel(selectedMonth)}-এ ${activePond.name}-এ কোনো খাবার রেকর্ড পাওয়া যায়নি।`
                    : `বর্তমানে ${activePond.name}-এ কোনো খাবার এন্ট্রি নেই।`}
                </p>
                <button
                  onClick={() => onOpenModal('feed', { pond_id: activePond.id })}
                  className="px-4 py-2 rounded-xl bg-teal-600/80 hover:bg-teal-600 text-white font-medium text-xs transition"
                >
                  + {activePond.name}-এ খাবার এন্ট্রি দিন
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: ALL DAILY FEEDING LOGS (WITH POND & MONTH FILTER)              */}
      {/* ========================================================================= */}
      {activeSubTab === 'daily' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-400">পুকুর:</span>
              <button
                onClick={() => setFilterPond('all')}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                  filterPond === 'all'
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                সব পুকুর (All)
              </button>
              {ponds.map(p => (
                <button
                  key={p.id}
                  onClick={() => setFilterPond(p.id.toString())}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                    filterPond === p.id.toString()
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {p.name}
                </button>
              ))}

              {/* Monthly Filter in Daily Logs */}
              <div className="flex items-center gap-1.5 bg-slate-850 px-2.5 py-1 rounded-xl border border-slate-700 text-xs ml-0 sm:ml-2">
                <CalendarDays className="w-3.5 h-3.5 text-teal-400" />
                <span className="text-slate-400">মাস:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent text-white focus:outline-none font-medium cursor-pointer"
                >
                  <option value="all" className="bg-slate-900 text-white">সকল মাস</option>
                  {availableMonths.map((ym) => (
                    <option key={ym} value={ym} className="bg-slate-900 text-white">
                      {formatMonthLabel(ym)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={() => onOpenModal('feed')}
              className="text-xs text-teal-400 hover:text-teal-300 font-medium whitespace-nowrap self-end sm:self-center"
            >
              + খাবার দিন (যে কোনো পূর্ববর্তী তারিখ নির্বাচনযোগ্য)
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-700/80 bg-slate-850">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 uppercase text-[11px] border-b border-slate-700">
                <tr>
                  <th className="p-3.5">তারিখ</th>
                  <th className="p-3.5">পুকুর</th>
                  <th className="p-3.5">বাণিজ্যিক ফিড ব্যাগ</th>
                  <th className="p-3.5">ফিড ওজন (কেজি)</th>
                  <th className="p-3.5">ভাত (কেজি)</th>
                  <th className="p-3.5">সময় ও আবহাওয়া</th>
                  <th className="p-3.5">মন্তব্য</th>
                  {isAdmin && <th className="p-3.5 text-center">অ্যাকশন</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredFeedings.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-800/50">
                    <td className="p-3.5 font-medium text-white">{f.date}</td>
                    <td className="p-3.5 font-semibold text-teal-300">{f.pond_name}</td>
                    <td className="p-3.5 font-bold text-white text-sm">
                      <span className="px-2 py-0.5 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                        {f.commercial_feed_bags} ব্যাগ
                      </span>
                    </td>
                    <td className="p-3.5 font-semibold text-slate-200">{f.commercial_feed_kg} kg</td>
                    <td className="p-3.5">
                      {f.vaat_kg > 0 ? (
                        <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 font-semibold">
                          {f.vaat_kg} kg ভাত
                        </span>
                      ) : (
                        <span className="text-slate-500">০ কেজি</span>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-300">
                      <div>{f.feeding_time}</div>
                      <div className="text-[11px] text-slate-400">{f.weather_condition}</div>
                    </td>
                    <td className="p-3.5 text-slate-300 italic">{f.notes || '-'}</td>
                    {isAdmin && (
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onOpenModal('feed', { editItem: f })}
                            title="সম্পাদনা করুন (Edit)"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 hover:text-white transition"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteFeeding(f.id)}
                            title="মুছে ফেলুন (Delete)"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-rose-400 hover:text-rose-200 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: FEED INVENTORY BATCHES                                         */}
      {/* ========================================================================= */}
      {activeSubTab === 'inventory' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400">
              প্রকল্পে আসা ৩১০ ব্যাগ ফিডের একাধিক রেট ও চালানের বিস্তারিত তালিকা
            </span>
            <button
              onClick={() => onOpenModal('feed_inventory')}
              className="text-xs text-teal-400 hover:text-teal-300 font-medium"
            >
              + নতুন চালান অন্তর্ভুক্ত করুন
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-700/80 bg-slate-855">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 uppercase text-[11px] border-b border-slate-700">
                <tr>
                  <th className="p-3.5">চালান তারিখ</th>
                  <th className="p-3.5">ফিড ব্র্যান্ড ও ব্যাচ নং</th>
                  <th className="p-3.5">ব্যাগের সংখ্যা</th>
                  <th className="p-3.5">প্রতি ব্যাগের রেট</th>
                  <th className="p-3.5">মোট মূল্য (Total BDT)</th>
                  <th className="p-3.5">সরবরাহকারী</th>
                  <th className="p-3.5">নোট</th>
                  {isAdmin && <th className="p-3.5 text-center">অ্যাকশন</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {batches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-800/50">
                    <td className="p-3.5 font-medium text-white">{b.date}</td>
                    <td className="p-3.5">
                      <div className="font-semibold text-cyan-300">{b.brand_name}</div>
                      <div className="text-[11px] text-slate-400">{b.feed_type}</div>
                    </td>
                    <td className="p-3.5 font-bold text-white text-sm">
                      <span className="px-2 py-0.5 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                        {b.bag_count} ব্যাগ
                      </span>
                    </td>
                    <td className="p-3.5 font-semibold text-slate-200">৳ {b.rate_per_bag?.toLocaleString()}</td>
                    <td className="p-3.5 font-bold text-emerald-400 text-sm">৳ {b.total_cost?.toLocaleString()}</td>
                    <td className="p-3.5 text-slate-300">{b.supplier || '-'}</td>
                    <td className="p-3.5 text-slate-400 text-[11px]">{b.notes || b.invoice_no || '-'}</td>
                    {isAdmin && (
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onOpenModal('feed_inventory', { editItem: b })}
                            title="সম্পাদনা করুন (Edit)"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white transition"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteBatch(b.id)}
                            title="মুছে ফেলুন (Delete)"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-rose-400 hover:text-rose-200 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: VAAT SYSTEM                                                    */}
      {/* ========================================================================= */}
      {activeSubTab === 'vaat' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex items-start gap-3">
            <Utensils className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-200">
              <strong>সম্পূরক ভাত সরবরাহ পদ্ধতি:</strong> আপনার নির্দেশনা অনুযায়ী প্রকল্পে এখনও পর্যন্ত কোনো ভাত দেওয়া হয়নি (ভবিষ্যতে দেওয়া হবে)। যখনই ভাত রান্না বা সরবরাহ শুরু করবেন, নিচের <strong>"+ ভাত রান্না এন্ট্রি"</strong> বাটনে চাপ দিয়ে চালের কেজি ও রান্নার খরচ লিখে সংরক্ষণ করতে পারবেন।
            </div>
          </div>

          <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800 text-xs text-slate-400 space-y-2">
            <p>বর্তমানে কোনো ভাত দেওয়া হয়নি। ভবিষ্যতে ভাত সরবরাহ শুরু হলে এখানে স্বয়ংক্রিয়ভাবে তালিকা যুক্ত হবে।</p>
            <button
              onClick={() => onOpenModal('vaat')}
              className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 font-medium transition"
            >
              + ভাত রান্না ও সরবরাহ এন্ট্রি করুন
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
