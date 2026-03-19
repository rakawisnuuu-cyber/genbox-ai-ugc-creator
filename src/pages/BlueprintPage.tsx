import { Workflow, ArrowRightLeft, Send, RefreshCw, BarChart3, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BLUEPRINTS = [
  { icon: Workflow, name: "Product-to-UGC Pipeline", desc: "Webhook → analyze → generate → save" },
  { icon: ArrowRightLeft, name: "Batch UGC Generator", desc: "Google Sheet → loop → generate all" },
  { icon: Send, name: "Auto-Post to Social", desc: "Resize + caption + queue posting" },
];

const FEATURES = [
  { icon: RefreshCw, title: "Product → UGC", desc: "Otomatis terima foto produk via webhook, analisis dengan AI, generate UGC, dan simpan ke cloud storage." },
  { icon: BarChart3, title: "Batch Generate", desc: "Ambil data produk dari Google Sheet, loop setiap item, dan generate gambar UGC secara bulk." },
  { icon: Smartphone, title: "Auto Post", desc: "Resize gambar, generate caption, dan jadwalkan posting otomatis ke media sosial." },
];

const BlueprintPage = () => {
  const { toast } = useToast();

  const handleDownload = () => {
    toast({ title: "Segera hadir!", description: "Akan tersedia setelah launch!" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-up">
        <h1 className="text-2xl font-bold uppercase tracking-wider font-satoshi text-foreground">N8N Blueprint</h1>
        <p className="mt-1 text-sm text-muted-foreground">Automation blueprint untuk workflow kamu.</p>
      </div>

      {/* Main Card */}
      <div className="bg-card border border-border rounded-xl p-6 animate-fade-up" style={{ animationDelay: "100ms" }}>
        <p className="text-sm text-muted-foreground mb-5">Download template automasi n8n untuk workflow UGC</p>
        <div className="space-y-3">
          {BLUEPRINTS.map((bp) => (
            <div
              key={bp.name}
              className="bg-secondary rounded-lg p-3 flex items-center gap-3"
            >
              <div className="w-9 h-9 bg-muted rounded-lg flex items-center justify-center shrink-0">
                <bp.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{bp.name}</p>
                <p className="text-xs text-muted-foreground">{bp.desc}</p>
              </div>
              <button
                onClick={handleDownload}
                className="text-xs font-bold px-4 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors shrink-0"
              >
                DOWNLOAD
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Info */}
      <div className="animate-fade-up" style={{ animationDelay: "200ms" }}>
        <h2 className="text-lg font-bold font-satoshi text-foreground mb-4">Apa itu n8n Blueprint?</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-card border border-border rounded-xl p-5">
              <div className="w-9 h-9 bg-secondary rounded-lg flex items-center justify-center mb-3">
                <f.icon className="h-4 w-4 text-primary" />
              </div>
              <p className="text-sm font-semibold text-foreground mb-1">{f.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BlueprintPage;
