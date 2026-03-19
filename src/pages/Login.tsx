import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Loader2, Sparkles } from "lucide-react";

const Login = () => {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");

  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Signup state
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);

  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Error", description: "Email dan password wajib diisi.", variant: "destructive" });
      return;
    }

    setLoading(true);
    const normalizedEmail = email.trim().toLowerCase();
    const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
    setLoading(false);

    if (error) {
      toast({
        title: "Login gagal",
        description:
          error.message === "Invalid login credentials"
            ? "Email atau password salah, atau akun belum ada di environment ini. Cek console untuk info backend."
            : error.message,
        variant: "destructive",
      });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteCode || !signupEmail || !signupPassword) {
      toast({ title: "Error", description: "Semua field wajib diisi.", variant: "destructive" });
      return;
    }

    if (signupPassword.length < 6) {
      toast({ title: "Error", description: "Password minimal 6 karakter.", variant: "destructive" });
      return;
    }

    setSignupLoading(true);

    // Validate invite code server-side
    try {
      const { data: codeResult, error: codeError } = await supabase.functions.invoke("validate-invite-code", {
        body: { code: inviteCode.trim(), email: signupEmail },
      });

      console.log("Invite code validation:", { codeResult, codeError });

      if (codeError) {
        setSignupLoading(false);
        // Distinguish network/CORS errors from business errors
        const isNetworkError =
          codeError.message?.includes("Failed to send") ||
          codeError.message?.includes("fetch") ||
          codeError.message?.includes("NetworkError");
        toast({
          title: isNetworkError ? "Koneksi Gagal" : "Kode tidak valid",
          description: isNetworkError
            ? "Tidak dapat terhubung ke server. Coba lagi dalam beberapa saat."
            : codeError.message || "Gagal memvalidasi kode.",
          variant: "destructive",
        });
        return;
      }

      if (!codeResult || typeof codeResult.valid === "undefined" || !codeResult.valid) {
        setSignupLoading(false);
        toast({
          title: "Kode tidak valid",
          description: codeResult?.error || "Kode akses tidak valid.",
          variant: "destructive",
        });
        return;
      }
    } catch (err: any) {
      console.error("Unexpected error during invite code validation:", err);
      setSignupLoading(false);
      toast({
        title: "Terjadi Kesalahan",
        description: "Gagal memvalidasi kode. Silakan coba lagi.",
        variant: "destructive",
      });
      return;
    }

    const normalizedSignupEmail = signupEmail.trim().toLowerCase();
    const { error } = await supabase.auth.signUp({ email: normalizedSignupEmail, password: signupPassword });
    setSignupLoading(false);

    if (error) {
      toast({ title: "Gagal mendaftar", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Berhasil!", description: "Akun berhasil dibuat! Silakan login." });
    setSignupEmail("");
    setSignupPassword("");
    setInviteCode("");
    setActiveTab("login");
  };

  const inputClass =
    "w-full rounded-lg border border-border/60 bg-secondary/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all";

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full opacity-[0.05]"
        style={{
          background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)",
        }}
      />

      <div className="relative w-full max-w-md rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-8 shadow-[0_8px_40px_-12px_hsl(0_0%_0%/0.5)]">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary" />
          <p className="font-satoshi text-xl font-bold tracking-[0.1em] text-foreground">GENBOX</p>
        </div>

        {/* Tab switcher */}
        <div className="mt-6 flex rounded-lg bg-muted p-1">
          <button
            type="button"
            onClick={() => setActiveTab("login")}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
              activeTab === "login"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Masuk
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("signup")}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
              activeTab === "signup"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Daftar Early Access
          </button>
        </div>

        {/* ─── LOGIN TAB ─── */}
        {activeTab === "login" && (
          <>
            <h1 className="mt-6 text-center font-satoshi text-2xl font-bold text-foreground">Masuk ke Dashboard</h1>
            <p className="mt-1.5 text-center text-sm text-muted-foreground">Mulai buat konten UGC dengan AI</p>

            <form onSubmit={handleLogin} className="mt-8 space-y-5">
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="email@contoh.com"
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${inputClass} pr-11`}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold tracking-wider text-primary-foreground transition-all hover:brightness-110 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-6px_hsl(var(--primary)/0.4)] disabled:opacity-60 disabled:pointer-events-none"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Masuk
              </button>
            </form>
          </>
        )}

        {/* ─── SIGNUP TAB ─── */}
        {activeTab === "signup" && (
          <>
            <div className="mt-6 flex justify-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-semibold text-primary">
                <Sparkles className="h-3 w-3" />
                Early Access — Kuota Terbatas
              </span>
            </div>

            <h1 className="mt-4 text-center font-satoshi text-2xl font-bold text-foreground">Daftar Early Access</h1>
            <p className="mt-1.5 text-center text-sm text-muted-foreground">Masukkan kode akses untuk membuat akun</p>

            <form onSubmit={handleSignup} className="mt-8 space-y-5">
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Kode Akses
                </label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className={inputClass}
                  placeholder="Masukkan kode undangan"
                  autoComplete="off"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Email
                </label>
                <input
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  className={inputClass}
                  placeholder="email@contoh.com"
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showSignupPassword ? "text" : "password"}
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    className={`${inputClass} pr-11`}
                    placeholder="Minimal 6 karakter"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={signupLoading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold tracking-wider text-primary-foreground transition-all hover:brightness-110 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-6px_hsl(var(--primary)/0.4)] disabled:opacity-60 disabled:pointer-events-none"
              >
                {signupLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Buat Akun
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
