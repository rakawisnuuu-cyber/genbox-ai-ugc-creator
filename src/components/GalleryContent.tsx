import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUpscale } from "@/hooks/useUpscale";
import { Download, Images, Play, Copy, Film, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import UpscaleButton from "@/components/UpscaleButton";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
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

type GalleryTab = "semua" | "gambar" | "video";

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

const GALLERY_TABS: { key: GalleryTab; label: string }[] = [
  { key: "semua", label: "SEMUA" },
  { key: "gambar", label: "GAMBAR" },
  { key: "video", label: "VIDEO" },
];

const handleDownload = async (url: string, filename?: string) => {
  const name = filename || url.split("/").pop()?.split("?")[0] || "download";
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
  } catch { /* CORS blocked */ }

  try {
    const blob = await new Promise<Blob>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", url, true);
      xhr.responseType = "blob";
      xhr.onload = () => xhr.status === 200 ? resolve(xhr.response) : reject();
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
  } catch { /* XHR failed */ }

  toast.info("Tidak bisa download otomatis. Klik kanan gambar → 'Save image as...'");
  window.open(url, "_blank");
};

const GalleryContent = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { upscale, getState } = useUpscale();
  const [tab, setTab] = useState<GalleryTab>("semua");
  const [items, setItems] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
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

  const fetchItems = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    let query = supabase
      .from("generations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (tab === "gambar") query = query.neq("type", "video");
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
    <div className="space-y-5">
      {/* Filter tabs */}
      <div className="flex gap-5">
        {GALLERY_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`pb-2 text-[11px] font-bold uppercase tracking-wider transition-colors border-b-2 ${
              tab === t.key ? "text-foreground border-primary" : "text-muted-foreground/50 border-transparent hover:text-muted-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square bg-muted border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && items.length === 0 && (
        <div className="border border-dashed border-border rounded-xl p-10 flex flex-col items-center text-center">
          {tab === "video" ? (
            <>
              <Film className="h-10 w-10 text-muted-foreground/20 mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">Belum ada video</p>
              <p className="text-[12px] text-muted-foreground/60 mb-5">Buat video pertamamu di halaman Buat Video</p>
              <Button onClick={() => navigate("/video")} size="sm" className="text-[11px] font-bold uppercase tracking-wider">
                Buat Video
              </Button>
            </>
          ) : (
            <>
              <Images className="h-10 w-10 text-muted-foreground/20 mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">Gallery masih kosong</p>
              <p className="text-[12px] text-muted-foreground/60 mb-5">Mulai generate untuk mengisi gallery kamu</p>
              <Button onClick={() => navigate("/generate")} size="sm" className="text-[11px] font-bold uppercase tracking-wider">
                Buat Gambar Pertama
              </Button>
            </>
          )}
        </div>
      )}

      {/* Grid */}
      {!loading && items.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((item) => {
            if (item.type === "video") {
              return (
                <div
                  key={item.id}
                  className="relative group cursor-pointer rounded-xl overflow-hidden bg-background aspect-square border border-border hover:border-primary/20 transition-colors"
                  onClick={() => setSelectedVideo(item)}
                >
                  <video
                    src={item.image_url || ""}
                    className="w-full h-full object-cover"
                    preload="metadata"
                    muted
                    playsInline
                    onLoadedData={(e) => { (e.target as HTMLVideoElement).currentTime = 0.1; }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-background/30 group-hover:bg-background/50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-foreground/90 flex items-center justify-center">
                      <Play className="w-4 h-4 text-background ml-0.5" fill="currentColor" />
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(item); }}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive/15 hover:bg-destructive/30 text-destructive rounded-lg p-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="absolute top-2 left-2">
                    <span className="text-[9px] font-bold bg-primary/90 text-primary-foreground px-1.5 py-0.5 rounded-full">VIDEO</span>
                  </div>
                  <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[9px] bg-background/80 text-foreground px-1.5 py-0.5 rounded-full">{item.model}</span>
                  </div>
                </div>
              );
            }

            return (
              <div key={item.id} className="group relative bg-card border border-border rounded-xl overflow-hidden hover:border-primary/20 transition-colors">
                <div className="aspect-square relative">
                  {item.image_url ? (
                    <img src={item.upscaled_url || item.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Images className="h-8 w-8 text-muted-foreground/15" />
                    </div>
                  )}
                  {item.upscale_factor && (
                    <span className="absolute top-2 left-2 bg-primary/15 text-primary text-[9px] rounded-full px-1.5 py-0.5 font-medium">{item.upscale_factor}x</span>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(item); }}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive/15 hover:bg-destructive/30 text-destructive rounded-lg p-1.5 z-10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2.5">
                    {item.image_url && (
                      <button onClick={(e) => { e.stopPropagation(); handleDownload(item.upscaled_url || item.image_url!, `genbox-${item.id}.png`); }}
                        className="h-9 w-9 rounded-full bg-foreground/15 flex items-center justify-center text-foreground hover:bg-foreground/25 transition-colors">
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button onClick={() => setDetailItem(item)}
                      className="bg-foreground/15 text-foreground text-[10px] px-3 py-1.5 rounded-full hover:bg-foreground/25 transition-colors">
                      Detail
                    </button>
                  </div>
                </div>
                <div className="p-2.5 space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="bg-primary/10 text-primary rounded-full text-[9px] font-semibold px-1.5 py-0.5 uppercase">
                      {item.type === "ugc_image" ? "IMAGE" : item.type.toUpperCase()}
                    </span>
                    {item.model && <span className="text-[9px] text-muted-foreground/50">{item.model}</span>}
                  </div>
                  <p className="text-[10px] text-muted-foreground/40">{format(new Date(item.created_at), "dd MMM yyyy")}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Image Detail modal */}
      {detailItem && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setDetailItem(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-card border border-border rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 space-y-4 animate-scale-in">
            {detailItem.image_url && (
              <img src={detailItem.upscaled_url || detailItem.image_url} alt="" className="w-full rounded-lg" />
            )}
            <div className="flex items-center gap-2 flex-wrap">
              {detailItem.image_url && (
                <>
                  <button onClick={() => handleDownload(detailItem.upscaled_url || detailItem.image_url!, `genbox-${detailItem.id}.png`)}
                    className="bg-primary text-primary-foreground text-[11px] font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/90">
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
                <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider mb-1">Prompt</p>
                <p className="text-[13px] text-foreground">{detailItem.prompt}</p>
              </div>
            )}
            <div className="flex gap-4 text-[11px] text-muted-foreground/50">
              <span>{detailItem.model}</span>
              <span>{format(new Date(detailItem.created_at), "dd MMM yyyy HH:mm")}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <button onClick={() => setDetailItem(null)} className="text-[11px] text-muted-foreground hover:text-foreground">Tutup</button>
              <button
                onClick={() => { setDeleteTarget(detailItem); }}
                className="text-[11px] text-destructive hover:text-destructive/80 flex items-center gap-1"
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
              <div className="relative aspect-[9/16] max-h-[70vh] bg-background mx-auto w-full">
                <video
                  src={selectedVideo.image_url || ""}
                  className="w-full h-full object-contain"
                  controls autoPlay loop playsInline
                />
              </div>
              <div className="p-4 bg-card space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] bg-primary/15 text-primary px-2 py-0.5 rounded-full font-medium">
                    {selectedVideo.model}
                  </span>
                  <span className="text-[10px] text-muted-foreground/50">
                    {new Date(selectedVideo.created_at).toLocaleDateString("id-ID", {
                      day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </span>
                </div>
                {selectedVideo.prompt && (
                  <p className="text-[12px] text-muted-foreground/70 line-clamp-3">{selectedVideo.prompt}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownload(selectedVideo.image_url || "", `genbox-video-${selectedVideo.id}.mp4`)}
                    className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-medium py-2.5 rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <Download className="w-4 h-4" /> Download
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
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteTarget && handleDelete(deleteTarget)}>
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GalleryContent;
