import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, TrendingUp, TrendingDown, PieChart, ShieldAlert, Sliders, CheckCircle2, Edit3, Trash2 } from 'lucide-react';
import { fetchProfitAnalysis, deleteExpense, deleteHarvest, bulkDeleteExpenses, bulkDeleteHarvest } from '../api';

export default function Financials({ expensesData, harvestData, currentUser, onOpenModal, onRefresh }) {
  const [targetWeight, setTargetWeight] = useState(1.2);
  const [sellingPrice, setSellingPrice] = useState(155.0);
  const [analysis, setAnalysis] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');

  // Bulk Selection States
  const [selectedExpenseIds, setSelectedExpenseIds] = useState([]);
  const [selectedHarvestIds, setSelectedHarvestIds] = useState([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const isSuperadmin = currentUser?.role === 'superadmin';
  const isManager = currentUser?.role === 'manager';
  const isAdmin = isSuperadmin || isManager;

  useEffect(() => {
    fetchProfitAnalysis(targetWeight, sellingPrice)
      .then(data => setAnalysis(data))
      .catch(err => console.error("Profit analysis error:", err));
  }, [targetWeight, sellingPrice]);

  const expenses = expensesData?.expenses || [];
  const harvests = harvestData?.sales || [];

  const filteredExpenses = filterCategory === 'all'
    ? expenses
    : expenses.filter(e => e.category === filterCategory);

  const handleDeleteExpense = async (id) => {
    if (window.confirm("আপনি কি নিশ্চিতভাবে এই খরচের ভাউচারটি মুছে ফেলতে চান?")) {
      try {
        await deleteExpense(id);
        if (onRefresh) onRefresh();
      } catch (err) {
        alert("Delete failed: " + err.message);
      }
    }
  };

  const handleToggleExpense = (id) => {
    setSelectedExpenseIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllExpenses = () => {
    if (!filteredExpenses || filteredExpenses.length === 0) return;
    const allSelected = filteredExpenses.every(e => selectedExpenseIds.includes(e.id));
    if (allSelected) {
      const expIds = filteredExpenses.map(e => e.id);
      setSelectedExpenseIds(prev => prev.filter(id => !expIds.includes(id)));
    } else {
      const newIds = new Set([...selectedExpenseIds, ...filteredExpenses.map(e => e.id)]);
      setSelectedExpenseIds(Array.from(newIds));
    }
  };

  const handleBulkDeleteExpenses = async () => {
    if (selectedExpenseIds.length === 0) return;
    if (window.confirm(`⚠️ আপনি কি নিশ্চিতভাবে নির্বাচিত ${selectedExpenseIds.length} টি খরচের রেকর্ড মুছে ফেলতে চান? এটি স্থায়ীভাবে ডাটাবেজ থেকে মুছে যাবে।`)) {
      try {
        setIsBulkDeleting(true);
        await bulkDeleteExpenses(selectedExpenseIds);
        setSelectedExpenseIds([]);
        if (onRefresh) onRefresh();
      } catch (err) {
        alert("বাল্ক ডিলিট ব্যর্থ: " + err.message);
      } finally {
        setIsBulkDeleting(false);
      }
    }
  };

  const handleDeleteHarvest = async (id) => {
    if (window.confirm("আপনি কি নিশ্চিতভাবে এই মাছ বিক্রির রেকর্ডটি মুছে ফেলতে চান?")) {
      try {
        await deleteHarvest(id);
        if (onRefresh) onRefresh();
      } catch (err) {
        alert("Delete failed: " + err.message);
      }
    }
  };

  const handleToggleHarvest = (id) => {
    setSelectedHarvestIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllHarvest = () => {
    if (!harvests || harvests.length === 0) return;
    const allSelected = harvests.every(h => selectedHarvestIds.includes(h.id));
    if (allSelected) {
      setSelectedHarvestIds([]);
    } else {
      setSelectedHarvestIds(harvests.map(h => h.id));
    }
  };

  const handleBulkDeleteHarvest = async () => {
    if (selectedHarvestIds.length === 0) return;
    if (window.confirm(`⚠️ আপনি কি নিশ্চিতভাবে নির্বাচিত ${selectedHarvestIds.length} টি মাছ বিক্রির রেকর্ড মুছে ফেলতে চান?`)) {
      try {
        setIsBulkDeleting(true);
        await bulkDeleteHarvest(selectedHarvestIds);
        setSelectedHarvestIds([]);
        if (onRefresh) onRefresh();
      } catch (err) {
        alert("বাল্ক ডিলিট ব্যর্থ: " + err.message);
      } finally {
        setIsBulkDeleting(false);
      }
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            খরচ, লাভ ও ফিনান্সিয়াল হিসাব (Financials & Profit Engine)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            সুপারএডমিন ও ম্যানেজারের জন্য মোট বিনিয়োগ, ফিড/পোনা/লেবার ব্যয় এবং মাছ বিক্রির মুনাফা বিশ্লেষণ
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onOpenModal('bulk_expense')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> + বাল্ক খরচ এন্ট্রি
          </button>
          <button
            onClick={() => onOpenModal('expense')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-medium transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-600" /> নতুন খরচ এন্ট্রি
          </button>
          <button
            onClick={() => onOpenModal('harvest')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition"
          >
            <Plus className="w-4 h-4" /> মাছ বিক্রি / হার্ভেস্ট
          </button>
        </div>
      </div>

      {/* INTERACTIVE PROFIT SIMULATOR & FORECASTING */}
      {analysis && (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-teal-950/40 border border-teal-500/40 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-teal-500/20 text-teal-400">
                <Sliders className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-slate-900 text-base">মাছ বিক্রির মুনাফা সিমুলেটর (Live Harvest Profit Calculator)</h3>
                <p className="text-xs text-slate-400">টার্গেট ওজন ও সম্ভাব্য বাজারদর পরিবর্তন করে এখনই সম্ভাব্য লাভ ও ব্রেক-ইভেন রেট দেখুন</p>
              </div>
            </div>
          </div>

          {/* Interactive Sliders / Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">পাঙ্গাশ বিক্রয় সাইজ (Target Weight):</span>
                <span className="font-bold text-teal-300">{targetWeight} কেজি / পিস</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="2.0"
                step="0.05"
                value={targetWeight}
                onChange={(e) => setTargetWeight(parseFloat(e.target.value))}
                className="w-full accent-teal-400 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>০.৮ কেজি (ছোট)</span>
                <span>১.২ কেজি (স্ট্যান্ডার্ড)</span>
                <span>২.০ কেজি (বড়)</span>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">সম্ভাব্য বাজার দর (Pangash Selling Price):</span>
                <span className="font-bold text-emerald-400">৳ {sellingPrice} / কেজি</span>
              </div>
              <input
                type="range"
                min="130"
                max="190"
                step="1"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(parseFloat(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>৳ ১৩০/কেজি</span>
                <span>৳ ১৫৫/কেজি (বর্তমান গড়)</span>
                <span>৳ ১৯০/কেজি</span>
              </div>
            </div>
          </div>

          {/* Computed Results Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-400 block">মোট সম্ভাব্য উৎপাদন (Biomass)</span>
              <div className="text-lg font-bold text-slate-900 mt-1">
                {analysis.fish_projections.total_projected_biomass_kg?.toLocaleString()} <span className="text-xs font-normal text-slate-400">কেজি</span>
              </div>
              <span className="text-[11px] text-teal-300 block mt-0.5">
                ~ {Math.round(analysis.fish_projections.total_projected_biomass_kg / 40).toLocaleString()} মণ মাছ
              </span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-400 block">মোট বিক্রয়মূল্য (Gross Revenue)</span>
              <div className="text-lg font-bold text-teal-300 mt-1">
                ৳ {analysis.profit_forecast.total_projected_revenue?.toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                পাঙ্গাশ + কার্প সম্মিলিত বিক্রয়
              </span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-400 block">ব্রেক-ইভেন ও কেজি প্রতি খরচ</span>
              <div className="text-lg font-bold text-amber-300 mt-1">
                ৳ {analysis.profit_forecast.cost_per_kg_produced} <span className="text-xs font-normal text-slate-400">/কেজি</span>
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                (ফিড, পোনা, লেবার ও বিদ্যুৎসহ)
              </span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-400 block">সম্ভাব্য নীট মুনাফা (Net Profit)</span>
              <div className="text-xl font-bold text-emerald-400 mt-1">
                + ৳ {analysis.profit_forecast.projected_net_profit?.toLocaleString()}
              </div>
              <span className="text-[11px] text-emerald-400/80 block mt-0.5">
                ROI: {analysis.profit_forecast.roi_pct}% • মার্জিন: {analysis.profit_forecast.profit_margin_pct}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* EXPENSE CATEGORIES SUMMARY */}
      {expensesData?.by_category && (
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              খাতওয়ারি খরচের বিবরণ (Expense Breakdown)
            </h4>
            <span className="text-xs font-bold text-slate-200">
              মোট ব্যয়: ৳ {expensesData.total_amount_bdt?.toLocaleString()}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.entries(expensesData.by_category).map(([cat, amt]) => (
              <div key={cat} className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm text-xs">
                <span className="text-slate-400 block truncate">{cat}</span>
                <span className="font-bold text-white mt-0.5 block">৳ {Number(amt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EXPENSES LOG TABLE */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold text-slate-900">দৈনিক ব্যয়ের খাতা (Expense Logs)</h3>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-100 border border-slate-200 text-xs rounded-xl px-3 py-1.5 text-slate-300 focus:outline-none"
          >
            <option value="all">সব খাত (All Categories)</option>
            <option value="Feed Purchase">Feed Purchase</option>
            <option value="Rice / Vaat">Rice / Vaat</option>
            <option value="Medicine & Lime">Medicine & Lime</option>
            <option value="Electricity & Fuel">Electricity & Fuel</option>
            <option value="Labor Wages">Labor Wages</option>
            <option value="Maintenance">Maintenance</option>
          </select>
        </div>

        {/* Bulk Selection Action Bar for Expenses */}
        {selectedExpenseIds.length > 0 && (
          <div className="mb-3 p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between gap-3 text-xs animate-in fade-in">
            <div className="flex items-center gap-2 text-rose-800 font-bold">
              <span className="w-6 h-6 rounded-lg bg-rose-600 text-white flex items-center justify-center text-xs">
                {selectedExpenseIds.length}
              </span>
              <span>টি খরচের রেকর্ড নির্বাচিত হয়েছে</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedExpenseIds([])}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer"
              >
                নির্বাচন বাতিল
              </button>
              <button
                type="button"
                onClick={handleBulkDeleteExpenses}
                disabled={isBulkDeleting}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {isBulkDeleting ? 'মুছে ফেলা হচ্ছে...' : `নির্বাচিত ${selectedExpenseIds.length} টি খরচ ডিলিট`}
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[11px] border-b border-slate-200">
              <tr>
                {isAdmin && (
                  <th className="p-3.5 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={filteredExpenses.length > 0 && filteredExpenses.every(e => selectedExpenseIds.includes(e.id))}
                      onChange={handleSelectAllExpenses}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                      title="সব খরচ নির্বাচন করুন"
                    />
                  </th>
                )}
                <th className="p-3.5">তারিখ</th>
                <th className="p-3.5">খাত (Category)</th>
                <th className="p-3.5">বিবরণ (Description)</th>
                <th className="p-3.5">টাকার পরিমাণ (BDT)</th>
                <th className="p-3.5">ভাউচার নং</th>
                <th className="p-3.5">এন্ট্রি করেছেন</th>
                {isAdmin && <th className="p-3.5 text-right">অ্যাকশন</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.map((e) => {
                const isSelected = selectedExpenseIds.includes(e.id);
                return (
                <tr key={e.id} className={`transition ${isSelected ? 'bg-amber-50/80 border-l-4 border-l-amber-600' : 'hover:bg-slate-50/80'}`}>
                  {isAdmin && (
                    <td className="p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleExpense(e.id)}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                      />
                    </td>
                  )}
                  <td className="p-3.5 font-medium text-slate-900">{e.date}</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
                      {e.category}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-200">{e.description}</td>
                  <td className="p-3.5 font-bold text-slate-900 text-sm">৳ {e.amount_bdt?.toLocaleString()}</td>
                  <td className="p-3.5 text-slate-400 font-mono text-[11px]">{e.voucher_no || '-'}</td>
                  <td className="p-3.5 text-slate-400">{e.recorded_by}</td>
                  {isAdmin && (
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => onOpenModal('expense', { editItem: e })}
                        title="সম্পাদনা করুন"
                        className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer transition mr-1"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteExpense(e.id)}
                        title="মুছে ফেলুন"
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
            </tbody>
          </table>
        </div>
      </div>

      {/* HARVEST & SALES TABLE */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold text-slate-900">মাছ বিক্রি ও আয়ের রেকর্ড (Fish Harvest & Sales)</h3>
          <span className="text-xs text-slate-500 font-semibold">
            মোট বিক্রয়: ৳ {harvestData?.total_revenue_bdt?.toLocaleString() || 0}
          </span>
        </div>

        {/* Bulk Selection Action Bar for Harvest */}
        {selectedHarvestIds.length > 0 && (
          <div className="mb-3 p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between gap-3 text-xs animate-in fade-in">
            <div className="flex items-center gap-2 text-rose-800 font-bold">
              <span className="w-6 h-6 rounded-lg bg-rose-600 text-white flex items-center justify-center text-xs">
                {selectedHarvestIds.length}
              </span>
              <span>টি মাছ বিক্রির রেকর্ড নির্বাচিত হয়েছে</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedHarvestIds([])}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer"
              >
                নির্বাচন বাতিল
              </button>
              <button
                type="button"
                onClick={handleBulkDeleteHarvest}
                disabled={isBulkDeleting}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {isBulkDeleting ? 'মুছে ফেলা হচ্ছে...' : `নির্বাচিত ${selectedHarvestIds.length} টি ডিলিট`}
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[11px] border-b border-slate-200">
              <tr>
                {isAdmin && (
                  <th className="p-3.5 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={harvests.length > 0 && harvests.every(h => selectedHarvestIds.includes(h.id))}
                      onChange={handleSelectAllHarvest}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      title="সব নির্বাচন করুন"
                    />
                  </th>
                )}
                <th className="p-3.5">তারিখ</th>
                <th className="p-3.5">পুকুর নং</th>
                <th className="p-3.5">মাছের জাত</th>
                <th className="p-3.5">মোট ওজন (কেজি)</th>
                <th className="p-3.5">দর (টাকা/কেজি)</th>
                <th className="p-3.5">মোট বিক্রয়মূল্য</th>
                <th className="p-3.5">ক্রেতা / পাইকার</th>
                {isAdmin && <th className="p-3.5 text-right">অ্যাকশন</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {harvests.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 9 : 8} className="p-4 text-center text-slate-500">
                    এখনো কোনো মাছ বিক্রির রেকর্ড নেই। বিক্রি হলে "মাছ বিক্রি / হার্ভেস্ট" বাটনে ক্লিক করে যুক্ত করুন।
                  </td>
                </tr>
              ) : (
                harvests.map((h) => {
                  const isSelected = selectedHarvestIds.includes(h.id);
                  return (
                  <tr key={h.id} className={`transition ${isSelected ? 'bg-emerald-50/80 border-l-4 border-l-emerald-600' : 'hover:bg-slate-50/80'}`}>
                    {isAdmin && (
                      <td className="p-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleHarvest(h.id)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </td>
                    )}
                    <td className="p-3.5 font-medium text-slate-900">{h.date}</td>
                    <td className="p-3.5 text-teal-300 font-semibold">{h.pond_name || `পুকুর ${h.pond_id}`}</td>
                    <td className="p-3.5 font-medium text-slate-200">{h.fish_type}</td>
                    <td className="p-3.5 font-bold text-white">{h.total_weight_kg?.toLocaleString()} কেজি</td>
                    <td className="p-3.5 text-emerald-400 font-semibold">৳ {h.rate_per_kg_bdt}</td>
                    <td className="p-3.5 font-bold text-emerald-300 text-sm">৳ {h.total_amount_bdt?.toLocaleString()}</td>
                    <td className="p-3.5 text-slate-300">{h.buyer_name || '-'}</td>
                    {isAdmin && (
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => onOpenModal('harvest', { editItem: h })}
                          title="সম্পাদনা করুন"
                          className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer transition mr-1"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteHarvest(h.id)}
                          title="মুছে ফেলুন"
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
