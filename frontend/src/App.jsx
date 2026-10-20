import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import PondsView from './components/PondsView';
import FeedManagement from './components/FeedManagement';
import GrowthSampling from './components/GrowthSampling';
import Financials from './components/Financials';
import WeatherView from './components/WeatherView';
import WorkerInput from './components/WorkerInput';
import SheetSync from './components/SheetSync';
import Reports from './components/Reports';
import CyclesManagement from './components/CyclesManagement';
import InvestorManagement from './components/InvestorManagement';
import UserManager from './components/UserManager';
import LoginPage from './components/LoginPage';
import Modals from './components/Modals';

import { 
  fetchStats, fetchPonds, fetchFeedInventory, 
  fetchDailyFeedings, fetchVaat, fetchGrowth, 
  fetchExpenses, fetchHarvest, fetchWeather,
  fetchUsers
} from './api';

import { 
  LayoutDashboard, Waves, Package, Scale, 
  DollarSign, CloudSun, HardHat, FileSpreadsheet, 
  FileText, Menu, X, ArrowRight, RotateCcw, Users
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const cached = localStorage.getItem('fish_farm_user') || sessionStorage.getItem('fish_farm_user');
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  });

  // State data
  const [stats, setStats] = useState(null);
  const [ponds, setPonds] = useState([]);
  const [feedInventory, setFeedInventory] = useState(null);
  const [dailyFeedings, setDailyFeedings] = useState([]);
  const [vaatData, setVaatData] = useState(null);
  const [samplings, setSamplings] = useState([]);
  const [expensesData, setExpensesData] = useState(null);
  const [harvestData, setHarvestData] = useState(null);
  const [weather, setWeather] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalType, setModalType] = useState(null);
  const [modalProps, setModalProps] = useState({});

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [
        statsRes, pondsRes, feedRes, feedingsRes, 
        vaatRes, growthRes, expensesRes, harvestRes, weatherRes, usersRes
      ] = await Promise.all([
        fetchStats().catch(() => null),
        fetchPonds().catch(() => []),
        fetchFeedInventory().catch(() => null),
        fetchDailyFeedings().catch(() => []),
        fetchVaat().catch(() => null),
        fetchGrowth().catch(() => []),
        fetchExpenses().catch(() => null),
        fetchHarvest().catch(() => null),
        fetchWeather().catch(() => null),
        fetchUsers().catch(() => []),
      ]);

      if (statsRes) setStats(statsRes);
      if (pondsRes) setPonds(pondsRes);
      if (feedRes) setFeedInventory(feedRes);
      if (feedingsRes) setDailyFeedings(feedingsRes);
      if (vaatRes) setVaatData(vaatRes);
      if (growthRes) setSamplings(growthRes);
      if (expensesRes) setExpensesData(expensesRes);
      if (harvestRes) setHarvestData(harvestRes);
      if (weatherRes) setWeather(weatherRes);
      if (usersRes) setUsersList(usersRes);
    } catch (err) {
      console.error("Error loading farm data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleOpenModal = (type, props = {}) => {
    setModalType(type);
    setModalProps(props);
  };

  const handleCloseModal = () => {
    setModalType(null);
    setModalProps({});
  };

  const handleModalSuccess = () => {
    loadAllData();
  };

  const handleLogout = () => {
    localStorage.removeItem('fish_farm_user');
    localStorage.removeItem('fish_farm_remember');
    sessionStorage.removeItem('fish_farm_user');
    setCurrentUser(null);
  };

  if (!currentUser) {
    return (
      <LoginPage 
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          loadAllData();
        }} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        onRefresh={loadAllData}
        weather={weather}
        usersList={usersList}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        {loading && !stats ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
            <div className="w-10 h-10 border-4 border-teal-500/20 border-t-teal-600 rounded-full animate-spin" />
            <p className="text-slate-600 text-sm">শাহ আমানত ফিশারি অ্যান্ড এগ্রো প্রজেক্টের তথ্য লোড হচ্ছে...</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <Dashboard
                stats={stats}
                ponds={ponds}
                weather={weather}
                setActiveTab={setActiveTab}
                onOpenModal={handleOpenModal}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'cycles' && (
              <CyclesManagement
                ponds={ponds}
                currentUser={currentUser}
                onRefreshParent={loadAllData}
              />
            )}

            {activeTab === 'investors' && (
              <InvestorManagement
                currentUser={currentUser}
                onRefreshParent={loadAllData}
              />
            )}

            {activeTab === 'ponds' && (
              <PondsView
                ponds={ponds}
                dailyFeedings={dailyFeedings}
                currentUser={currentUser}
                onOpenModal={handleOpenModal}
                onRefresh={loadAllData}
              />
            )}

            {activeTab === 'feed' && (
              <FeedManagement
                ponds={ponds}
                feedInventory={feedInventory}
                dailyFeedings={dailyFeedings}
                vaatData={vaatData}
                currentUser={currentUser}
                onOpenModal={handleOpenModal}
                onRefresh={loadAllData}
              />
            )}

            {activeTab === 'growth' && (
              <GrowthSampling
                samplings={samplings}
                ponds={ponds}
                currentUser={currentUser}
                onOpenModal={handleOpenModal}
                onRefresh={loadAllData}
              />
            )}

            {activeTab === 'financials' && (
              <Financials
                expensesData={expensesData}
                harvestData={harvestData}
                currentUser={currentUser}
                onOpenModal={handleOpenModal}
                onRefresh={loadAllData}
              />
            )}

            {activeTab === 'weather' && (
              <WeatherView
                weather={weather}
                onRefresh={loadAllData}
              />
            )}

            {activeTab === 'worker' && (
              <WorkerInput
                ponds={ponds}
                onEntrySaved={loadAllData}
              />
            )}

            {activeTab === 'sync' && (
              <SheetSync
                onSyncComplete={loadAllData}
              />
            )}

            {activeTab === 'reports' && (
              <Reports
                stats={stats}
                ponds={ponds}
                feedInventory={feedInventory}
                samplings={samplings}
                expensesData={expensesData}
              />
            )}

            {activeTab === 'users' && (
              <UserManager
                currentUser={currentUser}
                onUserUpdated={loadAllData}
              />
            )}
          </>
        )}
      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR (Ultra Mobile Friendly) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-2 py-1.5 flex justify-around items-center">
        {[
          { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
          { id: 'cycles', label: '৬ মাস সাইকেল', icon: RotateCcw },
          { id: 'investors', label: 'ইনভেস্টর', icon: Users },
          { id: 'feed', label: 'খাবার', icon: Package },
          { id: 'worker', label: 'কর্মী মোড', icon: HardHat, highlight: true },
          { id: 'financials', label: 'লাভ', icon: DollarSign },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition ${
                item.highlight
                  ? (isActive ? 'text-amber-400' : 'text-amber-500/80')
                  : (isActive ? 'text-teal-400' : 'text-slate-400')
              }`}
            >
              <div className={`p-1 rounded-lg ${isActive ? 'bg-teal-500/10' : ''}`}>
                <Icon className={`w-5 h-5 ${item.highlight && !isActive ? 'text-amber-400' : ''}`} />
              </div>
              <span className="text-[10px] font-medium tracking-tight mt-0.5">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Global Interactive Modals */}
      <Modals
        modalType={modalType}
        modalProps={modalProps}
        onClose={handleCloseModal}
        onSuccess={handleModalSuccess}
        ponds={ponds}
      />
    </div>
  );
}
