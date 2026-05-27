import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { addAdminOfferObservation, AdminOfferDto, apiErrorMessage, fetchAdminOffer, formatDateTime, formatVnd } from "../api";
import { C, ErrorState, LoadingState, NbButton, border2, shadow4 } from "../shared";
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
      <main className="mx-auto flex min-w-[768px] max-w-[1120px] flex-col gap-5 px-8 py-10">
        <div className="flex items-center justify-between"><h1 className="text-[28px] font-extrabold uppercase">Quan sát ưu đãi</h1><Link className="text-[13px] font-bold underline" to="/admin/offers">Về ưu đãi</Link></div>
        {error && <ErrorState message={error} />}
        {loading ? <LoadingState label="Đang tải ưu đãi..." /> : offer && (
          <>
            <section className="p-4" style={{ background: C.white, border: border2, boxShadow: shadow4 }}>
              <h2 className="text-[18px] font-extrabold uppercase">{offer.external_offer_title}</h2>
              <p className="mt-1 text-[13px]" style={{ color: C.onSurfaceVariant }}>{offer.book_title} - {offer.retailer_name} / {offer.merchant_name}</p>
              <p className="mt-2 text-[13px] font-bold">{offer.eligibility_review.purchasable ? "Ưu đãi đang đủ điều kiện mua." : `Cần rà soát: ${offer.eligibility_review.reasons.join(", ")}`}</p>
            </section>
            <section className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 p-4" style={{ background: C.white, border: border2, boxShadow: shadow4 }}>
              <Field label="Ngày chu kỳ" value={form.cycle_date} onChange={(value) => setForm((current) => ({ ...current, cycle_date: value }))} placeholder="YYYY-MM-DD" />
              <label className="flex flex-col gap-1 text-[12px] font-bold uppercase">Tình trạng<select className="h-10 px-3" style={{ border: border2, background: C.boneWhite }} value={form.availability_status} onChange={(event) => setForm((current) => ({ ...current, availability_status: event.target.value }))}><option value="available">Còn hàng</option><option value="unavailable">Hết hàng</option></select></label>
              <Field label="Giá VND" value={form.listed_item_price} onChange={(value) => setForm((current) => ({ ...current, listed_item_price: value }))} />
              <div className="self-end"><NbButton onClick={submit}>Thêm</NbButton></div>
            </section>
            <table className="w-full border-collapse text-[13px]" style={{ background: C.white, border: border2, boxShadow: shadow4 }}>
              <thead style={{ background: C.boneWhite }}><tr>{["Chu kỳ", "Thời điểm", "Tình trạng", "Giá", "Trạng thái ghi nhận"].map((h) => <th key={h} className="p-3 text-left uppercase" style={{ border: border2 }}>{h}</th>)}</tr></thead>
              <tbody>{(offer.observations ?? []).map((row) => <tr key={row.id}><td className="p-3" style={{ border: border2 }}>{row.cycle_date}</td><td className="p-3" style={{ border: border2 }}>{formatDateTime(row.observed_at)}</td><td className="p-3" style={{ border: border2 }}>{row.availability_status === "available" ? "Còn hàng" : "Hết hàng"}</td><td className="p-3" style={{ border: border2 }}>{row.listed_item_price ? formatVnd(row.listed_item_price) : "-"}</td><td className="p-3" style={{ border: border2 }}>{row.book_status_at_observation} / {row.offer_status_at_observation} / {row.destination_status_at_observation}</td></tr>)}</tbody>
            </table>
          </>
        )}
      </main>
    </AdminGate>
  );
}

function Field({ label, value, onChange, placeholder = "" }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label className="flex flex-col gap-1 text-[12px] font-bold uppercase">{label}<input className="h-10 px-3 text-[13px] normal-case" style={{ border: border2, background: C.boneWhite }} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} /></label>;
}
