import { Link } from "react-router";
import type { ReactNode } from "react";
import { Bell, BookOpen, Building2, FolderTree, ScrollText, ShieldCheck, Store, Tags, Users } from "lucide-react";
import { useAuth } from "../auth";
import { C, EmptyState, FONT, NbButton, border2, shadow4, shadow8 } from "../shared";

export function AdminGate({ children }: { children: ReactNode }) {
  const auth = useAuth();

  if (auth.loading) {
    return <main className="mx-auto max-w-[1000px] px-4 py-10 text-sm font-bold">Đang kiểm tra phiên đăng nhập...</main>;
  }
  if (!auth.authenticated) {
    return (
      <main className="mx-auto max-w-[900px] px-4 py-10">
        <EmptyState message="Vui lòng đăng nhập bằng tài khoản Admin để truy cập khu vực quản trị." />
        <div className="mt-4"><NbButton onClick={auth.openAuthDialog}>Đăng nhập Admin</NbButton></div>
      </main>
    );
  }
  if (auth.user?.role !== "admin") {
    return (
      <main className="mx-auto max-w-[900px] px-4 py-10">
        <section className="p-6" style={{ background: "#fff1f1", border: border2, boxShadow: shadow8, fontFamily: FONT }}>
          <h1 className="text-[22px] font-extrabold uppercase" style={{ color: C.secondary }}>Không có quyền quản trị</h1>
          <p className="mt-2 text-[13px]" style={{ color: C.onSurfaceVariant }}>Tài khoản hiện tại không được phép truy cập trang Admin.</p>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}

export default function AdminPage() {
  return (
    <AdminGate>
      <main className="mx-auto flex min-w-[768px] max-w-[1120px] flex-col gap-6 px-8 py-10">
        <section className="p-6" style={{ background: C.primary, color: C.white, border: border2, boxShadow: shadow8, fontFamily: FONT }}>
          <div className="flex items-center gap-3">
            <ShieldCheck size={28} />
            <h1 className="text-[30px] font-extrabold uppercase">Bảng quản trị DealSach</h1>
          </div>
          <p className="mt-2 text-[13px]" style={{ color: C.primaryFixed }}>Quản lý catalog, người dùng, hoạt động cảnh báo và nhật ký kiểm toán.</p>
        </section>
        <nav className="grid grid-cols-4 gap-4">
          <AdminLink to="/admin/books" icon={<BookOpen size={22} />} title="Sách" desc="Tạo, cập nhật, lưu trữ và đánh dấu nổi bật." />
          <AdminLink to="/admin/categories" icon={<FolderTree size={22} />} title="Danh mục" desc="Quản lý danh mục Active và lưu trữ." />
          <AdminLink to="/admin/retailers" icon={<Building2 size={22} />} title="Nền tảng" desc="Tên miền được duyệt và trạng thái nền tảng." />
          <AdminLink to="/admin/merchants" icon={<Store size={22} />} title="Nhà bán" desc="Liên kết nhà bán với nền tảng bán lẻ." />
          <AdminLink to="/admin/offers" icon={<Tags size={22} />} title="Ưu đãi" desc="Rà soát liên kết mua, trạng thái và quan sát giá." />
          <AdminLink to="/admin/users" icon={<Users size={22} />} title="Người dùng" desc="Trạng thái tài khoản, phiên đăng nhập và cảnh báo." />
          <AdminLink to="/admin/alerts" icon={<Bell size={22} />} title="Cảnh báo" desc="Theo dõi hoạt động và tắt cảnh báo có vấn đề." />
          <AdminLink to="/admin/audit" icon={<ScrollText size={22} />} title="Kiểm toán" desc="Xem lịch sử thao tác Admin đã ghi nhận." />
        </nav>
      </main>
    </AdminGate>
  );
}

function AdminLink({ to, icon, title, desc }: { to: string; icon: ReactNode; title: string; desc: string }) {
  return (
    <Link to={to} className="flex flex-col gap-3 p-5" style={{ background: C.white, border: border2, boxShadow: shadow4, fontFamily: FONT }}>
      <span className="flex h-11 w-11 items-center justify-center" style={{ background: C.primaryFixed, border: border2, color: C.primary }}>{icon}</span>
      <strong className="text-[17px] uppercase">{title}</strong>
      <span className="text-[13px] leading-relaxed" style={{ color: C.onSurfaceVariant }}>{desc}</span>
    </Link>
  );
}
