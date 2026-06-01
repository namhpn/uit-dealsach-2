import { Link } from "react-router";
import type { ReactNode } from "react";
import { BarChart3, Bell, BookOpen, Building2, FolderTree, ScrollText, ShieldCheck, Store, Tags, Users } from "lucide-react";
import { useAuth } from "../auth";
import { AdminHeader, C, NbButton, PageShell, PromptCard, border2, shadow4 } from "../shared";

export function AdminGate({ children }: { children: ReactNode }) {
  const auth = useAuth();

  if (auth.loading) {
    return <PageShell variant="admin" className="text-sm font-bold">Đang kiểm tra phiên đăng nhập...</PageShell>;
  }
  if (!auth.authenticated) {
    return (
      <PageShell variant="admin">
        <PromptCard
          icon={<ShieldCheck size={20} style={{ color: C.primary }} />}
          title="Khu vực quản trị"
          description="Vui lòng đăng nhập bằng tài khoản Admin để truy cập khu vực quản trị."
          cta={<NbButton onClick={auth.openAuthDialog}>Đăng nhập Admin</NbButton>}
        />
      </PageShell>
    );
  }
  if (auth.user?.role !== "admin") {
    return (
      <PageShell variant="admin">
        <PromptCard
          icon={<ShieldCheck size={20} style={{ color: C.dealRed }} />}
          title="Không có quyền quản trị"
          description="Tài khoản hiện tại không được phép truy cập trang Admin."
          cta={<Link to="/" className="px-4 py-2.5 text-[12px] font-extrabold uppercase" style={{ border: border2, background: C.boneWhite, color: C.onSurface, boxShadow: shadow4 }}>Về trang chủ</Link>}
        />
      </PageShell>
    );
  }

  return <>{children}</>;
}

export default function AdminPage() {
  return (
    <AdminGate>
      <PageShell variant="admin" className="min-w-[768px] max-w-[1120px]">
        <AdminHeader
          title="Bảng quản trị DealSach"
          icon={<ShieldCheck size={24} />}
          description="Quản lý catalog, người dùng, hoạt động cảnh báo và nhật ký kiểm toán."
        />
        <nav className="grid grid-cols-4 gap-4">
          <AdminLink to="/admin/dashboard" icon={<BarChart3 size={22} />} title="Báo cáo" desc="Tổng quan 7 ngày về redirect, email, cảnh báo và giá." />
          <AdminLink to="/admin/books" icon={<BookOpen size={22} />} title="Sách" desc="Tạo, cập nhật, lưu trữ và đánh dấu nổi bật." />
          <AdminLink to="/admin/categories" icon={<FolderTree size={22} />} title="Danh mục" desc="Quản lý danh mục Active và lưu trữ." />
          <AdminLink to="/admin/retailers" icon={<Building2 size={22} />} title="Nền tảng" desc="Tên miền được duyệt và trạng thái nền tảng." />
          <AdminLink to="/admin/merchants" icon={<Store size={22} />} title="Nhà bán" desc="Liên kết nhà bán với nền tảng bán lẻ." />
          <AdminLink to="/admin/offers" icon={<Tags size={22} />} title="Ưu đãi" desc="Rà soát liên kết mua, trạng thái và quan sát giá." />
          <AdminLink to="/admin/users" icon={<Users size={22} />} title="Người dùng" desc="Trạng thái tài khoản, phiên đăng nhập và cảnh báo." />
          <AdminLink to="/admin/alerts" icon={<Bell size={22} />} title="Cảnh báo" desc="Theo dõi hoạt động và tắt cảnh báo có vấn đề." />
          <AdminLink to="/admin/audit" icon={<ScrollText size={22} />} title="Kiểm toán" desc="Xem lịch sử thao tác Admin đã ghi nhận." />
        </nav>
      </PageShell>
    </AdminGate>
  );
}

function AdminLink({ to, icon, title, desc }: { to: string; icon: ReactNode; title: string; desc: string }) {
  return (
    <Link to={to} className="flex flex-col gap-3 p-5" style={{ background: C.white, border: border2, boxShadow: shadow4 }}>
      <span className="flex h-11 w-11 items-center justify-center" style={{ background: C.primaryFixed, border: border2, color: C.primary }}>{icon}</span>
      <strong className="text-[17px] uppercase">{title}</strong>
      <span className="text-[13px] leading-relaxed" style={{ color: C.onSurfaceVariant }}>{desc}</span>
    </Link>
  );
}
