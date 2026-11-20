'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { api, AuditLogEntry, PaginationMeta } from '../../services/api';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import {
  ShieldCheck,
  Search,
  Filter,
  Calendar,
  FileCode,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Lock,
} from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 15, total: 0 });
  const [actorSearch, setActorSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);

  // Inspector modal
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const fetchLogs = useCallback(
    async (pageToLoad = meta.page) => {
      setLoading(true);
      try {
        const res = await api.getAuditLogs({
          page: pageToLoad,
          limit: meta.limit,
          actorId: actorSearch.trim() || undefined,
          action: actionFilter !== 'ALL' ? actionFilter : undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        });
        setLogs(res.logs);
        setMeta(res.meta);
      } catch (e) {
        console.error('Failed to load audit logs:', e);
      } finally {
        setLoading(false);
      }
    },
    [meta.limit, meta.page, actorSearch, actionFilter, startDate, endDate]
  );

  useEffect(() => {
    fetchLogs(1);
  }, [actorSearch, actionFilter, startDate, endDate]);

  const totalPages = Math.ceil(meta.total / (meta.limit || 1)) || 1;

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('SUSPEND')) return 'rose';
    if (action.includes('CREATE')) return 'emerald';
    if (action.includes('UPDATE')) return 'blue';
    if (action.includes('DELETE')) return 'amber';
    return 'purple';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header and Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Security &amp; Audit Trail</h1>
            <Badge variant="purple" size="sm">
              <Lock className="w-3 h-3 mr-1 inline" />
              Immutable
            </Badge>
          </div>
          <p className="text-xs text-slate-400">
            Append-only verification log of administrative modifications, security events, and user moderation actions.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Actor search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={actorSearch}
              onChange={(e) => setActorSearch(e.target.value)}
              placeholder="Search admin actor..."
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
          >
            <option value="ALL">All Actions</option>
            <option value="USER_SUSPENDED">USER_SUSPENDED</option>
            <option value="USER_UNSUSPENDED">USER_UNSUSPENDED</option>
            <option value="TEMPLATE_CREATED">TEMPLATE_CREATED</option>
            <option value="TEMPLATE_UPDATED">TEMPLATE_UPDATED</option>
            <option value="TEMPLATE_DELETED">TEMPLATE_DELETED</option>
            <option value="SYSTEM_SETTINGS_UPDATE">SYSTEM_SETTINGS_UPDATE</option>
          </select>

          {/* Date range */}
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-medium uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-6 py-3.5">Timestamp (UTC)</th>
                <th scope="col" className="px-6 py-3.5">Admin Actor</th>
                <th scope="col" className="px-6 py-3.5">Action Executed</th>
                <th scope="col" className="px-6 py-3.5">Target Entity</th>
                <th scope="col" className="px-6 py-3.5">IP Address</th>
                <th scope="col" className="px-6 py-3.5 text-right">Details Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 text-brand-500 animate-spin mx-auto mb-2" />
                    <span>Loading audit trail...</span>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No audit records matching filter parameters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-slate-300 text-[11px]">
                      {new Date(log.createdAt).toISOString().replace('T', ' ').slice(0, 19)}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-white text-xs font-sans font-semibold">
                        {log.actorEmail}
                      </div>
                      <div className="text-[10px] text-slate-400">{log.actorId}</div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap font-sans">
                      <Badge variant={getActionBadgeVariant(log.action)} size="sm">
                        {log.action}
                      </Badge>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-slate-300 font-sans text-xs">{log.entityType}</span>
                      <span className="block text-[10px] text-slate-400">{log.entityId}</span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-slate-400 text-[11px]">
                      {log.ipAddress || 'internal'}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right font-sans">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-medium transition-colors"
                      >
                        <FileCode className="w-3.5 h-3.5 text-brand-400" />
                        <span>Inspect Diff</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-3.5 bg-slate-950/40 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing <span className="font-semibold text-white">{logs.length}</span> of{' '}
            <span className="font-semibold text-white">{meta.total}</span> audit records
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={meta.page <= 1}
              onClick={() => fetchLogs(meta.page - 1)}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono px-2">
              Page {meta.page} of {totalPages}
            </span>
            <button
              disabled={meta.page >= totalPages}
              onClick={() => fetchLogs(meta.page + 1)}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* JSON Diff Inspector Modal */}
      {selectedLog && (
        <Modal
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title={`Audit Event: ${selectedLog.action}`}
          description={`Logged by ${selectedLog.actorEmail} at ${selectedLog.createdAt}`}
          maxWidth="xl"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div>
                <span className="text-slate-400 block">Entity Type:</span>
                <span className="text-white font-mono">{selectedLog.entityType}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Entity ID:</span>
                <span className="text-white font-mono">{selectedLog.entityId}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Origin IP:</span>
                <span className="text-white font-mono">{selectedLog.ipAddress || 'internal'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Record UUID:</span>
                <span className="text-white font-mono">{selectedLog.id}</span>
              </div>
            </div>

            <div>
              <span className="block text-xs font-semibold text-slate-300 mb-1.5">
                Event Payload &amp; State Diff:
              </span>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-72">
                {JSON.stringify(selectedLog.details, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-medium text-white hover:bg-slate-700"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
