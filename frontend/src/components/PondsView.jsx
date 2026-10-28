import React, { useState } from 'react';
import { Waves, Plus, Scale, Package, Calendar, Info, Check, Filter, Edit3, Trash2, Utensils, CloudSun, CalendarDays } from 'lucide-react';
import { deleteStocking, deleteDailyFeeding, bulkDeleteStocking } from '../api';

const monthNamesBengali = {
  '01': 'জানুয়ারি', '02': 'ফেব্রুয়ারি', '03': 'মার্চ', '04': 'এপ্রিল',
  '05': 'মে', '06': 'জুন', '07': 'জুলাই', '08': 'আগস্ট',
  '09': 'সেপ্টেম্বর', '10': 'অক্টোবর', '11': 'নভেম্বর', '12': 'ডিসেম্বর'
};

const formatMonthLabel = (yearMonth) => {
  if (!yearMonth || yearMonth === 'all') return 'সকল মাস (All Months)';
  const parts = yearMonth.split('-');
  if (parts.length < 2) return yearMonth;
  const [year, month] = parts;
  const name = monthNamesBengali[month] || month;
  return `${name} ${year}`;
};

export default function PondsView({ ponds, dailyFeedings = [], currentUser, onOpenModal, onRefresh }) {
  const [selectedPondId, setSelectedPondId] = useState(null);
  const [selectedFeedingMonth, setSelectedFeedingMonth] = useState('all');

  const [selectedStockingIds, setSelectedStockingIds] = useState([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const activePond = selectedPondId 
    ? ponds.find(p => p.id === selectedPondId) 
    : ponds[0];

  const isAdmin = currentUser?.role === 'superadmin' || currentUser?.role === 'manager';

  const pondFeedings = dailyFeedings.filter(f => f.pond_id === activePond?.id);

  const availableFeedingMonths = Array.from(
    new Set(pondFeedings.map(f => f.date ? f.date.slice(0, 7) : null).filter(Boolean))
  ).sort().reverse();

  const displayFeedings = selectedFeedingMonth === 'all' 
    ? pondFeedings 
    : pondFeedings.filter(f => f.date && f.date.startsWith(selectedFeedingMonth));

  const monthTotalBags = displayFeedings.reduce((sum, f) => sum + (f.commercial_feed_bags || 0), 0);
  const monthTotalKg = displayFeedings.reduce((sum, f) => sum + (f.commercial_feed_kg || 0), 0);
  const monthTotalVaat = displayFeedings.reduce((sum, f) => sum + (f.vaat_kg || 0), 0);

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

  const handleDeleteStocking = async (id) => {
    if (window.confirm("আপনি কি নিশ্চিতভাবে এই পোনা ছাড়ার রেকর্ডটি মুছে ফেলতে চান?")) {
      try {
        await deleteStocking(id);
        if (onRefresh) onRefresh();
      } catch (err) {
        alert("Delete failed: " + err.message);
      }
    }
  };

  const handleToggleStocking = (id) => {
    setSelectedStockingIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllStocking = () => {
    const list = activePond?.stockings || [];
    if (list.length === 0) return;
    const allSelected = list.every(st => selectedStockingIds.includes(st.id));
    if (allSelected) {
      setSelectedStockingIds([]);
    } else {
      setSelectedStockingIds(list.map(st => st.id));
    }
  };

  const handleBulkDeleteStocking = async () => {
    if (selectedStockingIds.length === 0) return;
    if (window.confirm(`⚠️ আপনি কি নিশ্চিতভাবে নির্বাচিত ${selectedStockingIds.length} টি পোনা ছাড়ার রেকর্ড মুছে ফেলতে চান?`)) {
      try {
        setIsBulkDeleting(true);
        await bulkDeleteStocking(selectedStockingIds);
        setSelectedStockingIds([]);
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
      {/* Header & Add buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Waves className="w-5 h-5 text-teal-600" />
            পুকুর ব্যবস্থাপনা (৪টি পুকুর)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            মাছের পোনা ছাড়ার তারিখ, জাত, সাইজ ও মজুদের বিস্তারিত হিসাব (সম্পাদনা ও মোছার সুবিধাসহ)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenModal('stocking')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" /> নতুন পোনা ফেলুন (Stock Fish)
          </button>
        </div>
      </div>

      {/* 4 Ponds Horizontal Selector Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {ponds.map((p) => {
          const isSelected = (activePond?.id === p.id);
          const isActive = p.status === 'active';
          return (
            <button
              key={p.id}
              onClick={() => setSelectedPondId(p.id)}
              className={`p-4 rounded-2xl border text-left transition relative overflow-hidden cursor-pointer ${
                isSelected
                  ? 'bg-teal-50/70 border-2 border-teal-600 shadow-md ring-1 ring-teal-500'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900">{p.name}</span>
                <span className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              </div>
              <div className="mt-2 text-xs">
                <span className="text-slate-500 block">{p.status === 'active' ? 'চলমান' : 'প্রস্তুতি'}</span>
                <span className="font-bold text-teal-700 block mt-1">
                  {p.total_fish > 0 ? `${p.total_fish.toLocaleString()} pcs মাছ` : 'খালি / প্রস্তুতি'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Pond Deep-Dive Detail View */}
      {activePond && (
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-slate-900">{activePond.name}</h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 font-bold">
                  {activePond.status === 'active' ? 'চলমান' : 'প্রস্তুতি'}
                </span>
                <span className="text-xs text-slate-500 font-medium">গভীরতা: {activePond.depth_feet} ফুট</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">{activePond.notes}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenModal('feed', { pond_id: activePond.id })}
                className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
              >
                + খাবার দিন
              </button>
              <button
                onClick={() => onOpenModal('stocking', { pond_id: activePond.id })}
                className="px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-300 transition shadow-sm cursor-pointer"
              >
                + পোনা ফেলুন
              </button>
            </div>
          </div>

          {/* Quick Metrics for this pond */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-medium block">মোট মজুদ মাছ</span>
              <span className="text-lg font-black text-slate-900 mt-1 block">
                {activePond.total_fish?.toLocaleString() || 0} <span className="text-xs font-bold text-teal-700">pcs</span>
              </span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-medium block">মোট ফিড সরবরাহ</span>
              <span className="text-lg font-black text-cyan-700 mt-1 block">
                {activePond.feed_bags_used || 0} <span className="text-xs font-semibold text-slate-500">ব্যাগ ({((activePond.feed_bags_used || 0) * 25).toLocaleString()} kg)</span>
              </span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-medium block">ভাত সরবরাহ (Vaat)</span>
              <span className="text-lg font-black text-amber-700 mt-1 block">
                {activePond.vaat_kg_used || 0} <span className="text-xs font-semibold text-slate-500">কেজি</span>
              </span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-medium block">সর্বশেষ নমুনা ওজন</span>
              <span className="text-lg font-black text-emerald-700 mt-1 block">
                {activePond.latest_sampling ? `${activePond.latest_sampling.avg_weight_grams}g` : 'চলমান'}
              </span>
              {activePond.latest_sampling && (
                <span className="text-[11px] text-slate-500 block">
                  {activePond.latest_sampling.calculated_pcs_per_kg} pcs/kg • FCR: {activePond.latest_sampling.fcr}
                </span>
              )}
            </div>
          </div>

          {/* Stocking Batches Table */}
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-600" />
                এই পুকুরে ছাড়া মাছের চালানের হিসাব (Stocking Events)
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-lg font-medium">
                  পদ্ধতি: মোট ওজন (কেজি) × কেজিতে পিস = মোট মাছের সংখ্যা
                </span>
                <button
                  onClick={() => onOpenModal('stocking', { pond_id: activePond.id })}
                  className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> + নতুন মাছ যোগ
                </button>
              </div>
            </div>
            
            {/* Bulk Selection Action Bar for Stocking */}
            {selectedStockingIds.length > 0 && (
              <div className="mb-3 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-3 text-xs animate-in fade-in">
                <div className="flex items-center gap-2 text-rose-800 font-bold">
                  <span className="w-5 h-5 rounded-lg bg-rose-600 text-white flex items-center justify-center text-xs">
                    {selectedStockingIds.length}
                  </span>
                  <span>টি পোনা ছাড়ার রেকর্ড নির্বাচিত হয়েছে</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedStockingIds([])}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button
                    type="button"
                    onClick={handleBulkDeleteStocking}
                    disabled={isBulkDeleting}
                    className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1 shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {isBulkDeleting ? 'মুছছে...' : `নির্বাচিত ${selectedStockingIds.length} টি ডিলিট`}
                  </button>
                </div>
              </div>
            )}

            {activePond.stockings && activePond.stockings.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[11px] border-b border-slate-200">
                    <tr>
                      {isAdmin && (
                        <th className="p-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={activePond.stockings.length > 0 && activePond.stockings.every(st => selectedStockingIds.includes(st.id))}
                            onChange={handleSelectAllStocking}
                            className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                            title="সব নির্বাচন করুন"
                          />
                        </th>
                      )}
                      <th className="p-3">তারিখ</th>
                      <th className="p-3">মাছের জাত</th>
                      <th className="p-3">মোট সংখ্যা (Pcs)</th>
                      <th className="p-3">কেজিতে কত পিস</th>
                      <th className="p-3">শুরুর মোট ওজন</th>
                      <th className="p-3">ক্রয়মূল্য (BDT)</th>
                      <th className="p-3">মন্তব্য / সূত্র</th>
                      {isAdmin && <th className="p-3 text-center">অ্যাকশন</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activePond.stockings.map((st) => {
                      const isSelected = selectedStockingIds.includes(st.id);
                      return (
                      <tr key={st.id} className={`transition ${isSelected ? 'bg-teal-50/80 border-l-4 border-l-teal-600' : 'hover:bg-slate-50/80'}`}>
                        {isAdmin && (
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleStocking(st.id)}
                              className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                            />
                          </td>
                        )}
                        <td className="p-3 font-semibold text-slate-900">{st.date}</td>
                        <td className="p-3 text-teal-700 font-semibold">{st.fish_type}</td>
                        <td className="p-3 font-black text-slate-900 text-sm">
                          {st.count_pcs.toLocaleString()} pcs
                        </td>
                        <td className="p-3">
                          {st.pcs_per_kg ? (
                            <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200 font-bold">
                              {st.pcs_per_kg} pcs/kg
                            </span>
                          ) : '-'}
                        </td>
                        <td className="p-3 font-bold text-amber-700">
                          {st.initial_weight_kg ? `${st.initial_weight_kg.toLocaleString()} kg` : '-'}
                        </td>
                        <td className="p-3 font-semibold text-slate-800">৳ {st.cost_bdt?.toLocaleString()}</td>
                        <td className="p-3 text-slate-500">{st.notes || '-'}</td>
                        {isAdmin && (
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => onOpenModal('stocking', { editItem: st, pond_id: activePond.id })}
                                title="সম্পাদনা করুন (Edit)"
                                className="p-1.5 rounded-lg bg-slate-50 hover:bg-teal-50 text-teal-700 hover:text-teal-800 border border-slate-200 transition"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteStocking(st.id)}
                                title="মুছে ফেলুন (Delete)"
                                className="p-1.5 rounded-lg bg-slate-50 hover:bg-rose-50 text-rose-600 hover:text-rose-700 border border-slate-200 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs">
                এই পুকুরে এখনও কোন মাছের চালান এন্ট্রি করা হয়নি।
              </div>
            )}
          </div>

          {/* Individual Feeding History for this pond */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-cyan-600" />
                  এই পুকুরে দেওয়া খাবারের পূর্ণাঙ্গ রেজিস্টার ({activePond.name})
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedFeedingMonth === 'all' ? (
                    <>মোট ব্যবহৃত ফিড: <strong className="text-teal-700">{activePond.feed_bags_used || 0} ব্যাগ</strong> ({((activePond.feed_bags_used || 0) * 25).toLocaleString()} কেজি) • ভাত: <strong className="text-amber-700">{activePond.vaat_kg_used || 0} কেজি</strong></>
                  ) : (
                    <>{formatMonthLabel(selectedFeedingMonth)}-এর ফিড: <strong className="text-teal-700">{monthTotalBags.toFixed(1)} ব্যাগ</strong> ({monthTotalKg.toLocaleString()} কেজি) • ভাত: <strong className="text-amber-700">{monthTotalVaat} কেজি</strong></>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Monthly Filter Controls */}
                {availableFeedingMonths.length > 0 && (
                  <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-slate-300 text-xs shadow-sm">
                    <CalendarDays className="w-3.5 h-3.5 text-teal-600" />
                    <span className="text-slate-500 font-medium">মাস:</span>
                    <select
                      value={selectedFeedingMonth}
                      onChange={(e) => setSelectedFeedingMonth(e.target.value)}
                      className="bg-transparent text-slate-800 focus:outline-none font-semibold cursor-pointer"
                    >
                      <option value="all" className="bg-white text-slate-800">সকল মাস</option>
                      {availableFeedingMonths.map((ym) => (
                        <option key={ym} value={ym} className="bg-white text-slate-800">
                          {formatMonthLabel(ym)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  onClick={() => onOpenModal('feed', { pond_id: activePond.id })}
                  className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> + খাবার দিন
                </button>
              </div>
            </div>

            {displayFeedings.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[11px] border-b border-slate-200">
                    <tr>
                      <th className="p-3">তারিখ</th>
                      <th className="p-3">সময়</th>
                      <th className="p-3">ফিড ব্যাগ</th>
                      <th className="p-3">ফিড ওজন (কেজি)</th>
                      <th className="p-3">ভাত (কেজি)</th>
                      <th className="p-3">আবহাওয়া</th>
                      <th className="p-3">এন্ট্রি করেছেন</th>
                      <th className="p-3">মন্তব্য</th>
                      {isAdmin && <th className="p-3 text-center">অ্যাকশন</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayFeedings.map((f) => (
                      <tr key={f.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3 font-semibold text-slate-900">{f.date}</td>
                        <td className="p-3 font-bold text-teal-700">{f.feeding_time}</td>
                        <td className="p-3 font-black text-slate-900 text-sm">
                          <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200 font-bold">
                            {f.commercial_feed_bags} ব্যাগ
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-slate-800">{f.commercial_feed_kg} kg</td>
                        <td className="p-3">
                          {f.vaat_kg > 0 ? (
                            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                              {f.vaat_kg} kg ভাত
                            </span>
                          ) : (
                            <span className="text-slate-400">০ কেজি</span>
                          )}
                        </td>
                        <td className="p-3 text-slate-600">
                          <div className="flex items-center gap-1">
                            <CloudSun className="w-3.5 h-3.5 text-teal-600" />
                            <span>{f.weather_condition || 'স্বাভাবিক'}</span>
                          </div>
                        </td>
                        <td className="p-3 text-slate-500">{f.logged_by || 'কর্মী'}</td>
                        <td className="p-3 text-slate-500 italic max-w-xs truncate">{f.notes || '-'}</td>
                        {isAdmin && (
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => onOpenModal('feed', { editItem: f, pond_id: activePond.id })}
                                title="সম্পাদনা করুন (Edit)"
                                className="p-1.5 rounded-lg bg-slate-50 hover:bg-teal-50 text-teal-700 hover:text-teal-800 border border-slate-200 transition"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteFeeding(f.id)}
                                title="মুছে ফেলুন (Delete)"
                                className="p-1.5 rounded-lg bg-slate-50 hover:bg-rose-50 text-rose-600 hover:text-rose-700 border border-slate-200 transition"
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
              <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs">
                এই পুকুরে এখনও কোনো খাবার এন্ট্রি দেওয়া হয়নি।
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
