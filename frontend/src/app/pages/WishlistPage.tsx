import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { ArrowRight, Heart, Trash2 } from "lucide-react";
import { apiErrorMessage, BookCardDto, fetchWishlist, formatVnd, removeWishlistBook } from "../api";
import { useAuth } from "../auth";
import { C, CoverImage, EmptyState, ErrorState, FONT, LoadingState, NbButton, PageIntro, PageShell, PriceDisclaimer, PromptCard, SectionHeader, StampHeading, border2, shadow4 } from "../shared";

export default function WishlistPage() {
  const auth = useAuth();
  const [items, setItems] = useState<BookCardDto[]>([]);
  const [removingIds, setRemovingIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.authenticated) {
      setItems([]);
      return;
    }

    let alive = true;
    setLoading(true);
    setError(null);
    fetchWishlist()
      .then((response) => {
        if (alive) setItems(response.items);
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
  }, [auth.authenticated]);

  const removePending = useMemo(() => removingIds.size > 0, [removingIds]);

  async function remove(bookId: number) {
    if (removingIds.has(bookId)) return;
    setError(null);
    setRemovingIds((current) => {
      const next = new Set(current);
      next.add(bookId);
      return next;
    });
    try {
      await removeWishlistBook(bookId);
      setItems((current) => current.filter((item) => item.id !== bookId));
    } catch (err) {
      setError(`Không thể bỏ lưu sách ngay lúc này. ${apiErrorMessage(err)}`);
    } finally {
      setRemovingIds((current) => {
        const next = new Set(current);
        next.delete(bookId);
        return next;
      });
    }
  }

  if (!auth.authenticated) {
    return (
      <PageShell>
        <PromptCard
          icon={<Heart size={20} style={{ color: C.primary }} />}
          title="Danh sách yêu thích"
          description="Vui lòng đăng nhập bằng email để xem và quản lý sách đã lưu."
          cta={<NbButton onClick={auth.openAuthDialog}>Đăng nhập / Đăng ký</NbButton>}
        />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex max-w-[760px] flex-col gap-4">
            <StampHeading title="Danh sách yêu thích" icon={<Heart size={20} style={{ color: C.primary }} />} />
            <PageIntro>Theo dõi những đầu sách bạn quan tâm để quay lại nhanh khi cần so sánh giá và nơi bán.</PageIntro>
          </div>
        </div>
      </section>

      <section className="pb-2">
        <SectionHeader
          title="Đang theo dõi"
          count={items.length}
          countLabel={`${items.length} cuốn đã lưu`}
          description="Theo dõi những đầu sách bạn quan tâm để mua nhanh khi giá và nơi bán phù hợp."
        />
      </section>

      {loading && <LoadingState label="Đang tải danh sách yêu thích..." />}
      {error && <ErrorState message={error} />}
      {!loading && items.length === 0 && (
        <section className="flex flex-col items-center gap-3 px-5 py-12 text-center" style={{ border: border2, background: C.white, boxShadow: shadow4 }}>
          <EmptyState message="Bạn chưa lưu sách nào. Hãy bấm biểu tượng trái tim trên thẻ sách hoặc trang chi tiết." />
          <Link
            to="/search"
            className="inline-flex items-center gap-2 px-4 py-2 text-[12px] font-extrabold uppercase"
            style={{ border: border2, boxShadow: shadow4, background: C.primary, color: C.white, fontFamily: FONT }}
          >
            Khám phá sách
            <ArrowRight size={14} />
          </Link>
        </section>
      )}

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {items.map((book) => (
          <article
            key={book.id}
            className="group flex min-h-[220px] overflow-hidden transition-transform duration-150 hover:-translate-y-0.5"
            style={{ background: C.white, border: border2, boxShadow: shadow4 }}
          >
            <div className="w-[96px] shrink-0 overflow-hidden sm:w-[104px]" style={{ background: C.surfaceContainer, borderRight: border2 }}>
              <div className="h-full min-h-[220px] w-full overflow-hidden">
                <CoverImage title={book.title} src={book.cover_image} />
              </div>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <span
                    className="mb-2 inline-flex max-w-full truncate px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                    style={{ color: C.outline, fontFamily: FONT, border: `1px solid ${C.outlineVariant}`, background: C.boneWhite }}
                  >
                    {book.category}
                  </span>
                  {book.archived ? (
                    <h3 className="line-clamp-2 text-[15px] font-extrabold leading-snug" style={{ color: C.onSurface, fontFamily: FONT }}>
                      {book.title}
                    </h3>
                  ) : (
                    <Link to={`/book/${book.id}`} className="line-clamp-2 text-[15px] font-extrabold leading-snug hover:underline" style={{ color: C.onSurface, fontFamily: FONT }}>
                      {book.title}
                    </Link>
                  )}
                </div>
                {book.archived && (
                  <span className="shrink-0 px-2 py-1 text-[10px] font-bold uppercase" style={{ background: C.surfaceVariant, border: `1px solid ${C.black}`, color: C.onSurfaceVariant, fontFamily: FONT }}>
                    Đã lưu trữ
                  </span>
                )}
              </div>
              <p className="line-clamp-1 text-[12px]" style={{ color: C.onSurfaceVariant, fontFamily: FONT }}>
                {book.author} · {book.publisher}
              </p>
              <p className="text-[10px] uppercase tracking-wide" style={{ color: C.outline, fontFamily: FONT }}>
                {formatAddedAt(book.added_at)}
              </p>
              <div className="flex flex-wrap items-end gap-3">
                {book.lowest_eligible_price !== null ? (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: C.outline, fontFamily: FONT }}>
                      Giá hiện tại
                    </span>
                    <span className="text-[18px] font-extrabold leading-none" style={{ color: C.dealRed, fontFamily: FONT }}>
                      {formatVnd(book.lowest_eligible_price)}
                    </span>
                    {book.highest_eligible_price !== null && book.highest_eligible_price > book.lowest_eligible_price && (
                      <span className="text-[11px] leading-none line-through" style={{ color: C.outline, fontFamily: FONT }}>
                        {formatVnd(book.highest_eligible_price)}
                      </span>
                    )}
                    <span
                      className="mt-1 inline-flex w-fit px-1.5 py-0.5 text-[10px] font-bold uppercase"
                      style={{ background: C.boneWhite, color: C.onSurface, fontFamily: FONT, border: `1px solid ${C.black}` }}
                    >
                      {book.offer_count} nơi bán
                    </span>
                  </div>
                ) : (
                  <span
                    className="inline-flex w-fit px-2 py-1 text-[10px] font-bold uppercase"
                    style={{ background: C.surfaceVariant, border: `1px solid ${C.black}`, color: C.onSurfaceVariant, fontFamily: FONT }}
                  >
                    {book.status.label}
                  </span>
                )}
              </div>
              <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-1">
                <div className="max-w-[270px]">
                  <PriceDisclaimer compact />
                </div>
                <button
                  type="button"
                  onClick={() => remove(book.id)}
                  disabled={removingIds.has(book.id)}
                  className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-extrabold uppercase tracking-wide disabled:cursor-not-allowed disabled:opacity-70"
                  style={{
                    background: C.boneWhite,
                    border: border2,
                    color: C.onSurface,
                    fontFamily: FONT,
                    boxShadow: removingIds.has(book.id) ? "none" : shadow4,
                    transform: removingIds.has(book.id) ? "translate(4px,4px)" : "none",
                    transition: "box-shadow 80ms, transform 80ms",
                  }}
                >
                  <Trash2 size={13} />
                  {removingIds.has(book.id) ? "Đang bỏ lưu..." : "Bỏ lưu"}
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>
      {removePending && <p className="text-[11px] uppercase" style={{ color: C.outline, fontFamily: FONT }}>Đang cập nhật danh sách yêu thích...</p>}
    </PageShell>
  );
}

function formatAddedAt(value: string | undefined): string {
  if (!value) {
    return "Đã lưu gần đây";
  }

  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return "Đã lưu gần đây";
  }

  return `Đã lưu: ${new Intl.DateTimeFormat("vi-VN", { dateStyle: "short" }).format(parsed)}`;
}
