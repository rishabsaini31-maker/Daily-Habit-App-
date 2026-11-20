'use client';

import React, { useEffect, useState } from 'react';
import { AdminShell } from '../../components/AdminShell';
import { AdminService, DashboardStats } from '../../services/admin-service';
import {
  Users,
  CreditCard,
  Clock,
  ShieldAlert,
  ArrowUpRight,
  TrendingUp,
  Smartphone,
  Sparkles,
  Zap,
  Activity,
  CheckCircle2,
} from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const data = await AdminService.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  // Find max value for 14-day chart scaling
  const maxHours = stats ? Math.max(...stats.chart_14d.map((d) => Math.max(d.reclaimed_hours, d.screen_time_hours, 1)), 5) : 5;

  return (
    <AdminShell onRefresh={handleRefresh} isRefreshing={refreshing}>
      <div className="space-y-8">
        {/* Top Summary Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-[#12141D] via-[#161925] to-[#12141D] border border-[#1E2230] relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-full bg-gradient-to-l from-cyan-500/10 via-transparent to-transparent pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[#10B981] text-xs font-mono mb-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>All Native Blocking Systems Operational</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Global Screen-Time Reclamation Engine
              </h1>
              <p className="text-xs text-[#8A94A6] mt-1 max-w-2xl">
                Real-time tracking of active Focus sessions, surgical feeds intercepted on Android & iOS,
                and paid RevenueCat Pro subscriptions across all active mobile installations.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs text-[#8A94A6] font-mono">Realtime Interceptions</div>
                <div className="text-lg font-bold text-[#38BDF8] flex items-center justify-end gap-1">
                  <Activity className="w-4 h-4 animate-pulse" />
                  <span>Live 0ms Shield</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Executive KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* KPI 1: Total Users */}
          <div className="p-6 rounded-2xl bg-[#12141D] border border-[#1E2230] relative group hover:border-[#38BDF8]/40 transition-all shadow-lg shadow-black/20">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-[#8A94A6]">TOTAL USERS</span>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-[#38BDF8]">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {loading ? '...' : (stats?.total_users ?? 0).toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-[#10B981]">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Direct OAuth & Guest Profiles</span>
            </div>
          </div>

          {/* KPI 2: Pro Subscribers */}
          <div className="p-6 rounded-2xl bg-[#12141D] border border-[#1E2230] relative group hover:border-[#10B981]/40 transition-all shadow-lg shadow-black/20">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-[#8A94A6]">PRO SUBSCRIBERS</span>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[#10B981]">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white tracking-tight">
                {loading ? '...' : stats?.pro_subscribers ?? 0}
              </span>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-[#10B981] border border-emerald-500/30">
                {stats?.conversion_percentage ?? 0}% conv
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-[#8A94A6]">
              <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>RevenueCat Entitlements</span>
            </div>
          </div>

          {/* KPI 3: Reclaimed Hours */}
          <div className="p-6 rounded-2xl bg-[#12141D] border border-[#1E2230] relative group hover:border-[#38BDF8]/40 transition-all shadow-lg shadow-black/20">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-[#8A94A6]">HOURS RECLAIMED</span>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-[#38BDF8]">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {loading ? '...' : `${stats?.total_reclaimed_hours ?? 0} hrs`}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-[#38BDF8]">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Screen Time Prevented</span>
            </div>
          </div>

          {/* KPI 4: Distractions Blocked Today */}
          <div className="p-6 rounded-2xl bg-[#12141D] border border-[#1E2230] relative group hover:border-[#38BDF8]/40 transition-all shadow-lg shadow-black/20">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-[#8A94A6]">BLOCKED TODAY</span>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {loading ? '...' : (stats?.distractions_blocked_today ?? 0).toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-purple-400">
              <Zap className="w-3.5 h-3.5" />
              <span>Shield Modal Interceptions</span>
            </div>
          </div>
        </div>

        {/* Charts and Leaderboard Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 14-Day Focus & Reclaimed Hours Trend */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-[#12141D] border border-[#1E2230] flex flex-col justify-between shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  14-Day Global Focus & Reclaimed Hours
                </h3>
                <p className="text-xs text-[#8A94A6] mt-0.5">
                  Comparison of total blocked distraction time vs daily screen-time baseline
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#10B981]" />
                  <span className="text-[#8A94A6]">Reclaimed (hrs)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#38BDF8]/40" />
                  <span className="text-[#8A94A6]">Screen Time (hrs)</span>
                </div>
              </div>
            </div>

            {/* Interactive SVG Bar/Area Chart */}
            <div className="h-64 w-full flex items-end gap-2 pt-6 pb-2 px-2 border-b border-[#1E2230]">
              {(stats?.chart_14d || []).map((day, idx) => {
                const reclaimedH = Math.max(8, (day.reclaimed_hours / maxHours) * 100);
                const screenH = Math.max(12, (day.screen_time_hours / maxHours) * 100);
                const label = day.date.slice(5); // e.g. "11-20"
                return (
                  <div
                    key={day.date || idx}
                    className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end"
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-[#08090D] border border-[#1E2230] p-1.5 rounded-lg text-[10px] font-mono whitespace-nowrap z-20 pointer-events-none shadow-xl">
                      <p className="text-white font-bold">{day.date}</p>
                      <p className="text-[#10B981]">Reclaimed: {day.reclaimed_hours}h</p>
                      <p className="text-[#38BDF8]">Focus: {day.avg_score}/100</p>
                    </div>

                    <div className="w-full flex items-end justify-center gap-1 h-full">
                      {/* Reclaimed Bar */}
                      <div
                        style={{ height: `${reclaimedH}%` }}
                        className="w-full max-w-[14px] rounded-t-sm bg-gradient-to-t from-emerald-600 to-[#10B981] group-hover:brightness-125 transition-all shadow-sm shadow-emerald-500/20"
                      />
                      {/* Screen Time Bar */}
                      <div
                        style={{ height: `${screenH}%` }}
                        className="w-full max-w-[14px] rounded-t-sm bg-[#38BDF8]/30 group-hover:bg-[#38BDF8]/50 transition-all"
                      />
                    </div>
                    <span className="text-[10px] font-mono text-[#8A94A6] mt-2 truncate">{label}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between pt-4 text-xs text-[#8A94A6] font-mono">
              <span>Source: public.daily_metrics</span>
              <span className="text-[#10B981] font-bold">14-Day Trend Healthy</span>
            </div>
          </div>

          {/* Top Blocked Apps Leaderboard */}
          <div className="p-6 rounded-2xl bg-[#12141D] border border-[#1E2230] flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white tracking-tight">Top Blocked Apps</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-[#38BDF8] border border-cyan-500/20">
                  Global Rank
                </span>
              </div>
              <p className="text-xs text-[#8A94A6] mb-4">
                Apps most frequently targeted by users for full shielding or surgical Reels/Shorts blocking.
              </p>

              <div className="space-y-3">
                {(stats?.top_blocked_apps || []).map((app, index) => (
                  <div
                    key={app.package_or_token || index}
                    className="p-3 rounded-xl bg-[#08090D] border border-[#1E2230] flex items-center justify-between hover:border-[#38BDF8]/30 transition-all"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <span className="w-6 h-6 rounded-lg bg-[#161925] text-xs font-mono font-bold flex items-center justify-center text-[#8A94A6]">
                        {index + 1}
                      </span>
                      <div className="truncate">
                        <p className="text-sm font-semibold text-white truncate">{app.display_name}</p>
                        <p className="text-[10px] text-[#8A94A6] font-mono truncate">{app.package_or_token}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <span className="text-xs font-mono font-bold text-[#10B981]">{app.count} targets</span>
                      <p className="text-[10px] text-[#8A94A6] capitalize">{app.platform}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#1E2230] flex items-center justify-between text-xs text-[#8A94A6]">
              <span className="flex items-center gap-1.5 font-mono">
                <Smartphone className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>Android & iOS Active Stores</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
