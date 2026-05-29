import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, ChevronRight, Flame, TrendingDown } from "lucide-react";
import { apiErrorMessage, DiscoveryResponse, fetchDiscovery, fetchFilters, FiltersResponse } from "../api";
import {
  ApiDealSection,
  ApiFeaturedCategoryShelves,
  C,
  DealBanner,
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

function DealBannerCarousel({ onCtaClick }: { onCtaClick: (banner: DealBanner) => void }) {
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
      style={{ width: "100%", maxWidth: "calc(100vw - 32px)", boxSizing: "border-box", background: banner.bg, border: border2, boxShadow: shadow8, transition: "background 350ms" }}
    >
      <div className="mx-auto flex w-full max-w-[1200px] flex-col items-start gap-8 px-5 py-10 sm:px-12 md:flex-row md:items-center md:gap-12 md:px-20 md:py-14">
        <div className="relative z-10 flex w-[264px] min-w-0 flex-1 flex-col gap-4 sm:w-full sm:max-w-xl">
          {banner.badgeLabel && (
            <span className="self-start px-3 py-1 text-[10px] font-bold uppercase" style={{ background: C.boneWhite, color: C.black, fontFamily: FONT, border: border2 }}>
              {banner.badgeLabel}
            </span>
          )}
          <h1 className="text-[24px] sm:text-[clamp(28px,4vw,52px)]" style={{ maxWidth: "100%", whiteSpace: "normal", fontFamily: FONT, color: banner.textColor, fontWeight: 800, lineHeight: 1.08, overflowWrap: "break-word" }}>
            {banner.headline}
          </h1>
          <p style={{ maxWidth: "100%", whiteSpace: "normal", fontFamily: FONT, color: banner.textColor, opacity: 0.78, fontSize: 15, lineHeight: 1.6, overflowWrap: "break-word" }}>{banner.sub}</p>
          <p style={{ maxWidth: "100%", whiteSpace: "normal", fontFamily: FONT, color: banner.textColor, opacity: 0.55, fontSize: 11, fontStyle: "italic", lineHeight: 1.4, overflowWrap: "break-word" }}>
            DealSach so sánh giá tham khảo và chuyển người dùng đến nhà bán bên ngoài, không bán sách trực tiếp.
          </p>
          <NbButton variant={isLight ? "primary" : "secondary"} onClick={() => onCtaClick(banner)} style={{ alignSelf: "flex-start", marginTop: 4 }}>
            {banner.cta}
          </NbButton>
        </div>
        <div className="hidden shrink-0 overflow-hidden md:block" style={{ width: 260, height: 300, border: border2 }}>
          <img src={banner.imageUrl} alt={banner.headline} className="h-full w-full object-cover" />
        </div>
      </div>

      <button onClick={() => go(current - 1)} className="absolute left-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center sm:flex" style={{ background: banner.textColor, color: banner.bg, border: `2px solid ${banner.textColor}` }} aria-label="Trước"><ChevronLeft size={18} /></button>
      <button onClick={() => go(current + 1)} className="absolute right-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center sm:flex" style={{ background: banner.textColor, color: banner.bg, border: `2px solid ${banner.textColor}` }} aria-label="Tiếp"><ChevronRight size={18} /></button>

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
  const [data, setData] = useState<DiscoveryResponse | null>(null);
  const [filters, setFilters] = useState<FiltersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([fetchDiscovery(), fetchFilters()])
      .then(([discoveryResponse, filterResponse]) => {
        if (!alive) return;
        setData(discoveryResponse);
        setFilters(filterResponse);
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

  function handleBannerCta(banner: DealBanner) {
    const action = banner.cta_action;

    if (action.type === "search") {
      navigate("/search");
      return;
    }

    if (action.type === "route") {
      navigate(action.href);
      return;
    }

    if (action.type === "anchor") {
      const targetId = action.href.replace(/^#/, "");
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }

  return (
    <main className="mx-auto flex max-w-[1200px] flex-col gap-12 pb-10 pt-10" style={{ width: "min(1200px, calc(100vw - 32px))", boxSizing: "border-box" }}>
      <DealBannerCarousel onCtaClick={handleBannerCta} />

      {loading && <LoadingState label="Đang tải trang khám phá..." />}
      {error && <ErrorState message={error} />}
      {data && filters && (
        <>
          <section id="featured-books">
            <ApiFeaturedCategoryShelves
              title={data.featured_books.title}
              subtitle={data.featured_books.subtitle}
              ctaLabel={data.featured_books.cta_label}
              ctaHref={data.featured_books.cta_href}
              books={data.featured_books.items}
              categories={filters.categories}
              empty={data.featured_books.empty_state}
            />
          </section>

          <section id="recent-price-drops">
            <ApiDealSection
              title={data.recent_price_drops.title}
              subtitle={data.recent_price_drops.subtitle}
              ctaLabel={data.recent_price_drops.cta_label}
              ctaHref={data.recent_price_drops.cta_href}
              windowLabel={data.recent_price_drops.window?.label ?? null}
              icon={<TrendingDown size={22} />}
              books={data.recent_price_drops.items}
              empty={data.recent_price_drops.empty_state}
              showDrop
            />
          </section>

          <section id="popular-clicked-deals">
            <ApiDealSection
              title={data.popular_clicked_deals.title}
              subtitle={data.popular_clicked_deals.subtitle}
              ctaLabel={data.popular_clicked_deals.cta_label}
              ctaHref={data.popular_clicked_deals.cta_href}
              windowLabel={data.popular_clicked_deals.window?.label ?? null}
              icon={<Flame size={22} />}
              books={data.popular_clicked_deals.items}
              empty={data.popular_clicked_deals.empty_state}
              showDeal
            />
          </section>

          <section className="p-4" style={{ border: border2, background: C.white, boxShadow: shadow8 }}>
            <PriceDisclaimer />
          </section>
        </>
      )}
      <section id="how-it-works">
        <HowItWorks />
      </section>
    </main>
  );
}
