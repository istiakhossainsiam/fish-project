import React, { useState } from 'react';
import { Waves, Shield, User, HardHat, CloudSun, RefreshCw, Users, ChevronDown, Check, LogOut } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, currentUser, setCurrentUser, onRefresh, weather, usersList = [], onLogout }) {
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const defaultRoles = [
    { id: 'superadmin', label: 'Super Admin (মালিক)', role: 'superadmin', full_name: 'Farm Owner (Super Admin)', icon: Shield, badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    { id: 'manager', label: 'Farm Manager (ম্যানেজার)', role: 'manager', full_name: 'Farm Manager', icon: User, badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
    { id: 'worker', label: 'Field Worker (কর্মী)', role: 'worker', full_name: 'Field Worker', icon: HardHat, badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
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
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Farm Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-teal-500/20 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
              <Waves className="w-6 h-6 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base sm:text-lg text-white tracking-tight cursor-pointer" onClick={() => setActiveTab('dashboard')}>
                  Shah Amanat Fishery & Agro
                </span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 hidden sm:inline-block">
                  ৪টি পুকুর (4 Ponds)
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                শাহ আমানত বিমানবন্দর, চট্টগ্রাম • কমার্শিয়াল মৎস্য ও এগ্রো প্রকল্প
              </p>
            </div>
          </div>

          {/* Right Section: Weather badge, User Switcher, Refresh */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Weather mini pill */}
            {weather?.current && (
              <button 
                onClick={() => setActiveTab('weather')}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 hover:border-slate-600 text-xs text-slate-300 transition"
              >
                <CloudSun className="w-4 h-4 text-amber-400" />
                <span>{weather.current.temperature}°C</span>
                <span className="text-slate-400 border-l border-slate-700 pl-2">Shah Amanat Airport, CTG</span>
              </button>
            )}

            {/* Dynamic User Profile & Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 hover:border-slate-600 transition shadow-sm"
              >
                <div className={`p-1 rounded-lg ${
                  currentUser.role === 'superadmin' ? 'bg-emerald-500/20 text-emerald-400' :
                  currentUser.role === 'manager' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  <CurrentIcon className="w-4 h-4" />
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-white leading-tight">
                    {currentUser.full_name || currentUser.username}
                  </div>
                  <div className="text-[10px] text-teal-400 font-medium capitalize">
                    {currentUser.role === 'superadmin' ? 'মালিক (Super Admin)' :
                     currentUser.role === 'manager' ? 'ম্যানেজার (Manager)' : 'কর্মী (Worker)'}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* User Switch Dropdown Menu */}
              {showUserDropdown && (
                <div 
                  className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2"
                  onClick={() => setShowUserDropdown(false)}
                >
                  <div className="px-3 py-2 border-b border-slate-800 text-xs text-slate-400 font-medium">
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
                            isCurrent ? 'bg-teal-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'
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
                    <div className="pt-2 border-t border-slate-800 space-y-1">
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
                                isCurrent ? 'bg-slate-800 text-teal-300 font-bold border border-teal-500/30' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <Icon className="w-3.5 h-3.5" />
                                <span className="truncate">{u.full_name} ({u.username})</span>
                              </div>
                              <span className="text-[10px] text-slate-400 uppercase">{u.role}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Link to User Manager */}
                  <div className="pt-2 border-t border-slate-800 space-y-1.5">
                    <button
                      onClick={() => setActiveTab('users')}
                      className="w-full py-2 px-3 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 text-xs font-semibold flex items-center justify-center gap-1.5 border border-teal-500/20 transition"
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
                        className="w-full py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold flex items-center justify-center gap-1.5 border border-rose-500/20 transition"
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
              className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Quick Logout Button */}
            {onLogout && (
              <button
                onClick={onLogout}
                title="লগআউট করুন"
                className="hidden sm:flex p-2 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 hover:text-white hover:bg-rose-600/80 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs (Desktop & Tablet) */}
      <div className="hidden md:block bg-slate-900 border-t border-slate-800/80 px-4">
        <div className="max-w-7xl mx-auto flex space-x-1 overflow-x-auto py-1.5">
          {[
            { id: 'dashboard', label: '📊 ড্যাশবোর্ড (Dashboard)' },
            { id: 'cycles', label: '🔄 ৬ মাসের সাইকেল (6-Month Cycles)' },
            { id: 'investors', label: '🤝 ইনভেস্টর ও মুনাফা (Investors & Profit)' },
            { id: 'ponds', label: '🌊 পুকুর ও স্টক (4 Ponds)' },
            { id: 'feed', label: '🍲 খাবার ও স্টক (Feed & Vaat)' },
            { id: 'growth', label: '⚖️ ১৫-১৮ দিনের বৃদ্ধি (Growth Check)' },
            { id: 'financials', label: '💰 খরচ ও লাভ (Cost & Profit)' },
            { id: 'weather', label: '⛅ আবহাওয়া ও অক্সিজেন (Weather)' },
            { id: 'worker', label: '📱 কর্মী ইনপুট (Worker Form)' },
            { id: 'users', label: '👥 ইউজার তৈরি (Users)', highlight: true },
            { id: 'sync', label: '📝 শিট সিঙ্ক (Sheet Sync)' },
            { id: 'reports', label: '📑 রিপোর্ট (Reports)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                  : tab.highlight
                    ? 'text-emerald-400 hover:text-emerald-300 hover:bg-slate-800/60'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
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
