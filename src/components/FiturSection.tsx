import { Sparkles, Send } from "lucide-react";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

/* ── Mock UI Components ─────────────────────────────── */

const MockCharacterGrid = () => {
  const chars = [
    { label: "Hijab Casual", gradient: "from-emerald-500 to-teal-400" },
    { label: "Urban Trendy", gradient: "from-violet-500 to-purple-400" },
    { label: "Ibu Muda", gradient: "from-rose-500 to-pink-400" },
    { label: "Mahasiswa", gradient: "from-blue-500 to-cyan-400" },
    { label: "Profesional", gradient: "from-amber-500 to-yellow-400" },
    { label: "Gen-Z Style", gradient: "from-fuchsia-500 to-pink-400" },
  ];
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="grid grid-cols-3 gap-4">
        {chars.map((c) => (
          <div key={c.label} className="flex flex-col items-center gap-2">
            <div className={`h-14 w-14 rounded-full bg-gradient-to-br ${c.gradient}`} />
            <span className="text-[11px] text-muted-foreground">{c.label}</span>
          </div>
        ))}
      </div>
      <button className="mt-4 w-full rounded-lg border border-border py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
        Pilih Karakter →
      </button>
    </div>
  );
};

const MockBeforeAfter = () => (
  <div className="rounded-xl border border-border bg-card p-5">
    <div className="flex items-center gap-3">
      <div className="flex flex-1 flex-col items-center gap-2">
        <div className="h-32 w-full rounded-lg bg-secondary" />
        <span className="text-[11px] text-muted-foreground">Produk</span>
      </div>
      <Sparkles size={20} className="shrink-0 text-primary" />
      <div className="flex flex-1 flex-col items-center gap-2">
        <div className="h-32 w-full rounded-lg bg-gradient-to-br from-primary/20 to-primary/5" />
        <span className="text-[11px] text-muted-foreground">UGC</span>
      </div>
    </div>
    <button className="mt-4 w-full rounded-lg bg-primary py-2 text-xs font-bold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-[hsl(var(--lime-hover))]">
      Generate →
    </button>
  </div>
);

const MockVideoPlayer = () => (
  <div className="rounded-xl border border-border bg-card p-5">
    <div className="relative flex h-44 items-center justify-center rounded-lg bg-secondary">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/90">
        <div className="ml-0.5 h-0 w-0 border-y-[8px] border-l-[14px] border-y-transparent border-l-primary-foreground" />
      </div>
      <span className="absolute right-3 top-3 rounded-md bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
        Siap Reels
      </span>
    </div>
    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
      <div className="h-full w-1/3 rounded-full bg-primary" />
    </div>
    <p className="mt-1.5 text-right font-mono text-[11px] text-muted-foreground">
      00:05 / 00:15
    </p>
  </div>
);

const MockChatUI = () => (
  <div className="rounded-xl border border-border bg-card p-5">
    <div className="space-y-3">
      <div className="ml-auto max-w-[80%] rounded-xl rounded-br-sm bg-secondary px-4 py-2.5">
        <p className="text-sm text-foreground">Serum wajah, botol kaca, di meja kayu</p>
      </div>
      <div className="mr-auto max-w-[90%] rounded-xl rounded-bl-sm border border-border bg-card px-4 py-2.5">
        <p className="font-mono text-xs leading-relaxed text-muted-foreground">
          Professional UGC photo of Indonesian woman holding glass serum bottle...
        </p>
      </div>
    </div>
    <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-2">
      <span className="flex-1 text-xs text-muted-foreground">Deskripsikan produk...</span>
      <Send size={14} className="text-primary" />
    </div>
  </div>
);

/* ── Feature Row Data ───────────────────────────────── */

const features = [
  {
    num: "01",
    title: "PILIH KARAKTER SESUAI TARGET MARKET",
    desc: "Ada 10+ karakter — hijab casual, urban trendy, ibu muda, dan lainnya. Tinggal pilih yang paling cocok buat audience kamu.",
    visual: <MockCharacterGrid />,
    reversed: false,
  },
  {
    num: "02",
    title: "GENERATE GAMBAR UGC YANG CONVERT",
    desc: "Upload foto produk, pilih karakter dan pose. AI langsung generate gambar UGC yang kelihatan kayak difoto beneran pakai iPhone.",
    visual: <MockBeforeAfter />,
    reversed: true,
  },
  {
    num: "03",
    title: "JADIKAN VIDEO SIAP POSTING",
    desc: "Ubah gambar UGC jadi video 5-15 detik. Langsung bisa upload ke TikTok dan Instagram Reels.",
    visual: <MockVideoPlayer />,
    reversed: false,
  },
  {
    num: "04",
    title: "AI YANG NGERTI PRODUK KAMU",
    desc: "Cukup deskripsikan produk pakai Bahasa Indonesia, AI otomatis bikin prompt terbaik. Gak perlu ribet belajar prompt engineering.",
    visual: <MockChatUI />,
    reversed: true,
  },
];

/* ── Feature Row Component ──────────────────────────── */

const FeatureRow = ({
  num,
  title,
  desc,
  visual,
  reversed,
  isVisible,
  delay,
}: {
  num: string;
  title: string;
  desc: string;
  visual: React.ReactNode;
  reversed: boolean;
  isVisible: boolean;
  delay: number;
}) => (
  <div
    className={`flex flex-col items-center gap-10 lg:gap-20 ${reversed ? "lg:flex-row-reverse" : "lg:flex-row"} ${isVisible ? "animate-fade-up" : "opacity-0"}`}
    style={{ animationDelay: `${delay}s` }}
  >
    {/* Text */}
    <div className="flex-1">
      <span className="font-mono text-[48px] font-bold leading-none text-primary">{num}</span>
      <h3 className="mt-3 font-satoshi text-xl font-bold uppercase tracking-wide text-foreground sm:text-2xl">
        {title}
      </h3>
      <p className="mt-3 max-w-md font-body text-base text-muted-foreground">{desc}</p>
    </div>
    {/* Visual */}
    <div className="w-full max-w-sm flex-1">{visual}</div>
  </div>
);

/* ── Section ────────────────────────────────────────── */

const FiturSection = () => {
  const { ref, isVisible } = useScrollReveal(0.15);

  return (
    <section id="fitur" ref={ref} className="relative z-10 px-4 py-24 sm:py-32">
      <div className="mx-auto max-w-5xl">
        {/* Badge */}
        <div className="flex justify-center">
          <div
            className={`flex items-center gap-2 rounded-full bg-primary px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-primary-foreground ${isVisible ? "animate-fade-up" : "opacity-0"}`}
            style={{ animationDelay: "0.1s" }}
          >
            <Sparkles size={14} />
            FITUR UTAMA
          </div>
        </div>

        {/* Heading */}
        <h2
          className={`mx-auto mt-6 max-w-[700px] text-center font-satoshi text-[28px] font-bold uppercase leading-tight tracking-[0.04em] sm:text-[36px] lg:text-[42px] ${isVisible ? "animate-fade-up" : "opacity-0"}`}
          style={{
            animationDelay: "0.2s",
            background: "linear-gradient(180deg, hsl(0 0% 100%) 0%, hsl(0 0% 63%) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          SEMUA YANG KAMU BUTUHKAN UNTUK KONTEN UGC
        </h2>

        {/* Feature Rows */}
        <div className="mt-20 space-y-24">
          {features.map((f, i) => (
            <FeatureRow
              key={f.num}
              {...f}
              isVisible={isVisible}
              delay={0.3 + i * 0.15}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FiturSection;
