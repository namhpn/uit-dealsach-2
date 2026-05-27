import { FormEvent, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, ChevronRight, Flame, Search, TrendingDown } from "lucide-react";
import { apiErrorMessage, DiscoveryResponse, fetchDiscovery } from "../api";
import {
  ApiDealSection,
  ApiFeaturedBooks,
  C,
  ErrorState,
  FONT,
  HowItWorks,
  LoadingState,
  NbButton,
  PriceDisclaimer,
  border2,
  dealBanners,
  shadow8,
} from "../shared";

function DealBannerCarousel({ onSearchFocus }: { onSearchFocus: () => void }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = dealBanners.length;
  const go = useCallback((i: number) => setCurrent((i + total) % total), [total]);

  useEffect(() => {
    if (paused) return undefined;
    const timer = window.setInterval(() => go(current + 1), 5000);
    return () => window.clearInterval(timer);
  }, [current, paused, go]);

  const banner = dealBanners[current];
  const isLight = banner.textColor === C.black;

  return (
    <div
      className="relative select-none overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{ background: banner.bg, border: border2, boxShadow: shadow8, transition: "background 350ms" }}
    >
      <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-8 px-12 py-10 md:flex-row md:gap-12 md:px-20 md:py-14">
        <div className="relative z-10 flex max-w-xl flex-1 flex-col gap-4">
          {banner.badgeLabel && (
            <span className="self-start px-3 py-1 text-[10px] font-bold uppercase" style={{ background: C.boneWhite, color: C.black, fontFamily: FONT, border: border2 }}>
              {banner.badgeLabel}
            </span>
          )}
          <h1 style={{ fontFamily: FONT, color: banner.textColor, fontSize: "clamp(28px, 4vw, 52px)", fontWeight: 800, lineHeight: 1.05 }}>
            {banner.headline}
          </h1>
          <p style={{ fontFamily: FONT, color: banner.textColor, opacity: 0.78, fontSize: 15, lineHeight: 1.6, maxWidth: 430 }}>{banner.sub}</p>
          <p style={{ fontFamily: FONT, color: banner.textColor, opacity: 0.55, fontSize: 11, fontStyle: "italic", lineHeight: 1.4 }}>
            DealSach so sánh giá tham khảo và chuyển người dùng đến nhà bán bên ngoài, không bán sách trực tiếp.
          </p>
          <NbButton variant={isLight ? "primary" : "secondary"} onClick={onSearchFocus} style={{ alignSelf: "flex-start", marginTop: 4 }}>
            {banner.cta}
          </NbButton>
        </div>
        <div className="hidden shrink-0 overflow-hidden md:block" style={{ width: 260, height: 300, border: border2 }}>
          <img src={banner.imageUrl} alt={banner.headline} className="h-full w-full object-cover" />
        </div>
      </div>

      <button onClick={() => go(current - 1)} className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center" style={{ background: banner.textColor, color: banner.bg, border: `2px solid ${banner.textColor}` }} aria-label="Trước"><ChevronLeft size={18} /></button>
      <button onClick={() => go(current + 1)} className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center" style={{ background: banner.textColor, color: banner.bg, border: `2px solid ${banner.textColor}` }} aria-label="Tiếp"><ChevronRight size={18} /></button>

      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        {dealBanners.map((_, index) => (
          <button
            key={index}
            onClick={() => go(index)}
            style={{ width: index === current ? 24 : 8, height: 8, background: banner.textColor, opacity: index === current ? 1 : 0.35, border: `1px solid ${banner.textColor}`, transition: "width 200ms, opacity 200ms" }}
            aria-label={`Banner ${index + 1}`}
          />
        ))}
      </div>
    </div>
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

  function focusSearch() {
    document.getElementById("home-search")?.focus();
  }

  return (
    <main className="mx-auto flex max-w-[1200px] flex-col gap-12 px-4 pb-10 pt-10 sm:px-8">
      <DealBannerCarousel onSearchFocus={focusSearch} />

      <section style={{ border: border2, boxShadow: shadow8, background: C.white }}>
        <form onSubmit={submitSearch} className="flex flex-col gap-3 p-3 sm:flex-row">
          <div className="flex min-w-0 flex-1 items-center gap-2 px-3" style={{ border: border2, background: C.white }}>
            <Search size={18} style={{ color: C.primary }} />
            <input
              id="home-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm sách theo tên, tác giả, ISBN..."
              className="min-w-0 flex-1 py-3 text-sm outline-none"
              style={{ color: C.onSurface, fontFamily: FONT }}
            />
          </div>
          <button className="px-5 py-3 text-[12px] font-extrabold uppercase" style={{ background: C.secondary, color: C.white, border: border2, fontFamily: FONT }}>
            Tìm kiếm
          </button>
        </form>
        <div className="px-4 pb-4"><PriceDisclaimer /></div>
      </section>

      {loading && <LoadingState label="Đang tải trang khám phá..." />}
      {error && <ErrorState message={error} />}
      {data && (
        <>
          <ApiFeaturedBooks title={data.featured_books.title} books={data.featured_books.items} empty={data.featured_books.empty_state} />
          <ApiDealSection title={data.recent_price_drops.title} icon={<TrendingDown size={22} />} books={data.recent_price_drops.items} empty={data.recent_price_drops.empty_state} showDrop />
          <ApiDealSection title={data.popular_clicked_deals.title} icon={<Flame size={22} />} books={data.popular_clicked_deals.items} empty={data.popular_clicked_deals.empty_state} showDeal />
        </>
      )}
      <HowItWorks />
    </main>
  );
}
