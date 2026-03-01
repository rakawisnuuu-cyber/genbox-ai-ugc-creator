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
    return <span className="inline-flex items-center gap-1 text-[11px] font-medium text-green-400 bg-green-500/15 px-2 py-0.5 rounded-full"><CheckCircle2 className="w-3 h-3" /> Valid</span>;
  if (status === "testing")
    return <span className="inline-flex items-center gap-1 text-[11px] font-medium text-yellow-400 bg-yellow-500/15 px-2 py-0.5 rounded-full"><Clock className="w-3 h-3 animate-spin" /> Testing...</span>;
  return <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-400 bg-red-500/15 px-2 py-0.5 rounded-full"><XCircle className="w-3 h-3" /> Belum setup</span>;
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
    <div className="space-y-2">
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
          className="bg-[hsl(var(--secondary))] border-border pr-10 text-sm"
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
        <Button onClick={onSave} disabled={saving || !keyValue} size="sm" className="text-xs font-bold px-4">
          {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null} SIMPAN
        </Button>
        <Button onClick={onTest} disabled={testing || !keyValue} variant="outline" size="sm" className="text-xs px-4 text-muted-foreground hover:text-foreground border-border">
          {testing ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null} TEST
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
  {
    value: "gemini-2.5-flash",
    label: "Gemini 2.5 Flash",
    desc: "Cepat, gratis, cocok untuk kebanyakan kasus",
    badge: "GRATIS",
    badgeCls: "bg-green-500/20 text-green-400",
  },
  {
    value: "gemini-3.1-pro-preview",
    label: "Gemini 3.1 Pro",
    desc: "Reasoning lebih dalam, prompt lebih detail & akurat",
    badge: "PREMIUM",
    badgeCls: "bg-primary/20 text-primary",
  },
];

/* ── Main Page ── */
const SettingsPage = () => {
  const { user, signOut } = useAuth();
  const { keys, savingProvider, testingProvider, saveKey, testKey, setLocalKey } = useApiKeys();
  const { model: promptModel, saveModel } = usePromptModel();

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "User";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-satoshi text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Pengaturan akun dan API key.</p>
      </div>

      {/* Section 1 — Profile */}
      <section className="animate-fade-up bg-[hsl(var(--secondary))] border border-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <User className="w-5 h-5 text-primary" />
          <h2 className="font-satoshi font-bold text-foreground">Profil</h2>
        </div>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Nama</Label>
            <p className="text-sm text-foreground mt-1">{firstName}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Email</Label>
            <p className="text-sm text-muted-foreground mt-1">{user?.email || "—"}</p>
          </div>
        </div>
      </section>

      {/* Section 2 — API Keys */}
      <section className="animate-fade-up bg-[hsl(var(--secondary))] border border-border rounded-xl p-6" style={{ animationDelay: "100ms" }}>
        <div className="flex items-center gap-3 mb-1">
          <Key className="w-5 h-5 text-primary" />
          <h2 className="font-satoshi font-bold text-foreground">API Keys</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-5">Masukkan API key kamu untuk menggunakan fitur generate</p>
        <div className="space-y-6">
          <ApiKeyRow
            label="Kie AI" provider="kie_ai"
            keyValue={keys.kie_ai.key} status={keys.kie_ai.status}
            onKeyChange={(v) => setLocalKey("kie_ai", v)}
            onSave={() => saveKey("kie_ai", keys.kie_ai.key)}
            onTest={() => testKey("kie_ai")}
            saving={savingProvider === "kie_ai"} testing={testingProvider === "kie_ai"}
          />
          <div className="border-t border-border" />
          <ApiKeyRow
            label="Gemini" provider="gemini"
            keyValue={keys.gemini.key} status={keys.gemini.status}
            onKeyChange={(v) => setLocalKey("gemini", v)}
            onSave={() => saveKey("gemini", keys.gemini.key)}
            onTest={() => testKey("gemini")}
            saving={savingProvider === "gemini"} testing={testingProvider === "gemini"}
          />
        </div>
      </section>

      {/* Section 2.5 — Model Prompt */}
      <section className="animate-fade-up bg-[hsl(var(--secondary))] border border-border rounded-xl p-6" style={{ animationDelay: "150ms" }}>
        <div className="flex items-center gap-3 mb-1">
          <Cpu className="w-5 h-5 text-primary" />
          <h2 className="font-satoshi font-bold text-foreground">Model Prompt</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-2.5">Model yang dipakai untuk generate prompt karakter dan UGC.</p>
        <div className="grid grid-cols-2 gap-3">
          {MODEL_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => saveModel(opt.value)}
              className={`text-left rounded-xl p-4 transition-all ${
                promptModel === opt.value
                  ? "border-2 border-primary bg-primary/5"
                  : "border border-border bg-card hover:border-primary/50"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm text-foreground">{opt.label}</span>
                <span className={`${opt.badgeCls} text-[10px] font-bold rounded-full px-2`}>{opt.badge}</span>
              </div>
              <p className="text-xs text-muted-foreground">{opt.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Section 3 — Blueprint */}
      <section className="animate-fade-up bg-[hsl(var(--secondary))] border border-border rounded-xl p-6" style={{ animationDelay: "200ms" }}>
        <div className="flex items-center gap-3 mb-4">
          <Download className="w-5 h-5 text-primary" />
          <h2 className="font-satoshi font-bold text-foreground">n8n Blueprint</h2>
        </div>
        <div className="space-y-3">
          {blueprints.map((bp) => (
            <div key={bp.name} className="flex items-center justify-between p-3 rounded-lg border border-border bg-background/50">
              <div className="flex items-center gap-3">
                <bp.icon className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">{bp.name}</p>
                  <p className="text-xs text-muted-foreground">{bp.desc}</p>
                </div>
              </div>
              <Button
                variant="outline" size="sm"
                className="text-xs border-border text-muted-foreground hover:text-foreground"
                onClick={() => toast({ title: "Coming soon", description: "Akan tersedia setelah launch!" })}
              >
                DOWNLOAD
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Section 4 — Account */}
      <section className="animate-fade-up bg-[hsl(var(--secondary))] border border-border rounded-xl p-6" style={{ animationDelay: "300ms" }}>
        <div className="flex items-center gap-3 mb-4">
          <LogOut className="w-5 h-5 text-destructive" />
          <h2 className="font-satoshi font-bold text-foreground">Akun</h2>
        </div>
        <Button
          variant="outline" onClick={signOut}
          className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg px-4 py-2"
        >
          Keluar
        </Button>
      </section>
    </div>
  );
};

export default SettingsPage;
