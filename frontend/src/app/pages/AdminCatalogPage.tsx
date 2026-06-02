import { ReactNode, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { RotateCcw, Archive, Save } from "lucide-react";
import {
  AdminBookDto,
  AdminMerchantDto,
  AdminOfferDto,
  AdminRetailerDto,
  apiErrorMessage,
  archiveAdminBook,
  archiveAdminMerchant,
  archiveAdminRetailer,
  createAdminBook,
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
  restoreAdminMerchant,
  restoreAdminRetailer,
  updateAdminBook,
  updateAdminMerchant,
  updateAdminOffer,
  updateAdminRetailer,
} from "../api";
import { AdminBackLink, AdminHeader, AdminTableShell, C, ErrorState, LoadingState, NbButton, NbDenseInput, NbSelect, PageShell, border2, shadow4 } from "../shared";
import { AdminGate } from "./AdminPage";

type Kind = "books" | "retailers" | "merchants" | "offers";
type AnyItem = AdminBookDto | AdminRetailerDto | AdminMerchantDto | AdminOfferDto;
type Option = { value: string; label: string; meta?: string };
type FieldConfig = { name: string; label: string; type?: "text" | "select"; options?: Option[] };

const TITLES: Record<Kind, string> = {
  books: "Sách",
  retailers: "Nền tảng bán lẻ",
  merchants: "Nhà bán",
  offers: "Ưu đãi",
};

const CREATE_LABELS: Record<Kind, string> = {
  books: "Tạo sách",
  retailers: "Tạo nền tảng bán lẻ",
  merchants: "Tạo nhà bán",
  offers: "Tạo ưu đãi",
};

export default function AdminCatalogPage({ kind }: { kind: Kind }) {
  const [items, setItems] = useState<AnyItem[]>([]);
  const [bookOptions, setBookOptions] = useState<Option[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<Option[]>([]);
  const [retailerOptions, setRetailerOptions] = useState<Option[]>([]);
  const [merchantOptions, setMerchantOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [createOpen, setCreateOpen] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [data, categories, books, retailers, merchants] = await Promise.all([
        listApi(kind)(),
        kind === "books" ? fetchAdminCategories() : Promise.resolve({ items: [] }),
        kind === "offers" ? fetchAdminBooks() : Promise.resolve({ items: [] }),
        kind === "merchants" || kind === "offers" ? fetchAdminRetailers() : Promise.resolve({ items: [] }),
        kind === "offers" ? fetchAdminMerchants() : Promise.resolve({ items: [] }),
      ]);
      setItems(data.items as AnyItem[]);
      setCategoryOptions(categories.items.map((category) => ({ value: String(category.id), label: category.display_label || category.name, meta: category.status === "active" ? undefined : "Lưu trữ" })));
      setBookOptions(books.items.map((book) => ({ value: String(book.id), label: book.title, meta: book.status === "active" ? book.author : "Lưu trữ" })));
      setRetailerOptions(retailers.items.map((retailer) => ({ value: String(retailer.id), label: retailer.name, meta: retailer.status === "active" ? retailer.slug : "Lưu trữ" })));
      setMerchantOptions(merchants.items.map((merchant) => ({ value: String(merchant.id), label: merchant.name, meta: `${merchant.retailer.name}${merchant.status === "active" ? "" : " / Lưu trữ"}` })));
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [kind]);

  const fieldConfigs = useMemo(() => fields(kind, { categories: categoryOptions, books: bookOptions, retailers: retailerOptions, merchants: merchantOptions }), [bookOptions, categoryOptions, kind, merchantOptions, retailerOptions]);

  async function submit() {
    setError(null);
    setMessage(null);
    try {
      await createApi(kind)(payload(kind, form));
      setForm({});
      setCreateOpen(false);
      setMessage(`Đã ${CREATE_LABELS[kind].toLowerCase()}.`);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  async function quickSave(item: AnyItem, patch: Record<string, unknown>) {
    setError(null);
    setMessage(null);
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
    setMessage(null);
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
      <PageShell variant="admin" className="min-w-[768px] max-w-[1240px] gap-5">
        <AdminHeader title={TITLES[kind]} description="Quản trị dữ liệu catalog, trạng thái vòng đời và cập nhật nhanh tại chỗ." backLink={<AdminBackLink />} actions={<NbButton small onClick={() => setCreateOpen((current) => !current)}>{createOpen ? "Đóng" : CREATE_LABELS[kind]}</NbButton>} />
        {createOpen && (
          <section className="p-4" style={{ background: C.white, border: border2, boxShadow: shadow4 }}>
            <h2 className="mb-3 text-[14px] font-extrabold uppercase">{CREATE_LABELS[kind]}</h2>
            <div className="grid grid-cols-4 gap-3">
              {fieldConfigs.map((field) => <Input key={field.name} field={field} value={form[field.name] ?? ""} onChange={(value) => setForm((current) => ({ ...current, [field.name]: value }))} />)}
              <div className="flex items-end justify-end"><NbButton onClick={submit}>{CREATE_LABELS[kind]}</NbButton></div>
            </div>
          </section>
        )}
        {message && <AdminNotice>{message}</AdminNotice>}
        {error && <ErrorState message={error} />}
        {loading ? <LoadingState label={`Đang tải ${TITLES[kind].toLowerCase()}...`} /> : (
          <AdminTableShell>
            <table className="w-full border-collapse text-[13px]">
              <thead style={{ background: C.boneWhite }}><tr>{headers(kind).map((h) => <th key={h} className="p-3 text-left uppercase" style={{ borderBottom: border2 }}>{h}</th>)}</tr></thead>
              <tbody>
                {items.map((item) => <Row key={item.id} kind={kind} item={item} onLifecycle={() => lifecycle(item)} onSave={(patch) => quickSave(item, patch)} />)}
              </tbody>
            </table>
          </AdminTableShell>
        )}
      </PageShell>
    </AdminGate>
  );
}

function Row({ kind, item, onLifecycle, onSave }: { kind: Kind; item: AnyItem; onLifecycle: () => void; onSave: (patch: Record<string, unknown>) => void }) {
  if (kind === "books") {
    const book = item as AdminBookDto;
    return <BookRow book={book} onLifecycle={onLifecycle} onSave={onSave} />;
  }
  if (kind === "retailers") {
    const retailer = item as AdminRetailerDto;
    return <TableRow cells={[retailer.name, <SecondaryText>{retailer.slug}</SecondaryText>, <DomainChips domains={retailer.approved_domains} />, statusLabel(retailer.status), `${retailer.merchant_count ?? 0} nhà bán`]} action={<LifeButton status={retailer.status} onClick={onLifecycle} />} />;
  }
  if (kind === "merchants") {
    const merchant = item as AdminMerchantDto;
    return <TableRow cells={[merchant.name, <SecondaryText>{merchant.slug}</SecondaryText>, merchant.retailer.name, statusLabel(merchant.status), `${merchant.offer_count ?? 0} ưu đãi`]} action={<LifeButton status={merchant.status} onClick={onLifecycle} />} />;
  }
  const offer = item as AdminOfferDto;
  return <TableRow cells={[offer.external_offer_title, offer.book_title, `${offer.retailer_name} / ${offer.merchant_name}`, offerStatusLabel(offer.status), offer.latest_observation ? `${offer.latest_observation.listed_item_price ? formatVnd(offer.latest_observation.listed_item_price) : "Hết hàng"} - ${formatDateTime(offer.latest_observation.observed_at)}` : "Chưa có", offer.eligibility_review.purchasable ? "Đủ điều kiện" : offer.eligibility_review.reasons.map(eligibilityReasonLabel).join(", ")]} action={<><Link className="text-[12px] font-bold underline" to={`/admin/offers/${offer.id}`}>Quan sát</Link><NbButton small onClick={() => onSave({ status: offer.status === "active" ? "inactive" : "active" })}><Save size={13} /> Trạng thái</NbButton></>} />;
}

function TableRow({ cells, action }: { cells: ReactNode[]; action: ReactNode }) {
  return <tr>{cells.map((cell, index) => <td key={index} className="p-3 align-top" style={{ borderTop: `1px solid ${C.outlineVariant}` }}>{cell}</td>)}<td className="p-3 align-top" style={{ borderTop: `1px solid ${C.outlineVariant}` }}><div className="flex flex-wrap items-center gap-2">{action}</div></td></tr>;
}

function BookRow({ book, onLifecycle, onSave }: { book: AdminBookDto; onLifecycle: () => void; onSave: (patch: Record<string, unknown>) => void }) {
  const [releaseDate, setReleaseDate] = useState(book.release_date ?? "");
  const [pageCount, setPageCount] = useState(book.page_count === null ? "" : String(book.page_count));
  const [dimensions, setDimensions] = useState(book.dimensions ?? "");
  const [format, setFormat] = useState(book.format ?? "");

  useEffect(() => {
    setReleaseDate(book.release_date ?? "");
    setPageCount(book.page_count === null ? "" : String(book.page_count));
    setDimensions(book.dimensions ?? "");
    setFormat(book.format ?? "");
  }, [book.dimensions, book.format, book.page_count, book.release_date]);

  function saveMetadata() {
    onSave({
      release_date: releaseDate.trim() === "" ? null : releaseDate.trim(),
      page_count: pageCount.trim() === "" ? null : Number(pageCount),
      dimensions: dimensions.trim() === "" ? null : dimensions.trim(),
      format: format.trim() === "" ? null : format.trim(),
    });
  }

  const metadataEditor = (
    <div className="grid grid-cols-2 gap-2">
      <CompactMetaInput label="Ngày" type="date" value={releaseDate} onChange={setReleaseDate} />
      <CompactMetaInput label="Trang" value={pageCount} onChange={(value) => setPageCount(value.replace(/\D/g, ""))} />
      <CompactMetaInput label="Kích thước" value={dimensions} onChange={setDimensions} />
      <CompactMetaInput label="Định dạng" value={format} onChange={setFormat} />
    </div>
  );

  return (
    <TableRow
      cells={[book.title, book.author, book.category.name, book.is_featured ? "Nổi bật" : "Thường", statusLabel(book.status), metadataEditor]}
      action={(
        <>
          <NbButton small onClick={() => onSave({ is_featured: !book.is_featured })}>{book.is_featured ? "Bỏ nổi bật" : "Đánh dấu nổi bật"}</NbButton>
          <NbButton small onClick={saveMetadata}><Save size={13} /> Lưu chi tiết</NbButton>
          <LifeButton status={book.status} onClick={onLifecycle} />
        </>
      )}
    />
  );
}

function CompactMetaInput({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <label className="text-[10px] font-bold uppercase">{label}<NbDenseInput type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1" /></label>;
}

function LifeButton({ status, onClick }: { status: string; onClick: () => void }) {
  const active = status === "active";
  return <NbButton small variant={active ? "secondary" : "primary"} onClick={onClick}>{active ? <Archive size={13} /> : <RotateCcw size={13} />} {active ? "Lưu trữ" : "Khôi phục"}</NbButton>;
}

function Input({ field, value, onChange }: { field: FieldConfig; value: string; onChange: (value: string) => void }) {
  return (
    <label className="flex flex-col gap-1 text-[12px] font-bold uppercase">
      {field.label}
      {field.type === "select" ? (
        <NbSelect className="h-10 px-3 text-[13px]" value={value} onChange={(event) => onChange(event.target.value)}>
          <option value="">Chọn...</option>
          {(field.options ?? []).map((option) => <option key={option.value} value={option.value}>{option.label}{option.meta ? ` — ${option.meta}` : ""}</option>)}
        </NbSelect>
      ) : (
        <NbDenseInput className="h-10 px-3 text-[13px]" value={value} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  );
}

function AdminNotice({ children }: { children: ReactNode }) {
  return <p className="p-3 text-[13px] font-bold" style={{ background: C.primaryFixed, border: border2, color: C.primary }}>{children}</p>;
}

function SecondaryText({ children }: { children: ReactNode }) {
  return <span className="text-[12px] font-bold" style={{ color: C.onSurfaceVariant }}>{children}</span>;
}

function DomainChips({ domains }: { domains: string[] }) {
  if (domains.length === 0) return <SecondaryText>Chưa có</SecondaryText>;
  return <div className="flex flex-wrap gap-1">{domains.map((domain) => <span key={domain} className="px-2 py-1 text-[11px] font-bold" style={{ background: C.surfaceLow, border: `1px solid ${C.black}` }}>{domain}</span>)}</div>;
}

function listApi(kind: Kind) {
  return ({ books: fetchAdminBooks, retailers: fetchAdminRetailers, merchants: fetchAdminMerchants, offers: fetchAdminOffers })[kind];
}

function createApi(kind: Kind) {
  return ({ books: createAdminBook, retailers: createAdminRetailer, merchants: createAdminMerchant, offers: createAdminOffer })[kind] as (payload: Record<string, unknown>) => Promise<unknown>;
}

function updateApi(kind: Kind) {
  return ({ books: updateAdminBook, retailers: updateAdminRetailer, merchants: updateAdminMerchant, offers: updateAdminOffer })[kind] as (id: number, payload: Record<string, unknown>) => Promise<unknown>;
}

function archiveApi(kind: Exclude<Kind, "offers">) {
  return ({ books: archiveAdminBook, retailers: archiveAdminRetailer, merchants: archiveAdminMerchant })[kind];
}

function restoreApi(kind: Exclude<Kind, "offers">) {
  return ({ books: restoreAdminBook, retailers: restoreAdminRetailer, merchants: restoreAdminMerchant })[kind];
}

function fields(kind: Kind, options: { categories: Option[]; books: Option[]; retailers: Option[]; merchants: Option[] }): FieldConfig[] {
  if (kind === "books") return [{ name: "title", label: "Tên sách" }, { name: "author", label: "Tác giả" }, { name: "publisher", label: "NXB" }, { name: "primary_category_id", label: "Danh mục", type: "select", options: options.categories }];
  if (kind === "retailers") return [{ name: "name", label: "Tên" }, { name: "slug", label: "Slug" }, { name: "approved_domains", label: "Tên miền" }];
  if (kind === "merchants") return [{ name: "name", label: "Tên" }, { name: "slug", label: "Slug" }, { name: "retailer_platform_id", label: "Nền tảng", type: "select", options: options.retailers }];
  return [{ name: "book_id", label: "Sách", type: "select", options: options.books }, { name: "retailer_platform_id", label: "Nền tảng", type: "select", options: options.retailers }, { name: "merchant_id", label: "Nhà bán", type: "select", options: options.merchants }, { name: "external_offer_title", label: "Tên ưu đãi" }, { name: "affiliate_destination_url", label: "Link mua" }];
}

function headers(kind: Kind) {
  if (kind === "books") return ["Tên", "Tác giả", "Danh mục", "Nổi bật", "Trạng thái", "Thông số", "Thao tác"];
  if (kind === "retailers") return ["Tên", "Slug", "Tên miền duyệt", "Trạng thái", "Phụ thuộc", "Thao tác"];
  if (kind === "merchants") return ["Tên", "Slug", "Nền tảng", "Trạng thái", "Phụ thuộc", "Thao tác"];
  return ["Tên", "Sách", "Nền tảng / nhà bán", "Trạng thái", "Quan sát mới nhất", "Rà soát", "Thao tác"];
}

function payload(kind: Kind, form: Record<string, string>) {
  if (kind === "retailers") return { ...form, approved_domains: (form.approved_domains ?? "").split(",").map((value) => value.trim()).filter(Boolean), status: "active" };
  if (kind === "books") return { ...form, primary_category_id: Number(form.primary_category_id), publisher: form.publisher || "Chưa cập nhật", status: "active" };
  if (kind === "merchants") return { ...form, retailer_platform_id: Number(form.retailer_platform_id), status: "active" };
  return { ...form, book_id: Number(form.book_id), retailer_platform_id: Number(form.retailer_platform_id), merchant_id: Number(form.merchant_id), status: "pending_review" };
}

function statusLabel(status: string) {
  return status === "active" ? "Hoạt động" : "Lưu trữ";
}

function offerStatusLabel(status: string) {
  return ({ pending_review: "Chờ duyệt", active: "Có thể mua", unavailable: "Tạm hết hàng", inactive: "Ngưng hiển thị", removed_invalid: "Loại bỏ" } as Record<string, string>)[status] ?? status;
}

function eligibilityReasonLabel(reason: string) {
  return ({
    book_archived: "Sách đã lưu trữ",
    book_inactive: "Sách không hoạt động",
    offer_inactive: "Ưu đãi ngưng hiển thị",
    offer_unavailable: "Ưu đãi tạm hết hàng",
    offer_pending_review: "Ưu đãi chờ duyệt",
    retailer_archived: "Nền tảng đã lưu trữ",
    retailer_inactive: "Nền tảng không hoạt động",
    merchant_archived: "Nhà bán đã lưu trữ",
    merchant_inactive: "Nhà bán không hoạt động",
    merchant_retailer_mismatch: "Nhà bán không khớp nền tảng",
    missing_destination: "Thiếu liên kết mua",
    invalid_destination: "Liên kết mua không hợp lệ",
    unsafe_destination: "Liên kết mua không an toàn",
    stale_observation: "Giá tham khảo đã cũ",
    unavailable_observation: "Quan sát gần nhất hết hàng",
    no_observation: "Chưa có quan sát giá",
  } as Record<string, string>)[reason] ?? reason;
}
