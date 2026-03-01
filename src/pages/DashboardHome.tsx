import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Zap, Film, Images, ImagePlus, UserCircle, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles } from "lucide-react";

interface Credits {
  image_credits: number;
  video_credits: number;
}

interface Generation {
  id: string;
  image_url: string | null;
  created_at: string;
}

const DashboardHome = () => {
  const { user } = useAuth();
  const [credits, setCredits] = useState<Credits>({ image_credits: 0, video_credits: 0 });
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [totalGenerations, setTotalGenerations] = useState(0);
  const [loading, setLoading] = useState(true);

  const firstName = user?.email?.split("@")[0] || "User";

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const [creditsRes, gensRes, countRes] = await Promise.all([
        supabase.from("user_credits").select("image_credits, video_credits").eq("user_id", user.id).maybeSingle(),
        supabase.from("generations").select("id, image_url, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(4),
        supabase.from("generations").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      ]);

      if (creditsRes.data) setCredits(creditsRes.data);
      if (gensRes.data) setGenerations(gensRes.data);
      if (countRes.count !== null) setTotalGenerations(countRes.count);
      setLoading(false);
    };

    fetchData();
  }, [user]);

  const stats = [
    { icon: Zap, value: credits.image_credits, label: "Kredit Gambar" },
    { icon: Film, value: credits.video_credits, label: "Kredit Video" },
    { icon: Images, value: totalGenerations, label: "Total Generasi" },
  ];

  const actions = [
    {
      icon: ImagePlus,
      iconClass: "text-primary",
      title: "Buat Gambar UGC",
      desc: "Generate gambar realistis dari foto produk kamu",
      cta: "GENERATE",
      to: "/generate",
      disabled: false,
    },
    {
      icon: Film,
      iconClass: "text-muted-foreground",
      title: "Buat Video UGC",
      desc: "Ubah gambar jadi video 5-15 detik",
      cta: "SEGERA HADIR",
      to: "#",
      disabled: true,
    },
    {
      icon: UserCircle,
      iconClass: "text-primary",
      title: "Buat Karakter",
      desc: "Buat avatar realistis untuk konten jangka panjang",
      cta: "BUAT KARAKTER",
      to: "/characters",
      disabled: false,
      outline: true,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Section 1 — Welcome */}
      <div className="animate-fade-up">
        <div className="flex items-center gap-3">
          <h1 className="font-satoshi text-2xl font-bold text-foreground">
            Selamat datang, {firstName}!
          </h1>
          <svg
            className="animate-float h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z"
              fill="hsl(73, 100%, 50%)"
            />
          </svg>
        </div>
        <div className="mt-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles size={12} />
            BYOK LIFETIME
          </span>
        </div>
      </div>

      {/* Section 2 — Stats */}
      <div className="animate-fade-up" style={{ animationDelay: "100ms" }}>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="relative min-w-[160px] flex-1 snap-start rounded-xl border border-border bg-secondary p-5"
            >
              <stat.icon className="absolute right-4 top-4 h-5 w-5 text-muted-foreground/40" />
              <p className="text-3xl font-bold text-primary">{loading ? "—" : stat.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3 — Quick Actions */}
      <div className="animate-fade-up" style={{ animationDelay: "200ms" }}>
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          MULAI BUAT KONTEN
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {actions.map((action) => (
            <div
              key={action.title}
              className={`rounded-xl border border-border bg-secondary p-6 transition-all ${
                action.disabled
                  ? "cursor-not-allowed opacity-50"
                  : "hover:border-primary/30 hover:scale-[1.01]"
              }`}
            >
              <action.icon className={`h-8 w-8 ${action.iconClass}`} />
              <h3 className="mt-4 font-satoshi text-base font-bold text-foreground">
                {action.title}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">{action.desc}</p>
              {action.disabled ? (
                <span className="mt-4 inline-block rounded-lg bg-muted px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {action.cta}
                </span>
              ) : action.outline ? (
                <Link
                  to={action.to}
                  className="mt-4 inline-flex items-center gap-1 rounded-lg border border-primary px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  {action.cta} <ArrowRight size={14} />
                </Link>
              ) : (
                <Link
                  to={action.to}
                  className="mt-4 inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  {action.cta} <ArrowRight size={14} />
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Section 4 — Recent Generations */}
      <div className="animate-fade-up" style={{ animationDelay: "300ms" }}>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            GENERASI TERAKHIR
          </p>
          <Link
            to="/gallery"
            className="flex items-center gap-1 text-xs text-primary transition-colors hover:text-primary/80"
          >
            Lihat Semua <ArrowRight size={12} />
          </Link>
        </div>

        {!loading && generations.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-12 text-center">
            <Images className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Belum ada generasi</p>
            <Link
              to="/generate"
              className="mt-4 inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/90"
            >
              BUAT GAMBAR PERTAMA <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {generations.map((gen) => (
              <div
                key={gen.id}
                className="aspect-square overflow-hidden rounded-xl border border-border bg-secondary transition-transform hover:scale-[1.03]"
              >
                {gen.image_url ? (
                  <img
                    src={gen.image_url}
                    alt="Generated"
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Images className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardHome;
