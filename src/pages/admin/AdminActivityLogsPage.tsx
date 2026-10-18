import React, { useState, useEffect } from 'react';
import { History, Shield, Clock } from 'lucide-react';
import { api } from '../../api/client';

export const AdminActivityLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadLogs = (p = 1) => {
    setLoading(true);
    api.getAdminActivityLogs(p, 25)
      .then((res) => {
        setLogs(res.logs || []);
        setTotalPages(res.pagination?.totalPages || 1);
        setPage(p);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadLogs(1);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#111827]">Administrative Audit Trail</h1>
        <p className="text-xs text-[#6B7280] mt-0.5">
          Immutable logging of every administrative action, password reset, balance adjustment, and task review.
        </p>
      </div>

      <div className="admin-card overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-[#6B7280]">Loading audit logs...</div>
        ) : logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs admin-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Administrator</th>
                  <th>Action</th>
                  <th>Target Entity</th>
                  <th>Entity ID</th>
                  <th>Reason / Notes</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="text-[#6B7280] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="font-semibold text-[#111827]">
                      <span className="text-[#2563EB]">{log.adminUsername}</span>
                    </td>
                    <td>
                      <span className="bg-[#EAF2FF] text-[#2563EB] font-bold px-2 py-0.5 rounded text-[10px]">
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="text-[#4B5563] font-semibold">{log.entityType}</td>
                    <td className="font-mono text-[11px] text-[#6B7280]">{log.entityId}</td>
                    <td className="max-w-xs text-[#4B5563] text-[11px] truncate">
                      {log.reason || 'Routine operation'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-xs text-[#6B7280]">No audit log records found.</div>
        )}

        {totalPages > 1 && (
          <div className="p-4 border-t border-[#D9E4F2] flex items-center justify-between text-xs text-[#4B5563]">
            <button
              onClick={() => loadLogs(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="px-3 py-1 rounded bg-[#F8FAFD] border border-[#D9E4F2] disabled:opacity-40"
            >
              Previous
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => loadLogs(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1 rounded bg-[#F8FAFD] border border-[#D9E4F2] disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
