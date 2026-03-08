import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Images } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import CharacterCard, { type CharacterData } from "@/components/CharacterCard";
import CharacterDetailModal from "@/components/CharacterDetailModal";

const PRESETS: CharacterData[] = [
  { id: "p1", name: "Hijab Casual", type: "Wanita", age_range: "20-25", style: "Modern", description: "Wanita muda dengan hijab modern pastel, ekspresi hangat dan ramah. Cocok untuk skincare, fashion modest, dan lifestyle.", gradient_from: "from-emerald-900/40", gradient_to: "to-teal-900/40", is_preset: true },
  { id: "p2", name: "Urban Trendy", type: "Pria", age_range: "22-28", style: "Streetwear", description: "Pria muda urban dengan gaya streetwear, percaya diri dan modern.", gradient_from: "from-blue-900/40", gradient_to: "to-indigo-900/40", is_preset: true },
  { id: "p3", name: "Ibu Muda", type: "Wanita", age_range: "25-35", style: "Friendly", description: "Ibu muda yang relatable dan ramah. Cocok untuk produk rumah tangga.", gradient_from: "from-rose-900/40", gradient_to: "to-pink-900/40", is_preset: true },
  { id: "p4", name: "Mahasiswa", type: "Pria/Wanita", age_range: "18-22", style: "Energik", description: "Mahasiswa energik dan ceria. Cocok untuk edukasi, gadget, snack.", gradient_from: "from-amber-900/40", gradient_to: "to-orange-900/40", is_preset: true },
  { id: "p5", name: "Beauty Enthusiast", type: "Wanita", age_range: "20-30", style: "Glowing", description: "Pecinta kecantikan dengan kulit glowing. Cocok untuk skincare, makeup.", gradient_from: "from-fuchsia-900/40", gradient_to: "to-purple-900/40", is_preset: true },
  { id: "p6", name: "Bapak UMKM", type: "Pria", age_range: "35-50", style: "Profesional", description: "Bapak pengusaha yang terpercaya dan profesional.", gradient_from: "from-slate-800/40", gradient_to: "to-zinc-800/40", is_preset: true },
  { id: "p7", name: "Gen-Z Creator", type: "Pria/Wanita", age_range: "17-22", style: "Trendy", description: "Content creator Gen-Z yang trendy dan ekspresif.", gradient_from: "from-cyan-900/40", gradient_to: "to-sky-900/40", is_preset: true },
  { id: "p8", name: "Office Worker", type: "Pria/Wanita", age_range: "25-35", style: "Smart Casual", description: "Pekerja kantor yang rapi dan profesional.", gradient_from: "from-gray-800/40", gradient_to: "to-neutral-800/40", is_preset: true },
  { id: "p9", name: "Ibu PKK", type: "Wanita", age_range: "35-50", style: "Ramah", description: "Ibu komunitas yang hangat dan terpercaya.", gradient_from: "from-green-900/40", gradient_to: "to-lime-900/40", is_preset: true },
  { id: "p10", name: "Cowok Gym", type: "Pria", age_range: "22-30", style: "Athletic", description: "Pria atletis dan percaya diri. Cocok untuk suplemen, sportswear.", gradient_from: "from-red-900/40", gradient_to: "to-orange-900/40", is_preset: true },
];

const CharactersPage = () => {
  const [tab, setTab] = useState<"preset" | "custom">("preset");
  const [customChars, setCustomChars] = useState<CharacterData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<CharacterData | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchCustom = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("characters")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_preset", false)
      .order("created_at", { ascending: false });
    if (data) {
      setCustomChars(
        data.map((d) => ({
          id: d.id,
          name: d.name,
          type: d.type,
          age_range: d.age_range,
          style: d.style,
          description: d.description,
          gradient_from: d.gradient_from,
          gradient_to: d.gradient_to,
          is_preset: false,
          hero_image_url: d.hero_image_url ?? undefined,
          reference_images: d.reference_images ?? undefined,
          identity_prompt: d.identity_prompt ?? undefined,
          reference_photo_url: d.reference_photo_url ?? undefined,
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    if (tab === "custom") fetchCustom();
  }, [tab, user]);

  const handleUse = (c: CharacterData) => {
    navigate("/generate", { state: { character: c } });
  };

  const handleDelete = async (c: CharacterData) => {
    const { error } = await supabase.from("characters").delete().eq("id", c.id);
    if (error) {
      toast({ title: "Gagal menghapus", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Karakter dihapus" });
      fetchCustom();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-up">
        <h1 className="font-satoshi text-2xl font-bold text-foreground">Karakter</h1>
        <p className="mt-1 text-sm text-muted-foreground">Pilih atau buat karakter UGC untuk konten kamu.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-border animate-fade-up" style={{ animationDelay: "100ms" }}>
        {([["preset", "PRESET"], ["custom", "KARAKTER SAYA"]] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`pb-2.5 text-xs font-bold tracking-wider border-b-2 transition-colors ${
              tab === key
                ? "text-foreground border-primary"
                : "text-muted-foreground border-transparent hover:text-foreground/70"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "preset" && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 animate-fade-up" style={{ animationDelay: "200ms" }}>
          {PRESETS.map((p) => (
            <CharacterCard key={p.id} character={p} onDetail={setSelected} onUse={handleUse} />
          ))}
        </div>
      )}

      {tab === "custom" && (
        <div className="animate-fade-up" style={{ animationDelay: "200ms" }}>
          <button
            onClick={() => navigate("/characters/create")}
            className="mb-4 inline-flex items-center gap-2 bg-primary text-primary-foreground text-xs font-bold px-4 py-2.5 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            BUAT KARAKTER BARU
          </button>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : customChars.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border rounded-xl">
              <Images className="h-10 w-10 text-muted-foreground/20 mb-3" />
              <p className="text-sm text-muted-foreground mb-4">Belum ada karakter custom</p>
              <button
                onClick={() => navigate("/characters/create")}
                className="bg-primary text-primary-foreground text-xs font-bold px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                BUAT KARAKTER PERTAMA
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {customChars.map((c) => (
                <CharacterCard
                  key={c.id}
                  character={c}
                  onDetail={setSelected}
                  onUse={handleUse}
                  onDelete={handleDelete}
                  showDelete
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      <CharacterDetailModal
        character={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        onUse={(c) => {
          setSelected(null);
          handleUse(c);
        }}
        onDelete={(c) => {
          setSelected(null);
          handleDelete(c);
        }}
      />
    </div>
  );
};

export default CharactersPage;
