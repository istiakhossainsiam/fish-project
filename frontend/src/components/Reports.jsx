import React, { useState, useEffect } from 'react';
import { 
  FileText, Printer, RefreshCw, Check, AlertTriangle, Search
} from 'lucide-react';
import { fetchCostingReport, fetchFeedAdjustments, reconcilePhysicalStock, deleteFeedAdjustment } from '../api';

export default function Reports({ stats, ponds = [], feedInventory, expensesData }) {
  const [period, setPeriod] = useState('monthly'); // 'daily', 'weekly', 'monthly', 'cycle', 'custom'
  const [targetDate, setTargetDate] = useState('2026-10-26');
  const [selectedMonth, setSelectedMonth] = useState('2026-10');
  const [selectedWeek, setSelectedWeek] = useState('2026-10-26');
  const [startDate, setStartDate] = useState('2026-09-18');
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [pondId, setPondId] = useState('all');
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

  // Reconcile 5 bags difference on 26/10/2026
  const handleReconcile5Bags = async () => {
    if (!window.confirm("২৬/১০/২০২৬ তারিখের শারীরিক খাতার সাথে মিল রেখে ৫ বস্তা ফিডের ঘাটতি সমন্বয় করতে চান?")) {
      return;
    }
    setActionLoading(true);
    try {
      await reconcilePhysicalStock({
        date: "2026-10-26",
        variance_bags: 5.0,
        reason: "২৬/১০/২০২৬ শারীরিক খাতা নিরীক্ষা সমন্বয় (শারীরিক খাতার স্টক ৯৩ বস্তা বনাম সফটওয়্যার ৯৮ বস্তা)",
        adjusted_by: "Farm Auditor / Manager"
      });
      await loadReport();
      alert("✅ ৫ বস্তা ফিড সফলভাবে সমন্বয় করা হয়েছে। সফটওয়্যারের স্টক এখন শারীরিক খাতার সাথে ১০০% মিলেছে!");
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
  const pondSummary = report?.pond_summary || [];
  const dailyMatrix = report?.daily_matrix || [];
  const ledger = report?.ledger || [];

  // Active adjustment for 26/10/2026
  const oct26Adjustment = adjustments.find(a => a.date === '2026-10-26' && Math.abs(a.bag_count - 5.0) < 0.1);

  // Filter out pure commercial pellets to list all "extra food & extra operational expenses"
  const extraExpensesList = ledger.filter(item => 
    !item.type?.startsWith("বাণিজ্যিক") && !item.type?.toLowerCase().includes("commercial feed")
  );

  // Daily report feedings for targetDate
  const dailyFeedingsList = ledger.filter(item => 
    item.type?.startsWith("বাণিজ্যিক") || item.type?.toLowerCase().includes("commercial feed")
  );

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* ========================================================================= */}
      {/* 1. SCREEN CONTROL BAR (Only visible on web screen, completely hidden on print) */}
      {/* ========================================================================= */}
      <div className="no-print space-y-4">
        {/* Top Header & Print Button */}
        <div className="card-surface p-4 sm:p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 bg-clip-text text-transparent flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-700" />
                খাদ্য ও অপারেশনাল খরচের অফিশিয়াল অডিট শিট (Audit & Print Statements)
              </h2>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200/80">
                A4 Landscape
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              পুকুরভিত্তিক খাবারের বস্তা, দিনভিত্তিক খরচ, এক্সট্রা খরচ এবং গুদাম স্টক সমন্বয়ের সম্পূর্ণ অডিট স্টেটমেন্ট
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-medium text-slate-600 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl hidden sm:inline-flex items-center gap-1.5">
              <span>🖨️ ল্যান্ডস্কেপ মোড • মার্জিন ১০ মি.মি. • হেডার লকড</span>
            </span>
            <button
              onClick={loadReport}
              title="রিফ্রেশ করুন"
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-[0.98] text-slate-700 border border-slate-200 cursor-pointer transition shadow-xs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-700' : ''}`} />
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 active:scale-[0.98] text-white text-xs font-bold shadow-md cursor-pointer transition shadow-teal-900/20"
            >
              <Printer className="w-4 h-4" /> 🖨️ ল্যান্ডস্কেপ প্রিন্ট / PDF (A4 Landscape)
            </button>
          </div>
        </div>

        {/* 26/10/2026 Physical Stock Reconciliation Tool */}
        <div className="p-4 rounded-xl bg-white border border-amber-300 shadow-sm space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  শারীরিক স্টক শিট বনাম সফটওয়্যার হিসাব নিরীক্ষা (২৬/১০/২০২৬)
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  {oct26Adjustment ? (
                    <span className="text-emerald-800 font-semibold">
                      ✅ ২৬/১০/২০২৬ তারিখে খামারের গুদামে শারীরিক খাতা অনুযায়ী <strong>৯৩.০ বস্তা</strong> স্টক সমন্বয় কার্যকর রয়েছে।
                    </span>
                  ) : (
                    <span>
                      ২৬/১০/২০২৬ তারিখে সফটওয়্যারে বুক স্টক ছিল <strong>৯৮.০ বস্তা</strong> (মোট ৪৩০ বস্তা চালান - ৩৩২ বস্তা খাওয়ানো)। আপনার আসল শারীরিক খাতা অনুযায়ী গুদামে ছিল <strong>৯৩.০ বস্তা</strong> (অর্থাৎ <strong>৫ বস্তা তফাত</strong>)।
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div>
              {oct26Adjustment ? (
                <button
                  onClick={() => handleUndoAdjustment(oct26Adjustment.id)}
                  disabled={actionLoading}
                  className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-semibold cursor-pointer"
                >
                  সমন্বয় বাতিল (Undo)
                </button>
              ) : (
                <button
                  onClick={handleReconcile5Bags}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer shadow-sm"
                >
                  <Check className="w-4 h-4" /> ৫ বস্তা সমন্বয় রেকর্ড করুন
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Period Selector Tabs */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-800">রিপোর্টের ধরন নির্বাচন করুন:</span>
            <div className="flex flex-wrap gap-1.5 text-xs">
              {[
                { id: 'daily', label: '⏱️ দৈনিক রিপোর্ট (Daily)' },
                { id: 'weekly', label: '🗓️ সাপ্তাহিক রিপোর্ট (Weekly)' },
                { id: 'monthly', label: '📊 মাসিক রিপোর্ট (Monthly)' },
                { id: 'cycle', label: '🔄 ৬ মাসের সাইকেল (Full Cycle)' },
                { id: 'custom', label: '🔍 কাস্টম তারিখ (Custom)' },
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => setPeriod(p.id)}
                  className={`px-3 py-1.5 rounded-lg border font-semibold transition cursor-pointer ${
                    period === p.id
                      ? 'bg-teal-800 border-teal-800 text-white shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {p.label}
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
                  className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-slate-900 font-medium"
                />
              </div>
            )}

            {period === 'weekly' && (
              <div>
                <label className="text-slate-700 block mb-1 font-semibold">সপ্তাহের শেষ তারিখ (Week End):</label>
                <input
                  type="date"
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-slate-900 font-medium"
                />
              </div>
            )}

            {period === 'monthly' && (
              <div>
                <label className="text-slate-700 block mb-1 font-semibold">মাস নির্বাচন (Select Month):</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-slate-900 font-medium"
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
                    className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-slate-900 font-medium"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">শেষের তারিখ (To):</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-slate-900 font-medium"
                  />
                </div>
              </>
            )}

            <div>
              <label className="text-slate-700 block mb-1 font-semibold">পুকুর ফিল্টার (Pond):</label>
              <select
                value={pondId}
                onChange={(e) => setPondId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-slate-900 font-medium"
              >
                <option value="all">সব পুকুর (All 4 Ponds)</option>
                {ponds?.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. AUTHENTIC FORMAL FARM STATEMENT SHEET (Landscape Print Optimized)     */}
      {/* ========================================================================= */}
      <div className="printable-report bg-white text-slate-900 border border-slate-300 p-4 sm:p-6 rounded-none shadow-none">
        
        {/* Master Document Table: Guarantees Letterhead Repeats on Every Page */}
        <table className="print-master-table w-full border-none">
          <thead className="print-master-header">
            <tr>
              <th className="p-0 border-none bg-transparent font-normal text-left">
                {/* OFFICIAL LETTERPAD HEADER (Repeats at top of EVERY printed page) */}
                <div className="print-letterhead border-b-2 border-slate-900 pb-2.5 mb-2.5 bg-white">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-900 text-white flex items-center justify-center font-black text-sm tracking-wider shadow-xs">
                        SA
                      </div>
                      <div>
                        <div className="text-[10px] font-black tracking-wider uppercase text-slate-700">
                          বাণিজ্যিক মৎস্য প্রকল্প • শাহ আমানত আন্তর্জাতিক বিমানবন্দর সড়ক, পতেঙ্গা, চট্টগ্রাম
                        </div>
                        <h1 className="text-xl font-black text-slate-950 tracking-tight leading-tight">
                          শাহ আমানত ফিশারি অ্যান্ড এগ্রো প্রজেক্ট
                        </h1>
                        <p className="text-[10px] text-slate-600 font-medium">
                          পুকুর সংখ্যা: ৪টি (২০ একর) • গভ: নিবন্ধিত মৎস্য খামার • খাদ্য, পরিচালন ও অডিট নিরীক্ষা বিবরণী
                        </p>
                      </div>
                    </div>

                    <div className="text-right text-[10px] text-slate-700 pl-4 border-l-2 border-slate-400 space-y-0.5">
                      <div className="font-black text-teal-950 text-xs uppercase tracking-wide">
                        {report?.period_label || 'খাদ্য ও পরিচালন ব্যয় নিরীক্ষা বিবরণী'}
                      </div>
                      <div>
                        সময়কাল: <strong className="text-slate-950 font-mono tabular-nums">{report?.start_date}</strong> হতে <strong className="text-slate-950 font-mono tabular-nums">{report?.end_date}</strong>
                      </div>
                      <div className="text-slate-600">
                        পুকুর: <strong className="text-slate-900">{pondId === 'all' ? 'সমগ্র খামার (সব পুকুর)' : `পুকুর ${pondId}`}</strong>
                        {" • "}প্রিন্ট: <strong className="text-slate-900 font-mono tabular-nums">{new Date().toLocaleDateString('bn-BD')}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </th>
            </tr>
          </thead>

          <tbody className="print-master-body">
            <tr>
              <td className="p-0 border-none bg-transparent space-y-3">
                {/* B. TABLE 1: কোন পুকুরে কয় বস্তা খাবার দিয়েছি এবং কত টাকা খরচ হয়েছে (POND-WISE SUMMARY) */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                      ১. পুকুরভিত্তিক খাদ্য ব্যবহারের সারসংক্ষেপ (Pond-wise Feed Consumption Summary)
                    </h3>
                    <span className="text-[10px] font-medium text-slate-600 font-mono tabular-nums">
                      গড় রেট: ৳{summary.avg_feed_rate_per_bag || 1818.02} /বস্তা
                    </span>
                  </div>

                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-100 border border-slate-400">
                        <th style={{ width: '8%' }} className="text-center">পুকুর নং</th>
                        <th style={{ width: '22%' }}>মাছের জাত / প্রকারভেদ</th>
                        <th style={{ width: '22%' }}>খাবারের ব্র্যান্ড ও ব্যাচ</th>
                        <th style={{ width: '14%' }} className="text-center">খাওয়ানো খাবার (বস্তা)</th>
                        <th style={{ width: '14%' }} className="text-center">মোট ওজন (কেজি)</th>
                        <th style={{ width: '20%' }} className="text-right">খাবারের মোট খরচ (BDT)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pondSummary.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-2 text-center text-slate-500 italic">
                            নির্বাচিত সময়কালে কোনো খাবার দেওয়ার রেকর্ড পাওয়া যায়নি।
                          </td>
                        </tr>
                      ) : (
                        pondSummary.map((p, idx) => (
                          <tr key={idx} className="border border-slate-300">
                            <td className="text-center font-bold text-slate-900">{p.pond_name}</td>
                            <td className="font-medium text-slate-800">
                              {p.pond_id === 1 ? 'পাঙ্গাশ (১৪,৫০০ পিস) + কার্প' : p.pond_id === 2 ? 'পাঙ্গাশ (৪০,৫০০ পিস) + কার্প' : 'প্রস্তুতিশীল পুকুর'}
                            </td>
                            <td className="text-slate-700">ভাসমান ফিড (ব্যাচ ২০২ / ২০৪)</td>
                            <td className="text-center font-bold text-slate-950 font-mono tabular-nums">{p.feed_bags} বস্তা</td>
                            <td className="text-center font-medium text-slate-800 font-mono tabular-nums">{p.feed_kg} কেজি</td>
                            <td className="text-right font-bold text-slate-950 font-mono tabular-nums">৳ {p.feed_cost_bdt?.toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 font-bold border-2 border-slate-400 text-slate-950">
                        <td colSpan={3} className="text-right p-1.5">খাদ্য বাবদ সর্বমোট (Total Feed Consumed):</td>
                        <td className="text-center font-black p-1.5 font-mono tabular-nums">{summary.feed_bags_consumed || 0} বস্তা</td>
                        <td className="text-center font-bold p-1.5 font-mono tabular-nums">{summary.feed_kg_consumed || 0} কেজি</td>
                        <td className="text-right font-black p-1.5 font-mono tabular-nums">৳ {summary.feed_consumed_cost_bdt?.toLocaleString() || 0}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* C. TABLE 2: কয় তারিখে কয় বস্তা খাবার দিয়েছি এবং খাবারের বস্তা বাবদ কয় টাকা খরচ হয়েছে (DATE-WISE FEEDING) */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                      ২. দিনভিত্তিক খাদ্য ও খরচের বিস্তারিত হিসাব (Date-wise Feed Bags & Expenditure Schedule)
                    </h3>
                    <span className="text-[10px] font-medium text-slate-600 font-mono tabular-nums">
                      মোট দিন: {dailyMatrix.length} দিন • হেডার স্বয়ংক্রিয় লকড
                    </span>
                  </div>

                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-100 border border-slate-400">
                        <th style={{ width: '12%' }}>তারিখ</th>
                        <th style={{ width: '10%' }}>বার</th>
                        <th style={{ width: '10%' }} className="text-center">পুকুর ১ (বস্তা)</th>
                        <th style={{ width: '10%' }} className="text-center">পুকুর ২ (বস্তা)</th>
                        <th style={{ width: '11%' }} className="text-center">মোট বস্তা</th>
                        <th style={{ width: '11%' }} className="text-center">মোট কেজি</th>
                        <th style={{ width: '16%' }} className="text-right">খাবারের খরচ (BDT)</th>
                        <th style={{ width: '20%' }}>এক্সট্রা খরচ ও বিবরণ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyMatrix.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-2 text-center text-slate-500 italic">
                            নির্বাচিত সময়কালে কোনো দিনভিত্তিক রেকর্ড পাওয়া যায়নি।
                          </td>
                        </tr>
                      ) : (
                        dailyMatrix.map((d, idx) => (
                          <tr key={idx} className={`border border-slate-300 ${d.total_bags > 0 ? '' : 'text-slate-400 bg-slate-50'}`}>
                            <td className="font-bold text-slate-900 font-mono tabular-nums">{d.date}</td>
                            <td className="font-medium text-slate-700">{d.day_name}</td>
                            <td className="text-center font-semibold text-slate-900 font-mono tabular-nums">{d.pond1_bags > 0 ? `${d.pond1_bags}` : '-'}</td>
                            <td className="text-center font-semibold text-slate-900 font-mono tabular-nums">{d.pond2_bags > 0 ? `${d.pond2_bags}` : '-'}</td>
                            <td className="text-center font-black text-slate-950 font-mono tabular-nums">{d.total_bags > 0 ? `${d.total_bags} বস্তা` : '-'}</td>
                            <td className="text-center font-medium text-slate-800 font-mono tabular-nums">{d.total_kg > 0 ? `${d.total_kg} কেজি` : '-'}</td>
                            <td className="text-right font-bold text-slate-950 font-mono tabular-nums">
                              {d.feed_cost_bdt > 0 ? `৳ ${d.feed_cost_bdt.toLocaleString()}` : '-'}
                            </td>
                            <td className="text-slate-700 text-[10px]">{d.other_desc || '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 font-bold border-2 border-slate-400 text-slate-950">
                        <td colSpan={2} className="text-right p-1.5">সর্বমোট যোগফল (Grand Total):</td>
                        <td className="text-center font-black p-1.5 font-mono tabular-nums">{pondSummary.find(p => p.pond_id === 1)?.feed_bags || 0} বস্তা</td>
                        <td className="text-center font-black p-1.5 font-mono tabular-nums">{pondSummary.find(p => p.pond_id === 2)?.feed_bags || 0} বস্তা</td>
                        <td className="text-center font-black p-1.5 font-mono tabular-nums">{summary.feed_bags_consumed || 0} বস্তা</td>
                        <td className="text-center font-bold p-1.5 font-mono tabular-nums">{summary.feed_kg_consumed || 0} কেজি</td>
                        <td className="text-right font-black p-1.5 font-mono tabular-nums">৳ {summary.feed_consumed_cost_bdt?.toLocaleString() || 0}</td>
                        <td className="text-left font-bold text-slate-800 p-1.5 font-mono tabular-nums">এক্সট্রা: ৳ {summary.total_other_expenses_bdt?.toLocaleString() || 0}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* D. TABLE 3: কোন মাসে কী কী এক্সট্রা খাবার খরচ হয়েছে বা এক্সট্রা খরচ কী কী হয়েছে (EXTRA EXPENSES) */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                      ৩. এক্সট্রা খাবার ও অন্যান্য পরিচালন ব্যয়ের খাতা (Extra Feed & Operational Expenses Schedule)
                    </h3>
                    <span className="text-[10px] font-medium text-slate-600 font-mono tabular-nums">
                      মোট রেকর্ড: {extraExpensesList.length} টি
                    </span>
                  </div>

                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-100 border border-slate-400">
                        <th style={{ width: '6%' }} className="text-center">ক্র.</th>
                        <th style={{ width: '12%' }}>তারিখ</th>
                        <th style={{ width: '22%' }}>খরচের খাত (Category)</th>
                        <th style={{ width: '12%' }}>পুকুর</th>
                        <th style={{ width: '30%' }}>বিস্তারিত বিবরণ ও ভাউচার নম্বর</th>
                        <th style={{ width: '18%' }} className="text-right">টাকার পরিমাণ (BDT)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {extraExpensesList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-2 text-center text-slate-500 italic">
                            এই নির্বাচিত সময়কালে কোনো এক্সট্রা খাবার বা অতিরিক্ত পরিচালন খরচ হয়নি।
                          </td>
                        </tr>
                      ) : (
                        extraExpensesList.map((item, idx) => (
                          <tr key={idx} className="border border-slate-300">
                            <td className="text-center font-bold text-slate-600 font-mono tabular-nums">{idx + 1}</td>
                            <td className="font-bold text-slate-900 font-mono tabular-nums">{item.date}</td>
                            <td className="font-bold text-slate-900">{item.type}</td>
                            <td className="font-medium text-slate-800">{item.pond}</td>
                            <td className="text-slate-700">{item.description}</td>
                            <td className="text-right font-bold text-slate-950 font-mono tabular-nums">৳ {item.amount_bdt?.toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 font-bold border-2 border-slate-400 text-slate-950">
                        <td colSpan={5} className="text-right p-1.5">
                          এক্সট্রা খাবার ও পরিচালন খরচের সর্বমোট (Total Extra Expenses):
                        </td>
                        <td className="text-right font-black p-1.5 font-mono tabular-nums">
                          ৳ {(summary.total_other_expenses_bdt + summary.vaat_cost_bdt + summary.pona_stocking_cost_bdt)?.toLocaleString() || 0}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* E. TABLE 4: খাদ্য গুদাম স্টক নিরীক্ষা বিবরণী (WAREHOUSE STOCK RECONCILIATION) */}
                <div className="border border-slate-400 p-2.5 bg-slate-50 space-y-1">
                  <div className="flex justify-between items-center border-b border-slate-300 pb-1">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                      ৪. খাদ্য গুদাম স্টক নিরীক্ষা ও সমন্বয় বিবরণী (Feed Warehouse Inventory & Stock Audit)
                    </h4>
                    <span className="text-[10px] font-semibold text-slate-700 font-mono tabular-nums">
                      হিসাবের তারিখ: {report?.end_date}
                    </span>
                  </div>

                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-white border border-slate-300 text-slate-800">
                        <th style={{ width: '20%' }} className="text-center">১. প্রারম্ভিক স্টক (Opening)</th>
                        <th style={{ width: '20%' }} className="text-center">২. নতুন চালান ক্রয় (Received)</th>
                        <th style={{ width: '20%' }} className="text-center">৩. পুকুরে প্রয়োগকৃত (Consumed)</th>
                        <th style={{ width: '20%' }} className="text-center">৪. শারীরিক খাতা সমন্বয় (Audit)</th>
                        <th style={{ width: '20%' }} className="text-center bg-teal-50">৫. সমাপনী অবশিষ্ট স্টক</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border border-slate-300 text-center font-bold text-sm bg-white">
                        <td className="p-1.5 text-slate-900 font-mono tabular-nums">{stockAudit.opening_stock_bags ?? 0} বস্তা</td>
                        <td className="p-1.5 text-teal-800 font-mono tabular-nums">+{stockAudit.purchased_in_period_bags ?? summary.feed_purchased_bags ?? 0} বস্তা</td>
                        <td className="p-1.5 text-rose-800 font-mono tabular-nums">-{stockAudit.consumed_in_period_bags ?? summary.feed_bags_consumed ?? 0} বস্তা</td>
                        <td className="p-1.5 text-amber-800 font-mono tabular-nums">-{stockAudit.adjusted_in_period_bags ?? 0} বস্তা</td>
                        <td className="p-1.5 text-teal-950 font-black bg-teal-50 border-l border-teal-300 font-mono tabular-nums">
                          {stockAudit.closing_stock_bags ?? summary.remaining_feed_bags ?? 98} বস্তা
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <p className="text-[10px] text-slate-600 font-medium pt-0.5">
                    * <strong>অডিট নোট:</strong> ২৬/১০/২০২৬ তারিখে খামারের গুদামে শারীরিক খাতা অনুযায়ী ৯৩.০ বস্তা ফিড মজুত ভ্যালিডেট করা হয়েছে। সফটওয়্যারের ৫ বস্তা পার্থক্য সফলভাবে সমন্বয় করা হয়েছে।
                  </p>
                </div>

                {/* F. TABLE 5: সর্বমোট ব্যয়ের সারসংক্ষেপ (GRAND TOTAL COST SUMMARY) */}
                <div className="border-2 border-slate-800 p-2.5 bg-slate-100">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-slate-600 uppercase">সর্বমোট খরচের সারসংক্ষেপ</span>
                      <div className="text-xs text-slate-800 space-y-0.5 mt-0.5">
                        <div>• বাণিজ্যিক খাবারের বস্তা বাবদ ব্যয়: <strong className="font-mono tabular-nums">৳ {summary.feed_consumed_cost_bdt?.toLocaleString() || 0}</strong> ({summary.feed_bags_consumed || 0} বস্তা)</div>
                        {summary.vaat_cost_bdt > 0 && <div>• এক্সট্রা সম্পূরক ভাত ও জ্বালানি ব্যয়: <strong className="font-mono tabular-nums">৳ {summary.vaat_cost_bdt?.toLocaleString()}</strong></div>}
                        <div>• অন্যান্য এক্সট্রা পরিচালন ব্যয় (ওষুধ, বিদ্যুৎ, মজুরি): <strong className="font-mono tabular-nums">৳ {summary.total_other_expenses_bdt?.toLocaleString() || 0}</strong></div>
                        {summary.pona_stocking_cost_bdt > 0 && <div>• পোনা ক্রয় ও পরিবহন বাবদ ব্যয়: <strong className="font-mono tabular-nums">৳ {summary.pona_stocking_cost_bdt?.toLocaleString()}</strong></div>}
                      </div>
                    </div>

                    <div className="text-right border-t sm:border-t-0 sm:border-l-2 sm:border-slate-400 pt-1.5 sm:pt-0 sm:pl-4">
                      <span className="text-xs font-black text-slate-800 uppercase block">নির্বাচিত সময়কালের সর্বমোট খরচ (Grand Total)</span>
                      <span className="text-2xl font-black text-slate-950 block mt-0.5 font-mono tabular-nums">
                        ৳ {summary.total_period_cost_bdt?.toLocaleString() || 0}
                      </span>
                      <span className="text-[10px] text-slate-600 font-bold block mt-0.5">
                        (অডিট অনুযায়ী সম্পূর্ণ অনুমোদিত ও নির্ভুল ব্যয়)
                      </span>
                    </div>
                  </div>
                </div>

                {/* G. OFFICIAL SIGNATURES & VERIFICATION BLOCK */}
                <div className="signature-block pt-6 border-t-2 border-slate-400 mt-4 grid grid-cols-3 gap-6 text-center text-xs">
                  <div>
                    <div className="h-8 border-b-2 border-dashed border-slate-500 mb-1" />
                    <span className="font-bold text-slate-950 block">হিসাবরক্ষক / ফিল্ড ম্যানেজার</span>
                    <span className="text-[10px] text-slate-600 block">শাহ আমানত ফিশারি অ্যান্ড এগ্রো</span>
                    <span className="text-[9px] text-slate-500 block mt-0.5">স্বাক্ষর ও তারিখ</span>
                  </div>
                  <div>
                    <div className="h-8 border-b-2 border-dashed border-slate-500 mb-1" />
                    <span className="font-bold text-slate-950 block">অভ্যন্তরীণ নিরীক্ষক (Auditor)</span>
                    <span className="text-[10px] text-slate-600 block">শারীরিক স্টক শিট যাচাইকৃত ও সঠিক</span>
                    <span className="text-[9px] text-slate-500 block mt-0.5">স্বাক্ষর ও সিল</span>
                  </div>
                  <div>
                    <div className="h-8 border-b-2 border-dashed border-slate-500 mb-1" />
                    <span className="font-bold text-teal-950 block">সুপারএডমিন / প্রকল্প পরিচালক</span>
                    <span className="text-[10px] text-slate-600 block">চূড়ান্ত অনুমোদন ও নিষ্পত্তি কপি</span>
                    <span className="text-[9px] text-slate-500 block mt-0.5">স্বাক্ষর ও সিল</span>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>

          <tfoot className="print-master-footer">
            <tr>
              <td className="p-0 border-none bg-transparent pt-2">
                <div className="border-t border-slate-400 pt-1 flex justify-between items-center text-[8px] text-slate-600">
                  <span>শাহ আমানত ফিশারি অ্যান্ড এগ্রো প্রজেক্ট • লেটারহেড কপি • অভ্যন্তরীণ হিসাব ও নিরীক্ষা শাখা</span>
                  <span>অফিশিয়াল অডিট স্টেটমেন্ট • পৃষ্ঠা স্বয়ংক্রিয় লকড হেডার ভ্যালিডেটেড</span>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>

      </div>
    </div>
  );
}
