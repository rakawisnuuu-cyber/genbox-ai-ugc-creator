import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Images } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCustomCharacters } from "@/hooks/useCustomCharacters";
import CharacterCard, { type CharacterData } from "@/components/CharacterCard";
import CharacterDetailModal from "@/components/CharacterDetailModal";

import { PRESETS } from "@/lib/character-presets";

const CharactersPage = () => {
  const [tab, setTab] = useState<"preset" | "custom">("preset");
  const [selected, setSelected] = useState<CharacterData | null>(null);
  const { customChars, loading, refetch: fetchCustom } = useCustomCharacters();
  const { toast } = useToast();
  const navigate = useNavigate();

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
          <button
            onClick={() => navigate("/characters/create")}
            className="group/create flex flex-col items-center justify-center gap-3 aspect-[3/4] rounded-2xl border-2 border-dashed border-border/60 hover:border-primary/50 bg-card/40 hover:bg-card/80 transition-all cursor-pointer"
          >
            <div className="h-12 w-12 rounded-xl bg-primary/10 group-hover/create:bg-primary/20 flex items-center justify-center transition-colors">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xs font-bold text-muted-foreground group-hover/create:text-foreground transition-colors">BUAT KARAKTER BARU</span>
          </button>
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
