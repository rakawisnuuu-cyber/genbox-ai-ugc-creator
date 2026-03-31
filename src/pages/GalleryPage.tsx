import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUpscale } from "@/hooks/useUpscale";
import { Download, Images, Loader2, Play, Copy, Film, Trash2, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import UpscaleButton from "@/components/UpscaleButton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

const PAGE_SIZE = 24;

const handleDownload = async (url: string, filename?: string) => {
  const name = filename || url.split("/").pop()?.split("?")[0] || "download";

  // Try fetch + blob first (works for same-origin & CORS-enabled URLs)
  try {
    const res = await fetch(url, { mode: "cors" });
    if (res.ok) {
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      return;
    }
  } catch {
    // CORS blocked — fall through to proxy
  }

  // Fallback: use a CORS proxy via Supabase edge function or direct blob via XHR
  try {
    const blob = await new Promise<Blob>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", url, true);
      xhr.responseType = "blob";
      xhr.onload = () => (xhr.status === 200 ? resolve(xhr.response) : reject());
      xhr.onerror = () => reject();
      xhr.send();
    });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    return;
  } catch {
    // XHR also failed
  }

  // Last resort: open in new tab and let user right-click save
  toast.info("Tidak bisa download otomatis. Klik kanan gambar — 'Save image as...'");
  window.open(url, "_blank");
};

const GalleryPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { upscale, getState } = useUpscale();
  const [tab, setTab] = useState<Tab>("semua");
  const [items, setItems] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [detailItem, setDetailItem] = useState<Generation | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Generation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Generation | null>(null);

  const handleDelete = async (item: Generation) => {
    const { error } = await supabase.from("generations").delete().eq("id", item.id);
    if (error) {
      toast.error("Gagal menghapus: " + error.message);
    } else {
      toast.success("Item dihapus");
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      if (detailItem?.id === item.id) setDetailItem(null);
      if (selectedVideo?.id === item.id) setSelectedVideo(null);
    }
    setDeleteTarget(null);
  };

  const fetchItems = useCallback(
    async (loadMore = false) => {
      if (!user) return;
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setHasMore(true);
      }

      let query = supabase
        .from("generations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);

      if (tab === "gambar") query = query.neq("type", "video");
      else if (tab === "video") query = query.eq("type", "video");

      if (loadMore && items.length > 0) {
        const lastItem = items[items.length - 1];
        query = query.lt("created_at", lastItem.created_at);
      }

      const { data } = await query;
      const newItems = (data as Generation[]) || [];

      if (newItems.length < PAGE_SIZE) {
        setHasMore(false);
      }

      if (loadMore) {
        setItems((prev) => [...prev, ...newItems]);
        setLoadingMore(false);
      } else {
        setItems(newItems);
        setLoading(false);
      }
    },
    [user, tab, items],
  );

  useEffect(() => {
    fetchItems();
  }, [user, tab]);

  const handleUpscale = async (gen: Generation, factor: 2 | 4) => {
    if (!gen.image_url) return;
    const url = await upscale(gen.id, gen.image_url, factor);
    if (url) {
      await supabase
        .from("generations")
        .update({ upscaled_url: url, upscale_factor: factor } as any)
        .eq("id", gen.id);
      setItems((prev) => prev.map((i) => (i.id === gen.id ? { ...i, upscaled_url: url, upscale_factor: factor } : i)));
      if (detailItem?.id === gen.id) setDetailItem({ ...gen, upscaled_url: url, upscale_factor: factor });
    }
  };

  // Filter out videos from image lightbox navigation
  const imageItems = items.filter((i) => i.type !== "video");

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
            className={`pb-2.5 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${tab === t.key ? "text-foreground border-primary" : "text-muted-foreground border-transparent hover:text-foreground/70"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square bg-muted border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && items.length === 0 && (
        <div className="border-2 border-dashed border-border rounded-xl p-12 flex flex-col items-center text-center animate-fade-up">
          {tab === "video" ? (
            <>
              <Film className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="font-semibold text-foreground mb-1">Belum ada video</p>
              <p className="text-sm text-muted-foreground mb-6">Buat video pertamamu di halaman Buat Video</p>
              <Button onClick={() => navigate("/video")} className="font-bold uppercase tracking-wider gap-2">
                Buat Video <ArrowRight className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Images className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="font-semibold text-foreground mb-1">Gallery masih kosong</p>
              <p className="text-sm text-muted-foreground mb-6">Mulai generate untuk mengisi gallery kamu!</p>
              <Button onClick={() => navigate("/generate")} className="font-bold uppercase tracking-wider">
                Buat Gambar Pertama
              </Button>
            </>
          )}
        </div>
      )}

      {/* Grid */}
      {!loading && items.length > 0 && (
        <>
          <div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 animate-fade-up"
            style={{ animationDelay: "100ms" }}
          >
            {items.map((item) => {
              if (item.type === "video") {
                return (
                  <div
                    key={item.id}
                    className="relative group cursor-pointer rounded-xl overflow-hidden bg-background aspect-square border border-border hover:border-primary/30 transition-colors"
                    onClick={() => setSelectedVideo(item)}
                  >
                    <video
                      src={item.image_url || ""}
                      className="w-full h-full object-cover"
                      preload="none"
                      muted
                      playsInline
                    />
                    {/* Play overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors">
                      <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                        <Play className="w-5 h-5 text-black ml-0.5" fill="black" />
                      </div>
                    </div>
                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(item);
                      }}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive/20 hover:bg-destructive/40 text-destructive rounded-lg p-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    {/* VIDEO badge */}
                    <div className="absolute top-2 left-2">
                      <span className="text-[10px] font-bold bg-primary/90 text-primary-foreground px-2 py-0.5 rounded-full">
                        VIDEO
                      </span>
                    </div>
                    {/* Model on hover */}
                    <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] bg-black/70 text-white px-2 py-0.5 rounded-full">{item.model}</span>
                    </div>
                  </div>
                );
              }

              // Image card (existing)
              return (
                <div
                  key={item.id}
                  className="group relative bg-muted/30 border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-colors"
                >
                  <div className="aspect-square relative">
                    {item.image_url ? (
                      <img
                        src={item.upscaled_url || item.image_url}
                        alt=""
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Images className="h-8 w-8 text-muted-foreground/20" />
                      </div>
                    )}
                    {item.upscale_factor && (
                      <span className="absolute top-2 left-2 bg-primary/20 text-primary text-[9px] rounded-full px-1.5 py-0.5 font-medium">
                        {item.upscale_factor}x
                      </span>
                    )}
                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(item);
                      }}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive/20 hover:bg-destructive/40 text-destructive rounded-lg p-1.5 z-10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      {item.image_url && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(item.upscaled_url || item.image_url!, `genbox-${item.id}.png`);
                          }}
                          className="h-10 w-10 rounded-full bg-foreground/20 flex items-center justify-center text-foreground hover:bg-foreground/30 transition-colors"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => setDetailItem(item)}
                        className="bg-foreground/20 text-foreground text-[11px] px-3 py-1.5 rounded-full hover:bg-foreground/30 transition-colors"
                      >
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
                    <p className="text-[11px] text-muted-foreground">
                      {format(new Date(item.created_at), "dd MMM yyyy")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={() => fetchItems(true)}
                disabled={loadingMore}
                className="text-xs font-bold uppercase tracking-wider gap-2"
              >
                {loadingMore ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                {loadingMore ? "Memuat..." : "Muat Lebih Banyak"}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Image Detail modal */}
      {detailItem && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setDetailItem(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-card border border-border rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 space-y-4 animate-fade-in"
          >
            {detailItem.image_url && (
              <img src={detailItem.upscaled_url || detailItem.image_url} alt="" className="w-full rounded-lg" />
            )}
            <div className="flex items-center gap-2 flex-wrap">
              {detailItem.image_url && (
                <>
                  <button
                    onClick={() =>
                      handleDownload(detailItem.upscaled_url || detailItem.image_url!, `genbox-${detailItem.id}.png`)
                    }
                    className="bg-primary text-primary-foreground text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/90"
                  >
                    <Download className="h-3.5 w-3.5" /> Download
                  </button>
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
            <div className="flex items-center justify-between">
              <button
                onClick={() => setDetailItem(null)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  setDeleteTarget(detailItem);
                }}
                className="text-xs text-destructive hover:text-destructive/80 flex items-center gap-1"
              >
                <Trash2 className="h-3 w-3" /> Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Player Modal */}
      <Dialog open={selectedVideo !== null} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-2xl bg-background border-border p-0 overflow-hidden">
          {selectedVideo && (
            <div className="flex flex-col">
              <div className="relative aspect-[9/16] max-h-[70vh] bg-black mx-auto w-full">
                <video
                  src={selectedVideo.image_url || ""}
                  className="w-full h-full object-contain"
                  controls
                  autoPlay
                  loop
                  playsInline
                />
              </div>
              <div className="p-4 bg-card space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full font-medium">
                    {selectedVideo.model}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(selectedVideo.created_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                {selectedVideo.prompt && (
                  <p className="text-sm text-muted-foreground line-clamp-3">{selectedVideo.prompt}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      handleDownload(selectedVideo.image_url || "", `genbox-video-${selectedVideo.id}.mp4`)
                    }
                    className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground font-medium py-2.5 rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  <button
                    onClick={() => {
                      if (selectedVideo.image_url) {
                        navigator.clipboard.writeText(selectedVideo.image_url);
                        toast.success("Link video di-copy!");
                      }
                    }}
                    className="flex items-center justify-center gap-2 bg-muted text-foreground px-4 py-2.5 rounded-lg hover:bg-muted/80 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus item ini?</AlertDialogTitle>
            <AlertDialogDescription>Item yang dihapus tidak bisa dikembalikan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GalleryPage;
