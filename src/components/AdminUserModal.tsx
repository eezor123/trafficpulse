import React, { useState, useEffect } from 'react';
import { MemberUser, MemberTier } from '../types';
import {
  getAllMembers,
  adminAssignTraffic,
  adminResetUserTraffic,
  adminTogglePaidStatus,
  adminDeleteUser,
} from '../utils/authManager';
import {
  ShieldCheck,
  Users,
  Search,
  PlusCircle,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Crown,
  Zap,
  Trash2,
  Globe,
} from 'lucide-react';

interface AdminUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: MemberUser | null;
  onUserUpdated?: (updatedUser: MemberUser) => void;
}

export const AdminUserModal: React.FC<AdminUserModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserUpdated,
}) => {
  const [members, setMembers] = useState<MemberUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserForAssign, setSelectedUserForAssign] = useState<MemberUser | null>(null);
  const [assignAmount, setAssignAmount] = useState<number>(5000);
  const [assignMarkAsPaid, setAssignMarkAsPaid] = useState<boolean>(true);
  const [assignTier, setAssignTier] = useState<MemberTier>('pro');
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      refreshList();
    }
  }, [isOpen]);

  const refreshList = async () => {
    try {
      const res = await fetch('/api/auth/members');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.members)) {
          setMembers(data.members);
          return;
        }
      }
    } catch {
      // fallback to local stored members
    }
    const list = getAllMembers();
    setMembers(list);
  };

  if (!isOpen) return null;

  const showNotification = (type: 'success' | 'error', message: string) => {
    setActionNotice({ type, message });
    setTimeout(() => setActionNotice(null), 4000);
  };

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.company && m.company.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalUsers = members.length;
  const totalPaid = members.filter((m) => m.isPaidUser || m.role === 'admin').length;
  const totalTrial = totalUsers - totalPaid;
  const totalVisitsAcrossAll = members.reduce((acc, m) => acc + (m.totalVisitsGenerated || 0), 0);

  const handleOpenAssign = (user: MemberUser) => {
    setSelectedUserForAssign(user);
    setAssignTier(user.tier || 'pro');
    setAssignMarkAsPaid(true);
    setAssignAmount(5000);
  };

  const handleConfirmAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForAssign) return;

    if (assignAmount <= 0) {
      showNotification('error', 'Please specify a positive number of traffic visits.');
      return;
    }

    const res = adminAssignTraffic(
      selectedUserForAssign.id,
      Number(assignAmount),
      assignMarkAsPaid,
      assignTier
    );

    if (res.success && res.user) {
      showNotification(
        'success',
        `Assigned +${Number(assignAmount).toLocaleString()} traffic visits to ${res.user.name}. Balance: ${res.user.trafficBalance.toLocaleString()} visits.`
      );
      refreshList();
      if (currentUser?.id === res.user.id && onUserUpdated) {
        onUserUpdated(res.user);
      }
      setSelectedUserForAssign(null);
    } else {
      showNotification('error', res.error || 'Failed to assign traffic.');
    }
  };

  const handleResetTrial = (user: MemberUser) => {
    if (!window.confirm(`Reset ${user.name}'s account back to the 500 Free Trial quota?`)) return;

    const res = adminResetUserTraffic(user.id);
    if (res.success && res.user) {
      showNotification('success', `Reset ${user.name}'s quota to 500 Free Trial units.`);
      refreshList();
      if (currentUser?.id === res.user.id && onUserUpdated) {
        onUserUpdated(res.user);
      }
    } else {
      showNotification('error', res.error || 'Failed resetting user traffic.');
    }
  };

  const handleTogglePaid = (user: MemberUser) => {
    const nextStatus = !user.isPaidUser;
    const res = adminTogglePaidStatus(user.id, nextStatus);
    if (res.success && res.user) {
      showNotification(
        'success',
        `Updated ${user.name} to ${nextStatus ? 'Paid User' : 'Free Trial'}.`
      );
      refreshList();
      if (currentUser?.id === res.user.id && onUserUpdated) {
        onUserUpdated(res.user);
      }
    } else {
      showNotification('error', res.error || 'Failed updating status.');
    }
  };

  const handleDelete = (user: MemberUser) => {
    if (!window.confirm(`Are you sure you want to remove user "${user.name}" (${user.email})?`)) return;

    const res = adminDeleteUser(user.id);
    if (res.success) {
      showNotification('success', `Removed user account: ${user.name}.`);
      refreshList();
    } else {
      showNotification('error', res.error || 'Failed deleting user.');
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-inner">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">Super Admin • Member Traffic Management</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-semibold uppercase">
                  Admin Only
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Manage all registered accounts, allocate custom paid traffic quotas, and reset free trials.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Notice */}
        {actionNotice && (
          <div
            className={`px-5 py-2.5 flex items-center gap-2 text-xs font-semibold ${
              actionNotice.type === 'success'
                ? 'bg-emerald-950/80 text-emerald-300 border-b border-emerald-800'
                : 'bg-red-950/80 text-red-300 border-b border-red-800'
            } animate-fadeIn`}
          >
            {actionNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            )}
            <span>{actionNotice.message}</span>
          </div>
        )}

        {/* Stats Overview */}
        <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-3.5 bg-slate-950/40 border-b border-slate-800">
          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Total Members</span>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-xl font-bold text-slate-100">{totalUsers}</p>
          </div>

          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Paid Users</span>
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xl font-bold text-emerald-400">{totalPaid}</p>
          </div>

          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Free Trial (500)</span>
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-xl font-bold text-amber-400">{totalTrial}</p>
          </div>

          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Visits Dispatched</span>
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-xl font-bold text-cyan-400">{totalVisitsAcrossAll.toLocaleString()}</p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search user by name, email, or organization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
          <div className="text-xs text-slate-400">
            Showing <strong className="text-slate-200">{filteredMembers.length}</strong> of {totalUsers} users
          </div>
        </div>

        {/* Members Table */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-semibold">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role & Tier</th>
                  <th className="py-3 px-4">Traffic Status</th>
                  <th className="py-3 px-4">Visits Remaining</th>
                  <th className="py-3 px-4">Visits Generated</th>
                  <th className="py-3 px-4 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredMembers.map((user) => {
                  const isAdmin = user.role === 'admin';
                  const isPaid = user.isPaidUser;
                  const balance = user.trafficBalance ?? (isAdmin ? 10000000 : 500);

                  return (
                    <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* User Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-full ${
                              isAdmin ? 'bg-amber-600' : 'bg-slate-700'
                            } text-white flex items-center justify-center font-bold text-xs shrink-0`}
                          >
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-100 truncate">{user.name}</p>
                            <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                            {user.registrationIp && (
                              <p className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                                <Globe className="w-2.5 h-2.5 text-slate-400" />
                                <span>IP: {user.registrationIp}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Role & Tier */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span
                            className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              isAdmin
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {user.role}
                          </span>
                          <p className="text-[10px] text-slate-400 capitalize">{user.tier} Tier</p>
                        </div>
                      </td>

                      {/* Traffic Status */}
                      <td className="py-3.5 px-4">
                        {isAdmin ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 bg-amber-950/40 border border-amber-600/40 px-2 py-0.5 rounded-full">
                            <Crown className="w-3 h-3" />
                            Unlimited
                          </span>
                        ) : isPaid ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300 bg-emerald-950/40 border border-emerald-600/40 px-2 py-0.5 rounded-full">
                            <Sparkles className="w-3 h-3" />
                            Paid User
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 bg-amber-950/40 border border-amber-600/40 px-2 py-0.5 rounded-full">
                            <Zap className="w-3 h-3" />
                            Free Trial (500)
                          </span>
                        )}
                      </td>

                      {/* Visits Remaining */}
                      <td className="py-3.5 px-4 font-mono font-bold">
                        {isAdmin ? (
                          <span className="text-amber-400">∞ Unlimited</span>
                        ) : (
                          <span
                            className={
                              balance <= 0
                                ? 'text-red-400'
                                : balance < 50
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                            }
                          >
                            {balance.toLocaleString()} visits
                          </span>
                        )}
                        {!isAdmin && (
                          <div className="w-24 bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                            <div
                              className={`h-full ${
                                balance <= 0 ? 'bg-red-500' : isPaid ? 'bg-emerald-500' : 'bg-amber-500'
                              }`}
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.max(
                                    0,
                                    (balance / (user.totalTrafficAssigned || 500)) * 100
                                  )
                                )}%`,
                              }}
                            />
                          </div>
                        )}
                      </td>

                      {/* Visits Generated */}
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {(user.totalVisitsGenerated || 0).toLocaleString()}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenAssign(user)}
                            title="Assign custom traffic quota"
                            className="px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>Assign Traffic</span>
                          </button>

                          {!isAdmin && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleTogglePaid(user)}
                                title={isPaid ? 'Downgrade to Free Trial' : 'Upgrade to Paid User'}
                                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              >
                                <Sparkles className={`w-3.5 h-3.5 ${isPaid ? 'text-emerald-400' : ''}`} />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleResetTrial(user)}
                                title="Reset to 500 Free Trial visits"
                                className="p-1.5 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDelete(user)}
                                title="Delete user"
                                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Assign Traffic Sub-Modal */}
        {selectedUserForAssign && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <form
              onSubmit={handleConfirmAssign}
              className="w-full max-w-md bg-slate-900 border border-emerald-500/50 rounded-2xl shadow-2xl p-6 space-y-4 text-slate-200"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
                    <PlusCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">Assign Paid Traffic Quota</h3>
                    <p className="text-xs text-slate-400">{selectedUserForAssign.name} ({selectedUserForAssign.email})</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedUserForAssign(null)}
                  className="text-slate-400 hover:text-slate-200 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Current Status */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Current Balance:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {(selectedUserForAssign.trafficBalance || 0).toLocaleString()} visits
                </span>
              </div>

              {/* Additional Traffic Input */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Additional Traffic Visits to Add
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={assignAmount}
                  onChange={(e) => setAssignAmount(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
                />

                {/* Quick Preset Buttons */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[500, 1000, 5000, 10000, 25000, 50000, 100000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAssignAmount(amt)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border font-mono transition-colors cursor-pointer ${
                        assignAmount === amt
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold'
                          : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      +{amt.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={assignMarkAsPaid}
                    onChange={(e) => setAssignMarkAsPaid(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-950 border-slate-700"
                  />
                  <span>Mark as Official Paid Member (Removes 500 trial limit restrictions)</span>
                </label>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Assign Tier
                  </label>
                  <select
                    value={assignTier}
                    onChange={(e) => setAssignTier(e.target.value as MemberTier)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="starter">Starter Tier</option>
                    <option value="pro">Pro Tier</option>
                    <option value="enterprise">Enterprise Tier</option>
                  </select>
                </div>
              </div>

              {/* New Total Preview */}
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
                <span>New Total Balance:</span>
                <span className="font-mono font-bold text-sm">
                  {((selectedUserForAssign.trafficBalance || 0) + Number(assignAmount)).toLocaleString()} visits
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedUserForAssign(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm & Assign</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Admin policy: Users get 500 visits free trial upon registration. All further traffic must be assigned here by admin.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
};
