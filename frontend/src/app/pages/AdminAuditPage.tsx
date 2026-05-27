import { useEffect, useState } from "react";
import { Link } from "react-router";
import { AdminAuditLogDto, apiErrorMessage, fetchAdminAuditLogs, formatDateTime } from "../api";
import { C, ErrorState, LoadingState, border2, shadow4 } from "../shared";
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
      <main className="mx-auto flex min-w-[768px] max-w-[1200px] flex-col gap-5 px-8 py-10">
        <div className="flex items-center justify-between"><h1 className="text-[28px] font-extrabold uppercase">Nhật ký kiểm toán</h1><Link className="text-[13px] font-bold underline" to="/admin">Về Admin</Link></div>
        {error && <ErrorState message={error} />}
        {loading ? <LoadingState label="Đang tải nhật ký..." /> : (
          <table className="w-full border-collapse text-[12px]" style={{ background: C.white, border: border2, boxShadow: shadow4 }}>
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
                  <td className="p-3 max-w-[220px] break-words" style={{ border: border2 }}>{log.before ? JSON.stringify(log.before) : "-"}</td>
                  <td className="p-3 max-w-[220px] break-words" style={{ border: border2 }}>{log.after ? JSON.stringify(log.after) : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </AdminGate>
  );
}
