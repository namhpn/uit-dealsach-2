import { useState } from "react";
import { useNavigate } from "react-router";
import { Pencil, Pause, Trash2, Play, BellRing, CheckCircle, Clock } from "lucide-react";
import { C, FONT, border2, border4, shadow4, shadow8, fmt } from "../shared";

// ─── Types & Mock Data ────────────────────────────────────────────────────────

type AlertStatus   = "active" | "paused";
type HistoryStatus = "completed" | "expired" | "disabled";
type AlertType     = "target" | "new_lowest";

interface AlertBook {
  id: number;
  title: string;
  author: string;
  category: string;
  coverUrl: string;
  currentPrice: number | null;
  originalPrice?: number;
  offerCount: number;
}

interface ActiveAlert {
  id: number;
  book: AlertBook;
  alertType: AlertType;
  targetPrice: number | null;
  status: AlertStatus;
  createdAt: string;
}

interface HistoricalAlert {
  id: number;
  book: { title: string; author: string; coverUrl: string };
  alertType: AlertType;
  targetPrice: number | null;
  status: HistoryStatus;
  closedAt: string;
  note: string;
}

const MOCK_ACTIVE: ActiveAlert[] = [
  {
    id: 1,
    book: { id: 5, title: "Atomic Habits", author: "James Clear", category: "Kỹ năng sống", coverUrl: "https://images.unsplash.com/photo-1592496431122-2349e0fbc666?w=300&h=420&fit=crop&auto=format", currentPrice: 112000, originalPrice: 150000, offerCount: 8 },
    alertType: "target", targetPrice: 90000, status: "active", createdAt: "10/05/2026",
  },
  {
    id: 2,
    book: { id: 10, title: "Chiến Tranh Và Hòa Bình", author: "Leo Tolstoy", category: "Văn học nước ngoài", coverUrl: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=300&h=420&fit=crop&auto=format", currentPrice: 210000, originalPrice: 265000, offerCount: 4 },
    alertType: "new_lowest", targetPrice: null, status: "active", createdAt: "02/05/2026",
  },
  {
    id: 3,
    book: { id: 17, title: "Sapiens: Lược Sử Loài Người", author: "Yuval Noah Harari", category: "Lịch sử", coverUrl: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=300&h=420&fit=crop&auto=format", currentPrice: 148000, originalPrice: 199000, offerCount: 6 },
    alertType: "target", targetPrice: 120000, status: "paused", createdAt: "28/04/2026",
  },
  {
    id: 4,
    book: { id: 11, title: "Dune — Hành Tinh Cát", author: "Frank Herbert", category: "Văn học nước ngoài", coverUrl: "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=300&h=420&fit=crop&auto=format", currentPrice: 195000, originalPrice: 249000, offerCount: 5 },
    alertType: "target", targetPrice: 160000, status: "active", createdAt: "20/04/2026",
  },
];

const MOCK_HISTORY: HistoricalAlert[] = [
  { id: 10, book: { title: "Đắc Nhân Tâm", author: "Dale Carnegie", coverUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=420&fit=crop&auto=format" }, alertType: "target", targetPrice: 70000, status: "completed", closedAt: "13/05/2026", note: "Đạt 68.000 đ tại Tiki" },
  { id: 11, book: { title: "Nhà Giả Kim", author: "Paulo Coelho", coverUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=420&fit=crop&auto=format" }, alertType: "new_lowest", targetPrice: null, status: "expired", closedAt: "01/04/2026", note: "Hết hạn sau 30 ngày không kích hoạt" },
  { id: 12, book: { title: "Bố Già Dạy Con Làm Giàu", author: "R. T. Kiyosaki", coverUrl: "https://images.unsplash.com/photo-1604866830893-c13cafa515d5?w=300&h=420&fit=crop&auto=format" }, alertType: "target", targetPrice: 80000, status: "disabled", closedAt: "15/03/2026", note: "Đã tắt thủ công" },
];

const activeStatusCfg: Record<AlertStatus, { label: string; bg: string; color: string }> = {
  active: { label: "Đang Theo Dõi", bg: C.primary,   color: C.white },
  paused: { label: "Tạm Dừng",      bg: C.boneWhite, color: C.onSurface },
};

const historyStatusCfg: Record<HistoryStatus, { label: string; Icon: typeof CheckCircle }> = {
  completed: { label: "Đã Hoàn Thành", Icon: CheckCircle },
  expired:   { label: "Đã Hết Hạn",    Icon: Clock },
  disabled:  { label: "Đã Tắt",        Icon: Clock },
};

// ─── Page Header ──────────────────────────────────────────────────────────────

function PageHeader({ activeCount }: { activeCount: number }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-8" style={{ borderBottom: border4 }}>
      <div className="flex flex-col gap-4">
        <h1
          className="self-start px-4 py-2 uppercase"
          style={{
            fontFamily: FONT, fontSize: "clamp(28px,5vw,48px)", fontWeight: 800,
            letterSpacing: "-0.03em", lineHeight: 1, color: C.black,
            background: C.primaryFixed, border: border2, boxShadow: shadow8, transform: "rotate(-1deg)",
          }}>
          Cảnh báo giá
        </h1>
        <div className="pl-5 py-1 max-w-xl" style={{ borderLeft: `5px solid ${C.primary}` }}>
          <p style={{ fontFamily: FONT, fontSize: 15, color: C.onSurfaceVariant, lineHeight: 1.65 }}>
            Quản lý mục tiêu giá cho sách yêu thích. Chúng tôi sẽ gửi email ngay khi sách đạt mức giá bạn mong muốn.
          </p>
        </div>
      </div>
      <div className="shrink-0 flex items-center gap-2 px-4 py-3 self-start sm:self-auto"
        style={{ border: border2, background: C.boneWhite, boxShadow: shadow4 }}>
        <BellRing size={16} style={{ color: C.primary }} />
        <span className="font-bold text-[13px] uppercase tracking-wide" style={{ fontFamily: FONT, color: C.onSurface }}>
          {activeCount} đang theo dõi
        </span>
      </div>
    </div>
  );
}

// ─── Alert Card ───────────────────────────────────────────────────────────────

function AlertCard({ alert, onToggle, onDelete }: {
  alert: ActiveAlert;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const navigate  = useNavigate();
  const [lifted, setLifted] = useState(false);
  const cfg       = activeStatusCfg[alert.status];
  const isPaused  = alert.status === "paused";
  const nearTarget = alert.alertType === "target" && alert.targetPrice !== null && alert.book.currentPrice !== null
    && alert.book.currentPrice > alert.targetPrice
    && (alert.book.currentPrice - alert.targetPrice) / alert.targetPrice < 0.15;
  const reached = alert.alertType === "target" && alert.targetPrice !== null && alert.book.currentPrice !== null
    && alert.book.currentPrice <= alert.targetPrice;

  return (
    <div
      className="flex flex-col md:flex-row overflow-hidden"
      style={{
        border: border2, boxShadow: shadow8, background: C.white,
        transform: lifted ? "translateY(-4px)" : "none",
        transition: "transform 150ms",
      }}
      onMouseEnter={() => setLifted(true)}
      onMouseLeave={() => setLifted(false)}>

      {/* ── Cover ── */}
      <div className="shrink-0 relative" style={{ width: 112, borderRight: border2, background: C.surfaceContainer }}>
        <img
          src={alert.book.coverUrl}
          alt={alert.book.title}
          style={{ width: 112, height: 190, objectFit: "cover", display: "block" }}
        />
        <div className="absolute top-2 left-2 px-2 py-0.5"
          style={{ background: cfg.bg, color: cfg.color, border: border2, boxShadow: shadow4, fontFamily: FONT, fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {cfg.label}
        </div>
        {nearTarget && !reached && (
          <div className="absolute bottom-2 left-2 right-2 text-center px-2 py-0.5"
            style={{ background: C.primaryFixed, color: C.primary, border: border2, fontFamily: FONT, fontSize: 9, fontWeight: 800, textTransform: "uppercase" }}>
            Gần đạt!
          </div>
        )}
        {reached && (
          <div className="absolute bottom-2 left-2 right-2 text-center px-2 py-0.5"
            style={{ background: C.primaryFixed, color: C.primary, border: border2, fontFamily: FONT, fontSize: 9, fontWeight: 800, textTransform: "uppercase" }}>
            Đã đạt!
          </div>
        )}
      </div>

      {/* ── Book info + prices ── */}
      <div className="flex-1 min-w-0 p-5 flex flex-col gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ fontFamily: FONT, color: C.outline }}>
            {alert.book.category}
          </p>
          <h3
            className="cursor-pointer hover:underline"
            onClick={() => navigate(`/book/${alert.book.id}`)}
            style={{ fontFamily: FONT, fontSize: 18, fontWeight: 800, color: C.onSurface, lineHeight: 1.15, letterSpacing: "-0.02em" }}>
            {alert.book.title}
          </h3>
          <p className="text-[13px] mt-1" style={{ fontFamily: FONT, color: C.onSurfaceVariant }}>{alert.book.author}</p>
          <div className="flex items-center gap-2 flex-wrap mt-2">
            <span className="text-[10px] font-bold px-1.5 py-0.5 uppercase"
              style={{ background: C.boneWhite, color: C.onSurface, fontFamily: FONT, border: "1px solid #000" }}>
              {alert.book.offerCount} nơi bán
            </span>
            <span className="text-[10px] px-1.5 py-0.5 uppercase font-bold"
              style={{ fontFamily: FONT, background: C.surfaceVariant, color: C.onSurfaceVariant, border: `1px solid ${C.outlineVariant}` }}>
              {alert.alertType === "target" ? "Giá mục tiêu" : "Giá thấp nhất mới"}
            </span>
            <span className="text-[10px]" style={{ fontFamily: FONT, color: C.outline }}>Tạo: {alert.createdAt}</span>
          </div>
        </div>

        {/* Price blocks */}
        <div className="flex gap-3 flex-wrap">
          {alert.alertType === "target" && alert.targetPrice !== null && (
            <div className="px-4 py-3 flex flex-col gap-1" style={{ background: C.primary, border: border2, boxShadow: shadow4 }}>
              <span className="text-[9px] font-bold uppercase tracking-widest" style={{ fontFamily: FONT, color: "rgba(255,255,255,0.6)" }}>Giá Mục Tiêu</span>
              <span style={{ fontFamily: FONT, fontSize: 22, fontWeight: 800, color: C.white, lineHeight: 1 }}>{fmt(alert.targetPrice)}</span>
            </div>
          )}
          {alert.alertType === "new_lowest" && (
            <div className="px-4 py-3 flex flex-col gap-1" style={{ background: C.primary, border: border2, boxShadow: shadow4 }}>
              <span className="text-[9px] font-bold uppercase tracking-widest" style={{ fontFamily: FONT, color: "rgba(255,255,255,0.6)" }}>Loại Cảnh Báo</span>
              <span style={{ fontFamily: FONT, fontSize: 14, fontWeight: 800, color: C.white, lineHeight: 1.2 }}>Giá thấp nhất mới</span>
            </div>
          )}
          {alert.book.currentPrice !== null && (
            <div className="px-4 py-3 flex flex-col gap-1" style={{ background: C.boneWhite, border: border2, boxShadow: shadow4 }}>
              <span className="text-[9px] font-bold uppercase tracking-widest" style={{ fontFamily: FONT, color: C.outline }}>Giá Hiện Tại</span>
              <span style={{ fontFamily: FONT, fontSize: 22, fontWeight: 800, color: reached ? C.primary : C.onSurface, lineHeight: 1 }}>
                {fmt(alert.book.currentPrice)}
              </span>
            </div>
          )}
          {alert.alertType === "target" && alert.targetPrice !== null && alert.book.currentPrice !== null && !reached && (
            <div className="px-4 py-3 flex flex-col gap-1" style={{ background: C.surfaceContainer, border: `1px solid ${C.outlineVariant}` }}>
              <span className="text-[9px] font-bold uppercase tracking-widest" style={{ fontFamily: FONT, color: C.outline }}>Còn lại</span>
              <span style={{ fontFamily: FONT, fontSize: 18, fontWeight: 800, color: C.secondary, lineHeight: 1 }}>
                -{fmt(alert.book.currentPrice - alert.targetPrice)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Action rail — border-top on mobile, border-left on desktop ── */}
      <div className="flex flex-row md:flex-col items-center justify-start gap-2 p-3 md:p-4 border-t-2 md:border-t-0 md:border-l-2 border-black"
        style={{ background: C.surfaceLow, minWidth: 0 }}>
        <button
          title="Sửa"
          className="flex flex-col items-center gap-1 flex-1 md:flex-none px-3 py-2.5"
          style={{ border: border2, background: C.white, boxShadow: shadow4 }}
          onMouseEnter={e => (e.currentTarget.style.background = C.boneWhite)}
          onMouseLeave={e => (e.currentTarget.style.background = C.white)}>
          <Pencil size={14} style={{ color: C.onSurface }} />
          <span className="text-[9px] font-bold uppercase tracking-wide" style={{ fontFamily: FONT, color: C.onSurface }}>Sửa</span>
        </button>
        <button
          title={isPaused ? "Tiếp tục" : "Tạm dừng"}
          onClick={() => onToggle(alert.id)}
          className="flex flex-col items-center gap-1 flex-1 md:flex-none px-3 py-2.5"
          style={{ border: border2, background: C.white, boxShadow: shadow4 }}
          onMouseEnter={e => (e.currentTarget.style.background = C.boneWhite)}
          onMouseLeave={e => (e.currentTarget.style.background = C.white)}>
          {isPaused ? <Play size={14} style={{ color: C.primary }} /> : <Pause size={14} style={{ color: C.onSurface }} />}
          <span className="text-[9px] font-bold uppercase tracking-wide"
            style={{ fontFamily: FONT, color: isPaused ? C.primary : C.onSurface }}>
            {isPaused ? "Tiếp" : "Dừng"}
          </span>
        </button>
        <button
          title="Xóa"
          onClick={() => onDelete(alert.id)}
          className="flex flex-col items-center gap-1 flex-1 md:flex-none px-3 py-2.5"
          style={{ border: border2, background: C.white, boxShadow: shadow4, color: C.onSurface }}
          onMouseEnter={e => { e.currentTarget.style.background = "#fff0f0"; e.currentTarget.style.color = C.secondary; }}
          onMouseLeave={e => { e.currentTarget.style.background = C.white; e.currentTarget.style.color = C.onSurface; }}>
          <Trash2 size={14} style={{ color: "currentColor" }} />
          <span className="text-[9px] font-bold uppercase tracking-wide" style={{ fontFamily: FONT }}>Xóa</span>
        </button>
      </div>
    </div>
  );
}

// ─── Historical Row ───────────────────────────────────────────────────────────

function HistoricalRow({ alert }: { alert: HistoricalAlert }) {
  const [hovered, setHovered] = useState(false);
  const cfg = historyStatusCfg[alert.status];
  const { Icon } = cfg;

  return (
    <div
      className="flex items-center gap-4 p-3 overflow-hidden"
      style={{
        border: `2px dashed ${C.outline}`,
        background: C.surfaceContainer,
        opacity: hovered ? 1 : 0.6,
        filter: "grayscale(30%)",
        transition: "opacity 150ms",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}>
      <div className="shrink-0 overflow-hidden"
        style={{ width: 44, height: 60, border: `1px solid ${C.outlineVariant}`, background: C.surfaceContainer }}>
        <img src={alert.book.coverUrl} alt={alert.book.title} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-[13px] truncate" style={{ fontFamily: FONT, color: C.onSurface }}>{alert.book.title}</p>
        <p className="text-[11px] mt-0.5" style={{ fontFamily: FONT, color: C.onSurfaceVariant }}>
          {alert.alertType === "target" && alert.targetPrice ? `Mục tiêu: ${fmt(alert.targetPrice)}` : "Giá thấp nhất mới"}
          {" · "}{alert.note}
        </p>
      </div>
      <div className="shrink-0 flex flex-col items-end gap-1.5">
        <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase"
          style={{
            background: alert.status === "completed" ? C.primaryFixed : C.surfaceVariant,
            color: alert.status === "completed" ? C.primary : C.outline,
            border: `1px solid ${C.outlineVariant}`, fontFamily: FONT,
          }}>
          <Icon size={10} />{cfg.label}
        </span>
        <span className="text-[10px]" style={{ fontFamily: FONT, color: C.outline }}>{alert.closedAt}</span>
      </div>
    </div>
  );
}

// ─── AlertPage ────────────────────────────────────────────────────────────────

export default function AlertPage() {
  const [alerts, setAlerts] = useState(MOCK_ACTIVE);

  const togglePause = (id: number) =>
    setAlerts(prev => prev.map(a =>
      a.id === id ? { ...a, status: (a.status === "active" ? "paused" : "active") as AlertStatus } : a
    ));
  const deleteAlert = (id: number) => setAlerts(prev => prev.filter(a => a.id !== id));

  const active = alerts.filter(a => a.status === "active");
  const paused = alerts.filter(a => a.status === "paused");

  return (
    <main className="max-w-[1200px] mx-auto px-4 sm:px-8 py-10 flex flex-col gap-12">
      <PageHeader activeCount={active.length} />

      {/* Active */}
      <section className="flex flex-col gap-5">
        <div className="pb-3" style={{ borderBottom: `4px solid ${C.black}` }}>
          <h2 className="font-extrabold uppercase text-[20px] tracking-tight"
            style={{ fontFamily: FONT, color: C.onSurface, letterSpacing: "-0.01em" }}>
            Đang Theo Dõi
            <span className="ml-3 text-[13px] font-bold px-2 py-0.5 align-middle"
              style={{ background: C.primary, color: C.white, border: border2 }}>
              {active.length}
            </span>
          </h2>
        </div>
        {active.length > 0 ? (
          <div className="flex flex-col gap-5">
            {active.map(a => <AlertCard key={a.id} alert={a} onToggle={togglePause} onDelete={deleteAlert} />)}
          </div>
        ) : (
          <div className="py-14 flex flex-col items-center gap-3" style={{ border: border2, background: C.white }}>
            <BellRing size={32} style={{ color: C.outlineVariant }} />
            <p className="font-bold text-[14px]" style={{ fontFamily: FONT, color: C.onSurfaceVariant }}>Chưa có cảnh báo nào đang hoạt động</p>
          </div>
        )}
      </section>

      {/* Paused */}
      {paused.length > 0 && (
        <section className="flex flex-col gap-4">
          <div className="pb-3" style={{ borderBottom: `2px solid ${C.outlineVariant}` }}>
            <h2 className="font-extrabold uppercase text-[16px] tracking-tight"
              style={{ fontFamily: FONT, color: C.onSurfaceVariant, letterSpacing: "-0.01em" }}>
              Tạm Dừng
              <span className="ml-2 text-[12px] font-bold px-2 py-0.5 align-middle"
                style={{ background: C.boneWhite, color: C.onSurface, border: border2 }}>
                {paused.length}
              </span>
            </h2>
          </div>
          <div className="flex flex-col gap-5">
            {paused.map(a => <AlertCard key={a.id} alert={a} onToggle={togglePause} onDelete={deleteAlert} />)}
          </div>
        </section>
      )}

      {/* Historical */}
      <section className="flex flex-col gap-4">
        <div className="pb-3" style={{ borderBottom: `2px solid ${C.outlineVariant}` }}>
          <h2 className="font-extrabold uppercase text-[16px] tracking-tight"
            style={{ fontFamily: FONT, color: C.outline, letterSpacing: "-0.01em" }}>
            Đã Tắt
          </h2>
        </div>
        <div className="flex flex-col gap-2">
          {MOCK_HISTORY.map(a => <HistoricalRow key={a.id} alert={a} />)}
        </div>
      </section>
    </main>
  );
}
