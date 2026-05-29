import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Link } from "react-router";
import { Ban, Bell, Mail, Pause, Play, RefreshCw, RotateCcw, Save } from "lucide-react";
import {
  AlertPreferenceDto,
  apiErrorMessage,
  disablePriceAlert,
  fetchAlertPreferences,
  fetchPriceAlerts,
  formatDateTime,
  formatVnd,
  pausePriceAlert,
  PriceAlertDto,
  PriceAlertStatus,
  reactivatePriceAlert,
  renewPriceAlert,
  restartPriceAlertTracking,
  updateAlertPreferences,
  updatePriceAlertTarget,
} from "../api";
import { useAuth } from "../auth";
import { C, CoverImage, EmptyState, ErrorState, FONT, LoadingState, NbButton, border2, shadow4, shadow8 } from "../shared";

const ALERT_TYPE_LABELS: Record<PriceAlertDto["alert_type"], string> = {
  target_price: "Giá mục tiêu",
  new_lowest_price: "Giá thấp mới",
};

const STATUS_LABELS: Record<PriceAlertStatus, string> = {
  Active: "Đang theo dõi",
  Paused: "Tạm dừng",
  "Auto-paused": "Tự tạm dừng",
  Expired: "Hết hạn",
  Disabled: "Đã tắt",
};

const STATUS_STYLES: Record<PriceAlertStatus, { bg: string; color: string }> = {
  Active: { bg: C.primaryFixed, color: C.primary },
  Paused: { bg: C.boneWhite, color: C.onSurface },
  "Auto-paused": { bg: "#fff4cc", color: "#6b4b00" },
  Expired: { bg: C.surfaceVariant, color: C.onSurfaceVariant },
  Disabled: { bg: "#fff1f1", color: C.dealRed },
};

export default function AlertsPage() {
  const auth = useAuth();
  const [alerts, setAlerts] = useState<PriceAlertDto[]>([]);
  const [preference, setPreference] = useState<AlertPreferenceDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.loading && !auth.authenticated) {
      auth.openAuthDialog();
    }
  }, [auth]);

  useEffect(() => {
    if (!auth.authenticated) {
      setAlerts([]);
      setPreference(null);
      return;
    }

    let alive = true;
    setLoading(true);
    setError(null);
    Promise.all([fetchPriceAlerts(), fetchAlertPreferences()])
      .then(([list, pref]) => {
        if (!alive) return;
        setAlerts(list.items);
        setPreference(pref);
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

  function replaceAlert(next: PriceAlertDto) {
    setAlerts((current) => current.map((alert) => alert.id === next.id ? next : alert));
  }

  async function runAction(label: string, action: () => Promise<PriceAlertDto>) {
    setError(null);
    setSuccess(null);
    try {
      const updated = await action();
      replaceAlert(updated);
      setSuccess(label);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  async function togglePreference() {
    if (!preference) return;
    setError(null);
    setSuccess(null);
    try {
      const next = await updateAlertPreferences(!preference.alert_emails_enabled);
      setPreference(next);
      setAlerts((current) => current.map((alert) => ({ ...alert, alert_emails_enabled: next.alert_emails_enabled })));
      setSuccess(next.alert_emails_enabled ? "Đã bật email cảnh báo giá." : "Đã tắt email cảnh báo giá cho tài khoản.");
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  const grouped = useMemo(() => {
    const order: PriceAlertStatus[] = ["Active", "Paused", "Auto-paused", "Expired", "Disabled"];
    return order
      .map((status) => ({ status, items: alerts.filter((alert) => alert.status === status) }))
      .filter((group) => group.items.length > 0);
  }, [alerts]);

  if (!auth.authenticated) {
    return (
      <main className="mx-auto flex max-w-[900px] flex-col gap-6 px-4 py-10 sm:px-8">
        <section className="p-6" style={{ background: C.white, border: border2, boxShadow: shadow8, fontFamily: FONT }}>
          <div className="mb-4 flex items-center gap-3">
            <Bell size={24} style={{ color: C.primary }} />
            <h1 className="text-[24px] font-extrabold uppercase">Cảnh báo giá</h1>
          </div>
          <p className="mb-5 text-[14px] leading-relaxed" style={{ color: C.onSurfaceVariant }}>
            Vui lòng đăng nhập bằng email để xem, tạo và quản lý cảnh báo giá cho sách bạn quan tâm.
          </p>
          <NbButton onClick={auth.openAuthDialog}>Đăng nhập / Đăng ký</NbButton>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-[1120px] flex-col gap-7 px-4 py-10 sm:px-8">
      <section className="flex flex-col gap-2">
        <h1 className="text-[30px] font-extrabold uppercase leading-tight" style={{ fontFamily: FONT }}>Cảnh báo giá</h1>
        <p className="text-[13px]" style={{ color: C.onSurfaceVariant, fontFamily: FONT }}>
          Theo dõi bằng tài khoản {auth.user?.email}
        </p>
      </section>

      <PreferencePanel preference={preference} onToggle={togglePreference} />

      {success && <p className="px-4 py-3 text-[13px] font-bold" style={{ border: border2, background: C.primaryFixed, color: C.primary, fontFamily: FONT }}>{success}</p>}
      {loading && <LoadingState label="Đang tải cảnh báo giá..." />}
      {error && <ErrorState message={error} />}
      {!loading && alerts.length === 0 && <EmptyState message="Bạn chưa có cảnh báo giá nào. Mở trang chi tiết sách để tạo cảnh báo giá mục tiêu hoặc giá thấp mới." />}

      <div className="flex flex-col gap-8">
        {grouped.map((group) => (
          <section key={group.status} className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3 pb-3" style={{ borderBottom: `4px solid ${C.black}` }}>
              <h2 className="text-[18px] font-extrabold uppercase" style={{ fontFamily: FONT }}>{STATUS_LABELS[group.status]}</h2>
              <span className="px-2 py-1 text-[11px] font-bold uppercase" style={{ border: border2, background: C.white, fontFamily: FONT }}>{group.items.length} cảnh báo</span>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {group.items.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onAction={runAction}
                  onUpdated={replaceAlert}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

function PreferencePanel({ preference, onToggle }: { preference: AlertPreferenceDto | null; onToggle: () => void }) {
  const enabled = preference?.alert_emails_enabled ?? true;

  return (
    <section className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between" style={{ background: C.white, border: border2, boxShadow: shadow8 }}>
      <div className="flex min-w-0 gap-3">
        <Mail size={22} style={{ color: C.primary }} />
        <div>
          <h2 className="text-[15px] font-extrabold uppercase" style={{ fontFamily: FONT }}>Email cảnh báo toàn tài khoản</h2>
          <p className="mt-1 text-[13px] leading-relaxed" style={{ color: C.onSurfaceVariant, fontFamily: FONT }}>
            Tùy chọn này chỉ chặn email cảnh báo. Trạng thái từng cảnh báo vẫn giữ nguyên để bạn có thể bật email lại sau.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onToggle}
        disabled={!preference}
        className="shrink-0 px-4 py-2.5 text-[12px] font-extrabold uppercase disabled:opacity-50"
        style={{ background: enabled ? C.primary : C.boneWhite, color: enabled ? C.white : C.onSurface, border: border2, boxShadow: shadow4, fontFamily: FONT }}
      >
        {enabled ? "Email đang bật" : "Email đang tắt"}
      </button>
    </section>
  );
}

function AlertCard({
  alert,
  onAction,
  onUpdated,
}: {
  alert: PriceAlertDto;
  onAction: (label: string, action: () => Promise<PriceAlertDto>) => Promise<void>;
  onUpdated: (alert: PriceAlertDto) => void;
}) {
  const [target, setTarget] = useState(alert.target_price?.toString() ?? "");
  const [targetError, setTargetError] = useState<string | null>(null);
  const statusStyle = STATUS_STYLES[alert.status];

  useEffect(() => {
    setTarget(alert.target_price?.toString() ?? "");
  }, [alert.target_price]);

  async function updateTarget(event: FormEvent) {
    event.preventDefault();
    setTargetError(null);
    if (!/^[0-9]+$/.test(target) || Number(target) <= 0) {
      setTargetError("Giá mục tiêu phải là số nguyên VND lớn hơn 0.");
      return;
    }

    try {
      const updated = await updatePriceAlertTarget(alert.id, Number(target));
      onUpdated(updated);
    } catch (err) {
      setTargetError(apiErrorMessage(err));
    }
  }

  const canUpdateTarget = alert.alert_type === "target_price" && ["Active", "Paused"].includes(alert.status);
  const canPause = alert.status === "Active";
  const canReactivate = alert.status === "Paused" || alert.status === "Auto-paused";
  const canRenew = alert.status === "Expired";
  const canRestart = alert.alert_type === "new_lowest_price" && (alert.status === "Active" || alert.status === "Paused");
  const canDisable = alert.status !== "Disabled";
  const bookTitle = alert.book?.title ?? "Sách không còn khả dụng";

  return (
    <article className="grid grid-cols-1 overflow-hidden md:grid-cols-[132px_1fr]" style={{ background: C.white, border: border2, boxShadow: shadow4 }}>
      <Link to={`/book/${alert.book_id}`} className="block min-h-[180px]" style={{ background: C.surfaceContainer, borderRight: border2 }}>
        <CoverImage title={bookTitle} src={alert.book?.cover_image ?? null} />
      </Link>

      <div className="flex min-w-0 flex-col gap-4 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap gap-2">
              <span className="px-2 py-1 text-[10px] font-extrabold uppercase" style={{ background: statusStyle.bg, color: statusStyle.color, border: `1px solid ${C.black}`, fontFamily: FONT }}>
                {STATUS_LABELS[alert.status]}
              </span>
              <span className="px-2 py-1 text-[10px] font-extrabold uppercase" style={{ background: C.boneWhite, border: `1px solid ${C.black}`, fontFamily: FONT }}>
                {ALERT_TYPE_LABELS[alert.alert_type]}
              </span>
              {!alert.alert_emails_enabled && (
                <span className="px-2 py-1 text-[10px] font-extrabold uppercase" style={{ background: "#fff1f1", color: C.dealRed, border: `1px solid ${C.black}`, fontFamily: FONT }}>
                  Email đang tắt
                </span>
              )}
            </div>
            <Link to={`/book/${alert.book_id}`} className="line-clamp-2 text-[17px] font-extrabold" style={{ color: C.onSurface, fontFamily: FONT }}>{bookTitle}</Link>
            <p className="mt-1 text-[12px]" style={{ color: C.onSurfaceVariant, fontFamily: FONT }}>
              {alert.book?.author ?? "Chưa rõ tác giả"} / {alert.book?.category_name ?? "Chưa rõ danh mục"}
            </p>
          </div>
          <p className="text-[12px] font-bold" style={{ color: C.onSurfaceVariant, fontFamily: FONT }}>
            Hết hạn: {formatDateTime(alert.expires_at)}
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          <Metric label="Giá mục tiêu" value={alert.target_price !== null ? formatVnd(alert.target_price) : "Không áp dụng"} />
          <Metric label="Mốc theo dõi" value={alert.baseline_pending ? "Chờ giá đủ điều kiện" : alert.baseline_price !== null ? formatVnd(alert.baseline_price) : "Không áp dụng"} />
          <Metric label="Giá so sánh" value={alert.comparison_price !== null ? formatVnd(alert.comparison_price) : "Chưa có"} />
          <Metric label="Giá hiện tại" value={alert.current_lowest_eligible_price ? `${formatVnd(alert.current_lowest_eligible_price.price)} / ${alert.current_lowest_eligible_price.offer_count} ưu đãi` : "Chưa có giá đủ điều kiện"} />
          <Metric label="Đã gửi" value={`${alert.notification_count}/3 lần`} />
          <Metric label="Giá đã báo" value={alert.last_notified_price !== null ? formatVnd(alert.last_notified_price) : "Chưa có"} />
        </dl>

        {canUpdateTarget && (
          <form onSubmit={updateTarget} className="flex flex-col gap-2 sm:flex-row sm:items-start">
            <label className="flex min-w-0 flex-1 flex-col gap-1 text-[11px] font-extrabold uppercase" style={{ color: C.onSurfaceVariant, fontFamily: FONT }}>
              Cập nhật giá mục tiêu
              <input
                value={target}
                onChange={(event) => setTarget(event.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
                className="px-3 py-2 text-sm normal-case outline-none"
                style={{ border: border2, color: C.onSurface, fontFamily: FONT }}
              />
            </label>
            <button type="submit" className="flex items-center justify-center gap-2 px-3 py-2 text-[11px] font-extrabold uppercase sm:mt-[19px]" style={{ background: C.primary, color: C.white, border: border2, boxShadow: shadow4, fontFamily: FONT }}>
              <Save size={13} /> Lưu giá
            </button>
          </form>
        )}
        {targetError && <p role="alert" className="text-[12px] font-bold" style={{ color: C.dealRed, fontFamily: FONT }}>{targetError}</p>}

        <div className="flex flex-wrap gap-2">
          {canPause && <ActionButton icon={<Pause size={13} />} label="Tạm dừng" onClick={() => onAction("Đã tạm dừng cảnh báo.", () => pausePriceAlert(alert.id))} />}
          {canReactivate && <ActionButton icon={<Play size={13} />} label="Kích hoạt lại" onClick={() => onAction("Đã kích hoạt lại cảnh báo.", () => reactivatePriceAlert(alert.id))} />}
          {canRenew && <ActionButton icon={<RefreshCw size={13} />} label="Gia hạn" onClick={() => onAction("Đã gia hạn cảnh báo.", () => renewPriceAlert(alert.id))} />}
          {canRestart && <ActionButton icon={<RotateCcw size={13} />} label="Theo dõi lại" onClick={() => onAction("Đã bắt đầu theo dõi lại từ giá hiện tại.", () => restartPriceAlertTracking(alert.id))} />}
          {canDisable && <ActionButton icon={<Ban size={13} />} label="Tắt cảnh báo" danger onClick={() => onAction("Đã tắt cảnh báo.", () => disablePriceAlert(alert.id))} />}
          {alert.status === "Disabled" && <span className="px-3 py-2 text-[11px] font-extrabold uppercase" style={{ border: `1px solid ${C.outlineVariant}`, color: C.outline, fontFamily: FONT }}>Chỉ xem lịch sử</span>}
          {alert.status === "Expired" && <Link to={`/book/${alert.book_id}`} className="px-3 py-2 text-[11px] font-extrabold uppercase" style={{ border: border2, background: C.boneWhite, color: C.onSurface, fontFamily: FONT }}>Tạo cảnh báo mới</Link>}
        </div>

        {alert.recent_events.length > 0 && (
          <div className="pt-3" style={{ borderTop: `1px solid ${C.outlineVariant}` }}>
            <p className="mb-2 text-[10px] font-extrabold uppercase" style={{ color: C.outline, fontFamily: FONT }}>Lịch sử gần đây</p>
            <div className="flex flex-wrap gap-2">
              {alert.recent_events.slice(0, 3).map((event) => (
                <span key={event.id} className="px-2 py-1 text-[10px] font-bold" style={{ background: C.surfaceLow, border: `1px solid ${C.outlineVariant}`, color: C.onSurfaceVariant, fontFamily: FONT }}>
                  {event.event_type} / {formatDateTime(event.created_at)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 p-3" style={{ background: C.surfaceLow, border: `1px solid ${C.outlineVariant}` }}>
      <dt className="text-[10px] font-extrabold uppercase" style={{ color: C.outline, fontFamily: FONT }}>{label}</dt>
      <dd className="mt-1 text-[12px] font-bold leading-snug" style={{ color: C.onSurface, fontFamily: FONT, overflowWrap: "anywhere" }}>{value}</dd>
    </div>
  );
}

function ActionButton({ icon, label, danger = false, onClick }: { icon: ReactNode; label: string; danger?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-extrabold uppercase"
      style={{ background: danger ? "#fff1f1" : C.boneWhite, color: danger ? C.dealRed : C.onSurface, border: border2, fontFamily: FONT }}
    >
      {icon}
      {label}
    </button>
  );
}
