import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUpscale } from "@/hooks/useUpscale";
import { Download, Images, Loader2, ArrowUpFromLine } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import UpscaleButton from "@/components/UpscaleButton";

type Tab = "semua" | "gambar" | "video" | "karakter";

interface Generation {
  id: string;
  type: string;
  image_url: string | null;
  upscaled_url: string | null;
  upscale_factor: number | null;
  prompt: string | null;
  model: string;
  provider: string;
  status: string;
  created_at: string;
  character_id: string | null;
}

const TABS: { key: Tab; label: string }[] = [
  { key: "semua", label: "SEMUA" },
  { key: "gambar", label: "GAMBAR" },
  { key: "video", label: "VIDEO" },
  { key: "karakter", label: "KARAKTER" },
];

const GalleryPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { upscale, getState } = useUpscale();
  const [tab, setTab] = useState<Tab>("semua");
  const [items, setItems] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailItem, setDetailItem] = useState<Generation | null>(null);

  const fetchItems = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    let query = supabase
      .from("generations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (tab === "gambar") query = query.in("type", ["image", "ugc_image"]);
    else if (tab === "video") query = query.eq("type", "video");

    const { data } = await query;
    setItems((data as Generation[]) || []);
    setLoading(false);
  }, [user, tab]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleUpscale = async (gen: Generation, factor: 2 | 4) => {
    if (!gen.image_url) return;
    const url = await upscale(gen.id, gen.image_url, factor);
    if (url) {
      await supabase.from("generations").update({ upscaled_url: url, upscale_factor: factor } as any).eq("id", gen.id);
      setItems((prev) => prev.map((i) => i.id === gen.id ? { ...i, upscaled_url: url, upscale_factor: factor } : i));
      if (detailItem?.id === gen.id) setDetailItem({ ...gen, upscaled_url: url, upscale_factor: factor });
    }
  };

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="text-2xl font-bold uppercase tracking-wider font-satoshi text-foreground">Gallery</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-border animate-fade-up" style={{ animationDelay: "50ms" }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`pb-2.5 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${tab === t.key ? "text-foreground border-primary" : "text-[#666] border-transparent hover:text-[#999]"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square bg-[hsl(0_0%_8%)] border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && items.length === 0 && (
        <div className="border-2 border-dashed border-border rounded-xl p-12 flex flex-col items-center text-center animate-fade-up">
          <Images className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="font-semibold text-foreground mb-1">Gallery masih kosong</p>
          <p className="text-sm text-muted-foreground mb-6">Mulai generate untuk mengisi gallery kamu!</p>
          <Button onClick={() => navigate("/generate")} className="font-bold uppercase tracking-wider">
            Buat Gambar Pertama
          </Button>
        </div>
      )}

      {/* Grid */}
      {!loading && items.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 animate-fade-up" style={{ animationDelay: "100ms" }}>
          {items.map((item) => (
            <div key={item.id} className="group relative bg-[hsl(0_0%_8%)] border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-colors">
              <div className="aspect-square relative">
                {item.image_url ? (
                  <img src={item.upscaled_url || item.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Images className="h-8 w-8 text-muted-foreground/20" />
                  </div>
                )}
                {item.upscale_factor && (
                  <span className="absolute top-2 left-2 bg-primary/20 text-primary text-[9px] rounded-full px-1.5 py-0.5 font-medium">{item.upscale_factor}x</span>
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  {item.image_url && (
                    <a href={item.upscaled_url || item.image_url} download target="_blank" rel="noopener noreferrer"
                      className="h-10 w-10 rounded-full bg-foreground/20 flex items-center justify-center text-foreground hover:bg-foreground/30 transition-colors">
                      <Download className="h-4 w-4" />
                    </a>
                  )}
                  <button onClick={() => setDetailItem(item)}
                    className="bg-foreground/20 text-foreground text-[11px] px-3 py-1.5 rounded-full hover:bg-foreground/30 transition-colors">
                    Lihat Detail
                  </button>
                </div>
              </div>
              <div className="p-2.5 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-blue-500/20 text-blue-400 rounded-full text-[10px] font-semibold px-2 py-0.5 uppercase">
                    {item.type === "ugc_image" ? "IMAGE" : item.type.toUpperCase()}
                  </span>
                  {item.model && <span className="text-[10px] text-muted-foreground">{item.model}</span>}
                </div>
                <p className="text-[11px] text-muted-foreground">{format(new Date(item.created_at), "dd MMM yyyy")}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {detailItem && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setDetailItem(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-card border border-border rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 space-y-4 animate-fade-in">
            {detailItem.image_url && (
              <img src={detailItem.upscaled_url || detailItem.image_url} alt="" className="w-full rounded-lg" />
            )}
            <div className="flex items-center gap-2 flex-wrap">
              {detailItem.image_url && (
                <>
                  <a href={detailItem.upscaled_url || detailItem.image_url} download target="_blank" rel="noopener noreferrer"
                    className="bg-primary text-primary-foreground text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/90">
                    <Download className="h-3.5 w-3.5" /> Download
                  </a>
                  <UpscaleButton
                    imageUrl={detailItem.image_url}
                    imageKey={detailItem.id}
                    loading={getState(detailItem.id).loading}
                    currentFactor={detailItem.upscale_factor || getState(detailItem.id).factor}
                    onUpscale={(_, url, f) => handleUpscale(detailItem, f)}
                  />
                </>
              )}
            </div>
            {detailItem.prompt && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Prompt</p>
                <p className="text-sm text-foreground">{detailItem.prompt}</p>
              </div>
            )}
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>{detailItem.model}</span>
              <span>{format(new Date(detailItem.created_at), "dd MMM yyyy HH:mm")}</span>
            </div>
            <button onClick={() => setDetailItem(null)} className="text-xs text-muted-foreground hover:text-foreground">Tutup</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryPage;
