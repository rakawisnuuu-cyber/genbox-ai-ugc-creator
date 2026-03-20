import React from "react";
import { Camera, UserCircle, Loader2, X, Link as LinkIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { PRESETS } from "@/lib/character-presets";
import type { CharacterData } from "@/components/CharacterCard";

interface CharacterSelectStepProps {
  selectedCharId: string;
  selectedChar: CharacterData | null;
  customChars: CharacterData[];
  ownPhotoPreview: string | null;
  ownPhotoUploading: boolean;
  ownPhotoAnalyzing: boolean;
  onCharSelect: (id: string) => void;
  handleOwnPhotoSelect: (file: File) => void;
  removeOwnPhoto: () => void;
  navigate: (path: string) => void;
}

const CharacterSelectStep: React.FC<CharacterSelectStepProps> = ({
  selectedCharId,
  selectedChar,
  customChars,
  ownPhotoPreview,
  ownPhotoUploading,
  ownPhotoAnalyzing,
  onCharSelect,
  handleOwnPhotoSelect,
  removeOwnPhoto,
  navigate,
}) => {
  return (
    <>
      {/* Horizontal avatar strip */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-2 scrollbar-none">
        {/* "Pakai Foto Sendiri" as first item */}
        <button
          onClick={() => {
            const inp = document.createElement("input");
            inp.type = "file";
            inp.accept = "image/jpeg,image/png,image/webp";
            inp.onchange = (e) => {
              const f = (e.target as HTMLInputElement).files?.[0];
              if (f) handleOwnPhotoSelect(f);
            };
            inp.click();
          }}
          className={`shrink-0 h-11 w-11 rounded-full border-2 border-dashed flex items-center justify-center transition-all ${
            selectedCharId === "__own_photo__"
              ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-background"
              : "border-white/[0.1] hover:border-primary/30"
          }`}
          title="Pakai Foto Sendiri"
        >
          {ownPhotoPreview ? (
            <img src={ownPhotoPreview} alt="Foto saya" className="h-full w-full rounded-full object-cover" />
          ) : (
            <Camera className="h-4 w-4 text-muted-foreground/40" />
          )}
        </button>

        {/* Preset + custom characters as avatar circles */}
        {[...PRESETS, ...customChars].map((c) => (
          <button
            key={c.id}
            onClick={() => onCharSelect(c.id)}
            className={`shrink-0 h-11 w-11 rounded-full overflow-hidden transition-all ${
              selectedCharId === c.id
                ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                : "hover:ring-1 hover:ring-white/20"
            }`}
            title={c.name}
          >
            {c.hero_image_url ? (
              <img src={c.hero_image_url} alt={c.name} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-secondary flex items-center justify-center">
                <UserCircle className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Own photo analyzing state */}
      {ownPhotoPreview && (ownPhotoUploading || ownPhotoAnalyzing) && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          <span>{ownPhotoUploading ? "Mengupload foto..." : "AI sedang menganalisis..."}</span>
        </div>
      )}

      {/* Selected character info card */}
      {selectedChar && (
        <div className="flex items-center gap-3 border border-white/[0.06] rounded-xl bg-white/[0.02] p-3 mb-2">
          {selectedChar.hero_image_url ? (
            <img
              src={selectedChar.hero_image_url}
              alt={selectedChar.name}
              className="h-9 w-9 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center shrink-0">
              <UserCircle className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">{selectedChar.name}</p>
            <p className="text-[10px] text-muted-foreground truncate">
              {[selectedChar.type, selectedChar.age_range, selectedChar.style].filter(Boolean).join(" • ")}
            </p>
          </div>
          {selectedCharId === "__own_photo__" && (
            <button onClick={removeOwnPhoto} className="p-1 rounded-md hover:bg-secondary transition-colors">
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
      )}

      {/* Browse all fallback */}
      <div className="flex items-center gap-3">
        <Select value={selectedCharId === "__own_photo__" ? "" : selectedCharId} onValueChange={onCharSelect}>
          <SelectTrigger className="bg-white/[0.03] border-white/[0.06] text-xs h-8">
            <SelectValue placeholder="Browse all characters..." />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Preset</SelectLabel>
              {PRESETS.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  <span className="flex items-center gap-2">
                    {c.hero_image_url ? (
                      <img
                        src={c.hero_image_url}
                        alt={c.name}
                        className="h-5 w-5 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <UserCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    {c.name}
                  </span>
                </SelectItem>
              ))}
            </SelectGroup>
            {customChars.length > 0 && (
              <SelectGroup>
                <SelectLabel>Karakter Saya</SelectLabel>
                {customChars.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="flex items-center gap-2">
                      {c.hero_image_url ? (
                        <img
                          src={c.hero_image_url}
                          alt={c.name}
                          className="h-6 w-6 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <UserCircle className="h-4 w-4 text-primary shrink-0" />
                      )}
                      {c.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectGroup>
            )}
          </SelectContent>
        </Select>
        <button
          onClick={() => navigate("/characters/create")}
          className="text-[10px] text-primary hover:underline inline-flex items-center gap-1 shrink-0"
        >
          Buat baru <LinkIcon className="h-3 w-3" />
        </button>
      </div>
    </>
  );
};

export default CharacterSelectStep;
