import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router";
import { Bell, ExternalLink, Heart, Info, TrendingDown } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  addWishlistBook,
  apiErrorMessage,
  BookCardDto,
  BookDetailResponse,
  createPriceAlert,
  fetchBookDetail,
  fetchDiscovery,
  fetchWishlistStatus,
  formatDate,
  formatVnd,
  OfferDto,
  removeWishlistBook,
} from "../api";
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
  border3,
  border4,
  shadow4,
  shadow8,
} from "../shared";

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
  const showReferencePrice =
    data.summary.lowest_eligible_price !== null
    && data.summary.highest_eligible_price !== null
    && data.summary.highest_eligible_price > data.summary.lowest_eligible_price;

  return (
    <section style={{ background: C.surfaceLow, border: border4, boxShadow: shadow8 }}>
      <div className="flex flex-col gap-8 p-6 md:p-8 lg:flex-row lg:items-start lg:gap-10 lg:p-10">
        <div className="mx-auto w-full max-w-[280px] shrink-0 lg:mx-0 lg:max-w-[320px]">
          <div className="overflow-hidden p-3" style={{ border: border3, background: C.boneWhite, boxShadow: shadow4 }}>
            <div className="relative overflow-hidden" style={{ border: border2, background: C.white, minHeight: 420 }}>
              <div className="absolute left-3 top-3 z-10 px-2 py-1 text-[10px] font-extrabold uppercase" style={{ background: C.primary, color: C.white, border: border2, fontFamily: FONT }}>
                {data.book.category}
              </div>
              <div className="h-[420px] p-4">
                <CoverImage title={data.book.title} src={data.book.cover_image} fit="contain" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
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

          <div className="flex flex-wrap items-start gap-3">
            <div className="flex min-w-[220px] flex-1 flex-col gap-1.5 p-4" style={{ background: C.primaryFixed, border: border4, boxShadow: shadow8 }}>
              <p className="text-[10px] font-bold uppercase" style={{ fontFamily: FONT, color: C.primary }}>
                Giá tốt nhất hiện tại
              </p>
              {data.summary.lowest_eligible_price !== null ? (
                <>
                  {showReferencePrice && (
                    <span className="text-[14px] font-bold leading-none line-through" style={{ color: C.onSurfaceVariant, fontFamily: FONT }}>
                      {formatVnd(data.summary.highest_eligible_price!)}
                    </span>
                  )}
                  <span style={{ fontFamily: FONT, fontSize: "clamp(28px,4vw,42px)", fontWeight: 800, color: C.dealRed, lineHeight: 1 }}>
                    {formatVnd(data.summary.lowest_eligible_price)}
                  </span>
                </>
              ) : (
                <span className="text-[18px] font-extrabold" style={{ fontFamily: FONT, color: C.primary }}>
                  {data.summary.status.label}
                </span>
              )}
              <PriceDisclaimer compact />
            </div>

            <div className="flex flex-col gap-2">
              <button
                className="flex items-center justify-center gap-2 px-4 py-3 text-[11px] font-extrabold uppercase"
                title={wishlisted ? "Bỏ khỏi danh sách yêu thích" : "Lưu vào danh sách yêu thích"}
                onClick={onToggleWishlist}
                style={{ border: border2, background: wishlisted ? C.primaryFixed : C.white, color: wishlisted ? C.primary : C.onSurface, fontFamily: FONT, boxShadow: shadow4, cursor: "pointer" }}
              >
                <Heart size={16} fill={wishlisted ? C.primary : "none"} />
                {wishlisted ? "Đã lưu" : "Lưu sách"}
              </button>
              <a
                href="#price-alerts"
                className="flex items-center justify-center gap-2 px-4 py-3 text-[11px] font-extrabold uppercase"
                style={{ border: border2, background: C.white, color: C.onSurface, fontFamily: FONT, boxShadow: shadow4 }}
              >
                <Bell size={16} />
                THEO DÕI GIẢM GIÁ
              </a>
            </div>
          </div>

          {wishlistError && (
            <p className="text-[12px] font-bold leading-relaxed" style={{ color: C.dealRed, fontFamily: FONT }}>
              {wishlistError}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function statusStamp(offer: OfferDto): string | null {
  if (offer.buy_action) {
    return null;
  }

  return (
    {
      missing_valid_seller_link: "CHƯA CÓ LIÊN KẾT",
      stale_reference: "GIÁ THAM KHẢO CŨ",
      unavailable: "TẠM HẾT HÀNG",
    } as Record<string, string>
  )[offer.availability] ?? "KHÔNG KHẢ DỤNG";
}

function OfferRow({ offer, isCheapest }: { offer: OfferDto; isCheapest: boolean }) {
  const inactive = !offer.buy_action;
  const price = offer.latest_price ?? offer.last_available_price;
  const stamp = statusStamp(offer);

  return (
    <div
      className="flex flex-col gap-4 px-4 py-3 sm:flex-row sm:items-center"
      style={{
        background: isCheapest ? C.primaryFixed : inactive ? C.surfaceVariant : C.white,
        border: border2,
        borderLeft: isCheapest ? `8px solid ${C.primary}` : border2,
        boxShadow: isCheapest ? shadow4 : "none",
      }}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[15px] font-extrabold" style={{ fontFamily: FONT, color: C.onSurface }}>
            {offer.retailer.name}
          </span>
          {isCheapest && (
            <span className="shrink-0 px-2 py-0.5 text-[10px] font-bold uppercase" style={{ background: C.primary, color: C.white, fontFamily: FONT, border: border2 }}>
              Rẻ nhất
            </span>
          )}
          <span className="shrink-0 px-2 py-0.5 text-[10px] font-bold uppercase" style={{ background: C.boneWhite, color: C.onSurface, fontFamily: FONT, border: border2 }}>
            {offer.status_label}
          </span>
        </div>
        <span className="text-[12px]" style={{ fontFamily: FONT, color: C.onSurfaceVariant }}>
          {offer.merchant.name}
        </span>
        <span className="line-clamp-1 text-[11px]" style={{ fontFamily: FONT, color: C.outline }}>
          {offer.title}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3 sm:shrink-0 sm:justify-end">
        <div className="text-left sm:text-right">
          {price !== null ? (
            <p className="text-[20px] font-extrabold leading-none" style={{ fontFamily: FONT, color: isCheapest ? C.dealRed : C.onSurface }}>
              {formatVnd(price)}
            </p>
          ) : (
            <p className="text-[12px] italic" style={{ fontFamily: FONT, color: C.outline }}>
              Không có giá
            </p>
          )}
        </div>

        {offer.buy_action ? (
          <a
            href={offer.buy_action.url}
            className="flex items-center gap-2 px-4 py-2.5 text-[11px] font-extrabold uppercase"
            style={{
              background: isCheapest ? C.primary : C.boneWhite,
              color: isCheapest ? C.white : C.onSurface,
              fontFamily: FONT,
              border: border2,
              boxShadow: isCheapest ? shadow8 : shadow4,
            }}
          >
            <ExternalLink size={12} />
            {offer.buy_action.label}
          </a>
        ) : (
          <span className="px-4 py-2.5 text-[10px] font-extrabold uppercase" style={{ background: C.surfaceHigh, color: C.onSurfaceVariant, border: border2, fontFamily: FONT }}>
            {stamp}
          </span>
        )}
      </div>
    </div>
  );
}

function OfferGroup({ title, description, offers, purchasable = false }: { title: string; description: string; offers: OfferDto[]; purchasable?: boolean }) {
  return (
    <section>
      <div className="mb-4 pb-3" style={{ borderBottom: `4px solid ${C.black}` }}>
        <h2 className="text-[20px] font-extrabold uppercase" style={{ fontFamily: FONT, color: C.onSurface }}>
          {title}
        </h2>
        <p className="mt-1 text-[13px]" style={{ fontFamily: FONT, color: C.onSurfaceVariant }}>
          {description}
        </p>
      </div>
      {offers.length > 0 ? (
        <div className="flex flex-col gap-2">
          {offers.map((offer, index) => (
            <OfferRow key={offer.id} offer={offer} isCheapest={purchasable && index === 0} />
          ))}
        </div>
      ) : (
        <EmptyState message="Chưa có ưu đãi trong nhóm này." />
      )}
    </section>
  );
}

function MarketPriceList({ data }: { data: BookDetailResponse }) {
  return (
    <div className="flex flex-col gap-8">
      <OfferGroup
        title="Bảng giá thị trường"
        description={`So sánh ${data.offers.purchasable.length} ưu đãi có thể mua ngay.`}
        offers={data.offers.purchasable}
        purchasable
      />
      <OfferGroup title="Tạm hết hàng" description="Các ưu đãi này được giữ lại để bạn tham khảo bối cảnh giá." offers={data.offers.unavailable} />
      <OfferGroup title="Giá tham khảo cũ" description="Các mức giá cũ không dùng làm giá tốt nhất hiện tại." offers={data.offers.stale_reference} />
      <OfferGroup title="Chưa có liên kết mua hợp lệ" description="DealSach chưa thể chuyển hướng an toàn cho các ưu đãi này." offers={data.offers.missing_valid_seller_link} />
    </div>
  );
}

function PriceHistoryAndAlerts({ data }: { data: BookDetailResponse }) {
  const auth = useAuth();
  const [targetPrice, setTargetPrice] = useState("");
  const [targetError, setTargetError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState<"target" | "lowest" | null>(null);

  const chartData = data.price_history.map((point) => ({
    date: formatDate(point.date),
    price: point.lowest_price,
  }));

  const recentDrop = useMemo(() => {
    if (data.price_history.length < 2) {
      return null;
    }

    const previous = data.price_history[data.price_history.length - 2].lowest_price;
    const current = data.price_history[data.price_history.length - 1].lowest_price;
    if (current < previous) {
      return previous - current;
    }

    return null;
  }, [data.price_history]);

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
    <section id="price-alerts" style={{ border: border2, boxShadow: shadow8, background: C.white }}>
      <div className="px-5 py-3" style={{ background: C.onSurface, borderBottom: border2 }}>
        <h2 className="text-[14px] font-extrabold uppercase" style={{ fontFamily: FONT, color: C.white }}>
          Lịch sử giá & cảnh báo
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-0 lg:grid-cols-2">
        <div className="flex flex-col gap-3 p-5" style={{ borderBottom: border2 }}>
          {recentDrop !== null && (
            <p className="text-[12px] font-bold uppercase" style={{ fontFamily: FONT, color: C.dealRed }}>
              Giảm gần đây: {formatVnd(recentDrop)}
            </p>
          )}
          {chartData.length > 0 ? (
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke={C.outlineVariant} strokeWidth={1} />
                  <XAxis dataKey="date" tick={{ fontFamily: FONT, fontSize: 10, fill: C.outline }} />
                  <YAxis tick={{ fontFamily: FONT, fontSize: 10, fill: C.outline }} tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} />
                  <Tooltip contentStyle={{ fontFamily: FONT, fontSize: 12, border: border2, background: C.white, borderRadius: 0 }} formatter={(value) => [formatVnd(Number(value)), "Giá"]} />
                  <Line type="monotone" dataKey="price" stroke={C.primary} strokeWidth={3} dot={{ fill: C.primary, stroke: C.black, strokeWidth: 2, r: 4 }} activeDot={{ r: 5, stroke: C.black, strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState message="Chưa có lịch sử giá đủ điều kiện để hiển thị." />
          )}
        </div>

        <div className="flex flex-col gap-4 p-5" style={{ background: C.boneWhite, borderTop: border2 }}>
          <div className="flex items-center gap-2">
            <Bell size={18} style={{ color: C.primary }} />
            <h3 className="text-[15px] font-extrabold uppercase" style={{ fontFamily: FONT }}>
              THEO DÕI GIẢM GIÁ
            </h3>
          </div>
          <p className="text-[12px] leading-relaxed" style={{ color: C.onSurfaceVariant, fontFamily: FONT }}>
            Bạn có thể theo dõi theo mức giá mục tiêu hoặc theo dõi khi xuất hiện mức giá thấp mới.
          </p>

          <form onSubmit={createTargetAlert} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-[11px] font-extrabold uppercase" style={{ color: C.onSurfaceVariant, fontFamily: FONT }}>
              Giá mục tiêu VND
              <input
                value={targetPrice}
                onChange={(event) => setTargetPrice(event.target.value.replace(/\D/g, ""))}
                placeholder="Ví dụ: 90000"
                inputMode="numeric"
                className="px-3 py-2 text-sm normal-case outline-none focus-visible:ring-2"
                style={{ border: border3, color: C.onSurface, fontFamily: FONT }}
              />
            </label>
            <button
              type="submit"
              disabled={busy !== null}
              className="flex items-center justify-center gap-2 px-4 py-2.5 text-[12px] font-extrabold uppercase"
              style={{ background: C.primary, color: C.white, border: border2, boxShadow: shadow4, fontFamily: FONT, cursor: busy !== null ? "not-allowed" : "pointer" }}
            >
              <Bell size={13} />
              {busy === "target" ? "Đang tạo..." : "THEO DÕI GIẢM GIÁ"}
            </button>
          </form>

          <button
            type="button"
            disabled={busy !== null}
            onClick={createNewLowestAlert}
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-[12px] font-extrabold uppercase"
            style={{ background: C.white, color: C.onSurface, border: border2, boxShadow: shadow4, fontFamily: FONT, cursor: busy !== null ? "not-allowed" : "pointer" }}
          >
            <TrendingDown size={13} />
            {busy === "lowest" ? "Đang tạo..." : "THEO DÕI GIÁ THẤP MỚI"}
          </button>

          {(targetError || success) && (
            <div className="p-3" style={{ border: border2, background: targetError ? "#fff1f1" : C.primaryFixed }}>
              <p role={targetError ? "alert" : "status"} className="text-[12px] font-bold leading-relaxed" style={{ color: targetError ? C.dealRed : C.primary, fontFamily: FONT }}>
                {targetError ?? success}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function TechnicalDetails({ data }: { data: BookDetailResponse }) {
  const details = [
    { label: "Tác giả", value: data.book.author },
    { label: "Nhà xuất bản", value: data.book.publisher },
    { label: "Danh mục", value: data.book.category },
    { label: "ISBN", value: data.book.isbn ?? "Chưa cập nhật" },
    { label: "Ngày phát hành", value: data.book.release_date ? formatDate(data.book.release_date) : "Chưa cập nhật" },
    { label: "Số trang", value: data.book.page_count ? `${data.book.page_count} trang` : "Chưa cập nhật" },
    { label: "Kích thước", value: data.book.dimensions ?? "Chưa cập nhật" },
    { label: "Định dạng", value: data.book.format ?? "Chưa cập nhật" },
  ];

  return (
    <section style={{ border: border2, boxShadow: shadow8 }}>
      <div className="px-5 py-3" style={{ background: C.onSurface, borderBottom: border2 }}>
        <h2 className="text-[14px] font-extrabold uppercase" style={{ fontFamily: FONT, color: C.white }}>
          Thông tin kỹ thuật
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2" style={{ background: C.white }}>
        {details.map(({ label, value }) => (
          <div key={label} className="px-5 py-3" style={{ borderBottom: `1px solid ${C.outlineVariant}`, borderRight: `1px solid ${C.outlineVariant}` }}>
            <p className="mb-0.5 text-[10px] font-bold uppercase" style={{ fontFamily: FONT, color: C.outline }}>
              {label}
            </p>
            <p className="text-[14px] font-bold" style={{ fontFamily: FONT, color: C.onSurface }}>
              {value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function RelatedBooks({ books }: { books: BookCardDto[] }) {
  if (books.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="mb-5 pb-3" style={{ borderBottom: `4px solid ${C.black}` }}>
        <h2 className="text-[20px] font-extrabold uppercase" style={{ fontFamily: FONT, color: C.onSurface }}>
          Sách liên quan
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {books.slice(0, 4).map((book) => (
          <ApiDealBookCard key={book.id} book={book} compact />
        ))}
      </div>
    </section>
  );
}

function DisclaimerBlock() {
  return (
    <section className="flex gap-4 p-5 md:p-7" style={{ background: C.primaryFixed, border: border4, boxShadow: shadow8 }}>
      <div className="mt-1 shrink-0">
        <Info size={26} style={{ color: C.primary }} strokeWidth={2.5} />
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-[12px] font-extrabold uppercase" style={{ fontFamily: FONT, color: C.primary }}>
          Lưu ý về giá & liên kết
        </p>
        <p className="text-[13px] leading-relaxed" style={{ fontFamily: FONT, color: C.onSurface }}>
          Giá hiển thị là giá tham khảo gần đây, giá thực tế tại nơi bán có thể thay đổi theo thời điểm.
        </p>
        <p className="text-[13px] leading-relaxed" style={{ fontFamily: FONT, color: C.onSurface }}>
          DealSach không bán sách trực tiếp và không xử lý thanh toán, giao hàng, đổi trả hoặc hỗ trợ đơn hàng.
        </p>
        <PriceDisclaimer />
      </div>
    </section>
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
    if (!id) {
      return undefined;
    }

    Promise.all([fetchBookDetail(id), fetchDiscovery()])
      .then(([detail, discovery]) => {
        if (!alive) {
          return;
        }

        setData(detail);
        const candidates = [
          ...discovery.featured_books.items,
          ...discovery.recent_price_drops.items,
          ...discovery.popular_clicked_deals.items,
        ];
        const unique = new Map<number, BookCardDto>();
        candidates.forEach((book) => {
          if (book.id !== detail.book.id) {
            unique.set(book.id, book);
          }
        });
        setRelated(Array.from(unique.values()).slice(0, 4));
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
  }, [id]);

  useEffect(() => {
    if (!id || !auth.authenticated) {
      setWishlisted(false);
      return undefined;
    }

    let alive = true;
    fetchWishlistStatus(Number(id))
      .then((status) => {
        if (alive) {
          setWishlisted(status.wishlisted);
        }
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

    if (!id) {
      return;
    }

    try {
      const next = wishlisted ? await removeWishlistBook(Number(id)) : await addWishlistBook(Number(id));
      setWishlisted(next.wishlisted);
    } catch (err) {
      setWishlistError(apiErrorMessage(err));
    }
  }

  const hasAnyOffers = useMemo(() => {
    if (!data) {
      return false;
    }

    return Object.values(data.offers).some((group) => group.length > 0);
  }, [data]);

  if (loading) {
    return (
      <main className="mx-auto max-w-[1200px] px-4 py-10 sm:px-8">
        <LoadingState label="Đang tải chi tiết sách..." />
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="mx-auto max-w-[1200px] px-4 py-10 sm:px-8">
        <ErrorState message={error ?? "Không tìm thấy sách công khai phù hợp."} />
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-[1200px] flex-col gap-10 px-4 py-10 sm:px-8">
      <HeroSection data={data} wishlisted={wishlisted} wishlistError={wishlistError} onToggleWishlist={toggleWishlist} />
      {hasAnyOffers ? <MarketPriceList data={data} /> : <EmptyState message="Sách này chưa có ưu đãi công khai để so sánh." />}
      <PriceHistoryAndAlerts data={data} />
      <TechnicalDetails data={data} />
      <RelatedBooks books={related} />
      <DisclaimerBlock />
    </main>
  );
}
