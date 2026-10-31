'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import type { AuditLogEntryDto } from '@/lib/types';

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntryDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionFilter, setActionFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function loadLogs() {
      setLoading(true);
      try {
        const query = new URLSearchParams({
          page: page.toString(),
          pageSize: '50',
          ...(actionFilter !== 'ALL' ? { action: actionFilter } : {}),
        });

        const res = await fetch(`/api/admin/audit-logs?${query.toString()}`);
        if (res.ok) {
          const json = await res.json();
          setLogs(json.data.items);
          setTotal(json.data.total);
          setTotalPages(json.data.totalPages);
        }
      } finally {
        setLoading(false);
      }
    }
    void loadLogs();
  }, [page, actionFilter]);

  const actionsList = [
    'ALL',
    'NIN_ACCESS',
    'DOWN_PAYMENT_VERIFIED',
    'AGREEMENT_ACTIVATED',
    'BALANCE_PAYMENT_RECORDED',
    'SETTLEMENT_PAYMENT_RECORDED',
    'APPLICATION_REJECTED',
    'EXCHANGE_RATE_UPDATED',
    'INVENTORY_UPDATE_PROPOSED',
    'SYSTEM_BOOT',
  ];

  return (
    <div className="space-y-spacing-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-spacing-3 pb-spacing-4 border-b border-border-default">
        <div>
          <h1 className="text-title-lg font-bold text-text-primary tracking-tight">
            Immutable Platform Audit Log
          </h1>
          <p className="text-body-sm text-text-secondary mt-1">
            System of Record (FR-11, PRD 5.1 & 8.4). 50 rows per page immutable ledger of financial, administrative, and sensitive operations.
          </p>
        </div>
        <Link
          href="/admin"
          className="inline-flex items-center justify-center px-spacing-4 py-spacing-2 text-body-sm font-semibold rounded-radius-md bg-surface-primary text-text-primary border border-border-default hover:bg-surface-secondary transition-colors"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Filter & Pagination Controls */}
      <div className="flex flex-wrap items-center justify-between gap-spacing-3 bg-surface-primary p-spacing-4 rounded-radius-md border border-border-default">
        <div className="flex items-center gap-spacing-2">
          <label className="text-caption font-semibold text-text-secondary">
            Filter Action:
          </label>
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="px-spacing-3 py-spacing-1.5 text-body-sm rounded-radius-md border border-border-default bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-focus font-mono"
          >
            {actionsList.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-spacing-3 text-caption text-text-secondary">
          <span>
            Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({total} total logs)
          </span>
          <div className="flex items-center gap-spacing-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-spacing-2.5 py-spacing-1 rounded-radius-sm border border-border-default bg-surface-primary disabled:text-text-disabled hover:bg-surface-secondary"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-spacing-2.5 py-spacing-1 rounded-radius-sm border border-border-default bg-surface-primary disabled:text-text-disabled hover:bg-surface-secondary"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-surface-primary rounded-radius-lg border border-border-default shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-spacing-12 text-center text-text-muted">Loading immutable audit logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-spacing-12 text-center text-text-muted text-body-sm">
            No audit log entries matching filter &quot;{actionFilter}&quot;.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-body-sm">
              <thead className="bg-surface-secondary border-b border-border-default text-caption font-semibold text-text-secondary">
                <tr>
                  <th className="p-spacing-3">Timestamp (WAT)</th>
                  <th className="p-spacing-3">Action</th>
                  <th className="p-spacing-3">Actor & Role</th>
                  <th className="p-spacing-3">Target ID</th>
                  <th className="p-spacing-3">Client IP</th>
                  <th className="p-spacing-3 text-right">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle font-mono text-caption">
                {logs.map((log) => {
                  const isExpanded = expandedId === log.id;
                  const isSensitive = log.action === 'NIN_ACCESS';

                  return (
                    <tr
                      key={log.id}
                      className={`hover:bg-surface-secondary transition-colors ${
                        isSensitive ? 'bg-badge-warning-subtle/30' : ''
                      }`}
                    >
                      <td className="p-spacing-3 text-text-secondary whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-spacing-3">
                        <span
                          className={`px-spacing-2 py-0.5 rounded-radius-sm font-bold text-caption ${
                            isSensitive
                              ? 'bg-badge-danger-subtle text-badge-danger-fg'
                              : log.action.includes('ACTIVATED') || log.action.includes('COMPLETED')
                              ? 'bg-badge-success-subtle text-badge-success-fg'
                              : 'bg-badge-neutral-subtle text-badge-neutral-fg'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="p-spacing-3 font-sans text-text-primary">
                        <span className="font-semibold">{log.actorId}</span>
                        <span className="text-caption text-text-muted ml-1">({log.actorRole})</span>
                      </td>
                      <td className="p-spacing-3 text-text-secondary">
                        {log.targetId || '—'}
                      </td>
                      <td className="p-spacing-3 text-text-muted">
                        {log.ipAddress || '127.0.0.1'}
                      </td>
                      <td className="p-spacing-3 text-right">
                        {log.metadata ? (
                          <div>
                            <button
                              type="button"
                              onClick={() => setExpandedId(isExpanded ? null : log.id)}
                              className="text-brand-primary font-semibold hover:underline"
                            >
                              {isExpanded ? 'Hide JSON' : 'View JSON'}
                            </button>
                            {isExpanded && (
                              <pre className="text-left mt-2 p-spacing-2 rounded-radius-sm bg-surface-secondary text-text-primary text-caption overflow-x-auto max-w-xs">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            )}
                          </div>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
