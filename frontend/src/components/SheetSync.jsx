import React, { useState } from 'react';
import { FileSpreadsheet, Upload, Download, Printer, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { bulkImportData } from '../api';

export default function SheetSync({ onSyncComplete }) {
  const [importType, setImportType] = useState('feeding');
  const [rawText, setRawText] = useState(`2026-10-15, 1, 2.5, 62.5, 30.0, Morning, Sunny, Normal feeding
2026-10-15, 2, 6.0, 150.0, 75.0, Morning, Sunny, Good appetite
2026-10-16, 1, 2.5, 62.5, 35.0, Morning, Cloudy, Cloud cover noticed
2026-10-16, 2, 6.5, 162.5, 80.0, Morning, Cloudy, Vigorous response`);
  const [loading, setLoading] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  const handleParseAndUpload = async () => {
    setLoading(true);
    setSyncResult(null);
    try {
      const lines = rawText.trim().split('\n');
      const rows = [];

      for (const line of lines) {
        if (!line.trim() || line.startsWith('#')) continue;
        const parts = line.split(',').map(s => s.trim());
        if (parts.length >= 3) {
          if (importType === 'feeding') {
            rows.push({
              date: parts[0] || new Date().toISOString().slice(0, 10),
              pond_id: parseInt(parts[1]) || 1,
              commercial_feed_bags: parseFloat(parts[2]) || 0,
              commercial_feed_kg: parseFloat(parts[3]) || (parseFloat(parts[2]) * 25),
              vaat_kg: parseFloat(parts[4]) || 0,
              feeding_time: parts[5] || 'Morning',
              weather_condition: parts[6] || 'Normal',
              notes: parts[7] || 'Imported from physical paper sheet'
            });
          } else {
            rows.push({
              date: parts[0],
              pond_id: parseInt(parts[1]) || null,
              category: parts[2] || 'Misc',
              amount_bdt: parseFloat(parts[3]) || 0,
              description: parts[4] || 'Manual sheet import',
              voucher_no: parts[5] || 'MANUAL-SHEET'
            });
          }
        }
      }

      if (rows.length === 0) {
        alert("কোন বৈধ ডাটা পাওয়া যায়নি। অনুগ্রহ করে নমুনা ফরম্যাট চেক করুন।");
        setLoading(false);
        return;
      }

      const res = await bulkImportData({ type: importType, rows });
      setSyncResult(res);
      if (onSyncComplete) onSyncComplete();
    } catch (err) {
      alert("Error syncing sheet: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintTemplate = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-teal-400" />
            ম্যানুয়াল শিট ও বাল্ক ডাটা সিঙ্ক (Sheet Sync & Bulk Import)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            মাঠের কর্মীদের কাগজের খাতা বা এক্সেল শিট থেকে এক ক্লিকে সফটওয়্যারে তথ্য আপডেট করুন
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintTemplate}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-700 text-teal-300 border border-slate-200 text-xs font-medium transition"
          >
            <Printer className="w-4 h-4" /> খাতার প্রিন্ট ফরম্যাট
          </button>
        </div>
      </div>

      {/* Step Explanation Banner */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 text-xs text-slate-300">
        <h3 className="font-bold text-slate-900 text-sm">💡 কিভাবে শিট থেকে সফটওয়্যারে সিঙ্ক করবেন?</h3>
        <ol className="list-decimal pl-5 space-y-1 text-slate-300">
          <li><strong>১ম ধাপ:</strong> খামারের কর্মীরা প্রতিদিন পুকুরপাড়ে কাগজের রেজিস্টার খাতা বা এক্সেলে খাবার ও খরচের হিসাব লিখে রাখে।</li>
          <li><strong>২য় ধাপ:</strong> ম্যানেজার বা অ্যাডমিন সপ্তাহে বা দিনে একবার সেই এক্সেল ফাইল বা কমা-সেপারেটেড (CSV) টেক্সট নিচের বক্সে পেস্ট করে।</li>
          <li><strong>৩য় ধাপ:</strong> <span className="text-teal-300 font-semibold">"সফটওয়্যারে সিঙ্ক করুন"</span> বাটনে চাপ দিলে সমস্ত তথ্য ডাটাবেজে স্টোর হয়ে যাবে এবং লাইভ ড্যাশবোর্ড আপডেট হবে।</li>
        </ol>
      </div>

      {syncResult && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500 text-emerald-300 text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          {syncResult.message} ({syncResult.imported_count} টি রেকর্ড সফলভাবে সফটওয়্যারে আপডেট হয়েছে)
        </div>
      )}

      {/* Main Sync Tool Box */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">ডাটার ধরণ:</span>
            <div className="flex bg-white rounded-xl p-1 border border-slate-200">
              <button
                onClick={() => setImportType('feeding')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  importType === 'feeding' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                খাবার রেজিস্টার (Daily Feeding)
              </button>
              <button
                onClick={() => setImportType('expenses')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  importType === 'expenses' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ব্যয়ের খাতা (Expenses)
              </button>
            </div>
          </div>

          <button
            onClick={() => {
              if (importType === 'feeding') {
                setRawText(`2026-10-17, 1, 2.5, 62.5, 30.0, Morning, Sunny, Responsive
2026-10-17, 2, 6.0, 150.0, 70.0, Morning, Sunny, Normal
2026-10-18, 1, 2.5, 62.5, 35.0, Morning, Clear, Feed completed`);
              } else {
                setRawText(`2026-10-16, 1, Medicine & Lime, 4500, Lime 100kg application, V-0144
2026-10-17, 2, Maintenance, 3200, Aerator servicing, V-0145`);
              }
            }}
            className="text-xs text-teal-400 hover:text-teal-300 font-medium"
          >
            + নমুনা ডাটা লোড করুন (Load Sample)
          </button>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-300 block mb-1.5">
            এক্সেল বা শিট থেকে কমা (CSV) আকারে পেস্ট করুন:
          </label>
          <div className="text-[11px] text-slate-400 mb-2 font-mono bg-slate-50 p-2 rounded-lg border border-slate-200">
            {importType === 'feeding' 
              ? 'ফরম্যাট: তারিখ, পুকুর_আইডি (1 বা 2), ফিড_ব্যাগ, ফিড_কেজি, ভাত_কেজি, সময়, আবহাওয়া, মন্তব্য'
              : 'ফরম্যাট: তারিখ, পুকুর_আইডি (বা খালি), খাত_নাম, টাকার_পরিমাণ, বিবরণ, ভাউচার_নং'
            }
          </div>
          <textarea
            rows={7}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-teal-500 leading-relaxed"
            placeholder="2026-10-15, 1, 2.5, 62.5, 30.0, Morning, Sunny, Feed ok..."
          />
        </div>

        <button
          onClick={handleParseAndUpload}
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition disabled:opacity-50"
        >
          {loading ? 'ডাটা সিঙ্ক হচ্ছে...' : (
            <>
              <Upload className="w-4 h-4" /> সফটওয়্যারে সিঙ্ক করুন (Sync to Cloud Database)
            </>
          )}
        </button>
      </div>

      {/* PRINTABLE PHYSICAL PAPER TEMPLATE PREVIEW */}
      <div className="p-5 rounded-2xl bg-white text-slate-900 shadow-xl space-y-4 printable-section">
        <div className="flex justify-between items-center border-b pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              শাহ আমানত ফিশারি অ্যান্ড এগ্রো প্রজেক্ট - দৈনিক পুকুর ফিল্ড লগশিট (Field Register)
            </h3>
            <p className="text-xs text-slate-600">মাঠ কর্মীদের জন্য হস্তলিখিত রেজিস্টার ফরম</p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 rounded border">
            পুকুর ১ ও ২ (চলমান)
          </span>
        </div>

        <table className="w-full text-left text-xs border border-slate-300">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="border p-2">তারিখ</th>
              <th className="border p-2">পুকুর নং</th>
              <th className="border p-2">ফিড ব্যাগ</th>
              <th className="border p-2">ফিড কেজি</th>
              <th className="border p-2">ভাত (কেজি)</th>
              <th className="border p-2">সময়</th>
              <th className="border p-2">মাছের অবস্থা ও মন্তব্য</th>
              <th className="border p-2">কর্মীর স্বাক্ষর</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((row) => (
              <tr key={row} className="h-9">
                <td className="border p-2 text-slate-400">.../.../২০২৬</td>
                <td className="border p-2 text-slate-400">পুকুর {row % 2 === 1 ? '১' : '২'}</td>
                <td className="border p-2"></td>
                <td className="border p-2"></td>
                <td className="border p-2"></td>
                <td className="border p-2 text-slate-400">সকাল/বিকাল</td>
                <td className="border p-2"></td>
                <td className="border p-2"></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
