import { useNavigate } from "react-router";
import { ArrowRight, Home, SearchX } from "lucide-react";
import { C, FONT, NbButton, PageIntro, PageShell, StampHeading, StatusChip, border2, shadow8 } from "../shared";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <PageShell className="items-center py-10 sm:py-14">
      <section
        className="flex w-full max-w-[760px] flex-col gap-5 p-5 sm:p-7"
        style={{ background: C.white, border: border2, boxShadow: shadow8, fontFamily: FONT }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StampHeading title="Không tìm thấy trang" icon={<SearchX size={22} style={{ color: C.primary }} />} />
          <StatusChip label="404" variant="warning" />
        </div>

        <PageIntro>
          Đường dẫn này không tồn tại hoặc đã được thay đổi. Bạn có thể quay lại trang chủ hoặc tìm sách đang quan tâm.
        </PageIntro>

        <p className="text-[13px] font-bold leading-relaxed" style={{ color: C.onSurfaceVariant }}>
          Bạn cũng có thể dùng ô tìm kiếm phía trên để tra cứu theo tên sách, tác giả hoặc ISBN.
        </p>

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
