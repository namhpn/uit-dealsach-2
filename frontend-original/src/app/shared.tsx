import { useState, useRef, useCallback } from "react";
import { Heart, ChevronLeft, ChevronRight, TrendingDown, Flame, Star } from "lucide-react";
import { useNavigate } from "react-router";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Book {
  id: number;
  title: string;
  author: string;
  category: string;
  coverUrl: string;
  lowestPrice: number | null;
  originalPrice?: number;
  offerCount: number;
  status?: "no_link" | "out_of_stock" | "stale_price" | "no_offer";
  priceDropAmount?: number;
  topRetailer?: string;
  redirectCount?: number;
}

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

export interface FeaturedCategory { name: string; books: Book[] }

// ─── Palette ─────────────────────────────────────────────────────────────────

export const C = {
  primary:           "#003527",
  primaryContainer:  "#064e3b",
  onPrimary:         "#ffffff",
  primaryFixed:      "#b0f0d6",
  surface:           "#fcf9f8",
  surfaceLow:        "#f6f3f2",
  surfaceContainer:  "#f0eded",
  surfaceVariant:    "#e5e2e1",
  surfaceHigh:       "#eae7e7",
  onSurface:         "#1b1c1c",
  onSurfaceVariant:  "#404944",
  outline:           "#707974",
  outlineVariant:    "#bfc9c3",
  secondary:         "#ba1a1a",
  white:             "#ffffff",
  black:             "#000000",
  earthGray:         "#7C95A8",
  boneWhite:         "#ECE9E2",
} as const;

export const FONT = "'Be Vietnam Pro', sans-serif";

export const shadow4  = "4px 4px 0 #000000";
export const shadow8  = "8px 8px 0 #000000";
export const border2  = `2px solid ${C.black}`;
export const border3  = `3px solid ${C.black}`;
export const border4  = `4px solid ${C.black}`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

export const fmt = (n: number) => n.toLocaleString("vi-VN") + " đ";

export const statusLabel: Record<NonNullable<Book["status"]>, string> = {
  no_link:      "Chưa có liên kết mua hợp lệ",
  out_of_stock: "Tạm hết hàng",
  stale_price:  "Giá tham khảo cũ",
  no_offer:     "Chưa có ưu đãi",
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

export const navCategories = [
  "Văn học Việt Nam", "Văn học nước ngoài", "Kỹ năng sống",
  "Tài chính", "Lịch sử", "Tâm lý học", "Thiếu nhi",
];

export const dealBanners: DealBanner[] = [
  { id: 1, headline: "Sách Kỹ Năng Sống — Giảm Đến 45%", sub: "Hàng trăm đầu sách từ Tiki, Fahasa, Lazada đang giảm sâu tuần này.", cta: "Xem ưu đãi", bg: C.primary, textColor: C.white, imageUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=480&h=320&fit=crop&auto=format", badgeLabel: "TUẦN NÀY" },
  { id: 2, headline: "Văn Học Cổ Điển — Giá Tốt Nhất Tháng", sub: "Tolstoy, Dostoevsky, Camus — so sánh giá ngay để không bỏ lỡ.", cta: "Khám phá ngay", bg: C.secondary, textColor: C.white, imageUrl: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=480&h=320&fit=crop&auto=format", badgeLabel: "NỔI BẬT" },
  { id: 3, headline: "Sách Thiếu Nhi — Ưu Đãi Hè 2026", sub: "Tìm và so sánh giá sách thiếu nhi từ 12 nhà bán lẻ trên DealSach.", cta: "So sánh giá", bg: C.earthGray, textColor: C.black, imageUrl: "https://images.unsplash.com/photo-1576872381149-7847515ce5d8?w=480&h=320&fit=crop&auto=format", badgeLabel: "MÙA HÈ" },
  { id: 4, headline: "Top Sách Kinh Tế — Giảm Giá Sốc", sub: "Rich Dad Poor Dad, Atomic Habits và nhiều hơn nữa — đang rẻ nhất tuần.", cta: "Xem danh sách", bg: C.primaryContainer, textColor: C.white, imageUrl: "https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=480&h=320&fit=crop&auto=format", badgeLabel: "HOT DEAL" },
];

export const featuredCategories: FeaturedCategory[] = [
  { name: "Kỹ Năng Sống", books: [
    { id: 1,  title: "Đắc Nhân Tâm",               author: "Dale Carnegie",           category: "Kỹ năng sống",       coverUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=200&h=280&fit=crop&auto=format", lowestPrice: 68000,  originalPrice: 98000,  offerCount: 5 },
    { id: 2,  title: "Tôi Tài Giỏi, Bạn Cũng Thế", author: "Adam Khoo",              category: "Kỹ năng sống",       coverUrl: "https://images.unsplash.com/photo-1589998059171-988d887df646?w=200&h=280&fit=crop&auto=format", lowestPrice: 95000,  originalPrice: 130000, offerCount: 4 },
    { id: 3,  title: "Cà Phê Cùng Tony",            author: "Tony Buổi Sáng",         category: "Kỹ năng sống",       coverUrl: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=200&h=280&fit=crop&auto=format", lowestPrice: 61000,  originalPrice: 80000,  offerCount: 8 },
    { id: 4,  title: "Dám Nghĩ Lớn",                author: "David J. Schwartz",      category: "Kỹ năng sống",       coverUrl: "https://images.unsplash.com/photo-1530973428-5bf2db2e4d71?w=200&h=280&fit=crop&auto=format", lowestPrice: 55000,  originalPrice: 83000,  offerCount: 6 },
    { id: 5,  title: "Atomic Habits",                author: "James Clear",            category: "Kỹ năng sống",       coverUrl: "https://images.unsplash.com/photo-1592496431122-2349e0fbc666?w=200&h=280&fit=crop&auto=format", lowestPrice: 112000, originalPrice: 150000, offerCount: 8 },
    { id: 6,  title: "7 Thói Quen Hiệu Quả",         author: "Stephen R. Covey",       category: "Kỹ năng sống",       coverUrl: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=200&h=280&fit=crop&auto=format", lowestPrice: 89000,  originalPrice: 120000, offerCount: 7 },
  ]},
  { name: "Văn Học Nước Ngoài", books: [
    { id: 7,  title: "Nhà Giả Kim",                 author: "Paulo Coelho",            category: "Văn học nước ngoài", coverUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=200&h=280&fit=crop&auto=format", lowestPrice: 72000,  originalPrice: 95000,  offerCount: 7 },
    { id: 8,  title: "Không Gia Đình",               author: "Hector Malot",            category: "Văn học nước ngoài", coverUrl: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&h=280&fit=crop&auto=format", lowestPrice: 54000,  originalPrice: 72000,  offerCount: 3 },
    { id: 9,  title: "Hoàng Tử Bé",                 author: "Antoine de Saint-Exupéry",category: "Văn học nước ngoài", coverUrl: "https://images.unsplash.com/photo-1576872381149-7847515ce5d8?w=200&h=280&fit=crop&auto=format", lowestPrice: 42000,  originalPrice: 60000,  offerCount: 11 },
    { id: 10, title: "Chiến Tranh Và Hòa Bình",      author: "Leo Tolstoy",             category: "Văn học cổ điển",    coverUrl: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=200&h=280&fit=crop&auto=format", lowestPrice: 210000, originalPrice: 265000, offerCount: 4 },
    { id: 11, title: "Dune — Hành Tinh Cát",         author: "Frank Herbert",           category: "Văn học nước ngoài", coverUrl: "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=200&h=280&fit=crop&auto=format", lowestPrice: 195000, originalPrice: 249000, offerCount: 5 },
    { id: 12, title: "Mắt Biếc",                    author: "Nguyễn Nhật Ánh",         category: "Văn học Việt Nam",   coverUrl: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=200&h=280&fit=crop&auto=format", lowestPrice: 65000,  originalPrice: 88000,  offerCount: 12 },
  ]},
  { name: "Tài Chính & Đầu Tư", books: [
    { id: 13, title: "Bố Già Dạy Con Làm Giàu",     author: "Robert T. Kiyosaki",      category: "Tài chính",          coverUrl: "https://images.unsplash.com/photo-1604866830893-c13cafa515d5?w=200&h=280&fit=crop&auto=format", lowestPrice: 88000,  originalPrice: 120000, offerCount: 9 },
    { id: 14, title: "Nghĩ Giàu Làm Giàu",          author: "Napoleon Hill",            category: "Tài chính",          coverUrl: "https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=200&h=280&fit=crop&auto=format", lowestPrice: 75000,  originalPrice: 100000, offerCount: 7 },
    { id: 15, title: "Người Giàu Nhất Thành Babylon",author: "George S. Clason",        category: "Tài chính",          coverUrl: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=200&h=280&fit=crop&auto=format", lowestPrice: 58000,  originalPrice: 80000,  offerCount: 10 },
    { id: 16, title: "Tư Duy Nhanh Và Chậm",        author: "Daniel Kahneman",          category: "Tâm lý học",         coverUrl: "https://images.unsplash.com/photo-1546521343-4eb2c01aa44b?w=200&h=280&fit=crop&auto=format", lowestPrice: 120000, originalPrice: 160000, offerCount: 5 },
    { id: 17, title: "Bí Quyết Tăng Trưởng",        author: "Andrew Chen",              category: "Tài chính",          coverUrl: "https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=200&h=280&fit=crop&auto=format", lowestPrice: 98000,  originalPrice: 135000, offerCount: 4 },
    { id: 18, title: "Sapiens: Lược Sử Loài Người",  author: "Yuval Noah Harari",       category: "Lịch sử",            coverUrl: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=200&h=280&fit=crop&auto=format", lowestPrice: 148000, originalPrice: 199000, offerCount: 6 },
  ]},
  { name: "Lịch Sử & Khoa Học", books: [
    { id: 19, title: "Sapiens: Lược Sử Loài Người",  author: "Yuval Noah Harari",       category: "Lịch sử",            coverUrl: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=200&h=280&fit=crop&auto=format", lowestPrice: 148000, originalPrice: 199000, offerCount: 6 },
    { id: 20, title: "Truyện Kiều",                  author: "Nguyễn Du",               category: "Văn học Việt Nam",   coverUrl: "https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=200&h=280&fit=crop&auto=format", lowestPrice: 35000,  originalPrice: 48000,  offerCount: 14 },
    { id: 21, title: "Tuổi Thơ Dữ Dội",             author: "Phùng Quán",              category: "Văn học Việt Nam",   coverUrl: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=200&h=280&fit=crop&auto=format", lowestPrice: 78000,  originalPrice: 105000, offerCount: 6 },
    { id: 22, title: "Lịch Sử Triết Học",            author: "Will Durant",              category: "Lịch sử",            coverUrl: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=200&h=280&fit=crop&auto=format", lowestPrice: 175000, originalPrice: 220000, offerCount: 3 },
    { id: 23, title: "Vũ Trụ Trong Vỏ Hạt Dẻ",      author: "Stephen Hawking",         category: "Khoa học",           coverUrl: "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=200&h=280&fit=crop&auto=format", lowestPrice: 132000, originalPrice: 175000, offerCount: 5 },
    { id: 24, title: "Súng, Vi Trùng Và Thép",       author: "Jared Diamond",            category: "Lịch sử",            coverUrl: "https://images.unsplash.com/photo-1604866830893-c13cafa515d5?w=200&h=280&fit=crop&auto=format", lowestPrice: 162000, originalPrice: 210000, offerCount: 4 },
  ]},
  { name: "Văn Học Việt Nam", books: [
    { id: 25, title: "Mắt Biếc",                    author: "Nguyễn Nhật Ánh",         category: "Văn học Việt Nam",   coverUrl: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=200&h=280&fit=crop&auto=format", lowestPrice: 65000,  originalPrice: 88000,  offerCount: 12 },
    { id: 26, title: "Truyện Kiều",                  author: "Nguyễn Du",               category: "Văn học Việt Nam",   coverUrl: "https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=200&h=280&fit=crop&auto=format", lowestPrice: 35000,  originalPrice: 48000,  offerCount: 14 },
    { id: 27, title: "Tuổi Thơ Dữ Dội",             author: "Phùng Quán",              category: "Văn học Việt Nam",   coverUrl: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=200&h=280&fit=crop&auto=format", lowestPrice: 78000,  originalPrice: 105000, offerCount: 6 },
    { id: 28, title: "Số Đỏ",                        author: "Vũ Trọng Phụng",          category: "Văn học Việt Nam",   coverUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=200&h=280&fit=crop&auto=format", lowestPrice: 42000,  originalPrice: 58000,  offerCount: 9 },
    { id: 29, title: "Chí Phèo",                     author: "Nam Cao",                 category: "Văn học Việt Nam",   coverUrl: "https://images.unsplash.com/photo-1589998059171-988d887df646?w=200&h=280&fit=crop&auto=format", lowestPrice: 38000,  originalPrice: 52000,  offerCount: 8 },
    { id: 30, title: "Dế Mèn Phiêu Lưu Ký",         author: "Tô Hoài",                 category: "Thiếu nhi",          coverUrl: "https://images.unsplash.com/photo-1576872381149-7847515ce5d8?w=200&h=280&fit=crop&auto=format", lowestPrice: 29000,  originalPrice: 42000,  offerCount: 16 },
  ]},
];

export const priceDropBooks: Book[] = [
  { id: 101, title: "Bố Già Dạy Con Làm Giàu",   author: "Robert T. Kiyosaki", category: "Tài chính",          coverUrl: "https://images.unsplash.com/photo-1604866830893-c13cafa515d5?w=200&h=280&fit=crop&auto=format", lowestPrice: 88000,  originalPrice: 120000, offerCount: 9,  priceDropAmount: 32000 },
  { id: 102, title: "Dám Nghĩ Lớn",              author: "David J. Schwartz",  category: "Kỹ năng sống",       coverUrl: "https://images.unsplash.com/photo-1530973428-5bf2db2e4d71?w=200&h=280&fit=crop&auto=format", lowestPrice: 55000,  originalPrice: 83000,  offerCount: 6,  priceDropAmount: 28000 },
  { id: 103, title: "Chiến Tranh Và Hòa Bình",   author: "Leo Tolstoy",        category: "Văn học cổ điển",    coverUrl: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=200&h=280&fit=crop&auto=format", lowestPrice: 210000, originalPrice: 265000, offerCount: 4,  priceDropAmount: 55000 },
  { id: 104, title: "Tư Duy Nhanh Và Chậm",      author: "Daniel Kahneman",    category: "Tâm lý học",         coverUrl: "https://images.unsplash.com/photo-1546521343-4eb2c01aa44b?w=200&h=280&fit=crop&auto=format", lowestPrice: 120000, originalPrice: 160000, offerCount: 5,  priceDropAmount: 40000 },
  { id: 105, title: "Hoàng Tử Bé",               author: "A. de Saint-Exupéry",category: "Văn học nước ngoài", coverUrl: "https://images.unsplash.com/photo-1576872381149-7847515ce5d8?w=200&h=280&fit=crop&auto=format", lowestPrice: 42000,  originalPrice: 60000,  offerCount: 11, priceDropAmount: 18000 },
  { id: 106, title: "Nghĩ Giàu Làm Giàu",        author: "Napoleon Hill",      category: "Tài chính",          coverUrl: "https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=200&h=280&fit=crop&auto=format", lowestPrice: 75000,  originalPrice: 100000, offerCount: 7,  priceDropAmount: 25000 },
  { id: 107, title: "Mắt Biếc",                  author: "Nguyễn Nhật Ánh",   category: "Văn học Việt Nam",   coverUrl: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=200&h=280&fit=crop&auto=format", lowestPrice: 65000,  originalPrice: 88000,  offerCount: 12, priceDropAmount: 23000 },
  { id: 108, title: "Nhà Giả Kim",               author: "Paulo Coelho",       category: "Văn học nước ngoài", coverUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=200&h=280&fit=crop&auto=format", lowestPrice: 72000,  originalPrice: 95000,  offerCount: 7,  priceDropAmount: 23000 },
];

export const popularDeals: Book[] = [
  { id: 201, title: "Atomic Habits",                  author: "James Clear",        category: "Kỹ năng sống",        coverUrl: "https://images.unsplash.com/photo-1592496431122-2349e0fbc666?w=200&h=280&fit=crop&auto=format", lowestPrice: 112000, originalPrice: 150000, offerCount: 8,  redirectCount: 1842, topRetailer: "Tiki" },
  { id: 202, title: "Dune — Hành Tinh Cát",           author: "Frank Herbert",      category: "Khoa học viễn tưởng", coverUrl: "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=200&h=280&fit=crop&auto=format", lowestPrice: 195000, originalPrice: 249000, offerCount: 5,  redirectCount: 1230, topRetailer: "Fahasa" },
  { id: 203, title: "Truyện Kiều",                    author: "Nguyễn Du",          category: "Văn học Việt Nam",    coverUrl: "https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=200&h=280&fit=crop&auto=format", lowestPrice: 35000,  originalPrice: 48000,  offerCount: 14, redirectCount: 987,  topRetailer: "Shopee" },
  { id: 204, title: "Người Giàu Nhất Thành Babylon",  author: "George S. Clason",   category: "Tài chính",           coverUrl: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=200&h=280&fit=crop&auto=format", lowestPrice: 58000,  originalPrice: 80000,  offerCount: 10, redirectCount: 876,  topRetailer: "Lazada" },
  { id: 205, title: "Mắt Biếc",                       author: "Nguyễn Nhật Ánh",   category: "Văn học Việt Nam",    coverUrl: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=200&h=280&fit=crop&auto=format", lowestPrice: 65000,  originalPrice: 88000,  offerCount: 12, redirectCount: 754,  topRetailer: "Tiki" },
  { id: 206, title: "Tuổi Thơ Dữ Dội",               author: "Phùng Quán",         category: "Văn học Việt Nam",    coverUrl: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=200&h=280&fit=crop&auto=format", lowestPrice: 78000,  originalPrice: 105000, offerCount: 6,  redirectCount: 621,  topRetailer: "Fahasa" },
  { id: 207, title: "Đắc Nhân Tâm",                  author: "Dale Carnegie",      category: "Kỹ năng sống",        coverUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=200&h=280&fit=crop&auto=format", lowestPrice: 68000,  originalPrice: 98000,  offerCount: 5,  redirectCount: 589,  topRetailer: "Tiki" },
  { id: 208, title: "Sapiens",                        author: "Yuval Noah Harari",  category: "Lịch sử",             coverUrl: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=200&h=280&fit=crop&auto=format", lowestPrice: 148000, originalPrice: 199000, offerCount: 6,  redirectCount: 502,  topRetailer: "Fahasa" },
];

// ─── NbButton ─────────────────────────────────────────────────────────────────

export function NbButton({
  children, onClick, variant = "primary", className = "", style: extra = {}, small = false,
}: {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  style?: React.CSSProperties;
  small?: boolean;
}) {
  const [pressed, setPressed] = useState(false);
  const bg = variant === "primary" ? C.primary : variant === "secondary" ? C.boneWhite : C.white;
  const color = variant === "primary" ? C.white : C.black;
  return (
    <button onClick={onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      className={className}
      style={{
        background: bg, color, fontFamily: FONT, fontWeight: 700,
        fontSize: small ? 12 : 14, border: border2,
        padding: small ? "4px 12px" : "8px 20px", cursor: "pointer",
        display: "inline-flex", alignItems: "center", gap: 6,
        boxShadow: pressed ? "none" : shadow4,
        transform: pressed ? "translate(4px,4px)" : "none",
        transition: "box-shadow 80ms, transform 80ms", ...extra,
      }}
    >{children}</button>
  );
}

// ─── CategoryChip ─────────────────────────────────────────────────────────────

export function CategoryChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const on = active || hovered;
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="shrink-0 whitespace-nowrap px-3 py-1 text-[10px] font-bold uppercase tracking-wide"
      style={{
        fontFamily: FONT, background: on ? C.primary : C.boneWhite,
        color: on ? C.white : C.onSurface, border: border2,
        boxShadow: on ? "none" : shadow4,
        transform: on ? "translate(4px,4px)" : "none",
        transition: "background 80ms, color 80ms, box-shadow 80ms, transform 80ms", cursor: "pointer",
      }}
    >{label}</button>
  );
}

// ─── BookCard (compact, for featured carousel) ────────────────────────────────

export function BookCard({ book }: { book: Book }) {
  const navigate = useNavigate();
  const [wishlisted, setWishlisted] = useState(false);
  const [pressed, setPressed] = useState(false);
  return (
    <div className="flex flex-col overflow-hidden cursor-pointer"
      onClick={() => navigate(`/book/${book.id}`)}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{ background: C.white, border: border2, boxShadow: pressed ? "none" : shadow4, transform: pressed ? "translate(4px,4px)" : "none", transition: "box-shadow 80ms, transform 80ms" }}
    >
      <div className="relative shrink-0 overflow-hidden" style={{ background: C.surfaceContainer, aspectRatio: "2/3", maxHeight: 220, borderBottom: border2 }}>
        <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
        <button onClick={(e) => { e.stopPropagation(); setWishlisted(w => !w); }}
          className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center"
          style={{ background: C.white, border: border2 }}>
          <Heart size={13} style={{ color: wishlisted ? C.secondary : C.black, fill: wishlisted ? C.secondary : "none" }} />
        </button>
      </div>
      <div className="p-3 flex flex-col gap-1 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider leading-none" style={{ color: C.outline, fontFamily: FONT }}>{book.category}</p>
        <h3 className="text-[13px] font-bold leading-snug line-clamp-2 mt-0.5" style={{ color: C.onSurface, fontFamily: FONT }}>{book.title}</h3>
        <p className="text-[11px]" style={{ color: C.onSurfaceVariant, fontFamily: FONT }}>{book.author}</p>
        <div className="mt-auto pt-3 flex flex-col gap-1">
          {book.lowestPrice !== null ? (
            <>
              <p className="font-bold text-[15px] leading-none" style={{ color: C.secondary, fontFamily: FONT }}>{fmt(book.lowestPrice)}</p>
              {book.originalPrice && <p className="text-[11px] leading-none line-through" style={{ color: C.outline, fontFamily: FONT }}>{fmt(book.originalPrice)}</p>}
            </>
          ) : book.status ? (
            <p className="text-[10px] italic leading-tight" style={{ color: C.outline, fontFamily: FONT }}>{statusLabel[book.status]}</p>
          ) : null}
          <span className="mt-1.5 self-start text-[10px] font-bold px-1.5 py-0.5 uppercase" style={{ background: C.boneWhite, color: C.onSurface, fontFamily: FONT, border: "1px solid #000" }}>{book.offerCount} nơi bán</span>
        </div>
      </div>
    </div>
  );
}

export function BookCarousel({ books }: { books: Book[] }) {
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
      <button onClick={() => scroll(-1)} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-8 h-8 flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity" style={{ background: C.white, border: border2, boxShadow: shadow4, color: C.black }} aria-label="Trước"><ChevronLeft size={17} /></button>
      <div ref={trackRef} className="flex overflow-x-auto" style={{ scrollbarWidth: "none", scrollSnapType: "x mandatory", gap: 20, paddingBottom: 12, paddingRight: 8 }}>
        {books.map(book => (
          <div key={book.id} data-card className="shrink-0" style={{ scrollSnapAlign: "start", width: "calc((100% - 80px) / 4)", minWidth: 152, maxWidth: 210 }}>
            <BookCard book={book} />
          </div>
        ))}
      </div>
      <button onClick={() => scroll(1)} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-8 h-8 flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity" style={{ background: C.white, border: border2, boxShadow: shadow4, color: C.black }} aria-label="Tiếp"><ChevronRight size={17} /></button>
    </div>
  );
}

// ─── DealBookCard ─────────────────────────────────────────────────────────────

export function DealBookCard({ book, showDrop = false, showDeal = false, compact = false }: { book: Book; showDrop?: boolean; showDeal?: boolean; compact?: boolean }) {
  const navigate = useNavigate();
  const [pressed, setPressed] = useState(false);
  const dropRotate = book.id % 2 === 0 ? "rotate(2deg)" : "rotate(-3deg)";
  const cardWidth  = compact ? 200 : 280;
  const coverH     = compact ? 220 : 320;
  const bodyPad    = compact ? "p-3" : "p-5";
  const priceSize  = compact ? 18 : 22;
  const btnPad     = compact ? "py-2" : "py-3";
  const btnMt      = compact ? "mt-3" : "mt-4";

  return (
    <div className="flex flex-col cursor-pointer shrink-0 overflow-hidden"
      onClick={() => navigate(`/book/${book.id}`)}
      onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)} onMouseLeave={() => setPressed(false)}
      style={{ width: cardWidth, background: C.white, border: border2, boxShadow: pressed ? "none" : shadow4, transform: pressed ? "translate(4px,4px)" : "none", transition: "box-shadow 80ms, transform 80ms" }}
    >
      <div className="relative" style={{ height: coverH, borderBottom: border2, background: C.surfaceContainer, overflow: "hidden" }}>
        <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
        {showDrop && book.priceDropAmount && (
          <div className="absolute top-4 left-4 z-10 flex items-center gap-1 px-3 py-1" style={{ background: C.secondary, color: C.white, fontFamily: FONT, fontSize: 16, fontWeight: 800, lineHeight: 1.1, border: border2, boxShadow: shadow4, transform: dropRotate }}>
            <TrendingDown size={14} />-{fmt(book.priceDropAmount)}
          </div>
        )}
        {showDeal && book.redirectCount && (
          <div className="absolute top-4 left-4 z-10 flex items-center gap-1 px-3 py-1" style={{ background: C.secondary, color: C.white, fontFamily: FONT, fontSize: 16, fontWeight: 800, lineHeight: 1.1, border: border2, boxShadow: shadow4, transform: dropRotate }}>
            <Flame size={14} />{book.redirectCount?.toLocaleString()}
          </div>
        )}
      </div>
      <div className={`flex flex-col gap-1 ${bodyPad} flex-1`}>
        <p className="text-[10px] font-bold uppercase tracking-wider leading-none" style={{ color: C.outline, fontFamily: FONT }}>{book.category}</p>
        <h3 className="font-bold leading-snug line-clamp-2 mt-0.5" style={{ fontFamily: FONT, fontSize: compact ? 13 : 14, color: C.onSurface }}>{book.title}</h3>
        <p style={{ fontSize: compact ? 11 : 12, color: C.onSurfaceVariant, fontFamily: FONT }}>{book.author}</p>
        <div className="mt-auto pt-3 flex flex-col gap-1">
          {book.lowestPrice !== null ? (
            <>
              <span className="font-extrabold leading-none" style={{ fontSize: priceSize, color: C.secondary, fontFamily: FONT }}>{fmt(book.lowestPrice)}</span>
              {book.originalPrice && <span className="line-through leading-none" style={{ fontSize: compact ? 11 : 13, color: C.outline, fontFamily: FONT }}>{fmt(book.originalPrice)}</span>}
            </>
          ) : book.status ? (
            <p className="text-[10px] italic leading-tight" style={{ color: C.outline, fontFamily: FONT }}>{statusLabel[book.status]}</p>
          ) : null}
          <span className="mt-1.5 self-start text-[10px] font-bold px-1.5 py-0.5 uppercase" style={{ background: C.boneWhite, color: C.onSurface, fontFamily: FONT, border: "1px solid #000" }}>{book.offerCount} nơi bán</span>
        </div>
        <button className={`w-full font-bold uppercase tracking-wide text-[12px] ${btnPad} ${btnMt}`} style={{ background: C.primary, color: C.white, fontFamily: FONT, border: border2 }}
          onMouseEnter={e => (e.currentTarget.style.background = C.primaryContainer)}
          onMouseLeave={e => (e.currentTarget.style.background = C.primary)}
        >Đến nơi bán →</button>
      </div>
    </div>
  );
}

// ─── DealSection ─────────────────────────────────────────────────────────────

export function DealSection({ title, icon, books, showDrop = false, showDeal = false }: { title: string; icon: React.ReactNode; books: Book[]; showDrop?: boolean; showDeal?: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const scroll = useCallback((dir: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * (280 + 24), behavior: "smooth" });
  }, []);
  return (
    <section>
      <div className="flex items-center justify-between px-0 py-5" style={{ borderBottom: `3px solid ${C.black}` }}>
        <div className="flex items-center gap-3">
          <span style={{ color: C.primary }}>{icon}</span>
          <h2 className="font-extrabold uppercase" style={{ fontFamily: FONT, fontSize: "clamp(18px,2vw,26px)", letterSpacing: "-0.02em", color: C.onSurface }}>{title}</h2>
        </div>
        <NbButton variant="ghost" small onClick={() => {}}>Xem thêm <ChevronRight size={13} /></NbButton>
      </div>
      <div className="relative group/deal">
        <button onClick={() => scroll(-1)} className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center opacity-0 group-hover/deal:opacity-100 transition-opacity" style={{ background: C.white, border: border2, boxShadow: shadow4, color: C.black }} aria-label="Trước"><ChevronLeft size={18} /></button>
        <div ref={trackRef} className="flex overflow-x-auto" style={{ scrollbarWidth: "none", scrollSnapType: "x mandatory", gap: 24, padding: "28px 0 36px" }}>
          {books.map(book => (
            <div key={book.id} style={{ scrollSnapAlign: "start", flexShrink: 0 }}>
              <DealBookCard book={book} showDrop={showDrop} showDeal={showDeal} />
            </div>
          ))}
        </div>
        <button onClick={() => scroll(1)} className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center opacity-0 group-hover/deal:opacity-100 transition-opacity" style={{ background: C.white, border: border2, boxShadow: shadow4, color: C.black }} aria-label="Tiếp"><ChevronRight size={18} /></button>
      </div>
    </section>
  );
}

// ─── FeaturedByCategory ───────────────────────────────────────────────────────

export function FeaturedByCategory() {
  const [activeIdx, setActiveIdx] = useState(0);
  const activeCat = featuredCategories[activeIdx];
  return (
    <section style={{ border: border2, boxShadow: shadow8, background: C.white }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: border2, background: C.primary }}>
        <div className="flex items-center gap-2">
          <Star size={17} style={{ color: C.white }} />
          <h2 className="text-[15px] font-extrabold uppercase tracking-tight" style={{ color: C.white, fontFamily: FONT }}>Sách nổi bật</h2>
        </div>
        <NbButton variant="secondary" small onClick={() => {}}>Xem tất cả <ChevronRight size={13} /></NbButton>
      </div>
      <div className="flex">
        <div className="shrink-0 flex flex-col" style={{ width: 172, borderRight: border2, background: C.boneWhite }}>
          {featuredCategories.map((cat, i) => (
            <button key={cat.name} onClick={() => setActiveIdx(i)} className="w-full text-left px-5 py-3.5 text-[12px] font-bold uppercase tracking-wide transition-colors"
              style={{ fontFamily: FONT, background: i === activeIdx ? C.white : "transparent", color: i === activeIdx ? C.primary : C.onSurface, borderBottom: `1px solid ${C.black}`, borderLeft: i === activeIdx ? `4px solid ${C.primary}` : "4px solid transparent" }}>
              {cat.name}
            </button>
          ))}
        </div>
        <div className="flex-1 min-w-0 p-6"><BookCarousel books={activeCat.books} /></div>
      </div>
    </section>
  );
}

// ─── HowItWorks ───────────────────────────────────────────────────────────────

export function HowItWorks() {
  const steps = [
    { step: "01", title: "Tìm sách",       desc: "Tìm kiếm theo tên, tác giả hoặc ISBN để xem tất cả ưu đãi." },
    { step: "02", title: "So sánh giá",     desc: "Xem giá từ nhiều nhà bán lẻ như Tiki, Fahasa, Lazada, Shopee." },
    { step: "03", title: "Mua tại nơi bán", desc: "Nhấn Mua để chuyển đến trang nhà bán lẻ và hoàn tất đơn hàng." },
  ];
  return (
    <section style={{ border: border2, boxShadow: shadow8, background: C.white }}>
      <div className="px-5 py-3" style={{ borderBottom: border2, background: C.boneWhite }}>
        <h2 className="text-[15px] font-extrabold uppercase tracking-tight text-center" style={{ color: C.onSurface, fontFamily: FONT }}>DealSach hoạt động như thế nào?</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3">
        {steps.map((item, idx) => (
          <div key={item.step} className="flex flex-col gap-4 px-8 py-8" style={{ borderRight: idx < 2 ? border2 : "none" }}>
            <span className="text-[40px] font-extrabold leading-none" style={{ color: C.primary, fontFamily: FONT, letterSpacing: "-0.04em" }}>{item.step}</span>
            <h3 className="font-extrabold text-[15px] uppercase tracking-tight" style={{ color: C.onSurface, fontFamily: FONT }}>{item.title}</h3>
            <p className="text-[13px] leading-relaxed" style={{ color: C.onSurfaceVariant, fontFamily: FONT }}>{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
