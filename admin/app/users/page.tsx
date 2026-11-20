'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { api, AdminUser, PaginationMeta } from '../../services/api';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import {
  Search,
  Filter,
  UserX,
  UserCheck,
  Shield,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  Flame,
} from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 10, total: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Moderation Modal state
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [actionType, setActionType] = useState<'SUSPEND' | 'UNSUSPEND'>('SUSPEND');
  const [reason, setReason] = useState('');
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchUsers = useCallback(
    async (pageToLoad = meta.page) => {
      setLoading(true);
      try {
        const res = await api.getUsers({
          page: pageToLoad,
          limit: meta.limit,
          search: search.trim() || undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
        });
        setUsers(res.users);
        setMeta(res.meta);
      } catch (e) {
        console.error('Failed to fetch users:', e);
      } finally {
        setLoading(false);
      }
    },
    [meta.limit, meta.page, search, statusFilter]
  );

  useEffect(() => {
    fetchUsers(1);
  }, [search, statusFilter]);

  const openModerationModal = (user: AdminUser, action: 'SUSPEND' | 'UNSUSPEND') => {
    setSelectedUser(user);
    setActionType(action);
    setReason('');
    setModalError(null);
  };

  const handleModerationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (reason.trim().length < 5) {
      setModalError('Audit reason must be at least 5 characters in length.');
      return;
    }
    setModalSubmitting(true);
    setModalError(null);
    try {
      const targetStatus = actionType === 'SUSPEND' ? 'SUSPENDED' : 'ACTIVE';
      await api.updateUserStatus(selectedUser.id, targetStatus, reason.trim());
      setSelectedUser(null);
      await fetchUsers(meta.page);
    } catch (err: any) {
      setModalError(err.message || 'Failed to update user status.');
    } finally {
      setModalSubmitting(false);
    }
  };

  const totalPages = Math.ceil(meta.total / (meta.limit || 1)) || 1;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header and Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">User Moderation</h1>
          <p className="text-xs text-slate-400">
            Search, inspect activity metrics, and enforce account suspensions with mandatory audit reasons.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Accounts</option>
              <option value="SUSPENDED">Suspended Accounts</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-medium uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-6 py-3.5">User</th>
                <th scope="col" className="px-6 py-3.5">Role</th>
                <th scope="col" className="px-6 py-3.5">Status</th>
                <th scope="col" className="px-6 py-3.5">Timezone</th>
                <th scope="col" className="px-6 py-3.5 text-center">Habits</th>
                <th scope="col" className="px-6 py-3.5 text-center">Streaks</th>
                <th scope="col" className="px-6 py-3.5">Registered</th>
                <th scope="col" className="px-6 py-3.5 text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 text-brand-500 animate-spin mx-auto mb-2" />
                    <span>Loading registered users...</span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    No users matching criteria found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-brand-400">
                          {u.displayName.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-white group-hover:text-brand-400 transition-colors">
                            {u.displayName}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {u.role === 'ADMIN' ? (
                        <Badge variant="purple" size="sm">
                          <Shield className="w-3 h-3 mr-1 inline" />
                          ADMIN
                        </Badge>
                      ) : (
                        <Badge variant="slate" size="sm">
                          USER
                        </Badge>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {u.status === 'ACTIVE' ? (
                        <Badge variant="emerald" size="sm">
                          ACTIVE
                        </Badge>
                      ) : (
                        <Badge variant="rose" size="sm">
                          SUSPENDED
                        </Badge>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                      {u.timezone}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-center font-semibold text-white">
                      {u.totalHabits}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center gap-1 font-semibold text-amber-400">
                        <Flame className="w-3.5 h-3.5" />
                        {u.activeStreaks}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-slate-400 text-[11px]">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {u.role === 'ADMIN' ? (
                        <span className="text-[11px] text-slate-400 font-mono italic">
                          Protected System Admin
                        </span>
                      ) : u.status === 'ACTIVE' ? (
                        <button
                          onClick={() => openModerationModal(u, 'SUSPEND')}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-medium transition-colors"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>Suspend</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => openModerationModal(u, 'UNSUSPEND')}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-medium transition-colors"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Unsuspend</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-3.5 bg-slate-950/40 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing <span className="font-semibold text-white">{users.length}</span> of{' '}
            <span className="font-semibold text-white">{meta.total}</span> users
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={meta.page <= 1}
              onClick={() => fetchUsers(meta.page - 1)}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono px-2">
              Page {meta.page} of {totalPages}
            </span>
            <button
              disabled={meta.page >= totalPages}
              onClick={() => fetchUsers(meta.page + 1)}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Moderation Modal */}
      {selectedUser && (
        <Modal
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          title={
            actionType === 'SUSPEND'
              ? `Suspend User: ${selectedUser.displayName}`
              : `Restore Account: ${selectedUser.displayName}`
          }
          description="Enforce platform moderation policy. All changes are logged into the immutable security audit trail."
        >
          <form onSubmit={handleModerationSubmit} className="space-y-4">
            {modalError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
              <div className="text-slate-400">Target User: <span className="text-white font-mono">{selectedUser.email}</span></div>
              <div className="text-slate-400">User ID: <span className="text-slate-300 font-mono">{selectedUser.id}</span></div>
              <div className="text-slate-400">
                Action: <span className={actionType === 'SUSPEND' ? 'text-rose-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                  {actionType === 'SUSPEND' ? 'Lock Account & Revoke Sessions' : 'Unlock Account & Permit Sign-in'}
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="reason" className="block text-xs font-medium text-slate-300 mb-1.5">
                Mandatory Audit Reason <span className="text-rose-400">*</span>
              </label>
              <textarea
                id="reason"
                required
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Specify violation or justification (e.g. Terms of Service violation, spam bot heuristic, user request)..."
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Minimum 5 characters required for audit compliance.</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={modalSubmitting}
                className={`px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-lg transition-all flex items-center gap-2 ${
                  actionType === 'SUSPEND'
                    ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/25'
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25'
                }`}
              >
                {modalSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>{actionType === 'SUSPEND' ? 'Confirm Suspension' : 'Confirm Restoration'}</span>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
