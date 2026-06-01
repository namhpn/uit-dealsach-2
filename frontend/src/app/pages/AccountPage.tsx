import { useEffect, useState } from "react";
import { Bell, LogOut, Mail, ShieldCheck, User } from "lucide-react";
import { AlertPreferenceDto, apiErrorMessage, fetchAlertPreferences, updateAlertPreferences } from "../api";
import { useAuth } from "../auth";
import { C, ErrorState, LoadingState, NbButton, PageIntro, PageShell, PromptCard, StampHeading, StatusChip, border2, shadow8 } from "../shared";

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
      <PageShell>
        <PromptCard
          icon={<User size={20} style={{ color: C.primary }} />}
          title="Tài khoản"
          description="Vui lòng đăng nhập bằng email để xem thông tin tài khoản và cài đặt email cảnh báo giá."
          cta={<NbButton onClick={auth.openAuthDialog}>Đăng nhập / Đăng ký</NbButton>}
        />
      </PageShell>
    );
  }

  const enabled = preference?.alert_emails_enabled ?? true;

  return (
    <PageShell>
      <section className="flex flex-col gap-3">
        <StampHeading title="Tài khoản" icon={<User size={20} style={{ color: C.primary }} />} />
        <PageIntro>Quản lý phiên đăng nhập, địa chỉ email xác minh và trạng thái email cảnh báo giá cho tài khoản DealSach.</PageIntro>
        <div className="flex flex-wrap gap-2">
          {auth.user?.email && <StatusChip label={auth.user.email} variant="primary" />}
          <StatusChip label={`Vai trò: ${ROLE_LABELS[auth.user?.role ?? ""] ?? auth.user?.role ?? "-"}`} />
          <StatusChip label={`Trạng thái: ${STATUS_LABELS[auth.user?.status ?? ""] ?? auth.user?.status ?? "-"}`} variant={auth.user?.status === "active" ? "success" : "warning"} />
          <StatusChip label={enabled ? "Email cảnh báo: Bật" : "Email cảnh báo: Tắt"} variant={enabled ? "success" : "muted"} />
        </div>
      </section>

      {loading && <LoadingState label="Đang tải cài đặt tài khoản..." />}
      {error && <ErrorState message={error} />}
      {success && <p className="px-4 py-3 text-[13px] font-bold" style={{ border: border2, background: C.primaryFixed, color: C.primary }}>{success}</p>}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_280px]">
        <div className="p-5" style={{ background: C.white, border: border2, boxShadow: shadow8 }}>
          <div className="mb-5 flex items-center gap-3">
            <ShieldCheck size={22} style={{ color: C.primary }} />
            <h2 className="text-[16px] font-extrabold uppercase">Thông tin đăng nhập</h2>
          </div>
          <dl className="grid grid-cols-1 gap-3 text-[13px] sm:grid-cols-2">
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
          <h2 className="text-[16px] font-extrabold uppercase">Phiên đăng nhập</h2>
          <p className="text-[13px] leading-relaxed" style={{ color: C.onSurfaceVariant }}>Đăng xuất khỏi trình duyệt hiện tại.</p>
          <NbButton type="button" onClick={logout} variant="danger" className="mt-auto">Đăng xuất</NbButton>
        </div>
      </section>

      <section className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between" style={{ background: C.white, border: border2, boxShadow: shadow8 }}>
        <div className="flex min-w-0 gap-3">
          {enabled ? <Mail size={22} style={{ color: C.primary }} /> : <Bell size={22} style={{ color: C.dealRed }} />}
          <div>
            <h2 className="text-[15px] font-extrabold uppercase">Email cảnh báo giá</h2>
            <p className="mt-1 text-[13px] leading-relaxed" style={{ color: C.onSurfaceVariant }}>
              Khi tắt email cảnh báo, DealSach không gửi email mới nhưng trạng thái từng cảnh báo vẫn giữ nguyên. Bạn có thể bật lại để theo dõi từ chu kỳ giá sau.
            </p>
          </div>
        </div>
        <NbButton
          type="button"
          onClick={togglePreference}
          disabled={!preference || saving}
          variant={enabled ? "primary" : "secondary"}
          className="shrink-0"
        >
          {saving ? "Đang lưu..." : enabled ? "Email đang bật" : "Email đang tắt"}
        </NbButton>
      </section>
    </PageShell>
  );
}
