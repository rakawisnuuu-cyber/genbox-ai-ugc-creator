import { UserCircle } from "lucide-react";

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
  const tags = [character.type, character.age_range, character.style].filter(Boolean).join(" • ");

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-[#2A2A2A] bg-[#141414] transition-all hover:border-primary/30 hover:scale-[1.01]">
      {/* Image area */}
      <div
        className="relative aspect-[3/4] cursor-pointer"
        onClick={() => onDetail(character)}
      >
        {character.hero_image_url ? (
          <img src={character.hero_image_url} alt={character.name} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-b ${character.gradient_from} ${character.gradient_to} flex items-center justify-center`}>
            <UserCircle className="h-16 w-16 text-[#444]" />
          </div>
        )}

        {/* Badge */}
        <span
          className={`absolute top-3 right-3 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium ${
            character.is_preset
              ? "bg-[#2A2A2A]/80 text-[#888]"
              : "bg-primary/20 text-primary"
          }`}
        >
          {character.is_preset ? "PRESET" : "CUSTOM"}
        </span>

        {/* Delete button for custom */}
        {showDelete && onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(character);
            }}
            className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg p-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </button>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="text-white text-sm font-semibold tracking-wide">LIHAT DETAIL</span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="text-base font-semibold text-foreground">{character.name}</h3>
        <p className="text-[12px] text-[#888]">{tags}</p>
        <p className="text-[13px] text-[#666] line-clamp-2 flex-1">{character.description}</p>
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => onUse(character)}
            className="flex-1 bg-primary text-primary-foreground text-xs font-bold py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            GUNAKAN
          </button>
          <button
            onClick={() => onDetail(character)}
            className="flex-1 border border-[#2A2A2A] text-[#888] text-xs font-bold py-2 rounded-lg hover:text-white hover:border-[#444] transition-colors"
          >
            DETAIL
          </button>
        </div>
      </div>
    </div>
  );
};

export default CharacterCard;
