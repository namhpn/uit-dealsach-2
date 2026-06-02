import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { addAdminOfferObservation, AdminOfferDto, apiErrorMessage, fetchAdminOffer, formatDateTime, formatVnd } from "../api";
import { AdminBackLink, AdminHeader, AdminTableShell, C, ErrorState, LoadingState, NbButton, NbDenseInput, NbSelect, PageShell, StatusChip, border2, shadow4 } from "../shared";
import { AdminGate } from "./AdminPage";

export default function AdminBookDetailPage() {
  const params = useParams();
  const offerId = Number(params.id);
  const [offer, setOffer] = useState<AdminOfferDto | null>(null);
  const [form, setForm] = useState({ cycle_date: "", availability_status: "available", listed_item_price: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setOffer(await fetchAdminOffer(offerId));
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [offerId]);

  async function submit() {
    setError(null);
    try {
      setOffer(await addAdminOfferObservation(offerId, {
        cycle_date: form.cycle_date || undefined,
        availability_status: form.availability_status,
        listed_item_price: form.availability_status === "available" ? Number(form.listed_item_price) : null,
      }));
      setForm({ cycle_date: "", availability_status: "available", listed_item_price: "" });
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  return (
    <AdminGate>
      <PageShell variant="admin" className="min-w-[768px] max-w-[1120px] gap-5">
        <AdminHeader title="Quan sát ưu đãi" description="Thêm vòng quan sát giá cho ưu đãi và xem lịch sử trạng thái tại thời điểm ghi nhận." backLink={<AdminBackLink to="/admin/offers" label="Về Ưu đãi" />} />
        {error && <ErrorState message={error} />}
        {loading ? <LoadingState label="Đang tải ưu đãi..." /> : offer && (
          <>
            <section className="p-4" style={{ background: C.white, border: border2, boxShadow: shadow4 }}>
              <h2 className="text-[18px] font-extrabold uppercase">{offer.external_offer_title}</h2>
              <p className="mt-1 text-[13px]" style={{ color: C.onSurfaceVariant }}>{offer.book_title} - {offer.retailer_name} / {offer.merchant_name}</p>
              <p className="mt-2 text-[13px] font-bold">{offer.eligibility_review.purchasable ? "Ưu đãi đang đủ điều kiện mua." : `Cần rà soát: ${offer.eligibility_review.reasons.map(eligibilityReasonLabel).join(", ")}`}</p>
            </section>
            <section className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 p-4" style={{ background: C.white, border: border2, boxShadow: shadow4 }}>
              <Field label="Ngày chu kỳ" value={form.cycle_date} onChange={(value) => setForm((current) => ({ ...current, cycle_date: value }))} placeholder="YYYY-MM-DD" />
              <label className="flex flex-col gap-1 text-[12px] font-bold uppercase">Tình trạng<NbSelect className="h-10 px-3 text-[13px]" value={form.availability_status} onChange={(event) => setForm((current) => ({ ...current, availability_status: event.target.value }))}><option value="available">Còn hàng</option><option value="unavailable">Hết hàng</option></NbSelect></label>
              <Field label="Giá VND" value={form.listed_item_price} onChange={(value) => setForm((current) => ({ ...current, listed_item_price: value }))} />
              <div className="self-end"><NbButton onClick={submit}>Thêm</NbButton></div>
            </section>
            <AdminTableShell>
            <table className="w-full border-collapse text-[13px]">
              <thead style={{ background: C.boneWhite }}><tr>{["Chu kỳ", "Thời điểm", "Tình trạng", "Giá", "Trạng thái ghi nhận"].map((h) => <th key={h} className="p-3 text-left uppercase" style={{ borderBottom: border2 }}>{h}</th>)}</tr></thead>
              <tbody>{(offer.observations ?? []).map((row) => <tr key={row.id}><td className="p-3" style={{ borderTop: `1px solid ${C.outlineVariant}` }}>{row.cycle_date}</td><td className="p-3" style={{ borderTop: `1px solid ${C.outlineVariant}` }}>{formatDateTime(row.observed_at)}</td><td className="p-3" style={{ borderTop: `1px solid ${C.outlineVariant}` }}>{row.availability_status === "available" ? "Còn hàng" : "Hết hàng"}</td><td className="p-3" style={{ borderTop: `1px solid ${C.outlineVariant}` }}>{row.listed_item_price ? formatVnd(row.listed_item_price) : "-"}</td><td className="p-3" style={{ borderTop: `1px solid ${C.outlineVariant}` }}><ObservationStatusChips book={row.book_status_at_observation} offer={row.offer_status_at_observation} destination={row.destination_status_at_observation} /></td></tr>)}</tbody>
            </table>
            </AdminTableShell>
          </>
        )}
      </PageShell>
    </AdminGate>
  );
}

function Field({ label, value, onChange, placeholder = "" }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label className="flex flex-col gap-1 text-[12px] font-bold uppercase">{label}<NbDenseInput className="h-10 px-3 text-[13px]" value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} /></label>;
}

function ObservationStatusChips({ book, offer, destination }: { book: string; offer: string; destination: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      <StatusChip label={`Sách: ${statusLabel(book)}`} variant={book === "active" ? "success" : "muted"} />
      <StatusChip label={`Ưu đãi: ${offerStatusLabel(offer)}`} variant={offer === "active" ? "success" : "warning"} />
      <StatusChip label={`Liên kết: ${destinationStatusLabel(destination)}`} variant={destination === "valid" ? "success" : "danger"} />
    </div>
  );
}

function statusLabel(status: string) {
  return ({ active: "Hoạt động", archived: "Lưu trữ", inactive: "Không hoạt động" } as Record<string, string>)[status] ?? status;
}

function offerStatusLabel(status: string) {
  return ({ pending_review: "Chờ duyệt", active: "Có thể mua", unavailable: "Tạm hết hàng", inactive: "Ngưng hiển thị", removed_invalid: "Loại bỏ" } as Record<string, string>)[status] ?? status;
}

function destinationStatusLabel(status: string) {
  return ({ valid: "Hợp lệ", missing: "Thiếu", invalid: "Không hợp lệ" } as Record<string, string>)[status] ?? status;
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
