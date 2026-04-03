import { Download, Workflow, ExternalLink, Play, MessageCircle, Bot, Video } from "lucide-react";

const blueprints = [
  {
    title: "UGC Studio + Merge",
    version: "v3",
    description:
      "Workflow otomatis: Telegram trigger → AI prompt (Claude via OpenRouter) → Kie.ai video generation → kirim balik video via Telegram.",
    file: "/blueprints/ugc-studio-merge-v3.json",
    nodes: 15,
    tags: ["Telegram", "Kie.ai", "OpenRouter", "Video"],
    icons: [MessageCircle, Bot, Video, Play],
  },
];

const BlueprintPage = () => {
  const handleDownload = (file: string, title: string) => {
    const a = document.createElement("a");
    a.href = file;
    a.download = `${title.replace(/\s+/g, "-").toLowerCase()}.json`;
    a.click();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Workflow className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-satoshi text-2xl font-bold text-foreground">n8n Blueprint</h1>
            <p className="text-sm text-muted-foreground">
              Download & import ke n8n untuk otomatisasi pipeline UGC kamu.
            </p>
          </div>
        </div>
      </div>

      {/* How to use */}
      <div className="rounded-2xl border border-border/60 bg-secondary/30 p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 mb-3">Cara Pakai</p>
        <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
          <li>Download file JSON di bawah</li>
          <li>Buka n8n → klik <span className="font-mono text-foreground text-xs bg-secondary px-1.5 py-0.5 rounded">Import from File</span></li>
          <li>Pilih file JSON yang sudah di-download</li>
          <li>Sesuaikan credentials (Telegram Bot Token, OpenRouter API Key, Kie.ai API Key)</li>
          <li>Activate workflow & test!</li>
        </ol>
      </div>

      {/* Blueprint Cards */}
      <div className="grid gap-4">
        {blueprints.map((bp) => (
          <div
            key={bp.title}
            className="group rounded-2xl border border-border/60 bg-card/80 p-6 transition-all hover:border-primary/30 hover:shadow-[0_0_24px_-8px_hsl(var(--primary)/0.15)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-satoshi text-lg font-bold text-foreground">{bp.title}</h3>
                  <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {bp.version}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{bp.description}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {bp.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full border border-border/60 bg-secondary/50 px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Node count */}
                <p className="text-[11px] text-muted-foreground/50">{bp.nodes} nodes</p>
              </div>

              {/* Flow visualization placeholder */}
              <div className="hidden sm:flex items-center gap-1.5 pt-1">
                {bp.icons.map((Icon, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/80 border border-border/40">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    {i < bp.icons.length - 1 && (
                      <div className="h-px w-3 bg-border/60" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-5 flex items-center gap-3 pt-4 border-t border-border/40">
              <button
                onClick={() => handleDownload(bp.file, bp.title)}
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-6px_hsl(var(--primary)/0.4)]"
              >
                <Download className="h-4 w-4" />
                Download JSON
              </button>
              <a
                href="https://docs.n8n.io/getting-started/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                n8n Docs
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BlueprintPage;
