import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ImagePlus, Film, Users, TrendingUp, TrendingDown, Coins, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";

const MODEL_COST: Record<string, number> = {
  nano: 320,
  seedream: 280,
  "nano-banana-2-pro": 640,
  grok: 1600,
  veo3_fast: 4800,
  veo3: 19200,
};

function estimateCost(model: string): number {
  for (const [key, cost] of Object.entries(MODEL_COST)) {
    if (model.includes(key)) return cost;
  }
  return 320;
}

const MONTH_NAMES_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function formatDateId(d: Date) {
  const day = d.getDate();
  const month = MONTH_NAMES_ID[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

interface DailyPoint {
  date: string;
  label: string;
  count: number;
}

const DashboardHome = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [totalGen, setTotalGen] = useState(0);
  const [monthGen, setMonthGen] = useState(0);
  const [prevMonthGen, setPrevMonthGen] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [dailyData, setDailyData] = useState<DailyPoint[]>([]);

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

      // Build daily chart data
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
    {
      label: "Total Generasi",
      value: totalGen,
      sub: "gambar & video",
      icon: ImagePlus,
    },
    {
      label: "Bulan Ini",
      value: monthGen,
      sub: currentMonthLabel,
      icon: monthDiff >= 0 ? TrendingUp : TrendingDown,
      diff: monthDiff,
    },
    {
      label: "Kredit Terpakai",
      value: `Rp ${totalCost.toLocaleString("id-ID")}`,
      sub: "estimasi dari API key kamu",
      icon: Coins,
    },
  ];

  const actions = [
    { icon: ImagePlus, title: "Buat Gambar UGC", desc: "Generate gambar produk dengan AI", to: "/generate" },
    { icon: Film, title: "Buat Video", desc: "Generate video UGC untuk TikTok", to: "/video" },
    { icon: Users, title: "Buat Karakter", desc: "Buat karakter AI untuk konten", to: "/characters/create" },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-satoshi text-2xl font-bold text-foreground">
            Selamat datang, {firstName}!
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{formatDateId(now)}</p>
        </div>
        <Link
          to="/generate"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <ImagePlus size={16} /> Buat Gambar
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="relative rounded-xl border border-border bg-card p-5">
            <s.icon className="absolute right-4 top-4 h-5 w-5 text-muted-foreground/40" />
            {loading ? (
              <Skeleton className="h-9 w-24" />
            ) : (
              <p className="font-mono text-3xl font-bold text-primary">{s.value}</p>
            )}
            <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            <p className="text-xs text-muted-foreground/60">
              {s.sub}
              {s.diff !== undefined && !loading && (
                <span className={s.diff >= 0 ? "ml-2 text-green-500" : "ml-2 text-red-500"}>
                  {s.diff >= 0 ? `+${s.diff}` : s.diff}
                </span>
              )}
            </p>
          </div>
        ))}
      </div>

      {/* Activity chart */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          AKTIVITAS
        </p>
        <div className="rounded-xl border border-border bg-card p-5">
          {loading ? (
            <Skeleton className="h-[200px] w-full" />
          ) : dailyData.every((d) => d.count === 0) ? (
            <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
              Belum ada aktivitas. Mulai generate untuk melihat statistik.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  interval={4}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => [`${v} generasi`, ""]}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#areaFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          MULAI
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {actions.map((a) => (
            <Link
              key={a.title}
              to={a.to}
              className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/30"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <a.icon size={20} className="text-primary" />
              </div>
              <h3 className="font-satoshi text-base font-bold text-foreground">{a.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{a.desc}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                Mulai <ArrowRight size={12} />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
