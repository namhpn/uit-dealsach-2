import { useCallback, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Flame, Heart, Star, TrendingDown } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { BookCardDto, coverFallback, FilterOption, formatVnd, PRICE_DISCLAIMER } from "./api";

export interface DealBanner {
  id: number;
  headline: string;
  sub: string;
  cta: string;
  bg: string;
  textColor: string;
  imageUrl: string;
  badgeLabel?: string;
}

export const C = {
  primary: "#003527",
  primaryContainer: "#064e3b",
  onPrimary: "#ffffff",
  primaryFixed: "#b0f0d6",
  surface: "#fcf9f8",
  surfaceLow: "#f6f3f2",
  surfaceContainer: "#f0eded",
  surfaceVariant: "#e5e2e1",
  surfaceHigh: "#eae7e7",
  onSurface: "#1b1c1c",
  onSurfaceVariant: "#404944",
  outline: "#707974",
  outlineVariant: "#bfc9c3",
  secondary: "#ba1a1a",
  white: "#ffffff",
  black: "#000000",
  earthGray: "#7C95A8",
  boneWhite: "#ECE9E2",
} as const;

export const FONT = "'Be Vietnam Pro', sans-serif";

export const shadow4 = "4px 4px 0 #000000";
export const shadow8 = "8px 8px 0 #000000";
export const border2 = `2px solid ${C.black}`;
export const border3 = `3px solid ${C.black}`;
export const border4 = `4px solid ${C.black}`;

export const fmt = (n: number) => `${n.toLocaleString("vi-VN")} đ`;

export const dealBanners: DealBanner[] = [
  {
    id: 1,
    headline: "So sánh giá sách kỹ năng sống",
    sub: "Xem giá tham khảo từ nhiều nhà bán bên ngoài, rồi rời DealSach qua liên kết mua đã kiểm tra.",
    cta: "Tìm ưu đãi",
    bg: C.primary,
    textColor: C.white,
    imageUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=480&h=320&fit=crop&auto=format",
    badgeLabel: "SO SÁNH GIÁ",
  },
  {
    id: 2,
    headline: "Theo dõi sách giảm giá gần đây",
    sub: "DealSach xếp hạng theo mức giảm VND trong 7 ngày gần đây từ dữ liệu quan sát đủ điều kiện.",
    cta: "Xem giảm giá",
    bg: C.secondary,
    textColor: C.white,
    imageUrl: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=480&h=320&fit=crop&auto=format",
    badgeLabel: "GIẢM GIÁ",
  },
  {
    id: 3,
    headline: "Chọn sách, đến nơi bán bên ngoài",
    sub: "DealSach chỉ giúp bạn so sánh giá tham khảo và mở liên kết nhà bán bên ngoài khi liên kết hợp lệ.",
    cta: "Cách hoạt động",
    bg: C.earthGray,
    textColor: C.black,
    imageUrl: "https://images.unsplash.com/photo-1576872381149-7847515ce5d8?w=480&h=320&fit=crop&auto=format",
    badgeLabel: "MINH BẠCH",
  },
  {
    id: 4,
    headline: "Ưu đãi được nhấn nhiều trong tuần",
    sub: "Các sách phổ biến được xếp theo lượt chuyển hướng Affiliate Redirect thành công gần đây.",
    cta: "Xem phổ biến",
    bg: C.primaryContainer,
    textColor: C.white,
    imageUrl: "https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=480&h=320&fit=crop&auto=format",
    badgeLabel: "PHỔ BIẾN",
  },
];

export function LoadingState({ label = "Đang tải dữ liệu..." }: { label?: string }) {
  return (
    <div className="p-6 text-sm font-bold" style={{ border: border2, background: C.white, boxShadow: shadow4, fontFamily: FONT }}>
      {label}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="p-6 text-sm leading-relaxed" style={{ border: border2, background: C.boneWhite, fontFamily: FONT }}>
      <strong>Chưa có dữ liệu phù hợp.</strong>
      <p className="mt-1" style={{ color: C.onSurfaceVariant }}>{message}</p>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="p-6 text-sm leading-relaxed" style={{ border: border2, background: "#fff1f1", color: C.secondary, fontFamily: FONT }}>
      <strong>Không thể tải dữ liệu.</strong>
      <p className="mt-1">{message}</p>
    </div>
  );
}

export function PriceDisclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <p className={compact ? "text-[10px] leading-snug" : "text-[12px] leading-relaxed"} style={{ color: C.onSurfaceVariant, fontFamily: FONT }}>
      {PRICE_DISCLAIMER}
    </p>
  );
}

export function CoverImage({ title, src }: { title: string; src: string | null }) {
  const [failed, setFailed] = useState(false);
  const imageSrc = src && src.startsWith("/") && typeof window !== "undefined" && window.location.port === "5173" ? `http://localhost${src}` : src;

  if (!imageSrc || failed) {
    return (
      <div className="flex h-full w-full items-center justify-center text-3xl font-extrabold" style={{ background: C.surfaceContainer, color: C.primary, fontFamily: FONT }}>
        {coverFallback(title)}
      </div>
    );
  }

  return <img src={imageSrc} alt={`Bìa sách ${title}`} className="h-full w-full object-cover" onError={() => setFailed(true)} />;
}

export function NbButton({
  children,
  onClick,
  variant = "primary",
  className = "",
  style: extra = {},
  small = false,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  style?: React.CSSProperties;
  small?: boolean;
  type?: "button" | "submit";
}) {
  const [pressed, setPressed] = useState(false);
  const bg = variant === "primary" ? C.primary : variant === "secondary" ? C.boneWhite : C.white;
  const color = variant === "primary" ? C.white : C.black;

  return (
    <button
      type={type}
      onClick={onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      className={className}
      style={{
        background: bg,
        color,
        fontFamily: FONT,
        fontWeight: 700,
        fontSize: small ? 12 : 14,
        border: border2,
        padding: small ? "4px 12px" : "8px 20px",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        boxShadow: pressed ? "none" : shadow4,
        transform: pressed ? "translate(4px,4px)" : "none",
        transition: "box-shadow 80ms, transform 80ms",
        ...extra,
      }}
    >
      {children}
    </button>
  );
}

export function CategoryChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const on = active || hovered;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="shrink-0 whitespace-nowrap px-3 py-1 text-[10px] font-bold uppercase"
      style={{
        fontFamily: FONT,
        background: on ? C.primary : C.boneWhite,
        color: on ? C.white : C.onSurface,
        border: border2,
        boxShadow: on ? "none" : shadow4,
        transform: on ? "translate(4px,4px)" : "none",
        transition: "background 80ms, color 80ms, box-shadow 80ms, transform 80ms",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

function BookPrice({ book, compact = false }: { book: BookCardDto; compact?: boolean }) {
  if (book.lowest_eligible_price !== null) {
    return (
      <span className="font-extrabold leading-none" style={{ fontSize: compact ? 18 : 22, color: C.secondary, fontFamily: FONT }}>
        {formatVnd(book.lowest_eligible_price)}
      </span>
    );
  }

  return (
    <span className="self-start px-2 py-1 text-[10px] font-bold" style={{ background: C.surfaceVariant, border: `1px solid ${C.black}`, color: C.onSurfaceVariant, fontFamily: FONT }}>
      {book.status.label}
    </span>
  );
}

export function ApiBookCard({ book }: { book: BookCardDto }) {
  const [pressed, setPressed] = useState(false);

  return (
    <Link
      to={`/book/${book.id}`}
      className="flex h-full flex-col overflow-hidden focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300"
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{ background: C.white, border: border2, boxShadow: pressed ? "none" : shadow4, transform: pressed ? "translate(4px,4px)" : "none", transition: "box-shadow 80ms, transform 80ms" }}
    >
      <div className="relative shrink-0 overflow-hidden" style={{ background: C.surfaceContainer, aspectRatio: "2/3", maxHeight: 220, borderBottom: border2 }}>
        <CoverImage title={book.title} src={book.cover_image} />
        <button
          type="button"
          onClick={(event) => event.preventDefault()}
          aria-label="Cần đăng nhập để lưu sách"
          title="Cần đăng nhập để lưu sách"
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center"
          style={{ background: C.white, border: border2 }}
        >
          <Heart size={13} style={{ color: C.black }} />
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="text-[10px] font-bold uppercase leading-none" style={{ color: C.outline, fontFamily: FONT }}>{book.category}</p>
        <h3 className="mt-0.5 line-clamp-2 text-[13px] font-bold leading-snug" style={{ color: C.onSurface, fontFamily: FONT }}>{book.title}</h3>
        <p className="line-clamp-1 text-[11px]" style={{ color: C.onSurfaceVariant, fontFamily: FONT }}>{book.author}</p>
        <div className="mt-auto flex flex-col gap-1 pt-3">
          <BookPrice book={book} compact />
          <span className="mt-1.5 self-start px-1.5 py-0.5 text-[10px] font-bold uppercase" style={{ background: C.boneWhite, color: C.onSurface, fontFamily: FONT, border: "1px solid #000" }}>
            {book.offer_count} ưu đãi
          </span>
          <PriceDisclaimer compact />
        </div>
      </div>
    </Link>
  );
}

export function ApiBookGrid({ books }: { books: BookCardDto[] }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {books.map((book) => <ApiBookCard key={book.id} book={book} />)}
    </div>
  );
}

export function ApiBookCarousel({ books }: { books: BookCardDto[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const scroll = useCallback((dir: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector("[data-card]") as HTMLElement | null;
    const cardW = card ? card.offsetWidth + 20 : 192;
    el.scrollBy({ left: dir * Math.round(el.offsetWidth / cardW) * cardW, behavior: "smooth" });
  }, []);

  return (
    <div className="relative group/carousel" style={{ paddingBottom: 8 }}>
      <button onClick={() => scroll(-1)} className="absolute left-0 top-1/2 z-10 flex h-8 w-8 -translate-x-4 -translate-y-1/2 items-center justify-center opacity-0 transition-opacity group-hover/carousel:opacity-100" style={{ background: C.white, border: border2, boxShadow: shadow4, color: C.black }} aria-label="Trước"><ChevronLeft size={17} /></button>
      <div ref={trackRef} className="flex overflow-x-auto" style={{ scrollbarWidth: "none", scrollSnapType: "x mandatory", gap: 20, paddingBottom: 12, paddingRight: 8 }}>
        {books.map((book) => (
          <div key={book.id} data-card className="shrink-0" style={{ scrollSnapAlign: "start", width: "calc((100% - 80px) / 4)", minWidth: 152, maxWidth: 210 }}>
            <ApiBookCard book={book} />
          </div>
        ))}
      </div>
      <button onClick={() => scroll(1)} className="absolute right-0 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 translate-x-4 items-center justify-center opacity-0 transition-opacity group-hover/carousel:opacity-100" style={{ background: C.white, border: border2, boxShadow: shadow4, color: C.black }} aria-label="Tiếp"><ChevronRight size={17} /></button>
    </div>
  );
}

export function ApiDealBookCard({ book, showDrop = false, showDeal = false, compact = false }: { book: BookCardDto; showDrop?: boolean; showDeal?: boolean; compact?: boolean }) {
  const navigate = useNavigate();
  const [pressed, setPressed] = useState(false);
  const dropRotate = book.id % 2 === 0 ? "rotate(2deg)" : "rotate(-3deg)";
  const cardWidth = compact ? 200 : 280;
  const coverH = compact ? 220 : 320;

  return (
    <div
      className="flex shrink-0 cursor-pointer flex-col overflow-hidden"
      onClick={() => navigate(`/book/${book.id}`)}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{ width: cardWidth, background: C.white, border: border2, boxShadow: pressed ? "none" : shadow4, transform: pressed ? "translate(4px,4px)" : "none", transition: "box-shadow 80ms, transform 80ms" }}
    >
      <div className="relative" style={{ height: coverH, borderBottom: border2, background: C.surfaceContainer, overflow: "hidden" }}>
        <CoverImage title={book.title} src={book.cover_image} />
        {showDrop && book.price_drop && (
          <div className="absolute left-4 top-4 z-10 flex items-center gap-1 px-3 py-1" style={{ background: C.secondary, color: C.white, fontFamily: FONT, fontSize: 16, fontWeight: 800, lineHeight: 1.1, border: border2, boxShadow: shadow4, transform: dropRotate }}>
            <TrendingDown size={14} />-{formatVnd(book.price_drop.amount)}
          </div>
        )}
        {showDeal && book.popular_clicked_deal && (
          <div className="absolute left-4 top-4 z-10 flex items-center gap-1 px-3 py-1" style={{ background: C.secondary, color: C.white, fontFamily: FONT, fontSize: 16, fontWeight: 800, lineHeight: 1.1, border: border2, boxShadow: shadow4, transform: dropRotate }}>
            <Flame size={14} />{book.popular_clicked_deal.redirect_count_7d.toLocaleString("vi-VN")}
          </div>
        )}
      </div>
      <div className={`flex flex-1 flex-col gap-1 ${compact ? "p-3" : "p-5"}`}>
        <p className="text-[10px] font-bold uppercase leading-none" style={{ color: C.outline, fontFamily: FONT }}>{book.category}</p>
        <h3 className="mt-0.5 line-clamp-2 font-bold leading-snug" style={{ fontFamily: FONT, fontSize: compact ? 13 : 14, color: C.onSurface }}>{book.title}</h3>
        <p className="line-clamp-1" style={{ fontSize: compact ? 11 : 12, color: C.onSurfaceVariant, fontFamily: FONT }}>{book.author}</p>
        <div className="mt-auto flex flex-col gap-1 pt-3">
          <BookPrice book={book} compact={compact} />
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <span className="self-start px-1.5 py-0.5 text-[10px] font-bold uppercase" style={{ background: C.boneWhite, color: C.onSurface, fontFamily: FONT, border: "1px solid #000" }}>{book.offer_count} ưu đãi</span>
            {showDeal && book.popular_clicked_deal?.top_retailer && (
              <span className="self-start px-1.5 py-0.5 text-[10px] font-bold uppercase" style={{ background: C.primaryFixed, color: C.primary, fontFamily: FONT, border: "1px solid #000" }}>{book.popular_clicked_deal.top_retailer.name}</span>
            )}
          </div>
        </div>
        <button className={`w-full font-bold uppercase text-[12px] ${compact ? "mt-3 py-2" : "mt-4 py-3"}`} style={{ background: C.primary, color: C.white, fontFamily: FONT, border: border2 }}>
          Xem chi tiết
        </button>
      </div>
    </div>
  );
}

export function ApiDealSection({ title, icon, books, empty, showDrop = false, showDeal = false }: { title: string; icon: React.ReactNode; books: BookCardDto[]; empty: string | null; showDrop?: boolean; showDeal?: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const scroll = useCallback((dir: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * (280 + 24), behavior: "smooth" });
  }, []);

  return (
    <section>
      <div className="flex items-center justify-between gap-4 px-0 py-5" style={{ borderBottom: `3px solid ${C.black}` }}>
        <div className="flex items-center gap-3">
          <span style={{ color: C.primary }}>{icon}</span>
          <h2 className="font-extrabold uppercase" style={{ fontFamily: FONT, fontSize: "clamp(18px,2vw,26px)", color: C.onSurface }}>{title}</h2>
        </div>
        <Link to="/search" className="hidden text-[12px] font-bold uppercase sm:inline-flex" style={{ color: C.primary, fontFamily: FONT }}>Xem thêm</Link>
      </div>
      {books.length > 0 ? (
        <div className="relative group/deal">
          <button onClick={() => scroll(-1)} className="absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center opacity-0 transition-opacity group-hover/deal:opacity-100" style={{ background: C.white, border: border2, boxShadow: shadow4, color: C.black }} aria-label="Trước"><ChevronLeft size={18} /></button>
          <div ref={trackRef} className="flex overflow-x-auto" style={{ scrollbarWidth: "none", scrollSnapType: "x mandatory", gap: 24, padding: "28px 0 36px" }}>
            {books.map((book) => (
              <div key={book.id} style={{ scrollSnapAlign: "start", flexShrink: 0 }}>
                <ApiDealBookCard book={book} showDrop={showDrop} showDeal={showDeal} />
              </div>
            ))}
          </div>
          <button onClick={() => scroll(1)} className="absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center opacity-0 transition-opacity group-hover/deal:opacity-100" style={{ background: C.white, border: border2, boxShadow: shadow4, color: C.black }} aria-label="Tiếp"><ChevronRight size={18} /></button>
        </div>
      ) : (
        <div className="pt-6"><EmptyState message={empty ?? "Chưa có sách phù hợp để hiển thị."} /></div>
      )}
    </section>
  );
}

export function ApiFeaturedCategoryShelves({
  title,
  books,
  categories,
  empty,
}: {
  title: string;
  books: BookCardDto[];
  categories: Required<Pick<FilterOption, "id" | "name" | "slug">>[];
  empty: string | null;
}) {
  const grouped = new Map<string, BookCardDto[]>();
  books.forEach((book) => {
    const current = grouped.get(book.category_slug) ?? [];
    current.push(book);
    grouped.set(book.category_slug, current);
  });
  const shelves = categories
    .map((category) => ({
      ...category,
      books: grouped.get(category.slug) ?? [],
    }))
    .filter((category) => category.books.length > 0);

  return (
    <section style={{ border: border2, boxShadow: shadow8, background: C.white }}>
      <div className="flex items-center justify-between gap-4 px-4 py-3" style={{ borderBottom: border2, background: C.primary }}>
        <div className="flex items-center gap-2">
          <Star size={17} style={{ color: C.white }} />
          <h2 className="text-[15px] font-extrabold uppercase" style={{ color: C.white, fontFamily: FONT }}>{title}</h2>
        </div>
        <Link to="/search" className="text-[12px] font-bold uppercase" style={{ color: C.primaryFixed, fontFamily: FONT }}>Xem tất cả</Link>
      </div>
      <div className="flex flex-col md:flex-row">
        <div className="w-full p-5 md:w-[172px] md:shrink-0" style={{ borderRight: border2, background: C.boneWhite }}>
          <p className="max-w-[260px] text-[12px] font-bold uppercase leading-relaxed md:max-w-none" style={{ color: C.primary, fontFamily: FONT, overflowWrap: "break-word" }}>
            Sách nổi bật được quản trị chọn, nhóm theo danh mục từ API.
          </p>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-8 p-6">
          {shelves.length > 0 ? (
            shelves.map((category) => (
              <div key={category.slug} className="min-w-0">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-[13px] font-extrabold uppercase" style={{ color: C.onSurface, fontFamily: FONT }}>{category.name}</h3>
                  <Link to={`/search?category=${encodeURIComponent(category.slug)}`} className="text-[11px] font-bold uppercase" style={{ color: C.primary, fontFamily: FONT }}>
                    Xem danh mục
                  </Link>
                </div>
                <ApiBookCarousel books={category.books} />
              </div>
            ))
          ) : (
            <EmptyState message={empty ?? "Chưa có sách nổi bật để hiển thị."} />
          )}
        </div>
      </div>
    </section>
  );
}

export function HowItWorks() {
  const steps = [
    { step: "01", title: "Tìm sách", desc: "Tìm kiếm theo tên, tác giả hoặc ISBN để xem các ưu đãi đang được theo dõi." },
    { step: "02", title: "So sánh giá", desc: "Đối chiếu giá tham khảo đủ điều kiện từ nhiều nhà bán bên ngoài." },
    { step: "03", title: "Đến nơi bán", desc: "Nhấn mua để DealSach kiểm tra liên kết và chuyển bạn sang nhà bán phù hợp." },
  ];

  return (
    <section style={{ border: border2, boxShadow: shadow8, background: C.white }}>
      <div className="px-5 py-3" style={{ borderBottom: border2, background: C.boneWhite }}>
        <h2 className="text-center text-[15px] font-extrabold uppercase" style={{ color: C.onSurface, fontFamily: FONT }}>DealSach hoạt động như thế nào?</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3">
        {steps.map((item, idx) => (
          <div key={item.step} className="flex flex-col gap-4 px-8 py-8" style={{ borderRight: idx < 2 ? border2 : "none" }}>
            <span className="text-[40px] font-extrabold leading-none" style={{ color: C.primary, fontFamily: FONT }}>{item.step}</span>
            <h3 className="text-[15px] font-extrabold uppercase" style={{ color: C.onSurface, fontFamily: FONT }}>{item.title}</h3>
            <p className="text-[13px] leading-relaxed" style={{ color: C.onSurfaceVariant, fontFamily: FONT }}>{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
