import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useApiKeys } from "@/hooks/useApiKeys";
import { usePromptModel } from "@/hooks/usePromptModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User, Key, Eye, EyeOff, Loader2,
  CheckCircle2, XCircle, Clock, Cpu, LogOut,
} from "lucide-react";

/* ── Status Badge (inline) ── */
const StatusBadge = ({ status }: { status: string }) => {
  if (status === "valid")
    return <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md"><CheckCircle2 className="w-3 h-3" /> Valid</span>;
  if (status === "testing")
    return <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-white/[0.04] px-2 py-0.5 rounded-md"><Clock className="w-3 h-3 animate-spin" /> Verifying...</span>;
  if (status === "invalid")
    return <span className="inline-flex items-center gap-1 text-[10px] font-medium text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md"><XCircle className="w-3 h-3" /> Invalid</span>;
  return null;
};

/* ── API Key Row (merged save+test) ── */
const ApiKeyRow = ({
  label, keyValue, status, onKeyChange, onSaveAndTest, saving,
}: {
  label: string; keyValue: string; status: string;
  onKeyChange: (v: string) => void; onSaveAndTest: () => void;
  saving: boolean;
}) => {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2.5">
        <Label className="text-sm text-foreground">{label}</Label>
        <StatusBadge status={status} />
      </div>
      <div className="relative">
        <Input
          type={show ? "text" : "password"}
          value={keyValue}
          onChange={(e) => onKeyChange(e.target.value)}
          placeholder={`Masukkan ${label} key...`}
          className="bg-white/[0.03] border-white/[0.06] rounded-xl pr-10 text-sm placeholder:text-muted-foreground/20"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground transition-colors"
        >
          {status === "valid" && !show ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : show ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      </div>
      <Button
        onClick={onSaveAndTest}
        disabled={saving || !keyValue}
        size="sm"
        className="text-[11px] font-bold px-5 rounded-lg"
      >
        {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
        Save & verify
      </Button>
    </div>
  );
};

/* ── Model options ── */
const MODEL_OPTIONS = [
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash", desc: "Cepat, cocok untuk kebanyakan kasus", badge: "GRATIS", badgeClass: "bg-primary/10 text-primary", dots: 1 },
  { value: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro", desc: "Reasoning terbaik, JSON precision", badge: "TERBARU", badgeClass: "bg-primary/10 text-primary", dots: 2 },
  { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro", desc: "Kreativitas tinggi, multimodal vision", badge: "PREMIUM", badgeClass: "bg-amber-500/10 text-amber-400", dots: 3 },
];

const SpeedDots = ({ count }: { count: number }) => (
  <div className="flex gap-1">
    {[1, 2, 3].map((i) => (
      <div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= count ? "bg-primary" : "bg-white/[0.06]"}`} />
    ))}
  </div>
);

const SettingsPage = () => {
  const { user, signOut } = useAuth();
  const { keys, savingProvider, testingProvider, saveKey, testKey, setLocalKey } = useApiKeys();
  const { model: promptModel, setPromptModel } = usePromptModel();

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "User";

  const handleSaveAndTest = async (provider: "kie_ai" | "gemini") => {
    await saveKey(provider, keys[provider].key);
    await testKey(provider);
  };

  const Section = ({ children, delay = "0ms" }: { children: React.ReactNode; delay?: string }) => (
    <section className="animate-fade-up rounded-2xl border border-white/[0.06] bg-card/40 backdrop-blur-sm p-6" style={{ animationDelay: delay }}>
      {children}
    </section>
  );

  const SectionHeader = ({ icon: Icon, title }: { icon: typeof User; title: string }) => (
    <div className="flex items-center gap-2.5 mb-4">
      <Icon className="w-4 h-4 text-primary" />
      <h2 className="font-satoshi text-sm font-bold text-foreground">{title}</h2>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="animate-fade-up">
        <h1 className="font-satoshi text-[26px] font-bold tracking-tight text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground/40">Pengaturan akun dan API key.</p>
      </div>

      {/* Profile */}
      <Section>
        <SectionHeader icon={User} title="Profil" />
        <div className="space-y-3">
          <div>
            <Label className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">Nama</Label>
            <p className="text-sm text-foreground mt-0.5">{firstName}</p>
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">Email</Label>
            <p className="text-sm text-muted-foreground mt-0.5">{user?.email || "—"}</p>
          </div>
        </div>
      </Section>

      {/* API Keys */}
      <Section delay="80ms">
        <SectionHeader icon={Key} title="API Keys" />
        <p className="text-[12px] text-muted-foreground/40 mb-5 -mt-2">Masukkan API key kamu untuk menggunakan fitur generate</p>
        <div className="space-y-6">
          <ApiKeyRow
            label="Kie AI" keyValue={keys.kie_ai.key} status={keys.kie_ai.status}
            onKeyChange={(v) => setLocalKey("kie_ai", v)}
            onSaveAndTest={() => handleSaveAndTest("kie_ai")}
            saving={savingProvider === "kie_ai" || testingProvider === "kie_ai"}
          />
          <div className="border-t border-white/[0.06]" />
          <ApiKeyRow
            label="Gemini" keyValue={keys.gemini.key} status={keys.gemini.status}
            onKeyChange={(v) => setLocalKey("gemini", v)}
            onSaveAndTest={() => handleSaveAndTest("gemini")}
            saving={savingProvider === "gemini" || testingProvider === "gemini"}
          />
        </div>
      </Section>

      {/* Prompt Model */}
      <Section delay="160ms">
        <SectionHeader icon={Cpu} title="Model Prompt" />
        <p className="text-[12px] text-muted-foreground/40 mb-4 -mt-2">Model yang dipakai untuk generate prompt.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {MODEL_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPromptModel(opt.value)}
              className={`text-left rounded-xl p-3.5 transition-all duration-200 ${
                promptModel === opt.value
                  ? "border-2 border-primary/20 bg-primary/[0.04]"
                  : "border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]"
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-semibold text-[13px] text-foreground">{opt.label}</span>
                <span className={`${opt.badgeClass} text-[9px] font-bold rounded-md px-1.5 py-0.5`}>{opt.badge}</span>
              </div>
              <p className="text-[11px] text-muted-foreground/40 mb-2">{opt.desc}</p>
              <SpeedDots count={opt.dots} />
            </button>
          ))}
        </div>
      </Section>

      {/* Account */}
      <Section delay="240ms">
        <SectionHeader icon={LogOut} title="Akun" />
        <button
          onClick={signOut}
          className="text-muted-foreground/40 hover:text-foreground text-[13px] transition-colors inline-flex items-center gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          Keluar dari akun
        </button>
      </Section>
    </div>
  );
};

export default SettingsPage;
