import { useEffect, useState } from "react";
import { AdminAlertDto, apiErrorMessage, disableAdminAlert, fetchAdminAlerts, formatDateTime, formatVnd } from "../api";
import { AdminBackLink, AdminHeader, AdminTableShell, C, ErrorState, LoadingState, NbButton, PageShell, border2 } from "../shared";
import { AdminGate } from "./AdminPage";

const ADMIN_ALERT_STATUS_LABELS: Record<string, string> = {
  Active: "Đang theo dõi",
  Paused: "Tạm dừng",
  "Auto-paused": "Tự tạm dừng",
  Expired: "Hết hạn",
  Disabled: "Đã tắt",
};

const ADMIN_ALERT_EVENT_LABELS: Record<string, string> = {
  created: "Đã tạo",
  target_price_updated: "Cập nhật giá mục tiêu",
  paused: "Đã tạm dừng",
  reactivated: "Đã tiếp tục",
  renewed: "Đã gia hạn",
  tracking_restarted: "Theo dõi lại",
  disabled: "Đã tắt",
  email_sent: "Đã gửi email",
  suppressed: "Tạm chưa gửi email",
  expired: "Đã hết hạn",
};

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
      <PageShell variant="admin" className="min-w-[768px] max-w-[1200px] gap-5">
        <AdminHeader title="Hoạt động cảnh báo" description="Theo dõi trạng thái cảnh báo và tắt cảnh báo có vấn đề khi cần." backLink={<AdminBackLink />} />
        {error && <ErrorState message={error} />}
        {loading ? <LoadingState label="Đang tải cảnh báo..." /> : (
          <AdminTableShell>
          <table className="w-full border-collapse text-[13px]">
            <thead style={{ background: C.boneWhite }}>
              <tr>{["Người dùng", "Sách", "Loại", "Trạng thái", "Số email đã gửi", "Logs", "Thao tác"].map((h) => <th key={h} className="p-3 text-left uppercase" style={{ borderBottom: border2 }}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {items.map((alert) => (
                <tr key={alert.id}>
                  <td className="p-3" style={{ borderTop: `1px solid ${C.outlineVariant}` }}>{alert.user_email}</td>
                  <td className="p-3 font-bold" style={{ borderTop: `1px solid ${C.outlineVariant}` }}>{alert.book_title}</td>
                  <td className="p-3" style={{ borderTop: `1px solid ${C.outlineVariant}` }}>{alert.alert_type === "target_price" ? `Giá mục tiêu ${alert.target_price ? formatVnd(alert.target_price) : ""}` : "Giá thấp mới"}</td>
                  <td className="p-3" style={{ borderTop: `1px solid ${C.outlineVariant}` }}>{ADMIN_ALERT_STATUS_LABELS[alert.status] ?? alert.status}</td>
                  <td className="p-3" style={{ borderTop: `1px solid ${C.outlineVariant}` }}>{alert.notification_count}</td>
                  <td className="p-3" style={{ borderTop: `1px solid ${C.outlineVariant}` }}>{alert.recent_events[0] ? `${ADMIN_ALERT_EVENT_LABELS[alert.recent_events[0].event_type] ?? alert.recent_events[0].event_type} - ${formatDateTime(alert.recent_events[0].created_at)}` : "Chưa có"}</td>
                  <td className="p-3" style={{ borderTop: `1px solid ${C.outlineVariant}` }}>{alert.status !== "Disabled" && <NbButton small variant="secondary" onClick={() => disable(alert)}>Tắt cảnh báo</NbButton>}</td>
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
