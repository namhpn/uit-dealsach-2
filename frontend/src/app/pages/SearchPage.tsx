import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { SlidersHorizontal } from "lucide-react";
import { apiErrorMessage, fetchBooks, fetchFilters, FiltersResponse, PaginatedBooksResponse } from "../api";
import { ApiBookGrid, C, EmptyState, ErrorState, FONT, LoadingState, PriceDisclaimer, border2, shadow4 } from "../shared";

const filterKeys = ["q", "category", "author", "publisher", "retailer", "availability", "min_price", "max_price", "sort", "page"] as const;

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<FiltersResponse | null>(null);
  const [data, setData] = useState<PaginatedBooksResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const params = useMemo(() => {
    const clean = new URLSearchParams();
    filterKeys.forEach((key) => {
      const value = searchParams.get(key);
      if (value) clean.set(key, value);
    });
    if (!clean.get("page")) clean.set("page", "1");
    return clean;
  }, [searchParams]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    Promise.all([fetchBooks(params), fetchFilters()])
      .then(([bookResponse, filterResponse]) => {
        if (!alive) return;
        setData(bookResponse);
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
  }, [params]);

  function update(next: Record<string, string>) {
    const updated = new URLSearchParams(params);
    Object.entries(next).forEach(([key, value]) => {
      if (value) updated.set(key, value);
      else updated.delete(key);
    });
    if (!("page" in next)) updated.set("page", "1");
    navigate(`/search?${updated.toString()}`);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    update({
      q: String(form.get("q") ?? ""),
      min_price: String(form.get("min_price") ?? ""),
      max_price: String(form.get("max_price") ?? ""),
    });
  }

  return (
    <main className="mx-auto flex max-w-[1200px] flex-col gap-8 py-10" style={{ width: "min(1200px, calc(100vw - 32px))", boxSizing: "border-box" }}>
      <section className="flex flex-col gap-4">
        <h1 className="text-[30px] font-extrabold uppercase leading-tight" style={{ fontFamily: FONT }}>Tìm kiếm sách</h1>
        <div className="max-w-[300px] sm:max-w-none"><PriceDisclaimer /></div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="w-full max-w-full self-start overflow-hidden p-4" style={{ background: C.white, border: border2, boxShadow: shadow4, boxSizing: "border-box" }}>
          <div className="mb-4 flex items-center gap-2">
            <SlidersHorizontal size={18} style={{ color: C.primary }} />
            <h2 className="text-[13px] font-extrabold uppercase tracking-wide" style={{ fontFamily: FONT }}>Bộ lọc</h2>
          </div>
          <form onSubmit={submit} className="flex flex-col gap-3">
            <input name="q" defaultValue={params.get("q") ?? ""} placeholder="Tên sách, tác giả, ISBN" className="w-full px-3 py-2 text-sm outline-none" style={{ border: border2, fontFamily: FONT }} />
            <Select label="Danh mục" value={params.get("category") ?? ""} onChange={(value) => update({ category: value })} options={filters?.categories.map((item) => ({ value: item.slug, label: item.name })) ?? []} />
            <Select label="Tác giả" value={params.get("author") ?? ""} onChange={(value) => update({ author: value })} options={filters?.authors.map((item) => ({ value: item, label: item })) ?? []} />
            <Select label="Nhà xuất bản" value={params.get("publisher") ?? ""} onChange={(value) => update({ publisher: value })} options={filters?.publishers.map((item) => ({ value: item, label: item })) ?? []} />
            <Select label="Nơi bán" value={params.get("retailer") ?? ""} onChange={(value) => update({ retailer: value })} options={filters?.retailers.map((item) => ({ value: item.slug, label: item.name })) ?? []} />
            <Select label="Tình trạng" value={params.get("availability") ?? "all"} onChange={(value) => update({ availability: value })} options={filters?.availability.map((item) => ({ value: item.value, label: item.label })) ?? []} />
            <Select label="Sắp xếp" value={params.get("sort") ?? "relevance"} onChange={(value) => update({ sort: value })} options={filters?.sorts.map((item) => ({ value: item.value, label: item.label })) ?? []} />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input name="min_price" defaultValue={params.get("min_price") ?? ""} placeholder="Giá từ" inputMode="numeric" className="min-w-0 px-3 py-2 text-sm outline-none" style={{ border: border2, fontFamily: FONT }} />
              <input name="max_price" defaultValue={params.get("max_price") ?? ""} placeholder="Giá đến" inputMode="numeric" className="min-w-0 px-3 py-2 text-sm outline-none" style={{ border: border2, fontFamily: FONT }} />
            </div>
            <button className="px-4 py-3 text-[12px] font-extrabold uppercase" style={{ background: C.primary, color: C.white, border: border2, fontFamily: FONT }}>Áp dụng</button>
          </form>
        </aside>

        <section className="flex min-w-0 flex-col gap-5">
          {loading && <LoadingState label="Đang tải danh sách sách..." />}
          {error && <ErrorState message={error} />}
          {data && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-bold" style={{ fontFamily: FONT }}>{data.pagination.total} sách phù hợp</p>
                <p className="text-xs" style={{ color: C.onSurfaceVariant, fontFamily: FONT }}>Trang {data.pagination.page}/{Math.max(data.pagination.total_pages, 1)}</p>
              </div>
              {data.items.length > 0 ? <ApiBookGrid books={data.items} /> : <EmptyState message={data.empty_state?.message ?? "Hãy thử từ khóa ngắn hơn hoặc bỏ bớt bộ lọc."} />}
              <div className="flex justify-center gap-3">
                <button disabled={data.pagination.page <= 1} onClick={() => update({ page: String(data.pagination.page - 1) })} className="px-4 py-2 text-xs font-extrabold uppercase disabled:opacity-40" style={{ border: border2, background: C.white, fontFamily: FONT }}>Trước</button>
                <button disabled={data.pagination.page >= data.pagination.total_pages} onClick={() => update({ page: String(data.pagination.page + 1) })} className="px-4 py-2 text-xs font-extrabold uppercase disabled:opacity-40" style={{ border: border2, background: C.white, fontFamily: FONT }}>Sau</button>
              </div>
            </>
          )}
        </section>
      </section>
    </main>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (value: string) => void }) {
  return (
    <label className="flex flex-col gap-1 text-[11px] font-extrabold uppercase tracking-wide" style={{ color: C.outline, fontFamily: FONT }}>
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full min-w-0 px-3 py-2 text-sm normal-case outline-none" style={{ border: border2, color: C.onSurface, fontFamily: FONT }}>
        <option value="">Tất cả</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}
