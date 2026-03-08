import { RefreshCw, Film, Smartphone, Download, Lock, Camera, Dna, ImageIcon, Video, Link2, Send, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const FLOW_STEPS = [
  { icon: Camera, label: "Trigger" },
  { icon: Dna, label: "Analyze" },
  { icon: ImageIcon, label: "Generate Image" },
  { icon: Video, label: "Generate Video" },
  { icon: Link2, label: "Merge" },
  { icon: Send, label: "Deliver" },
];

const FEATURES = [
  { icon: RefreshCw, title: "Product → UGC Pipeline", desc: "Kirim foto produk via Telegram, AI analisis otomatis, generate gambar UGC realistis, dan kirim balik hasilnya. Semua otomatis." },
  { icon: Film, title: "Auto Video Generation", desc: "Generate video UGC dari gambar hasil AI. Support Veo model untuk video dengan audio dan lip-sync. Hasil dikirim ke Telegram." },
  { icon: Smartphone, title: "Auto Merge & Deliver", desc: "Gabungkan beberapa clip video jadi satu. Hasil final dikirim langsung ke Telegram, siap upload ke TikTok." },
];

const STEPS = [
  "Download file .json di atas",
  "Buka n8n → Import from File → pilih file",
  "Setup credentials (Telegram bot, Gemini API key, Kie AI key) → Aktifkan",
];

const COMING_SOON = [
  { name: "Batch UGC Generator", desc: "Bulk generate dari Google Sheet" },
  { name: "Auto-Post to Social", desc: "Jadwal posting otomatis ke TikTok & Instagram" },
];

const BlueprintPage = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-fade-up">
        <h1 className="text-2xl font-bold uppercase tracking-wider font-satoshi text-foreground">N8N Blueprint</h1>
        <p className="mt-1 text-sm text-muted-foreground">Download & import automation workflow ke n8n kamu.</p>
      </div>

      {/* Hero Blueprint Card */}
      <div
        className="rounded-2xl border border-primary/30 bg-card/80 p-6 md:p-8 animate-fade-up"
        style={{ animationDelay: "80ms" }}
      >
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold font-satoshi text-foreground">UGC Studio + Merge</h2>
            <Badge variant="secondary" className="text-[10px] font-mono uppercase tracking-wider">
              51 Nodes &middot; n8n Workflow
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
            Pipeline lengkap: foto produk → AI analyze → generate UGC gambar & video → merge otomatis
          </p>

          {/* Stats */}
          <p className="text-xs text-muted-foreground font-mono">
            Telegram trigger → Gemini Vision → Kie AI Image → Veo Video → Auto Merge → Telegram delivery
          </p>

          {/* Node Flow Preview */}
          <div className="flex items-center gap-0 overflow-x-auto py-3 scrollbar-none">
            {FLOW_STEPS.map((step, i) => (
              <div key={step.label} className="flex items-center shrink-0">
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center">
                    <step.icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono whitespace-nowrap">{step.label}</span>
                </div>
                {i < FLOW_STEPS.length - 1 && (
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 mx-1.5 shrink-0 mb-5" />
                )}
              </div>
            ))}
          </div>

          {/* Download */}
          <div className="flex flex-col items-start gap-2 pt-2">
            <a
              href="/blueprints/ugc-studio-merge.json"
              download="UGC_Studio_Merge.json"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors"
            >
              <Download className="w-4 h-4" />
              DOWNLOAD BLUEPRINT (.json)
            </a>
            <span className="text-[11px] text-muted-foreground">
              Import di n8n → Settings → Import from File
            </span>
          </div>
        </div>
      </div>

      {/* Yang Kamu Dapat */}
      <div className="animate-fade-up" style={{ animationDelay: "160ms" }}>
        <h2 className="text-lg font-bold font-satoshi text-foreground mb-4">Yang Kamu Dapat</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-border/60 bg-card/80 p-5">
              <div className="w-9 h-9 bg-secondary rounded-lg flex items-center justify-center mb-3">
                <f.icon className="h-4 w-4 text-primary" />
              </div>
              <p className="text-sm font-semibold text-foreground mb-1">{f.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Cara Pakai */}
      <div className="animate-fade-up" style={{ animationDelay: "240ms" }}>
        <h2 className="text-lg font-bold font-satoshi text-foreground mb-4">Cara Pakai</h2>
        <div className="flex flex-col md:flex-row gap-4">
          {STEPS.map((text, i) => (
            <div key={i} className="flex items-start gap-3 flex-1">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                {i + 1}
              </div>
              <p className="text-sm text-muted-foreground pt-1.5">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Coming Soon */}
      <div className="animate-fade-up" style={{ animationDelay: "320ms" }}>
        <h2 className="text-lg font-bold font-satoshi text-foreground mb-4">Coming Soon</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {COMING_SOON.map((item) => (
            <div key={item.name} className="rounded-2xl border border-border/40 bg-card/40 p-5 opacity-60">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-foreground">{item.name}</p>
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-muted-foreground" />
                  <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">Segera hadir</Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BlueprintPage;
