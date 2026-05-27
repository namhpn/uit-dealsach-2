import { createContext, FormEvent, useContext, useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
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
  const [message, setMessage] = useState("Nhập email để nhận mã xác minh đăng nhập hoặc đăng ký.");
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
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.45)" }}>
      <div className="w-full max-w-[420px]" style={{ background: C.surface, border: border2, boxShadow: "8px 8px 0 #000", fontFamily: FONT }}>
        <div className="flex items-center justify-between px-5 py-3" style={{ background: C.primary, color: C.white, borderBottom: border2 }}>
          <h2 className="text-[15px] font-extrabold uppercase">Tài khoản DealSach</h2>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center" style={{ background: C.white, color: C.black, border: border2 }} aria-label="Đóng">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={step === "email" ? submitEmail : submitCode} className="flex flex-col gap-4 p-5">
          <p className="text-[13px] leading-relaxed" style={{ color: C.muted }}>{message}</p>
          <label className="flex flex-col gap-1 text-[11px] font-extrabold uppercase" style={{ color: C.muted }}>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required className="px-3 py-2 text-sm normal-case outline-none" style={{ border: border2, color: C.text }} />
          </label>
          {step === "code" && (
            <label className="flex flex-col gap-1 text-[11px] font-extrabold uppercase" style={{ color: C.muted }}>
              Mã xác minh
              <input value={code} onChange={(event) => setCode(event.target.value)} inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required className="px-3 py-2 text-sm normal-case outline-none" style={{ border: border2, color: C.text }} />
            </label>
          )}
          {error && <p className="text-[12px] font-bold leading-relaxed" style={{ color: C.secondary }}>{error}</p>}
          <div className="flex flex-wrap items-center gap-3">
            <button disabled={submitting || (step === "email" && cooldown > 0)} className="px-4 py-2.5 text-[12px] font-extrabold uppercase disabled:opacity-50" style={{ background: C.primary, color: C.white, border: border2, boxShadow: shadow4 }}>
              {submitting ? "Đang xử lý..." : step === "email" ? "Gửi mã" : "Xác minh"}
            </button>
            {step === "code" && (
              <button type="button" disabled={cooldown > 0 || submitting} onClick={resendCode} className="px-4 py-2.5 text-[12px] font-extrabold uppercase disabled:opacity-50" style={{ background: C.boneWhite, color: C.text, border: border2 }}>
                {cooldown > 0 ? `Gửi lại sau ${cooldown}s` : "Gửi lại mã"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
