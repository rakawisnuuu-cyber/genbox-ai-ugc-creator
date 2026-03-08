import { useState, useEffect } from "react";
import { Upload, ImagePlus, Download, Sparkles } from "lucide-react";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

function useCountUp(target: number, visible: boolean, duration = 800) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!visible) return;
    const startTime = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, visible, duration]);
  return val;
}

const StepUploadVisual = () => (
  <div className="w-full rounded-2xl border border-border/60 bg-card/80 p-5">
    <div className="flex h-28 flex-col items-center justify-center rounded-lg border-2 border-dashed border-border/60">
      <div className="animate-float">
        <Upload size={24} className="text-muted-foreground" />
      </div>
      <span className="mt-2 text-[11px] text-muted-foreground">Drag & drop</span>
    </div>
    <div className="mt-3 flex justify-center gap-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex h-8 w-8 items-center justify-center rounded bg-secondary">
          <ImagePlus size={14} className="text-muted-foreground" />
        </div>
      ))}
    </div>
  </div>
);

const StepCharacterVisual = () => {
  const gradients = [
    "from-emerald-500 to-teal-400",
    "from-violet-500 to-purple-400",
    "from-rose-500 to-pink-400",
    "from-blue-500 to-cyan-400",
    "from-amber-500 to-yellow-400",
    "from-fuchsia-500 to-pink-400",
  ];
  return (
    <div className="w-full rounded-2xl border border-border/60 bg-card/80 p-5">
      <div className="grid grid-cols-3 gap-3">
        {gradients.map((g, i) => (
          <div
            key={i}
            className={`mx-auto h-10 w-10 rounded-full bg-gradient-to-br ${g} ${i === 1 ? "ring-2 ring-primary ring-offset-2 ring-offset-card animate-pulse-subtle" : ""}`}
          />
        ))}
      </div>
    </div>
  );
};

const StepGenerateVisual = () => (
  <div className="w-full rounded-2xl border border-border/60 bg-card/80 p-5">
    <div className="flex h-28 flex-col items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5">
      <Sparkles size={28} className="text-primary animate-pulse-subtle" />
    </div>
    <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2 text-xs font-bold tracking-wider text-primary-foreground">
      <Download size={14} />
      Download
    </button>
  </div>
);

const steps = [
  { num: 1, title: "Upload Foto Produk", desc: "Tinggal drag & drop foto produk kamu. AI otomatis deteksi jenis produknya.", visual: <StepUploadVisual /> },
  { num: 2, title: "Pilih Karakter & Scene", desc: "Pilih karakter dan pose yang sesuai sama target market kamu.", visual: <StepCharacterVisual /> },
  { num: 3, title: "Generate & Download", desc: "Klik generate, tunggu 20 detik, langsung download. Gampang banget!", visual: <StepGenerateVisual /> },
];

const CaraKerjaSection = () => {
  const { ref, isVisible } = useScrollReveal(0.15);

  const num1 = useCountUp(1, isVisible);
  const num2 = useCountUp(2, isVisible);
  const num3 = useCountUp(3, isVisible);
  const countNums = [num1, num2, num3];

  return (
    <section
      id="cara-kerja"
      ref={ref}
      className="relative z-10 px-4 py-16 sm:py-24"
    >
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
          3 Langkah Mudah
        </h2>
        <p
          className={`mt-3 text-center font-body text-base text-muted-foreground sm:text-lg ${isVisible ? "animate-fade-up" : "opacity-0"}`}
          style={{ animationDelay: "0.25s" }}
        >
          Dari foto produk ke konten UGC dalam hitungan detik
        </p>

        {/* Steps */}
        <div className="relative mt-14">
          <div className="grid gap-8 md:grid-cols-3 md:gap-10 lg:gap-14">
            {steps.map((step, i) => (
              <div
                key={step.num}
                className={`relative flex flex-col items-center text-center ${isVisible ? "animate-fade-up" : "opacity-0"}`}
                style={{ animationDelay: `${0.3 + i * 0.15}s` }}
              >
                {/* Step number */}
                <span className="font-mono text-[36px] font-bold leading-none text-primary">
                  {String(countNums[i]).padStart(2, "0")}
                </span>

                {/* Visual — full width */}
                <div className="mt-5 w-full">{step.visual}</div>

                {/* Text */}
                <h3 className="mt-5 font-satoshi text-lg font-bold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 max-w-[280px] font-body text-sm text-muted-foreground">
                  {step.desc}
                </p>

                {/* Arrow connector (mobile only) */}
                {i < steps.length - 1 && (
                  <div className="mt-6 md:hidden">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary/30 mx-auto">
                      <path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop connecting arrows */}
          <div className="pointer-events-none absolute top-[18px] left-0 right-0 hidden md:flex justify-center">
            <div className="flex w-full max-w-3xl justify-around px-[15%]">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className={`text-primary/25 ${isVisible ? "animate-fade-slide-right" : "opacity-0"}`}
                  style={{ animationDelay: `${0.6 + i * 0.2}s` }}
                >
                  <svg width="32" height="16" viewBox="0 0 32 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M0 8h28"/>
                    <path d="M24 3l5 5-5 5"/>
                  </svg>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CaraKerjaSection;
