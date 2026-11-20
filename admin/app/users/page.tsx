'use client';

import React, { useEffect, useState } from 'react';
import { AdminShell } from '../../components/AdminShell';
import { AdminService, UserProfile, UserDetailData } from '../../services/admin-service';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Sparkles,
  Flame,
  Award,
  Clock,
  Calendar,
  Shield,
  X,
  Plus,
  RefreshCw,
  Gift,
  RotateCcw,
  Smartphone,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [proFilter, setProFilter] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Drawer
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<UserDetailData | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const { users: fetchedUsers, totalCount: count } = await AdminService.getUsers({
        search,
        tierFilter,
        proFilter,
        page,
        pageSize,
      });
      setUsers(fetchedUsers);
      setTotalCount(count);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, tierFilter, proFilter, page]);

  const handleOpenDrawer = async (userId: string) => {
    setSelectedUserId(userId);
    setDrawerLoading(true);
    setActionSuccess(null);
    try {
      const details = await AdminService.getUserDetails(userId);
      setUserDetail(details);
    } catch (err) {
      console.error('Failed to load user details:', err);
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleCloseDrawer = () => {
    setSelectedUserId(null);
    setUserDetail(null);
    setActionSuccess(null);
  };

  const handleTogglePro = async () => {
    if (!userDetail) return;
    const newPro = !userDetail.profile.is_pro;
    const ok = await AdminService.setUserPro(userDetail.profile.id, newPro);
    if (ok) {
      setUserDetail({
        ...userDetail,
        profile: { ...userDetail.profile, is_pro: newPro },
      });
      setActionSuccess(`Pro status updated to ${newPro ? 'ACTIVE' : 'INACTIVE'}`);
      fetchUsers();
    }
  };

  const handleGiftGems = async (amount: number) => {
    if (!userDetail) return;
    const ok = await AdminService.giftGems(userDetail.profile.id, amount);
    if (ok) {
      const newTotal = Math.max(0, userDetail.profile.total_gems + amount);
      setUserDetail({
        ...userDetail,
        profile: { ...userDetail.profile, total_gems: newTotal },
      });
      setActionSuccess(`Successfully gifted ${amount > 0 ? '+' : ''}${amount} Gems`);
      fetchUsers();
    }
  };

  const handleResetStreak = async () => {
    if (!userDetail) return;
    const ok = await AdminService.resetStreak(userDetail.profile.id);
    if (ok) {
      setUserDetail({
        ...userDetail,
        profile: { ...userDetail.profile, streak_days: 0 },
      });
      setActionSuccess('User streak successfully reset to 0');
      fetchUsers();
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'diamond':
        return 'text-[#38BDF8] border-cyan-500/30 bg-cyan-500/10';
      case 'obsidian':
        return 'text-purple-400 border-purple-500/30 bg-purple-500/10';
      case 'gold':
        return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
      case 'silver':
        return 'text-slate-300 border-slate-500/30 bg-slate-500/10';
      default:
        return 'text-amber-700 border-amber-800/30 bg-amber-900/10';
    }
  };

  return (
    <AdminShell
      onRefresh={() => {
        setRefreshing(true);
        fetchUsers();
      }}
      isRefreshing={refreshing}
    >
      <div className="space-y-6">
        {/* Search & Filter Header Bar */}
        <div className="p-4 rounded-2xl bg-[#12141D] border border-[#1E2230] flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-[#8A94A6] absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by OAuth Sub ID or Display Name..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#08090D] border border-[#1E2230] text-sm text-white placeholder-[#8A94A6]/50 focus:outline-none focus:border-[#38BDF8] transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Tier Filter */}
            <select
              value={tierFilter}
              onChange={(e) => {
                setTierFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl bg-[#08090D] border border-[#1E2230] text-xs text-white focus:outline-none focus:border-[#38BDF8]"
            >
              <option value="all">All Tiers</option>
              <option value="Bronze">Bronze</option>
              <option value="Silver">Silver</option>
              <option value="Gold">Gold</option>
              <option value="Obsidian">Obsidian</option>
              <option value="Diamond">Diamond</option>
            </select>

            {/* Pro Filter */}
            <select
              value={proFilter}
              onChange={(e) => {
                setProFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl bg-[#08090D] border border-[#1E2230] text-xs text-white focus:outline-none focus:border-[#38BDF8]"
            >
              <option value="all">All Subscriptions</option>
              <option value="pro">Pro Subscribers Only</option>
              <option value="free">Free Users Only</option>
            </select>

            <div className="text-xs font-mono text-[#8A94A6] pl-2">
              <span>{totalCount} Total Registered</span>
            </div>
          </div>
        </div>

        {/* Responsive Data Table */}
        <div className="rounded-2xl bg-[#12141D] border border-[#1E2230] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#161925] border-b border-[#1E2230] text-[11px] font-mono text-[#8A94A6] uppercase">
                <tr>
                  <th className="py-3.5 px-4">User Identifier</th>
                  <th className="py-3.5 px-4">Subscription</th>
                  <th className="py-3.5 px-4">Tier Rank</th>
                  <th className="py-3.5 px-4">Streak</th>
                  <th className="py-3.5 px-4">Gems</th>
                  <th className="py-3.5 px-4">Baseline</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2230]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#8A94A6] font-mono text-xs">
                      Loading user profiles from Supabase PostgreSQL...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#8A94A6] font-mono text-xs">
                      No matching user profiles found.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-[#161925]/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-white">{u.display_name || 'Anonymous Guest'}</span>
                          <span className="text-[11px] font-mono text-[#8A94A6] truncate max-w-[200px]" title={u.id}>
                            {u.id}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {u.is_pro ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono bg-emerald-500/15 text-[#10B981] border border-emerald-500/30">
                            <Sparkles className="w-3 h-3" />
                            PRO
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono bg-slate-800 text-[#8A94A6] border border-[#1E2230]">
                            FREE
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold border ${getTierColor(
                            u.tier_rank
                          )}`}
                        >
                          {u.tier_rank || 'Bronze'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-xs text-white">
                          <Flame className="w-3.5 h-3.5 text-orange-400" />
                          <span>{u.streak_days} days</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-[#38BDF8]">
                          <Award className="w-3.5 h-3.5" />
                          <span>{u.total_gems.toLocaleString()}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs font-mono text-[#8A94A6]">
                        {u.daily_baseline_minutes ? `${(u.daily_baseline_minutes / 60).toFixed(1)} hrs/d` : '4.0 hrs/d'}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenDrawer(u.id)}
                          className="px-3 py-1.5 rounded-xl bg-[#161925] border border-[#1E2230] text-xs font-medium text-white hover:border-[#38BDF8] hover:text-[#38BDF8] transition-all"
                        >
                          Inspect & Manage
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 bg-[#161925] border-t border-[#1E2230] flex items-center justify-between">
            <span className="text-xs text-[#8A94A6] font-mono">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1.5 rounded-lg bg-[#08090D] border border-[#1E2230] text-[#8A94A6] disabled:opacity-40 hover:text-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1.5 rounded-lg bg-[#08090D] border border-[#1E2230] text-[#8A94A6] disabled:opacity-40 hover:text-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Slide-over User Detail Drawer */}
        {selectedUserId && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={handleCloseDrawer} />

            {/* Drawer Panel */}
            <div className="relative w-full max-w-xl bg-[#12141D] border-l border-[#1E2230] h-full overflow-y-auto p-6 z-10 shadow-2xl flex flex-col justify-between">
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-[#1E2230]">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-[#38BDF8]" />
                    <h3 className="text-base font-bold text-white">User Moderation & State</h3>
                  </div>
                  <button
                    onClick={handleCloseDrawer}
                    className="p-1.5 rounded-lg text-[#8A94A6] hover:text-white hover:bg-[#1E2230]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {actionSuccess && (
                  <div className="my-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-[#10B981] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>{actionSuccess}</span>
                  </div>
                )}

                {drawerLoading || !userDetail ? (
                  <div className="py-20 text-center text-[#8A94A6] font-mono text-xs">
                    Fetching live user telemetry from Supabase...
                  </div>
                ) : (
                  <div className="mt-6 space-y-6">
                    {/* User Profile Card */}
                    <div className="p-4 rounded-xl bg-[#08090D] border border-[#1E2230]">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-lg font-bold text-white">
                            {userDetail.profile.display_name || 'Anonymous User'}
                          </h4>
                          <p className="text-xs font-mono text-[#8A94A6] mt-0.5 break-all">
                            ID: {userDetail.profile.id}
                          </p>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold border ${getTierColor(
                            userDetail.profile.tier_rank
                          )}`}
                        >
                          {userDetail.profile.tier_rank}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-[#1E2230] text-center">
                        <div>
                          <span className="text-[10px] text-[#8A94A6] uppercase font-mono">Total Gems</span>
                          <p className="text-base font-bold text-[#38BDF8]">{userDetail.profile.total_gems}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#8A94A6] uppercase font-mono">Streak Days</span>
                          <p className="text-base font-bold text-orange-400">{userDetail.profile.streak_days} d</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#8A94A6] uppercase font-mono">Baseline</span>
                          <p className="text-base font-bold text-white">
                            {((userDetail.profile.daily_baseline_minutes || 240) / 60).toFixed(1)} hrs
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Quick Admin Actions */}
                    <div className="space-y-3">
                      <h5 className="text-xs font-bold text-[#8A94A6] uppercase font-mono">Admin Override Actions</h5>
                      <div className="grid grid-cols-2 gap-3">
                        {/* Toggle Pro Access */}
                        <button
                          onClick={handleTogglePro}
                          className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                            userDetail.profile.is_pro
                              ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                              : 'bg-emerald-500/10 border-emerald-500/30 text-[#10B981] hover:bg-emerald-500/20'
                          }`}
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>{userDetail.profile.is_pro ? 'Revoke Pro Access' : 'Grant VIP Pro Access'}</span>
                        </button>

                        {/* Reset Streak */}
                        <button
                          onClick={handleResetStreak}
                          className="p-3 rounded-xl bg-[#08090D] border border-[#1E2230] text-xs font-semibold text-[#8A94A6] hover:text-white hover:border-[#1E2230] flex items-center justify-center gap-2"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>Reset Streak to 0</span>
                        </button>
                      </div>

                      {/* Gift Gems */}
                      <div className="p-3 rounded-xl bg-[#08090D] border border-[#1E2230] flex items-center justify-between">
                        <span className="text-xs text-[#8A94A6] font-mono">Gift Focus Gems:</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleGiftGems(50)}
                            className="px-2.5 py-1 rounded-lg bg-[#161925] border border-[#1E2230] text-xs font-mono text-[#38BDF8] hover:border-[#38BDF8]"
                          >
                            +50
                          </button>
                          <button
                            onClick={() => handleGiftGems(500)}
                            className="px-2.5 py-1 rounded-lg bg-[#161925] border border-[#1E2230] text-xs font-mono text-[#38BDF8] hover:border-[#38BDF8]"
                          >
                            +500
                          </button>
                          <button
                            onClick={() => handleGiftGems(2500)}
                            className="px-2.5 py-1 rounded-lg bg-[#161925] border border-[#1E2230] text-xs font-mono text-[#38BDF8] hover:border-[#38BDF8]"
                          >
                            +2,500
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Active Blocked Targets */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-bold text-[#8A94A6] uppercase font-mono">
                          Blocked Targets ({userDetail.blocked_targets.length})
                        </h5>
                      </div>
                      {userDetail.blocked_targets.length === 0 ? (
                        <p className="text-xs text-[#8A94A6] italic">No active blocked apps registered.</p>
                      ) : (
                        <div className="space-y-1.5 max-h-36 overflow-y-auto">
                          {userDetail.blocked_targets.map((t) => (
                            <div
                              key={t.id}
                              className="p-2.5 rounded-lg bg-[#08090D] border border-[#1E2230] flex items-center justify-between text-xs"
                            >
                              <div>
                                <span className="font-semibold text-white">{t.display_name}</span>
                                <span className="text-[10px] text-[#8A94A6] font-mono ml-2">({t.platform})</span>
                              </div>
                              {t.is_surgical_feed_only ? (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-[#38BDF8] border border-cyan-500/20 font-mono">
                                  Surgical Reels
                                </span>
                              ) : (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-mono">
                                  Full App
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Active Schedules */}
                    <div className="space-y-2">
                      <h5 className="text-xs font-bold text-[#8A94A6] uppercase font-mono">
                        Active Schedules ({userDetail.schedules.length})
                      </h5>
                      {userDetail.schedules.length === 0 ? (
                        <p className="text-xs text-[#8A94A6] italic">No schedules configured.</p>
                      ) : (
                        <div className="space-y-1.5 max-h-36 overflow-y-auto">
                          {userDetail.schedules.map((s) => (
                            <div
                              key={s.id}
                              className="p-2.5 rounded-lg bg-[#08090D] border border-[#1E2230] flex items-center justify-between text-xs"
                            >
                              <div>
                                <span className="font-semibold text-white">{s.title}</span>
                                <span className="text-[10px] text-[#8A94A6] font-mono ml-2">({s.trigger_type})</span>
                              </div>
                              <span
                                className={`text-[10px] font-mono font-semibold ${
                                  s.is_active ? 'text-[#10B981]' : 'text-[#8A94A6]'
                                }`}
                              >
                                {s.is_active ? 'ACTIVE' : 'DISABLED'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Close Button at bottom */}
              <div className="pt-6 border-t border-[#1E2230] mt-6">
                <button
                  onClick={handleCloseDrawer}
                  className="w-full py-2.5 rounded-xl bg-[#161925] border border-[#1E2230] text-sm text-white hover:bg-[#1E2230] transition-colors"
                >
                  Close Drawer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
