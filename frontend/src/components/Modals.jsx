import React, { useState, useEffect } from 'react';
import { X, Send, Plus, Scale, Package, DollarSign, Utensils, Calendar, Edit3, Trash2, CheckCircle2 } from 'lucide-react';
import { 
  addStocking, updateStocking, 
  addFeedBatch, updateFeedBatch,
  recordDailyFeeding, updateDailyFeeding, 
  recordGrowth, updateGrowth,
  addExpense, updateExpense,
  recordHarvest, updateHarvest,
  addVaatPrep 
} from '../api';

export default function Modals({ modalType, modalProps, onClose, onSuccess, ponds }) {
  if (!modalType) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-3xl p-5 sm:p-6 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {modalType === 'feed' && (
          <FeedModal ponds={ponds} initialPond={modalProps?.pond_id} editItem={modalProps?.editItem} onClose={onClose} onSuccess={onSuccess} />
        )}

        {modalType === 'sampling' && (
          <SamplingModal ponds={ponds} initialPond={modalProps?.pond_id} editItem={modalProps?.editItem} onClose={onClose} onSuccess={onSuccess} />
        )}

        {modalType === 'stocking' && (
          <StockingModal ponds={ponds} initialPond={modalProps?.pond_id} editItem={modalProps?.editItem} onClose={onClose} onSuccess={onSuccess} />
        )}

        {modalType === 'feed_inventory' && (
          <FeedInventoryModal editItem={modalProps?.editItem} onClose={onClose} onSuccess={onSuccess} />
        )}

        {modalType === 'expense' && (
          <ExpenseModal ponds={ponds} editItem={modalProps?.editItem} onClose={onClose} onSuccess={onSuccess} />
        )}

        {modalType === 'harvest' && (
          <HarvestModal ponds={ponds} editItem={modalProps?.editItem} onClose={onClose} onSuccess={onSuccess} />
        )}

        {modalType === 'vaat' && (
          <VaatModal editItem={modalProps?.editItem} onClose={onClose} onSuccess={onSuccess} />
        )}
      </div>
    </div>
  );
}

// 1. Daily Feeding Modal (Supports Any Past Date, Bag Count, & Edit Mode)
function FeedModal({ ponds, initialPond, editItem, onClose, onSuccess }) {
  const isEdit = !!editItem;
  const [formData, setFormData] = useState({
    pond_id: editItem?.pond_id || initialPond || 1,
    date: editItem?.date || new Date().toISOString().slice(0, 10),
    commercial_feed_bags: editItem?.commercial_feed_bags ?? 2.5,
    commercial_feed_kg: editItem?.commercial_feed_kg ?? 62.5,
    vaat_kg: editItem?.vaat_kg ?? 0.0,
    feeding_time: editItem?.feeding_time || 'Morning',
    weather_condition: editItem?.weather_condition || 'Sunny',
    notes: editItem?.notes || 'Feed bags logged'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await updateDailyFeeding(editItem.id, formData);
      } else {
        await recordDailyFeeding(formData);
      }
      onSuccess();
      onClose();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
        <Package className="w-5 h-5 text-teal-400" />
        <div>
          <h3 className="text-base font-bold text-white">
            {isEdit ? 'খাবারের হিসাব সম্পাদনা (Edit Daily Feed)' : 'দৈনিক খাবার এন্ট্রি (Daily Feed Entry)'}
          </h3>
          <p className="text-[11px] text-slate-400">২১/০৯/২০২৬ বা পূর্ববর্তী যেকোনো তারিখ নির্বাচন করে ব্যাগের হিসাব দিতে পারবেন</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-slate-300 font-medium block mb-1">খাবার দেওয়ার তারিখ (Date)</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:border-teal-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-slate-300 font-medium block mb-1">পুকুর নির্বাচন</label>
          <select
            value={formData.pond_id}
            onChange={(e) => setFormData({ ...formData, pond_id: parseInt(e.target.value) })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:border-teal-500 focus:outline-none"
          >
            {ponds.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-slate-300 font-medium block mb-1">বাণিজ্যিক ফিড (ব্যাগ সংখ্যা)</label>
          <input
            type="number"
            step="0.1"
            value={formData.commercial_feed_bags}
            onChange={(e) => {
              const bags = parseFloat(e.target.value) || 0;
              setFormData({ 
                ...formData, 
                commercial_feed_bags: bags, 
                commercial_feed_kg: Math.round(bags * 25.0 * 10) / 10 
              });
            }}
            placeholder="যেমন: 2.5 বা 5"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-cyan-300 font-bold text-sm focus:border-teal-500 focus:outline-none"
          />
          <span className="text-[10px] text-slate-400 mt-0.5 block">১ ব্যাগ = ২৫ কেজি</span>
        </div>
        <div>
          <label className="text-slate-300 font-medium block mb-1">মোট ফিড ওজন (কেজি)</label>
          <input
            type="number"
            step="0.5"
            value={formData.commercial_feed_kg}
            onChange={(e) => setFormData({ ...formData, commercial_feed_kg: parseFloat(e.target.value) || 0 })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-sm focus:border-teal-500 focus:outline-none"
          />
          <span className="text-[10px] text-slate-400 mt-0.5 block">স্বয়ংক্রিয় বা কাস্টম কেজি</span>
        </div>
      </div>

      <div>
        <label className="text-slate-300 font-medium block mb-1">ভাত সরবরাহ (Vaat in Kg)</label>
        <input
          type="number"
          step="1"
          value={formData.vaat_kg}
          onChange={(e) => setFormData({ ...formData, vaat_kg: parseFloat(e.target.value) || 0 })}
          placeholder="এখনও দেওয়া না হলে ০ রাখুন"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-amber-300 font-bold focus:border-teal-500 focus:outline-none"
        />
        <span className="text-[10px] text-slate-400 mt-0.5 block">বর্তমানে ০ কেজি (ভবিষ্যতে ভাত দিলে কেজি লিখবেন)</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-slate-300 font-medium block mb-1">খাবার দেওয়ার সময়</label>
          <select
            value={formData.feeding_time}
            onChange={(e) => setFormData({ ...formData, feeding_time: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
          >
            <option value="Morning">Morning (সকাল)</option>
            <option value="Afternoon">Afternoon (বিকাল)</option>
            <option value="Both">Both (সকাল ও বিকাল)</option>
          </select>
        </div>
        <div>
          <label className="text-slate-300 font-medium block mb-1">আবহাওয়া</label>
          <select
            value={formData.weather_condition}
            onChange={(e) => setFormData({ ...formData, weather_condition: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
          >
            <option value="Sunny">Sunny (রোদোজ্জ্বল)</option>
            <option value="Coastal Breeze">Coastal Breeze (উপকূলীয় বাতাস)</option>
            <option value="Cloudy">Cloudy (মেঘলা)</option>
            <option value="Rainy">Rainy (বৃষ্টি)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-slate-300 font-medium block mb-1">মন্তব্য / মাছের ফিডিং রেসপন্স</label>
        <input
          type="text"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="যেমন: দ্রুত খেয়েছে, পানির অবস্থা ভালো..."
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm shadow-lg transition"
      >
        {loading ? 'সংরক্ষণ হচ্ছে...' : (isEdit ? 'আপডেট সংরক্ষণ করুন' : 'দৈনিক খাবারের হিসাব সেভ করুন')}
      </button>
    </form>
  );
}

// 2. Stocking Event Modal (With 3-Way Bi-directional Calculator: Weight, Count & Rate)
function StockingModal({ ponds, initialPond, editItem, onClose, onSuccess }) {
  const isEdit = !!editItem;

  const [formData, setFormData] = useState({
    pond_id: editItem?.pond_id || initialPond || 1,
    date: editItem?.date || new Date().toISOString().slice(0, 10),
    fish_type: editItem?.fish_type || 'Pangash (পাঙ্গাশ পোনা)',
    count_pcs: editItem?.count_pcs || 14500,
    pcs_per_kg: editItem?.pcs_per_kg || 23.0,
    initial_weight_kg: editItem?.initial_weight_kg || 675.0,
    cost_bdt: editItem?.cost_bdt || 40600,
    supplier: editItem?.supplier || 'Hatchery Supplier',
    notes: editItem?.notes || '৬৭৫ কেজি পোনা @ ২৩ পিস/কেজি = +-১৪,৫০০ পিস'
  });
  const [loading, setLoading] = useState(false);

  // Bi-directional calculations:
  // 1. When Total Weight changes -> compute Count = Weight * Pcs/kg
  const handleWeightChange = (wt) => {
    const rate = formData.pcs_per_kg > 0 ? formData.pcs_per_kg : 1;
    const computedCount = Math.round(wt * rate);
    setFormData({
      ...formData,
      initial_weight_kg: wt,
      count_pcs: computedCount
    });
  };

  // 2. When Pcs/kg changes -> compute Count = Weight * Pcs/kg
  const handleRateChange = (rate) => {
    const wt = formData.initial_weight_kg > 0 ? formData.initial_weight_kg : 0;
    const computedCount = wt > 0 ? Math.round(wt * rate) : formData.count_pcs;
    setFormData({
      ...formData,
      pcs_per_kg: rate,
      count_pcs: computedCount
    });
  };

  // 3. When Count changes -> compute Weight = Count / Pcs/kg
  const handleCountChange = (count) => {
    const rate = formData.pcs_per_kg > 0 ? formData.pcs_per_kg : 1;
    const computedWeight = Math.round((count / rate) * 10) / 10;
    setFormData({
      ...formData,
      count_pcs: count,
      initial_weight_kg: computedWeight
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await updateStocking(editItem.id, formData);
      } else {
        await addStocking(formData);
      }
      onSuccess();
      onClose();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
        <Scale className="w-5 h-5 text-teal-400" />
        <div>
          <h3 className="text-base font-bold text-white">
            {isEdit ? 'পোনা মজুদের তথ্য সম্পাদনা (Edit Stock)' : 'পুকুরে পোনা ছাড়ার হিসাব (Stock Fish)'}
          </h3>
          <p className="text-[11px] text-teal-300">
            💡 ওজন (৬৭৫ কেজি) এবং রেট (২৩ পিস/কেজি) দিলে সংখ্যা স্বয়ংক্রিয় হিসাব হয়
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-slate-300 font-medium block mb-1">পোনা ছাড়ার তারিখ</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
          />
        </div>
        <div>
          <label className="text-slate-300 font-medium block mb-1">পুকুর</label>
          <select
            value={formData.pond_id}
            onChange={(e) => setFormData({ ...formData, pond_id: parseInt(e.target.value) })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
          >
            {ponds.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-slate-300 font-medium block mb-1">মাছের জাত ও বিবরণ</label>
        <input
          type="text"
          value={formData.fish_type}
          onChange={(e) => setFormData({ ...formData, fish_type: e.target.value })}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
        />
      </div>

      {/* 3-WAY BI-DIRECTIONAL STOCKING CALCULATOR */}
      <div className="p-3.5 rounded-2xl bg-slate-950 border border-teal-500/30 space-y-3">
        <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider block">
          পোনা পরিমাপ ক্যালকুলেটর (Weight & Count Auto-Sync):
        </span>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[11px] text-slate-300 block mb-1">মোট ওজন (কেজি)</label>
            <input
              type="number"
              step="0.1"
              value={formData.initial_weight_kg}
              onChange={(e) => handleWeightChange(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-amber-300 font-bold text-sm focus:border-teal-500"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-300 block mb-1">কেজিতে পিস (Rate)</label>
            <input
              type="number"
              step="0.1"
              value={formData.pcs_per_kg}
              onChange={(e) => handleRateChange(parseFloat(e.target.value) || 1)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-teal-300 font-bold text-sm focus:border-teal-500"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-300 block mb-1">মোট পিস সংখ্যা</label>
            <input
              type="number"
              value={formData.count_pcs}
              onChange={(e) => handleCountChange(parseInt(e.target.value) || 0)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-white font-bold text-sm focus:border-teal-500"
            />
          </div>
        </div>

        <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
          হিসাব: <strong>{formData.initial_weight_kg} kg</strong> × <strong>{formData.pcs_per_kg} pcs/kg</strong> = <strong className="text-teal-300">{Number(formData.count_pcs).toLocaleString()} pcs</strong> মাছ
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-slate-300 font-medium block mb-1">পোনা ক্রয়মূল্য (BDT)</label>
          <input
            type="number"
            value={formData.cost_bdt}
            onChange={(e) => setFormData({ ...formData, cost_bdt: parseFloat(e.target.value) || 0 })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
          />
        </div>
        <div>
          <label className="text-slate-300 font-medium block mb-1">হ্যাচারি / সরবরাহকারী</label>
          <input
            type="text"
            value={formData.supplier}
            onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
          />
        </div>
      </div>

      <div>
        <label className="text-slate-300 font-medium block mb-1">মন্তব্য / রেফারেন্স</label>
        <input
          type="text"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm transition"
      >
        {loading ? 'সংরক্ষণ হচ্ছে...' : (isEdit ? 'আপডেট সম্পন্ন করুন' : 'পোনা মজুদের তথ্য সংরক্ষণ করুন')}
      </button>
    </form>
  );
}

// 3. Growth Sampling Modal (With Edit Support)
function SamplingModal({ ponds, initialPond, editItem, onClose, onSuccess }) {
  const isEdit = !!editItem;

  const [formData, setFormData] = useState({
    pond_id: editItem?.pond_id || initialPond || 1,
    date: editItem?.date || new Date().toISOString().slice(0, 10),
    fish_type: editItem?.fish_type || 'Pangash',
    sample_count_pcs: editItem?.sample_count_pcs || 50,
    total_sample_weight_kg: editItem?.total_sample_weight_kg || 4.2,
    estimated_survival_pct: editItem?.estimated_survival_pct || 95.0,
    remarks: editItem?.remarks || '১৫-১৮ দিনের নিয়মিত বৃদ্ধি পর্যবেক্ষণ।'
  });
  const [loading, setLoading] = useState(false);

  const pcs_per_kg = formData.total_sample_weight_kg > 0 ? (formData.sample_count_pcs / formData.total_sample_weight_kg).toFixed(1) : 0;
  const avg_grams = formData.sample_count_pcs > 0 ? ((formData.total_sample_weight_kg * 1000) / formData.sample_count_pcs).toFixed(1) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await updateGrowth(editItem.id, formData);
      } else {
        await recordGrowth(formData);
      }
      onSuccess();
      onClose();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
        <Scale className="w-5 h-5 text-teal-400" />
        <h3 className="text-base font-bold text-white">
          {isEdit ? 'স্যাম্পলিং রেকর্ড সম্পাদনা' : '১৫-১৮ দিনের বৃদ্ধি স্যাম্পলিং'}
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-slate-400 block mb-1">তারিখ</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
          />
        </div>
        <div>
          <label className="text-slate-400 block mb-1">পুকুর</label>
          <select
            value={formData.pond_id}
            onChange={(e) => setFormData({ ...formData, pond_id: parseInt(e.target.value) })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
          >
            {ponds.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-slate-400 block mb-1">জালে ওঠা মাছের পিস</label>
          <input
            type="number"
            value={formData.sample_count_pcs}
            onChange={(e) => setFormData({ ...formData, sample_count_pcs: parseInt(e.target.value) || 0 })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
          />
        </div>
        <div>
          <label className="text-slate-400 block mb-1">নমুনার মোট ওজন (কেজি)</label>
          <input
            type="number"
            step="0.01"
            value={formData.total_sample_weight_kg}
            onChange={(e) => setFormData({ ...formData, total_sample_weight_kg: parseFloat(e.target.value) || 0 })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
          />
        </div>
      </div>

      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
        <div>
          <span className="text-slate-400 block text-[11px]">কেজিতে পিস</span>
          <span className="font-bold text-teal-300 text-sm">{pcs_per_kg} pcs/kg</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px]">গড় ওজন (ABW)</span>
          <span className="font-bold text-cyan-300 text-sm">{avg_grams} গ্রাম</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px]">পরবর্তী চেক</span>
          <span className="font-bold text-amber-300 text-xs">+১৬ দিন পর</span>
        </div>
      </div>

      <div>
        <label className="text-slate-400 block mb-1">মন্তব্য</label>
        <input
          type="text"
          value={formData.remarks}
          onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm transition"
      >
        {loading ? 'সংরক্ষণ হচ্ছে...' : (isEdit ? 'আপডেট সেভ করুন' : 'বৃদ্ধি স্যাম্পলিং সংরক্ষণ করুন')}
      </button>
    </form>
  );
}

// 4. Feed Inventory Modal (With Edit Support)
function FeedInventoryModal({ editItem, onClose, onSuccess }) {
  const isEdit = !!editItem;

  const [formData, setFormData] = useState({
    date: editItem?.date || new Date().toISOString().slice(0, 10),
    brand_name: editItem?.brand_name || 'Fish Feed (Batch #202)',
    feed_type: editItem?.feed_type || 'Pellet Feed - Batch 202',
    bag_count: editItem?.bag_count || 100,
    bag_weight_kg: editItem?.bag_weight_kg || 25.0,
    rate_per_bag: editItem?.rate_per_bag || 1875,
    supplier: editItem?.supplier || 'Feed Distributor, Chittagong',
    invoice_no: editItem?.invoice_no || 'BATCH-202',
    notes: editItem?.notes || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await updateFeedBatch(editItem.id, formData);
      } else {
        await addFeedBatch(formData);
      }
      onSuccess();
      onClose();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
        <Package className="w-5 h-5 text-cyan-400" />
        <h3 className="text-base font-bold text-white">
          {isEdit ? 'ফিড চালান সম্পাদনা (Edit Batch)' : 'নতুন ফিড চালান যোগ করুন (Feed Batch)'}
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-slate-400 block mb-1">চালানের তারিখ</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
          />
        </div>
        <div>
          <label className="text-slate-400 block mb-1">ব্যাচ / ইনভয়েস নং</label>
          <input
            type="text"
            value={formData.invoice_no}
            onChange={(e) => setFormData({ ...formData, invoice_no: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
          />
        </div>
      </div>

      <div>
        <label className="text-slate-400 block mb-1">ফিড ব্র্যান্ড ও ধরণ</label>
        <input
          type="text"
          value={formData.brand_name}
          onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-slate-400 block mb-1">ব্যাগের সংখ্যা</label>
          <input
            type="number"
            value={formData.bag_count}
            onChange={(e) => setFormData({ ...formData, bag_count: parseInt(e.target.value) || 0 })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-cyan-300 font-bold"
          />
        </div>
        <div>
          <label className="text-slate-400 block mb-1">প্রতি ব্যাগের রেট (BDT)</label>
          <input
            type="number"
            value={formData.rate_per_bag}
            onChange={(e) => setFormData({ ...formData, rate_per_bag: parseFloat(e.target.value) || 0 })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
          />
        </div>
      </div>

      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center text-xs">
        <span className="text-slate-400">মোট মূল্য:</span>
        <span className="font-bold text-emerald-400 text-sm">
          ৳ {(formData.bag_count * formData.rate_per_bag).toLocaleString()}
        </span>
      </div>

      <div>
        <label className="text-slate-400 block mb-1">সরবরাহকারী (Supplier)</label>
        <input
          type="text"
          value={formData.supplier}
          onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm transition"
      >
        {loading ? 'সংরক্ষণ হচ্ছে...' : (isEdit ? 'আপডেট সংরক্ষণ করুন' : 'ফিড চালান সেভ করুন')}
      </button>
    </form>
  );
}

// 5. Expense Modal (With Edit Support)
function ExpenseModal({ ponds, editItem, onClose, onSuccess }) {
  const isEdit = !!editItem;

  const [formData, setFormData] = useState({
    date: editItem?.date || new Date().toISOString().slice(0, 10),
    pond_id: editItem?.pond_id || null,
    category: editItem?.category || 'Medicine & Lime',
    amount_bdt: editItem?.amount_bdt || 2730,
    description: editItem?.description || 'Medicine 4L for fish health',
    voucher_no: editItem?.voucher_no || 'MED-2109'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await updateExpense(editItem.id, formData);
      } else {
        await addExpense(formData);
      }
      onSuccess();
      onClose();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
        <DollarSign className="w-5 h-5 text-amber-400" />
        <h3 className="text-base font-bold text-white">
          {isEdit ? 'খরচের ভাউচার সম্পাদনা (Edit Expense)' : 'নতুন খরচ এন্ট্রি (Add Expense)'}
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-slate-400 block mb-1">তারিখ</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
          />
        </div>
        <div>
          <label className="text-slate-400 block mb-1">খরচের খাত</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
          >
            <option value="Feed Purchase">Feed Purchase (ফিড ক্রয়)</option>
            <option value="Medicine & Lime">Medicine & Lime (ওষুধ ও চুন)</option>
            <option value="Electricity & Fuel">Electricity & Fuel (বিদ্যুৎ ও ডিজেল)</option>
            <option value="Labor Wages">Labor Wages (শ্রমিক বেতন)</option>
            <option value="Rice / Vaat">Rice / Vaat (ভাত ও চাল খরচ)</option>
            <option value="Maintenance">Maintenance (মেরামত)</option>
            <option value="Misc">Misc (অন্যান্য)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-slate-400 block mb-1">টাকার পরিমাণ (BDT)</label>
        <input
          type="number"
          value={formData.amount_bdt}
          onChange={(e) => setFormData({ ...formData, amount_bdt: parseFloat(e.target.value) || 0 })}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-sm"
        />
      </div>

      <div>
        <label className="text-slate-400 block mb-1">খরচের বিবরণ</label>
        <input
          type="text"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
        />
      </div>

      <div>
        <label className="text-slate-400 block mb-1">ভাউচার / রসিদ নং</label>
        <input
          type="text"
          value={formData.voucher_no}
          onChange={(e) => setFormData({ ...formData, voucher_no: e.target.value })}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm transition"
      >
        {loading ? 'সংরক্ষণ হচ্ছে...' : (isEdit ? 'আপডেট সেভ করুন' : 'খরচ সংরক্ষণ করুন')}
      </button>
    </form>
  );
}

// 6. Harvest Modal
function HarvestModal({ ponds, editItem, onClose, onSuccess }) {
  const isEdit = !!editItem;

  const [formData, setFormData] = useState({
    date: editItem?.date || new Date().toISOString().slice(0, 10),
    pond_id: editItem?.pond_id || 1,
    fish_type: editItem?.fish_type || 'Pangash',
    total_weight_kg: editItem?.total_weight_kg || 1200,
    rate_per_kg_bdt: editItem?.rate_per_kg_bdt || 155,
    buyer_name: editItem?.buyer_name || 'Chittagong Fish Market',
    notes: editItem?.notes || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await updateHarvest(editItem.id, formData);
      } else {
        await recordHarvest(formData);
      }
      onSuccess();
      onClose();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
        <DollarSign className="w-5 h-5 text-emerald-400" />
        <h3 className="text-base font-bold text-white">
          {isEdit ? 'মাছ বিক্রয় রেকর্ড সম্পাদনা' : 'মাছ বিক্রি / হার্ভেস্ট রেকর্ড (Fish Sale)'}
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-slate-400 block mb-1">তারিখ</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
          />
        </div>
        <div>
          <label className="text-slate-400 block mb-1">পুকুর</label>
          <select
            value={formData.pond_id}
            onChange={(e) => setFormData({ ...formData, pond_id: parseInt(e.target.value) })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
          >
            {ponds.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-slate-400 block mb-1">মোট ওজন (কেজি)</label>
          <input
            type="number"
            value={formData.total_weight_kg}
            onChange={(e) => setFormData({ ...formData, total_weight_kg: parseFloat(e.target.value) || 0 })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
          />
        </div>
        <div>
          <label className="text-slate-400 block mb-1">বিক্রয় দর (টাকা/কেজি)</label>
          <input
            type="number"
            value={formData.rate_per_kg_bdt}
            onChange={(e) => setFormData({ ...formData, rate_per_kg_bdt: parseFloat(e.target.value) || 0 })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-bold"
          />
        </div>
      </div>

      <div>
        <label className="text-slate-400 block mb-1">আড়তদার / ক্রেতার নাম</label>
        <input
          type="text"
          value={formData.buyer_name}
          onChange={(e) => setFormData({ ...formData, buyer_name: e.target.value })}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
        />
      </div>

      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center text-xs">
        <span className="text-slate-400">মোট বিক্রয় মূল্য:</span>
        <span className="font-bold text-emerald-400 text-sm">
          ৳ {(formData.total_weight_kg * formData.rate_per_kg_bdt).toLocaleString()}
        </span>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition"
      >
        {loading ? 'সংরক্ষণ হচ্ছে...' : (isEdit ? 'আপডেট সেভ করুন' : 'বিক্রি রেকর্ড সম্পন্ন করুন')}
      </button>
    </form>
  );
}

// 7. Vaat Modal
function VaatModal({ editItem, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    raw_rice_kg: 100,
    rice_cost_bdt: 3800,
    cooking_fuel_cost_bdt: 500,
    total_cooked_vaat_kg: 250,
    notes: 'Cooked vaat batch'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addVaatPrep(formData);
      onSuccess();
      onClose();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
        <Utensils className="w-5 h-5 text-amber-400" />
        <h3 className="text-base font-bold text-white">ভাত রান্না ও সরবরাহ এন্ট্রি</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-slate-400 block mb-1">তারিখ</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
          />
        </div>
        <div>
          <label className="text-slate-400 block mb-1">কাঁচা চাল (কেজি)</label>
          <input
            type="number"
            value={formData.raw_rice_kg}
            onChange={(e) => {
              const kg = parseFloat(e.target.value) || 0;
              setFormData({ 
                ...formData, 
                raw_rice_kg: kg, 
                rice_cost_bdt: kg * 38,
                total_cooked_vaat_kg: kg * 2.5 
              });
            }}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-slate-400 block mb-1">চালের খরচ (BDT)</label>
          <input
            type="number"
            value={formData.rice_cost_bdt}
            onChange={(e) => setFormData({ ...formData, rice_cost_bdt: parseFloat(e.target.value) || 0 })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
          />
        </div>
        <div>
          <label className="text-slate-400 block mb-1">জ্বালানি/গ্যাস খরচ (BDT)</label>
          <input
            type="number"
            value={formData.cooking_fuel_cost_bdt}
            onChange={(e) => setFormData({ ...formData, cooking_fuel_cost_bdt: parseFloat(e.target.value) || 0 })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
          />
        </div>
      </div>

      <div>
        <label className="text-slate-400 block mb-1">রান্না হওয়া ভাত (কেজি)</label>
        <input
          type="number"
          value={formData.total_cooked_vaat_kg}
          onChange={(e) => setFormData({ ...formData, total_cooked_vaat_kg: parseFloat(e.target.value) || 0 })}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-amber-300 font-bold"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm transition"
      >
        {loading ? 'সংরক্ষণ হচ্ছে...' : 'ভাতের হিসাব জমা দিন'}
      </button>
    </form>
  );
}
