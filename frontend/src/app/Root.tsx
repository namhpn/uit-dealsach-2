import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { Search, Heart, User, BookOpen, Menu, X, LogOut, Bell, ShieldCheck } from "lucide-react";
import { apiErrorMessage, BookSearchSuggestionDto, fetchBookSuggestions, fetchFilters, FiltersResponse, formatVnd } from "./api";
import { AuthProvider, useAuth } from "./auth";
import { C, FONT, border2, border3, shadow4, CategoryChip } from "./shared";

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<BookSearchSuggestionDto[]>([]);
  const [suggestionOpen, setSuggestionOpen] = useState(false);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FiltersResponse | null>(null);
  const [filterError, setFilterError] = useState<string | null>(null);
  const activeCategory = location.pathname === "/search" ? new URLSearchParams(location.search).get("category") : null;

  useEffect(() => {
    let alive = true;
    fetchFilters()
      .then((response) => {
        if (alive) setFilters(response);
      })
      .catch((err) => {
        if (alive) setFilterError(apiErrorMessage(err));
      });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (location.pathname !== "/search") {
      return;
    }

    setSearchQuery(new URLSearchParams(location.search).get("q") ?? "");
  }, [location.pathname, location.search]);

  useEffect(() => {
    const keyword = searchQuery.trim();
    if (keyword === "") {
      setSuggestions([]);
      setSuggestionLoading(false);
      setSuggestionError(null);
      return;
    }

    let alive = true;
    setSuggestionLoading(true);
    setSuggestionError(null);

    const timer = window.setTimeout(() => {
      fetchBookSuggestions(keyword, 6)
        .then((response) => {
          if (!alive) return;
          setSuggestions(response.items);
        })
        .catch((err) => {
          if (!alive) return;
          setSuggestionError(apiErrorMessage(err));
          setSuggestions([]);
        })
        .finally(() => {
          if (alive) setSuggestionLoading(false);
        });
    }, 180);

    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [searchQuery]);

  return (
    <header className="sticky top-0 z-50" style={{ background: C.white, borderBottom: border2 }}>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-3 pb-3 flex flex-wrap md:flex-nowrap items-start gap-3 md:gap-4">
        {/* Logo */}
        <a href="#" onClick={(e) => { e.preventDefault(); navigate("/"); }} className="order-1 flex items-center gap-2 shrink-0 pt-1">
          <div className="w-10 h-10 flex items-center justify-center" style={{ background: C.primary, border: border2 }}>
            <BookOpen size={20} style={{ color: C.white }} />
          </div>
          <span className="font-extrabold text-[22px] leading-none uppercase tracking-tight" style={{ color: C.primary, fontFamily: FONT, letterSpacing: "-0.02em" }}>
            DealSach
          </span>
        </a>

        {/* Search + chips column */}
        <div className="order-3 basis-full max-w-full md:order-2 md:basis-auto md:w-auto flex-1 flex flex-col gap-2 min-w-0">
          <div className="relative">
            <form className="flex min-w-0 items-stretch overflow-hidden"
              style={{ border: searchFocused ? border3 : border2, boxShadow: searchFocused ? shadow4 : "none", transition: "box-shadow 100ms" }}
              onSubmit={(e) => {
                e.preventDefault();
                const params = new URLSearchParams();
                if (searchQuery.trim()) params.set("q", searchQuery.trim());
                setSuggestionOpen(false);
                navigate(`/search${params.toString() ? `?${params}` : ""}`);
              }}
            >
              <div className="flex items-center justify-center px-3 shrink-0" style={{ background: C.white, borderRight: border2 }}>
                <Search size={16} style={{ color: C.primary }} />
              </div>
              <input type="text" value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSuggestionOpen(true);
                }}
                onFocus={() => {
                  setSearchFocused(true);
                  setSuggestionOpen(true);
                }}
                onBlur={() => {
                  setSearchFocused(false);
                  window.setTimeout(() => setSuggestionOpen(false), 120);
                }}
                placeholder="Tìm sách theo tên, tác giả, ISBN..."
                className="flex-1 px-3 py-3 text-sm outline-none border-none min-w-0"
                style={{ background: C.white, color: C.onSurface, fontFamily: FONT }}
              />
              <button type="submit" className="hidden px-3 sm:block sm:px-5 text-[12px] font-bold uppercase tracking-wide shrink-0"
                style={{ background: C.primary, color: C.white, fontFamily: FONT, borderLeft: border2 }}>
                <span>Tìm kiếm</span>
              </button>
            </form>

            {suggestionOpen && searchQuery.trim() !== "" && (
              <div className="absolute left-0 right-0 top-full mt-2 overflow-hidden" style={{ background: C.white, border: border2, boxShadow: shadow4, zIndex: 40 }}>
                {suggestionLoading && (
                  <p className="px-3 py-3 text-[12px] font-bold" style={{ color: C.onSurfaceVariant, fontFamily: FONT }}>Đang tải gợi ý...</p>
                )}
                {!suggestionLoading && suggestionError && (
                  <p className="px-3 py-3 text-[12px] font-bold" style={{ color: C.secondary, fontFamily: FONT }}>Không tải được gợi ý. Nhấn Enter để tìm kiếm.</p>
                )}
                {!suggestionLoading && !suggestionError && suggestions.length === 0 && (
                  <p className="px-3 py-3 text-[12px] font-bold" style={{ color: C.onSurfaceVariant, fontFamily: FONT }}>Không tìm thấy gợi ý phù hợp.</p>
                )}
                {!suggestionLoading && !suggestionError && suggestions.length > 0 && (
                  <ul>
                    {suggestions.map((item) => (
                      <li key={item.book_id} style={{ borderTop: `1px solid ${C.black}` }}>
                        <button
                          type="button"
                          className="flex w-full items-start justify-between gap-3 px-3 py-2 text-left"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => {
                            setSuggestionOpen(false);
                            navigate(`/book/${item.book_id}`);
                          }}
                        >
                          <span>
                            <span className="block text-[12px] font-extrabold" style={{ color: C.onSurface, fontFamily: FONT }}>{item.title}</span>
                            <span className="block text-[11px]" style={{ color: C.onSurfaceVariant, fontFamily: FONT }}>
                              {item.author} • {item.category}
                            </span>
                          </span>
                          <span className="mt-0.5 text-[11px] font-bold" style={{ color: item.lowest_eligible_price !== null ? C.secondary : C.onSurfaceVariant, fontFamily: FONT }}>
                            {item.lowest_eligible_price !== null ? formatVnd(item.lowest_eligible_price) : item.status.label}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Category chips */}
          <div className="flex items-center gap-2.5" style={{ overflowX: "auto", overflowY: "visible", flexWrap: "nowrap", paddingBottom: 4, scrollbarWidth: "none" }} title={filterError ?? undefined}>
            {filters?.categories.map(cat => (
              <CategoryChip key={cat.slug} label={cat.display_label ?? cat.name} active={activeCategory === cat.slug} onClick={() => {
                navigate(`/search?category=${encodeURIComponent(cat.slug)}`);
              }} />
            ))}
          </div>
        </div>

        {/* Icon buttons */}
        <div className="hidden md:flex order-3 items-center gap-2 shrink-0 self-start">
          <button
            aria-label="Danh sách yêu thích"
            title="Danh sách yêu thích"
            className="w-12 h-12 flex items-center justify-center"
            style={{ color: C.onSurface, border: border2, background: C.white }}
            onClick={() => auth.authenticated ? navigate("/wishlist") : auth.openAuthDialog()}
            onMouseEnter={e => (e.currentTarget.style.background = C.boneWhite)}
            onMouseLeave={e => (e.currentTarget.style.background = C.white)}
          >
            <Heart size={18} />
          </button>
          <button
            aria-label="Cảnh báo giá"
            title="Cảnh báo giá"
            className="w-12 h-12 flex items-center justify-center"
            style={{ color: C.onSurface, border: border2, background: C.white }}
            onClick={() => auth.authenticated ? navigate("/alerts") : auth.openAuthDialog()}
            onMouseEnter={e => (e.currentTarget.style.background = C.boneWhite)}
            onMouseLeave={e => (e.currentTarget.style.background = C.white)}
          >
            <Bell size={18} />
          </button>
          {auth.authenticated ? (
            <div className="flex items-center gap-2 px-3 h-12" style={{ border: border2, background: C.white, fontFamily: FONT }}>
              <User size={16} />
              <button type="button" onClick={() => navigate("/account")} className="max-w-[150px] truncate text-[12px] font-bold text-left" title="Cài đặt tài khoản">{auth.user?.email}</button>
              <button type="button" onClick={() => auth.logout()} title="Đăng xuất" aria-label="Đăng xuất" className="flex h-7 w-7 items-center justify-center" style={{ border: `1px solid ${C.black}`, background: C.boneWhite }}>
                <LogOut size={13} />
              </button>
            </div>
          ) : (
            <button
              aria-label="Tài khoản"
              title="Tài khoản"
              className="w-12 h-12 flex items-center justify-center"
              style={{ color: C.onSurface, border: border2, background: C.white }}
              onClick={auth.openAuthDialog}
              onMouseEnter={e => (e.currentTarget.style.background = C.boneWhite)}
              onMouseLeave={e => (e.currentTarget.style.background = C.white)}
            >
              <User size={18} />
            </button>
          )}
          {auth.user?.role === "admin" && (
            <button
              aria-label="Quản trị"
              title="Quản trị"
              className="w-12 h-12 flex items-center justify-center"
              style={{ color: C.primary, border: border2, background: C.primaryFixed }}
              onClick={() => navigate("/admin")}
            >
              <ShieldCheck size={18} />
            </button>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="order-2 md:hidden p-1.5 shrink-0 mt-1 ml-auto"
          style={{ color: C.onSurface, border: border2, background: C.white }}
          onClick={() => setMobileMenuOpen(o => !o)}>
          {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden" style={{ background: C.white, borderTop: border2 }}>
          <div className="flex">
            <button className="flex-1 text-xs font-bold uppercase py-3 tracking-wide"
              onClick={() => auth.authenticated ? navigate("/wishlist") : auth.openAuthDialog()}
              style={{ color: C.onSurface, fontFamily: FONT, borderRight: `1px solid ${C.black}` }}>Yêu thích</button>
            <button className="flex-1 text-xs font-bold uppercase py-3 tracking-wide"
              onClick={() => auth.authenticated ? navigate("/alerts") : auth.openAuthDialog()}
              style={{ color: C.onSurface, fontFamily: FONT, borderRight: `1px solid ${C.black}` }}>Cảnh báo</button>
            {auth.authenticated ? (
              <button className="flex-1 text-xs font-bold uppercase py-3 tracking-wide"
                onClick={() => navigate("/account")}
                style={{ color: C.onSurface, fontFamily: FONT, borderRight: `1px solid ${C.black}` }}>Tài khoản</button>
            ) : (
              <button className="flex-1 text-xs font-bold uppercase py-3 tracking-wide"
                onClick={auth.openAuthDialog}
                style={{ color: C.onSurface, fontFamily: FONT, borderRight: `1px solid ${C.black}` }}>Tài khoản</button>
            )}
            {auth.user?.role === "admin" && (
              <button className="flex-1 text-xs font-bold uppercase py-3 tracking-wide"
                onClick={() => navigate("/admin")}
                style={{ color: C.primary, fontFamily: FONT }}>Admin</button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-16" style={{ background: "rgb(0,53,39)", color: C.white, borderTop: border2 }}>
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 flex items-center justify-center" style={{ background: C.white, border: "2px solid #fff" }}>
                <BookOpen size={14} style={{ color: "rgb(0,53,39)" }} />
              </div>
              <span className="font-extrabold text-[16px] uppercase tracking-tight" style={{ fontFamily: FONT, color: C.white }}>DealSach</span>
            </div>
            <p className="text-[12px] leading-relaxed" style={{ color: "#80bea6", fontFamily: FONT }}>So sánh giá sách từ nhiều nhà bán lẻ uy tín tại Việt Nam. Chúng tôi không bán sách trực tiếp.</p>
          </div>
          {[
            { heading: "Khám phá",  links: ["Tìm kiếm sách", "Giảm giá hôm nay", "Ưu đãi phổ biến", "Danh mục"] },
            { heading: "Tài khoản", links: ["Đăng nhập / Đăng ký", "Danh sách yêu thích", "Cài đặt thông báo giá", "Cài đặt tài khoản"] },
            { heading: "Thông tin", links: ["Về DealSach", "Câu hỏi thường gặp", "Chính sách bảo mật", "Điều khoản sử dụng"] },
          ].map(col => (
            <div key={col.heading}>
              <h4 className="font-extrabold text-[11px] mb-3 uppercase tracking-widest" style={{ color: C.white, fontFamily: FONT }}>{col.heading}</h4>
              <ul className="space-y-1.5">
                {col.links.map(l => (
                  <li key={l}><a href="#" className="text-[12px] transition-colors hover:text-white" style={{ color: "#80bea6", fontFamily: FONT }}>{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" style={{ borderTop: "1px solid rgba(255,255,255,0.15)" }}>
          <p className="text-[11px] leading-relaxed max-w-2xl" style={{ color: "#80bea6", fontFamily: FONT }}>
            <strong style={{ color: C.white }}>Lưu ý:</strong> DealSach chỉ tổng hợp và so sánh giá tham khảo từ các nhà bán bên ngoài. Người đọc luôn kiểm tra lại thông tin tại nơi bán trước khi mua.
          </p>
          <p className="text-[11px] whitespace-nowrap font-bold uppercase tracking-wide" style={{ color: "#80bea6", fontFamily: FONT }}>© 2026 DealSach</p>
        </div>
      </div>
    </footer>
  );
}

function AppShell() {
  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: C.surface, color: C.onSurface, fontFamily: FONT }}>
      <Header />
      <Outlet />
      <Footer />
    </div>
  );
}

export default function Root() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
