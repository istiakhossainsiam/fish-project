import React, { useState } from 'react';
import { Scale, Plus, Calendar, Clock, AlertTriangle, CheckCircle, TrendingUp, HelpCircle, Edit3, Trash2 } from 'lucide-react';
import { deleteGrowth } from '../api';

export default function GrowthSampling({ samplings, ponds, currentUser, onOpenModal, onRefresh }) {
  const [calculator, setCalculator] = useState({
    sample_count: 50,
    sample_weight_kg: 3.85,
    total_stocked_pcs: 14500,
    feed_given_kg: 1250,
    initial_stock_weight_kg: 675
  });

  const isAdmin = currentUser?.role === 'superadmin' || currentUser?.role === 'manager';

  const handleDeleteSampling = async (id) => {
    if (window.confirm("আপনি কি নিশ্চিতভাবে এই গ্রোথ স্যাম্পলিং রেকর্ডটি মুছে ফেলতে চান?")) {
      try {
        await deleteGrowth(id);
        if (onRefresh) onRefresh();
      } catch (err) {
        alert("Delete failed: " + err.message);
      }
    }
  };

  // Dynamic live calculation
  const pcs_per_kg = calculator.sample_weight_kg > 0 ? (calculator.sample_count / calculator.sample_weight_kg).toFixed(1) : 0;
  const avg_grams = calculator.sample_count > 0 ? ((calculator.sample_weight_kg * 1000) / calculator.sample_count).toFixed(1) : 0;
  const est_biomass = ((calculator.total_stocked_pcs * 0.95) * (avg_grams / 1000)).toFixed(0);
  const biomass_gain = Math.max(1, est_biomass - calculator.initial_stock_weight_kg);
  const live_fcr = (calculator.feed_given_kg / biomass_gain).toFixed(2);

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Scale className="w-5 h-5 text-teal-400" />
            ১৫-১৮ দিনের মাছের বৃদ্ধি মনিটরিং (Fish Growth & Sampling)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            প্রতি ১৫-১৮ দিন অন্তর জাল টেনে মাছের গড় ওজন (ABW), কেজিতে পিস, বায়োমাস এবং এফসিআর (FCR) যাচাই
          </p>
        </div>
        <div>
          <button
            onClick={() => onOpenModal('sampling')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-md transition"
          >
            <Plus className="w-4 h-4" /> নতুন স্যাম্পলিং রেকর্ড করুন
          </button>
        </div>
      </div>

      {/* WHY 15-18 DAYS SAMPLING MATTERS BANNER */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-950/40 to-slate-900 border border-teal-500/30">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400 shrink-0 mt-0.5">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="text-xs space-y-1">
            <h4 className="font-bold text-slate-900 text-sm">১৫-১৮ দিনের গ্রোথ চেকের বৈজ্ঞানিক গুরুত্ব:</h4>
            <p className="text-slate-700 leading-relaxed">
              পাঙ্গাশ ও কার্প জাতীয় মাছে প্রতি ১৫-১৮ দিন পর পর নমুনা ওজন না মাপলে দৈনিক খাদ্য শতকরা হার (বডি ওয়েটের ৩-৫%) নির্ধারণ করা যায় না। এতে হয় খাবার কম পড়ে মাছের বৃদ্ধি থেমে যায়, নয়তো অতিরিক্ত খাবারের কারণে পুকুরের তলদেশ নষ্ট ও লাখ টাকার অপচয় হয়। সফটওয়্যারটি স্বয়ংক্রিয়ভাবে পরবর্তী স্যাম্পলিংয়ের অ্যালার্ট প্রদান করে।
            </p>
          </div>
        </div>
      </div>

      {/* INTERACTIVE SAMPLING & FCR CALCULATOR WIDGET */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-md">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Scale className="w-4 h-4 text-cyan-400" />
          ইনস্ট্যান্ট গ্রোথ ও এফসিআর ক্যালকুলেটর (Quick Netting Simulator)
        </h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="text-slate-600 block mb-1 font-semibold">জালে ওঠা মাছের সংখ্যা (Pcs)</label>
            <input
              type="number"
              value={calculator.sample_count}
              onChange={(e) => setCalculator({ ...calculator, sample_count: parseFloat(e.target.value) || 0 })}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:border-teal-600 focus:outline-none shadow-sm"
            />
          </div>
          <div>
            <label className="text-slate-600 block mb-1 font-semibold">নমুনার মোট ওজন (Kg)</label>
            <input
              type="number"
              step="0.01"
              value={calculator.sample_weight_kg}
              onChange={(e) => setCalculator({ ...calculator, sample_weight_kg: parseFloat(e.target.value) || 0 })}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:border-teal-600 focus:outline-none shadow-sm"
            />
          </div>
          <div>
            <label className="text-slate-600 block mb-1 font-semibold">মোট মজুদ মাছ (Stock Pcs)</label>
            <input
              type="number"
              value={calculator.total_stocked_pcs}
              onChange={(e) => setCalculator({ ...calculator, total_stocked_pcs: parseFloat(e.target.value) || 0 })}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:border-teal-600 focus:outline-none shadow-sm"
            />
          </div>
          <div>
            <label className="text-slate-600 block mb-1 font-semibold">খাওয়ানো ফিড (Feed Kg)</label>
            <input
              type="number"
              value={calculator.feed_given_kg}
              onChange={(e) => setCalculator({ ...calculator, feed_given_kg: parseFloat(e.target.value) || 0 })}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:border-teal-600 focus:outline-none shadow-sm"
            />
          </div>
        </div>

        {/* Live Computed Results */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-200">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-400 block">কেজিতে কত পিস (Count/kg)</span>
            <span className="text-lg font-bold text-teal-300 mt-0.5 block">{pcs_per_kg} pcs/kg</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-400 block">প্রতি মাছের গড় ওজন (ABW)</span>
            <span className="text-lg font-bold text-cyan-300 mt-0.5 block">{avg_grams} গ্রাম</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-400 block">পুকুরের আনুমানিক বায়োমাস</span>
            <span className="text-lg font-bold text-slate-900 mt-0.5 block">{Number(est_biomass).toLocaleString()} কেজি</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-400 block">এফসিআর (FCR) রেটিং</span>
            <span className={`text-lg font-bold mt-0.5 block ${Number(live_fcr) <= 1.4 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {live_fcr} {Number(live_fcr) <= 1.4 ? '(দারুণ!)' : '(সাধারণ)'}
            </span>
          </div>
        </div>
      </div>

      {/* SAMPLING RECORDS TABLE */}
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-3">
          স্যাম্পলিংয়ের পূর্ববর্তী ইতিহাস (Past Sampling Logs)
        </h3>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[11px] border-b border-slate-200">
              <tr>
                <th className="p-3.5">তারিখ</th>
                <th className="p-3.5">পুকুর</th>
                <th className="p-3.5">মাছের জাত</th>
                <th className="p-3.5">নমুনা পিস ও ওজন</th>
                <th className="p-3.5">কেজিতে পিস (Pcs/Kg)</th>
                <th className="p-3.5">গড় ওজন (ABW)</th>
                <th className="p-3.5">মোট বায়োমাস</th>
                <th className="p-3.5">এফসিআর (FCR)</th>
                <th className="p-3.5">পরবর্তী স্যাম্পলিং তারিখ</th>
                <th className="p-3.5">মন্তব্য</th>
                {isAdmin && <th className="p-3.5 text-right">অ্যাকশন</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {samplings?.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3.5 font-medium text-slate-900">{s.date}</td>
                  <td className="p-3.5 font-semibold text-teal-300">{s.pond_name}</td>
                  <td className="p-3.5 font-medium text-slate-200">{s.fish_type}</td>
                  <td className="p-3.5">
                    {s.sample_count_pcs} pcs / {s.total_sample_weight_kg} kg
                  </td>
                  <td className="p-3.5 font-bold text-slate-900">
                    <span className="px-2 py-0.5 rounded-lg bg-teal-500/10 text-teal-300 border border-teal-500/20">
                      {s.calculated_pcs_per_kg} pcs/kg
                    </span>
                  </td>
                  <td className="p-3.5 font-bold text-cyan-300 text-sm">{s.avg_weight_grams} গ্রাম</td>
                  <td className="p-3.5 font-semibold text-slate-100">{s.estimated_biomass_kg?.toLocaleString()} kg</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                      {s.calculated_fcr}
                    </span>
                  </td>
                  <td className="p-3.5 text-amber-300 font-semibold">{s.next_check_date}</td>
                  <td className="p-3.5 text-slate-400 italic">{s.remarks || '-'}</td>
                  {isAdmin && (
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => onOpenModal('sampling', { editItem: s })}
                        title="সম্পাদনা করুন"
                        className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer transition mr-1"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSampling(s.id)}
                        title="মুছে ফেলুন"
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
