import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Heart, Trash2 } from "lucide-react";
import { apiErrorMessage, BookCardDto, fetchWishlist, formatVnd, removeWishlistBook } from "../api";
import { useAuth } from "../auth";
import { C, CoverImage, EmptyState, ErrorState, FONT, LoadingState, NbButton, PriceDisclaimer, border2, shadow4, shadow8 } from "../shared";

export default function WishlistPage() {
  const auth = useAuth();
  const [items, setItems] = useState<BookCardDto[]>([]);
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

  async function remove(bookId: number) {
    setError(null);
    try {
      await removeWishlistBook(bookId);
      setItems((current) => current.filter((item) => item.id !== bookId));
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  if (!auth.authenticated) {
    return (
      <main className="mx-auto flex max-w-[900px] flex-col gap-6 px-4 py-10 sm:px-8">
        <section className="p-6" style={{ background: C.white, border: border2, boxShadow: shadow8, fontFamily: FONT }}>
          <div className="mb-4 flex items-center gap-3">
            <Heart size={24} style={{ color: C.primary }} />
            <h1 className="text-[24px] font-extrabold uppercase">Danh sách yêu thích</h1>
          </div>
          <p className="mb-5 text-[14px] leading-relaxed" style={{ color: C.onSurfaceVariant }}>
            Vui lòng đăng nhập bằng email để xem và quản lý sách đã lưu.
          </p>
          <NbButton onClick={auth.openAuthDialog}>Đăng nhập / Đăng ký</NbButton>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-[1100px] flex-col gap-7 px-4 py-10 sm:px-8">
      <section className="flex flex-col gap-2">
        <h1 className="text-[30px] font-extrabold uppercase leading-tight" style={{ fontFamily: FONT }}>Danh sách yêu thích</h1>
        <p className="text-[13px]" style={{ color: C.onSurfaceVariant, fontFamily: FONT }}>
          Đang đăng nhập bằng {auth.user?.email}
        </p>
      </section>

      {loading && <LoadingState label="Đang tải danh sách yêu thích..." />}
      {error && <ErrorState message={error} />}
      {!loading && items.length === 0 && <EmptyState message="Bạn chưa lưu sách nào. Hãy bấm biểu tượng trái tim trên thẻ sách hoặc trang chi tiết." />}

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {items.map((book) => (
          <article key={book.id} className="flex overflow-hidden" style={{ background: C.white, border: border2, boxShadow: shadow4 }}>
            <div className="w-28 shrink-0" style={{ background: C.surfaceContainer, borderRight: border2 }}>
              <CoverImage title={book.title} src={book.cover_image} />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase" style={{ color: C.outline, fontFamily: FONT }}>{book.category}</p>
                  {book.archived ? (
                    <h2 className="line-clamp-2 text-[15px] font-extrabold" style={{ color: C.onSurface, fontFamily: FONT }}>{book.title}</h2>
                  ) : (
                    <Link to={`/book/${book.id}`} className="line-clamp-2 text-[15px] font-extrabold" style={{ color: C.onSurface, fontFamily: FONT }}>{book.title}</Link>
                  )}
                </div>
                {book.archived && (
                  <span className="shrink-0 px-2 py-1 text-[10px] font-bold uppercase" style={{ background: C.surfaceVariant, border: `1px solid ${C.black}`, color: C.onSurfaceVariant, fontFamily: FONT }}>
                    Đã lưu trữ
                  </span>
                )}
              </div>
              <p className="line-clamp-1 text-[12px]" style={{ color: C.onSurfaceVariant, fontFamily: FONT }}>{book.author} / {book.publisher}</p>
              {book.lowest_eligible_price !== null ? (
                <p className="text-[18px] font-extrabold" style={{ color: C.secondary, fontFamily: FONT }}>{formatVnd(book.lowest_eligible_price)}</p>
              ) : (
                <span className="self-start px-2 py-1 text-[10px] font-bold" style={{ background: C.surfaceVariant, border: `1px solid ${C.black}`, color: C.onSurfaceVariant, fontFamily: FONT }}>{book.status.label}</span>
              )}
              <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
                <PriceDisclaimer compact />
                <button type="button" onClick={() => remove(book.id)} className="flex items-center gap-1 px-3 py-2 text-[11px] font-extrabold uppercase" style={{ background: C.boneWhite, border: border2, color: C.onSurface, fontFamily: FONT }}>
                  <Trash2 size={13} />
                  Bỏ lưu
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
