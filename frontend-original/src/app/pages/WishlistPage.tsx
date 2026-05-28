import { useState } from "react";
import { useNavigate } from "react-router";
import { Trash2, LayoutList } from "lucide-react";
import { C, FONT, border2, border4, shadow4, shadow8, fmt } from "../shared";

// ─── Mock Data ────────────────────────────────────────────────────────────────

interface WishBook {
  id: number;
  title: string;
  author: string;
  category: string;
  description: string;
  coverUrl: string;
  lowestPrice: number | null;
  originalPrice?: number;
  offerCount: number;
  savedAt: string;
}

const initialWishlist: WishBook[] = [
  {
    id: 5,
    title: "Atomic Habits",
    author: "James Clear",
    category: "Kỹ năng sống",
    description: "Cuốn sách về cách xây dựng thói quen tốt và phá vỡ thói quen xấu thông qua những thay đổi nhỏ nhưng bền vững mỗi ngày.",
    coverUrl: "https://images.unsplash.com/photo-1592496431122-2349e0fbc666?w=300&h=420&fit=crop&auto=format",
    lowestPrice: 112000, originalPrice: 150000, offerCount: 8, savedAt: "20/05/2026",
  },
  {
    id: 10,
    title: "Chiến Tranh Và Hòa Bình",
    author: "Leo Tolstoy",
    category: "Văn học nước ngoài",
    description: "Tiểu thuyết sử thi vĩ đại của Tolstoy, khắc họa nước Nga trong thời kỳ chiến tranh Napoleon với độ sâu tâm lý và lịch sử hiếm có.",
    coverUrl: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=300&h=420&fit=crop&auto=format",
    lowestPrice: 210000, originalPrice: 265000, offerCount: 4, savedAt: "18/05/2026",
  },
  {
    id: 17,
    title: "Sapiens: Lược Sử Loài Người",
    author: "Yuval Noah Harari",
    category: "Lịch sử",
    description: "Hành trình 70.000 năm của loài người — từ những dải đồng cỏ châu Phi đến kỷ nguyên công nghệ — qua lăng kính của khoa học, triết học và lịch sử.",
    coverUrl: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=300&h=420&fit=crop&auto=format",
    lowestPrice: 148000, originalPrice: 199000, offerCount: 6, savedAt: "15/05/2026",
  },
  {
    id: 22,
    title: "Vũ Trụ Trong Vỏ Hạt Dẻ",
    author: "Stephen Hawking",
    category: "Khoa học",
    description: "Stephen Hawking dẫn dắt người đọc khám phá những bí ẩn của vũ trụ — từ thuyết tương đối đến cơ học lượng tử — bằng ngôn ngữ gần gũi và trực quan.",
    coverUrl: "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=300&h=420&fit=crop&auto=format",
    lowestPrice: 132000, originalPrice: 175000, offerCount: 5, savedAt: "10/05/2026",
  },
];

const archivedBooks: WishBook[] = [
  {
    id: 99,
    title: "Nhân Tố Enzyme",
    author: "Hiromi Shinya",
    category: "Sức khỏe",
    description: "Cuốn sách về lối sống lành mạnh và vai trò của enzyme trong cơ thể người.",
    coverUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=420&fit=crop&auto=format",
    lowestPrice: null, offerCount: 0, savedAt: "02/03/2026",
  },
  {
    id: 98,
    title: "Đời Ngắn Đừng Ngủ Dài",
    author: "Robin Sharma",
    category: "Kỹ năng sống",
    description: "Hành trình thức dậy lúc 5 giờ sáng và xây dựng buổi sáng chiến thắng để thay đổi cuộc đời.",
    coverUrl: "https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=300&h=420&fit=crop&auto=format",
    lowestPrice: null, offerCount: 0, savedAt: "15/01/2026",
  },
];

// ─── Page Header ──────────────────────────────────────────────────────────────

function PageHeader({ count }: { count: number }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-8" style={{ borderBottom: border4 }}>
      <div className="flex flex-col gap-4">
        <h1
          className="self-start px-4 py-2 uppercase"
          style={{
            fontFamily: FONT, fontSize: "clamp(28px,5vw,48px)", fontWeight: 800,
            letterSpacing: "-0.03em", lineHeight: 1, color: C.black,
            background: C.primaryFixed, border: border2, boxShadow: shadow8, transform: "rotate(-1deg)",
          }}>
          Danh sách yêu thích
        </h1>
        <div className="pl-5 py-1 max-w-xl" style={{ borderLeft: `5px solid ${C.primary}` }}>
          <p style={{ fontFamily: FONT, fontSize: 15, color: C.onSurfaceVariant, lineHeight: 1.65 }}>
            Lưu lại những đầu sách bạn muốn theo dõi. Nhấn "Bỏ lưu" bất cứ lúc nào để xóa khỏi danh sách.
          </p>
        </div>
      </div>
      <div className="shrink-0 flex items-center gap-2 px-4 py-3 self-start sm:self-auto"
        style={{ border: border2, background: C.boneWhite, boxShadow: shadow4 }}>
        <LayoutList size={16} style={{ color: C.primary }} />
        <span className="font-bold text-[13px] uppercase tracking-wide" style={{ fontFamily: FONT, color: C.onSurface }}>
          {count} cuốn đã lưu
        </span>
      </div>
    </div>
  );
}

// ─── Active Wishlist Row ──────────────────────────────────────────────────────

function ActiveRow({ book, onRemove }: { book: WishBook; onRemove: () => void }) {
  const navigate = useNavigate();
  const [lifted, setLifted] = useState(false);
  const [removeHover, setRemoveHover] = useState(false);

  return (
    <div
      className="flex flex-col sm:flex-row overflow-hidden"
      style={{
        border: border2, boxShadow: shadow8, background: C.white,
        transform: lifted ? "translateY(-4px)" : "none",
        transition: "transform 150ms",
      }}
      onMouseEnter={() => setLifted(true)}
      onMouseLeave={() => setLifted(false)}>

      {/* Cover — fixed 96px wide, 140px tall book-proportion frame */}
      <div className="shrink-0" style={{ width: 96, borderRight: border2, background: C.boneWhite }}>
        <img
          src={book.coverUrl}
          alt={book.title}
          style={{ width: 96, height: 140, objectFit: "cover", display: "block" }}
        />
      </div>

      {/* Center: metadata */}
      <div className="flex-1 min-w-0 px-5 py-4 flex flex-col justify-center gap-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5"
            style={{ background: C.boneWhite, color: C.outline, fontFamily: FONT, border: `1px solid ${C.outlineVariant}` }}>
            {book.category}
          </span>
        </div>
        <p
          className="font-extrabold leading-snug cursor-pointer hover:underline"
          onClick={() => navigate(`/book/${book.id}`)}
          style={{ fontFamily: FONT, fontSize: 16, color: C.onSurface, letterSpacing: "-0.01em" }}>
          {book.title}
        </p>
        <p className="text-[12px]" style={{ fontFamily: FONT, color: C.onSurfaceVariant }}>{book.author}</p>
        <p className="text-[12px] leading-relaxed line-clamp-2" style={{ fontFamily: FONT, color: C.onSurfaceVariant }}>{book.description}</p>
        <p className="text-[10px] mt-0.5" style={{ fontFamily: FONT, color: C.outline }}>Đã lưu: {book.savedAt}</p>
      </div>

      {/* Right: price + remove — border-top on mobile, border-left on desktop */}
      <div className="shrink-0 flex flex-row sm:flex-col items-center sm:items-stretch justify-between sm:justify-center gap-3 px-4 py-4 sm:min-w-[148px] border-t-2 sm:border-t-0 sm:border-l-2 border-black">
        {/* Price block */}
        <div className="flex flex-col gap-0.5">
          {book.lowestPrice !== null ? (
            <>
              <span className="text-[10px] font-bold uppercase tracking-wide" style={{ fontFamily: FONT, color: C.outline }}>Từ</span>
              <span className="font-bold leading-none" style={{ fontFamily: FONT, fontSize: 17, color: C.secondary }}>
                {fmt(book.lowestPrice)}
              </span>
              {book.originalPrice && (
                <span className="text-[11px] line-through leading-none" style={{ fontFamily: FONT, color: C.outline }}>
                  {fmt(book.originalPrice)}
                </span>
              )}
              <span className="text-[10px] mt-1 font-bold px-1.5 py-0.5 self-start uppercase"
                style={{ background: C.boneWhite, color: C.onSurface, fontFamily: FONT, border: "1px solid #000" }}>
                {book.offerCount} nơi bán
              </span>
            </>
          ) : (
            <span className="text-[12px] italic" style={{ fontFamily: FONT, color: C.outline }}>N/A</span>
          )}
        </div>

        {/* Remove button */}
        <button
          onClick={onRemove}
          onMouseEnter={() => setRemoveHover(true)}
          onMouseLeave={() => setRemoveHover(false)}
          className="flex items-center gap-1.5 px-3 py-2 font-bold text-[11px] uppercase tracking-wide whitespace-nowrap shrink-0"
          style={{
            border: border2, boxShadow: shadow4,
            background: removeHover ? "#fff0f0" : C.white,
            color: removeHover ? C.secondary : C.onSurface,
            fontFamily: FONT, transition: "background 100ms, color 100ms",
          }}>
          <Trash2 size={13} />
          Bỏ lưu
        </button>
      </div>
    </div>
  );
}

// ─── Archived Wishlist Row ────────────────────────────────────────────────────

function ArchivedRow({ book }: { book: WishBook }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="flex flex-col sm:flex-row overflow-hidden"
      style={{
        border: `2px dashed ${C.outline}`,
        background: C.surfaceContainer,
        opacity: hovered ? 1 : 0.6,
        filter: "grayscale(30%)",
        transition: "opacity 150ms",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}>

      {/* Cover */}
      <div className="shrink-0" style={{ width: 96, borderRight: `1px dashed ${C.outline}`, background: C.boneWhite }}>
        <img
          src={book.coverUrl}
          alt={book.title}
          style={{ width: 96, height: 140, objectFit: "cover", display: "block" }}
        />
      </div>

      {/* Center */}
      <div className="flex-1 min-w-0 px-5 py-4 flex flex-col justify-center gap-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5"
            style={{ background: C.surfaceVariant, color: C.outline, fontFamily: FONT, border: `1px dashed ${C.outlineVariant}` }}>
            {book.category}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5"
            style={{ background: C.surfaceVariant, color: C.outline, fontFamily: FONT, border: `1px dashed ${C.outlineVariant}` }}>
            Đã lưu trữ
          </span>
        </div>
        <p className="font-extrabold leading-snug" style={{ fontFamily: FONT, fontSize: 16, color: C.outline, letterSpacing: "-0.01em" }}>
          {book.title}
        </p>
        <p className="text-[12px]" style={{ fontFamily: FONT, color: C.onSurfaceVariant }}>{book.author}</p>
        <p className="text-[12px] leading-relaxed line-clamp-2" style={{ fontFamily: FONT, color: C.onSurfaceVariant }}>{book.description}</p>
      </div>

      {/* Right: price */}
      <div className="shrink-0 flex flex-row sm:flex-col items-center sm:items-stretch justify-start gap-3 px-4 py-4 sm:min-w-[120px] border-t sm:border-t-0 sm:border-l border-dashed"
        style={{ borderColor: C.outline }}>
        <span className="text-[12px] italic" style={{ fontFamily: FONT, color: C.outline }}>N/A</span>
      </div>
    </div>
  );
}

// ─── WishlistPage ─────────────────────────────────────────────────────────────

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState(initialWishlist);

  const remove = (id: number) => setWishlist(prev => prev.filter(b => b.id !== id));

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-16 flex flex-col gap-12"
      style={{ background: C.surface }}>

      <PageHeader count={wishlist.length} />

      {/* Active shelf */}
      <section className="flex flex-col gap-5">
        <div className="pb-3" style={{ borderBottom: `4px solid ${C.black}` }}>
          <h2 className="font-extrabold uppercase text-[18px] tracking-tight"
            style={{ fontFamily: FONT, color: C.onSurface, letterSpacing: "-0.01em" }}>
            Đang Theo Dõi
            <span className="ml-3 text-[13px] font-bold px-2 py-0.5 align-middle"
              style={{ background: C.primary, color: C.white, border: border2 }}>
              {wishlist.length}
            </span>
          </h2>
        </div>

        {wishlist.length > 0 ? (
          <div className="flex flex-col gap-4">
            {wishlist.map(book => (
              <ActiveRow key={book.id} book={book} onRemove={() => remove(book.id)} />
            ))}
          </div>
        ) : (
          <div className="py-16 flex flex-col items-center gap-4" style={{ border: border2, background: C.white }}>
            <LayoutList size={36} style={{ color: C.outlineVariant }} />
            <p className="font-bold text-[15px]" style={{ fontFamily: FONT, color: C.onSurfaceVariant }}>Danh sách trống</p>
            <p className="text-[13px]" style={{ fontFamily: FONT, color: C.outline }}>Lưu sách từ trang tìm kiếm hoặc trang chi tiết sách.</p>
          </div>
        )}
      </section>

      {/* Archived shelf */}
      {archivedBooks.length > 0 && (
        <section className="flex flex-col gap-5">
          <div className="pb-3" style={{ borderBottom: `2px solid ${C.outlineVariant}` }}>
            <h2 className="font-extrabold uppercase text-[16px] tracking-tight"
              style={{ fontFamily: FONT, color: C.outline, letterSpacing: "-0.01em" }}>
              Mục Đã Lưu Trữ
            </h2>
          </div>
          <div className="flex flex-col gap-3">
            {archivedBooks.map(book => (
              <ArchivedRow key={book.id} book={book} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
