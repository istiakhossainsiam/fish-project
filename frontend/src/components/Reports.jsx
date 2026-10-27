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
  const [targetDate, setTargetDate] = useState('2026-10-26'); // default to audited date
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

  // Reconcile the 5 bags variance on 26/10/2026
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

  // Check if 26/10/2026 audit adjustment is active
  const oct26Adjustment = adjustments.find(a => a.date === '2026-10-26' && Math.abs(a.bag_count - 5.0) < 0.1);

  // Filter ledger based on user search term
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

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* ========================================================================= */}
      {/* TOP HEADER & ACTION BAR (Screen only) */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-600" />
            খাদ্য ও অপারেশনাল খরচের অডিট ও প্রিন্ট রিপোর্ট (Audit & Print Reports)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            দৈনিক, সাপ্তাহিক ও মাসিক পূর্ণাঙ্গ রিপোর্ট, নির্ভুল প্রিন্ট ফরম্যাট এবং শারীরিক স্টক শিটের সাথে ভ্যালিডেশন
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadReport}
            title="রিফ্রেশ করুন"
            className="p-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-600 border border-slate-300 shadow-sm cursor-pointer transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-600' : ''}`} />
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 cursor-pointer transition"
          >
            <Printer className="w-4 h-4" /> প্রিন্ট / PDF সেভ করুন (Print A4)
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 26/10/2026 PHYSICAL STOCK SHEET AUDIT BANNER */}
      {/* ========================================================================= */}
      <div className="no-print p-4 sm:p-5 rounded-2xl bg-white border border-amber-300 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-900 text-sm">
                  শারীরিক স্টক শিট বনাম সফটওয়্যার হিসাব নিরীক্ষা (২৬/১০/২০২৬)
                </h4>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  oct26Adjustment ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-amber-50 text-amber-800 border-amber-300'
                }`}>
                  {oct26Adjustment ? 'সমন্বয় সম্পন্ন (Reconciled)' : '৫ ব্যাগ পার্থক্য শনাক্ত (5 Bags Variance)'}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {oct26Adjustment ? (
                  <span>
                    ✅ ২৬/১০/২০২৬ তারিখে খামারের গুদামে শারীরিক খাতা অনুযায়ী <strong>৯৩.০ ব্যাগ</strong> ফিড মজুত নিশ্চিত করা হয়েছে। সফটওয়্যারের ৫ ব্যাগ ঘাটতি অডিট সমন্বয় সম্পন্ন।
                  </span>
                ) : (
                  <span>
                    ২৬/১০/২০২৬ তারিখে সফটওয়্যারের বুক স্টক ছিল <strong>৯৮.০ ব্যাগ</strong> (মোট ৪৩০ ব্যাগ চালান - ৩৩২ ব্যাগ খাওয়ানো)। আপনার খামারের আসল কাগজের রেজিস্টার শিটে ছিল <strong>৯৩.০ ব্যাগ</strong> (অর্থাৎ <strong>৫ ব্যাগের তফাত</strong>)।
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
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-semibold cursor-pointer transition"
              >
                সমন্বয় বাতিল (Undo)
              </button>
            ) : (
              <button
                onClick={handleReconcile5Bags}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm cursor-pointer transition"
              >
                <Check className="w-4 h-4" /> ৫ ব্যাগ সমন্বয় করুন (Reconcile)
              </button>
            )}
          </div>
        </div>

        {/* Quick stock breakdown pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
          <div className="bg-slate-50 p-2 rounded-xl">
            <span className="text-[10px] text-slate-400 block">মোট প্রাপ্ত ফিড চালান</span>
            <span className="font-bold text-slate-900">৪৩০ ব্যাগ (১০,৭৫০ কেজি)</span>
          </div>
          <div className="bg-slate-50 p-2 rounded-xl">
            <span className="text-[10px] text-slate-400 block">মোট খাওয়ানো (Consumed)</span>
            <span className="font-bold text-teal-700">৩৩২.০ ব্যাগ (৮,৩০০ কেজি)</span>
          </div>
          <div className="bg-slate-50 p-2 rounded-xl">
            <span className="text-[10px] text-slate-400 block">সফটওয়্যার বুক ব্যালেন্স</span>
            <span className="font-bold text-slate-900">৯৮.০ ব্যাগ</span>
          </div>
          <div className={`p-2 rounded-xl font-bold ${oct26Adjustment ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900'}`}>
            <span className="text-[10px] block opacity-75">শারীরিক খাতার স্টক (Real)</span>
            <span>{oct26Adjustment ? '৯৩.০ ব্যাগ (সঠিক)' : '৯৩.০ ব্যাগ (-৫ ব্যাগ তফাত)'}</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FILTER & PERIOD SELECTOR CARD (Hidden in print) */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4 no-print">
        {/* Period Selector Tabs */}
        <div>
          <label className="text-xs font-bold text-slate-800 block mb-2">
            রিপোর্টের সময়কাল নির্বাচন করুন (Select Report Type):
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { id: 'daily', label: '⏱️ দৈনিক (Daily Report)', desc: 'প্রতিদিনের খাবারের খাতা ও ব্যয়' },
              { id: 'weekly', label: '🗓️ সাপ্তাহিক (Weekly Report)', desc: '৭ দিনের সার্বিক খাদ্য ও খরচ' },
              { id: 'monthly', label: '📊 মাসিক (Monthly Report)', desc: 'নির্দিষ্ট মাসের পূর্ণাঙ্গ হিসাব' },
              { id: 'cycle', label: '🔄 ৬ মাসের সাইকেল (6 Months)', desc: '১৮/০৯/২০২৬ - ১৮/০৩/২০২৭' },
              { id: 'custom', label: '🔍 কাস্টম তারিখ (Custom)', desc: 'নির্দিষ্ট রেঞ্জ ফিল্টার' },
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  period === p.id
                    ? 'bg-teal-50 border-teal-600 text-teal-900 ring-2 ring-teal-500/20 shadow-sm'
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
          {/* Daily Date Picker */}
          {period === 'daily' && (
            <div>
              <label className="text-slate-600 block mb-1 font-semibold">তারিখ নির্বাচন (Date):</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:border-teal-600 shadow-sm focus:outline-none"
              />
              <div className="flex flex-wrap gap-1 mt-1.5">
                <button 
                  onClick={() => setTargetDate('2026-10-26')}
                  className="px-2 py-0.5 rounded bg-amber-50 text-[10px] font-bold text-amber-800 hover:bg-amber-100 border border-amber-200"
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
                  onClick={() => setTargetDate('2026-10-15')}
                  className="px-2 py-0.5 rounded bg-slate-100 text-[10px] text-teal-800 hover:bg-slate-200 border border-slate-200"
                >
                  ১৫ অক্টোবর
                </button>
              </div>
            </div>
          )}

          {/* Weekly Picker */}
          {period === 'weekly' && (
            <div>
              <label className="text-slate-600 block mb-1 font-semibold">সপ্তাহের শেষ তারিখ (Week End):</label>
              <input
                type="date"
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:border-teal-600 shadow-sm focus:outline-none"
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

          {/* Monthly Picker */}
          {period === 'monthly' && (
            <div>
              <label className="text-slate-600 block mb-1 font-semibold">মাস নির্বাচন (Select Month):</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:border-teal-600 shadow-sm focus:outline-none"
              >
                <option value="2026-10">অক্টোবর ২০২৬ (October 2026)</option>
                <option value="2026-09">সেপ্টেম্বর ২০২৬ (September 2026)</option>
                <option value="2026-11">নভেম্বর ২০২৬ (November 2026)</option>
              </select>
            </div>
          )}

          {/* Custom Date Range */}
          {period === 'custom' && (
            <>
              <div>
                <label className="text-slate-600 block mb-1 font-semibold">শুরুর তারিখ (From):</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:border-teal-600 shadow-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="text-slate-600 block mb-1 font-semibold">শেষের তারিখ (To):</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:border-teal-600 shadow-sm focus:outline-none"
                />
              </div>
            </>
          )}

          {/* Pond Selector */}
          <div>
            <label className="text-slate-600 block mb-1 font-semibold">পুকুর ফিল্টার (Pond Filter):</label>
            <select
              value={pondId}
              onChange={(e) => setPondId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:border-teal-600 shadow-sm focus:outline-none"
            >
              <option value="all">সব পুকুর (All 4 Ponds)</option>
              {ponds?.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Quick Keyword Search in Ledger */}
          <div>
            <label className="text-slate-600 block mb-1 font-semibold">লেজারে খুঁজুন (Search Ledger):</label>
            <div className="relative">
              <input
                type="text"
                placeholder="ফিড, ওষুধ, ভাউচার, সকাল..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-2 text-slate-900 placeholder-slate-400 focus:border-teal-600 shadow-sm focus:outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* OFFICIAL PRINTABLE A4 AUDIT REPORT CONTAINER */}
      {/* ========================================================================= */}
      <div className="printable-report p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6 text-slate-900">
        
        {/* Printable Official Header */}
        <div className="border-b-2 border-slate-800 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded bg-slate-900 text-white tracking-wider uppercase">
                COMMERCIAL AQUACULTURE AUDIT & COSTING REPORT
              </span>
              <span className="text-xs text-slate-600 font-semibold">• শাহ আমানত ফিশারি</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 mt-1 tracking-tight">
              শাহ আমানত ফিশারি অ্যান্ড এগ্রো প্রজেক্ট
            </h1>
            <p className="text-xs text-slate-600 mt-0.5 font-medium">
              ঠিকানা: শাহ আমানত আন্তর্জাতিক বিমানবন্দর এলাকা, পতেঙ্গা, চট্টগ্রাম • ৪টি পুকুর (২০ একর)
            </p>
          </div>

          <div className="text-right text-xs text-slate-700 sm:border-l-2 sm:border-slate-300 sm:pl-4 space-y-0.5">
            <div className="font-black text-teal-800 text-sm">
              {report?.period_label || 'খরচ ও খাদ্য নিরীক্ষা রিপোর্ট'}
            </div>
            <div>
              তারিখ ব্যপ্তি: <span className="font-bold text-slate-900">{report?.start_date}</span> হতে <span className="font-bold text-slate-900">{report?.end_date}</span>
            </div>
            <div className="text-[11px] text-slate-500">
              পুকুর: <span className="font-bold text-slate-800">{pondId === 'all' ? 'সব পুকুর (১, ২, ৩, ৪)' : `পুকুর ${pondId}`}</span>
            </div>
            <div className="text-[10px] text-slate-500">
              প্রিন্ট তারিখ: {new Date().toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>

        {/* 1. TOP SUMMARY METRIC CARDS (খাবার ও ব্যয়ের সারসংক্ষেপ) */}
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-emerald-700" />
            নির্বাচিত সময়কালের খাবার ব্যবহার ও পরিচালন ব্যয়ের সারসংক্ষেপ (Cost Breakdown)
          </h3>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* 1. Commercial Feed Cost */}
            <div className="print-metric-box bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-slate-600 block font-semibold">খাওয়ানো ফিড (Feed Consumed)</span>
              <div className="text-xl font-black text-teal-800 mt-1">
                {summary.feed_bags_consumed || 0} <span className="text-xs text-slate-600 font-normal">ব্যাগ</span>
              </div>
              <div className="text-xs font-bold text-slate-900 mt-0.5">
                = ৳ {summary.feed_consumed_cost_bdt?.toLocaleString() || 0}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                গড় দর: ৳{summary.avg_feed_rate_per_bag} /ব্যাগ • {summary.feed_kg_consumed} কেজি
              </span>
            </div>

            {/* 2. Vaat / Rice Supply */}
            <div className="print-metric-box bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-slate-600 block font-semibold">ভাত সরবরাহ (Vaat / Rice)</span>
              <div className="text-xl font-black text-amber-800 mt-1">
                {summary.vaat_kg_consumed || 0} <span className="text-xs text-slate-600 font-normal">কেজি</span>
              </div>
              <div className="text-xs font-bold text-slate-900 mt-0.5">
                = ৳ {summary.vaat_cost_bdt?.toLocaleString() || 0}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                চাল ও জ্বালানি সহ সম্পূরক খাদ্য
              </span>
            </div>

            {/* 3. Medicine & Operations */}
            <div className="print-metric-box bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-slate-600 block font-semibold">ওষুধ, বিদ্যুৎ ও মজুরি</span>
              <div className="text-xl font-black text-slate-900 mt-1">
                ৳ {summary.total_other_expenses_bdt?.toLocaleString() || 0}
              </div>
              <div className="text-[10px] text-slate-600 mt-1 space-y-0.5">
                <div>ওষুধ/চুন: ৳{summary.medicine_lime_cost_bdt?.toLocaleString()}</div>
                <div>বিদ্যুৎ: ৳{summary.electricity_fuel_cost_bdt?.toLocaleString()} • মজুরি: ৳{summary.labor_wages_cost_bdt?.toLocaleString()}</div>
              </div>
            </div>

            {/* 4. Grand Total Period Cost */}
            <div className="print-metric-box bg-emerald-50 p-3.5 rounded-xl border-2 border-emerald-600">
              <span className="text-emerald-900 block font-bold">নির্বাচিত সময়ের মোট ব্যয়</span>
              <div className="text-2xl font-black text-emerald-800 mt-1">
                ৳ {summary.total_period_cost_bdt?.toLocaleString() || 0}
              </div>
              <span className="text-[10px] text-emerald-900/80 mt-1 block font-medium">
                {summary.pona_stocking_cost_bdt > 0 ? `(পোনা ক্রয় ৳${summary.pona_stocking_cost_bdt?.toLocaleString()} সহ)` : '(চলতি অপারেশনাল ও খাদ্য ব্যয়)'}
              </span>
            </div>
          </div>
        </div>

        {/* 2. FEED STOCK AUDIT & WAREHOUSE INVENTORY BALANCE */}
        <div className="printable-card p-4 rounded-xl border border-slate-300 bg-slate-50 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-200">
            <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 uppercase tracking-wide">
              <Package className="w-4 h-4 text-teal-700" />
              খাদ্য গুদাম স্টক নিরীক্ষা ও ব্যালেন্স স্থিতি (Feed Warehouse Stock Reconciliation)
            </h4>
            <span className="text-[11px] font-semibold text-slate-600">
              অডিট তারিখ: {stockAudit.as_of_date || report?.end_date}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-500 block">প্রারম্ভিক স্টক</span>
              <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                {stockAudit.opening_stock_bags ?? 0} ব্যাগ
              </span>
              <span className="text-[10px] text-slate-500">সময়কালের পূর্বে</span>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-500 block">+ নতুন চালান ক্রয়</span>
              <span className="font-bold text-teal-700 text-sm mt-0.5 block">
                {stockAudit.purchased_in_period_bags ?? summary.feed_purchased_bags ?? 0} ব্যাগ
              </span>
              <span className="text-[10px] text-slate-500">ইনভেন্টরি রিসিভ</span>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-500 block">- খাওয়ানো হয়েছে</span>
              <span className="font-bold text-rose-700 text-sm mt-0.5 block">
                {stockAudit.consumed_in_period_bags ?? summary.feed_bags_consumed ?? 0} ব্যাগ
              </span>
              <span className="text-[10px] text-slate-500">পুকুরে প্রয়োগ</span>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-500 block">স্টক অডিট সমন্বয়</span>
              <span className="font-bold text-amber-800 text-sm mt-0.5 block">
                {stockAudit.adjusted_in_period_bags ?? 0} ব্যাগ
              </span>
              <span className="text-[10px] text-slate-500">শারীরিক খাতা তফাত</span>
            </div>

            <div className="bg-teal-50 p-2.5 rounded-lg border border-teal-300">
              <span className="text-[11px] text-teal-900 font-bold block">সমাপনী স্টক উদ্বৃত্ত</span>
              <span className="font-black text-teal-800 text-base mt-0.5 block">
                {stockAudit.closing_stock_bags ?? summary.remaining_feed_bags ?? 98} ব্যাগ
              </span>
              <span className="text-[10px] text-teal-800">
                গুদামে অবশিষ্ট ফিড
              </span>
            </div>
          </div>
        </div>

        {/* 3. SIX-MONTH TOTAL CYCLE MASTER SUMMARY (সাইকেল রেফারেন্স) */}
        {period === 'cycle' && (
          <div className="printable-card p-4 rounded-xl border border-teal-200 bg-teal-50/40 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-teal-100">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-teal-700" />
                ৬ মাসের কালচার সাইকেল মাস্টার প্ল্যান ও সার্বিক প্রক্ষেপণ
              </h4>
              <span className="text-[11px] font-bold text-teal-800">
                ১৮/০৯/২০২৬ হতে ১৮/০৩/২০২৭ (১৮১ দিন)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[11px]">মোট অনুমিত ফিড</span>
                <span className="font-bold text-slate-900 mt-0.5 block">
                  {cycle.estimated_total_feed_bags?.toLocaleString()} ব্যাগ
                </span>
                <span className="text-[10px] text-slate-500">~ ৳{cycle.estimated_total_feed_cost_bdt?.toLocaleString()}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[11px]">বর্তমান পর্যন্ত খাওয়ানো</span>
                <span className="font-bold text-teal-700 mt-0.5 block">
                  {cycle.actual_feed_bags_consumed_to_date} ব্যাগ
                </span>
                <span className="text-[10px] text-slate-500">
                  {((cycle.actual_feed_bags_consumed_to_date / (cycle.estimated_total_feed_bags || 1)) * 100).toFixed(1)}% সম্পন্ন
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[11px]">টার্গেট বিক্রয়মূল্য</span>
                <span className="font-bold text-emerald-800 mt-0.5 block">
                  ৳ {cycle.projected_gross_revenue_bdt?.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500">৭৫,৪৮০ কেজি মাছ</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[11px]">প্রত্যাশিত নিট লাভ</span>
                <span className="font-bold text-teal-800 mt-0.5 block">
                  + ৳ {cycle.projected_net_profit_bdt?.toLocaleString()}
                </span>
                <span className="text-[10px] text-emerald-700 font-bold">ROI: ~৪৫-৫০%</span>
              </div>
            </div>
          </div>
        )}

        {/* 4. ITEMIZED COSTING & FEED LEDGER TABLE (দৈনিক বিস্তারিত হিসাব খাতা) */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div>
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
                <Layers className="w-4 h-4 text-teal-700" />
                বিস্তারিত দৈনিক খাদ্য ও ব্যয় লগ বিবরণী (Itemized Costing Ledger)
              </h3>
              <p className="text-[11px] text-slate-500">
                নির্বাচিত সময়কালের প্রতিটি খাবার দেওয়া, ভাত প্রস্তুতি, ওষুধ, মজুরি ও অডিট সমন্বয়ের ক্রমানুসারে রেকর্ড
              </p>
            </div>
            <span className="text-xs text-slate-600 font-semibold">
              মোট রেকর্ড: <span className="font-bold text-slate-900">{filteredLedger.length} টি</span>
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-300 bg-white">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-800 font-bold text-[11px] border-b border-slate-300">
                <tr>
                  <th className="p-2.5 w-10 text-center">ক্রম</th>
                  <th className="p-2.5 whitespace-nowrap">তারিখ</th>
                  <th className="p-2.5">খাত / বিবরণ</th>
                  <th className="p-2.5">পুকুর নং</th>
                  <th className="p-2.5">পরিমাণ / ইউনিট</th>
                  <th className="p-2.5">বিস্তারিত বিবরণ ও ভাউচার</th>
                  <th className="p-2.5 text-right whitespace-nowrap">টাকার পরিমাণ (BDT)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {filteredLedger.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-500 italic">
                      এই নির্বাচিত সময়কালে কোনো খরচের বা খাবারের রেকর্ড পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  filteredLedger.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2.5 text-center text-slate-500 font-medium text-[11px]">{idx + 1}</td>
                      <td className="p-2.5 font-bold text-slate-900 whitespace-nowrap">{item.date}</td>
                      <td className="p-2.5 font-medium">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          item.badge_color === 'cyan' 
                            ? 'bg-cyan-50 text-cyan-900 border-cyan-300' 
                            : item.badge_color === 'amber'
                            ? 'bg-amber-50 text-amber-900 border-amber-300'
                            : item.badge_color === 'emerald'
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                            : 'bg-rose-50 text-rose-900 border-rose-300'
                        }`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="p-2.5 text-teal-800 font-semibold whitespace-nowrap">{item.pond}</td>
                      <td className="p-2.5 font-bold text-slate-900 whitespace-nowrap">{item.quantity}</td>
                      <td className="p-2.5 text-slate-700 text-[11px]">{item.description}</td>
                      <td className="p-2.5 text-right font-bold text-slate-900 whitespace-nowrap">
                        {item.amount_bdt > 0 ? `৳ ${item.amount_bdt.toLocaleString()}` : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-slate-100 border-t-2 border-slate-400 font-bold text-slate-900 text-xs">
                <tr>
                  <td colSpan={6} className="p-2.5 text-right">
                    নির্বাচিত সময়ের সর্বমোট ব্যয় (Total Cost for Period):
                  </td>
                  <td className="p-2.5 text-right text-emerald-800 font-black text-sm whitespace-nowrap">
                    ৳ {summary.total_period_cost_bdt?.toLocaleString() || 0}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* 5. OFFICIAL SIGNATURES & VERIFICATION (A4 PRINT AUDIT BLOCK) */}
        <div className="signature-block pt-8 border-t-2 border-slate-300 mt-6 grid grid-cols-3 gap-6 text-center text-xs">
          <div>
            <div className="h-12 border-b-2 border-dashed border-slate-400 mb-2" />
            <span className="font-bold text-slate-900 block">ফিল্ড ম্যানেজার / হিসাবরক্ষক</span>
            <span className="text-[11px] text-slate-500 block">শাহ আমানত ফিশারি অ্যান্ড এগ্রো</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">স্বাক্ষর ও সিল</span>
          </div>
          <div>
            <div className="h-12 border-b-2 border-dashed border-slate-400 mb-2" />
            <span className="font-bold text-slate-900 block">নিরীক্ষক / ইন্টারনাল অডিটর</span>
            <span className="text-[11px] text-slate-500 block">যাচাইকৃত ও শারীরিক খাতা নিরীক্ষিত</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">স্বাক্ষর ও সিল</span>
          </div>
          <div>
            <div className="h-12 border-b-2 border-dashed border-slate-400 mb-2" />
            <span className="font-bold text-teal-800 block">সুপারএডমিন / প্রকল্প পরিচালক</span>
            <span className="text-[11px] text-slate-500 block">চূড়ান্ত অনুমোদনকারী কপি</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">স্বাক্ষর ও সিল</span>
          </div>
        </div>

      </div>
    </div>
  );
}
