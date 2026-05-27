import { ReactNode, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Plus, RotateCcw, Archive, Save } from "lucide-react";
import {
  AdminBookDto,
  AdminCategoryDto,
  AdminMerchantDto,
  AdminOfferDto,
  AdminRetailerDto,
  apiErrorMessage,
  archiveAdminBook,
  archiveAdminCategory,
  archiveAdminMerchant,
  archiveAdminRetailer,
  createAdminBook,
  createAdminCategory,
  createAdminMerchant,
  createAdminOffer,
  createAdminRetailer,
  fetchAdminBooks,
  fetchAdminCategories,
  fetchAdminMerchants,
  fetchAdminOffers,
  fetchAdminRetailers,
  formatDateTime,
  formatVnd,
  restoreAdminBook,
  restoreAdminCategory,
  restoreAdminMerchant,
  restoreAdminRetailer,
  updateAdminBook,
  updateAdminCategory,
  updateAdminMerchant,
  updateAdminOffer,
  updateAdminRetailer,
} from "../api";
import { C, ErrorState, LoadingState, NbButton, border2, shadow4 } from "../shared";
import { AdminGate } from "./AdminPage";

type Kind = "categories" | "books" | "retailers" | "merchants" | "offers";
type AnyItem = AdminCategoryDto | AdminBookDto | AdminRetailerDto | AdminMerchantDto | AdminOfferDto;

const TITLES: Record<Kind, string> = {
  categories: "Danh mục",
  books: "Sách",
  retailers: "Nền tảng bán lẻ",
  merchants: "Nhà bán",
  offers: "Ưu đãi",
};

export default function AdminCatalogPage({ kind }: { kind: Kind }) {
  const [items, setItems] = useState<AnyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const activeCategories = useMemo(() => items.filter((item) => "status" in item && item.status === "active"), [items]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await listApi(kind)();
      setItems(data.items as AnyItem[]);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [kind]);

  async function submit() {
    setError(null);
    setMessage(null);
    try {
      await createApi(kind)(payload(kind, form));
      setForm({});
      setMessage("Đã lưu bản ghi catalog.");
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  async function quickSave(item: AnyItem, patch: Record<string, unknown>) {
    setError(null);
    try {
      await updateApi(kind)(item.id, patch);
      setMessage("Đã cập nhật bản ghi.");
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  async function lifecycle(item: AnyItem) {
    if (kind === "offers") return;
    setError(null);
    try {
      const isActive = "status" in item && item.status === "active";
      await (isActive ? archiveApi(kind) : restoreApi(kind))(item.id);
      setMessage(isActive ? "Đã lưu trữ bản ghi." : "Đã khôi phục bản ghi.");
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  return (
    <AdminGate>
      <main className="mx-auto flex min-w-[768px] max-w-[1240px] flex-col gap-5 px-8 py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-[28px] font-extrabold uppercase">{TITLES[kind]}</h1>
          <Link className="text-[13px] font-bold underline" to="/admin">Về Admin</Link>
        </div>
        <section className="grid grid-cols-[1fr_auto] gap-3 p-4" style={{ background: C.white, border: border2, boxShadow: shadow4 }}>
          <div className="grid grid-cols-4 gap-3">{fields(kind).map((field) => <Input key={field.name} field={field} value={form[field.name] ?? ""} onChange={(value) => setForm((current) => ({ ...current, [field.name]: value }))} />)}</div>
          <button type="button" onClick={submit} title="Tạo bản ghi" aria-label="Tạo bản ghi" className="flex h-11 w-11 items-center justify-center self-end" style={{ background: C.primary, color: C.white, border: border2 }}><Plus size={18} /></button>
        </section>
        {message && <p className="p-3 text-[13px] font-bold" style={{ background: C.primaryFixed, border: border2, color: C.primary }}>{message}</p>}
        {error && <ErrorState message={error} />}
        {loading ? <LoadingState label={`Đang tải ${TITLES[kind].toLowerCase()}...`} /> : (
          <table className="w-full border-collapse text-[13px]" style={{ background: C.white, border: border2, boxShadow: shadow4 }}>
            <thead style={{ background: C.boneWhite }}><tr>{headers(kind).map((h) => <th key={h} className="p-3 text-left uppercase" style={{ border: border2 }}>{h}</th>)}</tr></thead>
            <tbody>
              {items.map((item) => <Row key={item.id} kind={kind} item={item} onLifecycle={() => lifecycle(item)} onSave={(patch) => quickSave(item, patch)} categories={activeCategories as AdminCategoryDto[]} />)}
            </tbody>
          </table>
        )}
      </main>
    </AdminGate>
  );
}

function Row({ kind, item, onLifecycle, onSave }: { kind: Kind; item: AnyItem; onLifecycle: () => void; onSave: (patch: Record<string, unknown>) => void; categories: AdminCategoryDto[] }) {
  if (kind === "books") {
    const book = item as AdminBookDto;
    return <TableRow cells={[book.title, book.author, book.category.name, book.is_featured ? "Nổi bật" : "Thường", statusLabel(book.status), `${book.offer_count ?? 0} ưu đãi`]} action={<><NbButton small onClick={() => onSave({ is_featured: !book.is_featured })}>Nổi bật</NbButton><LifeButton status={book.status} onClick={onLifecycle} /></>} />;
  }
  if (kind === "retailers") {
    const retailer = item as AdminRetailerDto;
    return <TableRow cells={[retailer.name, retailer.slug, retailer.approved_domains.join(", "), statusLabel(retailer.status), `${retailer.merchant_count ?? 0} nhà bán`]} action={<LifeButton status={retailer.status} onClick={onLifecycle} />} />;
  }
  if (kind === "merchants") {
    const merchant = item as AdminMerchantDto;
    return <TableRow cells={[merchant.name, merchant.slug, merchant.retailer.name, statusLabel(merchant.status), `${merchant.offer_count ?? 0} ưu đãi`]} action={<LifeButton status={merchant.status} onClick={onLifecycle} />} />;
  }
  if (kind === "offers") {
    const offer = item as AdminOfferDto;
    return <TableRow cells={[offer.external_offer_title, offer.book_title, `${offer.retailer_name} / ${offer.merchant_name}`, offerStatusLabel(offer.status), offer.latest_observation ? `${offer.latest_observation.listed_item_price ? formatVnd(offer.latest_observation.listed_item_price) : "Hết hàng"} - ${formatDateTime(offer.latest_observation.observed_at)}` : "Chưa có", offer.eligibility_review.purchasable ? "Đủ điều kiện" : offer.eligibility_review.reasons.join(", ")]} action={<><Link className="text-[12px] font-bold underline" to={`/admin/offers/${offer.id}`}>Quan sát</Link><NbButton small onClick={() => onSave({ status: offer.status === "active" ? "inactive" : "active" })}><Save size={13} /> Trạng thái</NbButton></>} />;
  }
  const category = item as AdminCategoryDto;
  return <TableRow cells={[category.name, category.slug, statusLabel(category.status), `${category.book_count ?? 0} sách`, formatDateTime(category.updated_at)]} action={<LifeButton status={category.status} onClick={onLifecycle} />} />;
}

function TableRow({ cells, action }: { cells: ReactNode[]; action: ReactNode }) {
  return <tr>{cells.map((cell, index) => <td key={index} className="p-3 align-top" style={{ border: border2 }}>{cell}</td>)}<td className="p-3" style={{ border: border2 }}><div className="flex flex-wrap items-center gap-2">{action}</div></td></tr>;
}

function LifeButton({ status, onClick }: { status: string; onClick: () => void }) {
  const active = status === "active";
  return <NbButton small variant={active ? "secondary" : "primary"} onClick={onClick}>{active ? <Archive size={13} /> : <RotateCcw size={13} />} {active ? "Lưu trữ" : "Khôi phục"}</NbButton>;
}

function Input({ field, value, onChange }: { field: { name: string; label: string }; value: string; onChange: (value: string) => void }) {
  return <label className="flex flex-col gap-1 text-[12px] font-bold uppercase">{field.label}<input className="h-10 px-3 text-[13px] normal-case" style={{ border: border2, background: C.boneWhite }} value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function listApi(kind: Kind) {
  return ({ categories: fetchAdminCategories, books: fetchAdminBooks, retailers: fetchAdminRetailers, merchants: fetchAdminMerchants, offers: fetchAdminOffers })[kind];
}

function createApi(kind: Kind) {
  return ({ categories: createAdminCategory, books: createAdminBook, retailers: createAdminRetailer, merchants: createAdminMerchant, offers: createAdminOffer })[kind] as (payload: Record<string, unknown>) => Promise<unknown>;
}

function updateApi(kind: Kind) {
  return ({ categories: updateAdminCategory, books: updateAdminBook, retailers: updateAdminRetailer, merchants: updateAdminMerchant, offers: updateAdminOffer })[kind] as (id: number, payload: Record<string, unknown>) => Promise<unknown>;
}

function archiveApi(kind: Exclude<Kind, "offers">) {
  return ({ categories: archiveAdminCategory, books: archiveAdminBook, retailers: archiveAdminRetailer, merchants: archiveAdminMerchant })[kind];
}

function restoreApi(kind: Exclude<Kind, "offers">) {
  return ({ categories: restoreAdminCategory, books: restoreAdminBook, retailers: restoreAdminRetailer, merchants: restoreAdminMerchant })[kind];
}

function fields(kind: Kind) {
  if (kind === "books") return [{ name: "title", label: "Tên sách" }, { name: "author", label: "Tác giả" }, { name: "publisher", label: "NXB" }, { name: "primary_category_id", label: "ID danh mục" }];
  if (kind === "retailers") return [{ name: "name", label: "Tên" }, { name: "slug", label: "Slug" }, { name: "approved_domains", label: "Tên miền" }];
  if (kind === "merchants") return [{ name: "name", label: "Tên" }, { name: "slug", label: "Slug" }, { name: "retailer_platform_id", label: "ID nền tảng" }];
  if (kind === "offers") return [{ name: "book_id", label: "ID sách" }, { name: "retailer_platform_id", label: "ID nền tảng" }, { name: "merchant_id", label: "ID nhà bán" }, { name: "external_offer_title", label: "Tên ưu đãi" }, { name: "affiliate_destination_url", label: "Link mua" }];
  return [{ name: "name", label: "Tên" }, { name: "slug", label: "Slug" }];
}

function headers(kind: Kind) {
  if (kind === "books") return ["Tên", "Tác giả", "Danh mục", "Nổi bật", "Trạng thái", "Ưu đãi", "Thao tác"];
  if (kind === "retailers") return ["Tên", "Slug", "Tên miền duyệt", "Trạng thái", "Phụ thuộc", "Thao tác"];
  if (kind === "merchants") return ["Tên", "Slug", "Nền tảng", "Trạng thái", "Phụ thuộc", "Thao tác"];
  if (kind === "offers") return ["Tên", "Sách", "Nền tảng / nhà bán", "Trạng thái", "Quan sát mới nhất", "Rà soát", "Thao tác"];
  return ["Tên", "Slug", "Trạng thái", "Sách", "Cập nhật", "Thao tác"];
}

function payload(kind: Kind, form: Record<string, string>) {
  if (kind === "retailers") return { ...form, approved_domains: (form.approved_domains ?? "").split(",").map((value) => value.trim()).filter(Boolean) };
  if (kind === "books") return { ...form, primary_category_id: Number(form.primary_category_id), publisher: form.publisher || "Chưa cập nhật", status: "active" };
  if (kind === "merchants") return { ...form, retailer_platform_id: Number(form.retailer_platform_id), status: "active" };
  if (kind === "offers") return { ...form, book_id: Number(form.book_id), retailer_platform_id: Number(form.retailer_platform_id), merchant_id: Number(form.merchant_id), status: "pending_review" };
  return { ...form, status: "active" };
}

function statusLabel(status: string) {
  return status === "active" ? "Hoạt động" : "Lưu trữ";
}

function offerStatusLabel(status: string) {
  return ({ pending_review: "Chờ duyệt", active: "Có thể mua", unavailable: "Tạm hết hàng", inactive: "Ngưng hiển thị", removed_invalid: "Loại bỏ" } as Record<string, string>)[status] ?? status;
}
