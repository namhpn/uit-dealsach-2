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
        <AdminHeader title="Quản trị logs" description="Theo dõi thao tác quản trị đã ghi nhận. Giá trị action_type và entity_type được giữ nguyên để đối chiếu kỹ thuật." backLink={<AdminBackLink />} />
        {error && <ErrorState message={error} />}
        {loading ? <LoadingState label="Đang tải nhật ký..." /> : (
          <AdminTableShell>
          <table className="w-full border-collapse text-[12px]">
            <thead style={{ background: C.boneWhite }}>
              <tr>{["Thời gian", "Admin", "Hành động", "Đối tượng"].map((h) => <th key={h} className="p-3 text-left uppercase" style={{ borderBottom: border2 }}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {items.map((log) => (
                <tr key={log.id}>
                  <td className="p-3 whitespace-nowrap" style={{ borderTop: `1px solid ${C.outlineVariant}` }}>{formatDateTime(log.created_at)}</td>
                  <td className="p-3" style={{ borderTop: `1px solid ${C.outlineVariant}` }}>{log.actor_email}</td>
                  <td className="p-3 font-bold" style={{ borderTop: `1px solid ${C.outlineVariant}` }}>{log.action_type}</td>
                  <td className="p-3" style={{ borderTop: `1px solid ${C.outlineVariant}` }}>{log.entity_type} #{log.entity_id}</td>
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
