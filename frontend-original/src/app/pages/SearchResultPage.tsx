import { useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { ChevronDown, X, Info, SlidersHorizontal, TrendingDown } from "lucide-react";
import {
  C, FONT, border2, border4, shadow4, shadow8, fmt,
  BookCard, statusLabel,
  type Book,
} from "../shared";

// ─── Mock search corpus ───────────────────────────────────────────────────────

const ALL_BOOKS: Book[] = [
  { id: 1,  title: "Đắc Nhân Tâm",                   author: "Dale Carnegie",            category: "Kỹ năng sống",        coverUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=420&fit=crop&auto=format",  lowestPrice: 68000,  originalPrice: 98000,  offerCount: 5,  priceDropAmount: 30000, topRetailer: "Tiki" },
  { id: 2,  title: "Tôi Tài Giỏi, Bạn Cũng Thế",     author: "Adam Khoo",                category: "Kỹ năng sống",        coverUrl: "https://images.unsplash.com/photo-1589998059171-988d887df646?w=300&h=420&fit=crop&auto=format",  lowestPrice: 95000,  originalPrice: 130000, offerCount: 4 },
  { id: 3,  title: "Cà Phê Cùng Tony",                author: "Tony Buổi Sáng",           category: "Kỹ năng sống",        coverUrl: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=300&h=420&fit=crop&auto=format",  lowestPrice: 61000,  originalPrice: 80000,  offerCount: 8 },
  { id: 4,  title: "Dám Nghĩ Lớn",                    author: "David J. Schwartz",        category: "Kỹ năng sống",        coverUrl: "https://images.unsplash.com/photo-1530973428-5bf2db2e4d71?w=300&h=420&fit=crop&auto=format",  lowestPrice: 55000,  originalPrice: 83000,  offerCount: 6,  priceDropAmount: 28000 },
  { id: 5,  title: "Atomic Habits",                   author: "James Clear",              category: "Kỹ năng sống",        coverUrl: "https://images.unsplash.com/photo-1592496431122-2349e0fbc666?w=300&h=420&fit=crop&auto=format",  lowestPrice: 112000, originalPrice: 150000, offerCount: 8 },
  { id: 6,  title: "7 Thói Quen Hiệu Quả",            author: "Stephen R. Covey",        category: "Kỹ năng sống",        coverUrl: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=300&h=420&fit=crop&auto=format",  lowestPrice: 89000,  originalPrice: 120000, offerCount: 7 },
  { id: 7,  title: "Nhà Giả Kim",                     author: "Paulo Coelho",             category: "Văn học nước ngoài",  coverUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=420&fit=crop&auto=format",  lowestPrice: 72000,  originalPrice: 95000,  offerCount: 7 },
  { id: 8,  title: "Không Gia Đình",                  author: "Hector Malot",             category: "Văn học nước ngoài",  coverUrl: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=420&fit=crop&auto=format",  lowestPrice: 54000,  originalPrice: 72000,  offerCount: 3 },
  { id: 9,  title: "Hoàng Tử Bé",                     author: "Antoine de Saint-Exupéry", category: "Văn học nước ngoài",  coverUrl: "https://images.unsplash.com/photo-1576872381149-7847515ce5d8?w=300&h=420&fit=crop&auto=format",  lowestPrice: 42000,  originalPrice: 60000,  offerCount: 11, priceDropAmount: 18000 },
  { id: 10, title: "Chiến Tranh Và Hòa Bình",         author: "Leo Tolstoy",              category: "Văn học nước ngoài",  coverUrl: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=300&h=420&fit=crop&auto=format",  lowestPrice: 210000, originalPrice: 265000, offerCount: 4 },
  { id: 11, title: "Dune — Hành Tinh Cát",            author: "Frank Herbert",            category: "Văn học nước ngoài",  coverUrl: "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=300&h=420&fit=crop&auto=format",  lowestPrice: 195000, originalPrice: 249000, offerCount: 5 },
  { id: 12, title: "Mắt Biếc",                        author: "Nguyễn Nhật Ánh",          category: "Văn học Việt Nam",   coverUrl: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=300&h=420&fit=crop&auto=format",  lowestPrice: 65000,  originalPrice: 88000,  offerCount: 12 },
  { id: 13, title: "Bố Già Dạy Con Làm Giàu",        author: "Robert T. Kiyosaki",       category: "Tài chính",           coverUrl: "https://images.unsplash.com/photo-1604866830893-c13cafa515d5?w=300&h=420&fit=crop&auto=format",  lowestPrice: 88000,  originalPrice: 120000, offerCount: 9,  priceDropAmount: 32000 },
  { id: 14, title: "Nghĩ Giàu Làm Giàu",             author: "Napoleon Hill",            category: "Tài chính",           coverUrl: "https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=300&h=420&fit=crop&auto=format",  lowestPrice: 75000,  originalPrice: 100000, offerCount: 7 },
  { id: 15, title: "Người Giàu Nhất Thành Babylon",  author: "George S. Clason",         category: "Tài chính",           coverUrl: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=300&h=420&fit=crop&auto=format",  lowestPrice: 58000,  originalPrice: 80000,  offerCount: 10 },
  { id: 16, title: "Tư Duy Nhanh Và Chậm",           author: "Daniel Kahneman",          category: "Tâm lý học",          coverUrl: "https://images.unsplash.com/photo-1546521343-4eb2c01aa44b?w=300&h=420&fit=crop&auto=format",  lowestPrice: 120000, originalPrice: 160000, offerCount: 5 },
  { id: 17, title: "Sapiens: Lược Sử Loài Người",    author: "Yuval Noah Harari",        category: "Lịch sử",             coverUrl: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=300&h=420&fit=crop&auto=format",  lowestPrice: 148000, originalPrice: 199000, offerCount: 6 },
  { id: 18, title: "Truyện Kiều",                     author: "Nguyễn Du",                category: "Văn học Việt Nam",   coverUrl: "https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=300&h=420&fit=crop&auto=format",  lowestPrice: 35000,  originalPrice: 48000,  offerCount: 14 },
  { id: 19, title: "Tuổi Thơ Dữ Dội",                author: "Phùng Quán",               category: "Văn học Việt Nam",   coverUrl: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&h=420&fit=crop&auto=format",  lowestPrice: 78000,  originalPrice: 105000, offerCount: 6 },
  { id: 20, title: "Số Đỏ",                           author: "Vũ Trọng Phụng",           category: "Văn học Việt Nam",   coverUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=420&fit=crop&auto=format",  lowestPrice: 42000,  originalPrice: 58000,  offerCount: 9 },
  { id: 21, title: "Dế Mèn Phiêu Lưu Ký",            author: "Tô Hoài",                  category: "Thiếu nhi",           coverUrl: "https://images.unsplash.com/photo-1576872381149-7847515ce5d8?w=300&h=420&fit=crop&auto=format",  lowestPrice: 29000,  originalPrice: 42000,  offerCount: 16 },
  { id: 22, title: "Vũ Trụ Trong Vỏ Hạt Dẻ",         author: "Stephen Hawking",          category: "Khoa học",            coverUrl: "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=300&h=420&fit=crop&auto=format",  lowestPrice: 132000, originalPrice: 175000, offerCount: 5 },
  { id: 23, title: "Lịch Sử Triết Học",               author: "Will Durant",              category: "Lịch sử",             coverUrl: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=300&h=420&fit=crop&auto=format",  lowestPrice: 175000, originalPrice: 220000, offerCount: 3 },
  { id: 24, title: "Súng, Vi Trùng Và Thép",          author: "Jared Diamond",            category: "Lịch sử",             coverUrl: "https://images.unsplash.com/photo-1604866830893-c13cafa515d5?w=300&h=420&fit=crop&auto=format",  lowestPrice: 162000, originalPrice: 210000, offerCount: 4 },
  { id: 25, title: "Tâm Lý Học Đám Đông",             author: "Gustave Le Bon",           category: "Tâm lý học",          coverUrl: "https://images.unsplash.com/photo-1546521343-4eb2c01aa44b?w=300&h=420&fit=crop&auto=format",  lowestPrice: 82000,  originalPrice: 110000, offerCount: 6 },
  { id: 26, title: "Hiểu Về Trái Tim",                author: "Minh Niệm",                category: "Tâm lý học",          coverUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=420&fit=crop&auto=format",  lowestPrice: 95000,  originalPrice: 125000, offerCount: 8, status: "out_of_stock" as const },
  { id: 27, title: "Chí Phèo",                        author: "Nam Cao",                  category: "Văn học Việt Nam",   coverUrl: "https://images.unsplash.com/photo-1589998059171-988d887df646?w=300&h=420&fit=crop&auto=format",  lowestPrice: 38000,  originalPrice: 52000,  offerCount: 8 },
  { id: 28, title: "Bí Mật Tư Duy Triệu Phú",        author: "T. Harv Eker",             category: "Tài chính",           coverUrl: "https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=300&h=420&fit=crop&auto=format",  lowestPrice: null, offerCount: 2, status: "no_link" as const },
  { id: 29, title: "Người Đàn Bà Trước Gương",        author: "Nguyễn Thị Thu Huệ",      category: "Văn học Việt Nam",   coverUrl: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=300&h=420&fit=crop&auto=format",  lowestPrice: 62000,  originalPrice: 82000,  offerCount: 3 },
  { id: 30, title: "The Psychology of Money",         author: "Morgan Housel",            category: "Tài chính",           coverUrl: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=300&h=420&fit=crop&auto=format",  lowestPrice: 138000, originalPrice: 180000, offerCount: 6, priceDropAmount: 42000 },
];

const ALL_CATEGORIES  = [...new Set(ALL_BOOKS.map(b => b.category))].sort();
const ALL_SELLERS     = ["Tiki", "Fahasa", "Shopee", "Lazada", "Nhà sách Phương Nam", "Đinh Lê Bookstore"];
const ALL_AUTHORS     = [...new Set(ALL_BOOKS.map(b => b.author))].sort();
const PAGE_SIZE = 12;

type SortKey = "relevance" | "price_asc" | "price_desc" | "drop_desc";

interface Filters {
  priceMin: string;
  priceMax: string;
  statuses: string[];
  categories: string[];
  sellers: string[];
  authors: string[];
}

const EMPTY_FILTERS: Filters = {
  priceMin: "", priceMax: "", statuses: [], categories: [], sellers: [], authors: [],
};

const STATUS_OPTIONS = [
  { value: "has_offer",    label: "Có ưu đãi hiện tại" },
  { value: "out_of_stock", label: "Tạm hết hàng" },
  { value: "stale_price",  label: "Có giá tham khảo cũ" },
  { value: "no_link",      label: "Chưa có liên kết mua hợp lệ" },
  { value: "no_offer",     label: "Chưa có ưu đãi" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toggle<T>(arr: T[], val: T): T[] {
  return arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];
}

function NbCheckbox({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group select-none">
      <span onClick={onChange}
        className="shrink-0 w-4 h-4 flex items-center justify-center"
        style={{ border: border2, background: checked ? C.primary : C.white, transition: "background 80ms" }}>
        {checked && <span style={{ width: 8, height: 8, background: C.white, display: "block" }} />}
      </span>
      <span className="text-[12px] leading-snug group-hover:underline" style={{ fontFamily: FONT, color: C.onSurface }}>{label}</span>
    </label>
  );
}

// ─── Filter Sidebar ───────────────────────────────────────────────────────────

function FilterSidebar({
  filters, onChange, onReset,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  onReset: () => void;
}) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    price: true, status: true, category: false, seller: false, author: false,
  });

  const toggle_group = (key: string) =>
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));

  const hasAnyFilter =
    filters.priceMin || filters.priceMax ||
    filters.statuses.length || filters.categories.length ||
    filters.sellers.length || filters.authors.length;

  function FilterGroup({
    id, label, children,
  }: { id: string; label: string; children: React.ReactNode }) {
    const open = openGroups[id];
    return (
      <div style={{ borderTop: `1px solid ${C.outlineVariant}` }}>
        <button
          className="w-full flex items-center justify-between py-3"
          onClick={() => toggle_group(id)}>
          <span className="text-[11px] font-bold uppercase tracking-widest" style={{ fontFamily: FONT, color: C.primary }}>
            {label}
          </span>
          <ChevronDown size={14} style={{ color: C.primary, transform: open ? "rotate(180deg)" : "none", transition: "transform 150ms" }} />
        </button>
        {open && <div className="pb-3 flex flex-col gap-2">{children}</div>}
      </div>
    );
  }

  return (
    <aside style={{ background: C.white, border: border2, boxShadow: shadow4 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: border2 }}>
        <span className="font-extrabold uppercase text-[13px] tracking-widest" style={{ fontFamily: FONT, color: C.onSurface }}>
          Bộ Lọc
        </span>
        {hasAnyFilter ? (
          <button onClick={onReset}
            className="text-[11px] font-bold uppercase tracking-wide underline"
            style={{ fontFamily: FONT, color: C.secondary }}>
            Xóa hết
          </button>
        ) : (
          <span className="material-symbols-outlined select-none" style={{ fontSize: 18, color: C.outline, lineHeight: 1 }}>tune</span>
        )}
      </div>

      <div className="px-4 flex flex-col">
        {/* Price range */}
        <FilterGroup id="price" label="Khoảng giá (₫)">
          <div className="flex gap-2">
            {(["priceMin", "priceMax"] as const).map((key, i) => (
              <div key={key} className="flex-1 flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wide" style={{ fontFamily: FONT, color: C.outline }}>
                  {i === 0 ? "Từ" : "Đến"}
                </span>
                <input
                  type="number"
                  value={filters[key]}
                  onChange={e => onChange({ ...filters, [key]: e.target.value })}
                  placeholder={i === 0 ? "0" : "999.000"}
                  className="w-full px-2 py-1.5 text-[12px] outline-none"
                  style={{ border: border2, background: C.boneWhite, fontFamily: FONT, color: C.onSurface }}
                />
              </div>
            ))}
          </div>
        </FilterGroup>

        {/* Status */}
        <FilterGroup id="status" label="Trạng thái">
          {STATUS_OPTIONS.map(opt => (
            <NbCheckbox
              key={opt.value}
              checked={filters.statuses.includes(opt.value)}
              onChange={() => onChange({ ...filters, statuses: toggle(filters.statuses, opt.value) })}
              label={opt.label}
            />
          ))}
        </FilterGroup>

        {/* Category */}
        <FilterGroup id="category" label="Danh mục">
          {ALL_CATEGORIES.map(cat => (
            <NbCheckbox
              key={cat}
              checked={filters.categories.includes(cat)}
              onChange={() => onChange({ ...filters, categories: toggle(filters.categories, cat) })}
              label={cat}
            />
          ))}
        </FilterGroup>

        {/* Seller */}
        <FilterGroup id="seller" label="Người bán">
          {ALL_SELLERS.map(s => (
            <NbCheckbox
              key={s}
              checked={filters.sellers.includes(s)}
              onChange={() => onChange({ ...filters, sellers: toggle(filters.sellers, s) })}
              label={s}
            />
          ))}
        </FilterGroup>

        {/* Author */}
        <FilterGroup id="author" label="Tác giả">
          {ALL_AUTHORS.map(a => (
            <NbCheckbox
              key={a}
              checked={filters.authors.includes(a)}
              onChange={() => onChange({ ...filters, authors: toggle(filters.authors, a) })}
              label={a}
            />
          ))}
        </FilterGroup>
      </div>
    </aside>
  );
}

// ─── Result Hero + Sort ───────────────────────────────────────────────────────

function ResultHero({
  query, total, sort, onSort,
}: {
  query: string; total: number; sort: SortKey; onSort: (s: SortKey) => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5"
      style={{ background: C.primaryContainer, border: border2, boxShadow: shadow8 }}>
      {/* Left: query + count */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[12px] font-bold uppercase tracking-wider" style={{ fontFamily: FONT, color: "rgba(255,255,255,0.65)" }}>
            Kết quả tìm kiếm cho
          </span>
          {query && (
            <span className="px-3 py-1 font-extrabold text-[13px]"
              style={{ background: C.primaryFixed, color: C.primary, fontFamily: FONT, border: border2, boxShadow: shadow4 }}>
              {query}
            </span>
          )}
        </div>
        <p className="text-[13px]" style={{ fontFamily: FONT, color: "rgba(255,255,255,0.8)" }}>
          Tìm thấy <strong style={{ color: C.white }}>{total} đầu sách</strong> từ{" "}
          <strong style={{ color: C.white }}>{ALL_SELLERS.length} nhà bán lẻ</strong>
        </p>
      </div>

      {/* Right: sort */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[11px] font-bold uppercase tracking-wide" style={{ fontFamily: FONT, color: "rgba(255,255,255,0.65)" }}>
          Sắp xếp
        </span>
        <div className="relative" style={{ boxShadow: shadow4 }}>
          <select
            value={sort}
            onChange={e => onSort(e.target.value as SortKey)}
            className="appearance-none pl-3 pr-8 py-2 text-[12px] font-bold outline-none cursor-pointer"
            style={{ border: border2, background: C.white, color: C.onSurface, fontFamily: FONT }}>
            <option value="relevance">Liên quan nhất</option>
            <option value="price_asc">Giá: Thấp → Cao</option>
            <option value="price_desc">Giá: Cao → Thấp</option>
            <option value="drop_desc">Giảm giá nhiều nhất</option>
          </select>
          <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: C.primary }} />
        </div>
      </div>
    </div>
  );
}

// ─── Active Filter Chips ──────────────────────────────────────────────────────

interface Chip { key: string; label: string; onRemove: () => void }

function ActiveFilterChips({
  chips, onClearAll,
}: { chips: Chip[]; onClearAll: () => void }) {
  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map(chip => (
        <button
          key={chip.key}
          onClick={chip.onRemove}
          className="flex items-center gap-1.5 px-2.5 py-1 font-bold text-[11px] group"
          style={{ background: C.primaryFixed, border: border2, boxShadow: shadow4, fontFamily: FONT, color: C.primary }}>
          {chip.label}
          <X size={11} style={{ color: C.primary }} className="group-hover:opacity-60" />
        </button>
      ))}
      <button
        onClick={onClearAll}
        className="text-[11px] font-bold underline"
        style={{ fontFamily: FONT, color: C.onSurfaceVariant }}>
        Xóa tất cả
      </button>
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({
  page, totalPages, onPage,
}: { page: number; totalPages: number; onPage: (p: number) => void }) {
  const pages = useMemo(() => {
    const items: (number | "…")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) items.push(i);
    } else {
      items.push(1);
      if (page > 3) items.push("…");
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) items.push(i);
      if (page < totalPages - 2) items.push("…");
      items.push(totalPages);
    }
    return items;
  }, [page, totalPages]);

  const btnBase: React.CSSProperties = { fontFamily: FONT, fontWeight: 700, fontSize: 13, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", border: border2, cursor: "pointer" };

  return (
    <div className="flex items-center justify-center gap-1.5 flex-wrap">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
        style={{ ...btnBase, background: C.white, color: page === 1 ? C.outlineVariant : C.onSurface, opacity: page === 1 ? 0.4 : 1, cursor: page === 1 ? "not-allowed" : "pointer", boxShadow: page === 1 ? "none" : shadow4 }}>
        ‹
      </button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`ellipsis-${i}`} style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, color: C.outline, fontSize: 13 }}>…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPage(p)}
            style={{ ...btnBase, background: p === page ? C.primary : C.white, color: p === page ? C.white : C.onSurface, boxShadow: p === page ? "none" : shadow4, transform: p === page ? "translate(4px,4px)" : "none" }}>
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onPage(page + 1)}
        disabled={page === totalPages}
        style={{ ...btnBase, background: C.white, color: page === totalPages ? C.outlineVariant : C.onSurface, opacity: page === totalPages ? 0.4 : 1, cursor: page === totalPages ? "not-allowed" : "pointer", boxShadow: page === totalPages ? "none" : shadow4 }}>
        ›
      </button>
    </div>
  );
}

// ─── SearchResultPage ─────────────────────────────────────────────────────────

export default function SearchResultPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") ?? "";

  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortKey>("relevance");
  const [page, setPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Derived: filtered + sorted books
  const filtered = useMemo(() => {
    let results = ALL_BOOKS;

    // Query filter
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      results = results.filter(b =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q)
      );
    }

    // Price range
    if (filters.priceMin) {
      const min = Number(filters.priceMin);
      results = results.filter(b => b.lowestPrice !== null && b.lowestPrice >= min);
    }
    if (filters.priceMax) {
      const max = Number(filters.priceMax);
      results = results.filter(b => b.lowestPrice !== null && b.lowestPrice <= max);
    }

    // Status
    if (filters.statuses.length > 0) {
      results = results.filter(b => {
        if (filters.statuses.includes("has_offer") && b.lowestPrice !== null && !b.status) return true;
        if (b.status && filters.statuses.includes(b.status)) return true;
        return false;
      });
    }

    // Category
    if (filters.categories.length > 0) {
      results = results.filter(b => filters.categories.includes(b.category));
    }

    // Seller — mock: just show all since sellers aren't per-book in this mock
    // Author
    if (filters.authors.length > 0) {
      results = results.filter(b => filters.authors.includes(b.author));
    }

    // Sort
    switch (sort) {
      case "price_asc":  return [...results].sort((a, b) => (a.lowestPrice ?? 999999) - (b.lowestPrice ?? 999999));
      case "price_desc": return [...results].sort((a, b) => (b.lowestPrice ?? 0) - (a.lowestPrice ?? 0));
      case "drop_desc":  return [...results].sort((a, b) => (b.priceDropAmount ?? 0) - (a.priceDropAmount ?? 0));
      default:           return results;
    }
  }, [query, filters, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageBooks  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleFilter = (f: Filters) => { setFilters(f); setPage(1); };
  const handleSort   = (s: SortKey) => { setSort(s); setPage(1); };

  // Build active chips
  const chips: Chip[] = useMemo(() => {
    const list: Chip[] = [];
    if (filters.priceMin) list.push({ key: "priceMin", label: `Từ ${Number(filters.priceMin).toLocaleString("vi-VN")} đ`, onRemove: () => handleFilter({ ...filters, priceMin: "" }) });
    if (filters.priceMax) list.push({ key: "priceMax", label: `Đến ${Number(filters.priceMax).toLocaleString("vi-VN")} đ`, onRemove: () => handleFilter({ ...filters, priceMax: "" }) });
    filters.statuses.forEach(s => { const opt = STATUS_OPTIONS.find(o => o.value === s); if (opt) list.push({ key: `status-${s}`, label: opt.label, onRemove: () => handleFilter({ ...filters, statuses: filters.statuses.filter(x => x !== s) }) }); });
    filters.categories.forEach(c => list.push({ key: `cat-${c}`, label: c, onRemove: () => handleFilter({ ...filters, categories: filters.categories.filter(x => x !== c) }) }));
    filters.sellers.forEach(s => list.push({ key: `seller-${s}`, label: s, onRemove: () => handleFilter({ ...filters, sellers: filters.sellers.filter(x => x !== s) }) }));
    filters.authors.forEach(a => list.push({ key: `author-${a}`, label: a, onRemove: () => handleFilter({ ...filters, authors: filters.authors.filter(x => x !== a) }) }));
    return list;
  }, [filters]);

  return (
    <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-8">
      {/* Mobile filter toggle */}
      <button
        className="lg:hidden flex items-center gap-2 mb-4 px-4 py-2.5 font-bold uppercase text-[12px] tracking-wide"
        style={{ border: border2, background: C.white, fontFamily: FONT, color: C.onSurface, boxShadow: shadow4 }}
        onClick={() => setMobileFiltersOpen(o => !o)}>
        <SlidersHorizontal size={14} />
        {mobileFiltersOpen ? "Ẩn bộ lọc" : "Bộ lọc"}
      </button>

      <div className="flex gap-6 lg:gap-8 items-start">
        {/* ── Sidebar ── */}
        <div className={`${mobileFiltersOpen ? "block" : "hidden"} lg:block shrink-0 w-full lg:w-64 xl:w-72`}>
          <FilterSidebar filters={filters} onChange={handleFilter} onReset={() => { setFilters(EMPTY_FILTERS); setPage(1); }} />
        </div>

        {/* ── Main results ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-5">
          {/* Hero */}
          <ResultHero query={query} total={filtered.length} sort={sort} onSort={handleSort} />

          {/* Active chips */}
          <ActiveFilterChips chips={chips} onClearAll={() => { setFilters(EMPTY_FILTERS); setPage(1); }} />

          {/* Grid */}
          {pageBooks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {pageBooks.map(book => (
                <div key={book.id} className="relative">
                  {/* Price drop badge overlay */}
                  {book.priceDropAmount && (
                    <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-0.5"
                      style={{ background: C.secondary, color: C.white, fontFamily: FONT, fontSize: 11, fontWeight: 800, border: border2, boxShadow: shadow4, transform: book.id % 2 === 0 ? "rotate(2deg)" : "rotate(-2deg)", pointerEvents: "none" }}>
                      <TrendingDown size={11} />-{fmt(book.priceDropAmount)}
                    </div>
                  )}
                  {/* Status badge for no-price books */}
                  {!book.priceDropAmount && book.status && (
                    <div className="absolute top-2 left-2 z-10 px-2 py-0.5"
                      style={{ background: C.surfaceHigh, color: C.outline, fontFamily: FONT, fontSize: 10, fontWeight: 700, border: `1px solid ${C.outlineVariant}`, pointerEvents: "none", maxWidth: "calc(100% - 16px)" }}>
                      {statusLabel[book.status]}
                    </div>
                  )}
                  <BookCard book={book} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-20 text-center"
              style={{ border: border2, background: C.white }}>
              <p className="font-extrabold text-[18px] uppercase tracking-tight" style={{ fontFamily: FONT, color: C.onSurface }}>
                Không tìm thấy kết quả
              </p>
              <p className="text-[13px]" style={{ fontFamily: FONT, color: C.onSurfaceVariant }}>
                Thử từ khóa khác hoặc xóa bộ lọc để xem nhiều đầu sách hơn.
              </p>
              <button
                onClick={() => navigate("/")}
                className="px-5 py-2.5 font-bold uppercase text-[12px] tracking-wide"
                style={{ border: border2, background: C.primary, color: C.white, fontFamily: FONT, boxShadow: shadow4 }}>
                Về trang chủ
              </button>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination page={page} totalPages={totalPages} onPage={p => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
          )}

          {/* Disclaimer */}
          <div className="flex items-start gap-2 pt-4 mt-2" style={{ borderTop: `1px solid ${C.outlineVariant}`, opacity: 0.55 }}>
            <Info size={13} style={{ color: C.outline, flexShrink: 0, marginTop: 1 }} />
            <p className="text-[10px] uppercase tracking-wide leading-relaxed" style={{ fontFamily: FONT, color: C.outline }}>
              Giá tham khảo được ghi nhận gần đây từ các nhà bán lẻ bên ngoài. Vui lòng kiểm tra lại tại nơi bán trước khi mua. DealSach không bán sách trực tiếp và không chịu trách nhiệm về giao hàng hay đổi trả.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
