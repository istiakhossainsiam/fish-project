import React, { useState } from 'react';
import { 
  X, Plus, Trash2, Calendar, Package, DollarSign, 
  Scale, FileSpreadsheet, CheckCircle2, AlertCircle, Copy, ArrowDown 
} from 'lucide-react';
import { bulkAddDailyFeedings, bulkAddExpenses, bulkAddGrowth } from '../api';

const getTodayDate = () => new Date().toLocaleDateString('en-CA');

export default function BulkEntryModals({ modalType, modalProps, onClose, onSuccess, ponds = [] }) {
  if (!modalType || !['bulk_feed', 'bulk_expense', 'bulk_sampling'].includes(modalType)) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200 w-full max-w-5xl rounded-3xl p-4 sm:p-6 shadow-2xl relative my-6 text-slate-800 max-h-[92vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-800 rounded-xl bg-slate-100 hover:bg-slate-200 cursor-pointer transition z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {modalType === 'bulk_feed' && (
          <BulkFeedForm ponds={ponds} initialPond={modalProps?.pond_id} onClose={onClose} onSuccess={onSuccess} />
        )}

        {modalType === 'bulk_expense' && (
          <BulkExpenseForm ponds={ponds} onClose={onClose} onSuccess={onSuccess} />
        )}

        {modalType === 'bulk_sampling' && (
          <BulkSamplingForm ponds={ponds} initialPond={modalProps?.pond_id} onClose={onClose} onSuccess={onSuccess} />
        )}
      </div>
    </div>
  );
}

// =========================================================================
// 1. BULK FEED ENTRY FORM
// =========================================================================
function BulkFeedForm({ ponds, initialPond, onClose, onSuccess }) {
  const defaultPondId = initialPond || (ponds && ponds.length > 0 ? ponds[0].id : 1);
  const today = getTodayDate();

  const createEmptyRow = (pondId = defaultPondId, date = today) => ({
    id: Math.random().toString(36).substr(2, 9),
    date: date,
    pond_id: pondId,
    commercial_feed_bags: 2.0,
    commercial_feed_kg: 50.0,
    vaat_kg: 0.0,
    feeding_time: 'Morning',
    weather_condition: 'Sunny',
    notes: ''
  });

  const [rows, setRows] = useState([
    createEmptyRow(1, today),
    createEmptyRow(2, today),
    createEmptyRow(1, today)
  ]);
  const [loading, setLoading] = useState(false);
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleRowChange = (id, field, value) => {
    setRows(prev => prev.map(row => {
      if (row.id !== id) return row;
      const updated = { ...row, [field]: value };
      if (field === 'commercial_feed_bags') {
        const bags = parseFloat(value) || 0;
        updated.commercial_feed_kg = Math.round(bags * 25 * 10) / 10;
      }
      return updated;
    }));
  };

  const addRow = () => {
    const lastRow = rows[rows.length - 1];
    setRows(prev => [...prev, createEmptyRow(lastRow ? lastRow.pond_id : defaultPondId, lastRow ? lastRow.date : today)]);
  };

  const removeRow = (id) => {
    if (rows.length <= 1) {
      alert("কমপক্ষে একটি সারি থাকা আবশ্যক!");
      return;
    }
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const applyTodayDateToAll = () => {
    const t = getTodayDate();
    setRows(prev => prev.map(r => ({ ...r, date: t })));
  };

  const generatePond1And2Rows = () => {
    const t = rows[0]?.date || getTodayDate();
    setRows([
      { ...createEmptyRow(1, t), commercial_feed_bags: 2.5, commercial_feed_kg: 62.5, vaat_kg: 30 },
      { ...createEmptyRow(2, t), commercial_feed_bags: 6.0, commercial_feed_kg: 150.0, vaat_kg: 75 }
    ]);
  };

  const parsePastedText = () => {
    if (!pasteText.trim()) return;
    try {
      const lines = pasteText.trim().split('\n');
      const newRows = [];
      for (const line of lines) {
        if (!line.trim() || line.startsWith('#')) continue;
        // Support Tab (Excel) or Comma (CSV)
        const parts = line.includes('\t') ? line.split('\t').map(s => s.trim()) : line.split(',').map(s => s.trim());
        if (parts.length >= 2) {
          const datePart = parts[0] || getTodayDate();
          const pondPart = parseInt(parts[1]) || defaultPondId;
          const bagsPart = parseFloat(parts[2]) || 0;
          const kgPart = parseFloat(parts[3]) || (bagsPart * 25);
          const vaatPart = parseFloat(parts[4]) || 0;
          const timePart = parts[5] || 'Morning';
          const weatherPart = parts[6] || 'Sunny';
          const notesPart = parts[7] || '';
          newRows.push({
            id: Math.random().toString(36).substr(2, 9),
            date: datePart,
            pond_id: pondPart,
            commercial_feed_bags: bagsPart,
            commercial_feed_kg: kgPart,
            vaat_kg: vaatPart,
            feeding_time: timePart,
            weather_condition: weatherPart,
            notes: notesPart
          });
        }
      }
      if (newRows.length > 0) {
        setRows(newRows);
        setShowPasteBox(false);
        setPasteText('');
      } else {
        alert("কোন বৈধ সারি পাওয়া যায়নি। অনুগ্রহ করে ফরম্যাট চেক করুন।");
      }
    } catch (e) {
      alert("পেস্ট করা ডাটা প্রসেস করতে সমস্যা: " + e.message);
    }
  };

  const totalBags = rows.reduce((s, r) => s + (parseFloat(r.commercial_feed_bags) || 0), 0);
  const totalKg = rows.reduce((s, r) => s + (parseFloat(r.commercial_feed_kg) || 0), 0);
  const totalVaat = rows.reduce((s, r) => s + (parseFloat(r.vaat_kg) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (rows.length === 0) {
      setErrorMsg("অন্তত একটি সারি পূরণ করুন");
      return;
    }
    setLoading(true);
    try {
      const entries = rows.map(r => ({
        date: r.date,
        pond_id: parseInt(r.pond_id),
        commercial_feed_bags: parseFloat(r.commercial_feed_bags) || 0,
        commercial_feed_kg: parseFloat(r.commercial_feed_kg) || 0,
        vaat_kg: parseFloat(r.vaat_kg) || 0,
        feeding_time: r.feeding_time,
        weather_condition: r.weather_condition,
        notes: r.notes || 'Bulk feeding logged'
      }));
      await bulkAddDailyFeedings(entries);
      onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200">
        <div className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
          <Package className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900">
            বাল্ক খাবার এন্ট্রি (Bulk Feed Entry)
          </h3>
          <p className="text-xs text-slate-500">
            একসাথে একাধিক দিনের বা একাধিক পুকুরের খাবারের হিসাব টেবিলে টাইপ বা এক্সেল থেকে পেস্ট করে সংরক্ষণ করুন
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={addRow}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> + সারি যোগ করুন
          </button>
          <button
            type="button"
            onClick={applyTodayDateToAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-medium transition cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-teal-600" /> আজকের তারিখ সব সারিতে
          </button>
          <button
            type="button"
            onClick={generatePond1And2Rows}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-medium transition cursor-pointer"
          >
            ⚡ পুকুর ১ ও ২ একসাথে সারি
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowPasteBox(!showPasteBox)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-teal-50 text-teal-700 border border-teal-300 font-semibold transition cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4 text-teal-600" />
          {showPasteBox ? 'পেস্ট বক্স বন্ধ করুন' : 'এক্সেল / শিট থেকে পেস্ট করুন'}
        </button>
      </div>

      {/* Paste Box Drawer */}
      {showPasteBox && (
        <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-200 space-y-2 text-xs">
          <div className="flex items-center justify-between font-bold text-slate-800">
            <span>📋 এক্সেল বা গুগল শিট থেকে কপি করে এখানে পেস্ট করুন:</span>
            <span className="text-[11px] text-teal-700 font-medium">ফরম্যাট: তারিখ, পুকুর আইডি, ব্যাগ, কেজি, ভাত কেজি, সময়, আবহাওয়া</span>
          </div>
          <textarea
            rows={4}
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={`2026-10-20, 1, 2.5, 62.5, 30, Morning, Sunny\n2026-10-20, 2, 6.0, 150.0, 75, Morning, Sunny`}
            className="w-full bg-white border border-teal-300 rounded-xl p-2.5 text-slate-800 font-mono text-xs focus:outline-none focus:border-teal-600"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={parsePastedText}
              className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-sm transition cursor-pointer flex items-center gap-1"
            >
              <ArrowDown className="w-3.5 h-3.5" /> টেবিলে ডাটা লোড করুন
            </button>
          </div>
        </div>
      )}

      {/* Table Area (Scrollable) */}
      <div className="flex-1 overflow-x-auto overflow-y-auto max-h-[50vh] rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-100/90 text-slate-700 font-bold sticky top-0 z-10 border-b border-slate-200">
            <tr>
              <th className="p-2.5 w-10 text-center">#</th>
              <th className="p-2.5 min-w-[130px]">তারিখ (Date)</th>
              <th className="p-2.5 min-w-[130px]">পুকুর (Pond)</th>
              <th className="p-2.5 min-w-[95px]">ফিড ব্যাগ</th>
              <th className="p-2.5 min-w-[95px]">ফিড কেজি</th>
              <th className="p-2.5 min-w-[85px]">ভাত কেজি</th>
              <th className="p-2.5 min-w-[100px]">সময়</th>
              <th className="p-2.5 min-w-[95px]">আবহাওয়া</th>
              <th className="p-2.5 min-w-[130px]">মন্তব্য</th>
              <th className="p-2.5 w-12 text-center">রিমুভ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, idx) => (
              <tr key={row.id} className="hover:bg-slate-50 transition">
                <td className="p-2 text-center font-bold text-slate-400">{idx + 1}</td>
                
                <td className="p-1.5">
                  <input
                    type="date"
                    value={row.date}
                    onChange={(e) => handleRowChange(row.id, 'date', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-slate-900 font-semibold focus:outline-none focus:border-teal-600"
                  />
                </td>

                <td className="p-1.5">
                  <select
                    value={row.pond_id}
                    onChange={(e) => handleRowChange(row.id, 'pond_id', parseInt(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-slate-900 font-semibold focus:outline-none focus:border-teal-600"
                  >
                    {ponds.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </td>

                <td className="p-1.5">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={row.commercial_feed_bags}
                    onChange={(e) => handleRowChange(row.id, 'commercial_feed_bags', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-slate-900 font-bold focus:outline-none focus:border-teal-600 text-center"
                  />
                </td>

                <td className="p-1.5">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={row.commercial_feed_kg}
                    onChange={(e) => handleRowChange(row.id, 'commercial_feed_kg', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-slate-800 font-medium focus:outline-none focus:border-teal-600 text-center"
                  />
                </td>

                <td className="p-1.5">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={row.vaat_kg}
                    onChange={(e) => handleRowChange(row.id, 'vaat_kg', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-slate-800 font-medium focus:outline-none focus:border-teal-600 text-center"
                  />
                </td>

                <td className="p-1.5">
                  <select
                    value={row.feeding_time}
                    onChange={(e) => handleRowChange(row.id, 'feeding_time', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-1.5 py-1.5 text-slate-800 text-xs focus:outline-none focus:border-teal-600"
                  >
                    <option value="Morning">Morning (সকাল)</option>
                    <option value="Afternoon">Afternoon (দুপুর)</option>
                    <option value="Evening">Evening (সন্ধ্যা)</option>
                    <option value="Both">Both (উভয় বেলা)</option>
                  </select>
                </td>

                <td className="p-1.5">
                  <select
                    value={row.weather_condition}
                    onChange={(e) => handleRowChange(row.id, 'weather_condition', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-1.5 py-1.5 text-slate-800 text-xs focus:outline-none focus:border-teal-600"
                  >
                    <option value="Sunny">Sunny (রোদ)</option>
                    <option value="Cloudy">Cloudy (মেঘলা)</option>
                    <option value="Rainy">Rainy (বৃষ্টি)</option>
                    <option value="Normal">Normal (স্বাভাবিক)</option>
                  </select>
                </td>

                <td className="p-1.5">
                  <input
                    type="text"
                    value={row.notes}
                    placeholder="মন্তব্য (ঐচ্ছিক)"
                    onChange={(e) => handleRowChange(row.id, 'notes', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-slate-800 text-xs focus:outline-none focus:border-teal-600"
                  />
                </td>

                <td className="p-1.5 text-center">
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    title="এই সারিটি মুছুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bottom Summary & Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200">
        <div className="flex items-center gap-3 text-xs">
          <span className="font-bold text-slate-800">মোট {rows.length} টি এন্ট্রি:</span>
          <span className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 font-bold">
            ফিড: {totalBags.toFixed(1)} ব্যাগ ({totalKg.toLocaleString()} কেজি)
          </span>
          {totalVaat > 0 && (
            <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-bold">
              ভাত: {totalVaat.toLocaleString()} কেজি
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
          >
            বাতিল
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? 'সংরক্ষণ হচ্ছে...' : `সবগুলো সংরক্ষণ করুন (${rows.length} টি রেকর্ড)`}
          </button>
        </div>
      </div>
    </form>
  );
}

// =========================================================================
// 2. BULK EXPENSE ENTRY FORM
// =========================================================================
function BulkExpenseForm({ ponds, onClose, onSuccess }) {
  const today = getTodayDate();

  const categories = [
    "Feed Purchase",
    "Rice / Vaat",
    "Pona / Stocking",
    "Medicine & Lime",
    "Electricity & Fuel",
    "Labor Wages",
    "Pond Lease",
    "Maintenance",
    "Transport",
    "Misc"
  ];

  const categoryNamesBengali = {
    "Feed Purchase": "ফিড ক্রয় (Feed Purchase)",
    "Rice / Vaat": "ভাত / চালের খরচ (Rice / Vaat)",
    "Pona / Stocking": "পোনা ক্রয় (Fingerlings)",
    "Medicine & Lime": "ওষুধ ও চুন (Medicine & Lime)",
    "Electricity & Fuel": "বিদ্যুৎ ও জ্বালানি (Electricity & Fuel)",
    "Labor Wages": "লেবার মজুরি (Labor Wages)",
    "Pond Lease": "পুকুর ইজারা (Pond Lease)",
    "Maintenance": "মেরামত ও রক্ষণাবেক্ষণ (Maintenance)",
    "Transport": "পরিবহন খরচ (Transport)",
    "Misc": "অন্যান্য সাধারণ খরচ (Misc)"
  };

  const createEmptyRow = (date = today) => ({
    id: Math.random().toString(36).substr(2, 9),
    date: date,
    pond_id: '',
    category: 'Feed Purchase',
    amount_bdt: '',
    description: '',
    voucher_no: ''
  });

  const [rows, setRows] = useState([
    createEmptyRow(today),
    createEmptyRow(today),
    createEmptyRow(today)
  ]);
  const [loading, setLoading] = useState(false);
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleRowChange = (id, field, value) => {
    setRows(prev => prev.map(row => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const addRow = () => {
    const lastRow = rows[rows.length - 1];
    setRows(prev => [...prev, createEmptyRow(lastRow ? lastRow.date : today)]);
  };

  const removeRow = (id) => {
    if (rows.length <= 1) {
      alert("কমপক্ষে একটি সারি থাকা আবশ্যক!");
      return;
    }
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const applyTodayDateToAll = () => {
    const t = getTodayDate();
    setRows(prev => prev.map(r => ({ ...r, date: t })));
  };

  const parsePastedText = () => {
    if (!pasteText.trim()) return;
    try {
      const lines = pasteText.trim().split('\n');
      const newRows = [];
      for (const line of lines) {
        if (!line.trim() || line.startsWith('#')) continue;
        const parts = line.includes('\t') ? line.split('\t').map(s => s.trim()) : line.split(',').map(s => s.trim());
        if (parts.length >= 3) {
          newRows.push({
            id: Math.random().toString(36).substr(2, 9),
            date: parts[0] || today,
            pond_id: parts[1] === 'all' || !parts[1] ? '' : parts[1],
            category: parts[2] || 'Misc',
            amount_bdt: parseFloat(parts[3]) || '',
            description: parts[4] || 'Sheet import',
            voucher_no: parts[5] || ''
          });
        }
      }
      if (newRows.length > 0) {
        setRows(newRows);
        setShowPasteBox(false);
        setPasteText('');
      } else {
        alert("কোন বৈধ সারি পাওয়া যায়নি।");
      }
    } catch (e) {
      alert("ডাটা পার্সিং ত্রুটি: " + e.message);
    }
  };

  const totalAmount = rows.reduce((s, r) => s + (parseFloat(r.amount_bdt) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const validRows = rows.filter(r => (parseFloat(r.amount_bdt) || 0) > 0);
    if (validRows.length === 0) {
      setErrorMsg("অনুগ্রহ করে অন্তত একটি খরচের টাকার পরিমাণ দিন");
      return;
    }
    setLoading(true);
    try {
      const entries = validRows.map(r => ({
        date: r.date,
        pond_id: r.pond_id ? parseInt(r.pond_id) : null,
        category: r.category,
        amount_bdt: parseFloat(r.amount_bdt),
        description: r.description || `${r.category} খরচ`,
        voucher_no: r.voucher_no || '',
        recorded_by: 'Manager (Bulk Entry)'
      }));
      await bulkAddExpenses(entries);
      onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200">
        <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
          <DollarSign className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900">
            বাল্ক খরচ এন্ট্রি (Bulk Expense Entry)
          </h3>
          <p className="text-xs text-slate-500">
            একসাথে একাধিক খরচের ভাউচার, লেবার বিল, ফিড বা চুন-ওষুধের খরচ সফটওয়্যারে এক ক্লিকে রেকর্ড করুন
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={addRow}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> + খরচের সারি যোগ
          </button>
          <button
            type="button"
            onClick={applyTodayDateToAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-medium transition cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-amber-600" /> আজকের তারিখ সব সারিতে
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowPasteBox(!showPasteBox)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-amber-50 text-amber-800 border border-amber-300 font-semibold transition cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4 text-amber-600" />
          {showPasteBox ? 'পেস্ট বক্স বন্ধ করুন' : 'এক্সেল / শিট থেকে পেস্ট করুন'}
        </button>
      </div>

      {showPasteBox && (
        <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2 text-xs">
          <div className="flex items-center justify-between font-bold text-slate-800">
            <span>📋 এক্সেল বা গুগল শিট থেকে খরচের হিসাব পেস্ট করুন:</span>
            <span className="text-[11px] text-amber-800 font-medium">ফরম্যাট: তারিখ, পুকুর আইডি, খাত, টাকার পরিমাণ, বিবরণ, ভাউচার</span>
          </div>
          <textarea
            rows={4}
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={`2026-10-22, 1, Medicine & Lime, 4500, চুন ১০০ কেজি পুকুর ১, V-012\n2026-10-22, all, Electricity & Fuel, 8200, মোটর ও এরেটর বিদ্যুৎ বিল, V-013`}
            className="w-full bg-white border border-amber-300 rounded-xl p-2.5 text-slate-800 font-mono text-xs focus:outline-none focus:border-amber-600"
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={parsePastedText}
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-sm transition cursor-pointer flex items-center gap-1"
            >
              <ArrowDown className="w-3.5 h-3.5" /> টেবিলে ডাটা লোড করুন
            </button>
          </div>
        </div>
      )}

      {/* Table Area */}
      <div className="flex-1 overflow-x-auto overflow-y-auto max-h-[50vh] rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-100/90 text-slate-700 font-bold sticky top-0 z-10 border-b border-slate-200">
            <tr>
              <th className="p-2.5 w-10 text-center">#</th>
              <th className="p-2.5 min-w-[130px]">তারিখ</th>
              <th className="p-2.5 min-w-[125px]">পুকুর</th>
              <th className="p-2.5 min-w-[170px]">খরচের খাত (Category)</th>
              <th className="p-2.5 min-w-[110px]">টাকার পরিমাণ (BDT)</th>
              <th className="p-2.5 min-w-[180px]">খরচের বিবরণ</th>
              <th className="p-2.5 min-w-[100px]">ভাউচার নং</th>
              <th className="p-2.5 w-12 text-center">রিমুভ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, idx) => (
              <tr key={row.id} className="hover:bg-slate-50 transition">
                <td className="p-2 text-center font-bold text-slate-400">{idx + 1}</td>

                <td className="p-1.5">
                  <input
                    type="date"
                    value={row.date}
                    onChange={(e) => handleRowChange(row.id, 'date', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-slate-900 font-semibold focus:outline-none focus:border-amber-600"
                  />
                </td>

                <td className="p-1.5">
                  <select
                    value={row.pond_id}
                    onChange={(e) => handleRowChange(row.id, 'pond_id', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-slate-900 font-semibold focus:outline-none focus:border-amber-600"
                  >
                    <option value="">সাধারণ খামার খরচ</option>
                    {ponds.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </td>

                <td className="p-1.5">
                  <select
                    value={row.category}
                    onChange={(e) => handleRowChange(row.id, 'category', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-slate-900 font-semibold focus:outline-none focus:border-amber-600"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{categoryNamesBengali[c] || c}</option>
                    ))}
                  </select>
                </td>

                <td className="p-1.5">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    placeholder="৳ 0.0"
                    value={row.amount_bdt}
                    onChange={(e) => handleRowChange(row.id, 'amount_bdt', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-slate-900 font-bold focus:outline-none focus:border-amber-600 text-right"
                  />
                </td>

                <td className="p-1.5">
                  <input
                    type="text"
                    placeholder="খরচের বিবরণ..."
                    value={row.description}
                    onChange={(e) => handleRowChange(row.id, 'description', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-slate-800 focus:outline-none focus:border-amber-600"
                  />
                </td>

                <td className="p-1.5">
                  <input
                    type="text"
                    placeholder="V-000"
                    value={row.voucher_no}
                    onChange={(e) => handleRowChange(row.id, 'voucher_no', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-slate-800 font-mono text-center focus:outline-none focus:border-amber-600"
                  />
                </td>

                <td className="p-1.5 text-center">
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    title="এই সারিটি মুছুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bottom Summary */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200">
        <div className="flex items-center gap-3 text-xs">
          <span className="font-bold text-slate-800">মোট {rows.length} টি খরচের সারি:</span>
          <span className="px-3 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 font-bold text-sm">
            মোট খরচ: ৳ {totalAmount.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
          >
            বাতিল
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? 'সংরক্ষণ হচ্ছে...' : `সবগুলো খরচ সংরক্ষণ করুন (${rows.filter(r => (parseFloat(r.amount_bdt) || 0) > 0).length} টি)`}
          </button>
        </div>
      </div>
    </form>
  );
}

// =========================================================================
// 3. BULK GROWTH SAMPLING FORM
// =========================================================================
function BulkSamplingForm({ ponds, initialPond, onClose, onSuccess }) {
  const defaultPondId = initialPond || (ponds && ponds.length > 0 ? ponds[0].id : 1);
  const today = getTodayDate();

  const createEmptyRow = (pondId = defaultPondId, date = today) => ({
    id: Math.random().toString(36).substr(2, 9),
    date: date,
    pond_id: pondId,
    fish_type: 'Pangash (পাঙ্গাশ)',
    sample_count_pcs: 50,
    total_sample_weight_kg: 5.0,
    calculated_fcr: 1.35,
    estimated_biomass_kg: 0,
    remarks: 'নিয়মিত ১৫-১৮ দিনের গ্রোথ স্যাম্পলিং'
  });

  const [rows, setRows] = useState([
    createEmptyRow(1, today),
    createEmptyRow(2, today)
  ]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRowChange = (id, field, value) => {
    setRows(prev => prev.map(row => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const addRow = () => {
    const lastRow = rows[rows.length - 1];
    setRows(prev => [...prev, createEmptyRow(lastRow ? lastRow.pond_id : defaultPondId, lastRow ? lastRow.date : today)]);
  };

  const removeRow = (id) => {
    if (rows.length <= 1) {
      alert("কমপক্ষে একটি সারি থাকা আবশ্যক!");
      return;
    }
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const entries = rows.map(r => ({
        date: r.date,
        pond_id: parseInt(r.pond_id),
        fish_type: r.fish_type,
        sample_count_pcs: parseInt(r.sample_count_pcs) || 50,
        total_sample_weight_kg: parseFloat(r.total_sample_weight_kg) || 5.0,
        calculated_fcr: parseFloat(r.calculated_fcr) || 1.35,
        estimated_survival_pct: 95.0,
        remarks: r.remarks || 'Bulk sampling logged'
      }));
      await bulkAddGrowth(entries);
      onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full space-y-4">
      <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200">
        <div className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
          <Scale className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900">
            বাল্ক গ্রোথ স্যাম্পলিং এন্ট্রি (Bulk Growth Sampling)
          </h3>
          <p className="text-xs text-slate-500">
            একসাথে একাধিক পুকুরের ১৫-১৮ দিনের মাছের ওজন ও গ্রোথ পরিমাপ সংরক্ষণ করুন
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {errorMsg}
        </div>
      )}

      <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-2xl border border-slate-200 text-xs">
        <button
          type="button"
          onClick={addRow}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-sm transition cursor-pointer"
        >
          <Plus className="w-4 h-4" /> + স্যাম্পলিং সারি যোগ
        </button>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-auto max-h-[50vh] rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-100/90 text-slate-700 font-bold sticky top-0 z-10 border-b border-slate-200">
            <tr>
              <th className="p-2.5 w-10 text-center">#</th>
              <th className="p-2.5 min-w-[130px]">তারিখ</th>
              <th className="p-2.5 min-w-[120px]">পুকুর</th>
              <th className="p-2.5 min-w-[120px]">মাছের জাত</th>
              <th className="p-2.5 min-w-[95px]">নমুনা পিস (Pcs)</th>
              <th className="p-2.5 min-w-[95px]">ওজন (Kg)</th>
              <th className="p-2.5 min-w-[110px]">কেজিতে পিস (হিসাব)</th>
              <th className="p-2.5 min-w-[110px]">গড় ওজন (ABW)</th>
              <th className="p-2.5 min-w-[85px]">FCR</th>
              <th className="p-2.5 min-w-[140px]">মন্তব্য</th>
              <th className="p-2.5 w-12 text-center">রিমুভ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, idx) => {
              const pcs = parseInt(row.sample_count_pcs) || 1;
              const kg = parseFloat(row.total_sample_weight_kg) || 0.1;
              const countPerKg = (pcs / kg).toFixed(1);
              const avgGrams = ((kg * 1000) / pcs).toFixed(1);

              return (
                <tr key={row.id} className="hover:bg-slate-50 transition">
                  <td className="p-2 text-center font-bold text-slate-400">{idx + 1}</td>

                  <td className="p-1.5">
                    <input
                      type="date"
                      value={row.date}
                      onChange={(e) => handleRowChange(row.id, 'date', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-slate-900 font-semibold focus:outline-none focus:border-teal-600"
                    />
                  </td>

                  <td className="p-1.5">
                    <select
                      value={row.pond_id}
                      onChange={(e) => handleRowChange(row.id, 'pond_id', parseInt(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-slate-900 font-semibold focus:outline-none focus:border-teal-600"
                    >
                      {ponds.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </td>

                  <td className="p-1.5">
                    <input
                      type="text"
                      value={row.fish_type}
                      onChange={(e) => handleRowChange(row.id, 'fish_type', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-slate-900 focus:outline-none focus:border-teal-600"
                    />
                  </td>

                  <td className="p-1.5">
                    <input
                      type="number"
                      value={row.sample_count_pcs}
                      onChange={(e) => handleRowChange(row.id, 'sample_count_pcs', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-slate-900 font-bold text-center focus:outline-none focus:border-teal-600"
                    />
                  </td>

                  <td className="p-1.5">
                    <input
                      type="number"
                      step="0.01"
                      value={row.total_sample_weight_kg}
                      onChange={(e) => handleRowChange(row.id, 'total_sample_weight_kg', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-slate-900 font-bold text-center focus:outline-none focus:border-teal-600"
                    />
                  </td>

                  <td className="p-1.5 text-center">
                    <span className="px-2 py-0.5 rounded-lg bg-teal-50 text-teal-800 font-bold border border-teal-200">
                      {countPerKg} pcs/kg
                    </span>
                  </td>

                  <td className="p-1.5 text-center">
                    <span className="px-2 py-0.5 rounded-lg bg-cyan-50 text-cyan-800 font-bold border border-cyan-200">
                      {avgGrams} গ্রাম
                    </span>
                  </td>

                  <td className="p-1.5">
                    <input
                      type="number"
                      step="0.01"
                      value={row.calculated_fcr}
                      onChange={(e) => handleRowChange(row.id, 'calculated_fcr', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-1.5 py-1.5 text-slate-900 text-center font-bold focus:outline-none focus:border-teal-600"
                    />
                  </td>

                  <td className="p-1.5">
                    <input
                      type="text"
                      value={row.remarks}
                      onChange={(e) => handleRowChange(row.id, 'remarks', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-slate-800 focus:outline-none focus:border-teal-600"
                    />
                  </td>

                  <td className="p-1.5 text-center">
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="এই সারিটি মুছুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-200">
        <span className="text-xs font-bold text-slate-700">মোট {rows.length} টি স্যাম্পলিং সারি প্রস্তুত</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
          >
            বাতিল
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? 'সংরক্ষণ হচ্ছে...' : `সবগুলো স্যাম্পলিং সংরক্ষণ করুন (${rows.length} টি)`}
          </button>
        </div>
      </div>
    </form>
  );
}
