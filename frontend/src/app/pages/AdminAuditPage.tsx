import { useEffect, useState } from "react";
import { AdminAuditLogDto, apiErrorMessage, fetchAdminAuditLogs, formatDateTime } from "../api";
import { AdminBackLink, AdminHeader, AdminTableShell, C, ErrorState, LoadingState, PageShell, border2 } from "../shared";
import { AdminGate } from "./AdminPage";

export default function AdminAuditPage() {
  const [items, setItems] = useState<AdminAuditLogDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminAuditLogs().then((data) => setItems(data.items)).catch((err) => setError(apiErrorMessage(err))).finally(() => setLoading(false));
  }, []);

  return (
    <AdminGate>
      <PageShell variant="admin" className="min-w-[768px] max-w-[1200px] gap-5">
        <AdminHeader title="Nhật ký kiểm toán" description="Theo dõi toàn bộ thao tác quản trị và dữ liệu before/after dạng audit." backLink={<AdminBackLink />} />
        {error && <ErrorState message={error} />}
        {loading ? <LoadingState label="Đang tải nhật ký..." /> : (
          <AdminTableShell>
          <table className="w-full border-collapse text-[12px]">
            <thead style={{ background: C.boneWhite }}>
              <tr>{["Thời gian", "Admin", "Hành động", "Đối tượng", "Tóm tắt", "Trước", "Sau"].map((h) => <th key={h} className="p-3 text-left uppercase" style={{ border: border2 }}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {items.map((log) => (
                <tr key={log.id}>
                  <td className="p-3 whitespace-nowrap" style={{ border: border2 }}>{formatDateTime(log.created_at)}</td>
                  <td className="p-3" style={{ border: border2 }}>{log.actor_email}</td>
                  <td className="p-3 font-bold" style={{ border: border2 }}>{log.action_type}</td>
                  <td className="p-3" style={{ border: border2 }}>{log.entity_type} #{log.entity_id}</td>
                  <td className="p-3" style={{ border: border2 }}>{log.summary}</td>
                  <td className="p-3 max-w-[220px] break-words font-mono text-[11px]" style={{ border: border2, color: C.onSurfaceVariant }}>{log.before ? JSON.stringify(log.before) : "-"}</td>
                  <td className="p-3 max-w-[220px] break-words font-mono text-[11px]" style={{ border: border2, color: C.onSurfaceVariant }}>{log.after ? JSON.stringify(log.after) : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </AdminTableShell>
        )}
      </PageShell>
    </AdminGate>
  );
}
