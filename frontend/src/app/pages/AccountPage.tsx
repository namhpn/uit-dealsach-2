import { useEffect, useState } from "react";
import { Bell, LogOut, Mail, ShieldCheck, User } from "lucide-react";
import { AlertPreferenceDto, apiErrorMessage, fetchAlertPreferences, updateAlertPreferences } from "../api";
import { useAuth } from "../auth";
import { C, ErrorState, FONT, LoadingState, NbButton, border2, shadow8 } from "../shared";

const ROLE_LABELS: Record<string, string> = {
  registered: "Người dùng",
  admin: "Quản trị",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Đang hoạt động",
  deactivated: "Đã vô hiệu hóa",
};

export default function AccountPage() {
  const auth = useAuth();
  const [preference, setPreference] = useState<AlertPreferenceDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.loading && !auth.authenticated) {
      auth.openAuthDialog();
    }
  }, [auth]);

  useEffect(() => {
    if (!auth.authenticated) {
      setPreference(null);
      return;
    }

    let alive = true;
    setLoading(true);
    setError(null);
    fetchAlertPreferences()
      .then((data) => {
        if (alive) setPreference(data);
      })
      .catch((err) => {
        if (alive) setError(apiErrorMessage(err));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [auth.authenticated]);

  async function togglePreference() {
    if (!preference) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const next = await updateAlertPreferences(!preference.alert_emails_enabled);
      setPreference(next);
      await auth.refreshUser();
      setSuccess(next.alert_emails_enabled ? "Đã bật email cảnh báo giá." : "Đã tắt email cảnh báo giá cho toàn tài khoản.");
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    setError(null);
    try {
      await auth.logout();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  if (!auth.authenticated) {
    return (
      <main className="mx-auto flex max-w-[900px] flex-col gap-6 px-4 py-10 sm:px-8">
        <section className="p-6" style={{ background: C.white, border: border2, boxShadow: shadow8, fontFamily: FONT }}>
          <div className="mb-4 flex items-center gap-3">
            <User size={24} style={{ color: C.primary }} />
            <h1 className="text-[24px] font-extrabold uppercase">Tài khoản</h1>
          </div>
          <p className="mb-5 text-[14px] leading-relaxed" style={{ color: C.onSurfaceVariant }}>
            Vui lòng đăng nhập bằng email để xem thông tin tài khoản và cài đặt email cảnh báo giá.
          </p>
          <NbButton onClick={auth.openAuthDialog}>Đăng nhập / Đăng ký</NbButton>
        </section>
      </main>
    );
  }

  const enabled = preference?.alert_emails_enabled ?? true;

  return (
    <main className="mx-auto flex max-w-[980px] flex-col gap-7 px-4 py-10 sm:px-8">
      <section className="flex flex-col gap-2">
        <h1 className="text-[30px] font-extrabold uppercase leading-tight" style={{ fontFamily: FONT }}>Tài khoản</h1>
        <p className="text-[13px]" style={{ color: C.onSurfaceVariant, fontFamily: FONT }}>
          Quản lý phiên đăng nhập và email cảnh báo giá DealSach.
        </p>
      </section>

      {loading && <LoadingState label="Đang tải cài đặt tài khoản..." />}
      {error && <ErrorState message={error} />}
      {success && <p className="px-4 py-3 text-[13px] font-bold" style={{ border: border2, background: C.primaryFixed, color: C.primary, fontFamily: FONT }}>{success}</p>}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_280px]">
        <div className="p-5" style={{ background: C.white, border: border2, boxShadow: shadow8 }}>
          <div className="mb-5 flex items-center gap-3">
            <ShieldCheck size={22} style={{ color: C.primary }} />
            <h2 className="text-[16px] font-extrabold uppercase" style={{ fontFamily: FONT }}>Thông tin đăng nhập</h2>
          </div>
          <dl className="grid grid-cols-1 gap-3 text-[13px] sm:grid-cols-2" style={{ fontFamily: FONT }}>
            <div>
              <dt className="font-extrabold uppercase" style={{ color: C.onSurfaceVariant }}>Email</dt>
              <dd className="mt-1 break-words font-bold">{auth.user?.email}</dd>
            </div>
            <div>
              <dt className="font-extrabold uppercase" style={{ color: C.onSurfaceVariant }}>Vai trò</dt>
              <dd className="mt-1 font-bold">{ROLE_LABELS[auth.user?.role ?? ""] ?? auth.user?.role}</dd>
            </div>
            <div>
              <dt className="font-extrabold uppercase" style={{ color: C.onSurfaceVariant }}>Trạng thái</dt>
              <dd className="mt-1 font-bold">{STATUS_LABELS[auth.user?.status ?? ""] ?? auth.user?.status}</dd>
            </div>
          </dl>
        </div>

        <div className="flex flex-col gap-3 p-5" style={{ background: C.white, border: border2, boxShadow: shadow8 }}>
          <LogOut size={22} style={{ color: C.dealRed }} />
          <h2 className="text-[16px] font-extrabold uppercase" style={{ fontFamily: FONT }}>Phiên đăng nhập</h2>
          <p className="text-[13px] leading-relaxed" style={{ color: C.onSurfaceVariant, fontFamily: FONT }}>Đăng xuất khỏi trình duyệt hiện tại.</p>
          <button type="button" onClick={logout} className="mt-auto px-4 py-2.5 text-[12px] font-extrabold uppercase" style={{ background: C.boneWhite, color: C.onSurface, border: border2, fontFamily: FONT }}>
            Đăng xuất
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between" style={{ background: C.white, border: border2, boxShadow: shadow8 }}>
        <div className="flex min-w-0 gap-3">
          {enabled ? <Mail size={22} style={{ color: C.primary }} /> : <Bell size={22} style={{ color: C.dealRed }} />}
          <div>
            <h2 className="text-[15px] font-extrabold uppercase" style={{ fontFamily: FONT }}>Email cảnh báo giá</h2>
            <p className="mt-1 text-[13px] leading-relaxed" style={{ color: C.onSurfaceVariant, fontFamily: FONT }}>
              Khi tắt email cảnh báo, DealSach không gửi email mới nhưng trạng thái từng cảnh báo vẫn giữ nguyên. Bạn có thể bật lại để theo dõi từ chu kỳ giá sau.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={togglePreference}
          disabled={!preference || saving}
          className="shrink-0 px-4 py-2.5 text-[12px] font-extrabold uppercase disabled:opacity-50"
          style={{ background: enabled ? C.primary : C.boneWhite, color: enabled ? C.white : C.onSurface, border: border2, fontFamily: FONT }}
        >
          {saving ? "Đang lưu..." : enabled ? "Email đang bật" : "Email đang tắt"}
        </button>
      </section>
    </main>
  );
}
