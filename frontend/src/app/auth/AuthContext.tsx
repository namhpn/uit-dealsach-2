import { createContext, FormEvent, useContext, useEffect, useMemo, useState } from "react";
import { BookmarkCheck, BellRing, CircleDollarSign, X } from "lucide-react";
import { apiErrorMessage, AuthStateDto, CurrentUserDto, fetchCurrentUser, logoutCurrentUser, requestEmailCode, verifyEmailCode } from "../api";

interface AuthContextValue {
  authenticated: boolean;
  user: CurrentUserDto | null;
  loading: boolean;
  openAuthDialog: () => void;
  closeAuthDialog: () => void;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const C = {
  primary: "#003527",
  white: "#ffffff",
  black: "#000000",
  surface: "#fcf9f8",
  boneWhite: "#ECE9E2",
  secondary: "#ba1a1a",
  text: "#1b1c1c",
  muted: "#404944",
};

const FONT = "'Be Vietnam Pro', sans-serif";
const border2 = `2px solid ${C.black}`;
const shadow4 = "4px 4px 0 #000000";
const shadow8 = "8px 8px 0 #000000";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthStateDto>({ authenticated: false, user: null });
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  async function refreshUser() {
    const current = await fetchCurrentUser();
    setState(current);
  }

  async function logout() {
    const current = await logoutCurrentUser();
    setState(current);
  }

  useEffect(() => {
    refreshUser()
      .catch(() => setState({ authenticated: false, user: null }))
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    authenticated: state.authenticated,
    user: state.user,
    loading,
    openAuthDialog: () => setDialogOpen(true),
    closeAuthDialog: () => setDialogOpen(false),
    refreshUser,
    logout,
  }), [state.authenticated, state.user, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
      {dialogOpen && <AuthDialog onClose={() => setDialogOpen(false)} onVerified={refreshUser} />}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}

function AuthDialog({ onClose, onVerified }: { onClose: () => void; onVerified: () => Promise<void> }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [message, setMessage] = useState("DealSach gửi mã xác minh qua email. Không cần mật khẩu.");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  async function submitEmail(event: FormEvent) {
    event.preventDefault();
    await sendCode();
  }

  async function resendCode() {
    await sendCode();
  }

  async function sendCode() {
    setSubmitting(true);
    setError(null);
    try {
      const result = await requestEmailCode(email);
      setStep("code");
      setCooldown(result.resent_after_seconds);
      setMessage("Mã xác minh đã được gửi. Mã có hiệu lực trong 10 phút.");
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function submitCode(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await verifyEmailCode(email, code);
      await onVerified();
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-6" style={{ background: "rgba(0,0,0,0.55)", fontFamily: FONT }}>
      <div className="relative w-full max-w-[820px]" style={{ background: C.surface, border: border2, boxShadow: shadow8 }}>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center"
          style={{ background: C.white, color: C.black, border: border2, boxShadow: shadow4 }}
          aria-label="Đóng"
        >
          <X size={16} />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="flex flex-col gap-4 p-6" style={{ borderRight: border2 }}>
            <div>
              <p className="text-[24px] font-black leading-tight" style={{ color: C.primary }}>
                Xin chào,
              </p>
              <h2 className="mt-1 text-[20px] font-black leading-tight" style={{ color: C.text }}>
                Đăng nhập để lưu sách và theo dõi giá
              </h2>
              <p className="mt-2 text-[13px] leading-relaxed" style={{ color: C.muted }}>
                DealSach gửi mã xác minh qua email. Không cần mật khẩu.
              </p>
            </div>

            <form onSubmit={step === "email" ? submitEmail : submitCode} className="flex flex-col gap-3">
              {step === "code" && (
                <p className="text-[12px] font-bold" style={{ color: C.primary }}>
                  Mã đã gửi đến <span style={{ color: C.text }}>{email}</span>
                </p>
              )}

              <label className="flex flex-col gap-1 text-[11px] font-extrabold uppercase" style={{ color: C.muted }}>
                Email nhận mã xác minh
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  required
                  disabled={step === "code"}
                  className="px-3 py-2 text-sm normal-case outline-none disabled:opacity-70"
                  style={{ border: `3px solid ${C.black}`, color: C.text, background: C.white }}
                />
              </label>

              {step === "code" && (
                <label className="flex flex-col gap-1 text-[11px] font-extrabold uppercase" style={{ color: C.muted }}>
                  Nhập mã 6 số
                  <input
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    required
                    className="px-3 py-2 text-sm normal-case outline-none"
                    style={{ border: `3px solid ${C.black}`, color: C.text, background: C.white }}
                  />
                </label>
              )}

              <p className="text-[12px] leading-relaxed" style={{ color: C.muted }}>
                {message}
              </p>
              {error && (
                <p className="text-[12px] font-bold leading-relaxed" style={{ color: C.secondary }}>
                  {error}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <button
                  disabled={submitting || (step === "email" && cooldown > 0)}
                  className="px-4 py-2.5 text-[12px] font-extrabold uppercase disabled:opacity-50"
                  style={{ background: C.primary, color: C.white, border: border2, boxShadow: shadow4 }}
                >
                  {submitting ? "Đang xử lý..." : step === "email" ? "Tiếp tục" : "Xác minh & đăng nhập"}
                </button>

                {step === "code" && (
                  <>
                    <button
                      type="button"
                      disabled={cooldown > 0 || submitting}
                      onClick={resendCode}
                      className="px-4 py-2.5 text-[12px] font-extrabold uppercase disabled:opacity-50"
                      style={{ background: C.boneWhite, color: C.text, border: border2 }}
                    >
                      {cooldown > 0 ? `Gửi lại sau ${cooldown}s` : "Gửi lại mã"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStep("email");
                        setCode("");
                        setError(null);
                      }}
                      className="px-4 py-2.5 text-[12px] font-extrabold uppercase"
                      style={{ background: C.white, color: C.text, border: border2 }}
                    >
                      Đổi email
                    </button>
                  </>
                )}
              </div>
            </form>
          </section>

          <aside className="flex flex-col justify-center gap-4 p-6" style={{ background: C.primary, color: C.white }}>
            <h3 className="text-[19px] font-black uppercase">Theo dõi giá sách thông minh</h3>
            <p className="text-[13px] leading-relaxed" style={{ color: C.boneWhite }}>
              DealSach giúp bạn theo dõi giá tham khảo và chuyển tới nơi bán bên ngoài khi bạn sẵn sàng mua.
            </p>

            <BenefitRow icon={<BookmarkCheck size={16} />} title="Wishlist" description="Lưu sách muốn mua" />
            <BenefitRow icon={<BellRing size={16} />} title="Cảnh báo giá" description="Nhận email khi giá phù hợp" />
            <BenefitRow icon={<CircleDollarSign size={16} />} title="Minh bạch" description="Giá tham khảo, kiểm tra lại tại nơi bán" />
          </aside>
        </div>
      </div>
    </div>
  );
}

function BenefitRow({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3 p-3" style={{ border: border2, background: "rgba(255,255,255,0.08)", boxShadow: shadow4 }}>
      <span className="mt-0.5">{icon}</span>
      <div>
        <p className="text-[12px] font-extrabold uppercase">{title}</p>
        <p className="text-[12px]" style={{ color: C.boneWhite }}>
          {description}
        </p>
      </div>
    </div>
  );
}
