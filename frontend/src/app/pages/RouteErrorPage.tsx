import { isRouteErrorResponse, useNavigate, useRouteError } from "react-router";
import { AlertTriangle, ArrowRight, Home } from "lucide-react";
import { C, FONT, NbButton, PageIntro, PageShell, StampHeading, StatusChip, border2, shadow8 } from "../shared";

export default function RouteErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();
  const isNotFound = isRouteErrorResponse(error) && error.status === 404;
  const title = isNotFound ? "Không tìm thấy trang" : "Có lỗi xảy ra";
  const statusLabel = isNotFound ? "404" : "Lỗi hiển thị";
  const description = isNotFound
    ? "Đường dẫn này không tồn tại hoặc đã được thay đổi. Bạn có thể quay lại trang chủ hoặc tìm sách đang quan tâm."
    : "DealSach không thể hiển thị nội dung này. Vui lòng thử lại hoặc quay về trang chủ.";

  return (
    <PageShell className="items-center py-10 sm:py-14">
      <section
        className="flex w-full max-w-[760px] flex-col gap-5 p-5 sm:p-7"
        style={{ background: C.white, border: border2, boxShadow: shadow8, fontFamily: FONT }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StampHeading title={title} icon={<AlertTriangle size={22} style={{ color: isNotFound ? C.primary : C.dealRed }} />} mode={isNotFound ? "primaryFixed" : "white"} />
          <StatusChip label={statusLabel} variant={isNotFound ? "warning" : "danger"} />
        </div>

        <PageIntro>{description}</PageIntro>

        {!isNotFound && (
          <p className="text-[13px] font-bold leading-relaxed" style={{ color: C.onSurfaceVariant }}>
            Nội dung lỗi kỹ thuật đã được ẩn khỏi màn hình để tránh lộ thông tin nội bộ.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <NbButton onClick={() => navigate("/")}>
            <Home size={16} />
            Về trang chủ
          </NbButton>
          <NbButton variant="secondary" onClick={() => navigate("/search")}>
            Tìm sách
            <ArrowRight size={16} />
          </NbButton>
        </div>
      </section>
    </PageShell>
  );
}
