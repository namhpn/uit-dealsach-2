import { useEffect, useState } from "react";
import { Link } from "react-router";
import { apiErrorMessage, AdminUserDto, deactivateAdminUser, fetchAdminUsers, reactivateAdminUser } from "../api";
import { C, ErrorState, LoadingState, NbButton, border2, shadow4 } from "../shared";
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
      <main className="mx-auto flex min-w-[768px] max-w-[1200px] flex-col gap-5 px-8 py-10">
        <Header title="Người dùng" />
        {message && <p className="p-3 text-[13px] font-bold" style={{ background: C.primaryFixed, border: border2, color: C.primary }}>{message}</p>}
        {error && <ErrorState message={error} />}
        {loading ? <LoadingState label="Đang tải người dùng..." /> : (
          <table className="w-full border-collapse text-[13px]" style={{ background: C.white, border: border2, boxShadow: shadow4 }}>
            <thead style={{ background: C.boneWhite }}>
              <tr>{["Email", "Vai trò", "Trạng thái", "Email cảnh báo", "Yêu thích", "Cảnh báo", "Thao tác"].map((h) => <th key={h} className="p-3 text-left uppercase" style={{ border: border2 }}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {items.map((user) => (
                <tr key={user.id}>
                  <td className="p-3 font-bold" style={{ border: border2 }}>{user.email}</td>
                  <td className="p-3" style={{ border: border2 }}>{user.role === "admin" ? "Admin" : "Đã đăng ký"}</td>
                  <td className="p-3" style={{ border: border2 }}>{user.status === "active" ? "Hoạt động" : "Vô hiệu hóa"}</td>
                  <td className="p-3" style={{ border: border2 }}>{user.alert_email_enabled ? "Bật" : "Tắt"}</td>
                  <td className="p-3" style={{ border: border2 }}>{user.wishlist_count}</td>
                  <td className="p-3" style={{ border: border2 }}>{user.active_alert_count}/{user.alert_count}</td>
                  <td className="p-3" style={{ border: border2 }}>
                    <NbButton small variant={user.status === "active" ? "secondary" : "primary"} onClick={() => change(user)}>
                      {user.status === "active" ? "Vô hiệu hóa" : "Kích hoạt"}
                    </NbButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </AdminGate>
  );
}

function Header({ title }: { title: string }) {
  return <div className="flex items-center justify-between"><h1 className="text-[28px] font-extrabold uppercase">{title}</h1><Link className="text-[13px] font-bold underline" to="/admin">Về Admin</Link></div>;
}
