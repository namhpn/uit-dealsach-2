import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { BarChart3, Bell, ExternalLink, MailCheck, ScrollText, ShieldCheck, TriangleAlert } from "lucide-react";
import { AdminDashboardDto, apiErrorMessage, fetchAdminDashboard, formatDateTime, formatVnd } from "../api";
import { AdminHeader, AdminTableShell, C, ErrorState, LoadingState, PageShell, border2, shadow4 } from "../shared";
import { AdminGate } from "./AdminPage";

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetchAdminDashboard()
      .then((payload) => {
        if (alive) setData(payload);
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
  }, []);

  const navItems = useMemo(() => [
    { to: "/admin/books", label: "Sách" },
    { to: "/admin/offers", label: "Ưu đãi" },
    { to: "/admin/users", label: "Người dùng" },
    { to: "/admin/alerts", label: "Cảnh báo" },
    { to: "/admin/audit", label: "Quản trị logs" },
  ], []);

  return (
    <AdminGate>
      <PageShell variant="admin" className="min-w-[768px] max-w-[1180px]">
        <AdminHeader
          title="Dashboard quản trị"
          icon={<ShieldCheck size={24} />}
          description="Báo cáo 7 ngày gần đây về lượt chuyển hướng Affiliate, email, lỗi liên kết mua, cảnh báo, biến động giá và logs quản trị."
          actions={navItems.map((item) => (
            <Link key={item.to} to={item.to} className="px-3 py-2 text-[11px] font-extrabold uppercase" style={{ background: C.white, color: C.primary, border: border2, boxShadow: shadow4 }}>
              {item.label}
            </Link>
          ))}
        />

        {loading && <LoadingState label="Đang tải báo cáo quản trị..." />}
        {error && <ErrorState message={error} />}
        {!loading && !error && data && (
          <>
            <section className="flex items-center justify-between p-4 text-[13px] font-bold" style={{ background: C.boneWhite, border: border2, boxShadow: shadow4 }}>
              <span>Báo cáo 7 ngày gần đây: {formatDateTime(data.window.start)} - {formatDateTime(data.window.end)}</span>
            </section>

            <MetricSection title="Chuyển hướng và email" cards={data.summary_cards.slice(0, 3)} iconOffset={0} />
            <MetricSection title="Cảnh báo giá" cards={data.summary_cards.slice(3, 8)} iconOffset={3} />
            <MetricSection title="Logs và lỗi" cards={data.summary_cards.slice(8)} iconOffset={8} />

            <div className="grid grid-cols-2 gap-6">
              <ReportBlock title="Lượt chuyển hướng Affiliate theo sách" rows={data.affiliate_redirects.by_book.map((row) => ({
                label: row.book_title,
                meta: row.archived ? "Đã lưu trữ" : "Đang hoạt động",
                value: row.redirect_count,
              }))} empty="Chưa có lượt chuyển tiếp Affiliate trong 7 ngày." />

              <ReportBlock title="Lượt chuyển hướng Affiliate theo nền tảng" rows={data.affiliate_redirects.by_retailer.map((row) => ({
                label: row.retailer_name,
                meta: row.archived ? "Đã lưu trữ" : "Đang hoạt động",
                value: row.redirect_count,
              }))} empty="Chưa có nền tảng phát sinh chuyển tiếp." />

              <ReportBlock title="Lượt mở liên kết email" rows={data.email_engagement.by_book_and_alert_type.map((row) => ({
                label: row.book_title,
                meta: `${alertTypeLabel(row.alert_type)}${row.archived ? " / Đã lưu trữ" : ""}`,
                value: row.click_count,
              }))} empty="Chưa có lượt mở liên kết email trong 7 ngày." />

              <ReportBlock title="Lỗi liên kết mua theo lý do" rows={data.redirect_failures.by_reason.map((row) => ({
                label: reasonLabel(row.failure_reason),
                meta: row.failure_reason,
                value: row.failure_count,
              }))} empty="Chưa có lỗi liên kết mua trong 7 ngày." />
            </div>

            <section className="grid grid-cols-3 gap-6">
              <TableBlock title="Trạng thái cảnh báo" headers={["Trạng thái", "Số lượng"]} rows={data.alerts.status_counts.map((row) => [statusLabel(row.status), String(row.count)])} />
              <TableBlock title="Biến động giá sách" headers={["Sách", "Biến động"]} rows={data.price_changes.items.slice(0, 8).map((row) => [
                `${row.book_title}${row.archived ? " / Đã lưu trữ" : ""}`,
                row.status === "comparable" && row.change_amount !== null ? `${row.change_amount >= 0 ? "+" : ""}${formatVnd(row.change_amount)}` : "Chưa đủ dữ liệu",
              ])} />
              <TableBlock title="Quản trị logs gần đây" headers={["Admin", "Thao tác"]} rows={data.audit.recent_entries.map((row) => [row.actor_email, `${row.action_type} / ${formatDateTime(row.created_at)}`])} />
            </section>
          </>
        )}
      </PageShell>
    </AdminGate>
  );
}

function MetricSection({ title, cards, iconOffset }: { title: string; cards: { key: string; label: string; value: number }[]; iconOffset: number }) {
  if (cards.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[15px] font-extrabold uppercase">{title}</h2>
      <div className="grid grid-cols-4 gap-4">
        {cards.map((card, index) => (
          <MetricCard key={card.key} card={{ ...card, label: metricLabel(card.label) }} icon={metricIcon(index + iconOffset)} />
        ))}
      </div>
    </section>
  );
}

function MetricCard({ card, icon }: { card: { label: string; value: number }; icon: ReactNode }) {
  return (
    <article className="min-h-[118px] p-4" style={{ background: C.white, border: border2, boxShadow: shadow4 }}>
      <div className="flex items-center justify-between gap-3">
        <span className="flex h-10 w-10 items-center justify-center" style={{ background: C.primaryFixed, border: border2, color: C.primary }}>{icon}</span>
        <strong className="text-[28px] leading-none">{card.value.toLocaleString("vi-VN")}</strong>
      </div>
      <p className="mt-4 text-[12px] font-extrabold uppercase leading-snug" style={{ color: C.onSurfaceVariant }}>{card.label}</p>
    </article>
  );
}

function ReportBlock({ title, rows, empty }: { title: string; rows: { label: string; meta: string; value: number }[]; empty: string }) {
  const max = Math.max(1, ...rows.map((row) => row.value));

  return (
    <section className="p-5" style={{ background: C.white, border: border2, boxShadow: shadow4 }}>
      <h2 className="text-[18px] font-extrabold uppercase">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-4 text-[13px] font-bold" style={{ color: C.onSurfaceVariant }}>{empty}</p>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {rows.map((row) => (
            <div key={`${row.label}-${row.meta}`} className="grid grid-cols-[180px_1fr_56px] items-center gap-3">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-extrabold">{row.label}</p>
                <p className="truncate text-[11px] font-bold" style={{ color: C.onSurfaceVariant }}>{row.meta}</p>
              </div>
              <div className="h-6" style={{ background: C.surfaceVariant, border: border2 }}>
                <div className="h-full" style={{ width: `${Math.max(8, (row.value / max) * 100)}%`, background: C.primaryFixed, borderRight: border2 }} />
              </div>
              <strong className="text-right text-[13px]">{row.value.toLocaleString("vi-VN")}</strong>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function TableBlock({ title, headers, rows }: { title: string; headers: string[]; rows: string[][] }) {
  return (
    <AdminTableShell>
      <h2 className="p-4 text-[16px] font-extrabold uppercase" style={{ borderBottom: border2 }}>{title}</h2>
      {rows.length === 0 ? (
        <p className="p-4 text-[13px] font-bold" style={{ color: C.onSurfaceVariant }}>Chưa có dữ liệu phù hợp.</p>
      ) : (
        <table className="w-full text-[12px]">
          <thead style={{ background: C.boneWhite }}>
            <tr>{headers.map((header) => <th key={header} className="p-3 text-left uppercase" style={{ borderBottom: border2 }}>{header}</th>)}</tr>
          </thead>
          <tbody>{rows.map((row, index) => <tr key={`${row.join("-")}-${index}`}>{row.map((cell, cellIndex) => <td key={cellIndex} className="p-3 align-top font-bold" style={{ borderTop: `1px solid ${C.black}` }}>{cell}</td>)}</tr>)}</tbody>
        </table>
      )}
    </AdminTableShell>
  );
}

function metricIcon(index: number) {
  const icons = [<ExternalLink size={18} />, <MailCheck size={18} />, <TriangleAlert size={18} />, <Bell size={18} />, <BarChart3 size={18} />, <Bell size={18} />, <Bell size={18} />, <Bell size={18} />, <MailCheck size={18} />, <TriangleAlert size={18} />, <ScrollText size={18} />];
  return icons[index] ?? <BarChart3 size={18} />;
}

function alertTypeLabel(value: string): string {
  return value === "target_price" ? "Giá mục tiêu" : "Giá thấp mới";
}

function statusLabel(value: string): string {
  return ({ Active: "Đang theo dõi", Paused: "Tạm dừng", "Auto-paused": "Tự tạm dừng", Expired: "Hết hạn", Disabled: "Đã tắt" } as Record<string, string>)[value] ?? value;
}

function metricLabel(value: string): string {
  return ({
    "Affiliate Redirects": "Lượt chuyển hướng Affiliate",
    "Redirect Failures": "Lỗi liên kết mua",
    "Email Deal Link Clicks": "Lượt mở liên kết email",
    "Active Alerts": "Số cảnh báo giá đang theo dõi",
    "Alert Emails Sent": "Số email đã gửi",
    "Audit Logs": "Logs",
  } as Record<string, string>)[value] ?? value;
}

function reasonLabel(value: string): string {
  return ({
    entity_inactive: "Thực thể không hoạt động",
    offer_unavailable: "Ưu đãi tạm hết hàng",
    offer_stale: "Giá tham khảo cũ",
    missing_destination: "Thiếu liên kết mua",
    invalid_destination: "Liên kết không hợp lệ",
    unsafe_destination: "Liên kết không an toàn",
  } as Record<string, string>)[value] ?? "Lý do khác";
}
