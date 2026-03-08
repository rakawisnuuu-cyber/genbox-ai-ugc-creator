import { useState } from "react";
import { UserCircle, Trash2, ChevronDown, ChevronUp } from "lucide-react";

export interface CharacterData {
  id: string;
  name: string;
  type: string;
  age_range: string;
  style: string;
  description: string;
  gradient_from: string;
  gradient_to: string;
  is_preset: boolean;
  hero_image_url?: string;
  reference_images?: string[];
  identity_prompt?: string;
  reference_photo_url?: string;
}

interface CharacterCardProps {
  character: CharacterData;
  onDetail: (character: CharacterData) => void;
  onUse: (character: CharacterData) => void;
  onDelete?: (character: CharacterData) => void;
  showDelete?: boolean;
}

const CharacterCard = ({ character, onDetail, onUse, onDelete, showDelete }: CharacterCardProps) => {
  const tags = [character.type, character.age_range, character.style].filter(Boolean).join(" · ");

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/80 card-hover">
      {/* Image area */}
      <div
        className="relative aspect-[3/4] cursor-pointer overflow-hidden"
        onClick={() => onDetail(character)}
      >
        {character.hero_image_url ? (
          <img src={character.hero_image_url} alt={character.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-b ${character.gradient_from} ${character.gradient_to} flex items-center justify-center`}>
            <UserCircle className="h-14 w-14 text-muted-foreground/20" />
          </div>
        )}

        {/* Badge */}
        <span
          className={`absolute top-2.5 right-2.5 text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-lg font-semibold backdrop-blur-sm ${
            character.is_preset
              ? "bg-muted/80 text-muted-foreground"
              : "bg-primary/15 text-primary"
          }`}
        >
          {character.is_preset ? "PRESET" : "CUSTOM"}
        </span>

        {/* Delete */}
        {showDelete && onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(character); }}
            className="absolute top-2.5 left-2.5 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive/15 hover:bg-destructive/30 text-destructive rounded-lg p-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
          <span className="text-foreground text-xs font-bold tracking-wider">Lihat Detail</span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3.5 flex flex-col gap-1.5 flex-1">
        <h3 className="text-sm font-semibold text-foreground">{character.name}</h3>
        <p className="text-[11px] text-muted-foreground">{tags}</p>
        <p className="text-[12px] text-muted-foreground/70 line-clamp-2 flex-1">{character.description}</p>
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => onUse(character)}
            className="flex-1 bg-primary text-primary-foreground text-[11px] font-bold py-2 rounded-lg hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-6px_hsl(var(--primary)/0.4)] transition-all"
          >
            Gunakan
          </button>
          <button
            onClick={() => onDetail(character)}
            className="flex-1 border border-border/60 text-muted-foreground text-[11px] font-bold py-2 rounded-lg hover:text-foreground hover:border-border transition-colors"
          >
            Detail
          </button>
        </div>
      </div>
    </div>
  );
};

export default CharacterCard;
