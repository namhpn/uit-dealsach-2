import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "../auth";
import { C, NbButton, PageShell, PromptCard, border2, shadow4 } from "../shared";

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
          description="Vui lòng đăng nhập bằng tài khoản Quản trị viên để truy cập khu vực quản trị."
          cta={<NbButton onClick={auth.openAuthDialog}>Đăng nhập Quản trị viên</NbButton>}
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
          description="Tài khoản hiện tại không được phép truy cập khu vực quản trị."
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
        <PromptCard
          icon={<ShieldCheck size={20} style={{ color: C.primary }} />}
          title="Dashboard quản trị"
          description="Trang menu quản trị cũ đã được thay bằng dashboard tại /admin."
          cta={<a href="/admin" className="px-4 py-2.5 text-[12px] font-extrabold uppercase" style={{ border: border2, background: C.primary, color: C.white, boxShadow: shadow4 }}>Mở Dashboard quản trị</a>}
        />
      </PageShell>
    </AdminGate>
  );
}
