import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Flame, Search, TrendingDown } from "lucide-react";
import { apiErrorMessage, DiscoveryResponse, fetchDiscovery } from "../api";
import {
  ApiBookGrid,
  C,
  EmptyState,
  ErrorState,
  FONT,
  LoadingState,
  PriceDisclaimer,
  border2,
  border4,
  shadow8,
} from "../shared";

function DiscoveryBand({
  title,
  icon,
  items,
  empty,
  showDrop = false,
  showPopular = false,
}: {
  title: string;
  icon: React.ReactNode;
  items: DiscoveryResponse["featured_books"]["items"];
  empty: string | null;
  showDrop?: boolean;
  showPopular?: boolean;
}) {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-center gap-3 pb-3" style={{ borderBottom: `3px solid ${C.black}` }}>
        <span style={{ color: C.primary }}>{icon}</span>
        <h2 className="text-[22px] font-extrabold uppercase leading-tight" style={{ fontFamily: FONT }}>{title}</h2>
      </div>
      {items.length > 0 ? <ApiBookGrid books={items} showDrop={showDrop} showPopular={showPopular} /> : <EmptyState message={empty ?? "Chưa có sách phù hợp để hiển thị."} />}
    </section>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [data, setData] = useState<DiscoveryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchDiscovery()
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
  }, []);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    navigate(`/search${params.toString() ? `?${params}` : ""}`);
  }

  return (
    <main className="mx-auto flex max-w-[1200px] flex-col gap-12 px-4 pb-10 pt-10 sm:px-8">
      <section className="grid gap-8 p-6 md:grid-cols-[1.4fr_0.8fr] md:p-10" style={{ background: C.primary, color: C.white, border: border4, boxShadow: shadow8 }}>
        <div className="flex flex-col gap-5">
          <p className="text-[11px] font-extrabold uppercase tracking-widest" style={{ color: C.primaryFixed, fontFamily: FONT }}>So sánh giá sách Việt Nam</p>
          <h1 className="text-[32px] font-extrabold leading-tight md:text-[48px]" style={{ fontFamily: FONT }}>
            Tìm sách, so sánh giá tham khảo, rồi đến nơi bán bên ngoài.
          </h1>
          <p className="max-w-2xl text-[15px] leading-relaxed" style={{ color: "#bde5d4", fontFamily: FONT }}>
            DealSach không bán sách trực tiếp. Chúng tôi tổng hợp giá ghi nhận gần đây từ các ưu đãi đủ điều kiện và chỉ chuyển bạn đến liên kết nhà bán đã được kiểm tra.
          </p>
          <form onSubmit={submitSearch} className="flex flex-col gap-3 bg-white p-2 sm:flex-row" style={{ border: border2 }}>
            <div className="flex min-w-0 flex-1 items-center gap-2 px-3">
              <Search size={18} style={{ color: C.primary }} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm sách theo tên, tác giả, ISBN..." className="min-w-0 flex-1 py-3 text-sm outline-none" style={{ color: C.onSurface, fontFamily: FONT }} />
            </div>
            <button className="px-5 py-3 text-[12px] font-extrabold uppercase" style={{ background: C.secondary, color: C.white, border: border2, fontFamily: FONT }}>
              Tìm kiếm
            </button>
          </form>
          <PriceDisclaimer />
        </div>
        <div className="flex flex-col justify-between gap-4" style={{ border: border2, background: C.boneWhite, color: C.onSurface }}>
          <div className="p-5">
            <p className="text-[12px] font-extrabold uppercase tracking-widest" style={{ color: C.primary, fontFamily: FONT }}>Hướng dẫn mua</p>
            <p className="mt-3 text-[14px] leading-relaxed" style={{ fontFamily: FONT }}>
              Chọn sách, xem nhóm ưu đãi, nhấn "Đến nơi bán" để DealSach ghi nhận lượt nhấn và chuyển bạn sang nhà bán bên ngoài nếu liên kết hợp lệ.
            </p>
          </div>
        </div>
      </section>

      {loading && <LoadingState label="Đang tải trang khám phá..." />}
      {error && <ErrorState message={error} />}
      {data && (
        <>
          <DiscoveryBand title={data.featured_books.title} icon={<Search size={22} />} items={data.featured_books.items} empty={data.featured_books.empty_state} />
          <DiscoveryBand title={data.recent_price_drops.title} icon={<TrendingDown size={22} />} items={data.recent_price_drops.items} empty={data.recent_price_drops.empty_state} showDrop />
          <DiscoveryBand title={data.popular_clicked_deals.title} icon={<Flame size={22} />} items={data.popular_clicked_deals.items} empty={data.popular_clicked_deals.empty_state} showPopular />
        </>
      )}
    </main>
  );
}
