import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, DollarSign, TrendingUp, Sliders, CheckCircle, 
  Clock, Shield, FileText, Printer, ArrowUpRight, Check, Trash2, Edit3, Sparkles 
} from 'lucide-react';
import { 
  fetchInvestors, createInvestor, deleteInvestor, 
  fetchInvestments, createInvestment, recordInvestmentPayout, 
  deleteInvestment, simulateInvestorReturns, fetchCycles 
} from '../api';

export default function InvestorManagement({ currentUser, onRefreshParent }) {
  const [investors, setInvestors] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Sub-tab
  const [activeSubTab, setActiveSubTab] = useState('simulator'); // 'simulator', 'investors', 'investments'

  // Interactive Simulator State
  const [simParams, setSimParams] = useState({
    investmentAmount: 500000.0,
    sharePct: 15.0,
    pangashPrice: 155.0,
    pondId: 2
  });
  const [simResult, setSimResult] = useState(null);

  // Modals
  const [showInvestorModal, setShowInvestorModal] = useState(false);
  const [showInvestmentModal, setShowInvestmentModal] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState(null);

  // New Investor Form
  const [newInvestor, setNewInvestor] = useState({
    name: '',
    phone: '',
    email: '',
    nid: '',
    address: '',
    notes: 'খামারের পার্টনার ইনভেস্টর'
  });

  // New Investment Form
  const [newInvestment, setNewInvestment] = useState({
    investor_id: '',
    cycle_id: '',
    pond_id: 1,
    amount_bdt: 300000.0,
    investment_date: new Date().toISOString().slice(0, 10),
    share_percentage: 10.0,
    profit_share_type: 'profit_share',
    agreement_terms: '৬ মাসের সাইকেল বিক্রয়োত্তর মোট নিট মুনাফার লভ্যাংশ প্রদান।'
  });

  // Payout Form
  const [payoutForm, setPayoutForm] = useState({
    paid_profit_bdt: 0.0,
    returned_capital_bdt: 0.0,
    payout_date: new Date().toISOString().slice(0, 10),
    voucher_no: 'PAY-INV-01'
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [invs, invstmts, cycs] = await Promise.all([
        fetchInvestors(),
        fetchInvestments(),
        fetchCycles()
      ]);
      setInvestors(invs);
      setInvestments(invstmts);
      setCycles(cycs);
      if (invs.length > 0 && !newInvestment.investor_id) {
        setNewInvestment(prev => ({ ...prev, investor_id: invs[0].id }));
      }
    } catch (err) {
      console.error("Failed to load investor data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update simulator when parameters change
  useEffect(() => {
    simulateInvestorReturns(simParams)
      .then(res => setSimResult(res))
      .catch(err => console.error("Simulator error:", err));
  }, [simParams]);

  const isAdmin = currentUser?.role === 'superadmin' || currentUser?.role === 'manager';

  const handleCreateInvestorSubmit = async (e) => {
    e.preventDefault();
    try {
      await createInvestor(newInvestor);
      setShowInvestorModal(false);
      setNewInvestor({ name: '', phone: '', email: '', nid: '', address: '', notes: '' });
      loadData();
      if (onRefreshParent) onRefreshParent();
    } catch (err) {
      alert("Error adding investor: " + err.message);
    }
  };

  const handleCreateInvestmentSubmit = async (e) => {
    e.preventDefault();
    try {
      await createInvestment(newInvestment);
      setShowInvestmentModal(false);
      loadData();
      if (onRefreshParent) onRefreshParent();
    } catch (err) {
      alert("Error adding investment: " + err.message);
    }
  };

  const handlePayoutSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInvestment) return;
    try {
      await recordInvestmentPayout(selectedInvestment.id, payoutForm);
      setShowPayoutModal(false);
      setSelectedInvestment(null);
      loadData();
      if (onRefreshParent) onRefreshParent();
    } catch (err) {
      alert("Error recording payout: " + err.message);
    }
  };

  const handleDeleteInvestment = async (id) => {
    if (window.confirm("আপনি কি নিশ্চিতভাবে এই বিনিয়োগ চুক্তিটি মুছে ফেলতে চান?")) {
      try {
        await deleteInvestment(id);
        loadData();
        if (onRefreshParent) onRefreshParent();
      } catch (err) {
        alert("Delete failed: " + err.message);
      }
    }
  };

  const totalFundsInvested = investments.reduce((sum, i) => sum + i.amount_bdt, 0);
  const totalPaidProfits = investments.reduce((sum, i) => sum + (i.paid_profit_bdt || 0), 0);
  const totalProjectedProfit = investments.reduce((sum, i) => sum + (i.estimated_profit_bdt || 0), 0);

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-400" />
            ইনভেস্টর ব্যবস্থাপনা ও মুনাফা বণ্টন ক্যালকুলেটর (Investor & Profit Share)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            ইনভেস্টরদের বিনিয়োগ অনুযায়ী প্রাপ্য লভ্যাংশের অংশ, ৬ মাসের সাইকেল মুনাফা হিসাব ও লভ্যাংশ প্রদান
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <button
                onClick={() => setShowInvestmentModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-teal-500/20 transition"
              >
                <Plus className="w-4 h-4" /> নতুন বিনিয়োগ চুক্তি (Add Investment)
              </button>
              <button
                onClick={() => setShowInvestorModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 text-xs font-medium transition"
              >
                <Plus className="w-4 h-4" /> নতুন ইনভেস্টর
              </button>
            </>
          )}
          <button
            onClick={() => window.print()}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="প্রিন্ট করুন"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* OVERVIEW STATS BANNER */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="p-4 rounded-2xl bg-slate-850 border border-slate-700/80">
          <span className="text-slate-400 block font-medium">মোট পার্টনার ইনভেস্টর</span>
          <div className="text-xl font-bold text-white mt-1">
            {investors.length} জন
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            সক্রিয় বিনিয়োগ চুক্তি: {investments.length} টি
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-850 border border-slate-700/80">
          <span className="text-slate-400 block font-medium">মোট সংগৃহীত মূলধন</span>
          <div className="text-xl font-bold text-cyan-300 mt-1">
            ৳ {totalFundsInvested.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            ৬ মাসের সাইকেলে নিয়োজিত তহবিল
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-850 border border-slate-700/80">
          <span className="text-slate-400 block font-medium">ইনভেস্টরদের সম্ভাব্য লভ্যাংশ</span>
          <div className="text-xl font-bold text-emerald-400 mt-1">
            ৳ {totalProjectedProfit.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            প্রত্যাশিত নিট মুনাফার বণ্টনযোগ্য অংশ
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-950/40 to-slate-850 border border-teal-500/40">
          <span className="text-teal-300 block font-medium">পরিশোধিত লভ্যাংশ (Paid Out)</span>
          <div className="text-xl font-black text-teal-300 mt-1">
            ৳ {totalPaidProfits.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            অবশিষ্ট বণ্টনযোগ্য: ৳ {(totalProjectedProfit - totalPaidProfits).toLocaleString()}
          </span>
        </div>
      </div>

      {/* SUB-TAB NAVIGATOR */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs no-print">
        <button
          onClick={() => setActiveSubTab('simulator')}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
            activeSubTab === 'simulator' 
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" /> লাইভ ইনভেস্টর মুনাফা ক্যালকুলেটর (Live Simulator)
        </button>
        <button
          onClick={() => setActiveSubTab('investments')}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
            activeSubTab === 'investments' 
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <DollarSign className="w-4 h-4" /> বিনিয়োগ ও লভ্যাংশ চুক্তি ({investments.length})
        </button>
        <button
          onClick={() => setActiveSubTab('investors')}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
            activeSubTab === 'investors' 
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" /> ইনভেস্টরদের প্রোফাইল ও ডিরেক্টরি ({investors.length})
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. INTERACTIVE INVESTOR PROFIT SIMULATOR */}
      {/* ========================================================================= */}
      {activeSubTab === 'simulator' && (
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-850 to-teal-950/40 border border-teal-500/40 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-700/80">
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 rounded-2xl bg-teal-500/20 text-teal-400">
                <Sliders className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-white text-base">
                  ইনভেস্টর মুনাফা ও রিটার্ন সিমুলেটর (Investor Profit Calculator)
                </h3>
                <p className="text-xs text-slate-400">
                  ইনভেস্টমেন্টের পরিমাণ ও চুক্তি অনুযায়ী শতকরা হার পরিবর্তন করে নিমিষেই লাভ, মোট প্রাপ্তি ও ROI হিসাব করুন
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold">
              ৬ মাসের কালচার সাইকেল মডেল
            </span>
          </div>

          {/* Interactive Controls Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* 1. Investment Amount */}
            <div className="bg-slate-900/70 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-300 font-medium">বিনিয়োগের পরিমাণ:</span>
                <span className="font-bold text-white text-sm">৳ {simParams.investmentAmount.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="50000"
                max="3000000"
                step="50000"
                value={simParams.investmentAmount}
                onChange={(e) => setSimParams({ ...simParams, investmentAmount: parseFloat(e.target.value) })}
                className="w-full accent-teal-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>৫০ হাজার</span>
                <span>১৫ লাখ</span>
                <span>৩০ লাখ</span>
              </div>
            </div>

            {/* 2. Profit Share % */}
            <div className="bg-slate-900/70 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-300 font-medium">প্রফিট শেয়ার অনুপাত:</span>
                <span className="font-bold text-teal-300 text-sm">{simParams.sharePct}% শেয়ার</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                step="1"
                value={simParams.sharePct}
                onChange={(e) => setSimParams({ ...simParams, sharePct: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>৫%</span>
                <span>১৫% (আদর্শ)</span>
                <span>৫০%</span>
              </div>
            </div>

            {/* 3. Fish Selling Price */}
            <div className="bg-slate-900/70 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-300 font-medium">মাছ বিক্রির বাজার দর:</span>
                <span className="font-bold text-emerald-400 text-sm">৳ {simParams.pangashPrice} /কেজি</span>
              </div>
              <input
                type="range"
                min="130"
                max="190"
                step="1"
                value={simParams.pangashPrice}
                onChange={(e) => setSimParams({ ...simParams, pangashPrice: parseFloat(e.target.value) })}
                className="w-full accent-emerald-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>৳ ১৩০/কেজি</span>
                <span>৳ ১৫৫/কেজি</span>
                <span>৳ ১৯০/কেজি</span>
              </div>
            </div>

            {/* 4. Target Pond Selection */}
            <div className="bg-slate-900/70 p-4 rounded-2xl border border-slate-800 space-y-1.5">
              <label className="text-slate-300 font-medium block">বিনিয়োগকৃত সাইকেল / পুকুর:</label>
              <select
                value={simParams.pondId}
                onChange={(e) => setSimParams({ ...simParams, pondId: parseInt(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
              >
                <option value={2}>পুকুর ২ (উচ্চঘনত্ব পাঙ্গাশ ~৫৬,০০০ কেজি)</option>
                <option value={1}>পুকুর ১ (পাঙ্গাশ ও কার্প ~১৯,০০০ কেজি)</option>
                <option value={0}>সমগ্র খামার (৪টি পুকুর ~৭৫,০০০ কেজি)</option>
              </select>
              <span className="text-[10px] text-slate-400 block mt-1">
                ৬ মাসের সাইকেল উৎপাদন হিসাব
              </span>
            </div>
          </div>

          {/* SIMULATED RESULTS CARDS */}
          {simResult && (
            <div className="space-y-4 pt-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                ইনভেস্টরের প্রত্যাশিত আর্থিক লাভ ও রিটার্ন বিশ্লেষণ:
              </h4>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {/* 1. Investor Profit Payout */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-500/50">
                  <span className="text-emerald-300 block font-medium">ইনভেস্টরের প্রাপ্য মুনাফা (Profit)</span>
                  <div className="text-2xl font-black text-emerald-400 mt-1">
                    + ৳ {simResult.investor_profit_payout_bdt?.toLocaleString()}
                  </div>
                  <span className="text-[11px] text-emerald-300/80 mt-1 block font-semibold">
                    মোট সাইকেল লাভের {simResult.share_percentage}% অংশ
                  </span>
                </div>

                {/* 2. Total Payout (Capital + Profit) */}
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-700/80">
                  <span className="text-slate-400 block font-medium">মোট প্রাপ্তি (মূলধন + মুনাফা)</span>
                  <div className="text-2xl font-bold text-white mt-1">
                    ৳ {simResult.investor_total_payout_bdt?.toLocaleString()}
                  </div>
                  <span className="text-[11px] text-teal-300 mt-1 block">
                    মূলধন ৳ {simResult.investment_amount?.toLocaleString()} ফেরত সহ
                  </span>
                </div>

                {/* 3. Investor ROI */}
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-700/80">
                  <span className="text-slate-400 block font-medium">বিনিয়োগের রিটার্ন (ROI)</span>
                  <div className="text-2xl font-bold text-cyan-300 mt-1">
                    {simResult.investor_roi_pct}%
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    ৬ মাসের মোট লভ্যাংশ হার
                  </span>
                </div>

                {/* 4. Monthly Equivalent */}
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-700/80">
                  <span className="text-slate-400 block font-medium">মাসিক সমতুল্য আয়</span>
                  <div className="text-2xl font-bold text-amber-300 mt-1">
                    ~ ৳ {simResult.monthly_profit_equivalent?.toLocaleString()} <span className="text-xs font-normal text-slate-400">/মাস</span>
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    (৬ মাসে মোট লভ্যাংশের মাসিক গড়)
                  </span>
                </div>
              </div>

              {/* Cycle Project Reference Table */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-[11px] grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-300">
                <div>
                  <span className="text-slate-500 block">সাইকেল লক্ষ্যমাত্রা উৎপাদন:</span>
                  <strong className="text-white">{simResult.target_biomass_kg?.toLocaleString()} কেজি ({simResult.target_maund} মণ)</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">প্রজেক্টেড গ্রস বিক্রয়মূল্য:</span>
                  <strong className="text-white">৳ {simResult.projected_cycle_revenue_bdt?.toLocaleString()}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">অনুমিত মোট খাদ্য ও খামার ব্যয়:</span>
                  <strong className="text-slate-300">৳ {simResult.projected_cycle_cost_bdt?.toLocaleString()}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">খামারের সর্বমোট নিট মুনাফা:</span>
                  <strong className="text-teal-300 font-bold">৳ {simResult.projected_cycle_net_profit_bdt?.toLocaleString()}</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. INVESTMENTS & PROFIT SHARING AGREEMENT LEDGER */}
      {/* ========================================================================= */}
      {activeSubTab === 'investments' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center text-xs">
            <h3 className="font-bold text-white text-sm">
              চলমান বিনিয়োগ ও লভ্যাংশ বণ্টন চুক্তি (Active Investment Agreements)
            </h3>
            <span className="text-slate-400">
              মোট বিনিয়োগ: <strong className="text-white">৳ {totalFundsInvested.toLocaleString()}</strong>
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-700/80 bg-slate-850">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[11px] border-b border-slate-700">
                <tr>
                  <th className="p-3.5">ইনভেস্টরের নাম</th>
                  <th className="p-3.5">সাইকেল / পুকুর</th>
                  <th className="p-3.5">বিনিয়োগের অংক</th>
                  <th className="p-3.5">তারিখ</th>
                  <th className="p-3.5">প্রফিট শেয়ার %</th>
                  <th className="p-3.5">সম্ভাব্য লভ্যাংশ</th>
                  <th className="p-3.5">মোট পাওনা (মূলধন+লাভ)</th>
                  <th className="p-3.5">স্ট্যাটাস</th>
                  {isAdmin && <th className="p-3.5 text-right">অ্যাকশন</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {investments.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-6 text-center text-slate-500">
                      এখনো কোনো বিনিয়োগ চুক্তি যুক্ত করা হয়নি। "নতুন বিনিয়োগ চুক্তি" বাটনে ক্লিক করে যুক্ত করুন।
                    </td>
                  </tr>
                ) : (
                  investments.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-800/50">
                      <td className="p-3.5 font-bold text-white">
                        {inv.investor_name}
                        <span className="block text-[10px] text-slate-400 font-normal">{inv.investor_phone}</span>
                      </td>
                      <td className="p-3.5 text-teal-300 font-semibold">{inv.cycle_name}</td>
                      <td className="p-3.5 font-bold text-white text-sm">৳ {inv.amount_bdt?.toLocaleString()}</td>
                      <td className="p-3.5 text-slate-300">{inv.investment_date}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-lg bg-teal-500/10 text-teal-300 border border-teal-500/20 font-bold">
                          {inv.share_percentage}% নিট প্রফিট
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-emerald-400">
                        + ৳ {inv.estimated_profit_bdt?.toLocaleString()}
                      </td>
                      <td className="p-3.5 font-bold text-white text-sm">
                        ৳ {inv.total_expected_payout_bdt?.toLocaleString()}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          inv.payout_status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {inv.payout_status === 'completed' ? 'পরিশোধিত' : 'চলমান (Active)'}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <button
                            onClick={() => {
                              setSelectedInvestment(inv);
                              setPayoutForm({
                                paid_profit_bdt: inv.estimated_profit_bdt || 0.0,
                                returned_capital_bdt: inv.amount_bdt || 0.0,
                                payout_date: new Date().toISOString().slice(0, 10),
                                voucher_no: `PAY-INV-${inv.id}`
                              });
                              setShowPayoutModal(true);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] mr-1.5 transition"
                          >
                            লভ্যাংশ পরিশোধ
                          </button>
                          <button
                            onClick={() => handleDeleteInvestment(inv.id)}
                            title="মুছে ফেলুন"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. INVESTOR DIRECTORY CARDS */}
      {/* ========================================================================= */}
      {activeSubTab === 'investors' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {investors.map((inv) => (
            <div key={inv.id} className="p-5 rounded-2xl bg-slate-850 border border-slate-700/80 shadow-md space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-base">
                    {inv.name[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{inv.name}</h4>
                    <p className="text-slate-400 text-[11px]">{inv.phone} • {inv.address || 'চট্টগ্রাম'}</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px]">
                  {inv.investments_count || 0} টি চুক্তি
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-500 block text-[10px]">মোট বিনিয়োগ</span>
                  <span className="font-bold text-white mt-0.5 block">৳ {inv.total_invested_bdt?.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">প্রত্যাশিত লভ্যাংশ</span>
                  <span className="font-bold text-emerald-400 mt-0.5 block">+ ৳ {inv.total_projected_profit_bdt?.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">মোট ফেরত</span>
                  <span className="font-bold text-teal-300 mt-0.5 block">৳ {inv.total_expected_return_bdt?.toLocaleString()}</span>
                </div>
              </div>

              {inv.notes && (
                <p className="text-[11px] text-slate-400 italic">
                  নোট: {inv.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODALS */}
      {/* ========================================================================= */}

      {/* Modal A: New Investor Profile */}
      {showInvestorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl relative my-8 text-xs">
            <h3 className="text-base font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
              <Users className="w-5 h-5 text-teal-400" />
              নতুন ইনভেস্টর প্রোফাইল (New Investor Profile)
            </h3>

            <form onSubmit={handleCreateInvestorSubmit} className="space-y-3 mt-4">
              <div>
                <label className="text-slate-400 block mb-1">ইনভেস্টরের পূর্ণ নাম *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: আলহাজ্ব রফিক উদ্দিন"
                  value={newInvestor.name}
                  onChange={(e) => setNewInvestor({ ...newInvestor, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">মোবাইল নম্বর *</label>
                  <input
                    type="text"
                    required
                    placeholder="01819-XXXXXX"
                    value={newInvestor.phone}
                    onChange={(e) => setNewInvestor({ ...newInvestor, phone: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">জাতীয় পরিচয়পত্র (NID)</label>
                  <input
                    type="text"
                    value={newInvestor.nid}
                    onChange={(e) => setNewInvestor({ ...newInvestor, nid: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">ঠিকানা</label>
                <input
                  type="text"
                  placeholder="যেমন: পতেঙ্গা, চট্টগ্রাম"
                  value={newInvestor.address}
                  onChange={(e) => setNewInvestor({ ...newInvestor, address: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">মন্তব্য বা পরিচিতি</label>
                <textarea
                  rows="2"
                  value={newInvestor.notes}
                  onChange={(e) => setNewInvestor({ ...newInvestor, notes: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInvestorModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal B: New Investment Agreement */}
      {showInvestmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-3xl p-5 sm:p-6 shadow-2xl relative my-8 text-xs">
            <h3 className="text-base font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              নতুন বিনিয়োগ চুক্তি ও লভ্যাংশ নির্ধারণ (New Investment Agreement)
            </h3>

            <form onSubmit={handleCreateInvestmentSubmit} className="space-y-3 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">ইনভেস্টর নির্বাচন *</label>
                  <select
                    value={newInvestment.investor_id}
                    onChange={(e) => setNewInvestment({ ...newInvestment, investor_id: parseInt(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    {investors.map(inv => (
                      <option key={inv.id} value={inv.id}>{inv.name} ({inv.phone})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">সাইকেল নির্বাচন</label>
                  <select
                    value={newInvestment.cycle_id}
                    onChange={(e) => setNewInvestment({ ...newInvestment, cycle_id: parseInt(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="">সমগ্র খামার (All Ponds / Farm)</option>
                    {cycles.map(c => (
                      <option key={c.id} value={c.id}>{c.cycle_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">বিনিয়োগের পরিমাণ (টাকা) *</label>
                  <input
                    type="number"
                    required
                    value={newInvestment.amount_bdt}
                    onChange={(e) => setNewInvestment({ ...newInvestment, amount_bdt: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-bold text-sm"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">প্রফিট শেয়ার অনুপাত (%) *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={newInvestment.share_percentage}
                    onChange={(e) => setNewInvestment({ ...newInvestment, share_percentage: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-teal-300 font-bold text-sm"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    নিট মুনাফার শতকরা অংশ
                  </span>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">বিনিয়োগের তারিখ</label>
                <input
                  type="date"
                  value={newInvestment.investment_date}
                  onChange={(e) => setNewInvestment({ ...newInvestment, investment_date: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">চুক্তির শর্তাবলী</label>
                <textarea
                  rows="2"
                  value={newInvestment.agreement_terms}
                  onChange={(e) => setNewInvestment({ ...newInvestment, agreement_terms: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInvestmentModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  চুক্তি চূড়ান্ত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal C: Payout Recording */}
      {showPayoutModal && selectedInvestment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl relative my-8 text-xs">
            <h3 className="text-base font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              ইনভেস্টরকে লভ্যাংশ ও মূলধন পরিশোধ (Dividend Payout)
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              {selectedInvestment.investor_name} • {selectedInvestment.cycle_name}
            </p>

            <form onSubmit={handlePayoutSubmit} className="space-y-3 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">পরিশোধিত লভ্যাংশ (টাকা)</label>
                  <input
                    type="number"
                    value={payoutForm.paid_profit_bdt}
                    onChange={(e) => setPayoutForm({ ...payoutForm, paid_profit_bdt: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">ফেরতকৃত মূলধন (টাকা)</label>
                  <input
                    type="number"
                    value={payoutForm.returned_capital_bdt}
                    onChange={(e) => setPayoutForm({ ...payoutForm, returned_capital_bdt: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">পরিশোধের তারিখ</label>
                  <input
                    type="date"
                    value={payoutForm.payout_date}
                    onChange={(e) => setPayoutForm({ ...payoutForm, payout_date: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">ভাউচার / চেক নং</label>
                  <input
                    type="text"
                    value={payoutForm.voucher_no}
                    onChange={(e) => setPayoutForm({ ...payoutForm, voucher_no: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  পরিশোধ রেকর্ড করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
