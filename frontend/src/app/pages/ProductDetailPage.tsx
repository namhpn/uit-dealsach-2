import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router";
import { Bell, ChevronLeft, ChevronRight, ExternalLink, Heart, Info, TrendingDown } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { addWishlistBook, apiErrorMessage, BookCardDto, BookDetailResponse, createPriceAlert, fetchBookDetail, fetchDiscovery, fetchWishlistStatus, formatDate, formatVnd, OfferDto, removeWishlistBook } from "../api";
import { useAuth } from "../auth";
import {
  ApiDealBookCard,
  C,
  CoverImage,
  EmptyState,
  ErrorState,
  FONT,
  LoadingState,
  PriceDisclaimer,
  border2,
  border4,
  shadow4,
  shadow8,
} from "../shared";

function CoverCarousel({ title, category, image }: { title: string; category: string; image: string | null }) {
  return (
    <div className="relative flex select-none flex-col gap-3">
      <div className="relative overflow-hidden" style={{ border: border2 }}>
        <div style={{ height: 380 }}>
          <CoverImage title={title} src={image} />
        </div>
        <div className="absolute left-4 top-4 px-3 py-1 text-[11px] font-bold uppercase" style={{ background: C.primary, color: C.white, fontFamily: FONT, border: border2, boxShadow: shadow4 }}>
          {category}
        </div>
      </div>
      <div className="flex items-center justify-between px-1">
        <button disabled className="flex h-8 w-8 items-center justify-center opacity-50" style={{ border: border2, background: C.white, boxShadow: shadow4 }} aria-label="Trước">
          <ChevronLeft size={16} />
        </button>
        <div className="flex gap-2">
          <span style={{ width: 20, height: 8, background: C.primary, border: border2 }} />
        </div>
        <button disabled className="flex h-8 w-8 items-center justify-center opacity-50" style={{ border: border2, background: C.white, boxShadow: shadow4 }} aria-label="Tiếp">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

function HeroSection({
  data,
  wishlisted,
  wishlistError,
  onToggleWishlist,
}: {
  data: BookDetailResponse;
  wishlisted: boolean;
  wishlistError: string | null;
  onToggleWishlist: () => void;
}) {
  return (
    <section style={{ background: C.surfaceLow, border: border4, boxShadow: shadow8 }}>
      <div className="flex flex-col gap-10 p-8 md:p-12 lg:flex-row lg:gap-14">
        <div className="w-full shrink-0 lg:w-72">
          <CoverCarousel title={data.book.title} category={data.book.category} image={data.book.cover_image} />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <Link to="/search" className="text-[11px] font-bold uppercase" style={{ color: C.outline, fontFamily: FONT }}>
            Trang chủ / {data.book.category} / {data.book.title}
          </Link>
          <h1 style={{ fontFamily: FONT, fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 800, lineHeight: 1.05, color: C.black }}>
            {data.book.title}
          </h1>
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            <span className="text-[13px]" style={{ fontFamily: FONT, color: C.onSurfaceVariant }}>
              Tác giả: <strong style={{ color: C.onSurface }}>{data.book.author}</strong>
            </span>
            <span className="text-[13px]" style={{ fontFamily: FONT, color: C.onSurfaceVariant }}>
              NXB: <strong style={{ color: C.onSurface }}>{data.book.publisher}</strong>
            </span>
          </div>

          {data.book.description && (
            <blockquote className="py-1 pl-5" style={{ borderLeft: `5px solid ${C.primary}` }}>
              <p className="text-[14px] italic leading-relaxed" style={{ fontFamily: FONT, color: C.onSurfaceVariant }}>
                {data.book.description}
              </p>
            </blockquote>
          )}

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-col gap-1.5 p-4" style={{ background: C.primaryFixed, border: border4, boxShadow: shadow8 }}>
              <p className="text-[10px] font-bold uppercase" style={{ fontFamily: FONT, color: C.primary }}>
                Giá tốt nhất hiện tại
              </p>
              {data.summary.lowest_eligible_price !== null ? (
                <span style={{ fontFamily: FONT, fontSize: "clamp(28px,4vw,42px)", fontWeight: 800, color: C.primary, lineHeight: 1 }}>
                  {formatVnd(data.summary.lowest_eligible_price)}
                </span>
              ) : (
                <span className="text-[18px] font-extrabold" style={{ fontFamily: FONT, color: C.primary }}>
                  {data.summary.status.label}
                </span>
              )}
              <PriceDisclaimer compact />
            </div>

            <button
              className="flex flex-col items-center justify-center gap-1.5 px-5 py-4 text-[11px] font-bold uppercase"
              title={wishlisted ? "Bỏ khỏi danh sách yêu thích" : "Lưu vào danh sách yêu thích"}
              onClick={onToggleWishlist}
              style={{ border: border2, background: wishlisted ? C.primaryFixed : C.white, color: wishlisted ? C.primary : C.onSurface, fontFamily: FONT, boxShadow: shadow4, minWidth: 120, cursor: "pointer" }}
            >
              <Heart size={20} fill={wishlisted ? C.primary : "none"} />
              {wishlisted ? "Đã lưu" : "Lưu sách"}
            </button>
          </div>
          {wishlistError && (
            <p className="text-[12px] font-bold leading-relaxed" style={{ color: C.secondary, fontFamily: FONT }}>
              {wishlistError}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function OfferGroup({ title, description, offers, disclosure }: { title: string; description: string; offers: OfferDto[]; disclosure?: string }) {
  const purchasable = offers.filter((offer) => offer.buy_action);

  return (
    <section>
      <div className="mb-6 pb-4" style={{ borderBottom: `4px solid ${C.black}` }}>
        <h2 className="text-[22px] font-extrabold uppercase" style={{ fontFamily: FONT, color: C.onSurface }}>
          {title}
        </h2>
        <p className="mt-1 text-[13px]" style={{ fontFamily: FONT, color: C.onSurfaceVariant }}>
          {description}
        </p>
        {disclosure && purchasable.length > 0 && (
          <p className="mt-2 text-[12px] leading-relaxed" style={{ fontFamily: FONT, color: C.onSurfaceVariant }}>
            {disclosure}
          </p>
        )}
      </div>
      {offers.length > 0 ? (
        <div className="flex flex-col gap-2">
          {offers.map((offer, index) => <OfferRow key={offer.id} offer={offer} isCheapest={index === 0 && Boolean(offer.buy_action)} />)}
        </div>
      ) : (
        <EmptyState message="Chưa có ưu đãi trong nhóm này." />
      )}
    </section>
  );
}

function AlertCreationPanel({ data }: { data: BookDetailResponse }) {
  const auth = useAuth();
  const [targetPrice, setTargetPrice] = useState("");
  const [targetError, setTargetError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState<"target" | "lowest" | null>(null);

  async function createTargetAlert(event: FormEvent) {
    event.preventDefault();
    setTargetError(null);
    setSuccess(null);

    if (!auth.authenticated) {
      auth.openAuthDialog();
      return;
    }
    if (!/^[0-9]+$/.test(targetPrice) || Number(targetPrice) <= 0) {
      setTargetError("Giá mục tiêu phải là số nguyên VND lớn hơn 0.");
      return;
    }

    setBusy("target");
    try {
      await createPriceAlert({ book_id: data.book.id, alert_type: "target_price", target_price: Number(targetPrice) });
      setSuccess("Đã lưu cảnh báo giá mục tiêu. Nếu cảnh báo tương tự đã tồn tại, DealSach dùng lại cảnh báo hiện có.");
    } catch (err) {
      setTargetError(apiErrorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function createNewLowestAlert() {
    setTargetError(null);
    setSuccess(null);

    if (!auth.authenticated) {
      auth.openAuthDialog();
      return;
    }

    setBusy("lowest");
    try {
      await createPriceAlert({ book_id: data.book.id, alert_type: "new_lowest_price" });
      setSuccess("Đã lưu cảnh báo giá thấp mới. Nếu cảnh báo tương tự đã tồn tại, DealSach dùng lại cảnh báo hiện có.");
    } catch (err) {
      setTargetError(apiErrorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.1fr_0.9fr]" style={{ background: C.white, border: border2, boxShadow: shadow8 }}>
      <div className="p-5 md:p-6" style={{ borderRight: "0" }}>
        <div className="mb-4 flex items-center gap-3">
          <Bell size={22} style={{ color: C.primary }} />
          <div>
            <h2 className="text-[18px] font-extrabold uppercase" style={{ fontFamily: FONT }}>Tạo cảnh báo giá</h2>
            <p className="mt-1 text-[13px] leading-relaxed" style={{ color: C.onSurfaceVariant, fontFamily: FONT }}>
              DealSach gửi email khi điều kiện giá phù hợp trong các lần quan sát sau. Giá hiển thị vẫn là giá tham khảo gần đây.
            </p>
          </div>
        </div>

        <form onSubmit={createTargetAlert} className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <label className="flex min-w-0 flex-1 flex-col gap-1 text-[11px] font-extrabold uppercase" style={{ color: C.onSurfaceVariant, fontFamily: FONT }}>
            Giá mục tiêu VND
            <input
              value={targetPrice}
              onChange={(event) => setTargetPrice(event.target.value.replace(/\D/g, ""))}
              placeholder="Ví dụ: 90000"
              inputMode="numeric"
              className="px-3 py-2 text-sm normal-case outline-none"
              style={{ border: border2, color: C.onSurface, fontFamily: FONT }}
            />
          </label>
          <button
            type="submit"
            disabled={busy !== null}
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-[12px] font-extrabold uppercase disabled:opacity-50 sm:mt-[19px]"
            style={{ background: C.primary, color: C.white, border: border2, boxShadow: shadow4, fontFamily: FONT }}
          >
            <Bell size={13} />
            {busy === "target" ? "Đang tạo..." : "Nhắc giá mục tiêu"}
          </button>
        </form>
      </div>

      <div className="flex flex-col justify-between gap-4 p-5 md:p-6" style={{ background: C.boneWhite, borderTop: border2 }}>
        <div>
          <div className="mb-3 flex items-center gap-2">
            <TrendingDown size={20} style={{ color: C.secondary }} />
            <h3 className="text-[15px] font-extrabold uppercase" style={{ fontFamily: FONT }}>Giá thấp mới</h3>
          </div>
          <p className="text-[13px] leading-relaxed" style={{ color: C.onSurfaceVariant, fontFamily: FONT }}>
            Theo dõi từ giá đủ điều kiện hiện tại, hoặc chờ mốc đầu tiên nếu sách chưa có giá đủ điều kiện.
          </p>
        </div>
        <button
          type="button"
          disabled={busy !== null}
          onClick={createNewLowestAlert}
          className="flex items-center justify-center gap-2 px-4 py-2.5 text-[12px] font-extrabold uppercase disabled:opacity-50"
          style={{ background: C.white, color: C.onSurface, border: border2, boxShadow: shadow4, fontFamily: FONT }}
        >
          <TrendingDown size={13} />
          {busy === "lowest" ? "Đang tạo..." : "Nhắc khi có giá thấp mới"}
        </button>
      </div>
      {(targetError || success) && (
        <div className="p-4 lg:col-span-2" style={{ borderTop: border2, background: targetError ? "#fff1f1" : C.primaryFixed }}>
          <p role={targetError ? "alert" : "status"} className="text-[12px] font-bold leading-relaxed" style={{ color: targetError ? C.secondary : C.primary, fontFamily: FONT }}>
            {targetError ?? success}
          </p>
        </div>
      )}
    </section>
  );
}

function OfferRow({ offer, isCheapest }: { offer: OfferDto; isCheapest: boolean }) {
  const inactive = !offer.buy_action;
  const price = offer.latest_price ?? offer.last_available_price;

  return (
    <div
      className="flex flex-col gap-4 px-4 py-3 sm:flex-row sm:items-center"
      style={{
        background: isCheapest ? C.primaryFixed : inactive ? C.surfaceVariant : C.white,
        border: inactive ? `2px dashed ${C.outlineVariant}` : border2,
        borderLeft: isCheapest ? `8px solid ${C.primary}` : inactive ? `2px dashed ${C.outlineVariant}` : border2,
        boxShadow: isCheapest ? shadow4 : "none",
        opacity: inactive ? 0.72 : 1,
      }}
    >
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        <span className="text-[15px] font-extrabold" style={{ fontFamily: FONT, color: inactive ? C.outline : C.onSurface }}>
          {offer.retailer.name}
        </span>
        {isCheapest && (
          <span className="shrink-0 px-2 py-0.5 text-[10px] font-bold uppercase" style={{ background: C.primary, color: C.white, fontFamily: FONT, border: border2 }}>
            Rẻ nhất
          </span>
        )}
        <span className="shrink-0 px-2 py-0.5 text-[10px] font-bold uppercase" style={{ background: inactive ? C.surfaceHigh : C.boneWhite, color: inactive ? C.outline : C.onSurface, fontFamily: FONT, border: `1px solid ${inactive ? C.outlineVariant : C.black}` }}>
          {offer.status_label}
        </span>
        <span className="w-full text-[12px]" style={{ fontFamily: FONT, color: C.onSurfaceVariant }}>
          {offer.merchant.name} / {offer.title}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-4 sm:shrink-0">
        <div className="text-left sm:text-right">
          {price !== null ? (
            <p className="text-[20px] font-extrabold leading-none" style={{ fontFamily: FONT, color: isCheapest ? C.primary : inactive ? C.outline : C.onSurface }}>
              {formatVnd(price)}
            </p>
          ) : (
            <p className="text-[12px] italic" style={{ fontFamily: FONT, color: C.outline }}>Không có giá</p>
          )}
        </div>
        {offer.buy_action ? (
          <a
            href={offer.buy_action.url}
            className="flex items-center gap-2 px-4 py-2.5 text-[11px] font-bold uppercase"
            style={{ background: isCheapest ? C.primary : C.boneWhite, color: isCheapest ? C.white : C.onSurface, fontFamily: FONT, border: border2, boxShadow: shadow4 }}
          >
            <ExternalLink size={12} />
            {offer.buy_action.label}
          </a>
        ) : (
          <span className="px-4 py-2.5 text-[11px] font-bold uppercase" style={{ background: C.surfaceHigh, color: C.outline, fontFamily: FONT, border: `1px solid ${C.outlineVariant}` }}>
            Không có nút mua
          </span>
        )}
      </div>
    </div>
  );
}

function MarketPriceList({ data }: { data: BookDetailResponse }) {
  return (
    <div className="flex flex-col gap-10">
      <OfferGroup
        title="Bảng giá thị trường"
        description={`So sánh ${data.offers.purchasable.length} ưu đãi có thể đến nơi bán.`}
        offers={data.offers.purchasable}
        disclosure={data.summary.affiliate_disclosure}
      />
      <OfferGroup title="Tạm hết hàng" description="Các ưu đãi này chỉ hiển thị để tham khảo và không có nút mua." offers={data.offers.unavailable} />
      <OfferGroup title="Giá tham khảo cũ" description="Giá cũ không dùng cho giá tốt nhất hiện tại." offers={data.offers.stale_reference} />
      <OfferGroup title="Chưa có liên kết mua hợp lệ" description="DealSach không chuyển hướng khi thiếu liên kết nhà bán hợp lệ." offers={data.offers.missing_valid_seller_link} />
    </div>
  );
}

function TechnicalDetails({ data }: { data: BookDetailResponse }) {
  const chartData = data.price_history.map((point) => ({
    date: formatDate(point.date),
    price: point.lowest_price,
  }));

  const details = [
    { label: "Tác giả", value: data.book.author },
    { label: "Nhà xuất bản", value: data.book.publisher },
    { label: "Danh mục", value: data.book.category },
    { label: "ISBN", value: data.book.isbn ?? "Chưa cập nhật" },
    { label: "Số ưu đãi", value: `${data.summary.offer_count} ưu đãi` },
    { label: "Tình trạng", value: data.summary.status.label },
  ];

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <div style={{ border: border2, boxShadow: shadow8 }}>
        <div className="px-5 py-3" style={{ background: C.onSurface, borderBottom: border2 }}>
          <h3 className="text-[13px] font-extrabold uppercase" style={{ fontFamily: FONT, color: C.white }}>
            Chi tiết sách
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2" style={{ background: C.boneWhite }}>
          {details.map(({ label, value }, index) => (
            <div key={label} className="px-5 py-3" style={{ borderBottom: `1px solid ${C.outlineVariant}`, borderRight: index % 2 === 0 ? `1px solid ${C.outlineVariant}` : "none" }}>
              <p className="mb-0.5 text-[10px] font-bold uppercase" style={{ fontFamily: FONT, color: C.outline }}>{label}</p>
              <p className="text-[14px] font-bold" style={{ fontFamily: FONT, color: C.onSurface }}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ border: border2, boxShadow: shadow8 }}>
        <div className="px-5 py-3" style={{ background: C.onSurface, borderBottom: border2 }}>
          <h3 className="text-[13px] font-extrabold uppercase" style={{ fontFamily: FONT, color: C.white }}>
            Lịch sử giá
          </h3>
        </div>
        <div className="flex flex-col gap-4 p-5" style={{ background: C.white }}>
          {chartData.length > 0 ? (
            <div style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.primary} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={C.primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} />
                  <XAxis dataKey="date" tick={{ fontFamily: FONT, fontSize: 10, fill: C.outline }} />
                  <YAxis tick={{ fontFamily: FONT, fontSize: 10, fill: C.outline }} tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} />
                  <Tooltip contentStyle={{ fontFamily: FONT, fontSize: 12, border: border2, background: C.white, borderRadius: 0 }} formatter={(value) => [formatVnd(Number(value)), "Giá"]} />
                  <Area type="monotone" dataKey="price" stroke={C.primary} strokeWidth={2} fill="url(#priceGrad)" dot={{ fill: C.primary, stroke: C.black, strokeWidth: 2, r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState message="Chưa có lịch sử giá đủ điều kiện để hiển thị." />
          )}
          <div className="pt-3" style={{ borderTop: border2 }}>
            <p className="mb-1 text-[12px] font-bold uppercase" style={{ fontFamily: FONT, color: C.outline }}>
              Nhắc giá
            </p>
            <p className="text-[12px] leading-relaxed" style={{ fontFamily: FONT, color: C.onSurfaceVariant }}>
              Tính năng nhắc giá cần tài khoản đã xác thực. Giao diện này chỉ hiển thị lời nhắc đăng nhập trong phạm vi hiện tại.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function RelatedBooks({ books }: { books: BookCardDto[] }) {
  if (books.length === 0) return null;

  return (
    <section>
      <div className="mb-6 pb-4" style={{ borderBottom: `4px solid ${C.black}` }}>
        <h2 className="text-[22px] font-extrabold uppercase" style={{ fontFamily: FONT, color: C.onSurface }}>
          Sách liên quan
        </h2>
      </div>
      <div className="flex flex-wrap gap-5">
        {books.map((book) => <ApiDealBookCard key={book.id} book={book} compact />)}
      </div>
    </section>
  );
}

function DisclaimerBlock({ data }: { data: BookDetailResponse }) {
  return (
    <div className="flex gap-5 p-6 md:p-8" style={{ background: C.primaryFixed, border: border4, boxShadow: shadow8 }}>
      <div className="mt-1 shrink-0">
        <Info size={28} style={{ color: C.primary }} strokeWidth={2.5} />
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-[12px] font-extrabold uppercase" style={{ fontFamily: FONT, color: C.primary }}>
          Lưu ý về giá & liên kết
        </p>
        <p className="text-[14px] leading-relaxed" style={{ fontFamily: FONT, color: C.onSurface }}>
          DealSach không bán sách trực tiếp. Khi nhấn nút mua, bạn sẽ được chuyển đến trang của nhà bán bên ngoài nếu liên kết hợp lệ.
        </p>
        <p className="text-[13px] leading-relaxed" style={{ fontFamily: FONT, color: C.onSurfaceVariant }}>
          {data.summary.affiliate_disclosure}
        </p>
        <PriceDisclaimer />
      </div>
    </div>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const auth = useAuth();
  const [data, setData] = useState<BookDetailResponse | null>(null);
  const [related, setRelated] = useState<BookCardDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistError, setWishlistError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    if (!id) return undefined;

    Promise.all([fetchBookDetail(id), fetchDiscovery()])
      .then(([detail, discovery]) => {
        if (!alive) return;
        setData(detail);
        const candidates = [
          ...discovery.featured_books.items,
          ...discovery.recent_price_drops.items,
          ...discovery.popular_clicked_deals.items,
        ];
        const unique = new Map<number, BookCardDto>();
        candidates.forEach((book) => {
          if (book.id !== detail.book.id) unique.set(book.id, book);
        });
        setRelated(Array.from(unique.values()).slice(0, 4));
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
  }, [id]);

  useEffect(() => {
    if (!id || !auth.authenticated) {
      setWishlisted(false);
      return undefined;
    }

    let alive = true;
    fetchWishlistStatus(Number(id))
      .then((status) => {
        if (alive) setWishlisted(status.wishlisted);
      })
      .catch(() => undefined);

    return () => {
      alive = false;
    };
  }, [auth.authenticated, id]);

  async function toggleWishlist() {
    setWishlistError(null);
    if (!auth.authenticated) {
      auth.openAuthDialog();
      return;
    }

    if (!id) return;

    try {
      const next = wishlisted ? await removeWishlistBook(Number(id)) : await addWishlistBook(Number(id));
      setWishlisted(next.wishlisted);
    } catch (err) {
      setWishlistError(apiErrorMessage(err));
    }
  }

  const hasAnyOffers = useMemo(() => {
    if (!data) return false;
    return Object.values(data.offers).some((group) => group.length > 0);
  }, [data]);

  if (loading) {
    return <main className="mx-auto max-w-[1200px] px-4 py-10 sm:px-8"><LoadingState label="Đang tải chi tiết sách..." /></main>;
  }

  if (error || !data) {
    return <main className="mx-auto max-w-[1200px] px-4 py-10 sm:px-8"><ErrorState message={error ?? "Không tìm thấy sách công khai phù hợp."} /></main>;
  }

  return (
    <main className="mx-auto flex max-w-[1200px] flex-col gap-12 px-4 py-10 sm:px-8">
      <HeroSection data={data} wishlisted={wishlisted} wishlistError={wishlistError} onToggleWishlist={toggleWishlist} />
      <AlertCreationPanel data={data} />
      {hasAnyOffers ? <MarketPriceList data={data} /> : <EmptyState message="Sách này chưa có ưu đãi công khai để so sánh." />}
      <TechnicalDetails data={data} />
      <RelatedBooks books={related} />
      <DisclaimerBlock data={data} />
    </main>
  );
}
