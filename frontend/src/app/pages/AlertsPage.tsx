import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Link } from "react-router";
import { Ban, Bell, Clock3, Mail, Pause, Pencil, Play, RefreshCw, RotateCcw, Save } from "lucide-react";
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
  PriceAlertEventDto,
  PriceAlertStatus,
  reactivatePriceAlert,
  renewPriceAlert,
  restartPriceAlertTracking,
  updateAlertPreferences,
  updatePriceAlertTarget,
} from "../api";
import { useAuth } from "../auth";
import { C, CoverImage, ErrorState, FONT, LoadingState, NbButton, PageIntro, PageShell, PromptCard, StampHeading, border2, shadow4, shadow8 } from "../shared";

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

const STATUS_BADGE_STYLES: Record<PriceAlertStatus, { bg: string; color: string }> = {
  Active: { bg: C.primary, color: C.white },
  Paused: { bg: C.boneWhite, color: C.onSurface },
  "Auto-paused": { bg: "#fff4cc", color: "#5f4700" },
  Expired: { bg: "#ffe2d8", color: "#7a2d00" },
  Disabled: { bg: "#f1f2f1", color: C.outline },
};

type AlertGroupKey = "tracking" | "attention" | "disabled";

const GROUP_META: Record<
  AlertGroupKey,
  {
    title: string;
    description: string;
    statuses: PriceAlertStatus[];
    countBg: string;
    divider: string;
  }
> = {
  tracking: {
    title: "Đang theo dõi",
    description: "Những cảnh báo đang chờ mức giá phù hợp để bạn quyết định mua.",
    statuses: ["Active"],
    countBg: C.primary,
    divider: `4px solid ${C.black}`,
  },
  attention: {
    title: "Cần chú ý",
    description: "Các cảnh báo này cần bạn xem lại trạng thái hoặc gia hạn để tiếp tục theo dõi.",
    statuses: ["Paused", "Auto-paused", "Expired"],
    countBg: "#fff4cc",
    divider: `3px solid ${C.black}`,
  },
  disabled: {
    title: "Đã tắt",
    description: "Lịch sử cảnh báo đã dừng theo dõi.",
    statuses: ["Disabled"],
    countBg: C.boneWhite,
    divider: `2px dashed ${C.outline}`,
  },
};

const EVENT_LABELS: Record<string, string> = {
  created: "Đã tạo cảnh báo",
  target_price_updated: "Đã cập nhật giá mục tiêu",
  paused: "Đã tạm dừng",
  reactivated: "Đã tiếp tục theo dõi",
  renewed: "Đã gia hạn cảnh báo",
  tracking_restarted: "Đã theo dõi lại từ mốc mới",
  disabled: "Đã tắt cảnh báo",
  email_sent: "Đã gửi email thông báo",
  suppressed: "Tạm chưa gửi email",
  expired: "Cảnh báo đã hết hạn",
};

export default function AlertsPage() {
  const auth = useAuth();
  const [alerts, setAlerts] = useState<PriceAlertDto[]>([]);
  const [preference, setPreference] = useState<AlertPreferenceDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [preferenceBusy, setPreferenceBusy] = useState(false);
  const [busyActions, setBusyActions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!auth.authenticated) {
      setAlerts([]);
      setPreference(null);
      setBusyActions({});
      return;
    }

    let alive = true;
    setLoading(true);
    setError(null);
    Promise.all([fetchPriceAlerts(), fetchAlertPreferences()])
      .then(([list, pref]) => {
        if (!alive) {
          return;
        }
        setAlerts(list.items);
        setPreference(pref);
      })
      .catch((err) => {
        if (alive) {
          setError(apiErrorMessage(err));
        }
      })
      .finally(() => {
        if (alive) {
          setLoading(false);
        }
      });

    return () => {
      alive = false;
    };
  }, [auth.authenticated]);

  function replaceAlert(next: PriceAlertDto) {
    setAlerts((current) => current.map((alert) => (alert.id === next.id ? next : alert)));
  }

  function setActionBusy(actionKey: string, value: boolean) {
    setBusyActions((current) => {
      if (value) {
        return { ...current, [actionKey]: true };
      }
      const { [actionKey]: _removed, ...rest } = current;
      return rest;
    });
  }

  async function runAction(actionKey: string, label: string, action: () => Promise<PriceAlertDto>) {
    if (busyActions[actionKey]) {
      return;
    }
    setError(null);
    setSuccess(null);
    setActionBusy(actionKey, true);
    try {
      const updated = await action();
      replaceAlert(updated);
      setSuccess(label);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setActionBusy(actionKey, false);
    }
  }

  async function togglePreference() {
    if (!preference || preferenceBusy) {
      return;
    }
    setPreferenceBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const next = await updateAlertPreferences(!preference.alert_emails_enabled);
      setPreference(next);
      setAlerts((current) => current.map((alert) => ({ ...alert, alert_emails_enabled: next.alert_emails_enabled })));
      setSuccess(next.alert_emails_enabled ? "Đã bật email cảnh báo giá." : "Đã tắt email cảnh báo giá toàn tài khoản.");
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setPreferenceBusy(false);
    }
  }

  const groups = useMemo(() => {
    return {
      tracking: alerts.filter((alert) => GROUP_META.tracking.statuses.includes(alert.status)),
      attention: alerts.filter((alert) => GROUP_META.attention.statuses.includes(alert.status)),
      disabled: alerts.filter((alert) => GROUP_META.disabled.statuses.includes(alert.status)),
    };
  }, [alerts]);

  if (!auth.authenticated) {
    return (
      <PageShell>
        <PromptCard
          icon={<Bell size={20} style={{ color: C.primary }} />}
          title="Cảnh báo giá"
          description="Đăng nhập để lưu sách bạn quan tâm, đặt mốc giá phù hợp và nhận email khi giá thuận lợi trước khi mua."
          cta={<NbButton onClick={auth.openAuthDialog}>Đăng nhập để theo dõi giá</NbButton>}
          secondaryCta={<Link to="/search" className="px-4 py-2.5 text-[12px] font-extrabold uppercase" style={{ background: C.boneWhite, color: C.onSurface, border: border2, boxShadow: shadow4, fontFamily: FONT }}>Tìm sách để theo dõi</Link>}
        />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <section className="flex flex-col gap-4">
        <StampHeading title="Cảnh báo giá" icon={<Bell size={20} style={{ color: C.primary }} />} />
        <PageIntro>Theo dõi sách đã lưu, kiểm soát mốc giá mục tiêu và nhận email khi giá tham khảo đạt điều kiện phù hợp để bạn ra quyết định nhanh hơn.</PageIntro>
      </section>

      <PreferencePanel preference={preference} onToggle={togglePreference} busy={preferenceBusy} />

      {success && (
        <p className="px-4 py-3 text-[13px] font-bold" style={{ border: border2, background: C.primaryFixed, color: C.primary, fontFamily: FONT }}>
          {success}
        </p>
      )}
      {loading && <LoadingState label="Đang tải cảnh báo giá..." />}
      {error && <ErrorState message={error} />}
      {!loading && alerts.length === 0 && <EmptyAlertsState />}

      {!loading && alerts.length > 0 && (
        <div className="flex flex-col gap-8">
          <AlertSection
            sectionKey="tracking"
            alerts={groups.tracking}
            busyActions={busyActions}
            onAction={runAction}
            onUpdated={replaceAlert}
          />
          <AlertSection
            sectionKey="attention"
            alerts={groups.attention}
            busyActions={busyActions}
            onAction={runAction}
            onUpdated={replaceAlert}
          />
          <AlertSection
            sectionKey="disabled"
            alerts={groups.disabled}
            busyActions={busyActions}
            onAction={runAction}
            onUpdated={replaceAlert}
          />
        </div>
      )}
    </PageShell>
  );
}

function PreferencePanel({
  preference,
  onToggle,
  busy,
}: {
  preference: AlertPreferenceDto | null;
  onToggle: () => void;
  busy: boolean;
}) {
  const enabled = preference?.alert_emails_enabled ?? true;

  return (
    <section
      className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between"
      style={{ background: C.boneWhite, border: border2, boxShadow: shadow4 }}
    >
      <div className="flex min-w-0 items-start gap-3">
        <Mail size={20} style={{ color: C.primary }} />
        <div>
          <h2 className="text-[14px] font-extrabold uppercase" style={{ fontFamily: FONT }}>
            Email cảnh báo giá từ DealSach
          </h2>
          <p className="mt-1 text-[12px] leading-relaxed" style={{ color: C.onSurfaceVariant, fontFamily: FONT }}>
            Bạn có thể bật hoặc tắt email cảnh báo giá từ DealSach.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onToggle}
        disabled={!preference || busy}
        className="shrink-0 px-4 py-2 text-[11px] font-extrabold uppercase disabled:opacity-50"
        style={{
          background: enabled ? C.primary : C.white,
          color: enabled ? C.white : C.onSurface,
          border: border2,
          boxShadow: shadow4,
          fontFamily: FONT,
        }}
      >
        {busy ? "Đang cập nhật..." : enabled ? "Email đang bật" : "Email đang tắt"}
      </button>
    </section>
  );
}

function EmptyAlertsState() {
  return (
    <section className="flex flex-col gap-4 p-6" style={{ background: C.white, border: border2, boxShadow: shadow4, fontFamily: FONT }}>
      <p className="text-[15px] font-extrabold uppercase" style={{ color: C.onSurface }}>
        Bạn chưa có cảnh báo giá nào
      </p>
      <p className="text-[13px] leading-relaxed" style={{ color: C.onSurfaceVariant }}>
        Mở trang chi tiết sách để đặt cảnh báo Giá mục tiêu hoặc Giá thấp mới.
      </p>
      <div>
        <Link
          to="/search"
          className="inline-flex px-4 py-2 text-[11px] font-extrabold uppercase"
          style={{ background: C.primary, color: C.white, border: border2, boxShadow: shadow4 }}
        >
          Tìm sách để theo dõi
        </Link>
      </div>
    </section>
  );
}

function AlertSection({
  sectionKey,
  alerts,
  busyActions,
  onAction,
  onUpdated,
}: {
  sectionKey: AlertGroupKey;
  alerts: PriceAlertDto[];
  busyActions: Record<string, boolean>;
  onAction: (actionKey: string, label: string, action: () => Promise<PriceAlertDto>) => Promise<void>;
  onUpdated: (alert: PriceAlertDto) => void;
}) {
  if (alerts.length === 0) {
    return null;
  }

  const meta = GROUP_META[sectionKey];

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 pb-3" style={{ borderBottom: meta.divider }}>
        <div className="flex items-center gap-3">
          <h2 className="text-[20px] font-black uppercase leading-none" style={{ fontFamily: FONT }}>
            {meta.title}
          </h2>
          <span
            className="px-2 py-1 text-[10px] font-extrabold uppercase"
            style={{ border: border2, background: meta.countBg, color: sectionKey === "tracking" ? C.white : C.onSurface, fontFamily: FONT }}
          >
            {alerts.length} cảnh báo
          </span>
        </div>
        <p className="text-[12px]" style={{ color: C.onSurfaceVariant, fontFamily: FONT }}>
          {meta.description}
        </p>
      </div>
      {sectionKey === "disabled" ? (
        <div className="flex flex-col gap-2">
          {alerts.map((alert) => (
            <DisabledAlertRow key={alert.id} alert={alert} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {alerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} busyActions={busyActions} onAction={onAction} onUpdated={onUpdated} />
          ))}
        </div>
      )}
    </section>
  );
}

function DisabledAlertRow({ alert }: { alert: PriceAlertDto }) {
  const bookTitle = alert.book?.title ?? "Sách không còn khả dụng";
  const latestEvent = alert.recent_events[0] ?? null;

  return (
    <article
      className="flex flex-col gap-2 p-3 md:flex-row md:items-center md:justify-between"
      style={{
        background: C.surface,
        border: `2px dashed ${C.outlineVariant}`,
        boxShadow: shadow4,
        fontFamily: FONT,
      }}
    >
      <div className="min-w-0">
        <p className="line-clamp-1 text-[14px] font-extrabold" style={{ color: C.onSurface }}>
          {bookTitle}
        </p>
        <p className="mt-1 text-[11px]" style={{ color: C.outline }}>
          {(alert.book?.author || "Chưa rõ tác giả") + " · " + (alert.book?.category_name || "Chưa rõ danh mục")}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-[10px] font-extrabold uppercase">
        <span className="px-2 py-1" style={{ border: `1px solid ${C.black}`, background: C.white }}>
          {ALERT_TYPE_LABELS[alert.alert_type]}
        </span>
        <span className="px-2 py-1" style={{ border: `1px solid ${C.black}`, background: "#f1f2f1", color: C.outline }}>
          Đã tắt
        </span>
        <span className="px-2 py-1" style={{ border: `1px solid ${C.outlineVariant}`, color: C.outline }}>
          {latestEvent ? `${describeEvent(latestEvent)} · ${formatDateTime(latestEvent.created_at)}` : `Cập nhật ${formatDateTime(alert.updated_at)}`}
        </span>
        <span className="px-2 py-1" style={{ border: `1px solid ${C.outlineVariant}`, color: C.outline }}>
          Chỉ xem lịch sử
        </span>
      </div>
    </article>
  );
}

function AlertCard({
  alert,
  busyActions,
  onAction,
  onUpdated,
}: {
  alert: PriceAlertDto;
  busyActions: Record<string, boolean>;
  onAction: (actionKey: string, label: string, action: () => Promise<PriceAlertDto>) => Promise<void>;
  onUpdated: (alert: PriceAlertDto) => void;
}) {
  const [editingTarget, setEditingTarget] = useState(false);
  const [savingTarget, setSavingTarget] = useState(false);
  const [target, setTarget] = useState(alert.target_price?.toString() ?? "");
  const [targetError, setTargetError] = useState<string | null>(null);

  const bookTitle = alert.book?.title ?? "Sách không còn khả dụng";
  const statusStyle = STATUS_BADGE_STYLES[alert.status];

  useEffect(() => {
    setTarget(alert.target_price?.toString() ?? "");
  }, [alert.target_price]);

  const canEditTarget = alert.alert_type === "target_price" && ["Active", "Paused"].includes(alert.status);
  const canPause = alert.status === "Active";
  const canReactivate = alert.status === "Paused" || alert.status === "Auto-paused";
  const canRenew = alert.status === "Expired";
  const canRestart = alert.alert_type === "new_lowest_price" && (alert.status === "Active" || alert.status === "Paused");
  const canDisable = alert.status !== "Disabled";

  async function submitTargetUpdate(event: FormEvent) {
    event.preventDefault();
    setTargetError(null);
    if (!/^[0-9]+$/.test(target) || Number(target) <= 0) {
      setTargetError("Giá mục tiêu phải là số nguyên VND lớn hơn 0.");
      return;
    }

    setSavingTarget(true);
    try {
      const updated = await updatePriceAlertTarget(alert.id, Number(target));
      onUpdated(updated);
      setEditingTarget(false);
    } catch (err) {
      setTargetError(apiErrorMessage(err));
    } finally {
      setSavingTarget(false);
    }
  }

  const latestEvent = alert.recent_events[0] ?? null;

  return (
    <article className="grid grid-cols-1 md:grid-cols-[136px_1fr]" style={{ background: C.white, border: border2, boxShadow: shadow4 }}>
      <div className="relative" style={{ background: C.surfaceContainer, borderRight: border2 }}>
        <Link to={`/book/${alert.book_id}`} className="block aspect-[3/4] min-h-[168px]">
          <CoverImage title={bookTitle} src={alert.book?.cover_image ?? null} />
        </Link>
        <div className="absolute left-2 top-2 px-2 py-1 text-[9px] font-extrabold uppercase" style={{ border: `1px solid ${C.black}`, background: statusStyle.bg, color: statusStyle.color, fontFamily: FONT }}>
          {STATUS_LABELS[alert.status]}
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-4 p-4">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="px-2 py-1 text-[9px] font-extrabold uppercase" style={{ border: `1px solid ${C.black}`, background: C.boneWhite, fontFamily: FONT }}>
                {ALERT_TYPE_LABELS[alert.alert_type]}
              </span>
              {!alert.alert_emails_enabled && (
                <span className="px-2 py-1 text-[9px] font-extrabold uppercase" style={{ border: `1px solid ${C.black}`, background: "#fff1f1", color: C.dealRed, fontFamily: FONT }}>
                  Email đang tắt
                </span>
              )}
            </div>
            <Link to={`/book/${alert.book_id}`} className="line-clamp-2 text-[18px] font-black" style={{ color: C.onSurface, fontFamily: FONT }}>
              {bookTitle}
            </Link>
            <p className="mt-1 text-[12px]" style={{ color: C.onSurfaceVariant, fontFamily: FONT }}>
              {alert.book?.author ?? "Chưa rõ tác giả"}
              {alert.book?.publisher ? ` · ${alert.book.publisher}` : ""}
            </p>
            <p className="text-[11px]" style={{ color: C.outline, fontFamily: FONT }}>
              {alert.book?.category_name ?? "Chưa rõ danh mục"}
            </p>
          </div>
          <div className="text-right text-[11px] font-bold" style={{ color: C.outline, fontFamily: FONT }}>
            <p>Tạo: {formatDateTime(alert.created_at)}</p>
            <p>Hết hạn: {formatDateTime(alert.expires_at)}</p>
          </div>
        </div>

        {alert.alert_type === "target_price" ? (
          <TargetPriceBlocks alert={alert} />
        ) : (
          <NewLowestBlocks alert={alert} />
        )}

        {latestEvent && (
          <p className="inline-flex w-fit items-center gap-1.5 text-[11px] font-bold" style={{ color: C.onSurfaceVariant, fontFamily: FONT }}>
            <Clock3 size={12} />
            Cập nhật gần nhất: {describeEvent(latestEvent)} · {formatDateTime(latestEvent.created_at)}
          </p>
        )}

        {editingTarget && canEditTarget && (
          <form onSubmit={submitTargetUpdate} className="flex flex-col gap-2 sm:flex-row sm:items-end" style={{ fontFamily: FONT }}>
            <label className="flex min-w-0 flex-1 flex-col gap-1 text-[11px] font-extrabold uppercase" style={{ color: C.outline }}>
              Giá mục tiêu VND
              <input
                value={target}
                onChange={(event) => setTarget(event.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
                className="px-3 py-2 text-sm normal-case outline-none"
                style={{ border: border2, color: C.onSurface }}
              />
            </label>
            <button
              type="submit"
              disabled={savingTarget}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-extrabold uppercase disabled:opacity-50"
              style={{ background: C.primary, color: C.white, border: border2, boxShadow: shadow4 }}
            >
              <Save size={13} />
              {savingTarget ? "Đang lưu..." : "Lưu giá"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingTarget(false);
                setTargetError(null);
                setTarget(alert.target_price?.toString() ?? "");
              }}
              className="px-3 py-2 text-[11px] font-extrabold uppercase"
              style={{ background: C.boneWhite, color: C.onSurface, border: border2 }}
            >
              Hủy
            </button>
          </form>
        )}

        {targetError && (
          <p role="alert" className="text-[12px] font-bold" style={{ color: C.dealRed, fontFamily: FONT }}>
            {targetError}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {canEditTarget && !editingTarget && (
            <ActionButton icon={<Pencil size={13} />} label="Sửa" onClick={() => setEditingTarget(true)} />
          )}
          {canPause && (
            <ActionButton
              icon={<Pause size={13} />}
              label="Tạm dừng"
              disabled={Boolean(busyActions[`${alert.id}:pause`])}
              onClick={() => onAction(`${alert.id}:pause`, "Đã tạm dừng cảnh báo.", () => pausePriceAlert(alert.id))}
            />
          )}
          {canReactivate && (
            <ActionButton
              icon={<Play size={13} />}
              label="Tiếp tục"
              disabled={Boolean(busyActions[`${alert.id}:reactivate`])}
              onClick={() => onAction(`${alert.id}:reactivate`, "Đã tiếp tục theo dõi cảnh báo.", () => reactivatePriceAlert(alert.id))}
            />
          )}
          {canRenew && (
            <ActionButton
              icon={<RefreshCw size={13} />}
              label="Gia hạn"
              disabled={Boolean(busyActions[`${alert.id}:renew`])}
              onClick={() => onAction(`${alert.id}:renew`, "Đã gia hạn cảnh báo.", () => renewPriceAlert(alert.id))}
            />
          )}
          {canRestart && (
            <ActionButton
              icon={<RotateCcw size={13} />}
              label="Theo dõi lại"
              disabled={Boolean(busyActions[`${alert.id}:restart`])}
              onClick={() =>
                onAction(`${alert.id}:restart`, "Đã bắt đầu theo dõi lại từ giá hiện tại.", () => restartPriceAlertTracking(alert.id))
              }
            />
          )}
          {canDisable && (
            <ActionButton
              icon={<Ban size={13} />}
              label="Tắt"
              danger
              disabled={Boolean(busyActions[`${alert.id}:disable`])}
              onClick={() => onAction(`${alert.id}:disable`, "Đã tắt cảnh báo.", () => disablePriceAlert(alert.id))}
            />
          )}
          {alert.status === "Expired" && (
            <Link
              to={`/book/${alert.book_id}`}
              className="px-3 py-2 text-[11px] font-extrabold uppercase"
              style={{ border: border2, background: C.white, color: C.onSurface, fontFamily: FONT }}
            >
              Xem sách
            </Link>
          )}
        </div>

      </div>
    </article>
  );
}

function TargetPriceBlocks({ alert }: { alert: PriceAlertDto }) {
  const targetPrice = alert.target_price;
  const currentPrice = alert.current_lowest_eligible_price?.price ?? null;

  let condition = "Đang chờ giá";
  if (targetPrice !== null && currentPrice !== null) {
    if (currentPrice <= targetPrice) {
      condition = "Đã chạm mục tiêu";
    } else {
      condition = `Còn ${formatVnd(currentPrice - targetPrice)}`;
    }
  }

  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
      <PriceBlock label="Giá mục tiêu" value={targetPrice !== null ? formatVnd(targetPrice) : "Chưa đặt"} bg={C.primary} color={C.white} />
      <PriceBlock
        label="Giá hiện tại"
        value={currentPrice !== null ? `${formatVnd(currentPrice)} / ${alert.current_lowest_eligible_price?.offer_count ?? 0} ưu đãi` : "Chưa có giá đủ điều kiện"}
        bg={C.boneWhite}
        color={C.onSurface}
      />
      <PriceBlock label="Điều kiện mua" value={condition} bg={C.white} color={C.onSurface} />
    </div>
  );
}

function NewLowestBlocks({ alert }: { alert: PriceAlertDto }) {
  const baselinePrice = alert.baseline_price;
  const currentPrice = alert.current_lowest_eligible_price?.price ?? null;

  let condition = "Chưa thấp hơn mốc";
  if (alert.baseline_pending) {
    condition = "Đang chờ mốc";
  } else if (baselinePrice !== null && currentPrice !== null && currentPrice < baselinePrice) {
    condition = `Giảm ${formatVnd(baselinePrice - currentPrice)}`;
  }

  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
      <PriceBlock
        label="Mốc theo dõi"
        value={alert.baseline_pending ? "Chờ giá đủ điều kiện" : baselinePrice !== null ? formatVnd(baselinePrice) : "Chờ giá đủ điều kiện"}
        bg={C.primary}
        color={C.white}
      />
      <PriceBlock
        label="Giá hiện tại"
        value={currentPrice !== null ? `${formatVnd(currentPrice)} / ${alert.current_lowest_eligible_price?.offer_count ?? 0} ưu đãi` : "Chưa có giá đủ điều kiện"}
        bg={C.boneWhite}
        color={C.onSurface}
      />
      <PriceBlock label="Điều kiện mua" value={condition} bg={C.white} color={C.onSurface} />
    </div>
  );
}

function PriceBlock({ label, value, bg, color }: { label: string; value: string; bg: string; color: string }) {
  return (
    <div className="min-w-0 p-3" style={{ background: bg, border: `1px solid ${C.black}`, fontFamily: FONT }}>
      <p className="text-[10px] font-extrabold uppercase" style={{ color }}>
        {label}
      </p>
      <p className="mt-1 text-[14px] font-black leading-snug" style={{ color, overflowWrap: "anywhere" }}>
        {value}
      </p>
    </div>
  );
}

function describeEvent(event: PriceAlertEventDto): string {
  const mapped = EVENT_LABELS[event.event_type];
  if (mapped) {
    return mapped;
  }

  if (event.new_status) {
    return `Chuyển trạng thái ${STATUS_LABELS[event.new_status]}`;
  }

  return "Đã cập nhật cảnh báo";
}

function ActionButton({
  icon,
  label,
  danger = false,
  disabled = false,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-extrabold uppercase disabled:opacity-50"
      style={{
        background: danger ? "#fff1f1" : C.boneWhite,
        color: danger ? C.dealRed : C.onSurface,
        border: border2,
        boxShadow: shadow4,
        fontFamily: FONT,
      }}
    >
      {icon}
      {label}
    </button>
  );
}
