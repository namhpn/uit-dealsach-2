import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Archive, Plus, RotateCcw, Save } from "lucide-react";
import {
  AdminCategoryDto,
  apiErrorMessage,
  archiveAdminCategory,
  createAdminCategory,
  fetchAdminCategories,
  formatDateTime,
  restoreAdminCategory,
  updateAdminCategory,
} from "../api";
import { C, ErrorState, LoadingState, NbButton, border2, shadow4 } from "../shared";
import { AdminGate } from "./AdminPage";

type CategoryFormState = {
  name: string;
  slug: string;
  display_label: string;
  display_description: string;
  display_order: string;
};

export default function AdminCategoriesPage() {
  const [items, setItems] = useState<AdminCategoryDto[]>([]);
  const [drafts, setDrafts] = useState<Record<number, CategoryFormState>>({});
  const [createForm, setCreateForm] = useState<CategoryFormState>({
    name: "",
    slug: "",
    display_label: "",
    display_description: "",
    display_order: "0",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const payload = await fetchAdminCategories();
      setItems(payload.items);
      setDrafts(
        Object.fromEntries(
          payload.items.map((category) => [
            category.id,
            {
              name: category.name,
              slug: category.slug,
              display_label: category.display_label ?? "",
              display_description: category.display_description ?? "",
              display_order: String(category.display_order ?? 0),
            },
          ]),
        ),
      );
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const categoryCountLabel = useMemo(() => `${items.length.toLocaleString("vi-VN")} danh mục`, [items.length]);

  async function submitCreate(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setMessage(null);
    try {
      await createAdminCategory({
        ...payloadFromForm(createForm),
        status: "active",
      });
      setCreateForm({
        name: "",
        slug: "",
        display_label: "",
        display_description: "",
        display_order: "0",
      });
      setMessage("Đã tạo danh mục.");
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  async function saveCategory(categoryId: number): Promise<void> {
    const draft = drafts[categoryId];
    if (!draft) return;
    setError(null);
    setMessage(null);
    try {
      await updateAdminCategory(categoryId, payloadFromForm(draft));
      setMessage("Đã cập nhật metadata danh mục.");
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  async function toggleLifecycle(category: AdminCategoryDto): Promise<void> {
    setError(null);
    setMessage(null);
    try {
      if (category.status === "active") {
        await archiveAdminCategory(category.id);
        setMessage("Đã lưu trữ danh mục.");
      } else {
        await restoreAdminCategory(category.id);
        setMessage("Đã khôi phục danh mục.");
      }
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  function updateDraft(categoryId: number, key: keyof CategoryFormState, value: string): void {
    setDrafts((current) => ({
      ...current,
      [categoryId]: {
        ...(current[categoryId] ?? {
          name: "",
          slug: "",
          display_label: "",
          display_description: "",
          display_order: "0",
        }),
        [key]: value,
      },
    }));
  }

  return (
    <AdminGate>
      <main className="mx-auto flex min-w-[768px] max-w-[1280px] flex-col gap-5 px-8 py-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-extrabold uppercase">Danh mục</h1>
            <p className="mt-1 text-[12px] font-bold" style={{ color: C.onSurfaceVariant }}>{categoryCountLabel}</p>
          </div>
          <Link className="text-[13px] font-bold underline" to="/admin">Về Admin</Link>
        </div>

        <section className="p-4" style={{ background: C.white, border: border2, boxShadow: shadow4 }}>
          <h2 className="mb-3 text-[14px] font-extrabold uppercase">Tạo danh mục mới</h2>
          <form className="grid grid-cols-3 gap-3" onSubmit={submitCreate}>
            <TextInput label="Tên danh mục" value={createForm.name} onChange={(value) => setCreateForm((current) => ({ ...current, name: value }))} />
            <TextInput label="Slug" value={createForm.slug} onChange={(value) => setCreateForm((current) => ({ ...current, slug: value }))} />
            <TextInput label="Nhãn hiển thị" value={createForm.display_label} onChange={(value) => setCreateForm((current) => ({ ...current, display_label: value }))} />
            <TextAreaInput label="Mô tả hiển thị" value={createForm.display_description} onChange={(value) => setCreateForm((current) => ({ ...current, display_description: value }))} />
            <TextInput label="Thứ tự hiển thị" value={createForm.display_order} inputMode="numeric" onChange={(value) => setCreateForm((current) => ({ ...current, display_order: value }))} />
            <div className="flex items-end justify-end">
              <button type="submit" className="flex h-11 w-11 items-center justify-center" style={{ background: C.primary, color: C.white, border: border2 }} title="Tạo danh mục" aria-label="Tạo danh mục">
                <Plus size={18} />
              </button>
            </div>
          </form>
        </section>

        {message && <p className="p-3 text-[13px] font-bold" style={{ background: C.primaryFixed, border: border2, color: C.primary }}>{message}</p>}
        {error && <ErrorState message={error} />}
        {loading ? (
          <LoadingState label="Đang tải danh mục..." />
        ) : (
          <div className="overflow-x-auto" style={{ background: C.white, border: border2, boxShadow: shadow4 }}>
            <table className="w-full min-w-[1120px] border-collapse text-[13px]">
              <thead style={{ background: C.boneWhite }}>
                <tr>
                  <th className="p-3 text-left uppercase" style={{ border: border2 }}>Tên</th>
                  <th className="p-3 text-left uppercase" style={{ border: border2 }}>Slug</th>
                  <th className="p-3 text-left uppercase" style={{ border: border2 }}>Nhãn hiển thị</th>
                  <th className="p-3 text-left uppercase" style={{ border: border2 }}>Mô tả hiển thị</th>
                  <th className="p-3 text-left uppercase" style={{ border: border2 }}>Thứ tự</th>
                  <th className="p-3 text-left uppercase" style={{ border: border2 }}>Trạng thái</th>
                  <th className="p-3 text-left uppercase" style={{ border: border2 }}>Sách</th>
                  <th className="p-3 text-left uppercase" style={{ border: border2 }}>Cập nhật</th>
                  <th className="p-3 text-left uppercase" style={{ border: border2 }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items.map((category) => {
                  const draft = drafts[category.id];
                  return (
                    <tr key={category.id}>
                      <td className="p-3 align-top" style={{ border: border2 }}>
                        <input
                          value={draft?.name ?? category.name}
                          onChange={(event) => updateDraft(category.id, "name", event.target.value)}
                          className="h-9 w-full px-2"
                          style={{ border: border2, background: C.boneWhite }}
                        />
                      </td>
                      <td className="p-3 align-top" style={{ border: border2 }}>
                        <input
                          value={draft?.slug ?? category.slug}
                          onChange={(event) => updateDraft(category.id, "slug", event.target.value)}
                          className="h-9 w-full px-2"
                          style={{ border: border2, background: C.boneWhite }}
                        />
                      </td>
                      <td className="p-3 align-top" style={{ border: border2 }}>
                        <input
                          value={draft?.display_label ?? category.display_label ?? ""}
                          onChange={(event) => updateDraft(category.id, "display_label", event.target.value)}
                          className="h-9 w-full px-2"
                          style={{ border: border2, background: C.boneWhite }}
                        />
                      </td>
                      <td className="p-3 align-top" style={{ border: border2 }}>
                        <textarea
                          value={draft?.display_description ?? category.display_description ?? ""}
                          onChange={(event) => updateDraft(category.id, "display_description", event.target.value)}
                          className="min-h-[72px] w-full resize-y px-2 py-1"
                          style={{ border: border2, background: C.boneWhite }}
                        />
                      </td>
                      <td className="p-3 align-top" style={{ border: border2 }}>
                        <input
                          value={draft?.display_order ?? String(category.display_order)}
                          onChange={(event) => updateDraft(category.id, "display_order", event.target.value)}
                          inputMode="numeric"
                          className="h-9 w-full px-2"
                          style={{ border: border2, background: C.boneWhite }}
                        />
                      </td>
                      <td className="p-3 align-top font-bold" style={{ border: border2 }}>
                        {category.status === "active" ? "Hoạt động" : "Lưu trữ"}
                      </td>
                      <td className="p-3 align-top font-bold" style={{ border: border2 }}>{category.book_count ?? 0}</td>
                      <td className="p-3 align-top font-bold" style={{ border: border2 }}>{formatDateTime(category.updated_at)}</td>
                      <td className="p-3 align-top" style={{ border: border2 }}>
                        <div className="flex flex-wrap items-center gap-2">
                          <NbButton small onClick={() => saveCategory(category.id)}>
                            <Save size={13} /> Lưu
                          </NbButton>
                          {category.status === "active" ? (
                            <NbButton small variant="secondary" onClick={() => toggleLifecycle(category)}>
                              <Archive size={13} /> Lưu trữ
                            </NbButton>
                          ) : (
                            <NbButton small onClick={() => toggleLifecycle(category)}>
                              <RotateCcw size={13} /> Khôi phục
                            </NbButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </AdminGate>
  );
}

function payloadFromForm(form: CategoryFormState): Partial<AdminCategoryDto> {
  const parsedOrder = Number.parseInt(form.display_order.trim() || "0", 10);

  return {
    name: form.name.trim(),
    slug: form.slug.trim(),
    display_label: trimToNullable(form.display_label),
    display_description: trimToNullable(form.display_description),
    display_order: Number.isNaN(parsedOrder) ? -1 : parsedOrder,
  };
}

function trimToNullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function TextInput({ label, value, onChange, inputMode }: { label: string; value: string; onChange: (value: string) => void; inputMode?: "numeric" }) {
  return (
    <label className="flex flex-col gap-1 text-[12px] font-bold uppercase">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        inputMode={inputMode}
        className="h-10 px-3 text-[13px] normal-case"
        style={{ border: border2, background: C.boneWhite }}
      />
    </label>
  );
}

function TextAreaInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="col-span-2 flex flex-col gap-1 text-[12px] font-bold uppercase">
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-[88px] px-3 py-2 text-[13px] normal-case"
        style={{ border: border2, background: C.boneWhite }}
      />
    </label>
  );
}
