import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Shield, User, HardHat, Key, 
  Trash2, Edit3, Check, X, RefreshCw, Lock, Sparkles 
} from 'lucide-react';
import { fetchUsers, createUser, updateUser, deleteUser } from '../api';

export default function UserManager({ currentUser, onUserUpdated }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    role: 'worker',
    pin: '1234',
    password: 'farm123'
  });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await createUser(formData);
      setShowCreateModal(false);
      setFormData({
        username: '',
        full_name: '',
        role: 'worker',
        pin: '1234',
        password: 'farm123'
      });
      loadUsers();
      if (onUserUpdated) onUserUpdated();
    } catch (err) {
      alert("Error creating user: " + err.message);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      await updateUser(selectedUser.id, formData);
      setShowEditModal(false);
      setSelectedUser(null);
      loadUsers();
      if (onUserUpdated) onUserUpdated();
    } catch (err) {
      alert("Error updating user: " + err.message);
    }
  };

  const handleDelete = async (user) => {
    if (user.username === 'superadmin') {
      alert("ডিফল্ট সুপারএডমিন ইউজার মুছে ফেলা যাবে না।");
      return;
    }
    if (window.confirm(`আপনি কি নিশ্চিতভাবে ইউজার "${user.full_name}" (${user.username}) মুছে ফেলতে চান?`)) {
      try {
        await deleteUser(user.id);
        loadUsers();
        if (onUserUpdated) onUserUpdated();
      } catch (err) {
        alert("Delete failed: " + err.message);
      }
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'superadmin':
        return {
          label: 'সুপারএডমিন (মালিক)',
          color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          icon: Shield
        };
      case 'manager':
        return {
          label: 'ম্যানেজার (তদারকি)',
          color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
          icon: User
        };
      case 'worker':
      default:
        return {
          label: 'মাঠ কর্মী (Worker)',
          color: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          icon: HardHat
        };
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-400" />
            ব্যবহারকারী ও অ্যাক্সেস কন্ট্রোল (User Management)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            সুপারএডমিন, লোকাল ম্যানেজার এবং মাঠ কর্মীদের আইডি তৈরি, পিন (PIN) নির্ধারণ ও পৃথক রোল ম্যানেজমেন্ট
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadUsers}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-300 transition cursor-pointer"
            title="রিফ্রেশ"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-400' : ''}`} />
          </button>
          <button
            onClick={() => {
              setFormData({
                username: '',
                full_name: '',
                role: 'worker',
                pin: '1234',
                password: 'farm123'
              });
              setShowCreateModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-teal-500/20 transition"
          >
            <UserPlus className="w-4 h-4" /> নতুন ইউজার তৈরি করুন (Create User)
          </button>
        </div>
      </div>

      {/* Role Access Information Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">১. সুপারএডমিন ড্যাশবোর্ড</h4>
              <span className="text-[10px] text-emerald-400">মালিক ও অংশীদারদের জন্য</span>
            </div>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            পূর্ণাঙ্গ আর্থিক হিসাব, মাছ বিক্রির নিট লাভ, ইনভেস্টরদের লভ্যাংশ বণ্টন, খামারের পূর্ণ ক্ষমতা ও নতুন ইউজার তৈরির অধিকার।
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">২. ম্যানেজার ড্যাশবোর্ড</h4>
              <span className="text-[10px] text-cyan-400">খামার ইন-চার্জ ও সুপারভাইজার</span>
            </div>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            দৈনিক খাবার দেওয়ার স্টক হিসাব, ১৫-১৮ দিনের গ্রোথ স্যাম্পলিং মনিটরিং, ভাউচার এন্ট্রি এবং কর্মীদের কাজ তদারকির প্যানেল।
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <HardHat className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">৩. মাঠ কর্মী ড্যাশবোর্ড</h4>
              <span className="text-[10px] text-amber-400">পুকুরপাড়ে মোবাইল ব্যবহারের জন্য</span>
            </div>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            সহজ ও বড় বোতামযুক্ত মোবাইল স্ক্রিন। জটিল কোনো আর্থিক তথ্য নেই; শুধু সকালে ও বিকেলে খাবার দেওয়ার বোতাম ও চেকলিস্ট।
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[11px] border-b border-slate-200">
            <tr>
              <th className="p-3.5">পূর্ণ নাম (Full Name)</th>
              <th className="p-3.5">ইউজারনেম (Username / ID)</th>
              <th className="p-3.5">রোল (Access Role)</th>
              <th className="p-3.5">লগইন পিন (PIN)</th>
              <th className="p-3.5 text-right">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => {
              const roleMeta = getRoleBadge(u.role);
              const RoleIcon = roleMeta.icon;
              return (
                <tr key={u.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3.5 font-bold text-slate-900 text-sm flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-teal-400 border border-slate-200">
                      {u.full_name[0] || 'U'}
                    </div>
                    <div>
                      {u.full_name}
                      {u.username === currentUser.username && (
                        <span className="ml-2 text-[10px] text-teal-400 font-normal">(বর্তমান লগইন)</span>
                      )}
                    </div>
                  </td>
                  <td className="p-3.5 font-mono text-cyan-300">{u.username}</td>
                  <td className="p-3.5">
                    <span className={`px-2.5 py-1 rounded-full border text-[11px] font-bold inline-flex items-center gap-1.5 ${roleMeta.color}`}>
                      <RoleIcon className="w-3.5 h-3.5" />
                      {roleMeta.label}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-slate-300">
                    <span className="px-2 py-0.5 rounded-lg bg-white border border-slate-200">
                      PIN: {u.pin || '****'}
                    </span>
                  </td>
                  <td className="p-3.5 text-right whitespace-nowrap">
                    <button
                      onClick={() => {
                        setSelectedUser(u);
                        setFormData({
                          username: u.username,
                          full_name: u.full_name,
                          role: u.role,
                          pin: u.pin || '1234',
                          password: ''
                        });
                        setShowEditModal(true);
                      }}
                      className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg border border-slate-200 transition cursor-pointer mr-1"
                      title="সম্পাদনা করুন"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {u.username !== 'superadmin' && (
                      <button
                        onClick={() => handleDelete(u)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition cursor-pointer"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* CREATE USER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl relative my-8 text-xs">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
              <UserPlus className="w-5 h-5 text-teal-400" />
              নতুন ইউজার অ্যাকাউন্ট তৈরি করুন (Create User)
            </h3>

            <form onSubmit={handleCreateSubmit} className="space-y-3 mt-4">
              <div>
                <label className="text-slate-400 block mb-1">পূর্ণ নাম (Full Name) *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: মো: আরিফুল ইসলাম"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 shadow-sm focus:border-teal-600 focus:outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">ইউজারনেম / আইডি *</label>
                  <input
                    type="text"
                    required
                    placeholder="ariful_worker"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 shadow-sm focus:border-teal-600 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">ইউজার রোল (Role) *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 shadow-sm focus:border-teal-600 focus:outline-none font-medium"
                  >
                    <option value="worker">👷 মাঠ কর্মী (Worker)</option>
                    <option value="manager">👔 খামার ম্যানেজার (Manager)</option>
                    <option value="superadmin">👑 সুপারএডমিন / মালিক (Superadmin)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">৪-ডিজিট কুইক পিন (PIN) *</label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    placeholder="1234"
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 shadow-sm focus:border-teal-600 focus:outline-none font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">মোবাইলে দ্রুত লগইনের জন্য</span>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">পাসওয়ার্ড (Password) *</label>
                  <input
                    type="password"
                    required
                    placeholder="farm123"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 shadow-sm focus:border-teal-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-400">
                <span className="text-teal-300 font-bold block mb-0.5">রোল অনুযায়ী স্বয়ংক্রিয় ড্যাশবোর্ড:</span>
                কর্মী নির্বাচন করলে সে লগইন করার পর শুধু সহজ খাবার ইনপুট ও মাঠ চেকলিস্ট দেখবে। ম্যানেজার বা সুপারএডমিন নির্বাচন করলে পূর্ণ হিসাব দেখতে পারবে।
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold"
                >
                  ইউজার অ্যাকাউন্ট তৈরি করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl relative my-8 text-xs">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
              <Edit3 className="w-5 h-5 text-teal-400" />
              ইউজার তথ্য ও রোল পরিবর্তন (Edit User: {selectedUser.username})
            </h3>

            <form onSubmit={handleEditSubmit} className="space-y-3 mt-4">
              <div>
                <label className="text-slate-400 block mb-1">পূর্ণ নাম</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 shadow-sm focus:border-teal-600 focus:outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">রোল (Access Level)</label>
                  <select
                    disabled={selectedUser.username === 'superadmin'}
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 shadow-sm focus:border-teal-600 focus:outline-none font-medium disabled:opacity-50"
                  >
                    <option value="worker">মাঠ কর্মী (Worker)</option>
                    <option value="manager">ম্যানেজার (Manager)</option>
                    <option value="superadmin">সুপারএডমিন (Superadmin)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">কুইক পিন (PIN)</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 shadow-sm focus:border-teal-600 focus:outline-none font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">নতুন পাসওয়ার্ড (ঐচ্ছিক)</label>
                <input
                  type="password"
                  placeholder="পরিবর্তন না করতে চাইলে ফাঁকা রাখুন"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 shadow-sm focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold"
                >
                  আপডেট সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
