'use client';

import React, { useEffect, useState } from 'react';
import { AdminShell } from '../../components/AdminShell';
import {
  AdminService,
  WebhookLogEntry,
  EmergencyUnlockLogEntry,
} from '../../services/admin-service';
import {
  Terminal,
  Activity,
  KeyRound,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  X,
  Clock,
  Shield,
  Smartphone,
  Search,
} from 'lucide-react';

export default function LogsPage() {
  const [activeTab, setActiveTab] = useState<'webhooks' | 'emergency'>('webhooks');
  const [webhookLogs, setWebhookLogs] = useState<WebhookLogEntry[]>([]);
  const [emergencyLogs, setEmergencyLogs] = useState<EmergencyUnlockLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Payload Modal
  const [selectedPayload, setSelectedPayload] = useState<any | null>(null);

  const fetchLogs = async () => {
    try {
      if (activeTab === 'webhooks') {
        const logs = await AdminService.getWebhookLogs(50, eventTypeFilter);
        setWebhookLogs(logs);
      } else {
        const logs = await AdminService.getEmergencyUnlockAuditLogs(50);
        setEmergencyLogs(logs);
      }
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchLogs();
  }, [activeTab, eventTypeFilter]);

  const filteredWebhookLogs = webhookLogs.filter((l) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      l.provider.toLowerCase().includes(s) ||
      l.event_type.toLowerCase().includes(s) ||
      (l.user_id && l.user_id.toLowerCase().includes(s))
    );
  });

  return (
    <AdminShell
      onRefresh={() => {
        setRefreshing(true);
        fetchLogs();
      }}
      isRefreshing={refreshing}
    >
      <div className="space-y-6 max-w-6xl">
        {/* Top Tab Bar & Filter Controls */}
        <div className="p-4 rounded-2xl bg-[#12141D] border border-[#1E2230] flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Sub-Tab Switcher */}
          <div className="flex items-center gap-2 p-1 bg-[#08090D] border border-[#1E2230] rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('webhooks')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'webhooks'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-emerald-500/10 text-white border border-[#38BDF8]/30 shadow-sm'
                  : 'text-[#8A94A6] hover:text-white'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>RevenueCat & Webhooks</span>
            </button>
            <button
              onClick={() => setActiveTab('emergency')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'emergency'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-emerald-500/10 text-white border border-[#38BDF8]/30 shadow-sm'
                  : 'text-[#8A94A6] hover:text-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 text-orange-400" />
              <span>Emergency Unlock OTPs</span>
            </button>
          </div>

          {/* Search & Event Filter */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {activeTab === 'webhooks' && (
              <select
                value={eventTypeFilter}
                onChange={(e) => setEventTypeFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-[#08090D] border border-[#1E2230] text-xs text-white focus:outline-none focus:border-[#38BDF8]"
              >
                <option value="all">All Event Types</option>
                <option value="INITIAL_PURCHASE">INITIAL_PURCHASE</option>
                <option value="RENEWAL">RENEWAL</option>
                <option value="EXPIRATION">EXPIRATION</option>
                <option value="ADMIN_SET_PRO">ADMIN_SET_PRO</option>
                <option value="ADMIN_GIFT_GEMS">ADMIN_GIFT_GEMS</option>
              </select>
            )}

            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-[#8A94A6] absolute left-3 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter logs..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#08090D] border border-[#1E2230] text-xs text-white placeholder-[#8A94A6]/50 focus:outline-none focus:border-[#38BDF8]"
              />
            </div>
          </div>
        </div>

        {/* WEBHOOKS TABLE */}
        {activeTab === 'webhooks' && (
          <div className="rounded-2xl bg-[#12141D] border border-[#1E2230] overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#161925] border-b border-[#1E2230] text-[11px] font-mono text-[#8A94A6] uppercase">
                  <tr>
                    <th className="py-3.5 px-4">Provider</th>
                    <th className="py-3.5 px-4">Event Type</th>
                    <th className="py-3.5 px-4">Target User ID</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Timestamp</th>
                    <th className="py-3.5 px-4 text-right">Payload</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2230]">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[#8A94A6] font-mono text-xs">
                        Streaming webhook audit entries from Supabase...
                      </td>
                    </tr>
                  ) : filteredWebhookLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[#8A94A6] font-mono text-xs">
                        No webhook events recorded.
                      </td>
                    </tr>
                  ) : (
                    filteredWebhookLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#161925]/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-white uppercase text-xs font-mono">
                            {log.provider}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-cyan-500/10 text-[#38BDF8] border border-cyan-500/20">
                            {log.event_type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-xs font-mono text-[#8A94A6] truncate max-w-[200px] block" title={log.user_id || 'System'}>
                            {log.user_id || 'System / Global'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-mono font-bold ${
                              log.status === 'success' ? 'text-[#10B981]' : 'text-red-400'
                            }`}
                          >
                            {log.status === 'success' ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5" />
                            )}
                            {log.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs font-mono text-[#8A94A6]">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setSelectedPayload(log.payload)}
                            className="px-2.5 py-1 rounded-lg bg-[#161925] border border-[#1E2230] text-xs font-mono text-[#8A94A6] hover:text-white hover:border-[#38BDF8] transition-colors"
                          >
                            View Raw
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* EMERGENCY UNLOCK AUDIT TABLE */}
        {activeTab === 'emergency' && (
          <div className="rounded-2xl bg-[#12141D] border border-[#1E2230] overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#161925] border-b border-[#1E2230] text-[11px] font-mono text-[#8A94A6] uppercase">
                  <tr>
                    <th className="py-3.5 px-4">User ID</th>
                    <th className="py-3.5 px-4">Session Ref</th>
                    <th className="py-3.5 px-4">OTP Code</th>
                    <th className="py-3.5 px-4">Partner Contact</th>
                    <th className="py-3.5 px-4">Outcome</th>
                    <th className="py-3.5 px-4 text-right">Generated At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2230]">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[#8A94A6] font-mono text-xs">
                        Loading emergency unlock audit records...
                      </td>
                    </tr>
                  ) : emergencyLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[#8A94A6] font-mono text-xs">
                        No emergency unlock OTP requests found in database.
                      </td>
                    </tr>
                  ) : (
                    emergencyLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#161925]/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-xs text-white truncate max-w-[150px] block" title={log.user_id}>
                            {log.user_id}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-[#8A94A6]">
                          {log.session_id.slice(0, 13)}...
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded font-mono font-bold text-xs bg-orange-500/10 text-orange-400 border border-orange-500/20">
                            {log.otp_code}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs font-mono text-[#8A94A6]">
                          {log.partner_phone || 'None / In-App'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-mono font-bold ${
                              log.is_used ? 'text-[#10B981]' : 'text-amber-400'
                            }`}
                          >
                            {log.is_used ? 'UNLOCKED / USED' : 'PENDING / EXPIRED'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right text-xs font-mono text-[#8A94A6]">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Raw JSON Payload Modal */}
        {selectedPayload && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedPayload(null)} />
            <div className="relative w-full max-w-2xl bg-[#12141D] border border-[#1E2230] rounded-2xl p-6 z-10 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#1E2230]">
                <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#38BDF8]" />
                  <span>Raw Webhook Payload</span>
                </h4>
                <button
                  onClick={() => setSelectedPayload(null)}
                  className="p-1 rounded-lg text-[#8A94A6] hover:text-white hover:bg-[#1E2230]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-[#08090D] border border-[#1E2230] text-xs font-mono text-[#38BDF8] overflow-x-auto max-h-96">
                {JSON.stringify(selectedPayload, null, 2)}
              </pre>

              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedPayload(null)}
                  className="px-4 py-2 rounded-xl bg-[#161925] border border-[#1E2230] text-xs font-medium text-white hover:bg-[#1E2230]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
