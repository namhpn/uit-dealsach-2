import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Check, ChevronDown, Info, SlidersHorizontal, X } from "lucide-react";
import { apiErrorMessage, fetchBooks, fetchFilters, FiltersResponse, PaginatedBooksResponse } from "../api";
import { ApiBookCard, C, ErrorState, FONT, LoadingState, border2, border3, shadow4, shadow8 } from "../shared";

const visibleFilterKeys = ["q", "category", "author", "publisher", "retailer", "min_price", "max_price", "sort", "page"] as const;
const removableFilterKeys = ["q", "category", "author", "publisher", "retailer", "min_price", "max_price", "sort"] as const;
const defaultSort = "relevance";

type FilterGroupKey = "keyword" | "category" | "author" | "publisher" | "retailer" | "price";

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<FiltersResponse | null>(null);
  const [data, setData] = useState<PaginatedBooksResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [keywordInput, setKeywordInput] = useState("");
  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");
  const [openGroups, setOpenGroups] = useState<Record<FilterGroupKey, boolean>>({
    keyword: true,
    category: true,
    author: false,
    publisher: false,
    retailer: false,
    price: true,
  });

  const params = useMemo(() => {
    const clean = new URLSearchParams();
    visibleFilterKeys.forEach((key) => {
      const value = searchParams.get(key);
      if (value) {
        clean.set(key, value);
      }
    });

    const page = clean.get("page");
    if (!page || Number(page) < 1) {
      clean.set("page", "1");
    }

    return clean;
  }, [searchParams]);

  useEffect(() => {
    setKeywordInput(params.get("q") ?? "");
    setMinPriceInput(params.get("min_price") ?? "");
    setMaxPriceInput(params.get("max_price") ?? "");
  }, [params]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    Promise.all([fetchBooks(params), fetchFilters()])
      .then(([bookResponse, filterResponse]) => {
        if (!alive) {
          return;
        }

        setData(bookResponse);
        setFilters(filterResponse);
      })
      .catch((err) => {
        if (alive) {
          setError(apiErrorMessage(err));
        }
      })
      .finally(() => {
        if (alive) {
          setLoading(false);
        }
      });

    return () => {
      alive = false;
    };
  }, [params]);

  const activeChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; clear: () => void }> = [];
    const q = params.get("q");
    const category = params.get("category");
    const author = params.get("author");
    const publisher = params.get("publisher");
    const retailer = params.get("retailer");
    const minPrice = params.get("min_price");
    const maxPrice = params.get("max_price");
    const sort = params.get("sort") ?? defaultSort;

    if (q) {
      chips.push({ key: "q", label: `Từ khóa: ${q}`, clear: () => update({ q: "" }) });
    }

    if (category) {
      const categoryLabel = filters?.categories.find((item) => item.slug === category)?.display_label
        ?? filters?.categories.find((item) => item.slug === category)?.name
        ?? category;
      chips.push({ key: "category", label: `Danh mục: ${categoryLabel}`, clear: () => update({ category: "" }) });
    }

    if (author) {
      chips.push({ key: "author", label: `Tác giả: ${author}`, clear: () => update({ author: "" }) });
    }

    if (publisher) {
      chips.push({ key: "publisher", label: `NXB: ${publisher}`, clear: () => update({ publisher: "" }) });
    }

    if (retailer) {
      const retailerName = filters?.retailers.find((item) => item.slug === retailer)?.name ?? retailer;
      chips.push({ key: "retailer", label: `Nơi bán: ${retailerName}`, clear: () => update({ retailer: "" }) });
    }

    if (minPrice) {
      chips.push({ key: "min_price", label: `Giá từ: ${formatInteger(minPrice)} đ`, clear: () => update({ min_price: "" }) });
    }

    if (maxPrice) {
      chips.push({ key: "max_price", label: `Giá đến: ${formatInteger(maxPrice)} đ`, clear: () => update({ max_price: "" }) });
    }

    if (sort && sort !== defaultSort) {
      const sortLabel = filters?.sorts.find((item) => item.value === sort)?.label ?? sort;
      chips.push({ key: "sort", label: `Sắp xếp: ${sortLabel}`, clear: () => update({ sort: "" }) });
    }

    return chips;
  }, [filters, params]);

  function update(next: Record<string, string>) {
    const updated = new URLSearchParams(params);

    Object.entries(next).forEach(([key, value]) => {
      const normalized = value.trim();
      if (normalized === "") {
        updated.delete(key);
      } else {
        updated.set(key, normalized);
      }
    });

    updated.delete("availability");

    if (!("page" in next)) {
      updated.set("page", "1");
    }

    navigate(`/search?${updated.toString()}`);
  }

  function clearVisibleFilters() {
    const cleared = new URLSearchParams(params);
    removableFilterKeys.forEach((key) => cleared.delete(key));
    cleared.delete("availability");
    cleared.set("page", "1");
    setPriceError(null);
    navigate(`/search?${cleared.toString()}`);
  }

  function submitFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const priceValidationError = validatePriceRange(minPriceInput, maxPriceInput);
    if (priceValidationError) {
      setPriceError(priceValidationError);
      return;
    }

    setPriceError(null);
    update({
      q: keywordInput,
      min_price: minPriceInput,
      max_price: maxPriceInput,
    });
  }

  function toggleGroup(key: FilterGroupKey) {
    setOpenGroups((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  const page = data?.pagination.page ?? Number(params.get("page") ?? 1);
  const totalPages = data?.pagination.total_pages ?? 1;
  const paginationItems = buildPaginationItems(page, totalPages);
  const hasRemovableFilters = activeChips.length > 0;
  const query = params.get("q")?.trim() ?? "";
  const sortValue = params.get("sort") ?? defaultSort;

  return (
    <main className="mx-auto flex w-full max-w-[1320px] flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8" style={{ boxSizing: "border-box" }}>
      <button
        type="button"
        className="inline-flex w-fit items-center gap-2 px-3 py-2 text-[12px] font-extrabold uppercase lg:hidden"
        style={{ border: border2, background: C.white, color: C.onSurface, fontFamily: FONT, boxShadow: shadow4 }}
        onClick={() => setMobileFiltersOpen((prev) => !prev)}
        aria-expanded={mobileFiltersOpen}
        aria-controls="search-filter-panel"
      >
        <SlidersHorizontal size={14} />
        {mobileFiltersOpen ? "Ẩn bộ lọc" : "Bộ lọc"}
      </button>

      <section className="grid items-start gap-4 lg:grid-cols-[278px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside
          id="search-filter-panel"
          className={`${mobileFiltersOpen ? "block" : "hidden"} min-w-0 lg:block`}
          style={{ border: border2, background: C.white, boxShadow: shadow4 }}
        >
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: border2 }}>
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={16} style={{ color: C.primary }} />
              <h2 className="text-[12px] font-extrabold uppercase" style={{ color: C.onSurface, fontFamily: FONT }}>Bộ lọc</h2>
            </div>
            {hasRemovableFilters && (
              <button
                type="button"
                className="text-[11px] font-extrabold uppercase underline"
                style={{ color: C.primary, fontFamily: FONT }}
                onClick={clearVisibleFilters}
              >
                Xóa bộ lọc
              </button>
            )}
          </div>

          <form onSubmit={submitFilters} className="flex flex-col px-4 pb-4">
            <FilterGroup
              id="filter-group-keyword"
              label="Từ khóa"
              open={openGroups.keyword}
              onToggle={() => toggleGroup("keyword")}
            >
              <input
                value={keywordInput}
                onChange={(event) => setKeywordInput(event.target.value)}
                placeholder="Tên sách, tác giả, ISBN"
                className="w-full px-3 py-2 text-[13px] outline-none"
                style={{ border: border3, fontFamily: FONT, color: C.onSurface }}
              />
            </FilterGroup>

            <FilterGroup
              id="filter-group-category"
              label="Danh mục"
              open={openGroups.category}
              onToggle={() => toggleGroup("category")}
            >
              <FilterSingleSelectRows
                name="search-category"
                value={params.get("category") ?? ""}
                onChange={(value) => update({ category: value })}
                options={filters?.categories.map((item) => ({ value: item.slug, label: item.display_label ?? item.name })) ?? []}
              />
            </FilterGroup>

            <FilterGroup
              id="filter-group-author"
              label="Tác giả"
              open={openGroups.author}
              onToggle={() => toggleGroup("author")}
            >
              <FilterSingleSelectRows
                name="search-author"
                value={params.get("author") ?? ""}
                onChange={(value) => update({ author: value })}
                options={filters?.authors.map((item) => ({ value: item, label: item })) ?? []}
              />
            </FilterGroup>

            <FilterGroup
              id="filter-group-publisher"
              label="Nhà xuất bản"
              open={openGroups.publisher}
              onToggle={() => toggleGroup("publisher")}
            >
              <FilterSingleSelectRows
                name="search-publisher"
                value={params.get("publisher") ?? ""}
                onChange={(value) => update({ publisher: value })}
                options={filters?.publishers.map((item) => ({ value: item, label: item })) ?? []}
              />
            </FilterGroup>

            <FilterGroup
              id="filter-group-retailer"
              label="Nơi bán"
              open={openGroups.retailer}
              onToggle={() => toggleGroup("retailer")}
            >
              <FilterSingleSelectRows
                name="search-retailer"
                value={params.get("retailer") ?? ""}
                onChange={(value) => update({ retailer: value })}
                options={filters?.retailers.map((item) => ({ value: item.slug, label: item.name })) ?? []}
              />
            </FilterGroup>

            <FilterGroup
              id="filter-group-price"
              label="Khoảng giá (VND)"
              open={openGroups.price}
              onToggle={() => toggleGroup("price")}
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <FilterLabel label="Giá từ">
                  <input
                    value={minPriceInput}
                    onChange={(event) => setMinPriceInput(event.target.value)}
                    inputMode="numeric"
                    placeholder="0"
                    className="w-full px-3 py-2 text-[13px] outline-none"
                    style={{ border: border3, fontFamily: FONT, color: C.onSurface }}
                  />
                </FilterLabel>
                <FilterLabel label="Giá đến">
                  <input
                    value={maxPriceInput}
                    onChange={(event) => setMaxPriceInput(event.target.value)}
                    inputMode="numeric"
                    placeholder="999000"
                    className="w-full px-3 py-2 text-[13px] outline-none"
                    style={{ border: border3, fontFamily: FONT, color: C.onSurface }}
                  />
                </FilterLabel>
              </div>

              {priceError && (
                <p className="text-[12px] font-bold" style={{ color: C.dealRed, fontFamily: FONT }}>
                  {priceError}
                </p>
              )}

              <button
                type="submit"
                className="mt-1 px-4 py-2.5 text-[12px] font-extrabold uppercase"
                style={{ border: border3, background: C.primary, color: C.white, fontFamily: FONT, boxShadow: shadow4 }}
              >
                Áp dụng bộ lọc
              </button>
            </FilterGroup>
          </form>
        </aside>

        <section className="min-w-0">
          <div className="flex flex-col gap-3 p-4" style={{ border: border3, background: C.primaryContainer, boxShadow: shadow8 }}>
            {query ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold uppercase" style={{ color: "rgba(255,255,255,0.74)", fontFamily: FONT }}>
                  Kết quả tìm kiếm cho
                </span>
                <span className="px-3 py-1 text-[13px] font-extrabold" style={{ border: border2, background: C.primaryFixed, color: C.primary, fontFamily: FONT, boxShadow: shadow4 }}>
                  {query}
                </span>
              </div>
            ) : (
              <h1 className="text-[22px] font-extrabold uppercase leading-tight" style={{ color: C.white, fontFamily: FONT, letterSpacing: "-0.02em" }}>
                Kết quả tìm kiếm
              </h1>
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <p className="text-[13px] font-bold" style={{ color: C.white, fontFamily: FONT }}>
                Tìm thấy {(data?.pagination.total ?? 0).toLocaleString("vi-VN")} đầu sách
              </p>
              <div className="flex w-full max-w-[290px] flex-col gap-1 sm:w-auto">
                <span className="text-[10px] font-extrabold uppercase" style={{ color: "rgba(255,255,255,0.76)", fontFamily: FONT }}>
                  Sắp xếp
                </span>
                <div className="relative" style={{ boxShadow: shadow4 }}>
                  <select
                    value={sortValue}
                    onChange={(event) => update({ sort: event.target.value })}
                    className="w-full appearance-none px-3 py-2 pr-9 text-[13px] font-bold outline-none"
                    style={{ border: border3, background: C.white, color: C.onSurface, fontFamily: FONT }}
                  >
                    {(filters?.sorts ?? [{ value: defaultSort, label: "Liên quan nhất" }]).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" style={{ color: C.primary }} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-4">
            {loading && <LoadingState label="Đang tải kết quả tìm kiếm..." />}
            {error && <ErrorState message={error} />}
            {!loading && !error && data && (
              <>
                {hasRemovableFilters && (
                  <div className="flex flex-wrap items-center gap-2">
                    {activeChips.map((chip) => (
                      <button
                        key={chip.key}
                        type="button"
                        onClick={chip.clear}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-extrabold uppercase"
                        style={{ border: border2, background: C.primaryFixed, color: C.primary, fontFamily: FONT, boxShadow: shadow4 }}
                      >
                        {chip.label}
                        <X size={11} />
                      </button>
                    ))}
                  </div>
                )}

                {data.items.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {data.items.map((book) => (
                      <ApiBookCard
                        key={book.id}
                        book={book}
                        showPriceDropBadge
                        showPriceDisclaimer={false}
                        offerCountLabel="NƠI BÁN"
                        compactVariant
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4 px-4 py-10 text-center" style={{ border: border3, background: C.white, boxShadow: shadow4 }}>
                    <p className="text-[16px] font-extrabold uppercase" style={{ color: C.onSurface, fontFamily: FONT }}>
                      Chưa tìm thấy kết quả phù hợp
                    </p>
                    <p className="max-w-[520px] text-[13px]" style={{ color: C.onSurfaceVariant, fontFamily: FONT }}>
                      {data.empty_state?.message ?? "Hãy thử từ khóa ngắn hơn hoặc bỏ bớt bộ lọc."}
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={clearVisibleFilters}
                        className="px-4 py-2 text-[12px] font-extrabold uppercase"
                        style={{ border: border3, background: C.boneWhite, color: C.onSurface, fontFamily: FONT, boxShadow: shadow4 }}
                      >
                        Xóa bộ lọc
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate("/")}
                        className="px-4 py-2 text-[12px] font-extrabold uppercase"
                        style={{ border: border3, background: C.primary, color: C.white, fontFamily: FONT, boxShadow: shadow4 }}
                      >
                        Về trang chủ
                      </button>
                    </div>
                  </div>
                )}

                {totalPages > 1 && (
                  <nav className="flex flex-wrap items-center justify-center gap-2" aria-label="Phân trang kết quả tìm kiếm">
                    <PaginationButton
                      disabled={page <= 1}
                      active={false}
                      label="‹"
                      onClick={() => update({ page: String(page - 1) })}
                    />
                    {paginationItems.map((item, index) => (
                      typeof item === "number" ? (
                        <PaginationButton
                          key={item}
                          disabled={item === page}
                          active={item === page}
                          label={String(item)}
                          onClick={() => update({ page: String(item) })}
                        />
                      ) : (
                        <span
                          key={`ellipsis-${index}`}
                          className="flex h-10 w-10 items-center justify-center text-[13px] font-extrabold"
                          style={{ border: border2, background: C.white, color: C.onSurfaceVariant, fontFamily: FONT }}
                        >
                          ...
                        </span>
                      )
                    ))}
                    <PaginationButton
                      disabled={page >= totalPages}
                      active={false}
                      label="›"
                      onClick={() => update({ page: String(page + 1) })}
                    />
                  </nav>
                )}

                <div className="mt-1 flex items-start gap-2 pt-4" style={{ borderTop: `1px solid ${C.outlineVariant}`, opacity: 0.72 }}>
                  <Info size={13} style={{ color: C.outline, marginTop: 1, flexShrink: 0 }} />
                  <p className="text-[10px] uppercase leading-relaxed" style={{ color: C.outline, fontFamily: FONT, letterSpacing: "0.04em" }}>
                    Giá tham khảo được ghi nhận gần đây từ các nhà bán bên ngoài. Vui lòng kiểm tra lại tại nơi bán trước khi mua. DealSach không bán sách trực tiếp và không xử lý giao hàng hay đổi trả.
                  </p>
                </div>
              </>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

function FilterLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-extrabold uppercase" style={{ color: C.outline, fontFamily: FONT }}>
        {label}
      </span>
      {children}
    </label>
  );
}

function FilterGroup({
  id,
  label,
  open,
  onToggle,
  children,
}: {
  id: string;
  label: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="pt-3" style={{ borderTop: `1px solid ${C.outlineVariant}` }}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={id}
        className="flex w-full items-center justify-between pb-2"
      >
        <span className="text-[10px] font-extrabold uppercase" style={{ color: C.primary, fontFamily: FONT, letterSpacing: "0.08em" }}>
          {label}
        </span>
        <ChevronDown size={14} style={{ color: C.primary, transform: open ? "rotate(180deg)" : "none", transition: "transform 150ms" }} />
      </button>
      {open && (
        <div id={id} className="flex flex-col gap-2 pb-1">
          {children}
        </div>
      )}
    </section>
  );
}

function FilterSingleSelectRows({
  name,
  value,
  options,
  onChange,
}: {
  name: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  const allRows = [{ value: "", label: "Tất cả" }, ...options];

  return (
    <div role="radiogroup" className="max-h-52 space-y-1 overflow-y-auto pr-1">
      {allRows.map((option) => (
        <label
          key={option.value || `${name}-all`}
          className="flex cursor-pointer items-center gap-2 px-2 py-1.5"
          style={{ border: border2, background: value === option.value ? C.primaryFixed : C.white, boxShadow: value === option.value ? "none" : shadow4, transform: value === option.value ? "translate(2px,2px)" : "none", transition: "transform 80ms, box-shadow 80ms, background 80ms" }}
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="sr-only"
          />
          <span className="flex h-4 w-4 items-center justify-center" style={{ border: border2, background: value === option.value ? C.primary : C.white }}>
            {value === option.value && <Check size={10} style={{ color: C.white }} />}
          </span>
          <span className="line-clamp-1 text-[11px] font-bold uppercase" style={{ color: value === option.value ? C.primary : C.onSurface, fontFamily: FONT }}>
            {option.label}
          </span>
        </label>
      ))}
    </div>
  );
}

function PaginationButton({
  label,
  onClick,
  disabled,
  active,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
  active: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-10 w-10 items-center justify-center text-[13px] font-extrabold uppercase disabled:cursor-not-allowed disabled:opacity-45"
      style={{
        border: border2,
        background: active ? C.primary : C.white,
        color: active ? C.white : C.onSurface,
        fontFamily: FONT,
        boxShadow: active ? "none" : shadow4,
        transform: active ? "translate(4px,4px)" : "none",
      }}
    >
      {label}
    </button>
  );
}

function buildPaginationItems(page: number, totalPages: number): Array<number | "..."> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const items: Array<number | "..."> = [1];

  if (page > 3) {
    items.push("...");
  }

  for (let current = Math.max(2, page - 1); current <= Math.min(totalPages - 1, page + 1); current += 1) {
    items.push(current);
  }

  if (page < totalPages - 2) {
    items.push("...");
  }

  items.push(totalPages);
  return items;
}

function validatePriceRange(minPrice: string, maxPrice: string): string | null {
  const min = minPrice.trim();
  const max = maxPrice.trim();

  if (min !== "" && !/^\d+$/.test(min)) {
    return "Giá từ phải là số nguyên VND không âm.";
  }

  if (max !== "" && !/^\d+$/.test(max)) {
    return "Giá đến phải là số nguyên VND không âm.";
  }

  if (min !== "" && max !== "" && Number(min) > Number(max)) {
    return "Giá từ không được lớn hơn giá đến.";
  }

  return null;
}

function formatInteger(value: string): string {
  const numeric = Number.parseInt(value, 10);
  if (Number.isNaN(numeric)) {
    return value;
  }

  return numeric.toLocaleString("vi-VN");
}
