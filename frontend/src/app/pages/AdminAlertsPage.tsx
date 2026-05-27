import { useEffect, useState } from "react";
import { Link } from "react-router";
import { AdminAlertDto, apiErrorMessage, disableAdminAlert, fetchAdminAlerts, formatDateTime, formatVnd } from "../api";
import { C, ErrorState, LoadingState, NbButton, border2, shadow4 } from "../shared";
import { AdminGate } from "./AdminPage";

export default function AdminAlertsPage() {
  const [items, setItems] = useState<AdminAlertDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminAlerts().then((data) => setItems(data.items)).catch((err) => setError(apiErrorMessage(err))).finally(() => setLoading(false));
  }, []);

  async function disable(alert: AdminAlertDto) {
    setError(null);
    try {
      const updated = await disableAdminAlert(alert.id);
      setItems((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  return (
    <AdminGate>
      <main className="mx-auto flex min-w-[768px] max-w-[1200px] flex-col gap-5 px-8 py-10">
        <div className="flex items-center justify-between"><h1 className="text-[28px] font-extrabold uppercase">Hoạt động cảnh báo</h1><Link className="text-[13px] font-bold underline" to="/admin">Về Admin</Link></div>
        {error && <ErrorState message={error} />}
        {loading ? <LoadingState label="Đang tải cảnh báo..." /> : (
          <table className="w-full border-collapse text-[13px]" style={{ background: C.white, border: border2, boxShadow: shadow4 }}>
            <thead style={{ background: C.boneWhite }}>
              <tr>{["Người dùng", "Sách", "Loại", "Trạng thái", "Email", "Sự kiện gần nhất", "Thao tác"].map((h) => <th key={h} className="p-3 text-left uppercase" style={{ border: border2 }}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {items.map((alert) => (
                <tr key={alert.id}>
                  <td className="p-3" style={{ border: border2 }}>{alert.user_email}</td>
                  <td className="p-3 font-bold" style={{ border: border2 }}>{alert.book_title}</td>
                  <td className="p-3" style={{ border: border2 }}>{alert.alert_type === "target_price" ? `Giá mục tiêu ${alert.target_price ? formatVnd(alert.target_price) : ""}` : "Giá thấp mới"}</td>
                  <td className="p-3" style={{ border: border2 }}>{alert.status}</td>
                  <td className="p-3" style={{ border: border2 }}>{alert.notification_count}</td>
                  <td className="p-3" style={{ border: border2 }}>{alert.recent_events[0] ? `${alert.recent_events[0].event_type} - ${formatDateTime(alert.recent_events[0].created_at)}` : "Chưa có"}</td>
                  <td className="p-3" style={{ border: border2 }}>{alert.status !== "Disabled" && <NbButton small variant="secondary" onClick={() => disable(alert)}>Tắt</NbButton>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </AdminGate>
  );
}
