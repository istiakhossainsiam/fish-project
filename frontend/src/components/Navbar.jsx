import React, { useState } from 'react';
import { Waves, Shield, User, HardHat, CloudSun, RefreshCw, Users, ChevronDown, Check, LogOut } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, currentUser, setCurrentUser, onRefresh, weather, usersList = [], onLogout }) {
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const defaultRoles = [
    { id: 'superadmin', label: 'Super Admin (মালিক)', role: 'superadmin', full_name: 'Farm Owner (Super Admin)', icon: Shield, badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    { id: 'manager', label: 'Farm Manager (ম্যানেজার)', role: 'manager', full_name: 'Farm Manager', icon: User, badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-300' },
    { id: 'worker', label: 'Field Worker (কর্মী)', role: 'worker', full_name: 'Field Worker', icon: HardHat, badgeColor: 'bg-amber-100 text-amber-800 border-amber-300' },
  ];

  const getRoleIcon = (role) => {
    switch (role) {
      case 'superadmin': return Shield;
      case 'manager': return User;
      default: return HardHat;
    }
  };

  const CurrentIcon = getRoleIcon(currentUser.role);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-[0_1px_4px_rgba(15,23,42,0.03)]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Farm Title */}
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center shadow-md shadow-teal-700/20 cursor-pointer active:scale-95 transition" 
              onClick={() => setActiveTab('dashboard')}
            >
              <Waves className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight cursor-pointer hover:text-teal-700 transition" onClick={() => setActiveTab('dashboard')}>
                  Shah Amanat Fishery & Agro
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 hidden sm:inline-block">
                  ৪টি পুকুর
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                শাহ আমানত বিমানবন্দর, চট্টগ্রাম • কমার্শিয়াল মৎস্য ও এগ্রো প্রকল্প
              </p>
            </div>
          </div>

          {/* Right Section: Weather badge, User Switcher, Refresh */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Weather mini pill */}
            {weather?.current && (
              <button 
                onClick={() => setActiveTab('weather')}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-xs text-slate-700 transition"
              >
                <CloudSun className="w-4 h-4 text-amber-500" />
                <span className="font-semibold">{weather.current.temperature}°C</span>
                <span className="text-slate-400 border-l border-slate-200 pl-2">Shah Amanat Airport, CTG</span>
              </button>
            )}

            {/* Dynamic User Profile & Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition shadow-sm"
              >
                <div className={`p-1.5 rounded-lg ${
                  currentUser.role === 'superadmin' ? 'bg-emerald-100 text-emerald-700' :
                  currentUser.role === 'manager' ? 'bg-cyan-100 text-cyan-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  <CurrentIcon className="w-4 h-4" />
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-slate-800 leading-tight">
                    {currentUser.full_name || currentUser.username}
                  </div>
                  <div className="text-[10px] text-teal-700 font-semibold capitalize">
                    {currentUser.role === 'superadmin' ? 'মালিক (Super Admin)' :
                     currentUser.role === 'manager' ? 'ম্যানেজার (Manager)' : 'কর্মী (Worker)'}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* User Switch Dropdown Menu */}
              {showUserDropdown && (
                <div 
                  className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2"
                  onClick={() => setShowUserDropdown(false)}
                >
                  <div className="px-3 py-2 border-b border-slate-100 text-xs text-slate-500 font-medium">
                    সুইচ ইউজার বা ড্যাশবোর্ড মোড:
                  </div>

                  {/* Standard Role Presets */}
                  <div className="space-y-1 py-1.5">
                    {defaultRoles.map((r) => {
                      const Icon = r.icon;
                      const isCurrent = currentUser.role === r.role && (!currentUser.id || currentUser.username === r.id);
                      return (
                        <button
                          key={r.id}
                          onClick={() => {
                            setCurrentUser({
                              role: r.role,
                              full_name: r.full_name,
                              username: r.id
                            });
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition ${
                            isCurrent ? 'bg-teal-600 text-white font-bold shadow-sm' : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            <span>{r.label}</span>
                          </div>
                          {isCurrent && <Check className="w-3.5 h-3.5" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Registered Database Users */}
                  {usersList && usersList.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 space-y-1">
                      <div className="px-3 py-1 text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                        নিবন্ধিত ইউজার একাউন্টস ({usersList.length}):
                      </div>
                      <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                        {usersList.map((u) => {
                          const Icon = getRoleIcon(u.role);
                          const isCurrent = currentUser.username === u.username;
                          return (
                            <button
                              key={u.id}
                              onClick={() => {
                                setCurrentUser({
                                  id: u.id,
                                  role: u.role,
                                  full_name: u.full_name,
                                  username: u.username
                                });
                              }}
                              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition ${
                                isCurrent ? 'bg-teal-50 text-teal-800 font-bold border border-teal-200' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <Icon className="w-3.5 h-3.5" />
                                <span className="truncate">{u.full_name} ({u.username})</span>
                              </div>
                              <span className="text-[10px] text-slate-400 uppercase font-semibold">{u.role}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Link to User Manager */}
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <button
                      onClick={() => setActiveTab('users')}
                      className="w-full py-2 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-semibold flex items-center justify-center gap-1.5 border border-teal-200 transition"
                    >
                      <Users className="w-3.5 h-3.5" />
                      ইউজার ম্যানেজমেন্ট ও নতুন একাউন্ট
                    </button>
                    {onLogout && (
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          onLogout();
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center justify-center gap-1.5 border border-rose-200 transition"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        লগআউট (Logout)
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              title="তথ্য রিফ্রেশ করুন"
              className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Quick Logout Button */}
            {onLogout && (
              <button
                onClick={onLogout}
                title="লগআউট করুন"
                className="hidden sm:flex p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 hover:text-rose-700 hover:bg-rose-100 transition shadow-sm"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs (Desktop & Tablet) */}
      <div className="hidden md:block bg-slate-50/90 border-t border-slate-200/80 px-4">
        <div className="max-w-7xl mx-auto flex items-center space-x-1.5 overflow-x-auto py-2">
          {[
            { id: 'dashboard', label: '📊 ড্যাশবোর্ড' },
            { id: 'cycles', label: '🔄 ৬ মাসের সাইকেল' },
            { id: 'investors', label: '🤝 ইনভেস্টর ও মুনাফা' },
            { id: 'ponds', label: '🌊 পুকুর ও মাছ' },
            { id: 'feed', label: '🍲 খাবার ও স্টক' },
            { id: 'growth', label: '⚖️ বৃদ্ধি মনিটরিং' },
            { id: 'financials', label: '💰 খরচ ও লাভ' },
            { id: 'weather', label: '⛅ আবহাওয়া' },
            { id: 'worker', label: '📱 কর্মী ইনপুট' },
            { id: 'users', label: '👥 ইউজার তৈরি', highlight: true },
            { id: 'sync', label: '📝 শিট সিঙ্ক' },
            { id: 'reports', label: '📑 রিপোর্ট' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-teal-700 text-white shadow-sm ring-1 ring-teal-700 font-bold'
                  : tab.highlight
                    ? 'text-teal-800 bg-teal-50 hover:bg-teal-100/80 border border-teal-200/80 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
