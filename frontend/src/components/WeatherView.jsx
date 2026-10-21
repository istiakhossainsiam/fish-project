import React from 'react';
import { CloudSun, Droplets, Wind, Compass, AlertTriangle, CheckCircle2, Info, Thermometer, CloudRain } from 'lucide-react';

export default function WeatherView({ weather, onRefresh }) {
  if (!weather) {
    return <div className="p-8 text-center text-slate-500">Loading Live Weather Data...</div>;
  }

  const current = weather.current || {};
  const daily = weather.daily || {};
  const alerts = weather.aquaculture_advisor || [];

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CloudSun className="w-5 h-5 text-amber-400" />
            আবহাওয়া ও অ্যাকুয়াকালচার পূর্বাভাস (Weather & DO Advisory)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            ওপেন-মেটিও (Open-Meteo) লাইভ এপিআই • মাছের পুকুরে অক্সিজেন ও জলজ পরিবেশ রক্ষা
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-teal-300 font-semibold">
            📍 {weather.location || 'Shah Amanat Airport, Patenga, Chittagong'}
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700">
            🕒 Timezone: {weather.timezone || 'Asia/Dhaka (GMT+6)'}
          </span>
        </div>
      </div>

      {/* AQUACULTURE ADVISOR ALERTS */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          আজকের জন্য মৎস্য খামারের সতর্কতা ও করণীয়
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {alerts.map((al, idx) => {
            const isWarning = al.severity === 'warning';
            const isInfo = al.severity === 'info';
            return (
              <div
                key={idx}
                className={`p-4 rounded-2xl border ${
                  isWarning
                    ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                    : (isInfo ? 'bg-sky-950/30 border-sky-500/40 text-sky-200' : 'bg-teal-950/30 border-teal-500/40 text-teal-200')
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                    isWarning ? 'bg-rose-500/20 text-rose-400' : (isInfo ? 'bg-sky-500/20 text-sky-400' : 'bg-teal-500/20 text-teal-400')
                  }`}>
                    {isWarning ? <AlertTriangle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{al.title}</h4>
                    <p className="text-xs text-slate-700 mt-1 leading-relaxed">{al.message}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CURRENT WEATHER METRICS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <div className="flex justify-between items-center text-slate-500 text-xs">
            <span>বর্তমান তাপমাত্রা</span>
            <Thermometer className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {current.temperature || 29}°C
          </div>
          <span className="text-[11px] text-teal-300 block mt-1">মাছের আদর্শ বৃদ্ধির তাপমাত্রা</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <div className="flex justify-between items-center text-slate-500 text-xs">
            <span>বাতাসের আর্দ্রতা (Humidity)</span>
            <Droplets className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {current.humidity || 75}%
          </div>
          <span className="text-[11px] text-slate-500 block mt-1">স্বাভাবিক জলীয় বাষ্প</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <div className="flex justify-between items-center text-slate-500 text-xs">
            <span>বাতাসের গতি (Wind Speed)</span>
            <Wind className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {current.wind_speed || 8} <span className="text-xs font-normal text-slate-500">km/h</span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-1">স্বাভাবিক প্রাকৃতিক ঢেউ</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <div className="flex justify-between items-center text-slate-500 text-xs">
            <span>বৃষ্টিপাত (Precipitation)</span>
            <CloudRain className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {current.precipitation || 0.0} <span className="text-xs font-normal text-slate-500">mm</span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-1">শুকনো আবহাওয়া</span>
        </div>
      </div>

      {/* 7-DAY FORECAST TABLE */}
      {daily?.time && (
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-md space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CloudSun className="w-4 h-4 text-teal-400" />
            আগামী ৭ দিনের আবহাওয়ার পূর্বাভাস (7-Day Forecast)
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {daily.time.slice(0, 7).map((date, i) => (
              <div key={date} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs">
                <span className="text-slate-500 block font-medium">
                  {new Date(date).toLocaleDateString('bn-BD', { weekday: 'short' })}
                </span>
                <span className="text-[11px] text-slate-500 block">{date.slice(5)}</span>
                
                <div className="my-2 text-base font-bold text-slate-900">
                  {daily.temperature_2m_max?.[i]}° / <span className="text-xs font-normal text-slate-500">{daily.temperature_2m_min?.[i]}°</span>
                </div>

                <div className="text-[11px] text-sky-300 flex items-center justify-center gap-1">
                  <CloudRain className="w-3 h-3" />
                  {daily.precipitation_probability_max?.[i] || 0}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FARM OPERATIONAL TIPS */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 space-y-2">
        <h4 className="font-semibold text-slate-200">💡 আবহাওয়া উপযোগী মৎস্য ব্যবস্থাপনা গাইড:</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>ভোর রাতে (৩:০০ AM - ৬:০০ AM) পুকুরের তলদেশের অক্সিজেন সবচেয়ে কমে যায়। মেঘলা দিনে অবশ্যই এরেটর চালু রাখুন।</li>
          <li>বৃষ্টির পর পানির পিএইচ কমে এসিডিক হয়ে যায়। প্রতি শতাংশে ১-২ কেজি চুন প্রয়োগ করে পিএইচ ৭.৫-৮.৫ এ স্থিতিশীল রাখুন।</li>
          <li>শীতকালে তাপমাত্রা ২০° সে. এর নিচে নামলে মাছের বিপাক ক্রিয়া কমে যায়; খাবার ২৫-৩০% কমিয়ে দিন।</li>
        </ul>
      </div>
    </div>
  );
}
