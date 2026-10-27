import React, { useState, useEffect } from 'react';
import { 
  FileText, Printer, Calendar, Clock, DollarSign, Package, 
  Search, Filter, RefreshCw, TrendingUp, CheckCircle, Shield, 
  Lightbulb, ChevronRight, Layers, Utensils, Zap, Sparkles,
  AlertTriangle, Check, ArrowRight, RotateCcw, AlertCircle
} from 'lucide-react';
import { fetchCostingReport, fetchFeedAdjustments, reconcilePhysicalStock, deleteFeedAdjustment } from '../api';

export default function Reports({ stats, ponds = [], feedInventory, expensesData }) {
  const [period, setPeriod] = useState('daily'); // 'daily', 'weekly', 'monthly', 'cycle', 'custom'
  const [targetDate, setTargetDate] = useState('2026-10-26');
  const [selectedMonth, setSelectedMonth] = useState('2026-10');
  const [selectedWeek, setSelectedWeek] = useState('2026-10-26');
  const [startDate, setStartDate] = useState('2026-09-18');
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [pondId, setPondId] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adjustments, setAdjustments] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  const loadReport = async () => {
    setLoading(true);
    try {
      let tDate = null;
      if (period === 'daily') tDate = targetDate;
      else if (period === 'weekly') tDate = selectedWeek;
      else if (period === 'monthly') tDate = `${selectedMonth}-01`;

      const [data, adjRes] = await Promise.all([
        fetchCostingReport({
          period,
          targetDate: tDate,
          startDate: period === 'custom' ? startDate : null,
          endDate: period === 'custom' ? endDate : null,
          pondId: pondId === 'all' ? null : parseInt(pondId)
        }),
        fetchFeedAdjustments().catch(() => ({ adjustments: [] }))
      ]);

      setReport(data);
      if (adjRes && adjRes.adjustments) {
        setAdjustments(adjRes.adjustments);
      }
    } catch (err) {
      console.error("Failed to load costing report:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [period, targetDate, selectedMonth, selectedWeek, startDate, endDate, pondId]);

  const handlePrint = () => {
    window.print();
  };

  // 26/10/2026 Audit Reconciliation Action
  const handleReconcile5Bags = async () => {
    if (!window.confirm("২৬/১০/২০২৬ তারিখের শারীরিক খাতার সাথে মিল রেখে ৫ ব্যাগ ফিডের ঘাটতি সমন্বয় করতে চান?")) {
      return;
    }
    setActionLoading(true);
    try {
      await reconcilePhysicalStock({
        date: "2026-10-26",
        variance_bags: 5.0,
        reason: "২৬/১০/২০২৬ শারীরিক খাতা নিরীক্ষা সমন্বয় (শারীরিক খাতার স্টক ৯৩ ব্যাগ বনাম সফটওয়্যার ৯৮ ব্যাগ)",
        adjusted_by: "Farm Auditor / Manager"
      });
      await loadReport();
      alert("✅ ৫ ব্যাগ ফিড সফলভাবে সমন্বয় করা হয়েছে। সফটওয়্যারের স্টক এখন শারীরিক খাতার সাথে ১০০% মিলেছে!");
    } catch (err) {
      alert("Error reconciling stock: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUndoAdjustment = async (adjId) => {
    if (!window.confirm("আপনি কি নিশ্চিতভাবে এই স্টক সমন্বয় রেকর্ডটি বাতিল করতে চান?")) {
      return;
    }
    setActionLoading(true);
    try {
      await deleteFeedAdjustment(adjId);
      await loadReport();
      alert("স্টক সমন্বয় রেকর্ডটি বাতিল করা হয়েছে।");
    } catch (err) {
      alert("Error undoing adjustment: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const summary = report?.summary || {};
  const stockAudit = summary?.stock_audit || {};
  const cycle = report?.six_month_cycle || {};
  const ledger = report?.ledger || [];
  const pondSummary = report?.pond_summary || [];
  const dailyMatrix = report?.daily_matrix || [];

  // Active adjustment for 26/10/2026
  const oct26Adjustment = adjustments.find(a => a.date === '2026-10-26' && Math.abs(a.bag_count - 5.0) < 0.1);

  // Filter ledger for search
  const filteredLedger = ledger.filter(item => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.date.toLowerCase().includes(term) ||
      item.type.toLowerCase().includes(term) ||
      item.pond.toLowerCase().includes(term) ||
      item.description.toLowerCase().includes(term) ||
      item.quantity.toLowerCase().includes(term)
    );
  });

  // Feed-only ledger items for daily report
  const dailyFeedItems = ledger.filter(item => item.type?.includes("ফিড") || item.type?.includes("Feed") || item.type?.includes("ভাত"));
  // Other expenses for daily report
  const dailyExpenseItems = ledger.filter(item => !item.type?.includes("ফিড") && !item.type?.includes("Feed") && !item.type?.includes("ভাত"));

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* ========================================================================= */}
      {/* SCREEN CONTROLS & HEADER (Hidden on Print) */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-700" />
            অডিট ও প্রিন্ট রিপোর্ট সিস্টেম (Aquaculture Audit Reports)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            দৈনিক (১ পাতা), সাপ্তাহিক (১-২ পাতা) ও মাসিক প্রফেশনাল অডিট ফরম্যাট এবং শারীরিক খাতার সাথে স্টক ভ্যালিডেশন
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadReport}
            title="রিফ্রেশ করুন"
            className="p-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-600 border border-slate-300 shadow-sm cursor-pointer transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-700' : ''}`} />
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-md shadow-teal-700/20 cursor-pointer transition"
          >
            <Printer className="w-4 h-4" /> প্রিন্ট / PDF ডাউনলোড (Print A4)
          </button>
        </div>
      </div>

      {/* 26/10/2026 PHYSICAL STOCK RECONCILIATION BANNER */}
      <div className="no-print p-4 sm:p-5 rounded-2xl bg-white border border-amber-300 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-900 text-sm">
                  শারীরিক স্টক শিট বনাম সফটওয়্যার হিসাব নিরীক্ষা (২৬/১০/২০২৬)
                </h4>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  oct26Adjustment ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-amber-50 text-amber-900 border-amber-300'
                }`}>
                  {oct26Adjustment ? 'সমন্বয় সম্পন্ন (Reconciled)' : '৫ ব্যাগ পার্থক্য শনাক্ত (5 Bags Discrepancy)'}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {oct26Adjustment ? (
                  <span>
                    ✅ ২৬/১০/২০২৬ তারিখে খামারের গুদামে শারীরিক খাতা অনুযায়ী <strong>৯৩.০ ব্যাগ</strong> ফিড মজুত নিশ্চিত করা হয়েছে। সফটওয়্যারের ৫ ব্যাগ ঘাটতি অডিট সমন্বয় সম্পন্ন।
                  </span>
                ) : (
                  <span>
                    ২৬/১০/২০২৬ তারিখে সফটওয়্যারের হিসাব ছিল <strong>৯৮.০ ব্যাগ</strong> (মোট ৪৩০ ব্যাগ চালান - ৩৩২ ব্যাগ খাওয়ানো)। আপনার খামারের আসল কাগজের রেজিস্টার শিটে ছিল <strong>৯৩.০ ব্যাগ</strong> (অর্থাৎ <strong>৫ ব্যাগের তফাত</strong>)।
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:self-center shrink-0">
            {oct26Adjustment ? (
              <button
                onClick={() => handleUndoAdjustment(oct26Adjustment.id)}
                disabled={actionLoading}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-semibold cursor-pointer transition"
              >
                সমন্বয় বাতিল (Undo)
              </button>
            ) : (
              <button
                onClick={handleReconcile5Bags}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm cursor-pointer transition"
              >
                <Check className="w-4 h-4" /> ৫ ব্যাগ সমন্বয় করুন (Reconcile)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* PERIOD & FILTER CARD */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4 no-print">
        <div>
          <label className="text-xs font-bold text-slate-800 block mb-2">
            রিপোর্টের সময়কাল নির্বাচন করুন (Select Report Type):
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { id: 'daily', label: '⏱️ দৈনিক রিপোর্ট (Daily)', desc: '১ পাতার কমপ্যাক্ট দৈনিক স্টেটমেন্ট' },
              { id: 'weekly', label: '🗓️ সাপ্তাহিক রিপোর্ট (Weekly)', desc: '৭ দিনের দিনভিত্তিক চার্ট ও হিসাব' },
              { id: 'monthly', label: '📊 মাসিক রিপোর্ট (Monthly)', desc: 'মাসিক সারসংক্ষেপ ও অডিট বিবরণী' },
              { id: 'cycle', label: '🔄 ৬ মাসের সাইকেল (6 Months)', desc: '১৮/০৯/২০২৬ - ১৮/০৩/২০২৭' },
              { id: 'custom', label: '🔍 কাস্টম তারিখ (Custom)', desc: 'নির্দিষ্ট রেঞ্জ ফিল্টার' },
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  period === p.id
                    ? 'bg-teal-50 border-teal-700 text-teal-900 ring-2 ring-teal-600/20 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
                }`}
              >
                <span className="font-bold text-xs">{p.label}</span>
                <span className="text-[10px] text-slate-500 mt-1">{p.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Period Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100 text-xs">
          {period === 'daily' && (
            <div>
              <label className="text-slate-700 block mb-1 font-semibold">তারিখ নির্বাচন (Date):</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:border-teal-700 shadow-sm focus:outline-none"
              />
              <div className="flex flex-wrap gap-1 mt-1.5">
                <button 
                  onClick={() => setTargetDate('2026-10-26')}
                  className="px-2 py-0.5 rounded bg-amber-50 text-[10px] font-bold text-amber-900 hover:bg-amber-100 border border-amber-200"
                >
                  ২৬ অক্টোবর (অডিট)
                </button>
                <button 
                  onClick={() => setTargetDate('2026-10-21')}
                  className="px-2 py-0.5 rounded bg-slate-100 text-[10px] text-teal-800 hover:bg-slate-200 border border-slate-200"
                >
                  ২১ অক্টোবর
                </button>
                <button 
                  onClick={() => setTargetDate(new Date().toISOString().slice(0, 10))}
                  className="px-2 py-0.5 rounded bg-slate-100 text-[10px] text-slate-700 hover:bg-slate-200 border border-slate-200"
                >
                  আজকের তারিখ
                </button>
              </div>
            </div>
          )}

          {period === 'weekly' && (
            <div>
              <label className="text-slate-700 block mb-1 font-semibold">সপ্তাহের শেষ তারিখ (Week End):</label>
              <input
                type="date"
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:border-teal-700 shadow-sm focus:outline-none"
              />
              <div className="flex flex-wrap gap-1 mt-1.5">
                <button 
                  onClick={() => setSelectedWeek('2026-10-26')}
                  className="px-2 py-0.5 rounded bg-teal-50 text-[10px] font-bold text-teal-800 hover:bg-teal-100 border border-teal-200"
                >
                  সপ্তাহ ৫ (২০-২৬ অক্টো)
                </button>
                <button 
                  onClick={() => setSelectedWeek('2026-10-19')}
                  className="px-2 py-0.5 rounded bg-slate-100 text-[10px] text-slate-700 hover:bg-slate-200 border border-slate-200"
                >
                  সপ্তাহ ৪ (১৩-১৯ অক্টো)
                </button>
              </div>
            </div>
          )}

          {period === 'monthly' && (
            <div>
              <label className="text-slate-700 block mb-1 font-semibold">মাস নির্বাচন (Select Month):</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:border-teal-700 shadow-sm focus:outline-none"
              >
                <option value="2026-10">অক্টোবর ২০২৬ (October 2026)</option>
                <option value="2026-09">সেপ্টেম্বর ২০২৬ (September 2026)</option>
                <option value="2026-11">নভেম্বর ২০২৬ (November 2026)</option>
              </select>
            </div>
          )}

          {period === 'custom' && (
            <>
              <div>
                <label className="text-slate-700 block mb-1 font-semibold">শুরুর তারিখ (From):</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:border-teal-700 shadow-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="text-slate-700 block mb-1 font-semibold">শেষের তারিখ (To):</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:border-teal-700 shadow-sm focus:outline-none"
                />
              </div>
            </>
          )}

          <div>
            <label className="text-slate-700 block mb-1 font-semibold">পুকুর ফিল্টার (Pond):</label>
            <select
              value={pondId}
              onChange={(e) => setPondId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:border-teal-700 shadow-sm focus:outline-none"
            >
              <option value="all">সব পুকুর (All 4 Ponds)</option>
              {ponds?.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-700 block mb-1 font-semibold">লেজারে খুঁজুন (Search):</label>
            <div className="relative">
              <input
                type="text"
                placeholder="ফিড, ওষুধ, ভাউচার..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-2 text-slate-900 placeholder-slate-400 focus:border-teal-700 shadow-sm focus:outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* AUTHENTIC CHARTERED AUDIT REPORT CONTAINER (A4 Print-Engine Ready) */}
      {/* ========================================================================= */}
      <div className="printable-report bg-white text-slate-900 space-y-4">

        {/* 1. OFFICIAL LETTERHEAD & AUDIT METADATA BAR */}
        <div className="border-b-2 border-slate-800 pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-900 text-white tracking-widest uppercase">
                  CHARTERED AQUACULTURE AUDIT REPORT
                </span>
                <span className="text-[11px] text-slate-600 font-bold">• রেজি নং: SF-2026/CTG</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-950 mt-1 tracking-tight">
                শাহ আমানত ফিশারি অ্যান্ড এগ্রো প্রজেক্ট
              </h1>
              <p className="text-xs text-slate-600 font-medium">
                শাহ আমানত আন্তর্জাতিক বিমানবন্দর সড়ক, পতেঙ্গা, চট্টগ্রাম • ৪টি পুকুর (২০ একর বাণিজ্যিক প্রকল্প)
              </p>
            </div>

            <div className="text-left sm:text-right text-xs border-t sm:border-t-0 sm:border-l sm:border-slate-300 pt-2 sm:pt-0 sm:pl-4 space-y-0.5">
              <div className="font-black text-teal-900 text-sm">
                {report?.period_label || 'নিরীক্ষা ও খরচ প্রতিবেদন'}
              </div>
              <div>
                সময়কাল: <span className="font-bold text-slate-950">{report?.start_date}</span> হতে <span className="font-bold text-slate-950">{report?.end_date}</span>
              </div>
              <div className="text-[11px] text-slate-600">
                পুকুর: <span className="font-bold text-slate-900">{pondId === 'all' ? 'সমগ্র খামার (সব পুকুর)' : `পুকুর ${pondId}`}</span>
                {" • "}প্রিন্ট তারিখ: <span className="font-bold text-slate-900">{new Date().toLocaleDateString('bn-BD')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* VIEW 1: DAILY REPORT FORMAT (১ পাতার কমপ্যাক্ট দৈনিক স্টেটমেন্ট)      */}
        {/* ===================================================================== */}
        {period === 'daily' && (
          <div className="space-y-3.5">
            {/* Executive KPI summary bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded-lg border border-slate-300 bg-slate-50">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">আজকের ফিড প্রয়োগ</span>
                <span className="text-base font-black text-teal-900 mt-0.5 block">
                  {summary.feed_bags_consumed || 0} ব্যাগ ({summary.feed_kg_consumed || 0} কেজি)
                </span>
                <span className="text-[10px] text-slate-600 font-medium">
                  ফিড ব্যয়: ৳ {summary.feed_consumed_cost_bdt?.toLocaleString() || 0}
                </span>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-300 bg-slate-50">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">আজকের পরিচালন ব্যয়</span>
                <span className="text-base font-black text-slate-900 mt-0.5 block">
                  ৳ {summary.total_other_expenses_bdt?.toLocaleString() || 0}
                </span>
                <span className="text-[10px] text-slate-600">
                  ওষুধ, বিদ্যুৎ, জ্বালানি ও মজুরি
                </span>
              </div>

              <div className="p-2.5 rounded-lg border border-teal-400 bg-teal-50">
                <span className="text-[10px] font-bold text-teal-800 uppercase block">আজকের সর্বমোট ব্যয়</span>
                <span className="text-lg font-black text-teal-900 mt-0.5 block">
                  ৳ {summary.total_period_cost_bdt?.toLocaleString() || 0}
                </span>
                <span className="text-[10px] text-teal-800 font-medium">
                  {summary.total_period_cost_bdt > 0 ? 'চলতি দিনের সর্বমোট ব্যয়' : 'কোনো খরচ হয়নি'}
                </span>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-300 bg-slate-50">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">গুদামে অবশিষ্ট খাদ্য স্টক</span>
                <span className="text-base font-black text-slate-900 mt-0.5 block">
                  {stockAudit.closing_stock_bags ?? summary.remaining_feed_bags ?? 98} ব্যাগ
                </span>
                <span className="text-[10px] text-slate-600">
                  {oct26Adjustment ? '✅ শারীরিক খাতার সাথে মিল রয়েছে' : 'মোট মজুত ফিড'}
                </span>
              </div>
            </div>

            {/* Daily Feeding Table */}
            <div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide mb-1.5 flex items-center justify-between">
                <span>১. দৈনিক খাদ্য প্রয়োগের বিস্তারিত বিবরণী (Daily Feeding Details)</span>
                <span className="text-[10px] font-medium text-slate-500">তারিখ: {report?.start_date}</span>
              </h4>
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th style={{ width: '6%' }} className="text-center">ক্র.</th>
                    <th style={{ width: '14%' }}>পুকুর নং</th>
                    <th style={{ width: '14%' }}>প্রয়োগের সময়</th>
                    <th style={{ width: '16%' }}>ব্যাগের সংখ্যা</th>
                    <th style={{ width: '14%' }}>মোট কেজি</th>
                    <th style={{ width: '18%' }}>ফিড মূল্য (BDT)</th>
                    <th style={{ width: '18%' }}>আবহাওয়া ও মন্তব্য</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyFeedItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-3 text-center text-slate-500 italic">
                        {report?.start_date} তারিখে কোনো খাদ্য প্রয়োগ রেকর্ড পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    dailyFeedItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="text-center font-bold text-slate-600">{idx + 1}</td>
                        <td className="font-bold text-teal-900">{item.pond}</td>
                        <td className="font-medium text-slate-700">{item.description?.split('•')[1]?.replace('সময়:', '') || 'সকাল'}</td>
                        <td className="font-bold text-slate-900">{item.quantity}</td>
                        <td className="font-medium text-slate-800">
                          {(parseFloat(item.quantity) * 25).toFixed(0)} কেজি
                        </td>
                        <td className="font-bold text-slate-900">৳ {item.amount_bdt?.toLocaleString()}</td>
                        <td className="text-slate-600 text-[11px]">{item.description?.split('•')[2]?.replace('আবহাওয়া:', '') || 'স্বাভাবিক'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="font-bold bg-slate-100">
                    <td colSpan={3} className="text-right">দৈনিক মোট খাদ্য (Daily Feed Total):</td>
                    <td className="font-black text-teal-900">{summary.feed_bags_consumed || 0} ব্যাগ</td>
                    <td className="font-bold text-slate-900">{summary.feed_kg_consumed || 0} কেজি</td>
                    <td className="font-black text-teal-900">৳ {summary.feed_consumed_cost_bdt?.toLocaleString() || 0}</td>
                    <td>-</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Daily Operational Expenses */}
            <div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide mb-1.5 flex items-center justify-between">
                <span>২. দৈনিক পরিচালন ও অন্যান্য খরচ (Daily Operational Expenses)</span>
                <span className="text-[10px] font-medium text-slate-500">মোট রেকর্ড: {dailyExpenseItems.length} টি</span>
              </h4>
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th style={{ width: '6%' }} className="text-center">ক্র.</th>
                    <th style={{ width: '22%' }}>ব্যয়ের খাত</th>
                    <th style={{ width: '14%' }}>পুকুর</th>
                    <th style={{ width: '38%' }}>বিবরণ ও ভাউচার</th>
                    <th style={{ width: '20%' }} className="text-right">টাকার পরিমাণ (BDT)</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyExpenseItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-2.5 text-center text-slate-500 italic">
                        {report?.start_date} তারিখে কোনো অতিরিক্ত পরিচালন ব্যয় রেকর্ড নেই।
                      </td>
                    </tr>
                  ) : (
                    dailyExpenseItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="text-center font-bold text-slate-600">{idx + 1}</td>
                        <td className="font-bold text-slate-900">{item.type}</td>
                        <td className="text-teal-900 font-semibold">{item.pond}</td>
                        <td className="text-slate-700">{item.description}</td>
                        <td className="text-right font-bold text-slate-900">৳ {item.amount_bdt?.toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="font-bold bg-slate-100">
                    <td colSpan={4} className="text-right">আজকের সর্বমোট ব্যয় (Grand Total):</td>
                    <td className="text-right font-black text-emerald-900 text-sm">
                      ৳ {summary.total_period_cost_bdt?.toLocaleString() || 0}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Daily Stock Snapshot Table */}
            <div className="p-2.5 rounded-lg border border-slate-300 bg-slate-50 space-y-1">
              <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-wide">
                ৩. খাদ্য গুদাম দৈনিক ব্যালেন্স স্থিতি (Daily Feed Warehouse Reconciliation)
              </h5>
              <div className="grid grid-cols-5 gap-2 text-[11px] text-center pt-1 border-t border-slate-200">
                <div>
                  <span className="text-slate-500 block">প্রারম্ভিক স্টক</span>
                  <span className="font-bold text-slate-900">{stockAudit.opening_stock_bags ?? 0} ব্যাগ</span>
                </div>
                <div>
                  <span className="text-slate-500 block">+ নতুন চালান ক্রয়</span>
                  <span className="font-bold text-teal-800">{stockAudit.purchased_in_period_bags ?? 0} ব্যাগ</span>
                </div>
                <div>
                  <span className="text-slate-500 block">- আজ খাওয়ানো</span>
                  <span className="font-bold text-rose-800">{stockAudit.consumed_in_period_bags ?? summary.feed_bags_consumed ?? 0} ব্যাগ</span>
                </div>
                <div>
                  <span className="text-slate-500 block">অডিট সমন্বয়</span>
                  <span className="font-bold text-amber-800">{stockAudit.adjusted_in_period_bags ?? 0} ব্যাগ</span>
                </div>
                <div className="font-bold bg-white p-1 rounded border border-slate-300">
                  <span className="text-slate-600 block">সমাপনী উদ্বৃত্ত</span>
                  <span className="font-black text-teal-900 text-xs">{stockAudit.closing_stock_bags ?? 98} ব্যাগ</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* VIEW 2: WEEKLY REPORT FORMAT (৭ দিনের দিনভিত্তিক চার্ট ও হিসাব)     */}
        {/* ===================================================================== */}
        {period === 'weekly' && (
          <div className="space-y-3.5">
            {/* Weekly KPI Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded-lg border border-slate-300 bg-slate-50">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">সাপ্তাহিক মোট ফিড</span>
                <span className="text-base font-black text-teal-900 mt-0.5 block">
                  {summary.feed_bags_consumed || 0} ব্যাগ ({summary.feed_kg_consumed || 0} কেজি)
                </span>
                <span className="text-[10px] text-slate-600">ফিড মূল্য: ৳ {summary.feed_consumed_cost_bdt?.toLocaleString() || 0}</span>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-300 bg-slate-50">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">সাপ্তাহিক পরিচালন খরচ</span>
                <span className="text-base font-black text-slate-900 mt-0.5 block">
                  ৳ {summary.total_other_expenses_bdt?.toLocaleString() || 0}
                </span>
                <span className="text-[10px] text-slate-600">ওষুধ, বিদ্যুৎ ও মজুরি</span>
              </div>

              <div className="p-2.5 rounded-lg border border-teal-400 bg-teal-50">
                <span className="text-[10px] font-bold text-teal-800 uppercase block">সাপ্তাহিক সর্বমোট ব্যয়</span>
                <span className="text-lg font-black text-teal-900 mt-0.5 block">
                  ৳ {summary.total_period_cost_bdt?.toLocaleString() || 0}
                </span>
                <span className="text-[10px] text-teal-800 font-medium">৭ দিনের গ্র্যান্ড টোটাল</span>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-300 bg-slate-50">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">সপ্তাহ শেষে মজুত স্টক</span>
                <span className="text-base font-black text-slate-900 mt-0.5 block">
                  {stockAudit.closing_stock_bags ?? summary.remaining_feed_bags ?? 98} ব্যাগ
                </span>
                <span className="text-[10px] text-slate-600">গুদামে অবশিষ্ট ফিড</span>
              </div>
            </div>

            {/* 7-Day Matrix Table */}
            <div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide mb-1.5 flex items-center justify-between">
                <span>১. সাত দিনের দিনভিত্তিক খাদ্য ও ব্যয়ের ম্যাট্রিক্স (7-Day Daily Log Matrix)</span>
                <span className="text-[10px] font-medium text-slate-500">সময়কাল: {report?.start_date} হতে {report?.end_date}</span>
              </h4>
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th style={{ width: '13%' }}>তারিখ</th>
                    <th style={{ width: '12%' }}>বার (Day)</th>
                    <th style={{ width: '11%' }} className="text-center">পুকুর ১</th>
                    <th style={{ width: '11%' }} className="text-center">পুকুর ২</th>
                    <th style={{ width: '13%' }} className="text-center">মোট ব্যাগ</th>
                    <th style={{ width: '12%' }} className="text-center">মোট কেজি</th>
                    <th style={{ width: '14%' }} className="text-right">ফিড মূল্য (BDT)</th>
                    <th style={{ width: '14%' }} className="text-right">অন্যান্য ব্যয়</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyMatrix.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-3 text-center text-slate-500 italic">
                        নির্বাচিত সপ্তাহে কোনো খাদ্য বা খরচের রেকর্ড পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    dailyMatrix.map((d, idx) => (
                      <tr key={idx} className={d.total_bags > 0 ? 'bg-white' : 'bg-slate-50 text-slate-400'}>
                        <td className="font-bold text-slate-900">{d.date}</td>
                        <td className="font-medium text-slate-700">{d.day_name}</td>
                        <td className="text-center font-semibold text-teal-900">{d.pond1_bags > 0 ? `${d.pond1_bags} ব্যাগ` : '-'}</td>
                        <td className="text-center font-semibold text-cyan-900">{d.pond2_bags > 0 ? `${d.pond2_bags} ব্যাগ` : '-'}</td>
                        <td className="text-center font-black text-slate-900">{d.total_bags > 0 ? `${d.total_bags} ব্যাগ` : '-'}</td>
                        <td className="text-center font-medium text-slate-700">{d.total_kg > 0 ? `${d.total_kg} কেজি` : '-'}</td>
                        <td className="text-right font-bold text-slate-900">{d.feed_cost_bdt > 0 ? `৳ ${d.feed_cost_bdt.toLocaleString()}` : '-'}</td>
                        <td className="text-right font-medium text-slate-700">{d.other_cost_bdt > 0 ? `৳ ${d.other_cost_bdt.toLocaleString()}` : '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="font-bold bg-slate-100 text-slate-900">
                    <td colSpan={2} className="text-right">সাপ্তাহিক সর্বমোট (Weekly Total):</td>
                    <td className="text-center text-teal-900 font-bold">{pondSummary.find(p => p.pond_id === 1)?.feed_bags || 0} ব্যাগ</td>
                    <td className="text-center text-cyan-900 font-bold">{pondSummary.find(p => p.pond_id === 2)?.feed_bags || 0} ব্যাগ</td>
                    <td className="text-center font-black text-slate-950">{summary.feed_bags_consumed || 0} ব্যাগ</td>
                    <td className="text-center font-bold text-slate-900">{summary.feed_kg_consumed || 0} কেজি</td>
                    <td className="text-right font-black text-teal-900">৳ {summary.feed_consumed_cost_bdt?.toLocaleString() || 0}</td>
                    <td className="text-right font-bold text-slate-900">৳ {summary.total_other_expenses_bdt?.toLocaleString() || 0}</td>
                  </tr>
                  <tr className="bg-teal-50 font-black text-teal-950 text-xs">
                    <td colSpan={6} className="text-right">সাপ্তাহিক গ্র্যান্ড টোটাল ব্যয় (Total Weekly Cost):</td>
                    <td colSpan={2} className="text-right text-emerald-900 text-sm">
                      ৳ {summary.total_period_cost_bdt?.toLocaleString() || 0}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Weekly Stock Reconciliation Table */}
            <div className="p-2.5 rounded-lg border border-slate-300 bg-slate-50 space-y-1">
              <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-wide">
                ২. সাপ্তাহিক খাদ্য গুদাম স্টক নিরীক্ষা (Weekly Feed Stock Audit)
              </h5>
              <div className="grid grid-cols-5 gap-2 text-[11px] text-center pt-1 border-t border-slate-200">
                <div>
                  <span className="text-slate-500 block">সপ্তাহের শুরুতে স্টক</span>
                  <span className="font-bold text-slate-900">{stockAudit.opening_stock_bags ?? 0} ব্যাগ</span>
                </div>
                <div>
                  <span className="text-slate-500 block">+ নতুন চালান ক্রয়</span>
                  <span className="font-bold text-teal-800">{stockAudit.purchased_in_period_bags ?? summary.feed_purchased_bags ?? 0} ব্যাগ</span>
                </div>
                <div>
                  <span className="text-slate-500 block">- সপ্তাহে খাওয়ানো</span>
                  <span className="font-bold text-rose-800">{stockAudit.consumed_in_period_bags ?? summary.feed_bags_consumed ?? 0} ব্যাগ</span>
                </div>
                <div>
                  <span className="text-slate-500 block">অডিট সমন্বয়</span>
                  <span className="font-bold text-amber-800">{stockAudit.adjusted_in_period_bags ?? 0} ব্যাগ</span>
                </div>
                <div className="font-bold bg-white p-1 rounded border border-slate-300">
                  <span className="text-slate-600 block">সপ্তাহ শেষে মজুত</span>
                  <span className="font-black text-teal-900 text-xs">{stockAudit.closing_stock_bags ?? 98} ব্যাগ</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* VIEW 3: MONTHLY & 6-MONTH CULTURE CYCLE REPORT FORMAT                */}
        {/* ===================================================================== */}
        {(period === 'monthly' || period === 'cycle' || period === 'custom') && (
          <div className="space-y-4">
            {/* Section 1: Executive Category-Wise Summary */}
            <div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide mb-1.5 flex items-center justify-between">
                <span>১. সার্বিক ব্যয়ের খাতভিত্তিক হিসাব (Executive Financial Summary)</span>
                <span className="text-[10px] font-medium text-slate-500">{report?.period_label}</span>
              </h4>
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th style={{ width: '8%' }} className="text-center">ক্র.</th>
                    <th style={{ width: '38%' }}>ব্যয়ের খাত (Expenditure Category)</th>
                    <th style={{ width: '24%' }}>পরিমাণ / ইউনিট</th>
                    <th style={{ width: '30%' }} className="text-right">টাকার পরিমাণ (BDT)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="text-center font-bold text-slate-600">১</td>
                    <td className="font-bold text-slate-900">বাণিজ্যিক ফিড ব্যয় (Commercial Pellets)</td>
                    <td className="text-slate-700">{summary.feed_bags_consumed || 0} ব্যাগ ({summary.feed_kg_consumed || 0} কেজি @ ৳{summary.avg_feed_rate_per_bag})</td>
                    <td className="text-right font-bold text-teal-900">৳ {summary.feed_consumed_cost_bdt?.toLocaleString() || 0}</td>
                  </tr>
                  <tr>
                    <td className="text-center font-bold text-slate-600">২</td>
                    <td className="font-bold text-slate-900">সম্পূরক ভাত ও জ্বালানি (Rice / Vaat)</td>
                    <td className="text-slate-700">{summary.vaat_kg_consumed || 0} কেজি সিদ্ধ ভাত সরবরাহ</td>
                    <td className="text-right font-bold text-slate-900">৳ {summary.vaat_cost_bdt?.toLocaleString() || 0}</td>
                  </tr>
                  <tr>
                    <td className="text-center font-bold text-slate-600">৩</td>
                    <td className="font-bold text-slate-900">ওষুধ, চুন ও পানি শোধন (Medicine & Lime)</td>
                    <td className="text-slate-700">খামারের পুকুর শোধন ও মাছের সুরক্ষা</td>
                    <td className="text-right font-bold text-slate-900">৳ {summary.medicine_lime_cost_bdt?.toLocaleString() || 0}</td>
                  </tr>
                  <tr>
                    <td className="text-center font-bold text-slate-600">৪</td>
                    <td className="font-bold text-slate-900">বিদ্যুৎ ও জেনারেটর ডিজেল (Electricity & Fuel)</td>
                    <td className="text-slate-700">এয়ারেটর ও সেচ পাম্প পরিচালনা</td>
                    <td className="text-right font-bold text-slate-900">৳ {summary.electricity_fuel_cost_bdt?.toLocaleString() || 0}</td>
                  </tr>
                  <tr>
                    <td className="text-center font-bold text-slate-600">৫</td>
                    <td className="font-bold text-slate-900">শ্রমিক মজুরি ও তদারকি (Labor Wages)</td>
                    <td className="text-slate-700">ফিল্ড সুপারভাইজার ও পুকুর শ্রমিক বেতন</td>
                    <td className="text-right font-bold text-slate-900">৳ {summary.labor_wages_cost_bdt?.toLocaleString() || 0}</td>
                  </tr>
                  {summary.pona_stocking_cost_bdt > 0 && (
                    <tr>
                      <td className="text-center font-bold text-slate-600">৬</td>
                      <td className="font-bold text-emerald-900">পোনা ক্রয় ও পরিবহন (Fingerlings Stocking)</td>
                      <td className="text-slate-700">পাঙ্গাশ ও কার্প মাছের পোনা ছাড়করণ</td>
                      <td className="text-right font-bold text-emerald-900">৳ {summary.pona_stocking_cost_bdt?.toLocaleString() || 0}</td>
                    </tr>
                  )}
                  <tr>
                    <td className="text-center font-bold text-slate-600">{summary.pona_stocking_cost_bdt > 0 ? '৭' : '৬'}</td>
                    <td className="font-bold text-slate-900">রক্ষণাবেক্ষণ ও বিবিধ (Maintenance & Misc)</td>
                    <td className="text-slate-700">জাল, পাম্প মেরামত ও আনুষঙ্গিক খরচ</td>
                    <td className="text-right font-bold text-slate-900">৳ {(summary.maintenance_cost_bdt + summary.misc_cost_bdt)?.toLocaleString() || 0}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-bold text-slate-900">
                    <td colSpan={3} className="text-right">নির্বাচিত সময়ের মোট ব্যয় (Total Period Expenditure):</td>
                    <td className="text-right font-black text-emerald-950 text-sm">
                      ৳ {summary.total_period_cost_bdt?.toLocaleString() || 0}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Section 2: Pond-Wise Breakdown & Stock Reconciliation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Pond-wise table */}
              <div>
                <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-wide mb-1">
                  ২. পুকুরভিত্তিক খাদ্য প্রয়োগের বিশ্লেষণ (Pond Breakdown)
                </h5>
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      <th>পুকুর</th>
                      <th className="text-center">খাদ্যের পরিমাণ</th>
                      <th className="text-center">ওজন (কেজি)</th>
                      <th className="text-right">মোট ব্যয় (BDT)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pondSummary.length === 0 ? (
                      <tr><td colSpan={4} className="text-center text-slate-500 italic p-2">কোনো রেকর্ড নেই</td></tr>
                    ) : (
                      pondSummary.map((p, i) => (
                        <tr key={i}>
                          <td className="font-bold text-teal-900">{p.pond_name}</td>
                          <td className="text-center font-bold">{p.feed_bags} ব্যাগ</td>
                          <td className="text-center">{p.feed_kg} কেজি</td>
                          <td className="text-right font-bold">৳ {p.feed_cost_bdt?.toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="font-bold bg-slate-100">
                      <td>মোট:</td>
                      <td className="text-center font-black">{summary.feed_bags_consumed || 0} ব্যাগ</td>
                      <td className="text-center">{summary.feed_kg_consumed || 0} কেজি</td>
                      <td className="text-right font-black">৳ {summary.feed_consumed_cost_bdt?.toLocaleString() || 0}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Warehouse stock audit box */}
              <div>
                <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-wide mb-1">
                  ৩. খাদ্য গুদাম স্টক নিরীক্ষা বিবরণী (Feed Inventory Audit)
                </h5>
                <div className="p-2.5 rounded border border-slate-300 bg-slate-50 space-y-1.5 text-xs">
                  <div className="flex justify-between border-b border-slate-200 pb-1">
                    <span className="text-slate-600">১. প্রারম্ভিক স্টক (Opening Stock):</span>
                    <span className="font-bold text-slate-900">{stockAudit.opening_stock_bags ?? 0} ব্যাগ</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-1">
                    <span className="text-slate-600">২. নতুন চালান ক্রয় (Batches Received):</span>
                    <span className="font-bold text-teal-800">+{stockAudit.purchased_in_period_bags ?? summary.feed_purchased_bags ?? 0} ব্যাগ</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-1">
                    <span className="text-slate-600">৩. পুকুরে প্রয়োগকৃত খাদ্য (Feed Consumed):</span>
                    <span className="font-bold text-rose-800">-{stockAudit.consumed_in_period_bags ?? summary.feed_bags_consumed ?? 0} ব্যাগ</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-1">
                    <span className="text-slate-600">৪. শারীরিক খাতা নিরীক্ষা সমন্বয় (Audit Variance):</span>
                    <span className="font-bold text-amber-800">-{stockAudit.adjusted_in_period_bags ?? 0} ব্যাগ</span>
                  </div>
                  <div className="flex justify-between pt-0.5 bg-white p-1.5 rounded border border-slate-300">
                    <span className="font-black text-slate-900">৫. সমাপনী উদ্বৃত্ত খাদ্য (Closing Stock):</span>
                    <span className="font-black text-teal-900 text-sm">{stockAudit.closing_stock_bags ?? 98} ব্যাগ</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: High-Density Transaction Ledger Table */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                  ৪. আইটেমাইজড অডিট খাতা (Chronological Transaction Ledger)
                </h4>
                <span className="text-[10px] text-slate-600 font-bold">মোট লেনদেন: {filteredLedger.length} টি</span>
              </div>

              <div className="overflow-x-auto border border-slate-300 rounded">
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      <th style={{ width: '5%' }} className="text-center">ক্র.</th>
                      <th style={{ width: '11%' }}>তারিখ</th>
                      <th style={{ width: '20%' }}>খাত / ধরণ</th>
                      <th style={{ width: '10%' }}>পুকুর</th>
                      <th style={{ width: '12%' }}>পরিমাণ</th>
                      <th style={{ width: '27%' }}>বিস্তারিত বিবরণ ও ভাউচার</th>
                      <th style={{ width: '15%' }} className="text-right">টাকা (BDT)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLedger.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-3 text-center text-slate-500 italic">
                          এই নির্বাচিত সময়ে কোনো খরচের রেকর্ড পাওয়া যায়নি।
                        </td>
                      </tr>
                    ) : (
                      filteredLedger.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="text-center font-medium text-slate-500 text-[10px]">{idx + 1}</td>
                          <td className="font-bold text-slate-900 whitespace-nowrap">{item.date}</td>
                          <td className="font-bold text-slate-800">{item.type}</td>
                          <td className="font-semibold text-teal-900 whitespace-nowrap">{item.pond}</td>
                          <td className="font-bold text-slate-900 whitespace-nowrap">{item.quantity}</td>
                          <td className="text-slate-700 text-[11px]">{item.description}</td>
                          <td className="text-right font-black text-slate-900 whitespace-nowrap">
                            {item.amount_bdt > 0 ? `৳ ${item.amount_bdt.toLocaleString()}` : '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-bold text-slate-900">
                      <td colSpan={6} className="text-right">লেজার মোট ব্যয় (Ledger Total Amount):</td>
                      <td className="text-right font-black text-emerald-950 text-xs whitespace-nowrap">
                        ৳ {summary.total_period_cost_bdt?.toLocaleString() || 0}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* OFFICIAL 3-OFFICER SIGNATURES & VERIFICATION (Anchored at page bottom)   */}
        {/* ========================================================================= */}
        <div className="signature-block pt-6 border-t-2 border-slate-300 mt-4 grid grid-cols-3 gap-6 text-center text-xs">
          <div>
            <div className="h-10 border-b-2 border-dashed border-slate-400 mb-1" />
            <span className="font-bold text-slate-950 block">হিসাবরক্ষক / ফিল্ড ম্যানেজার</span>
            <span className="text-[10px] text-slate-500 block">শাহ আমানত ফিশারি অ্যান্ড এগ্রো</span>
            <span className="text-[9px] text-slate-400 block">স্বাক্ষর ও তারিখ</span>
          </div>
          <div>
            <div className="h-10 border-b-2 border-dashed border-slate-400 mb-1" />
            <span className="font-bold text-slate-950 block">অভ্যন্তরীণ নিরীক্ষক (Auditor)</span>
            <span className="text-[10px] text-slate-500 block">যাচাইকৃত ও শারীরিক খাতা নিরীক্ষিত</span>
            <span className="text-[9px] text-slate-400 block">স্বাক্ষর ও সিল</span>
          </div>
          <div>
            <div className="h-10 border-b-2 border-dashed border-slate-400 mb-1" />
            <span className="font-bold text-teal-900 block">সুপারএডমিন / প্রকল্প পরিচালক</span>
            <span className="text-[10px] text-slate-500 block">চূড়ান্ত অনুমোদন ও নিষ্পত্তি</span>
            <span className="text-[9px] text-slate-400 block">স্বাক্ষর ও সিল</span>
          </div>
        </div>

      </div>
    </div>
  );
}
