import React, { useState } from 'react';
import { HardHat, CheckCircle2, Plus, Minus, Send, Waves, Utensils, Package, Calendar } from 'lucide-react';
import { workerQuickEntry } from '../api';

export default function WorkerInput({ ponds, onEntrySaved }) {
  const getTodayDate = () => new Date().toLocaleDateString('en-CA');

  const [formData, setFormData] = useState({
    pond_id: 1,
    date: getTodayDate(),
    commercial_feed_bags: 2.0,
    commercial_feed_kg: 50.0,
    vaat_kg: 30.0,
    feeding_time: 'Morning (সকাল)',
    weather_condition: 'Sunny (রোদ)',
    notes: 'মাছ সুস্থ ও স্বাভাবিকভাবে খাবার খেয়েছে।'
  });

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleBagChange = (delta) => {
    const newBags = Math.max(0, Math.round((formData.commercial_feed_bags + delta) * 10) / 10);
    setFormData({
      ...formData,
      commercial_feed_bags: newBags,
      commercial_feed_kg: Math.round(newBags * 25)
    });
  };

  const handleVaatChange = (delta) => {
    const newVaat = Math.max(0, formData.vaat_kg + delta);
    setFormData({
      ...formData,
      vaat_kg: newVaat
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    try {
      await workerQuickEntry({
        pond_id: formData.pond_id,
        date: formData.date || getTodayDate(),
        commercial_feed_bags: formData.commercial_feed_bags,
        commercial_feed_kg: formData.commercial_feed_kg,
        vaat_kg: formData.vaat_kg,
        feeding_time: formData.feeding_time,
        weather_condition: formData.weather_condition,
        logged_by: 'Field Worker (মোবাইল)',
        notes: formData.notes
      });
      setSuccessMsg('✅ সফলভাবে খাবার ও তথ্য রেকর্ড হয়েছে!');
      if (onEntrySaved) onEntrySaved();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert("Error saving record: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-5 pb-24 md:pb-8">
      {/* Top Banner */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
            <HardHat className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-base">মাঠ কর্মী সহজ মোড (Worker Quick Input)</h2>
            <p className="text-xs text-amber-200">মোবাইল থেকে সরাসরি ১ ক্লিকে দৈনিক খাবার ও খামারের তথ্য দিন</p>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500 text-emerald-300 text-sm font-semibold flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Step 0: Date Selection */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-teal-600" />
            খাবার দেওয়ার তারিখ (Date)
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-none focus:border-teal-500 shadow-sm text-sm"
          />
        </div>

        {/* Step 1: Select Pond */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Waves className="w-4 h-4 text-teal-400" />
            ১. পুকুর নির্বাচন করুন (Select Pond)
          </label>

          <div className="grid grid-cols-2 gap-3 pt-1">
            {[
              { id: 1, name: 'Pond 1 (পুকুর ১)', sub: 'কার্প + পাঙ্গাশ (16k pcs)' },
              { id: 2, name: 'Pond 2 (পুকুর ২)', sub: 'পাঙ্গাশ ৩ চালান (52k pcs)' },
            ].map((p) => {
              const isSelected = formData.pond_id === p.id;
              return (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setFormData({ ...formData, pond_id: p.id })}
                  className={`p-3.5 rounded-xl border text-left transition ${
                    isSelected
                      ? 'bg-teal-500/20 border-teal-500 text-white shadow-md ring-1 ring-teal-500'
                      : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="font-bold text-sm">{p.name}</div>
                  <div className="text-[11px] text-teal-400 mt-0.5">{p.sub}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Commercial Feed Bags Stepper */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-4 h-4 text-cyan-400" />
              ২. বাণিজ্যিক ফিড ব্যাগ (Commercial Feed Bags)
            </label>
            <span className="text-xs text-slate-400 font-medium">{formData.commercial_feed_kg} কেজি</span>
          </div>

          <div className="flex items-center justify-between gap-3 bg-white/90 p-3 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => handleBagChange(-0.5)}
              className="w-14 h-14 rounded-xl bg-slate-100 hover:bg-slate-700 text-white flex items-center justify-center text-xl font-bold transition shadow-inner active:scale-95"
            >
              <Minus className="w-6 h-6" />
            </button>

            <div className="text-center">
              <span className="text-3xl font-extrabold text-slate-900 block">
                {formData.commercial_feed_bags}
              </span>
              <span className="text-[11px] text-cyan-300 font-medium">ব্যাগ (১ ব্যাগ = ২৫ কেজি)</span>
            </div>

            <button
              type="button"
              onClick={() => handleBagChange(0.5)}
              className="w-14 h-14 rounded-xl bg-teal-600 hover:bg-teal-500 text-white flex items-center justify-center text-xl font-bold transition shadow-md active:scale-95"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Step 3: Vaat (Cooked Rice) Stepper */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Utensils className="w-4 h-4 text-amber-400" />
            ৩. ভাত দেওয়া হয়েছে (Vaat Provided in Kg)
          </label>

          <div className="flex items-center justify-between gap-3 bg-white/90 p-3 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => handleVaatChange(-5)}
              className="w-14 h-14 rounded-xl bg-slate-100 hover:bg-slate-700 text-white flex items-center justify-center text-xl font-bold transition active:scale-95"
            >
              -৫
            </button>

            <div className="text-center">
              <span className="text-3xl font-extrabold text-amber-300 block">
                {formData.vaat_kg}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">কেজি রান্না করা ভাত</span>
            </div>

            <button
              type="button"
              onClick={() => handleVaatChange(5)}
              className="w-14 h-14 rounded-xl bg-amber-600 hover:bg-amber-500 text-white flex items-center justify-center text-xl font-bold transition shadow-md active:scale-95"
            >
              +৫
            </button>
          </div>
        </div>

        {/* Step 4: Time & Condition */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200">
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">খাবার দেওয়ার সময়</label>
            <select
              value={formData.feeding_time}
              onChange={(e) => setFormData({ ...formData, feeding_time: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 text-xs rounded-xl px-2.5 py-2 text-slate-800 font-medium focus:outline-none focus:border-teal-500"
            >
              <option value="Morning (সকাল)">Morning (সকাল)</option>
              <option value="Afternoon (বিকাল)">Afternoon (বিকাল)</option>
              <option value="Both (সকাল ও বিকাল)">Both (সকাল ও বিকাল)</option>
            </select>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200">
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">আবহাওয়ার অবস্থা</label>
            <select
              value={formData.weather_condition}
              onChange={(e) => setFormData({ ...formData, weather_condition: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 text-xs rounded-xl px-2.5 py-2 text-slate-800 font-medium focus:outline-none focus:border-teal-500"
            >
              <option value="Sunny (রোদ)">Sunny (রোদোজ্জ্বল)</option>
              <option value="Cloudy (মেঘলা)">Cloudy (মেঘলা)</option>
              <option value="Rainy (বৃষ্টি)">Rainy (বৃষ্টি)</option>
            </select>
          </div>
        </div>

        {/* Step 5: Quick Notes / Fish observation */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-2">
          <label className="text-[11px] font-semibold text-slate-400 block">মাছের প্রতিক্রিয়া ও অন্যান্য নোট</label>
          <input
            type="text"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="মাছের খাদক কেমন ছিল, কোন সমস্যা আছে কিনা..."
            className="w-full bg-slate-50 border border-slate-300 text-xs rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-teal-500"
          />
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[
              "খুব দ্রুত সব খাবার শেষ করেছে",
              "সব মাছ স্বাভাবিক ও সুস্থ",
              "পানিতে অক্সিজেন ভালো",
              "কিছু খাবার বাকি ছিল"
            ].map((tag) => (
              <button
                type="button"
                key={tag}
                onClick={() => setFormData({ ...formData, notes: tag })}
                className="text-[11px] px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-medium transition cursor-pointer"
              >
                + {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-base shadow-xl flex items-center justify-center gap-2 active:scale-98 transition disabled:opacity-50"
        >
          {loading ? 'সংরক্ষণ হচ্ছে...' : (
            <>
              <Send className="w-5 h-5" /> তথ্য জমা দিন (Submit Record)
            </>
          )}
        </button>
      </form>
    </div>
  );
}
