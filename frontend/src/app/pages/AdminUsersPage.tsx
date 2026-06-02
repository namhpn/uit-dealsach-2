import { useEffect, useState } from "react";
import { apiErrorMessage, AdminUserDto, deactivateAdminUser, fetchAdminUsers, reactivateAdminUser } from "../api";
import { AdminBackLink, AdminHeader, AdminTableShell, C, ErrorState, LoadingState, NbButton, PageShell, border2 } from "../shared";
import { AdminGate } from "./AdminPage";

export default function AdminUsersPage() {
  const [items, setItems] = useState<AdminUserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminUsers();
      setItems(data.items);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function change(user: AdminUserDto) {
    const action = user.status === "active" ? deactivateAdminUser : reactivateAdminUser;
    setError(null);
    setMessage(null);
    try {
      const updated = await action(user.id);
      setItems((current) => current.map((item) => item.id === updated.id ? updated : item));
      setMessage(updated.status === "active" ? "Đã kích hoạt lại người dùng." : "Đã vô hiệu hóa người dùng.");
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  return (
    <AdminGate>
      <PageShell variant="admin" className="min-w-[768px] max-w-[1200px] gap-5">
        <AdminHeader title="Người dùng" description="Quản lý trạng thái tài khoản và chỉ số cá nhân hóa của người dùng." backLink={<AdminBackLink />} />
        {message && <p className="p-3 text-[13px] font-bold" style={{ background: C.primaryFixed, border: border2, color: C.primary }}>{message}</p>}
        {error && <ErrorState message={error} />}
        {loading ? <LoadingState label="Đang tải người dùng..." /> : (
          <AdminTableShell>
          <table className="w-full border-collapse text-[13px]">
            <thead style={{ background: C.boneWhite }}>
              <tr>{["Email", "Vai trò", "Trạng thái", "Email Preference", "Yêu thích", "Số cảnh báo giá", "Thao tác"].map((h) => <th key={h} className="p-3 text-left uppercase" style={{ borderBottom: border2 }}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {items.map((user) => (
                <tr key={user.id}>
                  <td className="p-3 font-bold" style={{ borderTop: `1px solid ${C.outlineVariant}` }}>{user.email}</td>
                  <td className="p-3" style={{ borderTop: `1px solid ${C.outlineVariant}` }}>{user.role === "admin" ? "Quản trị viên" : "Người dùng"}</td>
                  <td className="p-3" style={{ borderTop: `1px solid ${C.outlineVariant}` }}>{user.status === "active" ? "Hoạt động" : "Vô hiệu hóa"}</td>
                  <td className="p-3" style={{ borderTop: `1px solid ${C.outlineVariant}` }}>{user.alert_email_enabled ? "Bật" : "Tắt"}</td>
                  <td className="p-3" style={{ borderTop: `1px solid ${C.outlineVariant}` }}>{user.wishlist_count}</td>
                  <td className="p-3" style={{ borderTop: `1px solid ${C.outlineVariant}` }}>{user.active_alert_count} đang theo dõi / {user.alert_count} tổng</td>
                  <td className="p-3" style={{ borderTop: `1px solid ${C.outlineVariant}` }}>
                    <NbButton small variant={user.status === "active" ? "secondary" : "primary"} onClick={() => change(user)}>
                      {user.status === "active" ? "Vô hiệu hóa" : "Kích hoạt"}
                    </NbButton>
                  </td>
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
