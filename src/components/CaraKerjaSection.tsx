import { useScrollReveal } from "@/hooks/use-scroll-reveal";

const steps = [
  { num: "01", title: "Beli Akses", desc: "Lakukan pembayaran satu kali Rp 249.000 untuk akses lifetime ke dashboard GENBOX." },
  { num: "02", title: "Login ke Dashboard", desc: "Masuk ke dashboard dengan akun yang sudah terdaftar setelah pembayaran dikonfirmasi." },
  { num: "03", title: "Setup API Key", desc: "Masukkan API key Kie AI dan Gemini kamu. Kontrol penuh biaya ada di tanganmu." },
  { num: "04", title: "Generate Konten", desc: "Pilih karakter, masukkan produk, dan generate foto UGC realistis dalam hitungan detik." },
];

const CaraKerjaSection = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section id="cara-kerja" ref={ref} className="py-24 relative">
      <div className="container mx-auto px-6">
        <div className={`text-center mb-16 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <span className="inline-block mb-4 px-4 py-1.5 rounded-full border border-primary/30 text-xs font-heading tracking-wider text-primary">
            CARA KERJA
          </span>
          <h2 className="font-heading text-3xl md:text-4xl text-foreground">
            4 Langkah Mudah
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((s, i) => (
            <div
              key={s.num}
              className={`text-center transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              style={{ transitionDelay: isVisible ? `${i * 150}ms` : "0ms" }}
            >
              <div className="font-mono text-5xl md:text-6xl font-bold text-primary/30 mb-4">
                {s.num}
              </div>
              <h3 className="font-heading text-sm tracking-wider text-foreground mb-2">{s.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CaraKerjaSection;
