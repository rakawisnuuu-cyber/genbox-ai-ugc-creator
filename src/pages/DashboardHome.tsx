import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ImagePlus, Film, Users, TrendingUp, TrendingDown, Coins, ArrowRight, LayoutGrid, BarChart3, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useCountUp } from "@/components/GenerationLoading";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import GalleryContent from "@/components/GalleryContent";
import { useApiKeys } from "@/hooks/useApiKeys";
import ApiKeySetupModal from "@/components/ApiKeySetupModal";

const MODEL_COST: Record<string, number> = {
  "nano-banana-pro": 1440, nano: 960, seedream: 440, grok: 1600, veo3_fast: 6400, veo3: 32000,
};

function estimateCost(model: string): number {
  for (const [key, cost] of Object.entries(MODEL_COST)) {
    if (model.includes(key)) return cost;
  }
  return 960;
}

const MONTH_NAMES_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function formatDateId(d: Date) {
  return `${d.getDate()} ${MONTH_NAMES_ID[d.getMonth()]} ${d.getFullYear()}`;
}

interface DailyPoint { date: string; label: string; count: number; }

function AnimatedStat({ value }: { value: string | number }) {
  const isNum = typeof value === "number";
  const animated = useCountUp(isNum ? value : 0, 800, isNum);
  return <p className="font-mono text-2xl font-bold text-primary">{isNum ? animated : value}</p>;
}

type DashboardTab = "overview" | "gallery";

const DashboardHome = () => {
  const { user } = useAuth();
  const { keys, isLoading: keysLoading } = useApiKeys();
  const [loading, setLoading] = useState(true);
  const [totalGen, setTotalGen] = useState(0);
  const [monthGen, setMonthGen] = useState(0);
  const [prevMonthGen, setPrevMonthGen] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [dailyData, setDailyData] = useState<DailyPoint[]>([]);
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [showApiSetup, setShowApiSetup] = useState(false);
  const [trialExpiresAt, setTrialExpiresAt] = useState<Date | null>(null);

  // Show API key setup modal if keys are missing
  useEffect(() => {
    if (keysLoading) return;
    const kieEmpty = !keys.kie_ai.key;
    const geminiEmpty = !keys.gemini.key;
    if (kieEmpty || geminiEmpty) {
      setShowApiSetup(true);
    }
  }, [keysLoading, keys]);

  const firstName = user?.email?.split("@")[0] || "User";
  const now = new Date();

  useEffect(() => {
    if (!user) return;
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

    const fetchAll = async () => {
      const [totalRes, monthRes, prevRes, modelsRes, dailyRes] = await Promise.all([
        supabase.from("generations").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("generations").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", startOfMonth),
        supabase.from("generations").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", startOfPrevMonth).lte("created_at", endOfPrevMonth),
        supabase.from("generations").select("model").eq("user_id", user.id),
        supabase.from("generations").select("created_at").eq("user_id", user.id).gte("created_at", thirtyDaysAgo),
      ]);

      setTotalGen(totalRes.count ?? 0);
      setMonthGen(monthRes.count ?? 0);
      setPrevMonthGen(prevRes.count ?? 0);

      if (modelsRes.data) {
        setTotalCost(modelsRes.data.reduce((sum, r) => sum + estimateCost(r.model), 0));
      }

      const counts: Record<string, number> = {};
      if (dailyRes.data) {
        for (const r of dailyRes.data) {
          const d = r.created_at.slice(0, 10);
          counts[d] = (counts[d] || 0) + 1;
        }
      }
      const points: DailyPoint[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000);
        const key = d.toISOString().slice(0, 10);
        const day = d.getDate();
        const mon = MONTH_NAMES_ID[d.getMonth()].slice(0, 3);
        points.push({ date: key, label: `${day} ${mon}`, count: counts[key] || 0 });
      }
      setDailyData(points);
      setLoading(false);
    };

    fetchAll();
  }, [user]);

  const monthDiff = monthGen - prevMonthGen;
  const currentMonthLabel = `${MONTH_NAMES_ID[now.getMonth()]} ${now.getFullYear()}`;

  const stats = [
    { label: "Total Generasi", value: totalGen, sub: "gambar & video", icon: ImagePlus },
    { label: "Bulan Ini", value: monthGen, sub: currentMonthLabel, icon: monthDiff >= 0 ? TrendingUp : TrendingDown, diff: monthDiff },
    { label: "Kredit Terpakai", value: `Rp ${totalCost.toLocaleString("id-ID")}`, sub: "estimasi dari API key kamu", icon: Coins },
  ];

  const actions = [
    { icon: ImagePlus, title: "Buat Gambar UGC", desc: "Generate gambar produk dengan AI", to: "/generate" },
    { icon: Film, title: "Buat Video", desc: "Generate video UGC untuk TikTok", to: "/video" },
    { icon: Users, title: "Buat Karakter", desc: "Buat karakter AI untuk konten", to: "/characters/create" },
  ];

  const tabs: { key: DashboardTab; label: string; icon: typeof BarChart3 }[] = [
    { key: "overview", label: "Overview", icon: BarChart3 },
    { key: "gallery", label: "Gallery", icon: LayoutGrid },
  ];

  return (
    <div className="space-y-6">
      {/* API Key Setup Modal */}
      <ApiKeySetupModal open={showApiSetup} onClose={() => setShowApiSetup(false)} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-up">
        <div>
          <h1 className="font-satoshi text-2xl font-bold text-foreground">
            Selamat datang, {firstName}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{formatDateId(now)}</p>
        </div>
        <Link
          to="/generate"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold tracking-wider text-primary-foreground transition-all hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-6px_hsl(var(--primary)/0.4)]"
        >
          <ImagePlus size={14} /> Buat Gambar
        </Link>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-lg w-fit animate-fade-up" style={{ animationDelay: "50ms" }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-[12px] font-medium transition-all duration-200 ${
              activeTab === t.key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6 animate-fade-up">
          {/* Stats */}
          <div className="grid gap-3 sm:grid-cols-3">
            {stats.map((s, i) => (
              <div key={s.label} className="rounded-2xl border border-border/60 bg-card/80 p-5 animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/50">{s.label}</p>
                  <div className="rounded-xl bg-primary/[0.08] p-2">
                    <s.icon className="h-4 w-4 text-primary" />
                  </div>
                </div>
                {loading ? <Skeleton className="h-8 w-20" /> : <AnimatedStat value={s.value} />}
                <p className="mt-1.5 text-[11px] text-muted-foreground/60">
                  {s.sub}
                  {s.diff !== undefined && !loading && (
                    <span className={s.diff >= 0 ? "ml-2 text-primary" : "ml-2 text-destructive"}>
                      {s.diff >= 0 ? `+${s.diff}` : s.diff}
                    </span>
                  )}
                </p>
              </div>
            ))}
          </div>

          {/* Activity */}
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/50">
              Aktivitas 30 Hari
            </p>
            <div className="rounded-2xl border border-border/60 bg-card/80 p-5">
              {loading ? (
                <Skeleton className="h-[180px] w-full" />
              ) : dailyData.every((d) => d.count === 0) ? (
                <div className="flex h-[180px] items-center justify-center text-sm text-muted-foreground/50">
                  Belum ada aktivitas. Mulai generate untuk melihat statistik.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={dailyData}>
                    <defs>
                      <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} interval={4} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                      formatter={(v: number) => [`${v} generasi`, ""]}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                    />
                    <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={1.5} fill="url(#areaFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/50">Mulai</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {actions.map((a) => (
                <Link key={a.title} to={a.to} className="group rounded-2xl border border-border/60 bg-card/80 p-5 card-hover">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/[0.08]">
                    <a.icon size={18} className="text-primary" />
                  </div>
                  <h3 className="font-satoshi text-sm font-bold text-foreground">{a.title}</h3>
                  <p className="mt-1 text-[12px] text-muted-foreground/70">{a.desc}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    Mulai <ArrowRight size={11} />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Gallery Tab */}
      {activeTab === "gallery" && (
        <div className="animate-fade-up">
          <GalleryContent />
        </div>
      )}
    </div>
  );
};

export default DashboardHome;
