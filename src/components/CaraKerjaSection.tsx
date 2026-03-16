import { useState } from "react";
import { Upload, Users, Sparkles } from "lucide-react";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import caraKerjaProduct from "@/assets/cara-kerja-product.jpg";
import caraKerjaUgc from "@/assets/cara-kerja-ugc-new.jpeg";

const characterImages = [
  "https://hgwojnluqkrypwttytxb.supabase.co/storage/v1/object/public/preset-characters/Hijab%20Casual.jpeg",
  "https://hgwojnluqkrypwttytxb.supabase.co/storage/v1/object/public/preset-characters/Urban%20Trendy.jpeg",
  "https://hgwojnluqkrypwttytxb.supabase.co/storage/v1/object/public/preset-characters/Ibu%20Muda.jpeg",
  "https://hgwojnluqkrypwttytxb.supabase.co/storage/v1/object/public/preset-characters/Gen-Z%20Creator.jpeg",
  "https://hgwojnluqkrypwttytxb.supabase.co/storage/v1/object/public/preset-characters/Beauty%20Enthusiast.jpeg",
  "https://hgwojnluqkrypwttytxb.supabase.co/storage/v1/object/public/preset-characters/Bapak%20UMKM.jpeg",
];

const StepUpload = () => (
  <div className="relative h-[220px] rounded-2xl border border-border/40 bg-gradient-to-b from-card/90 to-card/50 overflow-hidden group">
    <img
      src={caraKerjaProduct}
      alt="Produk"
      className="absolute inset-0 w-full h-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
    <div className="relative flex flex-col items-center justify-center h-full p-4">
      <div className="animate-float rounded-2xl bg-background/80 backdrop-blur-sm p-3.5 shadow-xl border border-border/40">
        <Upload size={22} className="text-primary" />
      </div>
      <span className="mt-3 text-[11px] font-semibold text-foreground/90 tracking-wide">Drag & Drop</span>
      <span className="text-[9px] text-muted-foreground mt-0.5">JPG, PNG, WebP</span>
    </div>
  </div>
);

const StepCharacter = () => {
  const [selected, setSelected] = useState(1);
  return (
    <div className="h-[220px] rounded-2xl border border-border/40 bg-gradient-to-b from-card/90 to-card/50 p-4 flex flex-col items-center justify-center">
      <div className="grid grid-cols-3 gap-2">
        {characterImages.map((img, i) => (
          <button
            key={i}
            onClick={() => setSelected(i)}
            className={`relative h-14 w-14 rounded-full overflow-hidden transition-all duration-300 ${
              i === selected
                ? "ring-2 ring-primary ring-offset-2 ring-offset-card scale-110 z-10"
                : "ring-1 ring-border/20 opacity-70 hover:opacity-100 hover:scale-105"
            }`}
          >
            <img src={img} alt="" className="h-full w-full object-cover object-top" loading="lazy" />
          </button>
        ))}
      </div>
    </div>
  );
};

const StepGenerate = () => (
  <div className="relative h-[220px] rounded-2xl border border-border/40 bg-gradient-to-b from-card/90 to-card/50 overflow-hidden group">
    <img
      src={caraKerjaUgc}
      alt="Hasil UGC"
      className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/20" />
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="rounded-full bg-primary/20 backdrop-blur-sm p-3 animate-pulse-subtle">
        <Sparkles size={20} className="text-primary drop-shadow-[0_0_12px_hsl(var(--primary)/0.6)]" />
      </div>
    </div>
  </div>
);

const steps = [
  {
    num: "Langkah 01",
    icon: Upload,
    title: "Upload Produk",
    desc: "Drop foto produk. AI deteksi jenis produk otomatis.",
    visual: <StepUpload />,
  },
  {
    num: "Langkah 02",
    icon: Users,
    title: "Pilih Karakter",
    desc: "10+ preset karakter Indonesia atau buat sendiri.",
    visual: <StepCharacter />,
  },
  {
    num: "Langkah 03",
    icon: Sparkles,
    title: "Generate & Download",
    desc: "AI generate gambar & video UGC. Siap posting ke TikTok.",
    visual: <StepGenerate />,
  },
];

const CaraKerjaSection = () => {
  const { ref, isVisible } = useScrollReveal(0.1);

  return (
    <section id="cara-kerja" ref={ref} className="relative z-10 px-4 py-16 sm:py-24">
      <div className="mx-auto max-w-5xl">
        {/* Badge */}
        <div className="flex justify-center">
          <div
            className={`flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-primary ${isVisible ? "animate-fade-up" : "opacity-0"}`}
            style={{ animationDelay: "0.1s" }}
          >
            Cara Kerja
          </div>
        </div>

        {/* Heading */}
        <h2
          className={`mt-5 text-center font-satoshi text-[28px] font-bold leading-tight tracking-tight sm:text-[36px] lg:text-[42px] ${isVisible ? "animate-fade-up" : "opacity-0"}`}
          style={{
            animationDelay: "0.2s",
            background: "linear-gradient(180deg, hsl(60 10% 98%) 0%, hsl(220 5% 56%) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Dari Foto Produk ke Konten UGC
        </h2>
        <p
          className={`mt-3 text-center font-body text-base text-muted-foreground sm:text-lg ${isVisible ? "animate-fade-up" : "opacity-0"}`}
          style={{ animationDelay: "0.25s" }}
        >
          3 langkah — semua powered by AI
        </p>

        {/* Desktop: 3-column grid */}
        <div className="mt-12 hidden md:grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div
              key={step.num}
              className={`${isVisible ? "animate-fade-up" : "opacity-0"}`}
              style={{ animationDelay: `${0.35 + i * 0.12}s` }}
            >
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-primary/60">
                {step.num}
              </span>
              <div className="mt-3">{step.visual}</div>
              <h3 className="mt-4 font-satoshi text-base font-bold text-foreground">{step.title}</h3>
              <p className="mt-1.5 text-[13px] text-muted-foreground leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>

        {/* Mobile: Vertical timeline */}
        <div className="mt-10 md:hidden space-y-8">
          {steps.map((step, i) => (
            <div
              key={step.num}
              className={`flex gap-4 ${isVisible ? "animate-fade-up" : "opacity-0"}`}
              style={{ animationDelay: `${0.3 + i * 0.12}s` }}
            >
              <div className="flex flex-col items-center shrink-0">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-primary/15 text-primary border border-primary/30">
                  <step.icon size={18} />
                </div>
                {i < 2 && <div className="w-px flex-1 mt-2 bg-primary/20" />}
              </div>
              <div className="flex-1 pb-2">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-primary/50">
                  {step.num}
                </span>
                <h3 className="mt-1 font-satoshi text-base font-bold text-foreground">{step.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{step.desc}</p>
                <div className="mt-3">{step.visual}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CaraKerjaSection;
