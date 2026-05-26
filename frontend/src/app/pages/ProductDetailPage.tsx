import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { ExternalLink, Info } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { apiErrorMessage, BookDetailResponse, fetchBookDetail, formatDate, formatVnd, OfferDto } from "../api";
import {
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

export default function ProductDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState<BookDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    if (!id) return;
    fetchBookDetail(id)
      .then((response) => {
        if (alive) setData(response);
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

  if (loading) {
    return <main className="mx-auto max-w-[1200px] px-4 py-10 sm:px-8"><LoadingState label="Đang tải chi tiết sách..." /></main>;
  }

  if (error || !data) {
    return <main className="mx-auto max-w-[1200px] px-4 py-10 sm:px-8"><ErrorState message={error ?? "Không tìm thấy sách công khai phù hợp."} /></main>;
  }

  const chartData = data.price_history.map((point) => ({
    date: formatDate(point.date),
    price: point.lowest_price,
  }));

  return (
    <main className="mx-auto flex max-w-[1200px] flex-col gap-10 px-4 py-10 sm:px-8">
      <section className="grid gap-8 p-5 lg:grid-cols-[300px_1fr]" style={{ background: C.surfaceLow, border: border4, boxShadow: shadow8 }}>
        <div className="overflow-hidden" style={{ aspectRatio: "2/3", border: border2 }}>
          <CoverImage title={data.book.title} src={data.book.cover_image} />
        </div>
        <div className="flex min-w-0 flex-col gap-5">
          <Link to="/search" className="text-[12px] font-bold uppercase" style={{ color: C.primary, fontFamily: FONT }}>Tìm kiếm / {data.book.category}</Link>
          <h1 className="text-[32px] font-extrabold leading-tight md:text-[46px]" style={{ fontFamily: FONT }}>{data.book.title}</h1>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm" style={{ color: C.onSurfaceVariant, fontFamily: FONT }}>
            <span>Tác giả: <strong style={{ color: C.onSurface }}>{data.book.author}</strong></span>
            <span>NXB: <strong style={{ color: C.onSurface }}>{data.book.publisher}</strong></span>
            <span>ISBN: <strong style={{ color: C.onSurface }}>{data.book.isbn ?? "Chưa cập nhật"}</strong></span>
          </div>
          {data.book.description && <p className="max-w-3xl text-[15px] leading-relaxed" style={{ color: C.onSurfaceVariant, fontFamily: FONT }}>{data.book.description}</p>}
          <div className="flex flex-wrap gap-4">
            <div className="p-4" style={{ background: C.primaryFixed, border: border2, boxShadow: shadow4 }}>
              <p className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: C.primary, fontFamily: FONT }}>Giá tham khảo thấp nhất</p>
              {data.summary.lowest_eligible_price !== null ? (
                <strong className="mt-2 block text-[32px] leading-none" style={{ color: C.primary, fontFamily: FONT }}>{formatVnd(data.summary.lowest_eligible_price)}</strong>
              ) : (
                <strong className="mt-2 block text-[18px]" style={{ color: C.primary, fontFamily: FONT }}>{data.summary.status.label}</strong>
              )}
            </div>
            <div className="p-4" style={{ background: C.white, border: border2 }}>
              <p className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: C.outline, fontFamily: FONT }}>Số ưu đãi theo dõi</p>
              <strong className="mt-2 block text-[28px] leading-none" style={{ fontFamily: FONT }}>{data.summary.offer_count}</strong>
            </div>
          </div>
          <PriceDisclaimer />
        </div>
      </section>

      <OfferGroup title="Có thể đến nơi bán" offers={data.offers.purchasable} disclosure={data.summary.affiliate_disclosure} />
      <OfferGroup title="Tạm hết hàng" offers={data.offers.unavailable} />
      <OfferGroup title="Giá tham khảo cũ" offers={data.offers.stale_reference} />
      <OfferGroup title="Chưa có liên kết mua hợp lệ" offers={data.offers.missing_valid_seller_link} />

      <section className="p-5" style={{ background: C.white, border: border2, boxShadow: shadow8 }}>
        <h2 className="mb-4 text-[18px] font-extrabold uppercase" style={{ fontFamily: FONT }}>Lịch sử giá tham khảo</h2>
        {chartData.length > 0 ? (
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="priceHistory" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.primary} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={C.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} />
                <XAxis dataKey="date" tick={{ fontFamily: FONT, fontSize: 11, fill: C.outline }} />
                <YAxis tick={{ fontFamily: FONT, fontSize: 11, fill: C.outline }} tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} />
                <Tooltip contentStyle={{ fontFamily: FONT, fontSize: 12, border: border2, background: C.white, borderRadius: 0 }} formatter={(value) => [formatVnd(Number(value)), "Giá"]} />
                <Area type="monotone" dataKey="price" stroke={C.primary} strokeWidth={2} fill="url(#priceHistory)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : <EmptyState message="Chưa có lịch sử giá đủ điều kiện để hiển thị." />}
      </section>

      <section className="flex gap-4 p-5" style={{ background: C.primaryFixed, border: border4, boxShadow: shadow8 }}>
        <Info size={24} style={{ color: C.primary }} />
        <div className="text-sm leading-relaxed" style={{ fontFamily: FONT }}>
          <strong>DealSach không bán sách trực tiếp.</strong>
          <p>{data.summary.affiliate_disclosure}</p>
          <PriceDisclaimer />
        </div>
      </section>
    </main>
  );
}

function OfferGroup({ title, offers, disclosure }: { title: string; offers: OfferDto[]; disclosure?: string }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[18px] font-extrabold uppercase" style={{ fontFamily: FONT }}>{title}</h2>
      {disclosure && <p className="text-[12px] leading-relaxed" style={{ color: C.onSurfaceVariant, fontFamily: FONT }}>{disclosure}</p>}
      {offers.length === 0 ? <EmptyState message="Chưa có ưu đãi trong nhóm này." /> : (
        <div className="flex flex-col gap-3">
          {offers.map((offer) => <OfferRow key={offer.id} offer={offer} />)}
        </div>
      )}
    </section>
  );
}

function OfferRow({ offer }: { offer: OfferDto }) {
  const price = offer.latest_price ?? offer.last_available_price;
  return (
    <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center" style={{ background: offer.buy_action ? C.white : C.surfaceVariant, border: border2 }}>
      <div className="min-w-0 flex-1">
        <h3 className="font-extrabold" style={{ fontFamily: FONT }}>{offer.title}</h3>
        <p className="text-sm" style={{ color: C.onSurfaceVariant, fontFamily: FONT }}>{offer.retailer.name} / {offer.merchant.name}</p>
        <span className="mt-2 inline-block px-2 py-1 text-[11px] font-bold" style={{ background: C.boneWhite, border: `1px solid ${C.black}`, fontFamily: FONT }}>{offer.status_label}</span>
      </div>
      <div className="flex flex-wrap items-center gap-3 sm:justify-end">
        <strong className="text-[20px]" style={{ color: offer.latest_price ? C.secondary : C.outline, fontFamily: FONT }}>{price ? formatVnd(price) : "Không có giá"}</strong>
        {offer.buy_action ? (
          <a href={offer.buy_action.url} className="inline-flex items-center gap-2 px-4 py-3 text-[12px] font-extrabold uppercase" style={{ background: C.primary, color: C.white, border: border2, boxShadow: shadow4, fontFamily: FONT }}>
            <ExternalLink size={14} /> {offer.buy_action.label}
          </a>
        ) : (
          <span className="px-4 py-3 text-[12px] font-extrabold uppercase" style={{ background: C.surfaceHigh, color: C.outline, border: `1px solid ${C.outlineVariant}`, fontFamily: FONT }}>Không có nút mua</span>
        )}
      </div>
    </div>
  );
}
