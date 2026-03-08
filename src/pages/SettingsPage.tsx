import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useApiKeys } from "@/hooks/useApiKeys";
import { usePromptModel } from "@/hooks/usePromptModel";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User, Key, Download, LogOut, Eye, EyeOff, Loader2,
  CheckCircle2, XCircle, Clock, FileCode2, Workflow, Webhook, Cpu,
} from "lucide-react";

/* ── Status Badge ── */
const StatusBadge = ({ status }: { status: string }) => {
  if (status === "valid")
    return <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full"><CheckCircle2 className="w-3 h-3" /> Valid</span>;
  if (status === "testing")
    return <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full"><Clock className="w-3 h-3 animate-spin" /> Testing...</span>;
  return <span className="inline-flex items-center gap-1 text-[10px] font-medium text-destructive bg-destructive/10 px-2 py-0.5 rounded-full"><XCircle className="w-3 h-3" /> Belum setup</span>;
};

/* ── API Key Row ── */
const ApiKeyRow = ({
  label, provider, keyValue, status, onKeyChange, onSave, onTest, saving, testing,
}: {
  label: string; provider: string; keyValue: string; status: string;
  onKeyChange: (v: string) => void; onSave: () => void; onTest: () => void;
  saving: boolean; testing: boolean;
}) => {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <Label className="text-sm text-foreground">{label}</Label>
        <StatusBadge status={status} />
      </div>
      <div className="relative">
        <Input
          type={show ? "text" : "password"}
          value={keyValue}
          onChange={(e) => onKeyChange(e.target.value)}
          placeholder={`Masukkan ${label} key...`}
          className="bg-background border-border/60 pr-10 text-sm"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      <div className="flex gap-2">
        <Button onClick={onSave} disabled={saving || !keyValue} size="sm" className="text-[11px] font-bold px-4">
          {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null} Simpan
        </Button>
        <Button onClick={onTest} disabled={testing || !keyValue} variant="outline" size="sm" className="text-[11px] px-4 text-muted-foreground hover:text-foreground border-border/60">
          {testing ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null} Test
        </Button>
      </div>
    </div>
  );
};

/* ── Blueprint items ── */
const blueprints = [
  { icon: FileCode2, name: "Image Generation Workflow", desc: "Workflow otomatis untuk generate gambar UGC" },
  { icon: Workflow, name: "Batch Processing Pipeline", desc: "Pipeline untuk batch generate konten" },
  { icon: Webhook, name: "Webhook Integration", desc: "Integrasi webhook untuk trigger otomatis" },
];

const MODEL_OPTIONS = [
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash", desc: "Cepat, gratis, cocok untuk kebanyakan kasus", badge: "GRATIS", badgeClass: "bg-primary/10 text-primary" },
  { value: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro", desc: "Reasoning terbaik, JSON precision, prompt paling detail", badge: "TERBARU", badgeClass: "bg-accent/10 text-accent" },
  { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro", desc: "Kreativitas tinggi, multimodal vision, analisis gambar", badge: "PREMIUM", badgeClass: "bg-muted text-muted-foreground" },
];

const SettingsPage = () => {
  const { user, signOut } = useAuth();
  const { keys, savingProvider, testingProvider, saveKey, testKey, setLocalKey } = useApiKeys();
  const { model: promptModel, setPromptModel } = usePromptModel();

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "User";

  const Section = ({ children, delay = "0ms" }: { children: React.ReactNode; delay?: string }) => (
    <section className="animate-fade-up rounded-2xl border border-border/60 bg-card/80 p-6" style={{ animationDelay: delay }}>
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
        <h1 className="font-satoshi text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Pengaturan akun dan API key.</p>
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
        <p className="text-[12px] text-muted-foreground/60 mb-5 -mt-2">Masukkan API key kamu untuk menggunakan fitur generate</p>
        <div className="space-y-6">
          <ApiKeyRow
            label="Kie AI" provider="kie_ai" keyValue={keys.kie_ai.key} status={keys.kie_ai.status}
            onKeyChange={(v) => setLocalKey("kie_ai", v)} onSave={() => saveKey("kie_ai", keys.kie_ai.key)}
            onTest={() => testKey("kie_ai")} saving={savingProvider === "kie_ai"} testing={testingProvider === "kie_ai"}
          />
          <div className="border-t border-border/60" />
          <ApiKeyRow
            label="Gemini" provider="gemini" keyValue={keys.gemini.key} status={keys.gemini.status}
            onKeyChange={(v) => setLocalKey("gemini", v)} onSave={() => saveKey("gemini", keys.gemini.key)}
            onTest={() => testKey("gemini")} saving={savingProvider === "gemini"} testing={testingProvider === "gemini"}
          />
        </div>
      </Section>

      {/* Prompt Model */}
      <Section delay="160ms">
        <SectionHeader icon={Cpu} title="Model Prompt" />
        <p className="text-[12px] text-muted-foreground/60 mb-4 -mt-2">Model yang dipakai untuk generate prompt.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {MODEL_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPromptModel(opt.value)}
              className={`text-left rounded-lg p-3.5 transition-all duration-200 ${
                promptModel === opt.value
                  ? "border-2 border-primary bg-primary/5"
                  : "border border-border/60 bg-background hover:border-primary/20"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-[13px] text-foreground">{opt.label}</span>
                <span className={`${opt.badgeClass} text-[9px] font-bold rounded-full px-1.5 py-0.5`}>{opt.badge}</span>
              </div>
              <p className="text-[11px] text-muted-foreground/60 mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </div>
      </Section>

      {/* Blueprint */}
      <Section delay="240ms">
        <SectionHeader icon={Download} title="n8n Blueprint" />
        <div className="space-y-2">
          {blueprints.map((bp) => (
            <div key={bp.name} className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-background">
              <div className="flex items-center gap-3">
                <bp.icon className="w-4 h-4 text-muted-foreground/40" />
                <div>
                  <p className="text-[13px] font-medium text-foreground">{bp.name}</p>
                  <p className="text-[11px] text-muted-foreground/60">{bp.desc}</p>
                </div>
              </div>
              <Button
                variant="outline" size="sm"
                className="text-[11px] border-border/60 text-muted-foreground hover:text-foreground"
                onClick={() => toast({ title: "Coming soon", description: "Akan tersedia setelah launch!" })}
              >
                Download
              </Button>
            </div>
          ))}
        </div>
      </Section>

      {/* Account */}
      <Section delay="320ms">
        <SectionHeader icon={LogOut} title="Akun" />
        <Button
          variant="outline"
          onClick={signOut}
          className="border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive rounded-lg px-4 py-2 text-sm"
        >
          Keluar
        </Button>
      </Section>
    </div>
  );
};

export default SettingsPage;
