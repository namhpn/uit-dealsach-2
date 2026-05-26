import { useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, TrendingDown, Flame } from "lucide-react";
import {
  C, FONT, border2, shadow8,
  dealBanners, priceDropBooks, popularDeals,
  NbButton, DealSection, FeaturedByCategory, HowItWorks,
} from "../shared";

// ─── Deal Banner Carousel ─────────────────────────────────────────────────────

function DealBannerCarousel() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = dealBanners.length;
  const go = useCallback((i: number) => setCurrent((i + total) % total), [total]);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => go(current + 1), 5000);
    return () => clearInterval(t);
  }, [current, paused, go]);

  const b = dealBanners[current];
  const isLight = b.textColor === C.black;

  return (
    <div className="relative select-none overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{ background: b.bg, border: border2, boxShadow: shadow8, transition: "background 350ms" }}
    >
      <div className="max-w-[1200px] mx-auto px-16 md:px-20 py-10 md:py-14 flex flex-col md:flex-row items-center gap-8 md:gap-12">
        {/* Left content */}
        <div className="flex flex-col gap-4 flex-1 max-w-xl relative z-10">
          {b.badgeLabel && (
            <span className="self-start text-[10px] font-bold px-3 py-1 uppercase tracking-widest"
              style={{ background: C.boneWhite, color: C.black, fontFamily: FONT, border: border2 }}>
              {b.badgeLabel}
            </span>
          )}
          <h2 style={{ fontFamily: FONT, color: b.textColor, fontSize: "clamp(28px, 4vw, 52px)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.02em" }}>
            {b.headline}
          </h2>
          <p style={{ fontFamily: FONT, color: b.textColor, opacity: 0.75, fontSize: 15, lineHeight: 1.6, maxWidth: 380 }}>{b.sub}</p>
          <p style={{ fontFamily: FONT, color: b.textColor, opacity: 0.45, fontSize: 11, fontStyle: "italic", lineHeight: 1.4 }}>
            Giá hiển thị mang tính tham khảo, vui lòng kiểm tra tại nơi bán.
          </p>
          <NbButton variant={isLight ? "primary" : "secondary"} onClick={() => {}} style={{ alignSelf: "flex-start", marginTop: 4 }}>
            {b.cta}
          </NbButton>
        </div>
        {/* Right image */}
        <div className="hidden md:block shrink-0 overflow-hidden" style={{ width: 260, height: 300, border: border2 }}>
          <img src={b.imageUrl} alt={b.headline} className="w-full h-full object-cover" />
        </div>
      </div>

      {/* Decorative shapes */}
      <div className="absolute pointer-events-none" style={{ width: 280, height: 280, borderRadius: "50%", border: `2px solid ${b.textColor}`, opacity: 0.08, top: -80, right: -60 }} />
      <div className="absolute pointer-events-none" style={{ width: 120, height: 120, border: `2px solid ${b.textColor}`, opacity: 0.07, bottom: -40, left: 60, transform: "rotate(28deg)" }} />

      {/* Prev/Next */}
      <button onClick={() => go(current - 1)} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center"
        style={{ background: b.textColor, color: b.bg, border: `2px solid ${b.textColor}` }} aria-label="Trước"><ChevronLeft size={18} /></button>
      <button onClick={() => go(current + 1)} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center"
        style={{ background: b.textColor, color: b.bg, border: `2px solid ${b.textColor}` }} aria-label="Tiếp"><ChevronRight size={18} /></button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {dealBanners.map((_, i) => (
          <button key={i} onClick={() => go(i)}
            style={{ width: i === current ? 24 : 8, height: 8, background: b.textColor, opacity: i === current ? 1 : 0.35, border: `1px solid ${b.textColor}`, transition: "width 200ms, opacity 200ms" }}
            aria-label={`Banner ${i + 1}`} />
        ))}
      </div>
    </div>
  );
}

// ─── HomePage ─────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <main className="max-w-[1200px] mx-auto px-4 sm:px-8 pt-10 pb-10 flex flex-col gap-12">
      <DealBannerCarousel />
      <FeaturedByCategory />
      <DealSection title="Giảm giá gần đây" icon={<TrendingDown size={22} />} books={priceDropBooks} showDrop />
      <DealSection title="Ưu đãi phổ biến"  icon={<Flame size={22} />}      books={popularDeals}  showDeal />
      <HowItWorks />
    </main>
  );
}
