import { useState } from "react";
import {
  ChevronLeft, ChevronRight, Heart, Info, ExternalLink,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  C, FONT, border2, border4, shadow4, shadow8, fmt,
  DealBookCard, type Book,
} from "../shared";

// ─── Mock Product Data ────────────────────────────────────────────────────────

const product = {
  id: 1,
  title: "Đắc Nhân Tâm",
  author: "Dale Carnegie",
  publisher: "NXB Tổng Hợp TP.HCM",
  category: "Kỹ năng sống",
  isbn: "978-604-8-47379-1",
  releaseDate: "01/01/2016",
  pages: 320,
  dimensions: "14 × 20,5 cm",
  lowestPrice: 68000,
  originalPrice: 98000,
  description: `"Đắc Nhân Tâm" là cuốn sách bán chạy nhất mọi thời đại của Dale Carnegie — một kim chỉ nam về nghệ thuật giao tiếp, chinh phục lòng người, và xây dựng mối quan hệ bền chặt. Tác phẩm đã thay đổi cuộc sống của hàng triệu độc giả trên toàn thế giới kể từ lần đầu xuất bản năm 1936.`,
  coverImages: [
    "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&h=800&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1589998059171-988d887df646?w=600&h=800&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=600&h=800&fit=crop&auto=format",
  ],
};

interface Retailer {
  id: number;
  name: string;
  price: number | null;
  originalPrice?: number;
  status: "available" | "unavailable" | "no_link";
  platform: string;
}

const retailers: Retailer[] = [
  { id: 1, name: "Tiki",                price: 68000,  originalPrice: 98000,  status: "available",   platform: "tiki.vn" },
  { id: 2, name: "Shopee",              price: 75000,  originalPrice: 98000,  status: "available",   platform: "shopee.vn" },
  { id: 3, name: "Fahasa",              price: 79000,  originalPrice: 98000,  status: "available",   platform: "fahasa.com" },
  { id: 4, name: "Lazada",              price: 85000,  originalPrice: 98000,  status: "available",   platform: "lazada.vn" },
  { id: 5, name: "Nhà sách Phương Nam", price: 89000,  originalPrice: 98000,  status: "unavailable", platform: "" },
  { id: 6, name: "Đinh Lê Bookstore",   price: null,   originalPrice: undefined, status: "no_link",  platform: "" },
];

const priceHistory = [
  { date: "01/04", price: 98000 },
  { date: "08/04", price: 98000 },
  { date: "15/04", price: 88000 },
  { date: "22/04", price: 88000 },
  { date: "29/04", price: 79000 },
  { date: "06/05", price: 75000 },
  { date: "13/05", price: 68000 },
];

const relatedBooks: Book[] = [
  { id: 2,  title: "Tôi Tài Giỏi, Bạn Cũng Thế", author: "Adam Khoo",    category: "Kỹ năng sống", coverUrl: "https://images.unsplash.com/photo-1589998059171-988d887df646?w=300&h=420&fit=crop&auto=format", lowestPrice: 95000,  originalPrice: 130000, offerCount: 4 },
  { id: 5,  title: "Atomic Habits",               author: "James Clear",   category: "Kỹ năng sống", coverUrl: "https://images.unsplash.com/photo-1592496431122-2349e0fbc666?w=300&h=420&fit=crop&auto=format", lowestPrice: 112000, originalPrice: 150000, offerCount: 8 },
  { id: 4,  title: "Dám Nghĩ Lớn",               author: "D.J. Schwartz", category: "Kỹ năng sống", coverUrl: "https://images.unsplash.com/photo-1530973428-5bf2db2e4d71?w=300&h=420&fit=crop&auto=format", lowestPrice: 55000,  originalPrice: 83000,  offerCount: 6 },
  { id: 6,  title: "7 Thói Quen Hiệu Quả",        author: "S. R. Covey",   category: "Kỹ năng sống", coverUrl: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=300&h=420&fit=crop&auto=format", lowestPrice: 89000,  originalPrice: 120000, offerCount: 7 },
];

// ─── Cover Carousel ───────────────────────────────────────────────────────────

function CoverCarousel({ images }: { images: string[] }) {
  const [idx, setIdx] = useState(0);
  const go = (dir: -1 | 1) => setIdx(i => (i + dir + images.length) % images.length);

  return (
    <div className="relative flex flex-col gap-3 select-none">
      <div className="relative overflow-hidden" style={{ border: border2 }}>
        <img src={images[idx]} alt={`Cover ${idx + 1}`} className="w-full object-cover" style={{ height: 380, display: "block" }} />
        <div className="absolute top-4 left-4 px-3 py-1 text-[11px] font-bold uppercase tracking-widest"
          style={{ background: C.primary, color: C.white, fontFamily: FONT, border: border2, boxShadow: shadow4 }}>
          {product.category}
        </div>
      </div>
      <div className="flex items-center justify-between px-1">
        <button onClick={() => go(-1)} className="w-8 h-8 flex items-center justify-center"
          style={{ border: border2, background: C.white, boxShadow: shadow4 }} aria-label="Trước">
          <ChevronLeft size={16} />
        </button>
        <div className="flex gap-2">
          {images.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)}
              style={{ width: i === idx ? 20 : 8, height: 8, background: i === idx ? C.primary : C.outlineVariant, border: border2, transition: "width 200ms" }}
              aria-label={`Ảnh ${i + 1}`} />
          ))}
        </div>
        <button onClick={() => go(1)} className="w-8 h-8 flex items-center justify-center"
          style={{ border: border2, background: C.white, boxShadow: shadow4 }} aria-label="Tiếp">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

// ─── 1. Hero Section ──────────────────────────────────────────────────────────

function HeroSection() {
  const [wishlisted, setWishlisted] = useState(false);
  const cheapest = retailers.find(r => r.status === "available" && r.price !== null);

  return (
    <section style={{ background: C.surfaceLow, border: border4, boxShadow: shadow8 }}>
      <div className="p-8 md:p-12 flex flex-col lg:flex-row gap-10 lg:gap-14">
        {/* Left: Cover carousel */}
        <div className="shrink-0 w-full lg:w-72">
          <CoverCarousel images={product.coverImages} />
        </div>

        {/* Right: Metadata */}
        <div className="flex flex-col gap-5 flex-1 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: C.outline, fontFamily: FONT }}>
            Trang chủ / {product.category} / {product.title}
          </p>

          <h1 style={{ fontFamily: FONT, fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.02em", color: C.black }}>
            {product.title}
          </h1>

          <div className="flex flex-wrap gap-x-6 gap-y-1">
            <span className="text-[13px]" style={{ fontFamily: FONT, color: C.onSurfaceVariant }}>
              Tác giả: <strong style={{ color: C.onSurface }}>{product.author}</strong>
            </span>
            <span className="text-[13px]" style={{ fontFamily: FONT, color: C.onSurfaceVariant }}>
              NXB: <strong style={{ color: C.onSurface }}>{product.publisher}</strong>
            </span>
          </div>

          <blockquote className="pl-5 py-1" style={{ borderLeft: `5px solid ${C.primary}` }}>
            <p className="text-[14px] italic leading-relaxed" style={{ fontFamily: FONT, color: C.onSurfaceVariant }}>
              "{product.description}"
            </p>
          </blockquote>

          {/* Price box + Wishlist side by side */}
          {cheapest && cheapest.price !== null && (
            <div className="flex items-center gap-4 flex-wrap">
              {/* Giá Tốt Nhất box */}
              <div className="p-4 flex flex-col gap-1.5" style={{ background: C.primaryFixed, border: border4, boxShadow: shadow8 }}>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ fontFamily: FONT, color: C.primary }}>
                  Giá Tốt Nhất Hiện Tại
                </p>
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span style={{ fontFamily: FONT, fontSize: "clamp(28px,4vw,42px)", fontWeight: 800, color: C.primary, lineHeight: 1, letterSpacing: "-0.02em" }}>
                    {fmt(cheapest.price)}
                  </span>
                  {cheapest.originalPrice && (
                    <span className="text-[16px] line-through" style={{ fontFamily: FONT, color: C.outline }}>
                      {fmt(cheapest.originalPrice)}
                    </span>
                  )}
                  <span className="px-2 py-0.5 text-[11px] font-bold uppercase"
                    style={{ background: C.secondary, color: C.white, fontFamily: FONT, border: border2 }}>
                    -{Math.round((1 - cheapest.price / (cheapest.originalPrice ?? cheapest.price)) * 100)}%
                  </span>
                </div>
                <p className="text-[10px] italic" style={{ fontFamily: FONT, color: C.primary, opacity: 0.55 }}>
                  Giá tham khảo được ghi nhận gần đây, vui lòng kiểm tra lại tại nơi bán trước khi mua.
                </p>
              </div>

              {/* Wishlist button — vertically centered */}
              <button onClick={() => setWishlisted(w => !w)}
                className="self-center flex flex-col items-center justify-center gap-1.5 px-5 py-4 font-bold text-[11px] uppercase tracking-wide"
                style={{ border: border2, background: wishlisted ? C.secondary : C.white, color: wishlisted ? C.white : C.onSurface, fontFamily: FONT, boxShadow: shadow4, minWidth: 90 }}>
                <Heart size={20} style={{ fill: wishlisted ? C.white : "none", strokeWidth: 2 }} />
                {wishlisted ? "Đã lưu" : "Thêm vào Wishlist"}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── 2. Retailer List ─────────────────────────────────────────────────────────

function RetailerList() {
  const available  = retailers.filter(r => r.status === "available");
  const unavailable = retailers.filter(r => r.status !== "available");
  const cheapestId = available.reduce((best, r) => r.price! < best.price! ? r : best, available[0])?.id;

  function RetailerRow({ retailer }: { retailer: Retailer }) {
    const isCheapest = retailer.id === cheapestId && retailer.status === "available";
    const isUnavailable = retailer.status !== "available";

    return (
      <div className="flex items-center gap-4 px-4 py-3"
        style={{
          background: isCheapest ? C.primaryFixed : isUnavailable ? C.surfaceVariant : C.white,
          border: isUnavailable ? `2px dashed ${C.outlineVariant}` : border2,
          borderLeft: isCheapest ? `8px solid ${C.primary}` : isUnavailable ? `2px dashed ${C.outlineVariant}` : border2,
          boxShadow: isCheapest ? shadow4 : "none",
          opacity: isUnavailable ? 0.65 : 1,
          filter: isUnavailable ? "grayscale(30%)" : "none",
        }}>
        {/* Seller name + status badge */}
        <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
          <span className="font-extrabold text-[15px]" style={{ fontFamily: FONT, color: isUnavailable ? C.outline : C.onSurface }}>
            {retailer.name}
          </span>
          {isCheapest && (
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide shrink-0"
              style={{ background: C.primary, color: C.white, fontFamily: FONT, border: border2 }}>
              Rẻ Nhất
            </span>
          )}
          {retailer.status === "unavailable" && (
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase shrink-0"
              style={{ background: C.surfaceHigh, color: C.outline, fontFamily: FONT, border: `1px solid ${C.outlineVariant}` }}>
              Tạm hết hàng
            </span>
          )}
          {retailer.status === "no_link" && (
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase shrink-0"
              style={{ background: C.surfaceHigh, color: C.outline, fontFamily: FONT, border: `1px solid ${C.outlineVariant}` }}>
              Chưa có liên kết mua
            </span>
          )}
        </div>

        {/* Price + CTA */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            {retailer.price !== null ? (
              <>
                <p className="font-extrabold text-[20px] leading-none" style={{ fontFamily: FONT, color: isCheapest ? C.primary : C.onSurface }}>
                  {fmt(retailer.price)}
                </p>
                {retailer.originalPrice && (
                  <p className="text-[11px] line-through" style={{ fontFamily: FONT, color: C.outline }}>
                    {fmt(retailer.originalPrice)}
                  </p>
                )}
              </>
            ) : (
              <p className="text-[12px] italic" style={{ fontFamily: FONT, color: C.outline }}>Không có giá</p>
            )}
          </div>
          {retailer.status === "available" ? (
            <button className="flex items-center gap-2 px-4 py-2.5 font-bold uppercase text-[11px] tracking-wide whitespace-nowrap"
              style={{
                background: isCheapest ? C.primary : C.boneWhite,
                color: isCheapest ? C.white : C.onSurface,
                fontFamily: FONT, border: border2, boxShadow: shadow4,
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translate(4px,4px)"; e.currentTarget.style.boxShadow = "none"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = shadow4; }}>
              <ExternalLink size={12} />
              Mua Ngay
            </button>
          ) : (
            <button disabled className="px-4 py-2.5 font-bold uppercase text-[11px] tracking-wide"
              style={{ background: C.surfaceHigh, color: C.outline, fontFamily: FONT, border: `1px solid ${C.outlineVariant}`, cursor: "not-allowed" }}>
              Không có sẵn
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <section>
      <div className="pb-4 mb-6" style={{ borderBottom: `4px solid ${C.black}` }}>
        <h2 className="font-extrabold uppercase text-[22px] tracking-tight" style={{ fontFamily: FONT, color: C.onSurface, letterSpacing: "-0.01em" }}>
          Bảng Giá Thị Trường
        </h2>
        <p className="text-[13px] mt-1" style={{ fontFamily: FONT, color: C.onSurfaceVariant }}>
          So sánh giá từ {available.length} nơi bán có hàng
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {available.map(r => <RetailerRow key={r.id} retailer={r} />)}
        {unavailable.length > 0 && (
          <>
            <p className="text-[11px] font-bold uppercase tracking-widest mt-2" style={{ fontFamily: FONT, color: C.outline }}>
              Không có sẵn
            </p>
            {unavailable.map(r => <RetailerRow key={r.id} retailer={r} />)}
          </>
        )}
      </div>
    </section>
  );
}

// ─── 3. Technical Details & Price History ─────────────────────────────────────

function TechnicalDetails() {
  const [alertEmail, setAlertEmail] = useState("");

  const details = [
    { label: "Tác giả",        value: product.author },
    { label: "Nhà xuất bản",   value: product.publisher },
    { label: "Ngày phát hành", value: product.releaseDate },
    { label: "Số trang",       value: `${product.pages} trang` },
    { label: "ISBN",           value: product.isbn },
    { label: "Kích thước",     value: product.dimensions },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Chi Tiết Sách */}
      <div style={{ border: border2, boxShadow: shadow8 }}>
        <div className="px-5 py-3" style={{ background: C.onSurface, borderBottom: border2 }}>
          <h3 className="font-extrabold uppercase text-[13px] tracking-widest" style={{ fontFamily: FONT, color: C.white }}>
            Chi Tiết Sách
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2" style={{ background: C.boneWhite }}>
          {details.map(({ label, value }, i) => (
            <div key={label} className="px-5 py-3" style={{ borderBottom: `1px solid ${C.outlineVariant}`, borderRight: i % 2 === 0 ? `1px solid ${C.outlineVariant}` : "none" }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ fontFamily: FONT, color: C.outline }}>{label}</p>
              <p className="text-[14px] font-bold" style={{ fontFamily: FONT, color: C.onSurface }}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Lịch Sử Giá */}
      <div style={{ border: border2, boxShadow: shadow8 }}>
        <div className="px-5 py-3" style={{ background: C.onSurface, borderBottom: border2 }}>
          <h3 className="font-extrabold uppercase text-[13px] tracking-widest" style={{ fontFamily: FONT, color: C.white }}>
            Lịch Sử Giá
          </h3>
        </div>
        <div className="p-5 flex flex-col gap-4" style={{ background: C.white }}>
          <div style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={priceHistory} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.primary} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={C.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.outlineVariant} />
                <XAxis dataKey="date" tick={{ fontFamily: FONT, fontSize: 10, fill: C.outline }} />
                <YAxis tick={{ fontFamily: FONT, fontSize: 10, fill: C.outline }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ fontFamily: FONT, fontSize: 12, border: border2, background: C.white, borderRadius: 0 }}
                  formatter={(v: number) => [fmt(v), "Giá"]}
                />
                <Area type="monotone" dataKey="price" stroke={C.primary} strokeWidth={2} fill="url(#priceGrad)" dot={{ fill: C.primary, stroke: C.black, strokeWidth: 2, r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Alert form */}
          <div className="pt-3" style={{ borderTop: border2 }}>
            <p className="text-[12px] font-bold uppercase tracking-widest mb-1" style={{ fontFamily: FONT, color: C.outline }}>
              Đặt thông báo giá
            </p>
            <p className="text-[12px] leading-relaxed mb-3" style={{ fontFamily: FONT, color: C.onSurfaceVariant }}>
              Đừng bỏ lỡ deal hời! Chúng tôi sẽ email cho bạn ngay khi <strong style={{ color: C.onSurface }}>{product.title}</strong> giảm giá.
            </p>
            <div className="flex gap-2 flex-wrap">
              <input type="email" placeholder="Email của bạn" value={alertEmail} onChange={e => setAlertEmail(e.target.value)}
                className="flex-1 px-3 py-2 text-[13px] outline-none min-w-0"
                style={{ border: border2, fontFamily: FONT, background: C.white, minWidth: 160 }} />
              <button className="px-5 py-2 font-bold uppercase text-[11px] tracking-wider"
                style={{ background: C.primary, color: C.white, fontFamily: FONT, border: border2, boxShadow: shadow4, whiteSpace: "nowrap" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translate(4px,4px)"; e.currentTarget.style.boxShadow = "none"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = shadow4; }}>
                ĐĂNG KÝ
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 4. Related Books Grid ────────────────────────────────────────────────────

function RelatedBooks() {
  return (
    <section>
      <div className="pb-4 mb-6" style={{ borderBottom: `4px solid ${C.black}` }}>
        <h2 className="font-extrabold uppercase text-[22px] tracking-tight" style={{ fontFamily: FONT, color: C.onSurface, letterSpacing: "-0.01em" }}>
          Sách Liên Quan
        </h2>
      </div>
      <div className="flex flex-wrap gap-5">
        {relatedBooks.map(book => (
          <DealBookCard key={book.id} book={book} compact />
        ))}
      </div>
    </section>
  );
}

// ─── 5. Disclaimer Block ──────────────────────────────────────────────────────

function DisclaimerBlock() {
  return (
    <div className="flex gap-5 p-6 md:p-8" style={{ background: C.primaryFixed, border: border4, boxShadow: shadow8 }}>
      <div className="shrink-0 mt-1">
        <Info size={28} style={{ color: C.primary }} strokeWidth={2.5} />
      </div>
      <div className="flex flex-col gap-2">
        <p className="font-extrabold uppercase tracking-widest text-[12px]" style={{ fontFamily: FONT, color: C.primary }}>
          Lưu ý về giá & liên kết
        </p>
        <p className="text-[14px] leading-relaxed" style={{ fontFamily: FONT, color: C.onSurface }}>
          Tất cả giá hiển thị trên DealSach là <strong>giá tham khảo</strong> được ghi nhận gần đây từ các nhà bán lẻ bên ngoài. Giá thực tế có thể thay đổi bất kỳ lúc nào — vui lòng kiểm tra lại tại nơi bán trước khi mua.
        </p>
        <p className="text-[13px] leading-relaxed" style={{ fontFamily: FONT, color: C.onSurfaceVariant }}>
          DealSach không bán sách trực tiếp, không xử lý thanh toán, và không chịu trách nhiệm về giao hàng, đổi trả, hay hỗ trợ đơn hàng. Khi nhấn "Mua Ngay", bạn sẽ được chuyển đến trang của nhà bán lẻ tương ứng. Một số liên kết có thể là liên kết tiếp thị liên kết (affiliate).
        </p>
      </div>
    </div>
  );
}

// ─── ProductDetailPage ────────────────────────────────────────────────────────

export default function ProductDetailPage() {
  return (
    <main className="max-w-[1200px] mx-auto px-4 sm:px-8 py-10 flex flex-col gap-12">
      <HeroSection />
      <RetailerList />
      <TechnicalDetails />
      <RelatedBooks />
      <DisclaimerBlock />
    </main>
  );
}
